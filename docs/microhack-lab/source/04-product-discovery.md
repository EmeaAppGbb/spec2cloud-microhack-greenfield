# Lab 4 — Product Discovery (Phase 1)

[← Write Your PRD](03-write-your-prd.md) | [Next: Increment Delivery →](05-increment-delivery.md)

---

Now the AI agents take over. In this lab you'll kick off the spec2cloud pipeline and work through **Phase 1: Product Discovery** — four sub-phases, each with a human approval gate.

**Estimated time:** ~30 minutes

---

## Start the Orchestrator

Open **GitHub Copilot Chat** in VS Code (Ctrl+Shift+I / Cmd+Shift+I). Start a **new session** and paste this prompt:

```
@workspace I want to run the spec2cloud pipeline.
Read AGENTS.md and start from Phase 1a (Spec Refinement).
The PRD is in specs/prd.md.
```

The orchestrator will read `AGENTS.md`, load the relevant skills from `.github/skills/`, and begin working through Phase 1.

> 💡 **How to interact:** At each human gate, the agent will pause and ask for your review. Type **"approved"** to continue, or provide specific feedback if something needs changing.

---

## Phase 1a — Spec Refinement

### What happens

The agent reviews your PRD through **product** and **technical** lenses, splits it into **Functional Requirements Documents (FRDs)**, and flags any gaps or ambiguities.

### What to expect

New files will appear in your `specs/` folder, such as:

| File | Contents |
|------|----------|
| `specs/frd-tasks.md` | Create, view, edit, delete task flows |
| `specs/frd-board.md` | Column layout, status transitions, empty states |

### 🚦 Human Gate — Spec Verification

**This is your first verification checkpoint.** Review the FRDs and check that:

- [ ] Every user story from your PRD is represented in an FRD
- [ ] Each FRD has clear acceptance criteria
- [ ] Nothing was added that you didn't ask for
- [ ] Nothing was lost or misinterpreted

> ⚠️ **Fix issues here.** Anything that slips through will be tested, implemented, and deployed as-is. A correction now is free — a correction after implementation is expensive.

Type **"approved"** to continue (or provide feedback).

---

## Phase 1b — UI/UX Design

### What happens

The agent generates **interactive HTML wireframe prototypes** for every screen and starts a local HTTP server so you can browse them.

### What to expect

A URL will appear in the terminal output (typically `http://localhost:8080`). Open it in your browser.

### 🚦 Human Gate — Prototype Verification

Walk through the wireframes and ask yourself:

- [ ] Does the board layout match your mental model?
- [ ] Are the task creation, editing, and deletion flows present?
- [ ] Does the navigation make sense?
- [ ] Does the UI match what you had in mind when you wrote the PRD?

> 💡 **This is your chance to spot gaps before any code exists.** An adjustment here costs seconds. The same change post-implementation costs much more.

Type **"approved"** to continue (or provide feedback).

---

## Phase 1c — Increment Planning

### What happens

The agent breaks the FRDs into **ordered delivery increments**, starting with a walking skeleton. Output: `specs/increment-plan.md`.

### What to expect

A typical plan for the Task Board looks like:

| Increment | What Ships |
|-----------|-----------|
| 1 | Walking skeleton — empty board, API health check, wired up and deployed |
| 2 | Task CRUD — create, read, delete tasks; board renders tasks in correct column |
| 3 | Status transitions — move tasks forward/back; edit title and description |

### 🚦 Human Gate — Plan Verification

- [ ] Does the ordering make sense? (Simpler things first, dependencies respected)
- [ ] Is the scope per increment manageable?
- [ ] Is anything missing?

Type **"approved"** to continue (or ask to reorder).

---

## Phase 1d — Tech Stack Resolution

### What happens

The agent inventories every library in the stack, queries **live documentation** (Microsoft Learn, Context7, DeepWiki), and pins the correct versions and configuration.

Output: `specs/tech-stack.md`

### 🚦 Human Gate — Tech Stack Verification

- [ ] Are the library versions current and compatible?
- [ ] Does the stack match the template's intended setup? (Next.js, Express, Playwright, Vitest, Tailwind CSS)
- [ ] No unnecessary or unexpected dependencies?

Type **"approved"** to continue.

---

## ✅ Checkpoint

At the end of Phase 1, you should have:

- [ ] FRDs in `specs/` with clear acceptance criteria for every user story
- [ ] Interactive wireframe prototypes you've reviewed
- [ ] An increment plan in `specs/increment-plan.md`
- [ ] A tech stack document in `specs/tech-stack.md`
- [ ] All four human gates approved

**No code has been written yet.** Everything so far is specification — and that's the point.

---

[← Write Your PRD](03-write-your-prd.md) | [Next: Increment Delivery →](05-increment-delivery.md)
