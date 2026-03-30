# Solution 3 — Product Discovery (Phase 1)

[< Previous Challenge Solution](solution-02.md) - **[Home](../Readme.md)** - [Next Challenge Solution >](solution-04.md)

**Duration:** 30 minutes

## Prerequisites

Please ensure that you successfully completed [Challenge 2](../challenges/challenge-02.md) — your PRD should be written and saved in `specs/prd.md`.

---

### Task 1: Start the orchestrator

Open **GitHub Copilot Chat** in VS Code (Ctrl+Shift+I / Cmd+Shift+I). Start a **new session** and paste:

```
@workspace I want to run the spec2cloud pipeline.
Read AGENTS.md and start from Phase 1a (Spec Refinement).
The PRD is in specs/prd.md.
```

The orchestrator reads `AGENTS.md`, loads skills from `.github/skills/`, and begins Phase 1.

---

### Task 2: Phase 1a — Spec Refinement

**What happens:** The agent reviews your PRD through product and technical lenses, splits it into Functional Requirements Documents (FRDs), and flags gaps.

**What to expect:** New files in `specs/`, such as:
- `specs/frd-tasks.md` — Create, view, edit, delete task flows
- `specs/frd-board.md` — Column layout, status transitions, empty states

🔑 **At the human gate, check:**
- Every user story from your PRD is represented in an FRD
- Each FRD has clear acceptance criteria
- Nothing was added that you didn't ask for
- Nothing was lost or misinterpreted

💥 **Fix issues here.** Anything that slips through will be tested, implemented, and deployed as-is. A correction now is free — a correction after implementation is expensive.

Type **"approved"** to continue (or provide feedback).

---

### Task 3: Phase 1b — UI/UX Design

**What happens:** The agent generates interactive HTML wireframe prototypes and starts a local HTTP server.

**What to expect:** A URL in the terminal output (typically `http://localhost:8080`). Open it in your browser.

🔑 **At the human gate, check:**
- The board layout matches your mental model
- Task creation, editing, and deletion flows are present
- Navigation makes sense

Type **"approved"** to continue.

---

### Task 4: Phase 1c — Increment Planning

**What happens:** The agent breaks FRDs into ordered delivery increments. Output: `specs/increment-plan.md`.

**What to expect:** A typical plan for the Task Board:

| Increment | What Ships |
|-----------|-----------|
| 1 | Walking skeleton — empty board, API health check, wired up and deployed |
| 2 | Task CRUD — create, read, delete tasks; board renders in correct columns |
| 3 | Status transitions — move tasks forward/back; edit title and description |

🔑 **At the human gate, check:**
- Ordering makes sense (simpler things first, dependencies respected)
- Scope per increment is manageable

Type **"approved"** to continue.

---

### Task 5: Phase 1d — Tech Stack Resolution

**What happens:** The agent inventories every library, queries live documentation, and pins versions. Output: `specs/tech-stack.md`.

🔑 **At the human gate, check:**
- Library versions are current and compatible
- Stack matches the template's setup (Next.js, Express, Playwright, Vitest, Tailwind CSS)
- No unexpected dependencies

Type **"approved"** to continue.

---

### Verification

At the end of Phase 1, confirm you have:
- FRDs in `specs/` with acceptance criteria
- Interactive wireframe prototypes reviewed
- `specs/increment-plan.md` with ordered increments
- `specs/tech-stack.md` with pinned versions
- All four human gates approved
- **No implementation code written yet**

You successfully completed Challenge 3! 🚀🚀🚀
