# Challenge 3 — Product Discovery (Phase 1)

[< Previous Challenge](challenge-02.md) - **[Home](../Readme.md)** - [Next Challenge >](challenge-04.md)

**Duration:** 30 minutes

## Goal

Kick off the spec2cloud pipeline and complete **Phase 1: Product Discovery** — four sub-phases, each with a human approval gate. By the end, you'll have formal specifications, wireframes, an increment plan, and a resolved tech stack — all before any code is written.

## Actions

* Open **GitHub Copilot Chat** (Ctrl+Shift+I / Cmd+Shift+I) and start a new session with:
    ```
    @workspace I want to run the spec2cloud pipeline.
    Read AGENTS.md and start from Phase 1a (Spec Refinement).
    The PRD is in specs/prd.md.
    ```
* **Phase 1a — Spec Refinement:** Review the generated FRDs in `specs/` and verify every user story from your PRD is represented with clear acceptance criteria. Approve or provide feedback.
* **Phase 1b — UI/UX Design:** Open the wireframe prototype URL printed in the terminal (typically `http://localhost:8080`). Walk through the screens. Approve or provide feedback.
* **Phase 1c — Increment Planning:** Review `specs/increment-plan.md` — confirm the ordering makes sense (walking skeleton first, dependencies respected). Approve or provide feedback.
* **Phase 1d — Tech Stack Resolution:** Review `specs/tech-stack.md` — verify library versions are current and compatible. Approve or provide feedback.

> At each human gate, type **"approved"** to continue, or provide specific feedback.

## Success Criteria

* FRDs exist in `specs/` with clear acceptance criteria for every user story
* Interactive wireframe prototypes have been reviewed
* `specs/increment-plan.md` exists with ordered delivery increments
* `specs/tech-stack.md` exists with pinned library versions
* All four human gates have been approved
* **No implementation code has been written yet** — only specifications

## Learning Resources

* [spec2cloud Product Discovery flow](../greenfield.md)
* [Understanding Human Gates](../state-and-gates.md)
