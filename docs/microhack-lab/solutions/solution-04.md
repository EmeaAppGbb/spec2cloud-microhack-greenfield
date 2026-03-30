# Solution 4 — Increment Delivery (Phase 2)

[< Previous Challenge Solution](solution-03.md) - **[Home](../Readme.md)** - [Next Challenge Solution >](solution-05.md)

**Duration:** 60–75 minutes

## Prerequisites

Please ensure that you successfully completed [Challenge 3](../challenges/challenge-03.md) — all Phase 1 gates should be approved.

---

### Task 1: Resume the pipeline (if needed)

If you're still in the same Copilot Chat session from Challenge 3, the agent continues automatically. If you restarted, paste:

```
@workspace Read AGENTS.md and continue the spec2cloud pipeline.
Resume from Phase 2 (Increment Delivery). The specs are in specs/.
```

---

### Task 2: Step A — Review Test Scaffolding

**What happens:** The agent derives the full test suite from Gherkin scenarios — before any implementation:
- `specs/features/*.feature` — Gherkin feature files
- Playwright e2e tests — browser-level user flows
- Cucumber step definitions — wiring Gherkin steps to code
- Vitest unit tests — API endpoint tests

💥 **This is the most important gate in the entire pipeline.**

🔑 **At the human gate, check carefully:**
- The scenarios describe the behaviour you wrote in your PRD
- Every acceptance criterion from your FRDs is covered
- There are no tests that don't trace back to your spec

💡 The tests are the spec in executable form. If they're wrong, the implementation will be wrong too — and it will pass every test while doing so.

After you approve, the agent establishes the **red baseline**: all new tests fail (proving they're real), while existing tests still pass.

Type **"approved"** to continue.

---

### Task 3: Step B — Contract Generation (automatic)

**What happens:** API contracts and shared TypeScript types are generated automatically:
- `specs/contracts/api/` — REST endpoint specs
- `src/shared/` — shared TypeScript interfaces
- `specs/contracts/infra/resources.yaml` — infrastructure requirements

**No human gate** — contracts flow directly from the tests.

---

### Task 4: Step C — Review Implementation

**What happens:** The agent implements in three slices:

| Slice | What Gets Built |
|-------|----------------|
| **API** | Express routes, in-memory store, input validation |
| **Web** | Next.js board page, task cards, forms, status controls |
| **Integration** | API + Web wired together, full regression green |

The orchestrator loops until all tests pass after each slice.

🔑 **At the human gate, review the diff:**
- Does this match what you approved in the Gherkin scenarios?
- Are there shortcuts or hardcoded values?
- Is the code structure clean?

💡 Tests passing is necessary — but not sufficient. You're verifying the *right* implementation, not just a green one.

Type **"approved"** to continue.

---

### Task 5: Step D — Deploy to Azure

**What happens:** The agent runs:
```bash
azd provision   # Creates Azure Container Apps, ACR, monitoring
azd deploy      # Builds containers and pushes
```

Then smoke tests run against the live URL:
- `GET /health` → 200
- `GET /api/health` → 200
- Full Playwright e2e suite against the deployed endpoint

🔑 **At the human gate:**
- Open the live URL in your browser
- Manually walk through your PRD user stories
- Verify the deployed app matches your original spec

Type **"approved"** to continue.

---

### Troubleshooting

If things get stuck:
- **Tests fail after implementation** → the agent loops, fixes code, and re-runs automatically
- **Smoke tests fail after deploy** → the agent auto-rollbacks and asks to re-approve
- **Agent seems stuck** → say: `Read the resume skill and continue from current state`

---

### Verification

At the end of Phase 2, confirm:
- Gherkin feature files in `specs/features/` cover all acceptance criteria
- Full test suite passes (Playwright, Cucumber, Vitest)
- API contracts in `specs/contracts/api/` and shared types in `src/shared/`
- Implementation in `src/api/` and `src/web/`
- App deployed to Azure Container Apps
- Smoke tests pass against the live URL

You successfully completed Challenge 4! 🚀🚀🚀
