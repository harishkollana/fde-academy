# Stage 2 · Microsoft Power Platform (kept separate from Azure)

Prerequisites: `foundations` (HTTP, auth), `sql`, `python` basics. Power Platform is taught as its own world: low-code, SaaS, run by Microsoft's connectors. APIs and web apps come in Stage 3 and Azure in Stage 4. Line format: `- [✅] \`lesson-id\` Title — covers`.

**Setup note for the whole stage.** Which Microsoft 365 / Power Platform account you can use (work tenant, developer tenant, trial) changes over time and depends on your employer's rules. The first lesson of each phase tells you how to check what you have and what to do if you have nothing. Never use your employer's tenant for personal portfolio work if their policy forbids it.

---
## Phase 6 · `power-automate` — Power Automate · ◆ plus · 11 lessons

**Why companies need it.** Indian enterprises already pay for Microsoft 365. "Intelligent Automation Engineer" and "Power Platform Developer" roles are about cloud flows, approvals, SharePoint/Teams/Outlook/Excel and governance. Interviews ask error handling, licensing limits and ALM.
**Concept-first.** Trigger → actions → connectors → connections; environments; why a flow runs as a *connection owner*, not as "the user".
**Browser-runnable:** FlowSimulator, quizzes, sketches, expression logic simulated in Python. **Laptop:** the real flows.

### Module A · Concepts
- `power-automate-ecosystem` The Power Platform map — Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse; tenants, environments, solutions, DLP policies; cloud vs desktop flows (and why desktop RPA is out of scope)
- `power-automate-basics` Your first cloud flow — triggers (automated, instant, scheduled), actions, dynamic content, run history, testing

### Module B · Building flows
- `power-automate-expressions` Expressions and data operations — expression functions, variables, Compose, Select, Filter array, Join, Parse JSON, dates, strings
- `power-automate-logic` Control flow — Condition, Switch, Apply to each, Do until, concurrency, scopes
- `power-automate-sharepoint-excel-outlook` SharePoint, OneDrive, Excel and Outlook — libraries and lists, file triggers, Excel Online tables and their pitfalls, mail actions, attachments
- `power-automate-approvals-teams` Approvals and Teams — approval types, adaptive cards, posting to channels, waiting for a response
- `power-automate-http-custom-connectors` HTTP and custom connectors — HTTP action, auth options, calling an Azure Function or REST API, custom connector basics, premium implications

### Module C · Reliability and operations
- `power-automate-errors` Error handling — Configure run after, scopes as try/catch, retry policies, timeouts, logging to a SharePoint list; FlowSimulator
- `power-automate-child-flows-scheduling` Child flows, schedules and limits — child flows, recurrence, throttling and platform limits, designing for idempotency
- `power-automate-alm-governance` Solutions, ALM and governance — solutions, environment variables, connection references, export/import, ownership, DLP, monitoring
- `power-automate-licensing` Licensing and premium connectors — what needs premium (HTTP etc.), seeded vs per-user vs per-flow concepts, the developer plan if available; **never state prices: check the current Microsoft page**

**Lab.** A SharePoint file-arrival → approval → email flow with try/catch logging (becomes part of Project B).
**Interview questions:** Cloud flow vs desktop flow · What is a connection reference? · How do you handle failures in a flow? · Why did my flow stop after N days/hits a limit? · How do you move a flow dev → prod? · When would you call an Azure Function instead of building in the flow?

---
## Phase 7 · `power-bi` — Power BI · ◆ plus · 10 lessons

**Why companies need it.** Power BI is the default BI tool in Microsoft shops and is already on Harish's resume headline. Interviews test the data model (star schema), DAX filter context, refresh and security.
**Concept-first.** A report is a *view on a semantic model*; the model, not the visual, is where correctness lives.
**Setup.** Power BI Desktop (Windows only) is free; publishing needs an account. Browser: sketches, DAX logic explained with SQL equivalents.

- `power-bi-architecture` Power BI architecture — Desktop vs Service, workspaces, semantic models, Import vs DirectQuery vs composite vs Direct Lake, licensing concepts
- `power-bi-power-query` Power Query — M basics, transformations, query folding, parameters
- `power-bi-modelling` Data modelling in Power BI — star schema, relationships, cardinality, filter direction, role-playing dates, calendar tables
- `power-bi-dax-basics` DAX fundamentals — measures vs calculated columns, row vs filter context, CALCULATE, iterators
- `power-bi-dax-time-intelligence` Time intelligence — YTD, MTD, prior period, fiscal calendar April–March, custom calendars
- `power-bi-visual-design` Reports that get used — choosing visuals, KPIs, drill-through, tooltips, bookmarks, accessibility
- `power-bi-security-rls` Security — row-level security (static and dynamic), object-level security, workspace roles
- `power-bi-service-refresh` Service, gateways and refresh — publishing, scheduled and incremental refresh, gateways, deployment pipelines, paginated reports
- `power-bi-performance-governance` Performance and governance — VertiPaq, aggregations, DAX Studio concept, certified datasets, lineage view
- `power-bi-finance-lab` Lab: budget-vs-actual report on Kollana Tech (also the report Project A and B point to)

**Interview questions:** Row context vs filter context · CALCULATE: what does it do? · Import vs DirectQuery · Why a star schema in Power BI? · How do you implement RLS? · Why is my report slow?

---
## Phase 8 · `copilot-studio` — Copilot Studio · ○ breadth · 6 lessons

**Why companies need it.** Agent builders in Microsoft shops; a short phase because it builds on Power Automate.
**Concept-first.** An agent = instructions + knowledge + actions + channels.

- `copilot-studio-concepts` Agents, topics and generative answers — what Copilot Studio is, agents vs bots, knowledge sources
- `copilot-studio-build-agent` Build an agent — topics, entities, variables, authoring
- `copilot-studio-actions-flows` Actions and flows — calling Power Automate flows and connectors
- `copilot-studio-knowledge-security` Knowledge and security — grounding on SharePoint, authentication, DLP, analytics
- `copilot-studio-publish-alm` Publish and manage — Teams and web channels, solutions, ALM
- `copilot-studio-lab` Lab: an agent that triggers the GST reconciliation flow

**Interview questions:** How does the agent decide to call an action? · How do you stop it answering from outside its knowledge? · Where does it authenticate?
