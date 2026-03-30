# FRD: Observability

**Feature ID**: `observability`
**PRD Reference**: §4.9 Observability
**Status**: Draft

## 1. Overview

The Observability feature provides structured logging, distributed tracing, and metrics collection for the AI Marketing Campaign Assistant's agent pipeline. It enables operators and developers to understand workflow behavior, diagnose failures, measure performance, and track key business indicators (rejection rates, localization coverage). All observability data is produced by the backend; the frontend does not generate traces or metrics.

## 2. User Stories

This FRD does not map to end-user stories directly (the campaign creator does not interact with observability features). It supports the following PRD success criterion:

- **Success Criterion 7**: "Observability is actionable. Traces, logs, and metrics provide clear visibility into agent performance, rejection rates, and workflow timing."

It also indirectly supports:
- **US-20**: Automatic retry of failed AI calls — retries must be logged and traced.
- **US-21**: Error message and retry button on failure — failures must be logged with context.

## 3. Functional Requirements

### FR-1: Structured Logging for All Agent Actions

- **Description**: Every agent action and workflow transition produces a structured log entry. No unstructured `console.log` output in production.
- **Input**: Any agent invocation, workflow state change, AI service call, or error event.
- **Output**: A structured log entry written to the configured log output (stdout in JSON format for container environments).
- **Behavior**:
  1. All log entries are in JSON format with the following base fields:
     - `timestamp` (ISO 8601 string)
     - `level` (`debug` | `info` | `warn` | `error`)
     - `message` (human-readable description)
     - `service` (service name, e.g., `campaign-api`)
     - `traceId` (distributed trace ID, if available)
     - `spanId` (current span ID, if available)
     - `campaignId` (campaign identifier, if in campaign context)
  2. Agent-specific log entries include additional fields:
     - `agentName` (`planner` | `creative-generator` | `copy-reviewer` | `localizer`)
     - `action` (`start` | `complete` | `error` | `retry`)
     - `durationMs` (execution duration in milliseconds, on `complete`)
  3. Workflow transition logs include:
     - `fromStatus` (previous workflow status)
     - `toStatus` (new workflow status)
     - `trigger` (what caused the transition, e.g., `agent-complete`, `user-approval`, `user-rejection`)
  4. AI service call logs include:
     - `aiService` (e.g., `openai-chat`, `openai-dalle`)
     - `model` (model identifier)
     - `attempt` (attempt number, 1-based, for retry tracking)
     - `durationMs` (call duration)
     - `success` (boolean)
     - `errorType` (on failure: `timeout`, `rate-limit`, `server-error`, `unknown`)
  5. Log levels follow these conventions:
     - `info`: Agent start/complete, workflow transitions, successful AI calls.
     - `warn`: AI call retries (non-final), review verdict "flag", validation warnings.
     - `error`: AI call final failure (all retries exhausted), database errors, unhandled exceptions.
     - `debug`: Detailed agent input/output (only in development mode — not in production).
  6. No `console.log`, `console.warn`, or `console.error` in production code. All logging goes through the structured logger (e.g., `pino`).
- **Error handling**: If the logging system itself fails (e.g., log transport error), the error is written to stderr and the application continues (logging failure must not crash the application).
- **Acceptance criteria**:
  - Given any agent starts, when the agent begins execution, then a structured JSON log entry with level `info`, `agentName`, and `action: start` is produced.
  - Given any agent completes, when the agent finishes, then a structured JSON log entry with `action: complete` and `durationMs` is produced.
  - Given an AI service call fails and retries, when each retry occurs, then a `warn`-level log with `attempt` number is produced.
  - Given all retries fail, when the final failure occurs, then an `error`-level log with `errorType` is produced.
  - No `console.log` statements exist in production source code.

### FR-2: Distributed Tracing — Full Campaign Lifecycle

