# Tech Stack — TaskBoard

> Resolved technology decisions for the TaskBoard application.
> All versions sourced from installed `package.json` files and infrastructure config.

## 1. Overview

TaskBoard is a full-stack task management application built with **Next.js 16** (App Router) on the frontend and **Express.js 5** (TypeScript) on the backend. Authentication uses **JWT tokens stored in HTTP-only cookies**. Data is stored **in-memory** (JavaScript Maps) — no database. The application is orchestrated locally with **.NET Aspire** and deployed to **Azure Container Apps** via the Azure Developer CLI (`azd`). Infrastructure is defined in **Bicep** using Azure Verified Modules.

---

## 2. Frontend Stack

| Decision | Value |
|----------|-------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript ^5 |
| UI Library | React 19.2.3 |
| Styling | Tailwind CSS ^4 (via `@tailwindcss/postcss`) |
| Markdown | react-markdown ^10.1.0 |
| Linting | ESLint ^9 + eslint-config-next 16.1.6 |
| Dev server | `next dev` (port 3000) |
| Build | `next build` (standalone output) |

**Patterns:**
- **App Router** — all pages use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` conventions. No `pages/` directory.
- **Server Components by default** — only add `'use client'` when the component needs hooks, event handlers, or browser APIs.
- **Tailwind CSS utility classes** for all styling — no custom CSS files or CSS-in-JS.
- **`next/image`** for all images; **`next/link`** for internal navigation.

---

## 3. Backend Stack

| Decision | Value |
|----------|-------|
| Framework | Express.js ^5.1.0 |
| Language | TypeScript ^5.8 |
| Runtime | Node.js (^22.15 types) |
| Dev server | tsx ^4.19.0 (watch mode: `tsx watch src/index.ts`) |
| Build | `tsc` → `dist/` (CommonJS output) |
| Entry point | `dist/index.js` (production), `src/index.ts` (dev) |
| Linting | ESLint ^9.25 |

**Patterns:**
- **Modular routes** — route files in `src/routes/`, registered on the Express app. No monolithic route file.
- **Middleware chain** — helmet → cors → cookie-parser → pino-http → routes → error handler.
- **Async/await** for all I/O-bound operations with try/catch error handling.
- **Strict TypeScript** — `strict: true`, no `any` types, explicit null checks.
- **Consistent error shape** — `res.json()` for success, `res.status(4xx).json({ error })` for errors.
- **Constructor injection / factory functions** for testability.

---

## 4. Authentication

| Decision | Value |
|----------|-------|
| Password hashing | bcryptjs ^3.0.3 |
| Token format | JWT (jsonwebtoken ^9.0.3) |
| Algorithm | HS256 |
| Token expiry | 24 hours |
| Cookie parsing | cookie-parser ^1.4.7 |
| Token delivery | HTTP-only cookie (`token`) |

**Configuration:**
- `JWT_SECRET` — signing secret (env var, injected by Aspire locally and Bicep in production).
- Cookie flags: `HttpOnly: true`, `Secure: NODE_ENV === 'production'`, `SameSite: Strict`.
- No server-side sessions — the JWT is self-contained.

---

## 5. Security

| Decision | Value |
|----------|-------|
| CORS | cors ^2.8.5 — configured per frd-auth §5a, allows frontend origin |
| HTTP headers | helmet ^8.1.0 — sensible security defaults |
| Cookie | HttpOnly, Secure (conditional on `NODE_ENV`), SameSite=Strict |
| Input validation | At route level before passing to services |

---

## 6. Data Storage

| Decision | Value |
|----------|-------|
| Users store | JavaScript `Map<string, User>` (in-memory) |
| Tasks store | JavaScript `Map<string, Task>` (in-memory) |
| Persistence | None — data resets on restart |
| Database | None (MVP simplicity) |

**Rationale:** In-memory storage is intentional for the MVP phase. It avoids database provisioning complexity, keeps the focus on application logic, and simplifies testing. A database can be introduced in a future increment without changing the service interface.

---

## 7. Logging

| Decision | Value |
|----------|-------|
| Logger | pino ^9.7.0 |
| HTTP logging | pino-http ^10.4.0 |
| Format | Structured JSON |

**Convention:** No `console.log` in production code. All logging through the pino logger instance.

---

## 8. Testing Stack

| Layer | Tool | Version | Purpose |
|-------|------|---------|---------|
| Unit / Integration (API) | Vitest | ^3.1.0 | Fast unit tests, API route tests with Supertest |
| HTTP testing | Supertest | ^7.1.0 | HTTP-level assertions against Express app |
| BDD / Gherkin | @cucumber/cucumber | ^12.6.0 | Behavior-driven tests from feature files |
| Gherkin parser | @cucumber/gherkin | ^29.0.0 | Feature file parsing |
| Gherkin messages | @cucumber/messages | ^26.0.0 | Cucumber message protocol |
| E2E | @playwright/test | ^1.58.2 | Browser-based end-to-end tests |
| Linting (API) | ESLint | ^9.25 | Code quality |
| Linting (Web) | ESLint | ^9 + eslint-config-next | Code quality + Next.js rules |

**Test commands:**

| Command | Scope |
|---------|-------|
| `cd src/api && npm test` | API unit + integration tests (Vitest) |
| `npx cucumber-js` | Gherkin BDD tests (against Aspire) |
| `npx playwright test --config=e2e/playwright.config.ts` | E2E tests (against Aspire) |
| `npm run test:all` | All of the above in sequence |

---

## 9. Orchestration

| Decision | Value |
|----------|-------|
| Orchestrator | .NET Aspire SDK 13.2.0 |
| Hosting packages | Aspire.Hosting.JavaScript 13.2.0, Aspire.Hosting.Python 13.2.0 |

**Aspire resource configuration (`apphost.cs`):**

| Resource | Type | Port | Health Check | Notes |
|----------|------|------|-------------|-------|
| `api` | JavaScriptApp (`./src/api`) | 5001 | `/health` (HTTP) | `JWT_SECRET` injected as env var |
| `web` | JavaScriptApp (`./src/web`) | (auto) | — | References `api`, waits for API health |
| `docs` | PythonExecutable (mkdocs) | 8000 | — | MkDocs documentation server |

**Usage:**
- `aspire start` — start all services (background, non-blocking).
- `aspire wait api --status healthy` — block until API is ready.
- `aspire describe` — inspect resource status and endpoints.
- `aspire stop` — clean shutdown.

---

## 10. Deployment

| Decision | Value |
|----------|-------|
| Platform | Azure Container Apps |
| CLI | Azure Developer CLI (`azd`) |
| Config file | `azure.yaml` (app name: `spec2cloud-app`) |

**Service configuration (`azure.yaml`):**

| Service | Host | Language | Port |
|---------|------|----------|------|
| `api` | containerapp | TypeScript | 8080 |
| `web` | containerapp | TypeScript | 3000 |

**Hooks:**
- `predeploy` — runs `infra/scripts/predeploy.sh` (or `.ps1` on Windows) before deployment.

**Deploy commands:**

| Command | Purpose |
|---------|---------|
| `azd provision` | Provision Azure resources |
| `azd deploy` | Build containers and deploy |
| `azd env get-values` | Retrieve deployed URLs |
| `azd down` | Tear down all resources |

---

## 11. Infrastructure

| Decision | Value |
|----------|-------|
| IaC language | Bicep |
| Template path | `infra/` |
| Module source | Azure Verified Modules (`br/public:avm/...`) |
| Target scope | Subscription |

**Resources provisioned (`infra/main.bicep`):**

| Resource | Module | SKU / Config |
|----------|--------|-------------|
| Resource Group | Built-in | `rg-{environmentName}` |
| Log Analytics Workspace | `core/monitor/loganalytics.bicep` | — |
| Application Insights | `core/monitor/applicationinsights.bicep` | Connected to Log Analytics |
| Container Apps Environment + Registry | `avm/ptn/azd/container-apps-stack:0.1.0` | Registry: Basic SKU, zone redundancy off |
| Web Container App | `avm/ptn/azd/container-app-upsert:0.1.1` | Ingress enabled, min 1 replica |
| API Container App | `avm/ptn/azd/container-app-upsert:0.1.1` | 1.0 CPU, 2.0 Gi RAM, port 8080, min 1 replica |
| Web Managed Identity | `avm/res/managed-identity/user-assigned-identity:0.2.1` | User-assigned |
| API Managed Identity | `avm/res/managed-identity/user-assigned-identity:0.2.1` | User-assigned |

**API environment variables (injected by Bicep):**
- `AZURE_CLIENT_ID` — managed identity client ID
- `APPLICATIONINSIGHTS_CONNECTION_STRING` — App Insights telemetry
- `JWT_SECRET` — generated via `uniqueString(resourceGroup().id, resourceToken, 'jwt-secret')`

**Bicep outputs:**
- `API_BASE_URL`, `REACT_APP_WEB_BASE_URL` — deployed service URLs
- `SERVICE_API_NAME`, `SERVICE_WEB_NAME` — container app names
- `AZURE_CONTAINER_REGISTRY_ENDPOINT`, `AZURE_CONTAINER_REGISTRY_NAME`
- `AZURE_CONTAINER_ENVIRONMENT_NAME`, `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`, `AZURE_TENANT_ID`
- `APPLICATIONINSIGHTS_CONNECTION_STRING`

---

## 12. Environment Variables

| Variable | Context | Default | Description |
|----------|---------|---------|-------------|
| `JWT_SECRET` | API | `aspire-local-dev-jwt-secret` (Aspire) | JWT signing secret. Generated by Bicep in production. |
| `PORT` | API | `5001` (dev), `8080` (prod) | HTTP listen port for Express. |
| `NODE_ENV` | API + Web | `development` | Controls cookie `Secure` flag and other runtime behavior. |
| `CORS_ORIGIN` | API | `http://localhost:3000` | Allowed frontend origin for CORS. |
| `AZURE_CLIENT_ID` | API (prod) | — | Managed identity client ID (injected by Bicep). |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | API (prod) | — | App Insights telemetry endpoint (injected by Bicep). |

