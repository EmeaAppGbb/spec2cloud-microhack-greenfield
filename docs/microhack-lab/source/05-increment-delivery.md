# Lab 5 — Increment Delivery (Phase 2)

[← Product Discovery](04-product-discovery.md) | [Next: Verify Your Live App →](06-verify-and-celebrate.md)

---

This is where the agents build and deploy your app. The orchestrator works through **each increment** from the plan you approved, running four steps per increment automatically.

**Estimated time:** ~60–75 minutes

> 💡 **You don't need to start a new Copilot Chat session.** If you're still in the same session from Lab 4, the agent will continue from where it left off. If you had to restart, paste:
> ```
> @workspace Read AGENTS.md and continue the spec2cloud pipeline.
> Resume from Phase 2 (Increment Delivery). The specs are in specs/.
> ```

---

## Step A — Test Scaffolding

### What happens

The agent derives the **full test suite** directly from the Gherkin scenarios in your FRDs — **before any implementation code is written**:

| Output | Description |
|--------|-------------|
| `specs/features/*.feature` | Gherkin feature files — plain-English scenarios translated from your acceptance criteria |
| Playwright e2e tests | Browser-level flows (create task → move to In Progress → move to Done → delete) |
| Cucumber step definitions | Wiring Gherkin steps to executable code |
| Vitest unit tests | API endpoint tests covering each contract |

### 🚦 Human Gate — Test Verification

**This is the most important gate in the entire pipeline.**

Open `specs/features/` and read the Gherkin scenarios. Ask yourself:

- [ ] Do the scenarios describe the behaviour you wrote in your PRD?
- [ ] Is every acceptance criterion from your FRDs covered?
- [ ] Are there any tests that don't trace back to your spec?

> ⚠️ **The tests are the spec in executable form.** If they're wrong, the implementation will be wrong too — and it will pass every test while doing so.

After you approve, the agent establishes the **red baseline**: all new tests fail (proving they're real and not trivially passing), while all existing tests continue to pass.

Type **"approved"** to continue.

---

## Step B — Contract Generation

### What happens

The agent generates **API contracts** and **shared TypeScript types** before touching any implementation code:

| Output | Description |
|--------|-------------|
| `specs/contracts/api/` | REST endpoint specs (routes, request/response shapes) |
| `src/shared/` | TypeScript interfaces shared between the API and Web apps |
| `specs/contracts/infra/resources.yaml` | Infrastructure requirements |

**No human gate here** — the contracts flow directly from the tests.

---

## Step C — Implementation

### What happens

The agent implements in **three slices**:

| Slice | What Gets Built |
|-------|----------------|
| **API slice** | Express routes (`GET/POST/PATCH/DELETE /api/tasks`), in-memory task store, input validation |
| **Web slice** | Next.js board page, task cards, create/edit form, status transition controls — all wired to the API |
| **Integration** | API + Web running together, full regression suite green |

After each slice the test suite runs. The orchestrator **loops until all tests pass**.

### 🚦 Human Gate — Implementation Verification

The agent summarises what was built. Review the diff and ask:

- [ ] Does this match what you approved in the Gherkin scenarios?
- [ ] Are there any shortcuts or hardcoded values?
- [ ] Is the code structure clean and understandable?

> 💡 **Tests passing is necessary — but it's not sufficient.** You're verifying that the implementation is the *right* implementation, not just a green one.

Type **"approved"** to continue.

---

## Step D — Deploy to Azure

### What happens

After all increments are green, the agent runs:

```bash
azd provision   # Creates Azure Container Apps, ACR, and monitoring
azd deploy      # Builds containers and pushes
```

Then it runs **smoke tests** against the live URL to close the verification loop:

- `GET /health` → 200
- `GET /api/health` → 200
- Full Playwright e2e suite against the deployed endpoint (the same tests derived from your spec)

### 🚦 Human Gate — Deployment Verification

The agent shows you the **live URL** and smoke test results.

- [ ] Open the app in your browser
- [ ] Manually walk through the user stories from your PRD
- [ ] Not the tests — *your original words*

> This is the final check that the spec you wrote and the app that was built are actually the same thing.

Type **"approved"** to continue.

---

## What If an Increment Has Issues?

The orchestrator handles most problems automatically:

- **Tests fail after implementation** → the agent loops, fixes code, and re-runs tests
- **Smoke tests fail after deploy** → the agent auto-rollbacks and asks you to re-approve

If things seem stuck, you can always say:
```
Read the resume skill and continue from current state
```

See [Lab 8 — Troubleshooting](08-troubleshooting.md) for more details.

---

## ✅ Checkpoint

At the end of Phase 2, you should have:

- [ ] A full test suite derived from your Gherkin scenarios (all green)
- [ ] API contracts and shared TypeScript types
- [ ] A working implementation with all tests passing
- [ ] A deployed app on Azure Container Apps
- [ ] Smoke tests passing against the live URL

---

[← Product Discovery](04-product-discovery.md) | [Next: Verify Your Live App →](06-verify-and-celebrate.md)
