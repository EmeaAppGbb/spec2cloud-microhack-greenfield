# Challenge 1 — Prerequisites & Environment Setup

**[Home](../Readme.md)** - [Next Challenge >](challenge-02.md)

**Duration:** 20 minutes

## Goal

Set up your development environment with all required tools, create your own repository from the spec2cloud template, install dependencies, and connect to Azure — so you're ready to run the full spec-driven pipeline.

## Actions

* Verify you have an **Azure subscription** with Contributor access, a **GitHub account**, and a **GitHub Copilot license**
* Choose your development path: **Option A (Local)** or **Option B (GitHub Codespaces)**
* **Option A — Local:**
    * Install Node.js 20+, npm 10+, .NET SDK 9+, Azure Developer CLI (`azd`), GitHub CLI (`gh`), and Git
    * Install VS Code extensions: GitHub Copilot, GitHub Copilot Chat, Playwright Test for VS Code
* **Option B — Codespaces:**
    * Launch a Codespace from your forked repo (the devcontainer installs everything automatically)
* Create your repository from the template:
    ```bash
    gh repo create my-task-board --template EmeaAppGbb/shell-typescript --public
    git clone https://github.com/<your-org>/my-task-board.git
    cd my-task-board
    ```
* Install dependencies:
    ```bash
    npm install
    cd src/web && npm install && cd ../..
    cd src/api && npm install && cd ../..
    ```
* Log in to Azure and create an AZD environment:
    ```bash
    azd auth login
    azd env new microhack
    azd env set AZURE_LOCATION eastus
    ```

## Success Criteria

* Running `node --version` shows v20.x or later
* Running `npm --version` shows 10.x or later
* Running `dotnet --version` shows 9.x or later
* Running `azd version` returns a version string
* Running `gh --version` returns a version string
* Your repo is created from the template and all `npm install` commands completed without errors
* `azd env list` shows your `microhack` environment
* You can see `specs/prd.md`, `AGENTS.md`, `.github/skills/`, `azure.yaml`, and `infra/` in your workspace

## Learning Resources

* [Azure Developer CLI documentation](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/)
* [GitHub Codespaces overview](https://docs.github.com/en/codespaces/overview)
* [spec2cloud template repository](https://github.com/EmeaAppGbb/shell-typescript)
