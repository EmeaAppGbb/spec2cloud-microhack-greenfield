# Lab 1 — Prerequisites

[← Back to Welcome](00-welcome.md) | [Next: Environment Setup →](02-environment-setup.md)

---

Choose your development environment below. Both paths converge in [Lab 2](02-environment-setup.md).

---

## Common Requirements (Both Options)

You need these regardless of which option you choose:

| Requirement | Details |
|-------------|---------|
| **Azure subscription** | With **Contributor** access. If you don't have one, ask your facilitator or create a [free Azure account](https://azure.microsoft.com/free/) |
| **GitHub account** | Required to fork the template repo and use Copilot |
| **GitHub Copilot license** | Active subscription (individual, business, or enterprise) |

---

## Option A: Local Development

Install the following tools on your machine:

### Required Tools

| Tool | Version | How to Check |
|------|---------|--------------|
| **Node.js** | 20+ | `node --version` |
| **npm** | 10+ | `npm --version` |
| **.NET SDK** | 9+ | `dotnet --version` (required for Aspire) |
| **Azure Developer CLI (azd)** | Latest | `azd version` |
| **GitHub CLI** | Latest | `gh --version` |
| **Git** | Latest | `git --version` |

#### Install azd

- **Windows:** `winget install Microsoft.Azd`
- **macOS:** `brew install azd`
- **Linux:** `curl -fsSL https://aka.ms/install-azd.sh | bash`

### VS Code Extensions

Make sure these extensions are installed in VS Code:

| Extension | ID |
|-----------|----|
| **GitHub Copilot** | `github.copilot` |
| **GitHub Copilot Chat** | `github.copilot-chat` |
| **Playwright Test for VS Code** | `ms-playwright.playwright` |

> 💡 **Tip:** You can install extensions from the command line:
> ```bash
> code --install-extension github.copilot
> code --install-extension github.copilot-chat
> code --install-extension ms-playwright.playwright
> ```

### ✅ Checklist — Option A

Run through these commands to verify everything is ready:

```bash
node --version       # Should show v20.x or later
npm --version        # Should show 10.x or later
dotnet --version     # Should show 9.x or later
azd version          # Should show a version string
gh --version         # Should show a version string
git --version        # Should show a version string
```

If any of these fail, install the missing tool before continuing.

---

## Option B: GitHub Codespaces

If you prefer not to install anything locally, you can use **GitHub Codespaces**. The repository includes a fully configured devcontainer that installs **all tools automatically** — Node.js, .NET SDK, azd, Docker, Playwright, Python, and MkDocs.

### What you need

| Requirement | Details |
|-------------|---------|
| **A modern browser** | Chrome, Edge, or Firefox |
| **GitHub Codespaces access** | Included with GitHub Free (60 hours/month) or any paid plan |

That's it — no local installation required. The devcontainer handles everything else.

### ✅ Checklist — Option B

- [ ] You can access [github.com](https://github.com) in your browser
- [ ] You have Codespaces hours available (check [github.com/settings/billing](https://github.com/settings/billing))

---

[← Back to Welcome](00-welcome.md) | [Next: Environment Setup →](02-environment-setup.md)
