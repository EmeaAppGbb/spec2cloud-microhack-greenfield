# Lab 6 — Verify Your Live App

[← Increment Delivery](05-increment-delivery.md) | [Next: Tear Down & Next Steps →](07-tear-down.md)

---

Your app is live on Azure. Time to verify it end-to-end with your own hands.

**Estimated time:** ~10 minutes

---

## Get Your URL

Run this in the terminal to retrieve your deployed app's URL:

```bash
azd env get-values | grep SERVICE_WEB_ENDPOINT_URL
```

Open the URL in your browser.

---

## Manual Verification

Walk through these scenarios — they map directly to the user stories you wrote in your PRD:

### 1. Create Tasks

- [ ] Create three tasks with different titles and descriptions
- [ ] Verify each new task appears in the **"To Do"** column
- [ ] Try submitting an empty title — it should show a validation error

### 2. View the Board

- [ ] Confirm you see three columns: **To Do**, **In Progress**, **Done**
- [ ] Check that task counts are shown for each column
- [ ] Verify the board loaded quickly (under 2 seconds)

### 3. Move Tasks

- [ ] Move a task from **To Do → In Progress**
- [ ] Move it from **In Progress → Done**
- [ ] Try moving a task directly from **To Do → Done** — it should be blocked (one step at a time)
- [ ] Move a task back from **Done → In Progress**

### 4. Edit a Task

- [ ] Click on a task to edit its title
- [ ] Change the title and verify it updates immediately
- [ ] Try saving an empty title — it should be prevented

### 5. Delete a Task

- [ ] Click the delete button on a task
- [ ] Verify a confirmation prompt appears
- [ ] Confirm the deletion — the task should disappear immediately

---

## Explore Your Azure Resources (Bonus)

Open the [Azure Portal](https://portal.azure.com) and explore the resources that were provisioned automatically:

| Resource | What It Does |
|----------|-------------|
| **Azure Container Apps** | Runs your API and Web containers |
| **Azure Container Registry** | Stores your container images |
| **Application Insights** | Monitors your app (logs, metrics, traces) |
| **Log Analytics Workspace** | Powers the monitoring queries |

> 💡 **Tip:** In the portal, search for the resource group that matches your `microhack` environment name.

---

## What Just Happened?

Take a moment to reflect on the full journey:

| Phase | What the Agents Did | What You Verified |
|-------|---------------------|-------------------|
| Spec Refinement | Turned your PRD into traceable FRDs with acceptance criteria | Every user story is present and correctly interpreted |
| UI/UX Design | Generated interactive wireframes from the FRDs | The UI matches your intent before any code existed |
| Increment Planning | Ordered delivery so a walking skeleton ships first | The scope and ordering make sense for your spec |
| Tech Stack | Queried live docs to pin correct library versions | The stack is appropriate and up to date |
| Test Scaffolding | Derived Gherkin scenarios and a full test suite from the FRDs | The tests faithfully express your acceptance criteria |
| Contracts | Generated API specs and shared TypeScript types | — |
| Implementation | Wrote all backend + frontend code to make tests green | The implementation matches the Gherkin — not just the tests |
| Deployment | Provisioned Azure infra and ran smoke tests against the live URL | Your original PRD user stories work end-to-end in production |

**You wrote zero production code.** You wrote a spec — and that spec drove every test, every line of implementation, and every deployment check.

> **The code is an artifact. The spec is the asset.**

---

[← Increment Delivery](05-increment-delivery.md) | [Next: Tear Down & Next Steps →](07-tear-down.md)