---

## 13. Key Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| **Express 5** (not 4) | Latest stable release with native async error handling and improved routing. Reduces boilerplate for error middleware. |
| **In-memory storage** (no database) | MVP simplicity — eliminates database provisioning, migrations, and connection management. Service interfaces remain database-agnostic for future migration. |
| **JWT in HTTP-only cookies** (not localStorage) | Prevents XSS-based token theft. `HttpOnly` cookies are inaccessible to JavaScript. `SameSite=Strict` mitigates CSRF. |
| **bcryptjs** (not bcrypt) | Pure JavaScript implementation — no native compilation required. Simplifies CI/CD and container builds. |
| **.NET Aspire orchestration** | Provides local development parity with Azure Container Apps. Health checks, service references, and environment variable injection mirror production topology. |
| **Azure Container Apps** (not AKS) | Serverless container hosting with built-in scaling, no cluster management. Right-sized for a stateless Node.js app. |
| **Azure Verified Modules** (Bicep) | Community-maintained, tested Bicep modules. Reduces IaC maintenance burden and follows Azure best practices. |
| **Pino** (not Winston/Bunyan) | Fastest Node.js structured logger. Low overhead in production. JSON output integrates with Azure Monitor. |
| **Vitest** (not Jest) | Native ESM support, TypeScript-first, faster execution. Compatible with the Vite ecosystem. |
| **Tailwind CSS 4** | Utility-first CSS with zero-runtime overhead. PostCSS integration via `@tailwindcss/postcss`. |

---

## 14. Not Used / Deferred

The shell template includes infrastructure modules for AI services that are **not needed** for the TaskBoard application:

| Infra Module | Path | Status |
|-------------|------|--------|
| AI / Azure OpenAI | `infra/core/ai/` | **Not used** — can be removed or left inert |
| Azure AI Search | `infra/core/search/` | **Not used** — can be removed or left inert |
| Storage accounts | `infra/core/storage/` | **Not used** — can be removed or left inert |

These modules are present in the template but are **not referenced** by `main.bicep` and will not be provisioned. They can be safely removed to reduce repository noise, or retained for potential future use (e.g., if TaskBoard adds AI-powered features).

Additionally:
- `Aspire.Hosting.Python` is included in `apphost.cs` for the MkDocs docs server — it is not part of the application runtime.
- `react-markdown ^10.1.0` is installed in the web frontend — available for rendering markdown content if needed.
