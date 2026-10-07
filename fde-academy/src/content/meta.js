// The journey: stages → phases (one tool or topic each). Source of truth for the curriculum is docs/roadmap-v2/.
// There are deliberately no weeks, hours or deadlines anywhere: learners go at their own pace. Order is the only schedule.
// Phase ids are names, not numbers, so re-ordering the plan never renames lessons. Lesson ids start with their phase id.

export const STAGES = [
  { id: 'concepts', title: 'Concepts first', color: '#495057', tint: '#e9ecef' },
  { id: 'core', title: 'Core craft', color: '#1971c2', tint: '#d0e4ff' },
  { id: 'power-platform', title: 'Microsoft Power Platform', color: '#ae3ec9', tint: '#f3d9fa' },
  { id: 'apis', title: 'APIs and web apps', color: '#4263eb', tint: '#dbe4ff' },
  { id: 'azure', title: 'Microsoft Azure', color: '#0c8599', tint: '#c3fae8' },
  { id: 'backend', title: 'Ship it: containers, CI/CD, Azure deploy', color: '#e8590c', tint: '#ffe0c2' },
  { id: 'ingest', title: 'Ingestion and transformation', color: '#5c940d', tint: '#e9fac8' },
  { id: 'orchestration', title: 'Orchestration', color: '#7048e8', tint: '#e5dbff' },
  { id: 'big-data', title: 'Big-data platforms', color: '#c92a2a', tint: '#ffe3e3' },
  { id: 'ai', title: 'AI engineering', color: '#d6336c', tint: '#ffd8e1' },
  { id: 'agents', title: 'Agents and production', color: '#2f9e44', tint: '#d3f9d8' },
  { id: 'career', title: 'Career', color: '#e67700', tint: '#fff3bf' },
  { id: 'optional', title: 'Extended track (optional)', color: '#868e96', tint: '#f1f3f5' },
].map((s, i) => ({ ...s, num: i === 12 ? null : i }));

