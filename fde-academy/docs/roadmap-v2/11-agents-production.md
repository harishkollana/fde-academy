# Stage 10 · Agents and production

Prerequisites: all of Stage 9, `fastapi`, `azure-deploy`, `azure-e2e`, `docker`. Closes with **Project G (flagship) + Gate G**. Line format: `- [✅] \`lesson-id\` Title — covers`.

---
## Phase 35 · `langgraph` — Agents with LangGraph · ★ core · 8 lessons

**Why companies need it.** Forward-deployed work is increasingly "build an agent that does a real business process safely". LangGraph is the common way to make agent flows explicit and controllable.
**Concept-first.** Workflows vs agents: prefer the least autonomy that solves the problem; state machines make behaviour testable.
**Browser-runnable:** AgentGraph simulator (deterministic). **Laptop:** real LangGraph code.

- `langgraph-agent-concepts` Agent concepts and patterns — workflows vs agents, ReAct, plan-and-execute, when not to use an agent
- `langgraph-state-nodes-edges` State, nodes and edges — typed state, reducers, building a graph; AgentGraph
- `langgraph-routing-loops` Conditional routing and loops — branching on state, retries, bounded loops
- `langgraph-persistence` Persistence and checkpoints — threads, checkpointers, resuming, time travel
- `langgraph-human-in-the-loop` Human approval interrupts — pausing for approval, resuming, audit
- `langgraph-multi-agent` Subgraphs and multi-agent — supervisor patterns, handoffs, the cost of complexity
- `langgraph-tools-testing` Tools and testing agents — tool design, deterministic tests, replaying traces
- `langgraph-deploy-lab` Deploy and lab — serving a graph behind FastAPI; lab: a validate → diagnose → propose → approve → apply graph for one broken file

**Interview questions:** Agent vs workflow · How do you prevent infinite loops? · How do you add human approval? · How do you test an agent? · When is multi-agent worse than single-agent?

---
## Phase 36 · `mcp` — Model Context Protocol · ◆ plus · 5 lessons

**Concept-first.** A standard way for AI hosts to discover and call tools, resources and prompts exposed by servers.

- `mcp-concepts` MCP concepts — hosts, clients, servers; tools, resources, prompts; transports (stdio, HTTP)
- `mcp-build-server` Build a server in Python — expose `read_file_schema`, `validate_file`, `apply_mapping`, `run_pipeline`, `notify`
- `mcp-clients-hosts` Connect clients — VS Code, desktop hosts, your own client
- `mcp-security-auth` Security and auth — least privilege, OAuth for remote servers, prompt-injection via tool results, permissions
- `mcp-production-lab` Lab: production concerns — logging, timeouts, versioning, testing the server

**Interview questions:** What problem does MCP solve? · Tools vs resources vs prompts · How do you secure an MCP server? · MCP vs plain function calling.

---
## Phase 37 · `observability` — Observability and production AI · ★ core · 6 lessons

**Concept-first.** If it is not traced, logged and costed per run, you cannot operate it.

- `observability-logs-metrics-traces` Logs, metrics, traces — OpenTelemetry concepts, correlation IDs, structured logs
- `observability-llm-tracing` Tracing LLM and tool calls — spans per step, prompt/response capture and redaction, cost per run, tool choices ("check the current tool docs")
- `observability-cost-latency-slos` Cost, latency and SLOs — budgets, alerts, timeouts, fallbacks
- `observability-data-observability` Data observability — freshness, volume, schema drift, anomaly checks
- `observability-incidents-runbooks` Incidents and runbooks — on-call basics, triage, post-mortems for AI/data failures
- `observability-azure-monitor-lab` Lab: wire it into Azure — App Insights traces, alerts, dashboard for the agent

### Project G · AI Data Operations Agent — flagship (`proj-g`) + Gate G
Follows PDF Project 5, steps 1–6: take Project A inputs and create 40 broken variants (renamed/missing columns, extra header rows, merged cells, new sheet names, date formats, currency codes) → deterministic validator first → LangGraph agent for failures (diagnose → lookup via RAG over SOPs and past fixes → propose mapping → risk node: auto-fix only low risk, otherwise human approval via Teams/Power Automate or webhook → re-run, validate, load, notify) → tools exposed over an MCP server → FastAPI + Docker + Azure, traces for every step, cost per run, audit log of every fix and approval → run all 40 scenarios: % correctly diagnosed, % safely auto-fixed, % correctly escalated, average cost and time → README with architecture, eval table, before/after; 5-minute demo video.
**Interview questions:** How do you trace and cost an agent run? · How do you decide what an agent may auto-fix? · What goes in the audit log? · What would you alert on? · How do you roll back a bad auto-fix?
