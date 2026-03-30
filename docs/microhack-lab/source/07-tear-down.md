# Lab 7 — Tear Down & Next Steps

[← Verify Your Live App](06-verify-and-celebrate.md) | [Troubleshooting →](08-troubleshooting.md)

---

## Tear Down Azure Resources

When you're done exploring, clean up your Azure resources to avoid ongoing charges:

```bash
azd down
```

This removes all Azure resources provisioned during the hack (Container Apps, Container Registry, Application Insights, etc.).

> ⚠️ **This is irreversible.** Make sure you're done exploring before running this command. Your code and specs remain in your Git repo — only the Azure infrastructure is torn down.

---

## What You Learned

- **Spec-driven development** — specifications as the single source of truth, not code
- **Test-first with AI** — tests derived from Gherkin scenarios before any implementation
- **Human gates** — verification checkpoints that protect spec integrity through the pipeline
- **AI orchestration** — the Ralph Loop pattern for phased, resumable agent workflows
- **Azure deployment** — Container Apps provisioned and deployed via `azd`

---

## Going Further

Don't stop here. The spec2cloud pipeline is designed for iteration.

### Change Your PRD Mid-Hack

Add a new user story to an FRD and run Phase 2 for a new increment:

```
@workspace I've added a new user story to specs/frd-tasks.md.
Run Phase 2 for a new increment to implement it.
```

### Explore the Agent Skills

Each `.github/skills/*/SKILL.md` is a standalone agent procedure. Start with `spec-refinement/SKILL.md` to see how the agent reasons through a spec.

There are **43 skills** covering everything from spec refinement to deployment. Browse them:

```bash
ls .github/skills/
```

### Bring a Different Idea

Replace `specs/prd.md` with a completely different product spec — the pipeline doesn't care what you're building. Try:
- A simple blog engine
- A lightweight bookmark manager
- A team voting/polling tool

### Add Persistence

Write a `specs/frd-persistence.md` user story and let agents wire up a database:
- Azure Cosmos DB
- PostgreSQL Flexible Server

---

## Share Your Experience

If you found this hack valuable, consider:
- ⭐ Starring the [spec2cloud template on GitHub](https://github.com/EmeaAppGbb/shell-typescript)
- Sharing what you built with your team
- Running your own spec2cloud session on a real project

---

[← Verify Your Live App](06-verify-and-celebrate.md) | [Troubleshooting →](08-troubleshooting.md)