- **Description**: A single distributed trace spans the entire campaign lifecycle, from brief submission to workflow completion. Each agent invocation and AI service call is represented as a child span within this trace.
- **Input**: Campaign workflow execution events.
- **Output**: Trace spans exported to the configured tracing backend (e.g., OpenTelemetry collector, Azure Monitor, Aspire dashboard).
- **Behavior**:
  1. A **root span** is created when the campaign workflow begins (user submits a brief). The root span is named `campaign.workflow` and includes attributes:
     - `campaign.id` (campaign identifier)
     - `campaign.brief.length` (character count of the brief)
  2. Each agent invocation creates a **child span** under the root span:
     - Span name: `agent.{agentName}` (e.g., `agent.planner`, `agent.creative-generator`)
     - Attributes: `agent.name`, `agent.iteration` (for creative generator, the iteration number)
  3. Each AI/LLM service call creates a **child span** under its parent agent span:
     - Span name: `ai.{service}.{operation}` (e.g., `ai.openai.chat-completion`, `ai.openai.image-generation`)
     - Attributes: `ai.model`, `ai.attempt` (retry number), `ai.token_count` (for LLM calls, if available)
  4. The root span ends when the workflow reaches `complete` status (or when the campaign is abandoned/archived).
  5. On rejection loops, the Creative Generator's child span is a new span (not a continuation of the previous one). Each iteration gets its own span: `agent.creative-generator` with `agent.iteration: 2`, etc.
  6. Trace context is propagated between agents via the workflow engine. All spans within a campaign share the same `traceId`.
  7. The tracing implementation uses **OpenTelemetry** (OTel) SDK for Node.js, exporting spans via OTLP.
- **Error handling**: If span creation or export fails, the operation continues without tracing (tracing failure must not affect the workflow). A warning is logged.
- **Acceptance criteria**:
  - Given a campaign completes end-to-end, when the trace is viewed, then a single root span contains child spans for each agent invocation.
  - Given the Creative Generator runs, when its trace is viewed, then it contains child spans for AI image generation and AI text generation calls.
  - Given a rejection loop occurs, when the trace is viewed, then separate child spans exist for each creative iteration (e.g., iteration 1 and iteration 2).
  - All spans within a campaign share the same `traceId`.

### FR-3: Localizer Parent Span with Child Spans Per Market

- **Description**: The Localizer agent produces a parent span with individual child spans for each market translation, reflecting the parallel execution of market translations.
- **Input**: Localizer agent execution with selected markets.
- **Output**: A parent span for the Localizer with child spans per market.
- **Behavior**:
  1. The Localizer agent creates a parent span: `agent.localizer` with attribute `localizer.market_count` (number of selected markets).
  2. For each selected market, a child span is created: `agent.localizer.market.{marketCode}` (e.g., `agent.localizer.market.spain`).
  3. Market child spans may overlap in time (parallel execution).
  4. Each market child span includes attributes:
     - `localizer.market` (market code: `spain`, `france`, `germany`, `brazil`, `japan`)
     - `localizer.language` (target language name)
  5. AI service calls within each market translation create their own child spans under the market span (e.g., `ai.openai.chat-completion` for the translation LLM call).
  6. If localization is skipped, the Localizer parent span still exists but has `localizer.market_count: 0` and no market child spans. The span ends immediately.
- **Error handling**: If a single market translation fails, its span is marked with an error status, but other market spans continue. The parent span is marked as error only if all markets fail.
- **Acceptance criteria**:
  - Given 3 markets are selected, when the Localizer trace is viewed, then the parent `agent.localizer` span contains 3 child spans (one per market).
  - Given markets run in parallel, when the trace is viewed, then market child spans may have overlapping start/end times.
  - Given localization is skipped, when the trace is viewed, then the `agent.localizer` span has `market_count: 0` and no child spans.

### FR-4: Metrics — Agent Execution Duration

- **Description**: The duration of each agent's execution is recorded as a metric, enabling performance monitoring and alerting.
- **Input**: Agent start and completion events.
- **Output**: A histogram metric recording the duration in milliseconds.
- **Behavior**:
  1. Metric name: `agent.duration_ms`
  2. Metric type: Histogram
  3. Labels/attributes:
     - `agent.name` (`planner`, `creative-generator`, `copy-reviewer`, `localizer`)
     - `agent.status` (`success`, `error`)
  4. Duration is measured from agent start to agent completion (or error).
  5. For the Creative Generator, each iteration (including rejections) records a separate duration measurement.
  6. The metric is recorded at the completion of each agent invocation.
- **Error handling**: If metrics recording fails, the agent execution continues unaffected. A warning is logged.
- **Acceptance criteria**:
  - Given the Planner agent completes in 2500ms, when metrics are queried, then `agent.duration_ms{agent.name=planner, agent.status=success}` includes a 2500ms observation.
  - Given the Creative Generator fails, when metrics are queried, then `agent.duration_ms{agent.name=creative-generator, agent.status=error}` includes the duration observation.

### FR-5: Metrics — Rejection Count Per Campaign

