# Challenge 4 — Increment Delivery (Phase 2)

[< Previous Challenge](challenge-03.md) - **[Home](../Readme.md)** - [Next Challenge >](challenge-05.md)

**Duration:** 60–75 minutes

## Goal

Let the AI agents build and deploy your Task Board app. The orchestrator works through each increment from the plan you approved, running four steps per increment: **Tests → Contracts → Implementation → Deploy**.

## Actions

* If continuing from the same Copilot Chat session, the agent will proceed automatically. If you restarted, paste:
    ```
    @workspace Read AGENTS.md and continue the spec2cloud pipeline.
    Resume from Phase 2 (Increment Delivery). The specs are in specs/.
    ```
* **Step A — Test Scaffolding:** Review the Gherkin scenarios in `specs/features/`. Verify they describe the behaviour from your PRD and FRDs. Approve the test code.
* **Step B — Contract Generation:** API contracts and shared TypeScript types are generated automatically (no human gate).
* **Step C — Implementation:** The agent implements API slice, Web slice, and Integration slice. Review the implementation diff — confirm it matches what you approved in the Gherkin scenarios. Approve.
* **Step D — Deploy to Azure:** The agent runs `azd provision` + `azd deploy` and then smoke tests against the live URL. Verify the live URL and smoke test results. Approve.

> ⚠️ The test scaffolding gate is the most important gate. The tests are the spec in executable form — if they're wrong, the implementation will be wrong too.

## Success Criteria

* Gherkin feature files exist in `specs/features/` covering all acceptance criteria
* Full test suite passes (all green) — Playwright e2e, Cucumber BDD, and Vitest unit tests
* API contracts exist in `specs/contracts/api/` and shared types in `src/shared/`
* Implementation code exists in `src/api/` and `src/web/`
* App is deployed to Azure Container Apps
* Smoke tests pass against the live URL

## Learning Resources

* [spec2cloud Increment Delivery flow](../greenfield.md)
* [Azure Container Apps documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
