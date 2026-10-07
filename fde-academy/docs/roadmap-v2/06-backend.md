# Stage 5 · Ship it: containers, CI/CD and Azure deploy

Prerequisites: Stage 3 (`http-rest`, `fastapi`, `react-dashboards`), Stage 4 (`azure`, `entra`), `python`, `foundations` (HTTP, TLS, auth, load balancing). The APIs and the React app are built in Stage 3 and Azure is learned in Stage 4; this stage packages them (Docker), automates them (GitHub Actions), deploys the API (Container Apps) and then joins every Azure piece into one working data product (`azure-e2e`). Closes with **Project C + Gate C**. Line format: `- [✅] \`lesson-id\` Title — covers`.

---
## Phase 15 · `docker` — Docker · ★ core · 8 lessons

**Why companies need it.** Everything ships as a container. Interviews ask image layers, caching, volumes, networking and security.
**Concept-first.** What a container really is (a process with isolated filesystem/network/limits) vs a VM.
**Setup.** Docker Desktop on Windows with WSL2 (check the current licence terms) or Podman.
**Browser-runnable:** DockerCache widget; **laptop:** all labs.

- `docker-concepts` Containers vs VMs — namespaces and cgroups in plain words, images, layers, registries
- `docker-install-windows` Install on Windows — WSL2 backend, Docker Desktop vs alternatives, first container, common errors
- `docker-dockerfile` Writing Dockerfiles — instructions, layer cache order, multi-stage builds, slim images, non-root user; DockerCache
- `docker-run-volumes-networking` Running containers — ports, volumes vs bind mounts, networks, env vars, logs, exec
- `docker-compose` Docker Compose — API + Postgres + Adminer, healthchecks, depends_on, profiles, `.env`
- `docker-security-debugging` Security and debugging — scanning, secrets, resource limits, "why won't it start"
- `docker-registries` Registries — Docker Hub, GitHub Container Registry, Azure Container Registry, tags vs digests
- `docker-lab` Lab: containerise the FastAPI service with Postgres via Compose, then add the React app as an nginx container (the multi-stage build from `react-dashboards-cors-build-serve`)

**Interview questions:** Image vs container · Why order Dockerfile instructions carefully? · Volume vs bind mount · How do containers talk to each other? · How do you keep secrets out of images? · CMD vs ENTRYPOINT.

---
## Phase 16 · `github-actions` — GitHub Actions (CI/CD) · ★ core · 6 lessons

**Concept-first.** Event → workflow → jobs → steps on a runner; CI vs CD.

- `github-actions-concepts` Workflows, events, jobs, runners — YAML anatomy, triggers, matrix
- `github-actions-ci-python` CI for Python — Ruff + pytest, caching, matrix, status checks, branch protection
- `github-actions-docker-build` Build and push images — GHCR / ACR, tags, caching layers
- `github-actions-secrets-oidc` Secrets, environments and OIDC to Azure — federated credentials (no stored cloud keys), environment approvals
- `github-actions-cd-deploy` Continuous deployment — deploy on merge, rollbacks, environments
- `github-actions-security` Hardening — least-privilege tokens, pinning actions, Dependabot

**Interview questions:** CI vs CD vs continuous delivery · How do you avoid storing cloud credentials in GitHub? · How do you speed up CI? · How do you roll back a bad deploy?

---
## Phase 17 · `azure-deploy` — Deploying to Azure (Container Apps) · ◆ plus · 8 lessons

**Concept-first.** Image → registry → managed runtime with ingress, scale rules, identity, secrets and telemetry. This phase teaches each piece on its own; the next phase (`azure-e2e`) joins them with a database, storage and a React front end.

- `azure-deploy-acr` Azure Container Registry — push, pull, tags, access via managed identity
- `azure-deploy-container-apps` Container Apps — environments, ingress, revisions, scaling (including to zero), traffic splitting
- `azure-deploy-app-service` App Service alternative — when to prefer it, slots, plans
- `azure-deploy-secrets-identity` Secrets and identity — Key Vault references, managed identity to Postgres/Storage
- `azure-deploy-observability` App Insights — logs, traces, metrics, availability tests, alerts
- `azure-deploy-domain-tls` Custom domain and TLS — DNS records, certificates, Front Door / App Gateway recap
- `azure-deploy-cicd-pipeline` The full pipeline — GitHub Actions → ACR → Container Apps with OIDC
- `azure-deploy-cost-reliability` Cost and reliability — scale-to-zero trade-offs, probes, zero-downtime deploys, budgets

**Interview questions:** Container Apps vs App Service vs AKS vs Functions · How do you do zero-downtime deploys? · Where do secrets live? · How do you debug a container that crashes on Azure? · How do you scale this API?

---
## Phase 18 · `azure-e2e` — The end-to-end Azure data product (React app on top) · ◆ plus · 13 lessons

**Why companies need it.** A forward-deployed or automation engineer is asked to deliver a working product inside the customer's Azure: files come in, data lands in a database, an API serves it, a signed-in user works in a web screen, and someone can see when it breaks. Individual services are easy to learn; the hard part is **connecting them**: networking, identity and permissions between every pair. Interviews ask "walk me through how your app reaches its database and how a user is authenticated".
**Concept-first.** One product drawn as boxes and arrows. Every arrow answers three questions: *can it reach* (network and firewall), *who is it* (identity), *may it* (permission). Most "it doesn't work" problems are one of these three on one arrow.
**Setup.** The Azure account, budget and alerts from `azure`; everything in one resource group, tagged, deleted at the end. The product reuses Project C's payroll data and API and the React app from `react-dashboards`.
**Laptop:** all labs (Azure CLI in PowerShell, Docker, Node.js). Each lesson ends with a "what exists now" check and a "delete it" step; no lesson states prices.

