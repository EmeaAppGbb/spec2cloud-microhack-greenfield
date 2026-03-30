# Solution 2 — Write Your PRD

[< Previous Challenge Solution](solution-01.md) - **[Home](../Readme.md)** - [Next Challenge Solution >](solution-03.md)

**Duration:** 20 minutes

## Prerequisites

Please ensure that you successfully completed [Challenge 1](../challenges/challenge-01.md) before continuing.

---

### Task 1: Understand what a PRD is

A **Product Requirements Document (PRD)** is a plain-language description of what your software should do. In spec2cloud, the PRD is the ground truth — everything downstream (FRDs, tests, code, deployment) traces back to it.

💡 **Vague requirements lead to passing tests that don't actually prove anything.** The more deliberately you write it, the more meaningful the verification is at every downstream gate.

---

### Task 2: Write your PRD

Open `specs/prd.md` in VS Code. Replace its contents with your own spec using this structure:

```markdown
# Task Board PRD

## Overview
[What is this app? Who is it for?]

## Goals
- [Goal 1]
- [Goal 2]

## Non-Goals
- [What are you explicitly NOT building?]

## User Stories

### US-01 — [Story Name]
As a user, I want to [action] so that [benefit].

**Acceptance criteria:**
- [Criterion 1]
- [Criterion 2]

### US-02 — [Story Name]
...

## Technical Notes
- Backend: Express.js REST API (Node.js + TypeScript)
- Frontend: Next.js App Router with Tailwind CSS
- State: In-memory store, no database
- No authentication required
```

---

### Task 3: Write specific user stories

Here are example user stories (write your own version, don't copy verbatim):

1. **Create a Task** — title + optional description, appears in "To Do"
2. **View the Board** — three columns (To Do, In Progress, Done) with task counts
3. **Move a Task** — forward/backward one step between columns
4. **Edit a Task** — update title and description inline
5. **Delete a Task** — with confirmation prompt

🔑 **Key tips:**
- Be specific about acceptance criteria: "The task appears in the To Do column" is better than "the task is created"
- 5 user stories is plenty — agents will ask clarifying questions during spec refinement
- Include what's out of scope (non-goals) to prevent over-building
- Write in your own voice — the agents work better with natural language

---

### Task 4: Reference the sample (optional)

A sample PRD is at `docs/microhack-sample-prd.md`. Read it for inspiration — then **close it** and write your own from memory.

---

### Task 5: Save and verify

Save `specs/prd.md` and confirm:
- At least 3–5 user stories with acceptance criteria
- Technical constraints specified (in-memory, no auth, no database)
- Non-goals listed

You successfully completed Challenge 2! 🚀🚀🚀
