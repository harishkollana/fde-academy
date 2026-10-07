# Stage 11 · Career, and the optional extended track

Line format: `- [✅] \`lesson-id\` Title — covers`. System-design practice and mock interviews (from the PDF) can run alongside any phase once you start applying; Stage 11 makes them systematic.

---
## Phase 38 · `system-design` — System design for data and AI · ★ core · 9 lessons

**Concept-first.** Requirements → estimates → components → data flow → failure modes → trade-offs. Always say the trade-off out loud.

- `system-design-framework` A framework you can say out loud — requirements, scale estimates, API and data model, bottlenecks, trade-offs
- `system-design-batch-pipeline` Design: nightly finance data pipeline — ingestion, validation, warehouse, orchestration, recovery
- `system-design-streaming` Design: real-time order analytics — Kafka, stream processing, serving, exactly-once reality
- `system-design-ai-document-pipeline` Design: AI document pipeline — intake, OCR/extraction, validation, review, load
- `system-design-support-agent` Design: customer-support agent — RAG, tools, escalation, evaluation
- `system-design-rag-10000-pdfs` Design: RAG over 10,000 PDFs — ingestion at scale, chunking, index, permissions, freshness
- `system-design-safe-action-agent` Design: an agent that takes actions safely — approvals, limits, audit, rollback
- `system-design-multi-tenant-platform` Design: multi-tenant data platform — isolation, cost, noisy neighbours, onboarding
- `system-design-security-cost-reliability` Cross-cutting: security, cost and reliability checklists — the questions to ask every time

**Interview questions:** Design the pipeline for … · Where does this break at 100× scale? · How would you secure it? · What would you monitor? · What is the cheapest version that works?

---
## Phase 39 · `fde-craft` — The Forward Deployed Engineer craft · ★ core · 6 lessons

**Why companies need it.** An FDE is engineer + consultant: embedded with a customer, turning a messy process into working software. Technical depth alone does not get you hired or retained.

- `fde-craft-role-landscape` The role — FDE vs software engineer vs solutions engineer vs consultant; where FDEs work in India and remote ("check the current market")
- `fde-craft-discovery-scoping` Discovery and scoping — interviewing users, mapping the process, finding the real problem, ROI, saying no
- `fde-craft-demos-communication` Demos and communication — storytelling, executive updates, written one-pagers, explaining trade-offs to non-engineers
- `fde-craft-delivery-uat` Delivery — onboarding, UAT, change management, handling pushback, handover and documentation
- `fde-craft-working-with-it-security` Working with IT and security — access requests, data classification, approvals, living inside customer constraints
- `fde-craft-portfolio-storytelling` Telling your story — the six STAR stories without client names, turning day-job impact into numbers (2–3 days → 30 minutes)

---
## Phase 40 · `interview-prep` — Interview bootcamp · ★ core · 6 lessons

- `interview-prep-timed-sql-python` Timed SQL and Python — the 45-minute format, thinking aloud, recovering from a blank
- `interview-prep-star-stories` STAR stories — the six prompts from the PDF, delivery in two minutes
- `interview-prep-system-design-practice` System design practice — a practice routine you choose and a self-review rubric
- `interview-prep-mock-plan` Mock interviews — who to ask, how to run one, how to give and get feedback
- `interview-prep-resume-linkedin-portfolio` Resume, LinkedIn and portfolio — headline, domain groupings without client names, a Projects section with GitHub links
- `interview-prep-offers-negotiation` Offers and negotiation — comparing offers, notice periods, negotiating without invented numbers ("verify against current bands")

---
# Optional extended track (do when a job asks)
Not on the timeline. Same lesson format. Open these only when a target job needs them.

## X1 · `kubernetes` — Kubernetes · ○ · 6 lessons
- `kubernetes-concepts` Why Kubernetes — pods, nodes, control plane, desired state
- `kubernetes-local-cluster` A local cluster — kind/minikube or Docker Desktop, kubectl
- `kubernetes-workloads` Workloads — Deployments, Services, Jobs, CronJobs, probes
- `kubernetes-config-secrets-storage` Config, secrets and storage — ConfigMaps, Secrets, volumes
- `kubernetes-networking-ingress` Networking and ingress — Services, ingress controllers, load balancing
- `kubernetes-aks-lab` Lab: deploy the API to AKS and compare with Container Apps

## X2 · `terraform` — Terraform · ○ · 5 lessons
- `terraform-concepts` IaC and Terraform concepts — declarative, providers, plan/apply
- `terraform-config-state` Configuration and state — resources, variables, outputs, remote state
- `terraform-modules-variables` Modules and environments — reuse, workspaces vs folders
- `terraform-azure-lab` Lab: the landing zone as code — resource group, storage, Key Vault
- `terraform-ci` Terraform in CI — plan on PR, apply on merge, drift

## X3 · `bicep` — Azure Bicep · ○ · 4 lessons
- `bicep-concepts` Bicep concepts — ARM, declarative templates, `az deployment`
- `bicep-resources-params` Resources and parameters — syntax, parameters, outputs
- `bicep-modules-deploy` Modules and deployment — modules, scopes, what-if
- `bicep-lab` Lab: deploy the Azure landing zone and the Container App with Bicep

## X4 · `fabric` — Microsoft Fabric · ○ · 7 lessons
- `fabric-concepts` What Fabric is — workloads, OneLake, capacities
- `fabric-lakehouse-onelake` Lakehouse and OneLake — Delta tables, shortcuts
- `fabric-pipelines-dataflows` Pipelines and Dataflows Gen2
- `fabric-warehouse` Fabric Warehouse and SQL endpoints
- `fabric-direct-lake-power-bi` Direct Lake and Power BI
- `fabric-governance-capacity` Governance, security and capacity — cost control
- `fabric-lab` Lab: Kollana medallion in Fabric

## X5 · `duckdb` — DuckDB · ○ · 5 lessons
- `duckdb-concepts` Why an in-process analytical database
- `duckdb-sql-parquet` SQL over Parquet and CSV
- `duckdb-python-integration` DuckDB with Python and pandas
- `duckdb-vs-others` DuckDB vs pandas vs Spark vs warehouses — choosing
- `duckdb-lab` Lab: analytics on laptop-sized data

## X6 · `redis` — Redis · ○ · 4 lessons
- `redis-concepts` What Redis is and is not
- `redis-data-structures` Strings, hashes, lists, sets, sorted sets, TTLs
- `redis-caching-queues` Caching patterns, rate limiting and simple queues
- `redis-lab` Lab: cache the API's slowest endpoint and add a rate limit
