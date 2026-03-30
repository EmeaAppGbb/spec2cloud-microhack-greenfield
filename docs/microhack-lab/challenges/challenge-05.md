# Challenge 5 — Verify, Celebrate & Tear Down

[< Previous Challenge](challenge-04.md) - **[Home](../Readme.md)**

**Duration:** 15 minutes

## Goal

Manually verify your live application against your original PRD user stories, explore the Azure resources that were provisioned, and then tear down the infrastructure to avoid ongoing charges.

## Actions

* Retrieve your deployed app URL:
    ```bash
    azd env get-values | grep SERVICE_WEB_ENDPOINT_URL
    ```
* Open the URL in your browser and manually verify each user story from your PRD:
    * **Create Tasks** — create tasks, verify they appear in "To Do", test empty title validation
    * **View the Board** — confirm three columns (To Do, In Progress, Done) with task counts
    * **Move Tasks** — move tasks between columns, verify one-step-at-a-time constraint
    * **Edit a Task** — edit title/description, verify empty title is prevented
    * **Delete a Task** — delete with confirmation prompt, verify immediate removal
* Explore your Azure resources in the [Azure Portal](https://portal.azure.com) (Container Apps, Container Registry, Application Insights, Log Analytics)
* Tear down all Azure resources:
    ```bash
    azd down
    ```

## Success Criteria

* All user stories from your original PRD work correctly in the live app
* You can identify the provisioned Azure resources in the portal (Container Apps, ACR, Application Insights)
* `azd down` completes successfully — all Azure resources are removed
* Your code and specs remain in your Git repository

## Learning Resources

* [Azure Container Apps overview](https://learn.microsoft.com/en-us/azure/container-apps/overview)
* [Application Insights overview](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
* [Azure Developer CLI `azd down`](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/reference#azd-down)
