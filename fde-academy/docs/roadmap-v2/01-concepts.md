# Stage 0 · Concepts first

Line format used in every stage file (a script counts these): `- [✅] \`lesson-id\` Title — what it covers`. ✅ = already written.

---
## Phase 0 · `foundations` — How data products and the internet work · ★ core · 22 lessons

**Why companies need it.** Every FDE and data-engineer interview opens with "walk me through how you'd build X end to end" and then probes the layers underneath: network, auth, storage, failure. People who only know tools cannot answer. This phase gives the mental model everything else hangs on.
**Setup and accounts.** Windows 11, PowerShell, WSL2 (Ubuntu), VS Code. Nothing paid.
**Browser-runnable:** quizzes, sketches, simulators (LoadBalancer, OAuthFlow, DnsResolver, RetryBackoff, JwtDecoder). **Laptop labs:** `nslookup`, `curl`, `openssl s_client`, WSL.

### Module A · The big picture
- `foundations-data-product` What an end-to-end data product is — sources → ingest → store → transform → serve → monitor; the people (analyst, analytics engineer, data engineer, FDE); the Kollana Tech running example
- `foundations-oltp-olap-batch-stream` OLTP vs OLAP, batch vs streaming — latency vs throughput, micro-batch, ETL vs ELT, where each lives
- `foundations-architecture-patterns` Warehouse, lake, lakehouse, medallion, mesh — monolith vs services, build vs buy, reference architectures on OSS and on Azure
- `foundations-governance-quality-lineage` Quality, contracts, lineage and ownership — quality dimensions, data contracts, SLAs, lineage, catalog, PII, India's DPDP Act at concept level ("check the current rules")

### Module B · How computers talk to each other
- `foundations-ip-ports-nat` IP addresses, subnets, ports, NAT — IPv4/IPv6, private ranges, CIDR maths, sockets, why your laptop can't be reached from outside
- `foundations-dns` DNS — records (A, CNAME, MX, TXT), the resolution chain, TTL, private DNS, `nslookup` lab, "it's always DNS" outages
- `foundations-http-in-depth` HTTP in depth — methods, status codes, headers, cookies, caching headers, HTTP/1.1 vs 2 vs 3, `curl` and PowerShell lab
- `foundations-tls-certificates` TLS and certificates — handshake, certificate chain, CAs, SNI, mutual TLS, expired-certificate incidents, `openssl` lab
- `foundations-proxies-load-balancing` Proxies, gateways and load balancing — forward vs reverse proxy, API gateway, L4 vs L7, round robin / least connections / hashing, health checks, sticky sessions, blue-green and canary, CDN; LoadBalancer simulator
- `foundations-network-security` Network security — firewalls and security groups, VPN, private endpoints, bastion, DMZ, zero trust, least-privilege networks

### Module C · Identity and access: how auth really works
- `foundations-authentication` Authentication — passwords, hashing (bcrypt/argon2), salts, MFA, sessions vs tokens, API keys, basic auth, why never to roll your own
- `foundations-oauth2-oidc` OAuth 2.0 and OpenID Connect — roles, authorization code + PKCE, client credentials, device code, scopes, ID vs access vs refresh tokens; OAuthFlow simulator
- `foundations-jwt-sso-saml` JWT, SSO and SAML — token anatomy, validating signature/`exp`/`aud`/`iss`, JWKS, single sign-on, SAML vs OIDC, federation; JwtDecoder
- `foundations-authorization-secrets` Authorization, secrets and encryption — RBAC/ABAC/ACL, least privilege, service accounts, secrets management, encryption at rest and in transit, key management, audit logs

### Module D · Reliability and scale
- `foundations-acid-cap` ACID, CAP and consistency — transactions, isolation in one page, CAP/PACELC, strong vs eventual consistency
- `foundations-idempotency-retries-queues` Idempotency, retries and queues — idempotency keys, retry with backoff and jitter, queues vs pub/sub, delivery guarantees (at-least-once, "exactly-once"), dead-letter queues; RetryBackoff simulator
- `foundations-caching-scaling` Caching, rate limiting and scaling — cache layers and invalidation, token bucket, vertical vs horizontal scaling, replication, sharding
- `foundations-observability-slo` Observability and SLOs — logs, metrics, traces, SLI/SLO/SLA, alerting, incidents and post-mortems, cost awareness (FinOps)

### Module E · Where data lives
- `foundations-file-formats` File formats — CSV, JSON, Excel, XML, Parquet, Avro, ORC; row vs columnar; compression; schema evolution; partitioned folder layouts
- `foundations-database-landscape` The database landscape — relational, document, key-value, columnar, graph, time-series, vector; object storage (S3/Blob/ADLS); choosing the right store

### Module F · Your machine and your first design
- `foundations-windows-dev-setup` Windows dev setup — PowerShell, paths and environment variables, WSL2 + Ubuntu, VS Code, winget, the Linux commands you need (grep, pipes, chmod, ps)
- `foundations-design-doc` Lab: design doc for the Finance Reporting Engine — architecture sketch, data flow, network and auth choices, failure modes, cost; this doc is reused in Project A

### Interview questions this phase must prepare you for
What happens when you type a URL and press Enter? · Authentication vs authorization · OAuth 2.0 vs OIDC vs SAML · How does a load balancer choose a server, and how does it know one is dead? · What is idempotency and why does it matter for retries? · OLTP vs OLAP · Why is Parquet faster than CSV for analytics? · Explain CAP with an example · What would you log, measure and alert on?