### Module A · Design the product
- `azure-e2e-architecture` The product and its connection map — the Kollana payroll-validation product as boxes (files in Blob → loader → PostgreSQL → FastAPI on Container Apps → React app, a signed-in reviewer, App Insights watching); one table that lists, for every arrow, the protocol and port, the credential (managed identity, token, Key Vault secret) and what allows it (RBAC role, firewall rule, CORS); naming and tags, build order, teardown order; what we chose and what we did not (VM, AKS, Functions) and why

### Module B · The data and API tiers on Azure
- `azure-e2e-foundation` Provision the foundation with `az` — one resource group, Log Analytics and Application Insights, a storage account with raw and processed containers, a PostgreSQL Flexible Server, Key Vault, Container Registry and a Container Apps environment; one re-runnable PowerShell script, budget check first, a "what exists now" checklist
- `azure-e2e-load-data` From Blob to PostgreSQL — upload the Kollana payroll files to the raw container, a Python loader using `DefaultAzureCredential` and the Blob SDK, the RBAC role your own user needs on the storage account, validate and load with `COPY`, safe re-runs (idempotent), move files to processed, run it locally first
- `azure-e2e-database-access` Database access done properly — an Entra admin on PostgreSQL, token login vs a password kept in Key Vault, one database role for the API and one read-only role, `GRANT` with least privilege, SSL, firewall rule vs private access, a "cannot connect" triage by layer (DNS, network, TLS, login, permission)
- `azure-e2e-api-container-apps` The API on Container Apps — the image into ACR, a Container App with a system-assigned managed identity, secrets through Key Vault references, ingress and health probes, environment variables, revisions, logs; reaching PostgreSQL and Blob with no password in code

### Module C · Identity and the React app
- `azure-e2e-secure-api-roles` Secure the API with Entra — the API registration from `entra-register-api-and-spa` wired into FastAPI: validate issuer, audience and signature, scopes vs app roles, map roles to uploader / reviewer / admin, call the API with a token from the CLI before any screen exists, 401 vs 403
- `azure-e2e-react-msal-login` Sign in from React — MSAL for React: provider, redirect vs popup sign-in, scopes, silent token acquisition, sign-out, reading roles from the token, the failures people hit (redirect URI mismatch, wrong tenant, missing consent), and why no secret exists in the browser
- `azure-e2e-react-calls-api` The reviewer app talks to the API — attach the bearer token to every request, handle 401 and 403, CORS on the API, hide buttons by role (the server still enforces), upload a payroll file and watch the job status, the exceptions table and resolve action from `react-dashboards-lab`

### Module D · Host, ship and operate
- `azure-e2e-host-react` Host the React app — three options (Static Web Apps, a Blob static website behind a CDN or Front Door, an nginx container on Container Apps), choosing one, deploying the build, single-page fallback, build-time configuration (public by design), updating the redirect URIs, same-origin proxy vs cross-origin CORS
- `azure-e2e-vm-variant` Variant: the same product on a virtual machine — Docker Compose on the Linux VM from `azure-vm-lab`, an nginx reverse proxy and TLS, an NSG with only 80 and 443 open, the VM's managed identity reaching PostgreSQL and Blob, patching and backups are now your job; when this beats Container Apps and when it does not
- `azure-e2e-cicd` One pipeline per tier — GitHub Actions with OIDC (no stored keys): API image → ACR → new Container Apps revision, React build → hosting, environments and approval, a smoke test that hits `/health` and checks the sign-in page loads
- `azure-e2e-troubleshooting` Operate and debug the whole chain — App Insights from the browser through the API to the database, availability test and alerts, a failure table by arrow (a long timeout usually means a firewall; `password authentication failed`; `AADSTS50011` redirect mismatch; 401 vs 403; CORS preflight; 502 from ingress; crash loop; `AuthorizationPermissionMismatch`; Key Vault `Forbidden`), cost review, tear down in the right order
- `azure-e2e-lab` Lab: ship the product — a checklist from an empty subscription to a signed-in React screen that shows exceptions from PostgreSQL, a README with the architecture diagram and connection table, screenshots, a walkthrough video, delete the resource group

### Project C · Payroll Bank Mandate Validation: API and Web App (`proj-c`) + Gate C
Follows PDF Project 2, steps 1–6, then adds steps 7–8 (V2 revision, 5 Oct 2026): synthetic employee master and payroll files (injected: invalid IFSC, duplicate account, name mismatch, salary jump, missing PAN) → Postgres schema (employees, payroll_runs, files, validation_results, exceptions, users, audit_logs) → FastAPI endpoints (upload as background job, job status, paginated filterable exceptions, resolve with audit) → rules as small tested functions configurable in YAML (IFSC regex, account length, duplicates, fuzzy name, salary outlier, mandatory fields) → JWT roles uploader/reviewer/admin and masked account numbers → docker compose, pytest, GitHub Actions CI, deploy to Azure with Key Vault and App Insights, `/docs` screenshot and video → **step 7: land the files through Blob into Azure PostgreSQL** (managed identity, least-privilege roles) → **step 8: the React reviewer web app** (upload, exceptions table with filters, resolve with audit) signed in with Entra ID, calling the API with a token, hosted on Azure, one pipeline per tier, README with the architecture diagram and connection table, and a walkthrough video.
**Interview questions:** Walk me through how a user's click becomes a database row, and who is authenticated at each hop · App registration vs managed identity: which is used where in your product? · The React app gets a CORS error: what do you check? · How do you give an API access to a database without a password? · VM vs Container Apps for this API · What breaks first when you move from your laptop to Azure, and why? · Container Apps vs App Service vs AKS vs Functions · How do you do zero-downtime deploys? · How do you debug a container that crashes on Azure?
