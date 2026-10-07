# Stage 4 · Microsoft Azure (separate from Power Platform)

Prerequisites: `foundations` (networking, DNS, TLS, load balancing, OAuth/OIDC concepts), `python`, and Stage 3 (`http-rest`, `fastapi`, `react-dashboards`: the Azure labs secure and host the API and React app you already know how to build). Stage 4 teaches Azure as a cloud: the resource model, storage, **databases you can connect to**, **virtual machines**, networking, **how identity and auth really work in Entra ID** (including registering a web API and a single-page app), and serverless. Closes with **Project B + Gate B**. The full "React app + API + database + storage on Azure" build is the capstone `azure-e2e` in Stage 5, after Docker and CI/CD. Line format: `- [✅] \`lesson-id\` Title — covers`.

**Cost safety first.** The very first Azure lesson sets a budget and alerts and explains the free account (it asks for a card for identity verification; "check the current offer"). Every lab ends with a "delete the resource group" step. No lesson states prices.

---
## Phase 12 · `azure` — Azure fundamentals · ★ core · 14 lessons

**Why companies need it.** Most Indian enterprise data and automation roles run on Azure. Interviews ask the resource model, storage tiers/redundancy, networking and load-balancing choices, and monitoring.
**Concept-first.** Tenant → subscription → resource group → resource; control plane vs data plane; regions and availability zones; the shared-responsibility model.

### Module A · Concepts and setup
- `azure-cloud-concepts` Cloud concepts — IaaS/PaaS/SaaS/serverless, shared responsibility, regions and availability zones, pricing models in principle
- `azure-account-portal-cli` Account, portal and CLI — free account, tenant/subscription/management groups/resource groups, tags and naming, Portal, Cloud Shell, `az` CLI, PowerShell
- `azure-cost-management` Cost management and budgets — budgets and alerts, cost analysis, tags, shutting things down, FinOps hygiene *(do this before creating anything else)*

### Module B · Storage and data services
- `azure-storage-blob-adls` Storage accounts, Blob and ADLS Gen2 — redundancy (LRS/ZRS/GRS), access tiers, hierarchical namespace, SAS vs keys vs RBAC, lifecycle rules, soft delete
- `azure-databases` Azure databases overview — Azure SQL Database / Managed Instance, PostgreSQL Flexible Server, Cosmos DB, Synapse and Fabric in one page; choosing
- `azure-postgres-lab` Lab: Azure Database for PostgreSQL — create a Flexible Server, admin login, firewall rule for your own IP, SSL, connect with `psql`, DBeaver and Python (psycopg), how a connection string is built, load the Kollana CSVs, a read-only role, the five most common connection errors (timeout means firewall, password failed, SSL required, wrong host, wrong database), tear down
- `azure-sql-lab` Lab: Azure SQL Database — logical server vs database, serverless vs provisioned (concept, "check the current offer"), firewall rules and "allow Azure services", connect with a SQL client and `pyodbc` plus the ODBC driver (check the current driver name), T-SQL vs PostgreSQL differences, load a table, tear down

### Module C · Compute, network and load balancing
- `azure-compute-options` Compute options — VMs, App Service, Functions, Container Apps, AKS: how to choose
- `azure-networking-vnet` Virtual networks — VNet, subnets, NSGs, service vs private endpoints, DNS, peering, VPN/ExpressRoute concepts
- `azure-vm-lab` Lab: a Linux virtual machine — image and size choice (no prices), resource group and NSG, SSH-key login from PowerShell, open one port and no more, install and run a small web service, managed disk and public IP, a system-assigned managed identity on the VM, auto-shutdown, stop vs deallocate, Bastion as the safer door (concept), RDP for a Windows VM, delete everything
- `azure-load-balancing` Load balancing in Azure — Load Balancer (L4), Application Gateway + WAF (L7), Front Door (global), Traffic Manager (DNS); health probes; a decision tree; LoadBalancer simulator

### Module D · Operate
- `azure-monitor-logging` Monitor and logging — Azure Monitor, Log Analytics, KQL basics, App Insights, alerts
- `azure-vs-aws-gcp` Azure vs AWS vs GCP — service equivalents cheat sheet so you can talk to any team
- `azure-lab-data-landing-zone` Lab: a secure data landing zone — resource group, storage with RBAC, upload Kollana data, budget alert, tear down

**Interview questions:** Subscription vs resource group · Blob vs ADLS Gen2 · LRS vs ZRS vs GRS · Service endpoint vs private endpoint · Load Balancer vs Application Gateway vs Front Door · Which compute for a small API, a batch job, an event handler? · When is a VM still the right answer? · Your app cannot reach the database: what do you check first? · How do you control cost?

---
## Phase 13 · `entra` — Microsoft Entra ID and Azure security · ★ core · 12 lessons

