# Solution 1 — Prerequisites & Environment Setup

**[Home](../Readme.md)** - [Next Challenge Solution >](solution-02.md)

**Duration:** 20 minutes

## Prerequisites

Please ensure you have an Azure subscription with Contributor access, a GitHub account, and an active GitHub Copilot license before continuing.

---

### Task 1: Install required tools (Option A — Local)

Install the following tools if you don't already have them:

**Node.js 20+ and npm 10+:**
- Download from [nodejs.org](https://nodejs.org/) or use a version manager:
    ```bash
    # Windows (winget)
    winget install OpenJS.NodeJS.LTS

    # macOS (brew)
    brew install node@20
    ```

**.NET SDK 9+:**
- Download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/9.0) or:
    ```bash
    # Windows
    winget install Microsoft.DotNet.SDK.9

    # macOS
    brew install dotnet-sdk
    ```

**Azure Developer CLI:**
```bash
# Windows
winget install Microsoft.Azd

# macOS
brew install azd

# Linux
curl -fsSL https://aka.ms/install-azd.sh | bash
```

**GitHub CLI:**
```bash
# Windows
winget install GitHub.cli

# macOS
brew install gh
```

**VS Code Extensions:**
```bash
code --install-extension github.copilot
code --install-extension github.copilot-chat
code --install-extension ms-playwright.playwright
```

💡 Verify all tools are installed:
```bash
node --version       # v20.x+
npm --version        # 10.x+
dotnet --version     # 9.x+
azd version          # Should show a version
gh --version         # Should show a version
git --version        # Should show a version
```

---

### Task 1 (Alternative): Use GitHub Codespaces (Option B)

If you prefer zero local setup:

1. Go to [https://github.com/EmeaAppGbb/shell-typescript](https://github.com/EmeaAppGbb/shell-typescript)
2. Click **"Use this template"** → **"Create a new repository"**
3. Name it (e.g., `my-task-board`) and click **Create repository**
4. On your new repo page, click **"<> Code"** → **"Codespaces"** → **"Create codespace on main"**

⏳ First launch takes 3–5 minutes. The devcontainer automatically installs Node.js, .NET SDK, azd, Docker, Playwright, and all dependencies.

---

### Task 2: Create your repository from the template

```bash
gh repo create my-task-board --template EmeaAppGbb/shell-typescript --public
cd my-task-board
```

---

### Task 3: Install dependencies

```bash
npm install
cd src/web && npm install && cd ../..
cd src/api && npm install && cd ../..
```

💡 If `npm install` fails, delete `node_modules` and `package-lock.json` and retry.

---

### Task 4: Connect to Azure

```bash
azd auth login
```

Follow the browser prompt to authenticate. Then create an environment:

```bash
azd env new microhack
azd env set AZURE_LOCATION eastus
```

💡 If `eastus` has quota issues, try `westeurope` or `swedencentral`.

Verify:
```bash
azd env list
```

You should see your `microhack` environment listed.

---

### Task 5: Verify the repo structure

Open VS Code and confirm these key paths exist:

```
specs/prd.md          ← you'll replace this with your PRD
AGENTS.md             ← the orchestrator prompt (don't edit)
.github/skills/       ← all agent skills (43 of them)
azure.yaml            ← AZD service definitions
infra/                ← Azure Bicep templates
```

You successfully completed Challenge 1! 🚀🚀🚀
