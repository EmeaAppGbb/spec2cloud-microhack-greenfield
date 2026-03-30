# ADR-001: Use Azure OpenAI Service instead of Direct OpenAI API

## Status

Accepted

## Context

The application requires LLM text generation (gpt-5.4-mini) and AI image generation
(gpt-image-1.5) for five of seven increments. The original `specs/tech-stack.md` specified
direct OpenAI API with `OPENAI_API_KEY`, but the deployment target is Azure Container Apps
via Aspire + AZD.

During Phase 1d (tech-stack-resolution), the infrastructure implications of this choice
were not fully resolved — Steps 6-7 of the skill (infra contract creation + completeness
validation) were skipped. This ADR retroactively documents the decision that was implicitly
made when `infra/main.bicep` was updated to provision Azure AI Services.

### Key factors

- **Authentication**: Azure AI Services with `disableLocalAuth: true` uses managed identity
  (RBAC) — no API key rotation, no secret management, no key leakage risk.
- **Monitoring**: Integrated with Application Insights via AI Foundry project connection —
  LLM call metrics flow into the same observability pipeline as HTTP traces.
- **Billing**: Single Azure subscription bill — no separate OpenAI billing account.
- **Compliance**: Regional data residency (eastus2), enterprise-grade SLAs.
- **IaC**: Fully provisioned via Bicep (`infra/core/ai/ai-project.bicep`) — reproducible,
  version-controlled, deployable via `azd provision`.

## Decision

Use Azure AI Services (`Microsoft.CognitiveServices/accounts`, kind: `AIServices`, SKU: S0)
provisioned via Bicep, with managed identity authentication. The `openai` npm package's
`AzureOpenAI` class provides API compatibility with the same SDK used for direct OpenAI.

### Model deployments

| Deployment Name | Model | SKU | Capacity | Used By |
|----------------|-------|-----|----------|---------|
| gpt-5-4-mini | gpt-5.4-mini | GlobalStandard | 10 | Planner, Creative Gen (text), Copy Reviewer, Localizer |
| gpt-image-1-5 | gpt-image-1.5 | GlobalStandard | 1 | Creative Gen (images) |

### Authentication flow

```
Container App (API) → User-Assigned Managed Identity → RBAC → Azure AI Services
                      (AZURE_CLIENT_ID)                        (AZURE_OPENAI_ENDPOINT)
```

No API keys are used. The managed identity has:
- `Azure AI Developer` role at resource group scope
- `Cognitive Services User` role at resource group scope

## Consequences

### Positive

- Unified Azure billing — no separate OpenAI account management
- Managed identity authentication — no API key rotation or secret storage
- Infrastructure-as-code — fully reproducible via `azd provision`
- Integrated monitoring — AI call metrics in Application Insights
- Same `openai` npm package — minimal code difference (`AzureOpenAI` vs `OpenAI` class)

### Negative

- Model availability varies by region (verified: eastus2 has both gpt-5.4-mini and gpt-image-1.5)
- Slightly more complex local dev setup (need `AZURE_OPENAI_ENDPOINT` + Azure login for identity)
- AI Foundry project adds a management layer that's overkill for a demo app
- `disableLocalAuth: true` means local development requires `az login` — no API key fallback

## Alternatives Considered

1. **Direct OpenAI API** — Simpler setup, single `OPENAI_API_KEY`, but requires separate
   secret management, no Azure monitoring integration, separate billing.
2. **Azure AI Foundry (full)** — Includes prompt flow, evaluation, safety filters — too
   heavyweight for a demo app with 4 agents.
3. **LiteLLM proxy** — Unified interface across providers — unnecessary indirection when
   committed to a single provider.