**Why companies need it.** "How does authentication work in your Azure app?" is a standard senior-ish question and a practical blocker in every deployment (permissions, secrets, tokens). Most production incidents on Azure are identity or network.
**Concept-first.** The sequence browser → app → Entra ID → API, with tokens and claims at each hop. (Builds directly on the `foundations` OAuth/OIDC lessons.)
**Setup.** Your tenant; a free Entra directory if you have no work tenant ("check the current options").

- `entra-concepts` Entra ID concepts — tenants and directories, users/groups/licences, B2B guests, External ID (B2C) concept, hybrid identity concept; the Azure AD → Entra rename
- `entra-rbac-azure` Roles and RBAC — Entra roles vs Azure RBAC, scopes and inheritance, role assignments, custom roles, PIM concept, least privilege
- `entra-app-registrations` App registrations and service principals — registration vs enterprise app, secrets vs certificates, redirect URIs, API permissions, admin consent
- `entra-register-api-and-spa` Register an API and a single-page app — the three registrations the capstone uses (web API, single-page app, background daemon), Application ID URI and scopes, app roles, the SPA platform and redirect URIs (why a SPA has no secret), API permissions and admin consent, assigning users to roles, the same steps with `az ad app` commands, a checklist the `azure-e2e` capstone starts from
- `entra-oauth-oidc-in-practice` OAuth and OIDC in practice — auth code + PKCE, client credentials with MSAL in Python, scopes and `.default`, reading and validating tokens and claims; OAuthFlow
- `entra-managed-identity` Managed identities — system vs user assigned, `DefaultAzureCredential`, no secrets in code
- `entra-key-vault` Key Vault — secrets, keys, certificates, RBAC vs access policies, rotation, Key Vault references
- `entra-conditional-access-mfa-sso` Conditional Access, MFA and SSO — policies, MFA methods, SSO to SaaS apps via OIDC/SAML
- `entra-graph-api` Microsoft Graph — delegated vs application permissions, reading users, SharePoint and Teams data
- `entra-protect-your-api` Protecting your own API — validating Entra tokens in the FastAPI service you built in Stage 3, app roles, on-behalf-of flow concept
- `entra-security-posture` Security posture — Defender for Cloud concept, Azure Policy, audit logs, threat modelling a data product
- `entra-auth-end-to-end` End-to-end: how a request is authenticated — one worked example from browser click to database row, with the 10 most common failure messages and fixes

**Lab.** Register an app, get a token with client credentials, call Microsoft Graph, then call your own API using a managed identity. (The React single-page app that signs users in is built in `azure-e2e`, Stage 5.)
**Interview questions:** App registration vs enterprise application · Why does a single-page app have no client secret? · Delegated vs application permissions · Service principal vs managed identity · How do you avoid secrets in code? · Walk me through OIDC sign-in · Access token vs ID token · How do you validate a JWT? · What does Conditional Access do?

---
## Phase 14 · `azure-functions` — Azure Functions · ◆ plus · 7 lessons

**Why companies need it.** The standard way to put a small Python service behind Power Automate, Event Grid or a timer. Interviews ask triggers/bindings, hosting plans and cold starts.
**Concept-first.** Event → function → output; scale to zero; cold start; stateless.

- `azure-functions-serverless-concepts` Serverless and Functions concepts — events, triggers and bindings, hosting plans (Consumption, Flex Consumption, Premium, Dedicated), cold starts, scaling
- `azure-functions-local-dev` Local development — Core Tools, VS Code, the Python v2 programming model, debugging
- `azure-functions-http-trigger` HTTP-triggered functions — routes, auth levels, request validation with Pydantic, responses, errors
- `azure-functions-triggers-bindings` Other triggers — timer, blob, queue, Event Grid, Service Bus; Durable Functions concept; idempotency
- `azure-functions-config-identity` Configuration and identity — app settings, Key Vault references, managed identity to Storage/SQL
- `azure-functions-deploy-monitor` Deploy and monitor — zip deploy, GitHub Actions, App Insights, retries and poison messages
- `azure-functions-lab` Lab: the reconciliation function — match on GSTIN + invoice + amount with tolerance, fuzzy typos, Excel report out

### Project B · GST Reconciliation in the Cloud (`proj-b`) + Gate B
Follows PDF Project 1, steps 1–5: synthetic purchase register and supplier invoices (Excel) → SharePoint library (Incoming / Processed / Exceptions) + run-log list → Azure Function (match, classify, Excel report) → Power Automate (trigger, call function, Teams adaptive card + approval, email or move to Exceptions, error scope) → Power BI page on reconciliation status and ageing, README with architecture diagram and flow screenshots, walkthrough video. Secrets in Key Vault; function uses a managed identity.
**Interview questions:** Consumption vs Premium vs Flex · What is a trigger vs a binding? · How do you make a function idempotent? · How do you secure a function called from Power Automate? · Cold start: causes and fixes.
