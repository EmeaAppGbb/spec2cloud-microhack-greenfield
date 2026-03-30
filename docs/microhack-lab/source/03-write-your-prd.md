# Lab 3 — Write Your PRD

[← Environment Setup](02-environment-setup.md) | [Next: Product Discovery →](04-product-discovery.md)

---

This is the **only step where you write anything substantial**. Everything after this is approval gates.

---

## What is a PRD?

A **Product Requirements Document (PRD)** is a plain-language description of what your software should do. In the spec2cloud pipeline, the PRD is the ground truth — everything downstream (FRDs, tests, code, deployment) traces back to it.

## Your Task

Open `specs/prd.md` in VS Code and replace its contents with your own product spec for the **Task Board**.

Write it in plain language — bullet points, paragraphs, whatever feels natural. Your spec should cover:

| Section | What to Write |
|---------|---------------|
| **What the app does** | One or two sentences describing the product |
| **Who uses it** | In this case: a single user, no auth |
| **Key user stories** | What can the user do, and what does success look like for each? |
| **Technical constraints** | In-memory store, no database, no auth |

---

## Tips for Writing a Good PRD

- **Don't try to be exhaustive.** 5 user stories is plenty. The agents will ask clarifying questions during spec refinement if anything is ambiguous.
- **Be specific about acceptance criteria.** "The task appears in the To Do column" is better than "the task is created."
- **Write in your own voice.** The agents work better with specs that sound like a real person wrote them — not a template.
- **Include what's out of scope.** Explicitly listing non-goals helps the agents avoid over-building.

---

## Need Inspiration?

A sample PRD is available at `docs/microhack-sample-prd.md` in your repo. Feel free to read it for reference — then **close it** and write your own version from memory.

The sample covers 5 user stories for the Task Board:

1. **Create a Task** — title + optional description, appears in "To Do"
2. **View the Board** — three columns (To Do, In Progress, Done) with task counts
3. **Move a Task** — forward/backward one step between columns
4. **Edit a Task** — update title and description inline
5. **Delete a Task** — with confirmation prompt

Your version can follow a similar structure, but **make it yours**.

---

## Example Structure

Here's a skeleton to get you started (don't copy this verbatim — fill in your own words):

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

## ⚠️ Why This Step Matters

Your PRD is the ground truth everything else traces back to. The more deliberately you write it, the more meaningful the verification is at every downstream gate.

**Vague requirements lead to passing tests that don't actually prove anything.**

---

## ✅ Checkpoint

Before moving on, confirm:

- [ ] You have written your own PRD in `specs/prd.md`
- [ ] It includes at least 3–5 user stories with acceptance criteria
- [ ] It specifies technical constraints (in-memory, no auth, no database)
- [ ] You've saved the file

---

[← Environment Setup](02-environment-setup.md) | [Next: Product Discovery →](04-product-discovery.md)