// priority: core = most job posts ask for it · plus = common differentiator · breadth = know it, deepen when a job asks
const RAW = [
  // ---- Stage 0
  { id: 'foundations', stage: 'concepts', title: 'How data products and the internet work', short: 'Foundations', emoji: '🧭', priority: 'core',
    summary: 'The mental model under every tool: what a data product is, how computers talk (DNS, HTTP, TLS, load balancing), how authentication really works, and why systems fail.' },
  // ---- Stage 1
  { id: 'sql', stage: 'core', title: 'SQL (PostgreSQL)', short: 'SQL', emoji: '🗄️', priority: 'core',
    summary: 'From your first SELECT to transactions, query plans, partitioning and incremental-load patterns. Real PostgreSQL in your browser.' },
  { id: 'python', stage: 'core', title: 'Python', short: 'Python', emoji: '🐍', priority: 'core',
    summary: 'The language and the engineering habits around it: generators, typing, testing, concurrency, packaging, databases and APIs.' },
  { id: 'pandas', stage: 'core', title: 'pandas and data files', short: 'pandas', emoji: '🐼', priority: 'core',
    summary: 'DataFrames in depth: groupby, merge, cleaning, performance, Parquet and writing Excel MIS packs.' },
  { id: 'git', stage: 'core', title: 'Git and GitHub', short: 'Git + GitHub', emoji: '🌿', priority: 'core',
    summary: 'How Git really works, branching, pull requests, undoing mistakes and keeping secrets out of history.' },
  { id: 'modelling', stage: 'core', title: 'Data modelling and warehousing', short: 'Data modelling', emoji: '📐', priority: 'core',
    summary: 'Facts, dimensions, grain, SCDs, Data Vault, medallion and lakehouse. Closes with Project A and Gate A.',
    projectName: 'Finance Reporting Automation Engine',
    gate: { letter: 'A', target: '13–18 LPA', titles: ['Reporting Automation Engineer', 'BI Automation Engineer', 'Python Automation Engineer', 'Analytics Engineer', 'Finance Data Analyst (automation)'] } },
  // ---- Stage 2
  { id: 'power-automate', stage: 'power-platform', title: 'Power Automate', short: 'Power Automate', emoji: '⚡', priority: 'plus',
    summary: 'Cloud flows, SharePoint, Teams approvals, error handling, solutions and licensing. The stack most Indian enterprises already pay for.' },
  { id: 'power-bi', stage: 'power-platform', title: 'Power BI', short: 'Power BI', emoji: '📊', priority: 'plus',
    summary: 'Star-schema models, DAX, time intelligence, row-level security and refresh.' },
  { id: 'copilot-studio', stage: 'power-platform', title: 'Copilot Studio', short: 'Copilot Studio', emoji: '💬', priority: 'breadth',
    summary: 'Build a small agent that answers from your knowledge and triggers a flow.' },
  // ---- Stage 3 (API phases come before Azure: the Azure stage secures and hosts what is built here)
  { id: 'http-rest', stage: 'apis', title: 'HTTP and REST API design', short: 'HTTP + REST', emoji: '🔌', priority: 'core',
    summary: 'Design an API other teams can rely on: verbs, status codes, pagination, idempotency, versioning and webhooks.' },
  { id: 'fastapi', stage: 'apis', title: 'FastAPI', short: 'FastAPI', emoji: '🚀', priority: 'core',
    summary: 'Routes, Pydantic, dependency injection, JWT auth, databases, background jobs and tests.' },
  { id: 'react-dashboards', stage: 'apis', title: 'React for data apps', short: 'React', emoji: '⚛️', priority: 'plus',
    summary: 'JavaScript and React from zero, built around data screens: fetch from your API, tables, charts, forms, uploads, CORS and a production build.' },
  // ---- Stage 4
  { id: 'azure', stage: 'azure', title: 'Azure fundamentals', short: 'Azure basics', emoji: '☁️', priority: 'core',
    summary: 'Account and budget first, then the resource model, storage, a database you can connect to, a virtual machine, networking, load balancing, monitoring and cost.' },
  { id: 'entra', stage: 'azure', title: 'Microsoft Entra ID and Azure security', short: 'Entra ID + security', emoji: '🔐', priority: 'core',
    summary: 'How sign-in and tokens really work: app registrations (web API and single-page app), service principals, managed identity, Key Vault, Conditional Access and Graph.' },
  { id: 'azure-functions', stage: 'azure', title: 'Azure Functions', short: 'Azure Functions', emoji: '⚙️', priority: 'plus',
    summary: 'Serverless Python: triggers, bindings, identity and deployment. Closes with Project B and Gate B.',
    projectName: 'GST Reconciliation in the Cloud',
    gate: { letter: 'B', target: '15–20 LPA', titles: ['Intelligent Automation Engineer', 'Power Platform Developer', 'Process Automation Engineer', 'Automation Consultant'] } },
  // ---- Stage 5
  { id: 'docker', stage: 'backend', title: 'Docker', short: 'Docker', emoji: '🐳', priority: 'core',
    summary: 'What a container is, Dockerfiles, volumes, networking and Compose.' },
  { id: 'github-actions', stage: 'backend', title: 'GitHub Actions (CI/CD)', short: 'GitHub Actions', emoji: '🔁', priority: 'core',
    summary: 'Lint, test and build on every push; deploy without storing cloud keys.' },
  { id: 'azure-deploy', stage: 'backend', title: 'Deploying to Azure (Container Apps)', short: 'Deploy to Azure', emoji: '📦', priority: 'plus',
    summary: 'Registry, Container Apps, secrets, App Insights and a full pipeline for the API.' },
  { id: 'azure-e2e', stage: 'backend', title: 'The end-to-end Azure data product (React app on top)', short: 'Azure end-to-end', emoji: '🏁', priority: 'plus',
    summary: 'Files in Blob, a PostgreSQL database, a FastAPI service, Entra sign-in and a React app, with the exact setup and connection for each hop. Closes with Project C and Gate C.',
    projectName: 'Payroll Bank Mandate Validation: API and Web App',
    gate: { letter: 'C', target: '15–22 LPA', titles: ['Python Automation Engineer', 'Integration Engineer', 'Backend Engineer (data)', 'Solutions Engineer (data)'] } },
  // ---- Stage 6
  { id: 'dlt', stage: 'ingest', title: 'dlt (data load tool)', short: 'dlt', emoji: '🚚', priority: 'plus',
    summary: 'Python-native extract and load: resources, incremental loading, schema evolution and contracts.' },
  { id: 'airbyte', stage: 'ingest', title: 'Airbyte', short: 'Airbyte', emoji: '🔗', priority: 'breadth',
    summary: 'Managed connectors, sync modes, CDC, and when to build versus buy.' },
  { id: 'dbt', stage: 'ingest', title: 'dbt', short: 'dbt', emoji: '🧱', priority: 'core',
    summary: 'Models, tests, docs, incremental models, snapshots and project structure.' },
  // ---- Stage 7
  { id: 'adf', stage: 'orchestration', title: 'Azure Data Factory', short: 'Data Factory', emoji: '🏭', priority: 'plus',
    summary: 'Pipelines, copy activity, triggers, parameters and CI/CD on Azure.' },
  { id: 'airflow', stage: 'orchestration', title: 'Apache Airflow', short: 'Airflow', emoji: '🌬️', priority: 'core',
    summary: 'DAGs, scheduling semantics, backfills, reliability and running it in production.' },
  { id: 'dagster', stage: 'orchestration', title: 'Dagster', short: 'Dagster', emoji: '🎛️', priority: 'plus',
    summary: 'Software-defined assets, partitions, sensors and checks. Closes with Project D and Gate D.',
    projectName: 'Sales & Inventory Analytics Warehouse',
    gate: { letter: 'D', target: '15–22 LPA', titles: ['Analytics Engineer', 'Data Engineer', 'Data Platform Engineer (junior/mid)'] } },
  // ---- Stage 8
  { id: 'spark', stage: 'big-data', title: 'Apache Spark and PySpark', short: 'Spark + PySpark', emoji: '✨', priority: 'core',
    summary: 'Partitions, shuffles, joins, skew, tuning and Structured Streaming.' },
  { id: 'databricks', stage: 'big-data', title: 'Databricks and Delta Lake', short: 'Databricks + Delta', emoji: '🔥', priority: 'core',
    summary: 'Lakehouse in practice: Delta tables, MERGE, time travel, Unity Catalog and jobs.' },
  { id: 'snowflake', stage: 'big-data', title: 'Snowflake', short: 'Snowflake', emoji: '❄️', priority: 'core',
    summary: 'Architecture, loading, semi-structured data, cost control, security and streams/tasks.' },
  { id: 'kafka', stage: 'big-data', title: 'Kafka and streaming', short: 'Kafka', emoji: '📡', priority: 'plus',
    summary: 'Topics, partitions, consumer groups, CDC and stream processing. Closes with Project E and Gate E.',
    projectName: 'Order Events Lakehouse',
    gate: { letter: 'E', target: 'verify on live job posts', titles: ['Data Engineer (Spark / Databricks)', 'Azure Data Engineer', 'Snowflake Data Engineer', 'Streaming Data Engineer'] } },
  // ---- Stage 9
  { id: 'llm-basics', stage: 'ai', title: 'LLM fundamentals and prompting', short: 'LLM basics', emoji: '🧠', priority: 'core',
    summary: 'Tokens, context, sampling, cost, prompting and what models cannot do.' },
  { id: 'llm-apis', stage: 'ai', title: 'LLM APIs, structured outputs and tool calling', short: 'LLM APIs + tools', emoji: '🛠️', priority: 'core',
    summary: 'Direct provider and Azure OpenAI APIs, reliable JSON, tool calling and cost control.' },
  { id: 'vector-db', stage: 'ai', title: 'Embeddings and vector databases (Qdrant)', short: 'Vector DBs', emoji: '🧲', priority: 'core',
    summary: 'Embeddings, chunking, approximate search, Qdrant, hybrid search and reranking.' },
  { id: 'rag', stage: 'ai', title: 'Retrieval-augmented generation', short: 'RAG', emoji: '📚', priority: 'core',
    summary: 'Ingestion, retrieval, citations, evaluation, permissions and text-to-SQL.' },
  { id: 'evals', stage: 'ai', title: 'Evals', short: 'Evals', emoji: '🧪', priority: 'core',
    summary: 'Golden sets, metrics, regression testing for prompts and human review.' },
  { id: 'guardrails', stage: 'ai', title: 'Guardrails and AI security', short: 'Guardrails', emoji: '🛡️', priority: 'core',
    summary: 'Prompt injection, PII, safe tools and human-in-the-loop. Closes with Project F and Gate F.',
    projectName: 'Invoice-to-Ledger AI + Ask-Your-Finance-Data',
    gate: { letter: 'F', target: '18–25 LPA', titles: ['AI Automation Engineer', 'Applied AI Engineer', 'GenAI Engineer', 'AI Application Engineer', 'AI Integration Engineer'] } },
  // ---- Stage 10
  { id: 'langgraph', stage: 'agents', title: 'Agents with LangGraph', short: 'LangGraph agents', emoji: '🕸️', priority: 'core',
    summary: 'State, routing, persistence, human approval and testing agents.' },
  { id: 'mcp', stage: 'agents', title: 'Model Context Protocol (MCP)', short: 'MCP', emoji: '🧩', priority: 'plus',
    summary: 'Expose tools to AI hosts through a standard protocol, securely.' },
  { id: 'observability', stage: 'agents', title: 'Observability and production AI', short: 'Observability', emoji: '🔭', priority: 'core',
    summary: 'Logs, metrics, traces, cost per run and runbooks. Closes with the flagship Project G and Gate G.',
    projectName: 'AI Data Operations Agent (flagship)',
    gate: { letter: 'G', target: '20–30+ LPA', titles: ['Forward Deployed Engineer', 'Forward Deployed Software Engineer', 'AI Deployment Engineer', 'AI Solutions Engineer', 'Customer Engineer AI'] } },
  // ---- Stage 11
  { id: 'system-design', stage: 'career', title: 'System design for data and AI', short: 'System design', emoji: '🏗️', priority: 'core',
    summary: 'A framework you can say out loud, plus worked designs for pipelines, streaming, RAG and agents.' },
  { id: 'fde-craft', stage: 'career', title: 'The Forward Deployed Engineer craft', short: 'FDE craft', emoji: '🤝', priority: 'core',
    summary: 'Discovery, scoping, demos, delivery and working inside customer constraints.' },
  { id: 'interview-prep', stage: 'career', title: 'Interview bootcamp', short: 'Interview prep', emoji: '🎤', priority: 'core',
    summary: 'Timed SQL and Python, STAR stories, system design practice, mock interviews and offers.' },
  // ---- Optional
  { id: 'kubernetes', stage: 'optional', optional: true, title: 'Kubernetes', short: 'Kubernetes', emoji: '☸️', priority: 'breadth',
    summary: 'Pods, deployments, services and AKS. Only when a job asks.' },
  { id: 'terraform', stage: 'optional', optional: true, title: 'Terraform', short: 'Terraform', emoji: '🌍', priority: 'breadth',
    summary: 'Infrastructure as code with state, modules and CI.' },
  { id: 'bicep', stage: 'optional', optional: true, title: 'Azure Bicep', short: 'Bicep', emoji: '💪', priority: 'breadth',
    summary: 'Azure-native infrastructure as code.' },
  { id: 'fabric', stage: 'optional', optional: true, title: 'Microsoft Fabric', short: 'Fabric', emoji: '🧵', priority: 'breadth',
    summary: 'OneLake, lakehouse, pipelines and Direct Lake in Microsoft Fabric.' },
  { id: 'duckdb', stage: 'optional', optional: true, title: 'DuckDB', short: 'DuckDB', emoji: '🦆', priority: 'breadth',
    summary: 'In-process analytics over Parquet and CSV.' },
  { id: 'redis', stage: 'optional', optional: true, title: 'Redis', short: 'Redis', emoji: '🟥', priority: 'breadth',
    summary: 'Caching, rate limiting and simple queues.' },
];

const stageById = Object.fromEntries(STAGES.map((s) => [s.id, s]));
let mainNum = 0; let optNum = 0;

export const META = RAW.map((p) => {
  const stage = stageById[p.stage];
  return {
    ...p,
    stageTitle: stage.title,
    stageNum: stage.num,
    color: stage.color,
    tint: stage.tint,
    num: p.optional ? `X${++optNum}` : mainNum++,
    gateLetter: p.gate?.letter ?? null,
    target: p.gate?.target ?? null,
    gateTitles: p.gate?.titles ?? [],
    projectName: p.projectName ?? null,
    optional: !!p.optional,
  };
});
