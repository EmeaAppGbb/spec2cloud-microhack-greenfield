# Solution 5 — Verify, Celebrate & Tear Down

[< Previous Challenge Solution](solution-04.md) - **[Home](../Readme.md)**

**Duration:** 15 minutes

## Prerequisites

Please ensure that you successfully completed [Challenge 4](../challenges/challenge-04.md) — your app should be deployed and smoke tests passing.

---

### Task 1: Get your deployed URL

```bash
azd env get-values | grep SERVICE_WEB_ENDPOINT_URL
```

Open the URL in your browser.

---

### Task 2: Manual verification

Walk through each user story from your PRD:

**Create Tasks:**
1. Create three tasks with different titles and descriptions
2. Verify each appears in "To Do"
3. Try submitting an empty title — should show a validation error

**View the Board:**
1. Confirm three columns: To Do, In Progress, Done
2. Check task counts for each column
3. Verify load time is under 2 seconds

**Move Tasks:**
1. Move a task from To Do → In Progress
2. Move from In Progress → Done
3. Try moving directly from To Do → Done — should be blocked
4. Move a task back from Done → In Progress

**Edit a Task:**
1. Click a task to edit its title
2. Change the title — verify it updates immediately
3. Try saving an empty title — should be prevented

**Delete a Task:**
1. Click the delete button on a task
2. Verify a confirmation prompt appears
3. Confirm deletion — task should disappear immediately

---

### Task 3: Explore Azure resources (bonus)

Open the [Azure Portal](https://portal.azure.com) and search for your resource group:

| Resource | What It Does |
|----------|-------------|
| **Azure Container Apps** | Runs your API and Web containers |
| **Azure Container Registry** | Stores your container images |
| **Application Insights** | Monitors your app (logs, metrics, traces) |
| **Log Analytics Workspace** | Powers the monitoring queries |

💡 Search for the resource group matching your `microhack` environment name.

---

### Task 4: Tear down Azure resources

⚠️ Make sure you're done exploring before running this — it's irreversible.

```bash
azd down
```

This removes all Azure resources. Your code and specs remain in your Git repo.

---

### Reflect on what happened

| Phase | What the Agents Did | What You Verified |
|-------|---------------------|-------------------|
| Spec Refinement | Turned your PRD into traceable FRDs | Every user story is present and correct |
| UI/UX Design | Generated wireframes from FRDs | UI matches your intent |
| Increment Planning | Ordered delivery, walking skeleton first | Scope and ordering make sense |
| Tech Stack | Queried live docs, pinned versions | Stack is appropriate and current |
| Test Scaffolding | Derived Gherkin + full test suite | Tests faithfully express your criteria |
| Implementation | Wrote all code to make tests green | Implementation matches the Gherkin |
| Deployment | Provisioned Azure, ran smoke tests | PRD user stories work in production |

**You wrote zero production code.** You wrote a spec — and that spec drove every test, every line of implementation, and every deployment check.

> **The code is an artifact. The spec is the asset.**

You successfully completed Challenge 5! 🚀🚀🚀
