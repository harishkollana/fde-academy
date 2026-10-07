export default {
  id: 'foundations-http-in-depth',
  title: 'HTTP in depth: requests, responses, status codes and headers',
  goal: 'You can read and write a raw HTTP request and response, pick the right method, interpret any status code including 401 vs 403 and 502 vs 504, and explain headers, cookies and caching.',
  roadmap: ['HTTP methods, status codes, headers', 'Cookies and caching headers', 'HTTP/1.1, HTTP/2 and HTTP/3'],
  blocks: [
    `## The problem
Your Power Automate flow calls an API and fails. You tell the API owner: *"it failed."* They reply: *"With what status code, and what did the response body say?"*

HTTP is the language of almost everything you will connect in this course: REST APIs, webhooks, OAuth, LLM providers, Azure management, even Power BI's service. If you can read it, you can debug it. If you cannot, every failure is "it failed".

## What HTTP is
**HTTP** (*HyperText Transfer Protocol*) is a plain-text conversation between a **client** and a **server**, carried over a TCP connection (and wrapped in TLS for HTTPS, next lesson). It follows one rule: the client sends a **request**, the server sends back one **response**. It is **stateless**: the server does not remember you between requests unless you send something (a cookie or a token) that lets it recognise you.`,
    { sketch: { w: 760, h: 290, caption: 'A request and its response are just structured text: a start line, headers, a blank line, then an optional body', items: [
      { t: 'text', x: 190, y: 20, text: 'REQUEST (client → server)', bold: true },
      { t: 'box', x: 14, y: 34, w: 352, h: 190, fill: 'yellow' },
      { t: 'text', x: 26, y: 62, text: 'POST /v1/payroll-files HTTP/1.1', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 26, y: 88, text: 'Host: api.kollana-tech.in', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 26, y: 112, text: 'Authorization: Bearer eyJ0eXAi...', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 26, y: 136, text: 'Content-Type: application/json', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 26, y: 160, text: '(blank line)', anchor: 'start', size: 13, color: '#8a93a6', font: 'mono' },
      { t: 'text', x: 26, y: 188, text: '{ "file": "payroll_2026-09" }', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 570, y: 20, text: 'RESPONSE (server → client)', bold: true },
      { t: 'box', x: 394, y: 34, w: 352, h: 190, fill: 'green' },
      { t: 'text', x: 406, y: 62, text: 'HTTP/1.1 202 Accepted', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 406, y: 88, text: 'Content-Type: application/json', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 406, y: 112, text: 'Location: /v1/jobs/42', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 406, y: 136, text: 'Retry-After: 5', anchor: 'start', size: 14, font: 'mono' },
      { t: 'text', x: 406, y: 160, text: '(blank line)', anchor: 'start', size: 13, color: '#8a93a6', font: 'mono' },
      { t: 'text', x: 406, y: 188, text: '{ "job_id": 42 }', anchor: 'start', size: 14, font: 'mono' },
      { t: 'arrow', x1: 366, y1: 110, x2: 394, y2: 110 },
      { t: 'text', x: 380, y: 256, text: 'start line (method + path, or status)  ·  headers  ·  blank line  ·  body', size: 15, color: '#c2410c' },
    ] } },
    `## Anatomy of a URL
\`https://api.kollana-tech.in:8443/v1/payroll/jobs?status=failed&page=2#top\`
- **scheme** \`https\` (which protocol), **host** \`api.kollana-tech.in\` (found by DNS), **port** \`8443\` (default 443 for https, 80 for http), **path** \`/v1/payroll/jobs\` (which resource), **query** \`status=failed&page=2\` (filters), **fragment** \`#top\` (browser-only, never sent to the server).`,
    { py: {
      title: 'Pull a URL and a raw request apart',
      starter: `from urllib.parse import urlparse, parse_qs, urlencode

url = "https://api.kollana-tech.in:8443/v1/payroll/jobs?status=failed&page=2#top"
u = urlparse(url)
print("scheme  :", u.scheme)
print("host    :", u.hostname, " port:", u.port)
print("path    :", u.path)
print("query   :", parse_qs(u.query))
print("fragment:", u.fragment, "(never sent to the server)")
print("encode  :", urlencode({"q": "GST & invoices", "page": 1}))   # spaces and & are escaped safely

raw = """POST /v1/payroll-files HTTP/1.1
Host: api.kollana-tech.in
Content-Type: application/json
Authorization: Bearer abc123

{"file": "payroll_2026-09"}"""

head, body = raw.split("\\n\\n", 1)                  # blank line separates headers from body
request_line, *header_lines = head.split("\\n")
method, target, version = request_line.split(" ")
headers = {k.lower(): v for k, v in (line.split(": ", 1) for line in header_lines)}
print(method, target, version)
print(headers)
print("body:", body)`,
      note: 'Real HTTP ends each line with the two characters carriage-return and line-feed. This demo uses plain line breaks to stay readable.',
    } },
    `## Methods: what do you want to do?
| Method | Meaning | Safe? (changes nothing) | Idempotent? (same effect if repeated) |
|---|---|---|---|
| **GET** | Read a resource | yes | yes |
| **POST** | Create something / run an action | no | **no** |
| **PUT** | Replace a resource completely | no | yes |
| **PATCH** | Change part of a resource | no | not guaranteed |
| **DELETE** | Remove a resource | no | yes |
| **HEAD / OPTIONS** | Headers only / what is allowed (used by browsers for CORS) | yes | yes |

**Idempotent** matters because networks fail. If a PUT times out, you can safely send it again: the resource ends up the same. If a POST times out, resending may create a **second** payment. We build the full cure (idempotency keys) in the reliability module.

## Status codes: the server's answer
The first digit is the family:
- **1xx** information. **2xx** success. **3xx** redirect. **4xx** *you* (the client) made a mistake. **5xx** *the server* has a problem.

| Code | Meaning | What to do |
|---|---|---|
| **200 OK** | Success with a body | use it |
| **201 Created** | A new resource was made (\`Location\` header says where) | use it |
| **202 Accepted** | Received, will be processed later (poll the job) | poll |
| **204 No Content** | Success, nothing to return | done |
| **301 / 302** | Moved permanently / temporarily; follow \`Location\` | follow |
| **304 Not Modified** | Your cached copy is still good | use cache |
| **400 Bad Request** | Malformed request | fix request, do not retry |
| **401 Unauthorized** | *Who are you?* Missing, expired or bad credentials | get a valid token |
| **403 Forbidden** | *I know who you are, and you may not.* | ask for the permission |
| **404 Not Found** | No such resource (or hidden from you) | check path / id |
| **409 Conflict** | Clashes with current state (duplicate, version mismatch) | resolve conflict |
| **422 Unprocessable** | Well-formed but fails validation (FastAPI's default for bad bodies) | read the error list |
| **429 Too Many Requests** | Rate limit hit; see \`Retry-After\` | wait, then retry |
| **500 Internal Server Error** | A bug or crash in the server | report; retry carefully |
| **502 Bad Gateway** | A proxy got a bad answer from the app behind it | app down or crashing |
| **503 Service Unavailable** | Overloaded or in maintenance | retry with backoff |
| **504 Gateway Timeout** | A proxy waited too long for the app | slow backend; check timeouts |

The two that confuse everyone: **401 means not authenticated, 403 means not authorised.** A valid token that lacks the role gives 403, not 401.

## Headers worth knowing
- **Host**: which site (one server can serve many). **User-Agent**: who is calling.
- **Content-Type** / **Accept**: the format you send / the format you want (\`application/json\`, \`text/csv\`).
- **Authorization**: credentials, usually \`Bearer <token>\`. **Cookie** / **Set-Cookie**: a small value the server asks the browser to send back, how a login "session" works in a browser. Good cookies are \`HttpOnly\` (scripts cannot read them), \`Secure\` (HTTPS only) and \`SameSite\` (limits cross-site sending).
- **Cache-Control**, **ETag**, **If-None-Match**: let clients reuse responses. Send \`If-None-Match: "abc"\`; if unchanged, the server answers a tiny \`304\`.
- **Location**: where to go next (after 201 or 3xx). **Retry-After**: how long to wait. **X-Request-Id** / **traceparent**: an ID to follow one request through many systems in logs.

## Versions: HTTP/1.1, 2 and 3
- **HTTP/1.1** is text, one request at a time per connection (keep-alive reuses the connection).
- **HTTP/2** is binary and **multiplexed**: many requests share one connection at once, and headers are compressed.
- **HTTP/3** runs over **QUIC (on UDP)**, so a lost packet blocks only one stream and connections start faster.
Your code rarely changes between them; the libraries negotiate it. You see the difference in performance and in how load balancers are configured.

## REST, RPC and friends
**REST** models *things* (resources) with URLs and uses HTTP methods as the verbs: \`GET /jobs/42\`, \`DELETE /jobs/42\`. **RPC** style models *actions*: \`POST /startValidation\`. Both are used. **GraphQL** lets the client ask for exactly the fields it wants through one endpoint; **gRPC** uses a compact binary format between services. We design REST APIs properly in the backend stage. Try a mock one now: send a login, then upload a payroll file, then poll the job.`,
    { widget: 'ApiPlayground' },
    { pychallenge: {
      id: 'foundations-pych-parse-request',
      prompt: 'Write `parse_request(raw)` that takes a raw HTTP request (a string whose start line, headers, a blank line and body are separated by `\\n`) and returns a **tuple** `(method, path, headers, body)`. `headers` is a dict with **lower-case** names. If there is no body, return an empty string for it.',
      starter: `def parse_request(raw):
    return None`,
      tests: `raw = "POST /v1/payroll-files HTTP/1.1\\nHost: api.kollana-tech.in\\nContent-Type: application/json\\n\\n{\\"file\\": \\"p.csv\\"}"
m, p, h, b = parse_request(raw)
assert m == "POST" and p == "/v1/payroll-files"
assert h == {"host": "api.kollana-tech.in", "content-type": "application/json"}
assert b == '{"file": "p.csv"}'
m, p, h, b = parse_request("GET /health HTTP/1.1\\nHost: x\\n\\n")
assert (m, p, b) == ("GET", "/health", "") and h == {"host": "x"}`,
      solution: `def parse_request(raw):
    head, _, body = raw.partition("\\n\\n")
    start, *lines = head.split("\\n")
    method, path, _version = start.split(" ")
    headers = {}
    for line in lines:
        name, value = line.split(": ", 1)
        headers[name.lower()] = value
    return method, path, headers, body`,
      hint: 'str.partition("\\n\\n") splits at the blank line even when there is no body. Then split the head into lines.',
    } },
    { pychallenge: {
      id: 'foundations-pych-should-retry',
      prompt: 'Write `should_retry(status)` that says whether a client may automatically retry a failed call: `True` for **429, 502, 503 and 504**, `False` for every other status (success, other 4xx errors that need a fix, and 500 which may be a bug that will repeat).',
      starter: `def should_retry(status):
    return False`,
      tests: `for code in (429, 502, 503, 504):
    assert should_retry(code) is True
for code in (200, 201, 400, 401, 403, 404, 409, 422, 500):
    assert should_retry(code) is False`,
      solution: `def should_retry(status):
    return status in (429, 502, 503, 504)`,
      hint: 'A set or tuple membership test is enough.',
    } },
    { local: '**Send real requests from PowerShell.** In Windows PowerShell, `curl` is an alias for another cmdlet, so call **`curl.exe`** explicitly.\n```powershell\ncurl.exe -i https://example.com                 # -i prints the response headers too\ncurl.exe -I https://example.com                 # HEAD request: headers only\ncurl.exe -v https://example.com 2>&1 | Select-Object -First 25   # -v shows the TLS handshake and both directions\ncurl.exe -s -o NUL -w "%{http_code} %{time_total}s\\n" https://example.com\n```\nExpected: a first line like `HTTP/2 200` (or `HTTP/1.1 200 OK`), then headers such as `content-type`, `cache-control`, and the body. The last command prints just the status code and total time, a handy health check. Try a path that does not exist (for example `https://example.com/nope`) and note the `404`.' },
    { warn: 'Never put secrets in the **URL query string**, for example \`?api_key=abc123\`. URLs are written to server logs, proxy logs and browser history. Put credentials in the **Authorization header** (or a cookie) instead.' },
    { interview: '**"What is the difference between 401 and 403, and between 502 and 504?"** Model answer: "401 means the caller is not authenticated: no token, an expired one or a bad one. 403 means they are authenticated but not allowed. 502 means a gateway got an invalid response from the app behind it, often because the app crashed. 504 means the gateway gave up waiting, so the backend is slow or a timeout is too short." Follow with how you would debug each. That turns a definition into evidence of experience.' },
    { real: 'A Power Automate HTTP action shows you the status code and body in the run history. Before this lesson "it failed" was the whole story. Now you can read: `403` means the token is fine but the app role is missing; `429` means slow down and honour `Retry-After`; `504` means the Function took longer than the gateway allows, so make the work asynchronous and return `202`.' },
    `## Recap
- HTTP is request → response, text-based and **stateless**. A request has a start line, headers, a blank line and an optional body.
- **Methods**: GET reads, POST creates/acts, PUT replaces, PATCH changes part, DELETE removes. Know which are **safe** and **idempotent**.
- **Status families**: 2xx success, 3xx redirect, 4xx client error, 5xx server error. **401 = not authenticated, 403 = not allowed; 502 = bad gateway, 504 = gateway timeout.**
- Headers carry the format (\`Content-Type\`), credentials (\`Authorization\`), cookies, caching rules and tracing IDs.
- HTTP/2 multiplexes; HTTP/3 uses QUIC over UDP. Use \`curl.exe\` in PowerShell to see the truth.`,
  ],
  quiz: [
    { q: 'A request has a valid access token but the user lacks the required role. Which status is correct?', o: ['502', '401', '403', '404'], a: 2, why: '403 means authenticated but not authorised. 401 is for missing or invalid credentials.' },
    { q: 'Which method is both safe and idempotent?', o: ['GET', 'DELETE', 'POST', 'PATCH'], a: 0, why: 'GET only reads, so it changes nothing and repeating it is harmless. DELETE is idempotent but not safe.' },
    { q: 'A nginx proxy returns 504. What does that most likely mean?', o: ['The client sent a bad body', 'The token expired', 'The app behind it crashed and returned garbage', 'The app behind it was too slow and the proxy timed out'], a: 3, why: '504 Gateway Timeout means the gateway waited too long. 502 is the bad-response case.' },
    { q: 'You get 429 with a Retry-After: 30 header. What should the client do?', o: ['Retry immediately in a loop', 'Wait about 30 seconds, then retry', 'Switch to POST', 'Give up forever'], a: 1, why: '429 is a rate limit; the server told you how long to back off.' },
    { q: 'Where should an API key be sent?', o: ['In the Authorization header', 'In the page title', 'In a GET body', 'In the URL query string'], a: 0, why: 'Query strings end up in logs and history. Headers do not.' },
    { q: 'Which statement about HTTP/3 is true?', o: ['It removed status codes', 'It only works on mobile', 'It is plain text over TCP', 'It runs over QUIC on UDP'], a: 3, why: 'HTTP/3 uses QUIC, which is built on UDP, to avoid head-of-line blocking and speed up connection setup.' },
  ],
  task: {
    title: 'Read the web with curl',
    steps: [
      'Run `curl.exe -i https://example.com`. Label on paper: the status line, three headers and the start of the body.',
      'Request a path that does not exist and note the status. Then try `curl.exe -I http://example.com` (plain http) and see whether it redirects (look for a 3xx and a `Location` header).',
      'In the ApiPlayground widget, make a call without logging in and note the status; log in as `reviewer` and try an action only `admin` may do, and note the status. Explain both codes.',
    ],
    deliverable: 'A page of annotated terminal output (status line, headers, body) and one sentence for each status code you saw, saying who is at fault and what the fix is.',
  },
};