- **Description**: The number of times creative assets are rejected per campaign is recorded as a metric.
- **Input**: Rejection events at the Human Approval Gate.
- **Output**: A counter metric incremented on each rejection.
- **Behavior**:
  1. Metric name: `campaign.rejection_count`
  2. Metric type: Counter
  3. Labels/attributes:
     - `campaign.id` (campaign identifier)
     - `rejection.scope` (`regenerate-all`, `keep-image-redo-text`)
  4. The counter is incremented by 1 each time the user rejects at the approval gate.
  5. For a campaign with zero rejections, the counter is not incremented (no zero-value reporting needed).
  6. The metric is also available as a gauge on the campaign record itself (`approvalHistory.length` where `decision === 'rejected'`), but the OTel counter provides real-time observability.
- **Error handling**: If metrics recording fails, the rejection flow continues unaffected.
- **Acceptance criteria**:
  - Given a campaign has 3 rejections, when metrics are queried, then `campaign.rejection_count` for that campaign ID equals 3.
  - Given a campaign completes with zero rejections, when metrics are queried, then no rejection counter entries exist for that campaign.

### FR-6: Metrics — Market Count Per Campaign

- **Description**: The number of markets selected for localization is recorded as a metric per campaign.
- **Input**: Market selection event (user selects markets for localization).
- **Output**: A gauge metric recording the number of selected markets.
- **Behavior**:
  1. Metric name: `campaign.market_count`
  2. Metric type: Gauge (set once per campaign at localization time)
  3. Labels/attributes:
     - `campaign.id` (campaign identifier)
  4. The gauge is set to the number of selected markets (0–5).
  5. A value of 0 indicates localization was skipped.
  6. The metric is recorded when the user makes their market selection (before localization begins).
- **Error handling**: If metrics recording fails, the localization flow continues unaffected.
- **Acceptance criteria**:
  - Given the user selects Spain, France, and Japan, when metrics are queried, then `campaign.market_count` for that campaign is 3.
  - Given the user skips localization, when metrics are queried, then `campaign.market_count` for that campaign is 0.

### FR-7: Trace Context Propagation Between Agents

- **Description**: Trace context (trace ID, parent span ID) is propagated between agent invocations so all spans in a campaign are correlated under one trace.
- **Input**: Agent handoff events in the workflow engine.
- **Output**: Continuous trace context across all agents within a campaign.
- **Behavior**:
  1. The workflow engine (LangGraph) maintains the trace context as part of the campaign execution state.
  2. When one agent completes and the next agent starts, the trace context is passed forward so the new agent's span is a child of the root campaign span.
  3. On rejection loops, the trace context is preserved — the new Creative Generator span is still under the same root campaign span.
  4. If the workflow is resumed after a page refresh (see data-persistence FRD), a **new root span** is created for the resumed portion. The two root spans share the same `campaign.id` attribute but have different `traceId` values (trace continuity is broken by the refresh).
  5. Propagation mechanism: OpenTelemetry context is stored in the LangGraph state and restored when each agent node executes.
- **Error handling**: If trace context is lost or corrupted, a new trace is started from the current agent. A warning is logged indicating trace discontinuity.
- **Acceptance criteria**:
  - Given a campaign flows through Planner → Creative Generator → Copy Reviewer → Localizer, when the trace is viewed, then all agent spans share the same `traceId`.
  - Given a rejection occurs, when the trace is viewed, then the new Creative Generator span is under the same root trace.
  - Given the user refreshes mid-campaign, when the campaign resumes, then a new trace is started (traces are not stitched across refreshes).

### FR-8: Log Format and Structure Requirements

- **Description**: Defines the exact log format, output destination, and configuration for structured logging.
- **Input**: Application configuration.
- **Output**: Properly formatted log output.
- **Behavior**:
  1. Log format: **JSON**, one log entry per line (newline-delimited JSON / NDJSON).
  2. Log output: **stdout** (standard for container environments; collected by the container runtime / Azure Monitor).
  3. Logger library: **pino** (per project conventions).
  4. Log configuration:
     - Production: `level: "info"` (debug logs suppressed).
     - Development: `level: "debug"` (verbose output for local debugging).
     - Log level is configurable via `LOG_LEVEL` environment variable.
  5. Request-scoped fields (`traceId`, `spanId`, `campaignId`) are automatically injected into all log entries within a request context using pino child loggers or AsyncLocalStorage.
  6. Sensitive data is **never** logged: no API keys, no full user input text (only character count), no image binary data.
  7. Log entry size limit: Individual log entries should not exceed 16 KB. Large payloads (e.g., full plan JSON) are logged at `debug` level only.
