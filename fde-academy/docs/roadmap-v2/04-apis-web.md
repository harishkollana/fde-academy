# Stage 3 · APIs and web apps (HTTP, FastAPI, React)

Prerequisites: `foundations` (HTTP, TLS, auth), `python`, `sql`. Stage 3 teaches the two ends of a data product that people actually touch: the **API** that serves the data and the **React app** that shows it. It sits **before Azure on purpose**: the Azure stage secures a FastAPI service (`entra-protect-your-api`), calls APIs from Functions and Power Automate, and its capstone (`azure-e2e`) puts a React app in front of an API on Azure. Everything here runs on your laptop; Azure comes next. No project closes this stage: the labs feed **Project C** (Stage 5). Line format: `- [✅] \`lesson-id\` Title — covers`.

---
## Phase 9 · `http-rest` — HTTP and REST API design · ★ core · 6 lessons

**Why companies need it.** Before frameworks: you must design an API that other teams can use safely. Interviews ask idempotency, pagination, status codes and versioning.
**Concept-first.** Resources and verbs; contracts; what clients can rely on.
**Browser-runnable:** ApiPlayground (mock Payroll Bank Mandate Validation API).

- `http-rest-principles` REST principles — resources, verbs, safe/idempotent methods, status codes, content negotiation
- `http-rest-api-design` Designing an API — naming, versioning, offset vs cursor pagination, filtering and sorting, error format (problem details)
- `http-rest-openapi` OpenAPI — the contract, schema-first vs code-first, Swagger UI, generating clients
- `http-rest-auth-patterns` Auth patterns for APIs — API keys, bearer tokens, OAuth scopes, HMAC-signed webhooks, where Entra fits
- `http-rest-webhooks-limits` Webhooks and rate limits — receiving and sending webhooks, retries, idempotency keys, rate-limit headers, backoff
- `http-rest-api-testing` Testing an API — curl/httpie/Postman or Bruno, contract tests, what to check before you ship

**Interview questions:** PUT vs PATCH vs POST · What makes an endpoint idempotent? · Offset vs cursor pagination · 401 vs 403 · How do you version an API? · How do you design a webhook receiver?

---
## Phase 10 · `fastapi` — FastAPI · ★ core · 10 lessons

**Why companies need it.** The modern default for Python APIs, model-serving and tool backends (including MCP and agent tools).
**Concept-first.** Request → validation (Pydantic) → function → response model; ASGI; sync vs async.
**Laptop:** all labs (FastAPI cannot run in the browser). The lessons include the full code, the expected `/docs` page and the common errors.

- `fastapi-hello-routes` First API — install, routes, uvicorn, `/docs`, path and query params
- `fastapi-bodies-pydantic` Request bodies and Pydantic — models, validation, response models, status codes
- `fastapi-errors-responses` Errors and responses — HTTPException, custom handlers, consistent error format
- `fastapi-dependency-injection` Dependency injection — `Depends`, shared resources, sub-dependencies, overriding in tests
- `fastapi-auth-jwt` Auth in FastAPI — OAuth2 password flow, JWT access tokens, role-based access; JwtDecoder
- `fastapi-database-sqlalchemy` Databases — SQLAlchemy sessions, models, Alembic migrations, transactions
- `fastapi-background-uploads` Background tasks and uploads — BackgroundTasks, file uploads, large files, job status endpoints
- `fastapi-middleware-logging` Middleware, CORS and logging — request IDs, structured logs, CORS, timing
- `fastapi-testing` Testing — TestClient, pytest fixtures, dependency overrides, testing auth and DB
- `fastapi-production-structure` Production structure — project layout, settings, async vs sync, workers (uvicorn/gunicorn), health checks

**Lab.** The Payroll Bank Mandate Validation API skeleton (continues into Project C).
**Interview questions:** Sync vs async endpoints · What is dependency injection in FastAPI? · How does validation work? · How do you handle long-running jobs? · How do you test an endpoint that needs auth?

---
## Phase 11 · `react-dashboards` — React for data apps · ◆ plus · 10 lessons

**Why companies need it.** A data product that nobody can open is not a product. Forward-deployed and automation engineers are often the person who also builds the screen the customer's team uses: a review queue, an upload page, a dashboard. Interviews ask how a browser app talks to an API, where a token may live, and what CORS is. This phase assumes **no JavaScript background**: it teaches only the JavaScript and React needed to build data screens, comparing everything with Python.
**Concept-first.** The browser is a runtime you do not control, so it can never hold a secret. Data flows API → state → screen; an action flows screen → API → database. A React app is static files plus API calls.
**Setup.** Node.js (check the current LTS), npm, VS Code. The Academy you are using is itself a React + Vite app: lessons point at its source as a worked example.
**Laptop:** all labs (React cannot run in the lesson playgrounds). The lessons include the full code, the expected screen and the common errors.

### Module A · Concepts and setup
- `react-dashboards-web-concepts` How a web app works — HTML, CSS and JavaScript, the browser as a runtime, single-page app vs server-rendered page, the build step, static files, why a browser app can never keep a secret, where React sits in a data product
- `react-dashboards-javascript-essentials` JavaScript you need — `const`/`let`, functions and arrow functions, objects and arrays, destructuring and spread, `map`/`filter`/`reduce` next to Python comprehensions, modules (`import`/`export`), `async`/`await` and `fetch`, JSON, `===` and truthiness traps, numbers and dates
- `react-dashboards-setup-vite` Setup on Windows — Node.js and npm, create a Vite React project, folder tour, dev server and hot reload, `npm run build`, `.env` files and `VITE_` variables (everything in them is public), VS Code helpers, common install errors

### Module B · React in practice
- `react-dashboards-components-state` Components, props and state — JSX, props, `useState`, events, lists and keys, conditional rendering, lifting state up, derived values
- `react-dashboards-effects-fetching` Fetching data — `useEffect` and its dependency array, calling the FastAPI endpoint, loading / error / empty states, cancelling stale requests with AbortController, a reusable `useApi` hook, why data-fetching libraries exist (concept)
- `react-dashboards-tables-charts` Tables, KPI cards and charts — server-side pagination, sorting and filtering against the API, a charting library, accessible tables, Indian number formats (`Intl.NumberFormat('en-IN')`, lakh and crore), dates and the April–March fiscal year
- `react-dashboards-forms-routing` Forms, uploads and routing — controlled inputs, validation messages, file upload with progress to the API, React Router pages, filters kept in the URL, the protected-route pattern (concept)

### Module C · Production and interview
- `react-dashboards-cors-build-serve` CORS, builds and serving — same-origin vs cross-origin, preflight requests, FastAPI CORS settings, `npm run build`, serving static files with nginx (the Academy's own Dockerfile and nginx config as the worked example), single-page fallback routing, cache headers, per-environment configuration
- `react-dashboards-quality-security` Testing, accessibility and security — Vitest and Testing Library basics, keyboard and screen-reader basics, why React escapes output and when `dangerouslySetInnerHTML` breaks that, secrets never in the bundle, dependency audit, error boundaries
- `react-dashboards-lab` Lab: the reviewer screen — a React app for the Payroll Bank Mandate Validation API: exceptions table with filters and pagination, KPI cards, file upload, a resolve button; first against a mock, then against your local FastAPI

**Interview questions:** Props vs state · Why do list items need keys? · What does the `useEffect` dependency array do? · How do you avoid stale or duplicate fetches? · What is CORS and why does the browser, not the server, enforce it? · Where can a single-page app keep a token, and what are the risks? · How would you show a 1,00,000-row table? · Why can a React app never keep an API key secret?
