// Interview bank. star and systemDesign are filled by other tasks; questions below cover Phase 0 (foundations).
// Each answer is Markdown, written in the first person, ending with one follow-up line.
export default {
  star: [],
  systemDesign: [],
  questions: [
    { id: 'iv-foundations-01', topic: 'foundations', q: 'Walk me through how you would build a monthly finance reporting product end to end.', a: `I walk through the stages out loud and say how each one can fail.
- **Clarify first:** who uses it, and how old may the number be? I want a freshness number, not "real-time".
- **Sources and ingest:** SAP exports, the Excel budget and FX rates. I check the schema and row counts on arrival, because sources change without warning.
- **Store and transform:** a raw copy first (bronze), then cleaned data (silver), then business definitions (gold), with tests such as "every journal balances".
- **Serve and secure:** Power BI or an API reads gold only, with role-based access and masked PAN.
- **Orchestrate and monitor:** a scheduler with retries, and alerts on freshness, row counts and failed tests that go to a named owner.

Follow-up they may ask: "What breaks first?" Usually ingest, because a source renames a column, so I put a contract check there.` },
    { id: 'iv-foundations-02', topic: 'foundations', q: 'What is the difference between OLTP and OLAP?', a: `They are two different jobs, so they need two different designs.
- **OLTP** runs the business: many small reads and writes that touch a few rows, each fast and exactly right. It uses a row store with normalised tables, for example PostgreSQL behind the journal posting screen.
- **OLAP** analyses the business: a few large queries that scan millions of rows and add them up. It uses a column store with wide star-schema tables and years of history.
- A row store drags every column along when you sum one, and a column store is slow at fetching one whole row, so one design cannot be great at both.
- The classic failure is running the CFO's year-to-date query on the live ledger, so the accountants' screens freeze.

Follow-up they may ask: "Can one database do both?" For a small workload PostgreSQL plus a read replica may be enough, but as data grows I move analytics to a warehouse.` },
    { id: 'iv-foundations-03', topic: 'foundations', q: 'Why shouldn\'t we run reports directly on the production database?', a: `Production is tuned for many small transactions, and a big report is the opposite workload.
- The report scans millions of rows, so it competes with the transactions for CPU and disk, and it can hold locks.
- The normalised, row-oriented design needs many joins for analytics, so the report is slow as well.
- A read replica is an acceptable short-term stopgap, but it can lag behind and it keeps the same design.
- The real fix is to copy the data to a warehouse with a column layout and run reports there.

Follow-up they may ask: "Would you batch or stream that copy?" I would ask how stale the report may be before it causes harm, and pick the slowest option that is still safe.` },
    { id: 'iv-foundations-04', topic: 'foundations', q: 'How do you choose between batch, micro-batch and streaming?', a: `I ask one question: "how stale can this be before someone is harmed?" Then I choose the slowest option that is still safe.
- **Batch:** the month-end close ready by day 3, or yesterday's sales each morning.
- **Micro-batch:** a sales dashboard that may be a few minutes old.
- **Streaming:** blocking a card payment that looks like fraud before it completes.
- Latency is how long one item waits; throughput is how much I process in total. Batch is a bus (high throughput, high latency) and streaming is a taxi.
- Streaming costs more to build, run and debug because of ordering, duplicates, late events and state, so I use it only when the number demands it.

Follow-up they may ask: "The CFO says she wants it real-time." I ask her how old the number can be, because real-time is usually shorthand.` },
    { id: 'iv-foundations-05', topic: 'foundations', q: 'What is the difference between ETL and ELT, and which would you choose?', a: `ETL transforms the data before loading it, and ELT loads the raw data first and transforms it inside the warehouse.
- I choose **ELT** by default. Storage is cheap, warehouses are powerful, and I keep the raw copy.
- If last quarter's FX logic was wrong, I re-run the transform on the raw data. With ETL the raw data may be gone.
- ETL still has a place when something must be removed before it lands, for example masking PAN before data reaches a shared platform.
- The failure mode of ELT is raw data piling up with no owner or tests, which turns the lake into a swamp.

Follow-up they may ask: "Where does medallion fit?" Bronze, silver and gold are ELT in practice: load raw, then transform in steps.` },
    { id: 'iv-foundations-06', topic: 'foundations', q: 'What is the difference between a data warehouse, a data lake and a lakehouse?', a: `- A **warehouse** stores structured, modelled tables and enforces the schema on write. It is great for governed SQL, but weaker with raw files and unstructured data.
- A **lake** stores any file cheaply and applies the schema on read. It is great for raw data and ML, but files alone have no transactions or governance, and it can turn into a swamp.
- A **lakehouse** puts a table format such as Delta or Iceberg on lake files. That adds ACID, updates and time travel, so one copy serves both BI and data science.
- I choose by data shape, team skills and cost. For a small structured workload I might simply use PostgreSQL.

Follow-up they may ask: "What would you pick for Kollana Tech's finance MIS?" A few gigabytes of structured data does not need a lakehouse, so I would start with PostgreSQL and move when the volume or the data types demand it.` },
    { id: 'iv-foundations-07', topic: 'foundations', q: 'What is the medallion architecture and why use it?', a: `It is a naming habit of three layers, each cleaner than the one before.
- **Bronze:** exactly what arrived, with load time and source, append-only. This allows replays and audits.
- **Silver:** types fixed, duplicates removed, codes standardised, one customer ID everywhere.
- **Gold:** business-ready tables such as the P&L; dashboards and APIs read only this layer.
- The benefit is separation of concerns: ingest problems stay in bronze, cleaning rules in silver, and business definitions in gold. When "net revenue" changes, I edit gold, not the ingestion code.
- Failure modes: skipping bronze, so I cannot replay; letting dashboards read silver; or keeping layers nobody tests.

Follow-up they may ask: "Where do quality checks go?" At the bronze-to-silver step (reject or quarantine bad rows) and before gold (reconcile totals to the source).` },
    { id: 'iv-foundations-08', topic: 'foundations', q: 'How do you make sure the data in your pipeline is good?', a: `I check at three points, and I name the kind of bad data each check catches.
- **On arrival:** schema and contract checks reject malformed or duplicate files.
- **After each transform:** tests for not-null, uniqueness, valid values and referential integrity, plus a reconciliation of totals back to the source (for example debits equal credits per journal).
- **In production:** monitors for freshness, row counts and anomalies, with alerts to a named owner.
- Failing rows go to a quarantine table with a report. I never fix them silently, because that hides the root cause.

Follow-up they may ask: "Which kind of bad data is hardest to catch?" Accuracy, because I need a trusted second source such as a bank statement to compare against.` },
    { id: 'iv-foundations-09', topic: 'foundations', q: 'What is a data contract, and how is it different from lineage?', a: `- A **data contract** is a written agreement between the team that produces a dataset and the teams that use it. It states the schema, the meaning of each field, freshness, quality promises, the owner, and how breaking changes are announced.
- A pipeline can check the contract on arrival and reject a bad file instead of failing downstream.
- **Lineage** is a map of where data came from and where it goes. It answers "where did this number come from?" and, for impact analysis, "what breaks if I change this?"
- Together they stop silent breakage: the contract defines the promise, and lineage tells me who to warn.
- The failure mode is a contract that lives in a wiki and is never enforced, or a lineage graph that is out of date.

Follow-up they may ask: "A source team wants to rename a column. What happens?" Per the contract they announce it ahead of time, add the new column next to the old one, I use lineage to find the consumers, and the old column is removed later.` },
    { id: 'iv-foundations-10', topic: 'foundations', q: 'How would you handle personal data such as PAN and bank account numbers in a pipeline?', a: `I treat it as personal data from the first design sketch.
- **Minimise:** do not copy PAN or bank accounts into tables that do not need them, and keep them only as long as needed.
- **Mask** them wherever people look, such as reports, logs and support screens (show only the last characters).
- **Restrict and log:** raw values are readable only by named roles, and every read is audited. Data is encrypted in transit and at rest.
- For India's DPDP Act, I know the ideas (purpose, consent, minimisation, security, people's rights), but the detailed rules keep changing, so I check the current text with compliance before I build.
- Failure modes: PAN in debug logs, and real data copied into a test environment.

Follow-up they may ask: "Can I use production data to test?" No. I use synthetic or masked data.` },
    { id: 'iv-foundations-11', topic: 'foundations', q: 'How many hosts fit in a /22, and what does the slash mean?', a: `The slash is the number of fixed network bits. The rest are free for hosts.
- A /22 leaves 32 - 22 = 10 bits, so 2^10 = 1,024 addresses.
- Platforms reserve some. In Azure, 5 addresses in every subnet are reserved, so a /22 gives 1,019 usable.
- Quick check: /24 is 256, /16 is 65,536 and /28 is 16 addresses.
- I plan ranges so that networks never overlap, because overlapping ranges cannot be peered or joined by a VPN later.

Follow-up they may ask: "Your office uses 10.0.0.0/16 and so does the new VNet. What now?" I cannot connect them as they are. I would re-address the one that is cheaper to change, and write all ranges in one shared plan.` },
    { id: 'iv-foundations-12', topic: 'foundations', q: 'What is the difference between an IP address, a port and a socket, and what does NAT do?', a: `- An **IP address** finds the machine, like a postal address.
- A **port** (0 to 65535) finds the program on that machine: 443 for HTTPS, 5432 for PostgreSQL, 22 for SSH.
- A **socket** is address plus port, such as 198.51.100.20:443. A connection is two sockets talking, and my side uses a random high port.
- **NAT** lets many private devices share one public address. The router rewrites the source address and remembers the pairing in a table, so outbound traffic works, while inbound traffic with no table entry is dropped.
- A common bug is a program bound to 127.0.0.1 inside a container. It must listen on 0.0.0.0, or nothing outside can reach it.

Follow-up they may ask: "Why can't someone on the internet reach my laptop?" It has a private address and NAT has no entry for connections that started outside.` },
    { id: 'iv-foundations-13', topic: 'foundations', q: 'What happens when you type a URL into the browser and press Enter?', a: `- The browser splits the URL (scheme, host, port, path) and checks its caches.
- **DNS:** the browser cache, then the OS, then the recursive resolver, which walks root, TLD and authoritative servers, follows any CNAME and caches each answer for its TTL.
- **TCP** connection to the IP on port 443, through the router (NAT) and across the internet.
- **TLS handshake:** the server sends a certificate chain, and the client checks the chain, the name and the dates, then both sides derive session keys.
- **HTTP request:** it may pass a CDN, WAF, load balancer and reverse proxy before it reaches an app instance and its database. The response comes back with a status code, headers and a body, and the browser renders it and fetches more files.
- Each step can fail: stale DNS, a blocked port, an expired certificate, or a 502 or 504 from the proxy.

Follow-up they may ask: "Where would you look if only some users see the old site?" DNS caching and TTL, so I would query the resolver those users actually use.` },
    { id: 'iv-foundations-14', topic: 'foundations', q: 'How do DNS records and TTL work, and how would you plan a DNS migration?', a: `- A zone on the authoritative servers holds records: **A** and **AAAA** (name to IP), **CNAME** (alias), **MX** (mail), **TXT** (policy and domain proof), **NS** (which servers are authoritative) and **PTR** (reverse lookup).
- Every layer caches an answer until its **TTL** ends, which makes DNS fast but also makes changes slow.
- Migration plan: lower the TTL a day ahead, make the change, verify with \`Resolve-DnsName\` against the resolver the clients really use, then raise the TTL again.
- A CNAME cannot sit at the zone root, and a name with a CNAME cannot have other records.
- Failure modes: a long TTL keeps users on the old IP, a record has the wrong name or type, or two systems use different resolvers.

Follow-up they may ask: "A private endpoint works from the VM but not from my laptop." That is split-horizon DNS: the private zone is linked only to the VNet, so the laptop gets the public address.` },
    { id: 'iv-foundations-15', topic: 'foundations', q: 'What is the difference between 401 and 403, and between 502 and 504?', a: `- **401** means the caller is not authenticated: the token is missing, expired or invalid. The fix is a valid credential.
- **403** means the caller is authenticated but not allowed. A valid token without the required role gives 403, not 401.
- **502** means a gateway got an invalid answer from the app behind it, often because the app crashed.
- **504** means the gateway gave up waiting, so the backend is slow or a timeout is too short.
- To debug I read the response body and the proxy logs. For 504 I look at the backend latency and often make the work asynchronous, returning 202 and a job ID.

Follow-up they may ask: "Which of these would you retry automatically?" 429, 502, 503 and 504 with backoff, and not 400, 401, 403 or 404, because those need a fix first.` },
    { id: 'iv-foundations-16', topic: 'foundations', q: 'Which HTTP methods are safe and which are idempotent, and why does it matter?', a: `- **GET** is safe (changes nothing) and idempotent. HEAD and OPTIONS are the same.
- **PUT** and **DELETE** are idempotent but not safe: repeating them leaves the same end state.
- **POST** is neither: repeating it may create a second payment. **PATCH** is not guaranteed to be idempotent.
- It matters because networks fail. A client, a proxy or a library may retry automatically only when the call is idempotent.
- If a POST times out, I cannot tell whether it ran, so I add an idempotency key instead of retrying blindly.

Follow-up they may ask: "How would you design a payment POST so a retry is safe?" The client sends an idempotency key, and the server stores the key with the first result and returns that result on a repeat.` },
    { id: 'iv-foundations-17', topic: 'foundations', q: 'Explain what happens in an HTTPS handshake.', a: `- The client sends a hello with its supported versions and ciphers, the server name (SNI) and a key share.
- The server replies with its choice, a certificate chain, a signature that proves it holds the private key, and its own key share.
- The client verifies the chain up to a trusted root, the host name against the SAN, the dates, and the signature. Then both sides derive the same session keys.
- After that everything is encrypted with a fast symmetric cipher. Ephemeral keys give forward secrecy, so a later key leak cannot decrypt old traffic.
- Failure modes: expired certificate, hostname mismatch, missing intermediate, an untrusted issuer such as a corporate proxy, or a wrong system clock.

Follow-up they may ask: "What is mutual TLS?" The client also presents a certificate, so the server knows exactly which client is calling.` },
    { id: 'iv-foundations-18', topic: 'foundations', q: 'A Python script fails with CERTIFICATE_VERIFY_FAILED, but only on the office network. What do you do?', a: `I read the exact error first, because there are only a handful of causes.
- Expired, hostname mismatch, self-signed, not yet valid (check the clock) or "unable to get local issuer certificate".
- Only at the office suggests a corporate proxy that inspects TLS and re-signs traffic with a company CA that my Python does not trust. I confirm by looking at the issuer of the certificate I actually receive (the browser padlock or \`openssl s_client\`).
- The fix is to point Python at the company CA bundle, for example with the \`REQUESTS_CA_BUNDLE\` variable. I never set \`verify=False\`, because it removes the authentication guarantee.
- If the certificate is really expired, I contact the owner and renew it.

Follow-up they may ask: "How do you stop certificate expiry outages?" I keep an inventory with owners, automate renewal (ACME), and alert at 30, 14 and 7 days before expiry.` },
    { id: 'iv-foundations-19', topic: 'foundations', q: 'What is mutual TLS and when would you use it?', a: `- In normal TLS only the server proves its identity. In **mTLS** the client also presents a certificate, and the server verifies its chain and maps it to an identity.
- I use it between internal services in a zero-trust network, and for B2B APIs where both sides must be sure who is calling, as with some bank and tax-system APIs.
- The cost is operations: issuing, distributing, rotating and revoking client certificates.
- Failure mode: an expired client certificate fails at the handshake, before any HTTP happens, so the symptom is a connection error and not a 401.

Follow-up they may ask: "mTLS or OAuth client credentials?" mTLS authenticates the connection, while OAuth gives a scoped, short-lived token. They can be combined.` },
    { id: 'iv-foundations-20', topic: 'foundations', q: 'What is the difference between L4 and L7 load balancing?', a: `- **L4** decides using only the IP address and port. It never reads the request. It is fast and works for any protocol, such as PostgreSQL, Kafka or MQTT.
- **L7** reads the HTTP request. It can route by path or host, end TLS, set cookies, rewrite URLs and run a WAF. It is smarter and a little slower.
- My rule: HTTP traffic gets L7, and everything else, or maximum raw speed, gets L4. Often I use both, a global L7 in front and a regional L4 behind.
- In Azure these are Azure Load Balancer (L4) and Application Gateway or Front Door (L7).

Follow-up they may ask: "Where does TLS end?" Usually at the L7 balancer (TLS termination), and then I decide whether to re-encrypt to the backend.` },
    { id: 'iv-foundations-21', topic: 'foundations', q: 'How does a load balancer choose a server, and how does it know one is dead?', a: `- **Algorithms:** round robin when requests cost about the same, weighted round robin when servers differ in size, least connections when some requests are long (report exports), and IP or consistent hash when the same client must reach the same server.
- **Health checks:** active ones call something like \`GET /health\` every few seconds. After N failures in a row the server is removed, and after M successes it is put back. Passive ones remove a server that returns errors or times out.
- I keep \`/health\` shallow. A deep check that queries the database can make every server look dead when the database is slow, and the balancer then removes them all (a cascading failure).
- Before removing a server I use connection draining, so current requests finish.

Follow-up they may ask: "What if every server fails the check?" I prefer to fail open and keep serving, and I alert loudly.` },
    { id: 'iv-foundations-22', topic: 'foundations', q: 'How would you scale this API to ten times the traffic and avoid downtime when deploying?', a: `- Make the service **stateless**: sessions and uploads go to shared storage.
- Run several instances behind a **layer 7 load balancer** with least connections or round robin, and active health checks on a shallow \`/health\`.
- Add autoscaling on CPU or request rate, and a CDN for static content.
- Deploy with **blue-green** (switch in one step, switch back if it fails) or a **canary** at a small share of traffic, watching error rate and latency, with connection draining and a one-step rollback.
- Name what can still fail: the database. I would add a read replica or a cache, and check its limits.

Follow-up they may ask: "Why not sticky sessions?" They make load uneven and lose state when a server restarts. A shared store or a signed token is better.` },
    { id: 'iv-foundations-23', topic: 'foundations', q: 'What is the difference between a forward proxy, a reverse proxy and an API gateway?', a: `- A **forward proxy** works for the client. A company proxy filters sites, caches downloads and logs activity, and the website sees the proxy and not me. It is also the box that can inspect TLS.
- A **reverse proxy** works for the server. Clients think it is the website, and it picks the hidden backend, ends TLS, caches, compresses and routes by path (nginx, HAProxy, Application Gateway).
- An **API gateway** is a reverse proxy with API features: authentication, rate limiting, request changes, versioning and usage analytics (Azure API Management).
- A **load balancer** is a reverse proxy whose main job is to spread traffic and drop unhealthy servers.
- Behind a proxy my app sees the proxy's IP, so I read the client address from \`X-Forwarded-For\`, trusted only from my own proxy.

Follow-up they may ask: "Does the gateway replace authorization in the service?" No. The gateway checks the token, and the service still checks the role for each action.` },
    { id: 'iv-foundations-24', topic: 'foundations', q: 'How would you secure a database in the cloud?', a: `- **Network:** no public address. It sits in a private data subnet, and the NSG allows only the app subnet on the database port, with default deny.
- **Platform databases:** use a private endpoint, switch public network access off, and link the private DNS zone to the VNet.
- **Admins:** connect through a bastion or VPN with just-in-time access, never by exposing RDP, SSH or 5432 to the internet.
- **Identity and data:** credentials from a managed identity or Key Vault, TLS in transit, encryption at rest, and every access logged and alerted.
- The answer climbs through network, identity, encryption and monitoring: defence in depth.

Follow-up they may ask: "What is the most common real-world mistake?" A rule that allows port 5432 from 0.0.0.0/0 "just for the demo" and then stays forever.` },
    { id: 'iv-foundations-25', topic: 'foundations', q: 'What is zero trust, and how is it different from the old network model?', a: `- The old model trusted anything inside the office network. A stolen laptop or an attacker inside then had access to everything.
- **Zero trust** says never trust, always verify. It is a way of thinking, not a product.
- **Verify explicitly:** authenticate and authorise every request using identity, device health and context, even from inside.
- **Least privilege:** give only the access needed, for only the time needed.
- **Assume breach:** segment the network, log everything and keep the blast radius small.
- Identity replaces network location as the main control, which is why authentication and authorization matter so much.

Follow-up they may ask: "Do firewalls still matter?" Yes. Zero trust adds identity checks on top of segmentation, it does not remove the network controls.` },
    { id: 'iv-foundations-26', topic: 'foundations', q: 'What is the difference between authentication and authorization, and how would you design access for a payroll tool?', a: `Authentication proves who the caller is. Authorization decides what that caller may do.
- I would use **RBAC** with roles for uploader, reviewer and admin, with least privilege for each role.
- A **maker-checker** rule means nobody can approve their own upload, even if their role would normally allow it.
- Each automation gets its own managed identity, secrets live in Key Vault and never in code, and data is encrypted in transit and at rest.
- Every sensitive action goes to an append-only audit log, with alerts on privilege changes. Access is reviewed every quarter.
- In HTTP terms, a missing or bad token is 401 and a valid token without permission is 403.

Follow-up they may ask: "Where would you enforce the check?" In the service for every action, because a gateway or a hidden button in the UI is not enough.` },
    { id: 'iv-foundations-27', topic: 'foundations', q: 'How would you store user passwords?', a: `- Best answer: I would not store them. I would delegate sign-in to an identity provider such as Microsoft Entra ID, so my app never sees a password.
- If I truly had to, I would store only a **salted hash** made with a deliberately slow algorithm such as Argon2id or bcrypt, with a random salt per user and a tuned cost.
- I would verify with a constant-time comparison.
- On top of that: MFA, rate limiting or lockout, and breached-password checks.
- I would never use a fast hash such as MD5 or plain SHA-256, never invent my own scheme, and never log passwords or tokens.

Follow-up they may ask: "Why is a salt needed if the hash is slow?" Without a salt, equal passwords have equal hashes, and one precomputed table cracks them all. A salt forces the attacker to work on each account separately.` },
    { id: 'iv-foundations-28', topic: 'foundations', q: 'What is MFA, and which second factors are strongest?', a: `- **MFA** means two or more different kinds of proof: something you know, something you have, something you are. A password plus a second password is not MFA.
- The weakest common second factor is an SMS code, because SIM-swap attacks exist.
- An authenticator app is better.
- A FIDO2 security key or a passkey is the strongest. It is phishing-resistant because the key only answers to the real website.
- MFA stops most account takeovers, but it does not stop session theft, so cookies and tokens still need short lifetimes and the right flags.

Follow-up they may ask: "What is credential stuffing and how does MFA help?" Attackers try leaked email and password pairs on my site. MFA stops a correct password from being enough.` },
    { id: 'iv-foundations-29', topic: 'foundations', q: 'Explain OAuth 2.0 versus OpenID Connect versus SAML.', a: `- **OAuth 2.0** is about authorization and delegation: "this app may read these files on my behalf". Its main product is the access token, like a valet key.
- **OpenID Connect** is a thin layer on top of OAuth 2.0 for authentication: "this user just signed in, and here is who they are". Its main product is the ID token, a signed JWT.
- **SAML 2.0** is an older SSO standard that sends signed XML assertions. It is common in older enterprise and SaaS apps and is for sign-in only.
- For a new web, mobile or API scenario I choose OIDC. If a vendor supports only SAML, I set it up with metadata exchange and attribute mapping.
- An API must accept access tokens for its own audience and never an ID token.

Follow-up they may ask: "Can OAuth alone tell me who the user is?" Not reliably. That is the job of OIDC and its ID token.` },
    { id: 'iv-foundations-30', topic: 'foundations', q: 'Which OAuth flow would you use for a web app and for a nightly job, and what is PKCE?', a: `- **Web app where a person signs in:** authorization code flow with **PKCE**. The app validates \`state\`, swaps the code for tokens on the back channel, and calls the API with the access token.
- **Nightly job with no user:** client credentials, ideally with a managed identity so there is no secret to leak.
- **Tool with no browser:** device code flow.
- **PKCE:** the app creates a random verifier, sends only its hash (the challenge) at the start, and reveals the verifier when redeeming the code. A stolen code is useless without it.
- I request the narrowest scopes or app roles, keep access tokens short-lived, and match the redirect URI exactly.

Follow-up they may ask: "Where do you store the refresh token in a browser app?" On a server component that gives the browser an HttpOnly session cookie, not in localStorage.` },
    { id: 'iv-foundations-31', topic: 'foundations', q: 'How does an API validate a JWT, and why is a JWT not secret?', a: `- It checks the format, then enforces an **algorithm allow-list** in code and never trusts the token's own \`alg\`. This blocks \`alg: none\` and key-confusion attacks.
- It verifies the signature with the issuer's public key, found by \`kid\` in the **JWKS**. Keys are cached and re-fetched on an unknown \`kid\`, which allows rotation.
- It checks \`iss\`, \`aud\`, \`exp\` and \`nbf\` (with a little clock skew), and finally the scope or role for the action.
- A JWT is only signed, not encrypted, so anyone holding it can read the payload. That is why it carries no secrets, why lifetimes are short, and why revocation needs refresh tokens or a deny-list.
- In production I use a maintained library, not hand-written code.

Follow-up they may ask: "How do you log out a fired employee right away?" Disable the account so no new tokens are issued, use short-lived access tokens, and for urgent cases keep a deny-list or use opaque tokens with introspection.` },
    { id: 'iv-foundations-32', topic: 'foundations', q: 'A secret was committed to a public GitHub repository. What do you do?', a: `- **First, revoke or rotate the secret.** Assume bots have already copied it, because they scan GitHub constantly.
- Then investigate: check the logs of the secret manager and the service for use of that credential since the commit.
- Only then clean up the Git history, and know that deleting the commit does not make the leak undone.
- Prevent it next time: secrets in Key Vault or runtime environment variables, \`.env\` files in \`.gitignore\`, a pre-commit scanner and GitHub push protection.
- Best of all, use a managed identity so that there is no secret at all.

Follow-up they may ask: "Where do secrets belong?" No secret at all (managed identity) first, then a secret manager with identity-based access and audit, then runtime environment variables.` },
    { id: 'iv-foundations-33', topic: 'foundations', q: 'What is the difference between encoding, hashing and encryption, and what is envelope encryption?', a: `- **Encoding** (Base64) is reversible by anyone, with no key. It hides nothing.
- **Hashing** is one-way. It is used for fingerprints, integrity and password storage (with salt and a slow algorithm).
- **Encryption** is reversible only with the key (AES, RSA). It keeps data secret.
- **Envelope encryption:** each record or file is encrypted with its own random data key, and the data key is encrypted by a master key that never leaves the key service (KMS or HSM). Rotating the master key re-wraps small keys instead of re-encrypting terabytes.
- Keys should never sit next to the data they protect, and separate people should manage keys and read data.

Follow-up they may ask: "Basic auth is base64, so is it encrypted?" No. Anyone can decode it, so it is acceptable only inside TLS.` },
    { id: 'iv-foundations-34', topic: 'foundations', q: 'What are RBAC, ABAC and ACL, and how do you apply least privilege?', a: `- **ACL:** each resource carries its own list of who may do what. It is fine for a few files and unmanageable for thousands.
- **RBAC:** people get roles and roles carry permissions. It is the workhorse of Azure, Power BI and most business apps.
- **ABAC:** a policy uses attributes of the user, the resource and the context, such as "Finance users may read payroll rows of their own entity, from a managed device". Row-level security is ABAC in practice.
- **Least privilege:** the smallest permissions for the shortest time, such as Contributor on one resource group instead of Owner on the subscription. I add just-in-time elevation and quarterly access reviews against permission creep.
- Default deny, and separation of duties (maker-checker), sit above all models.

Follow-up they may ask: "When would you not use ABAC?" When simple roles are enough, because attribute policies are harder to reason about and to test.` },
    { id: 'iv-foundations-35', topic: 'foundations', q: 'Explain ACID.', a: `Think of moving ₹5,000 from one account to another.
- **Atomicity:** both the debit and the credit happen, or neither does.
- **Consistency:** the rules still hold afterwards, for example debits equal credits and constraints are satisfied.
- **Isolation:** concurrent transactions do not see each other's half-finished work. The isolation level decides how strict this is, and the default is often read committed.
- **Durability:** once committed, the change survives a crash, because the database writes it to a log first.
- Failure modes: a long transaction that holds locks, two sessions updating the same row and deadlocking, and a read-then-write done outside a transaction.

Follow-up they may ask: "Do NoSQL databases have ACID?" Some do in a limited scope, such as a single document, so I check what the guarantees are before I rely on them for money.` },
    { id: 'iv-foundations-36', topic: 'foundations', q: 'Explain the CAP theorem with an example.', a: `In a distributed system, when a network partition happens, I must choose between consistency and availability. I cannot have both, and partitions do happen.
- Example: two data centres hold copies of a ledger balance and the link between them breaks.
- **Consistency first (CP):** the side that cannot reach the majority refuses writes. Balances never disagree, but some users see errors.
- **Availability first (AP):** both sides keep accepting writes and reconcile later. Users are served, but conflicts must be resolved.
- For a ledger or a payment I choose consistency. For a product catalogue or a view counter I choose availability.
- CAP only describes behaviour during a partition. When there is no partition I still trade latency against consistency (PACELC).

Follow-up they may ask: "Is PostgreSQL on one server CP or AP?" CAP does not really apply to a single node. It matters once I add replicas across a network.` },
    { id: 'iv-foundations-37', topic: 'foundations', q: 'What is eventual consistency, and how do you deal with replication lag?', a: `- **Eventual consistency** means replicas may disagree for a short time, but they agree once updates stop. **Strong consistency** means every read sees the latest successful write.
- Replication lag is the delay before a replica sees a change. Example: I post a journal, refresh the report on a replica, and still see the old total.
- Mitigations: read from the primary right after a write (read-your-own-writes), pin that session to the primary for a short time, or show a "last updated" stamp.
- I monitor the lag, and I never use a replica for a read-then-write decision such as "check the balance, then pay".
- I use eventual consistency where a little staleness is harmless, such as dashboards and counters.

Follow-up they may ask: "How do you pick between them?" By asking what harm a stale read does. For money, none is allowed. For a dashboard, a few seconds is fine.` },
    { id: 'iv-foundations-38', topic: 'foundations', q: 'What is idempotency and why does it matter for retries?', a: `An operation is **idempotent** if doing it twice has the same effect as doing it once.
- A timeout is ambiguous: the request may have succeeded. If I retry a non-idempotent call such as "create payment", I may pay twice.
- My cure is an **idempotency key**: the client sends a unique key for each logical operation, and the server stores the key with the first result inside the same transaction as the side effect, using a unique constraint. A repeat returns the stored result.
- I also design operations to be naturally idempotent where I can: PUT, upsert by business key, or "set status to paid" instead of "toggle".
- Failure modes: saving the key after the side effect (a crash window), two concurrent requests with the same key, a key that expires too soon, and the same key reused with a different body (I reject that with 409 or 422).

Follow-up they may ask: "Which HTTP methods are idempotent?" GET, PUT, DELETE, HEAD and OPTIONS. POST is not, and PATCH may not be.` },
    { id: 'iv-foundations-39', topic: 'foundations', q: 'How do you design retries with backoff and jitter?', a: `- Retry only **transient** errors (timeouts, connection resets, 429, 502, 503, 504), and only when the call is idempotent. Never retry 400, 401, 403, 404 or 422, which need a fix first.
- **Exponential backoff:** wait longer after each failure, with a cap, for example \`delay = min(cap, base * 2**attempt)\`.
- **Jitter:** pick a random delay up to that value, so that clients do not retry in step. Without it, a recovering service is hit by waves (a retry storm, or thundering herd).
- Honour \`Retry-After\`, set a maximum number of attempts and an overall deadline, and consider a circuit breaker.
- Beware of nested retries: three layers with three attempts each can multiply a single failure into twenty-seven calls.

Follow-up they may ask: "What do you do after the last attempt fails?" Send the work to a dead-letter queue or a failure table, alert a named owner, and keep the original input so it can be replayed.` },
    { id: 'iv-foundations-40', topic: 'foundations', q: 'What delivery guarantees do queues offer, and what is a dead-letter queue?', a: `- **At-most-once:** a message may be lost but is never repeated.
- **At-least-once:** a message is never lost but may arrive more than once. This is the usual default, so consumers must cope with duplicates.
- **"Exactly-once"** is hard to get across a network. In practice it means at-least-once delivery plus an idempotent consumer, for example one that checks the message ID before posting a payment.
- A **dead-letter queue** holds messages that keep failing after N attempts. A poison message then no longer blocks the rest, and someone can inspect it, fix the cause and replay it.
- I alert on dead-letter queue depth. Failure modes are endless retry loops and silently dropped messages.

Follow-up they may ask: "Queue or pub/sub?" A queue gives each message to one worker, and pub/sub gives every subscriber its own copy of the event.` },
    { id: 'iv-foundations-41', topic: 'foundations', q: 'How do you use a cache safely? Explain cache-aside.', a: `- **Cache-aside:** the app checks the cache first. On a miss it reads the database and stores the result in the cache with a TTL. When the data changes, it updates the database and then removes the cached key.
- A TTL is the safety net for invalidation, which is the hard part.
- Failure modes: stale data after an update, a cache stampede when a popular key expires and many requests hit the database at once (I add a lock or random TTL jitter), and a cache outage (the app must still work, only slower).
- I do not cache data that needs strong consistency, such as a balance used for a payment decision, and I never put per-user data under a shared key.
- I measure hit ratio and latency to prove that the cache is worth its complexity.

Follow-up they may ask: "Write-through or cache-aside?" Write-through updates the cache on every write, which is simpler to reason about but caches data that may never be read. I use cache-aside for read-heavy data.` },
    { id: 'iv-foundations-42', topic: 'foundations', q: 'How does rate limiting work? Explain the token bucket.', a: `- A **token bucket** holds up to N tokens and refills at a steady rate. Each request takes one token. If the bucket is empty, the request is rejected with 429 and a \`Retry-After\` header, or it waits.
- N sets the allowed burst, and the refill rate sets the average speed.
- I key the limit by API key or user (and sometimes IP), enforce it at the API gateway or in middleware, and keep the counters in a shared store such as Redis when there are several instances.
- Fixed windows allow a double burst at the boundary, and a leaky bucket smooths output.
- Failure modes: a limit per instance instead of global, and the limiter itself failing. I decide in advance whether it fails open or closed.

Follow-up they may ask: "How should a client react to 429?" Wait for the \`Retry-After\` time, then retry with backoff and jitter.` },
    { id: 'iv-foundations-43', topic: 'foundations', q: 'How would you scale a database, and when would you shard?', a: `I go in order, from cheap to costly.
- First fix queries and indexes, then add a cache.
- Scale up (a bigger machine), then add **read replicas** for read traffic, accepting some replication lag.
- Partition large tables inside one database, and move analytics to a warehouse.
- **Shard** only when write volume or data size exceeds one machine. Data is split across databases by a shard key.
- The costs are real: cross-shard joins and transactions are hard, a poor key creates hot shards, and resharding is painful. The key should have many values, spread evenly, and appear in most queries.

Follow-up they may ask: "Would you shard by entity?" Only if the entities are similar in size. If one entity dominates, I hash a finer key such as the customer ID.` },
    { id: 'iv-foundations-44', topic: 'foundations', q: 'What would you log, measure and alert on?', a: `- **Logs:** structured events with a correlation ID, job ID, outcome and error. No secrets, and PAN masked.
- **Metrics:** the golden signals (latency, traffic, errors, saturation), and for pipelines freshness, rows in and out, failed tests, run duration, queue depth, dead-letter count and cost.
- **Traces:** the path of one request across services, to find where the time went.
- **Alerts:** on symptoms users feel, tied to an SLO (late load, error rate, stale data), not on every CPU spike. Each alert has a named owner and a runbook.
- Failure modes: alert fatigue, silent failure with no row-count check, and logs full of personal data.

Follow-up they may ask: "How do you find a slow request across five services?" I search by the correlation ID and open the trace to see which span is slow.` },
    { id: 'iv-foundations-45', topic: 'foundations', q: 'What are SLI, SLO and SLA, and what is an error budget?', a: `- **SLI:** the number I measure, for example the share of nightly loads finished before 08:00.
- **SLO:** the internal target for that number, for example 99% of loads on time over a month.
- **SLA:** the promise to the customer, with consequences if it is broken. It is usually looser than the SLO.
- **Error budget:** the failure the SLO allows. With a 99% target the budget is the other 1%.
- When the budget is nearly spent, the team slows feature work and spends effort on reliability. This turns an argument into a number.

Follow-up they may ask: "How would you set an SLO for a finance report?" I would ask the CFO when the number is needed, measure how often the report is on time today, and then set a target I can already nearly meet. I tighten it later as the pipeline improves.` },
    { id: 'iv-foundations-46', topic: 'foundations', q: 'Walk me through how you handle an incident and write a post-mortem.', a: `- **During:** detect (alert), acknowledge, assess the impact, and mitigate first (roll back, fail over, switch a feature off). Finding the root cause can wait until the damage has stopped.
- Communicate clearly and regularly with the people affected, and keep a timeline as I go.
- **After:** a blameless post-mortem with the timeline, impact, root and contributing causes, what went well, what went badly, and action items with owners and dates.
- Blameless means I look at how the system allowed the mistake, not at who made it.
- I follow up on the actions. A post-mortem with no finished actions will repeat itself.

Follow-up they may ask: "Give me an example action item." Add a row-count alert on the GL load, so a half-empty file is caught before the report is sent.` },
    { id: 'iv-foundations-47', topic: 'foundations', q: 'Why is Parquet faster than CSV for analytics?', a: `- **Columnar layout:** a query that sums \`amount\` reads only that column and skips the rest. CSV forces me to read every field of every row.
- **Compression and encoding:** values in one column look alike, so they shrink a lot, which means less data to read from disk or the network.
- **Types and schema** are stored in the file, so there is no guessing of dates and numbers.
- **Statistics** (min and max per block) let the engine skip blocks that cannot match a filter, and partitioned folders let it skip whole folders.
- Trade-offs: it is not human-readable, files are written whole rather than edited, and it is poor for fetching one row. Many tiny files also hurt.

Follow-up they may ask: "Would you ever keep CSV?" Yes, for exchange with people and legacy systems, and as the raw bronze copy exactly as received.` },
    { id: 'iv-foundations-48', topic: 'foundations', q: 'How do you choose a file format, and how do you handle schema evolution and folder layout?', a: `- **CSV:** exchange with people and old systems, with no types. **JSON:** API payloads with nested data. **JSON Lines:** event logs that I append to and stream. **Excel:** for humans only, because of merged cells, hidden formulas and date surprises.
- **Parquet** (or ORC) for analytics storage. **Avro** for streaming messages, since the schema travels with the data.
- **Schema evolution:** adding an optional column with a default is usually safe. Renaming, removing or retyping a column is breaking, so it needs notice, a versioned contract and compatibility rules.
- **Folder layout:** partition by a column that queries often filter on and that has few values, such as \`sales/year=2026/month=09/\`. Do not partition by a high-cardinality column like customer ID, and avoid many tiny files.

Follow-up they may ask: "What format would you use for bronze?" The file exactly as received, plus load date and source in the folder path, and a Parquet copy in silver.` },
    { id: 'iv-foundations-49', topic: 'foundations', q: 'How do you choose the right database for a use case?', a: `I start from the access pattern, not from fashion.
- **Relational (PostgreSQL):** the default. Structured data, joins and ACID transactions, such as the ledger and payroll.
- **Document:** flexible, nested records whose shape varies. **Key-value (Redis):** very fast lookups by key, such as sessions and caches.
- **Columnar warehouse:** analytics over many rows. **Graph:** questions about relationships, such as shared bank accounts between vendors and employees.
- **Time-series:** metrics stamped with time. **Vector:** similarity search over embeddings, for RAG. **Object storage:** files and the base of a lake.
- I would start with PostgreSQL and add a specialised store only with evidence that it is needed, because every new store adds operations, cost and another thing to secure.

Follow-up they may ask: "Can PostgreSQL be your vector or JSON store?" For small and medium cases yes, with JSONB and a vector extension, and that avoids another system.` },
    { id: 'iv-foundations-50', topic: 'foundations', q: 'On Windows, a service fails to start because port 5432 is already in use. How do you find the process and deal with it?', a: `- Find the owner: \`Get-NetTCPConnection -LocalPort 5432 -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess\`. The older way is \`netstat -ano | findstr :5432\`.
- Name it: \`Get-Process -Id <PID>\` (or \`tasklist /FI "PID eq <PID>"\`).
- Decide: is it expected, such as a local PostgreSQL service or a Docker container that publishes the port? If so, I stop that one or start my new service on another port.
- If it is a stray development process, I stop it with \`Stop-Process -Id <PID>\`.
- I look at the bind address too: 127.0.0.1 means local only, and 0.0.0.0 means reachable from the network. On a shared server I never kill a process I cannot identify.

Follow-up they may ask: "Why does the same command work in WSL but not in PowerShell?" They are different environments with different PATH values and, for WSL2, a separate virtual network, so I first check which one I am in.` },
    { id: 'iv-foundations-51', topic: 'foundations', q: 'Walk me through the design doc you would write for a finance reporting engine.', a: `- **Problem and goals:** who uses it, the freshness number, the non-goals, and how success is measured.
- **Architecture and data flow:** a sketch from sources to ingest, bronze, silver, gold and serve, and which part is bought and which is built.
- **Network and auth:** private subnets and endpoints, managed identities, RBAC with maker-checker, secrets in Key Vault, and masking of PAN.
- **Failure modes:** a table of late file, schema change, duplicate load and source outage, with how each is detected and recovered.
- **Operations and cost:** monitoring, SLOs, alerts with owners, a rough cost shape and the scaling limits. Finally the alternatives I rejected and the open questions.
- A design doc is cheap to change, and code is not, so I want the review before I build.

Follow-up they may ask: "What did you reject, and why?" I list it in the doc: for example streaming, rejected because the finance team accepts a daily refresh and streaming costs more to run.` },
    { id: 'iv-foundations-52', topic: 'foundations', q: 'A command works in one PowerShell window but says "not recognized" in another. What is going on?', a: `- Most likely **PATH**: the environment variable that lists the folders where the shell looks for programs. A window opened before the install does not see the new folder.
- I open a new window, or check \`$env:Path\`, and use \`Get-Command <name>\` to see where the program is found.
- If it is still missing, I add the folder to PATH (user level for my own tools), restart the terminal, and test again.
- Other causes: a different shell (PowerShell vs WSL have separate PATH values), a different program with the same name earlier on the PATH, or a Python virtual environment that is not activated.
- Settings that differ between machines (such as a database URL) belong in environment variables, not in code.

Follow-up they may ask: "How do you keep secrets out of environment files in Git?" I put \`.env\` in \`.gitignore\`, and on servers the platform injects values or reads them from Key Vault.` },
  ],
};
