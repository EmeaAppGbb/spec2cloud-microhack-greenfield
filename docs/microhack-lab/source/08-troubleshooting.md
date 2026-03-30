# Lab 8 — Troubleshooting & Resources

[← Tear Down & Next Steps](07-tear-down.md) | [Back to Welcome](00-welcome.md)

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| `azd provision` fails with **quota error** | Run `azd env set AZURE_LOCATION westeurope` (or `swedencentral`) and retry |
| `azd auth login` fails or token expired | Run `azd auth login` again — tokens expire, especially in long sessions |
| Agent seems **stuck in a loop** | Ask: *"Read the resume skill and continue from current state"* |
| Tests **failing after implementation** | Ask: *"Run the test runner skill and fix any failures"* |
| **Smoke tests fail** after deploy | The agent will auto-rollback — review the failure and re-approve implementation |
| **Wireframes not loading** | Check the terminal — the agent will have printed the HTTP server URL |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then re-run `npm install` |
| Playwright tests fail with **browser not found** | Run `npx playwright install` to install browser binaries |
| Codespace is **slow or unresponsive** | Try a larger machine type (4-core → 8-core) from the Codespaces settings |
| Copilot Chat not available | Ensure the GitHub Copilot and Copilot Chat extensions are installed and you're signed in |

---

## Restarting from a Specific Phase

The pipeline is **resumable**. If you need to restart from a specific point:

### Resume from Phase 1 (Product Discovery)

```
@workspace Read AGENTS.md and start from Phase 1a (Spec Refinement).
The PRD is in specs/prd.md.
```

### Resume from Phase 2 (Increment Delivery)

```
@workspace Read AGENTS.md and continue the spec2cloud pipeline.
Resume from Phase 2 (Increment Delivery). The specs are in specs/.
```

### Resume from current state

```
@workspace Read the resume skill and continue from current state.
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev:aspire` | Run all services locally with Aspire (recommended) |
| `npm run dev:all` | Run API + Web + Docs concurrently |
| `npm run test:all` | Run unit + BDD + e2e tests |
| `npm run build:all` | Production build (API + Web) |
| `npm run docs:full` | Capture screenshots + generate docs |
| `azd up` | Provision + deploy to Azure (combines provision + deploy) |
| `azd provision` | Provision Azure infrastructure only |
| `azd deploy` | Deploy containers only (after infrastructure exists) |
| `azd down` | Tear down all Azure resources |
| `azd env list` | List AZD environments |
| `azd env get-values` | Show all environment variables (including URLs) |

---

## Resources

| Resource | Link |
|----------|------|
| spec2cloud Template | [github.com/EmeaAppGbb/shell-typescript](https://github.com/EmeaAppGbb/shell-typescript) |
| Sample Task Board PRD | `docs/microhack-sample-prd.md` in your repo |
| Azure Developer CLI Docs | [learn.microsoft.com/azure/developer/azure-developer-cli](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/) |
| Azure Container Apps Docs | [learn.microsoft.com/azure/container-apps](https://learn.microsoft.com/en-us/azure/container-apps/) |
| agentskills.io Specification | [agentskills.io/specification](https://agentskills.io/specification) |

---

## Getting Help During the Hack

- **Ask the facilitator** — they're here to help
- **Check the agent skills** — browse `.github/skills/` for detailed procedures
- **Review AGENTS.md** — the orchestrator prompt explains the full pipeline
- **Use Copilot Chat** — ask `@workspace` questions about the codebase

---

[← Tear Down & Next Steps](07-tear-down.md) | [Back to Welcome](00-welcome.md)