- **Error handling**: If log serialization fails for a particular entry (e.g., circular reference), a fallback plain-text entry is written to stderr.
- **Acceptance criteria**:
  - Given the application is running in production, when a log entry is produced, then it is a single-line JSON object written to stdout.
  - Given `LOG_LEVEL=warn` is set, when an `info`-level event occurs, then it is not logged.
  - Given a campaign is active, when any log entry is produced within that campaign's context, then it includes `campaignId` and `traceId` fields.
  - No log entry contains API keys, secrets, or full user brief text.

### FR-9: Metrics Exposure Endpoint

- **Description**: Defines where and how metrics are exposed for collection.
- **Input**: Metrics scrape request.
- **Output**: Metrics in a standard format.
- **Behavior**:
  1. Metrics are exported via **OpenTelemetry** (OTel) SDK, using the OTLP exporter protocol.
  2. The primary export target is the **OpenTelemetry Collector** configured in the Aspire app host (for local development) or **Azure Monitor** (for production deployment).
  3. Additionally, a **Prometheus-compatible `/metrics` endpoint** is exposed on the API server for direct scraping if needed.
     - Path: `GET /metrics`
     - Response: Prometheus text exposition format (`text/plain; version=0.0.4; charset=utf-8`)
  4. All three metric types are exposed: histograms (`agent.duration_ms`), counters (`campaign.rejection_count`), and gauges (`campaign.market_count`).
  5. Metrics endpoint does not require authentication (it is an internal/operational endpoint, not exposed to end users).
  6. The metrics endpoint is configured via the `METRICS_ENABLED` environment variable (`true` by default). When disabled, the `/metrics` endpoint returns `404`.
- **Error handling**: If the OTel exporter cannot connect to the collector, metrics are buffered in memory (up to a configured limit) and retried. If the buffer overflows, the oldest metrics are dropped. A warning is logged.
- **Acceptance criteria**:
  - Given the API server is running, when `GET /metrics` is called, then Prometheus-formatted metrics are returned.
  - Given `METRICS_ENABLED=false`, when `GET /metrics` is called, then a `404` is returned.
  - Given metrics are being produced, when the OTel collector is available, then metrics are exported via OTLP.

## 4. Data Model

Observability does not persist business data, but it does define the structure of telemetry artifacts.

```typescript
/** Base structured log entry */
interface LogEntry {
  timestamp: string; // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  traceId?: string;
  spanId?: string;
  campaignId?: string;
}

/** Agent action log entry */
interface AgentLogEntry extends LogEntry {
  agentName: 'planner' | 'creative-generator' | 'copy-reviewer' | 'localizer';
  action: 'start' | 'complete' | 'error' | 'retry';
  durationMs?: number; // present on 'complete' and 'error'
  iteration?: number; // present for creative-generator
}

/** Workflow transition log entry */
interface WorkflowTransitionLogEntry extends LogEntry {
  fromStatus: string;
  toStatus: string;
  trigger: 'agent-complete' | 'user-approval' | 'user-rejection' | 'user-skip' | 'error';
}

/** AI service call log entry */
interface AiCallLogEntry extends LogEntry {
  aiService: string; // e.g., 'openai-chat', 'openai-dalle'
  model: string;
  attempt: number;
  durationMs: number;
  success: boolean;
  errorType?: 'timeout' | 'rate-limit' | 'server-error' | 'unknown';
}

/** Trace span attributes for the root campaign span */
interface CampaignTraceAttributes {
  'campaign.id': string;
  'campaign.brief.length': number;
}

/** Trace span attributes for an agent span */
interface AgentSpanAttributes {
  'agent.name': string;
  'agent.iteration'?: number;
}

/** Trace span attributes for an AI service call span */
interface AiCallSpanAttributes {
  'ai.model': string;
  'ai.attempt': number;
  'ai.token_count'?: number;
}

/** Trace span attributes for a localizer market span */
interface LocalizerMarketSpanAttributes {
  'localizer.market': string;
  'localizer.language': string;
}

/** Metrics definitions (for documentation — actual implementation uses OTel SDK) */
interface MetricsDefinitions {
  /** Histogram: agent execution duration in milliseconds */
  'agent.duration_ms': {
    type: 'histogram';
    unit: 'ms';
    labels: { 'agent.name': string; 'agent.status': 'success' | 'error' };
  };
  /** Counter: rejection count per campaign */
  'campaign.rejection_count': {
    type: 'counter';
    labels: { 'campaign.id': string; 'rejection.scope': string };
  };
  /** Gauge: market count per campaign */
  'campaign.market_count': {
    type: 'gauge';
    labels: { 'campaign.id': string };
  };
}
```

## 5. API Contracts

### GET `/metrics`

Prometheus-compatible metrics endpoint.

