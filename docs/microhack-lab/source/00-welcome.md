# Welcome to the spec2cloud Microhack

| | |
|---|---|
| **Duration** | ~2–3 hours |
| **Audience** | Developers |
| **Goal** | Practice spec-driven development with AI — write a product spec, let agents implement it, and verify at every step that what was built matches what you asked for |

---

## What You'll Build

A **Task Board** app — a minimal kanban board where users can capture tasks, move them through *To Do → In Progress → Done*, and delete them when they're finished. No login required. No database — just an in-memory store to keep scope tight.

The whole pipeline — spec refinement, wireframes, test generation, implementation, and Azure deployment — is driven by AI agents. **You approve, not type.**

---

## The Big Idea: Spec-Driven Development

Here's the perspective shift that underpins everything in this hack:

> **The most valuable asset in a codebase is not the code — it's the specification.**

Code is an implementation detail. With AI agents, it's also increasingly throwable. Given a good enough spec, you can regenerate the implementation at any time: on a different stack, with a newer framework, optimised for a different cloud. What you can't regenerate — what takes real human judgment to produce — is a precise, verified description of **what the software is supposed to do**.

**spec2cloud** is built around this idea. Your spec is the single source of truth, and everything in the pipeline traces back to it:

```
Your PRD                              ← the real deliverable
  └─ FRDs (formal user stories)       ← spec, formalised
       └─ Gherkin scenarios           ← spec, made executable
            └─ Playwright / Vitest tests  ← spec, running as code
                 └─ Implementation    ← code that satisfies the spec
                      └─ Deployed app ← verified against the spec
```

At no point does the AI invent requirements. Tests are derived from your Gherkin scenarios — not written after the code. Code is written to make those tests pass — nothing more.

**The human gates are spec verification checkpoints.** Each one asks: *does this still match what you asked for?*

---

## How the Pipeline Works

spec2cloud uses the **Ralph Loop**: a single AI orchestrator that reads state, determines the next task, picks the right skill, executes, verifies, and repeats — pausing at human gates for your approval.

```
PRD → Spec Refinement → UI Prototypes → Increment Plan → Tech Stack
     → [per increment] Tests (from spec) → Contracts → Implementation → Verify → Deploy → ✅
```

Skills live in `.github/skills/` and cover every phase from spec refinement through Azure deployment.

---

## Workshop Flow

| Lab | Title | Duration |
|-----|-------|----------|
| [Lab 1](01-prerequisites.md) | Prerequisites | 5 min |
| [Lab 2](02-environment-setup.md) | Environment Setup | 15 min |
| [Lab 3](03-write-your-prd.md) | Write Your PRD | 20 min |
| [Lab 4](04-product-discovery.md) | Product Discovery (Phase 1) | 30 min |
| [Lab 5](05-increment-delivery.md) | Increment Delivery (Phase 2) | 60–75 min |
| [Lab 6](06-verify-and-celebrate.md) | Verify Your Live App | 10 min |
| [Lab 7](07-tear-down.md) | Tear Down & Next Steps | 5 min |
| [Lab 8](08-troubleshooting.md) | Troubleshooting & Resources | Reference |

---

> **Ready?** Head to [Lab 1 — Prerequisites](01-prerequisites.md) to check your setup.
