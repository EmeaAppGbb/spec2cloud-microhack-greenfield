# Lab 2 — Environment Setup

[← Prerequisites](01-prerequisites.md) | [Next: Write Your PRD →](03-write-your-prd.md)

---

In this lab you'll create your own repo from the template, install dependencies, and connect to Azure. Choose **one** of the two paths below: local development or GitHub Codespaces.

---

## Option A: Local Development

### 2.1 Create your repo from the template

Use the GitHub CLI to create a new repository from the spec2cloud template:

```bash
gh repo create my-task-board --template EmeaAppGbb/shell-typescript --public
cd my-task-board
```

> 📝 **Note:** You can name your repo anything you like. We use `my-task-board` as an example.

### 2.2 Install dependencies

```bash
npm install
cd src/web && npm install && cd ../..
cd src/api && npm install && cd ../..
```

### 2.3 Open in VS Code

```bash
code .
```

### 2.4 Verify the repo structure

Confirm these key files and folders exist in your workspace:

```
specs/prd.md          ← you'll replace this with your PRD
AGENTS.md             ← the orchestrator prompt (don't edit)
.github/skills/       ← all agent skills (43 of them)
azure.yaml            ← AZD service definitions
infra/                ← Azure Bicep templates
```

> 💡 **Tip:** Open the Explorer panel in VS Code (Ctrl+Shift+E / Cmd+Shift+E) and browse through the folder structure to familiarize yourself.

---

## Option B: GitHub Codespaces

If you prefer a zero-install cloud environment, use GitHub Codespaces. The repo includes a fully configured devcontainer that installs everything for you.

### 2.1 Create your repo from the template

1. Go to [https://github.com/EmeaAppGbb/shell-typescript](https://github.com/EmeaAppGbb/shell-typescript)
2. Click **"Use this template"** → **"Create a new repository"**
3. Give it a name (e.g., `my-task-board`) and click **Create repository**

### 2.2 Launch a Codespace

1. On your new repo page, click the green **"<> Code"** button
2. Select the **"Codespaces"** tab
3. Click **"Create codespace on main"**

The devcontainer will automatically:
- Install Node.js 20, .NET SDK, Azure CLI, azd, Docker, and Python
- Run `npm install` for the root, web, and API projects
- Install Playwright browsers and system dependencies
- Install Aspire orchestrator
- Install MkDocs for documentation generation

> ⏳ **First launch takes 3–5 minutes** while the container builds. Subsequent starts are much faster.

### 2.3 Verify the setup

Once the Codespace is ready, open the integrated terminal and run:

```bash
node --version       # Should show v20.x+
azd version          # Should show a version
dotnet --version     # Should show 9.x+
```

---

## Connect to Azure

This step is the same regardless of which option you chose above.

### 2.5 Log in to Azure

```bash
azd auth login
```

Follow the browser prompt to authenticate with your Azure account.

### 2.6 Create an AZD environment

```bash
azd env new microhack
azd env set AZURE_LOCATION eastus
```

> 💡 **Tip:** If `eastus` has quota issues during the hack, try `westeurope` or `swedencentral` instead.

### 2.7 Verify

```bash
azd env list
```

You should see your `microhack` environment listed.

---

## ✅ Checkpoint

Before moving on, confirm:

- [ ] You have a repo created from the template
- [ ] All dependencies are installed (no errors during `npm install`)
- [ ] You can see `specs/prd.md`, `AGENTS.md`, `.github/skills/`, `azure.yaml`, and `infra/` in your workspace
- [ ] `azd env list` shows your `microhack` environment

---

[← Prerequisites](01-prerequisites.md) | [Next: Write Your PRD →](03-write-your-prd.md)