- **Method**: `GET`
- **Path**: `/metrics`
- **Response 200** (when `METRICS_ENABLED=true`):
  ```
  Content-Type: text/plain; version=0.0.4; charset=utf-8

  # HELP agent_duration_ms Duration of agent execution in milliseconds
  # TYPE agent_duration_ms histogram
  agent_duration_ms_bucket{agent_name="planner",agent_status="success",le="500"} 2
  agent_duration_ms_bucket{agent_name="planner",agent_status="success",le="1000"} 5
  ...

  # HELP campaign_rejection_count Number of creative rejections per campaign
  # TYPE campaign_rejection_count counter
  campaign_rejection_count{campaign_id="abc-123",rejection_scope="regenerate-all"} 2

  # HELP campaign_market_count Number of markets selected for localization
  # TYPE campaign_market_count gauge
  campaign_market_count{campaign_id="abc-123"} 3
  ```
- **Response 404** (when `METRICS_ENABLED=false`): `{ "error": "Metrics endpoint is disabled" }`

### Health Check (Traces/Metrics)

No dedicated health endpoint for observability — traces and metrics health is validated through the Aspire dashboard (`aspire describe`) and Azure Monitor in production.

## 6. UI/UX Requirements

Observability is a backend-only feature. There are no direct UI/UX requirements for end users. However:

- **Frontend observability note**: Frontend observability is limited to browser console structured logging for development debugging. Production frontend observability (error tracking, performance monitoring) is a non-goal for this demo. All production-grade observability (traces, metrics, structured logs) is backend-only.
- **Aspire Dashboard** (development): Developers use the Aspire dashboard to view traces, logs, and metrics in real time during local development. No custom UI is needed.
- **Azure Monitor / Application Insights** (production): In production, traces and metrics flow to Azure Monitor. Dashboards and alerts are configured in the Azure portal. This is an operational concern, not an application UI concern.
- **No observability data is exposed to the campaign creator** — the `/metrics` endpoint is operational and not linked from the frontend.

## 7. Dependencies

| Dependency | Direction | Description |
|------------|-----------|-------------|
| `campaign-planning` | Instrumented | Planner agent is instrumented with logging, tracing, and duration metrics. |
| `creative-generation` | Instrumented | Creative Generator is instrumented; iteration number tracked in spans. |
| `copy-review` | Instrumented | Copy Reviewer is instrumented; review verdict logged. |
| `human-approval` | Instrumented | Approval/rejection events logged and rejection count metric incremented. |
| `localization` | Instrumented | Localizer instrumented with parent/child spans per market; market count metric recorded. |
| `data-persistence` | Instrumented | Database operations logged; errors logged at `error` level. |
| OpenTelemetry SDK (`@opentelemetry/sdk-node`) | Library | Core tracing and metrics SDK. |
| OpenTelemetry OTLP Exporter | Library | Exports traces/metrics to OTel collector. |
| Pino | Library | Structured JSON logging. |
| Aspire (local dev) | Infrastructure | OTel collector and dashboard for local development. |
| Azure Monitor (production) | Infrastructure | Trace and metrics sink for production deployment. |

## 8. Acceptance Criteria Summary

1. All agent invocations produce structured JSON log entries (not unstructured console output) with `agentName`, `action`, and `durationMs` fields.
2. All workflow transitions produce structured log entries with `fromStatus`, `toStatus`, and `trigger` fields.
3. All AI service calls produce structured log entries with `aiService`, `model`, `attempt`, `durationMs`, `success`, and `errorType` (on failure) fields.
4. A distributed trace spans the full campaign lifecycle: a root `campaign.workflow` span with child spans per agent and per AI call.
5. The Localizer agent's trace has a parent span with child spans per market translation.
6. On rejection loops, separate child spans exist for each creative iteration under the same root trace.
7. Trace context is propagated between agents — all spans in a campaign share the same `traceId`.
8. `agent.duration_ms` histogram metric is recorded for every agent invocation, labeled by agent name and status.
9. `campaign.rejection_count` counter metric is incremented on each rejection, labeled by campaign ID and rejection scope.
10. `campaign.market_count` gauge metric is set per campaign with the number of selected markets (0 if skipped).
11. A Prometheus-compatible `/metrics` endpoint exposes all metrics when `METRICS_ENABLED=true`.
12. Logs are JSON-formatted, written to stdout, using pino, with log level configurable via `LOG_LEVEL` environment variable.
13. Sensitive data (API keys, secrets, full brief text) is never logged.
14. Observability failures (logging, tracing, metrics) never crash or halt the application workflow.
