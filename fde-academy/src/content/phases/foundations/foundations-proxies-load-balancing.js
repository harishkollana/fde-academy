export default {
  id: 'foundations-proxies-load-balancing',
  title: 'Proxies, gateways and load balancing',
  goal: 'You can explain forward vs reverse proxies and API gateways, choose between L4 and L7 load balancing, describe the main algorithms and health checks, and plan a zero-downtime deployment with blue-green or canary.',
  roadmap: ['Reverse proxy and API gateway', 'Load balancing: L4 vs L7, algorithms, health checks', 'Sticky sessions, blue-green and canary', 'CDN'],
  blocks: [
    `## The problem
Your payroll validation API runs on one server. On the 28th, at 8 am, every HR team uploads files at once: 600 requests a second instead of 50. The server slows down, then crashes. Payroll is blocked, and you are the person who gets the call.

Two fixes come to mind. Run **more servers**, and put **something in front** that spreads requests across them and stops sending traffic to the broken one. That something is a **load balancer**, and it is one kind of **reverse proxy**. This lesson explains both ideas, because they appear in every cloud architecture and in almost every system-design interview.

## Proxies: a middleman with a purpose
A **proxy** is a server that sits between two parties and passes messages along. Which side it works for decides its name.

- A **forward proxy** works for the **client**. Your company's web proxy: employees' traffic goes through it so it can filter sites, cache downloads and log activity. The *server* sees the proxy, not you. (This is also the box that "inspects TLS" and breaks your Python script on the office network.)
- A **reverse proxy** works for the **server**. Clients talk to it thinking it is the website. It decides which hidden backend actually serves the request. It can end TLS, compress, cache, hide internal addresses, and route \`/api\` to one service and \`/\` to another. Examples: nginx, HAProxy, Envoy, Traefik; in Azure, Application Gateway and Front Door.
- An **API gateway** is a reverse proxy with API-specific powers: authentication, rate limiting, request/response transformation, versioning, usage analytics. Azure API Management is one. It is the front door to a set of services.

A **load balancer** is a reverse proxy whose main job is spreading traffic over several identical servers and removing unhealthy ones.`,
    { sketch: { w: 760, h: 330, caption: 'A load balancer gives clients one stable address, spreads requests, and stops using a server that fails its health check', items: [
      { t: 'person', x: 50, y: 92, label: 'users' },
      { t: 'box', x: 180, y: 96, w: 160, h: 92, label: 'load balancer', sub: 'one stable address', fill: 'yellow' },
      { t: 'box', x: 500, y: 18, w: 160, h: 56, label: 'server S1', sub: 'healthy', fill: 'green', size: 16 },
      { t: 'box', x: 500, y: 106, w: 160, h: 56, label: 'server S2', sub: 'healthy', fill: 'green', size: 16 },
      { t: 'box', x: 500, y: 194, w: 160, h: 56, label: 'server S3', sub: 'DOWN', fill: 'red', size: 16 },
      { t: 'arrow', x1: 92, y1: 130, x2: 180, y2: 140 },
      { t: 'arrow', x1: 340, y1: 120, x2: 500, y2: 46 },
      { t: 'arrow', x1: 340, y1: 140, x2: 500, y2: 134 },
      { t: 'arrow', x1: 340, y1: 162, x2: 500, y2: 222, dashed: true, color: '#e03131', label: 'GET /health: no answer', ly: 20, lx: 20 },
      { t: 'mark', x: 690, y: 222, ok: false },
      { t: 'note', x: 20, y: 270, w: 350, h: 48, text: 'L4: sees only IP + port.\nFast, works for any protocol.', fill: 'blue', size: 14 },
      { t: 'note', x: 390, y: 270, w: 350, h: 48, text: 'L7: reads the HTTP request.\nRoutes by path/host, ends TLS, WAF.', fill: 'purple', size: 14 },
    ] } },
    `## Layer 4 vs Layer 7
The numbers come from the networking layer model. All you need:
- **L4 (transport layer)** load balancing decides using only **IP address and port** (TCP or UDP). It never reads the HTTP request. It is very fast and works for anything: PostgreSQL, Kafka, MQTT, game servers. In Azure this is **Azure Load Balancer**.
- **L7 (application layer)** load balancing **reads the HTTP request**. It can route \`/payroll\` to one pool and \`/reports\` to another, route by host name or header, end TLS, set cookies, rewrite URLs and run a **WAF** (*web application firewall* that blocks SQL injection and similar attacks). It is smarter and a little slower. In Azure this is **Application Gateway** (regional) and **Front Door** (global).

Rule of thumb: **HTTP traffic → L7; everything else, or maximum raw speed → L4.** Often you use both: a global L7 in front, a regional L4 behind.

## How does it choose a server? Algorithms
| Algorithm | How it picks | Good when |
|---|---|---|
| **Round robin** | S1, S2, S3, S1 … in turn | requests cost about the same, servers are equal |
| **Weighted round robin** | like round robin, but a size-3 server gets 3 turns per 1 | servers differ in size |
| **Least connections** | the server with the fewest open connections now | some requests are long (uploads, reports) |
| **IP hash / consistent hash** | hash of client IP (or a key) picks the server | you need the same client on the same server, or cache affinity |
| **Least response time** | fastest recent answer | latency matters and servers vary |

## Health checks: knowing who is alive
The load balancer must stop sending traffic to a broken server. It does so with **health checks**.
- **Active**: every few seconds it calls an endpoint such as \`GET /health\` on each server. After N failures in a row (the **unhealthy threshold**) the server is removed; after M successes it is put back.
- **Passive**: it watches real traffic and removes a server that returns errors or times out.

Design the \`/health\` endpoint with care. A **shallow** check (the process is up and can answer) is safe. A **deep** check that also queries the database can cause a **cascading failure**: the database gets slow, every server fails its deep check, the balancer removes all of them, and the whole site goes down because of one slow dependency. Many teams use a shallow *liveness* check and a separate *readiness* check, and fail open (keep serving) if every server looks unhealthy.

## Sticky sessions
Some apps keep user state in a server's memory. Then the user must return to the same server: **sticky sessions** (*session affinity*), usually done with a cookie set by the balancer. It works but hurts: load becomes uneven and a server restart loses the users' state. The better design is **stateless servers**: keep state in a shared store (a database or Redis) or in a signed token, so any server can serve any request. Stateless is also what makes **autoscaling** easy.

## Scaling and deploying without downtime
- **Vertical scaling** makes one server bigger. **Horizontal scaling** adds more servers behind a balancer. Horizontal scales further and survives a failure, but needs stateless design.
- **Rolling deploy**: replace servers one at a time. **Blue-green**: run the new version (green) next to the old (blue), then flip the balancer over in one step and flip back if it fails. **Canary**: send 5% of traffic to the new version, watch the error rate, then grow to 100%.
- **Connection draining**: before removing a server, stop new requests but let current ones finish.

## CDN and the real client IP
A **CDN** (*content delivery network*) is a global fleet of caching reverse proxies. It serves static files (images, JS, PDFs) from a location near the user and keeps load off your servers. Azure Front Door and Cloudflare act as CDNs.

Because the proxy talks to your app, your app sees the **proxy's** IP. The real client address is passed in headers such as \`X-Forwarded-For\` and \`X-Forwarded-Proto\`. Configure your framework to trust those headers *only from your own proxy*, otherwise users can fake them.

Now try it yourself. Choose an algorithm, send traffic, then **crash S2** and see what happens before the health check notices.`,
    { widget: 'LoadBalancer' },
    { py: {
      title: 'Four algorithms in a few lines',
      starter: `import itertools

servers = ["S1", "S2", "S3"]
weights = {"S1": 1, "S2": 1, "S3": 3}

# 1) Round robin
rr = itertools.cycle(servers)
print("round robin :", [next(rr) for _ in range(9)])

# 2) Weighted round robin: expand each server by its weight, then cycle
wheel = [name for name, w in weights.items() for _ in range(w)]
wrr = itertools.cycle(wheel)
print("weighted    :", [next(wrr) for _ in range(10)])

# 3) Least connections: pick the server with the fewest open connections
open_conns = {"S1": 4, "S2": 1, "S3": 2}
print("least conns :", min(open_conns, key=open_conns.get))

# 4) IP hash: the same client always maps to the same server
def ip_hash(ip):
    return servers[sum(ord(c) for c in ip) % len(servers)]
for ip in ["10.0.0.11", "10.0.0.12", "10.0.0.11"]:
    print("ip hash     :", ip, "->", ip_hash(ip))`,
      note: 'Notice the weighted list: S3 appears 3 times per cycle. A real balancer interleaves them more smoothly, but the proportion is the same.',
    } },
    { pychallenge: {
      id: 'foundations-pych-wrr',
      prompt: 'Write `weighted_round_robin(weights, n)` that returns a list of the server names chosen for `n` requests. Build the repeating order by listing each server `weight` times, **in the order the dict gives them**, then cycle through that list. For `{"S1": 1, "S2": 1, "S3": 3}` and `n=10` the answer is `["S1","S2","S3","S3","S3","S1","S2","S3","S3","S3"]`.',
      starter: `def weighted_round_robin(weights, n):
    return []`,
      tests: `w = {"S1": 1, "S2": 1, "S3": 3}
assert weighted_round_robin(w, 10) == ["S1","S2","S3","S3","S3","S1","S2","S3","S3","S3"]
assert weighted_round_robin({"A": 2, "B": 1}, 6) == ["A","A","B","A","A","B"]
assert weighted_round_robin(w, 0) == []`,
      solution: `def weighted_round_robin(weights, n):
    wheel = [name for name, w in weights.items() for _ in range(w)]
    return [wheel[i % len(wheel)] for i in range(n)]`,
      hint: 'Build the "wheel" list first with a nested comprehension, then index it with i % len(wheel).',
    } },
    { pychallenge: {
      id: 'foundations-pych-health',
      prompt: 'Write `health_state(probes, threshold=2)`. `probes` is the list of health-check results so far, oldest first (`True` = answered, `False` = failed). Return `"down"` if the **last `threshold` probes all failed**, otherwise `"up"`. With fewer than `threshold` probes it is always `"up"`.',
      starter: `def health_state(probes, threshold=2):
    return "up"`,
      tests: `assert health_state([]) == "up"
assert health_state([False]) == "up"
assert health_state([True, False]) == "up"
assert health_state([True, False, False]) == "down"
assert health_state([False, False, True]) == "up"
assert health_state([True, False, False, False], threshold=3) == "down"
assert health_state([True, False, False], threshold=3) == "up"`,
      solution: `def health_state(probes, threshold=2):
    recent = probes[-threshold:]
    if len(recent) == threshold and not any(recent):
        return "down"
    return "up"`,
      hint: 'Take the last `threshold` items with a slice and check whether they are all False. Be careful when the list is shorter than the threshold.',
    } },
    { local: '**See a real reverse proxy and balancer (you will run this in Docker later; read it now).** This is a minimal nginx configuration that does everything in the lesson:\n```nginx\nupstream payroll_api {\n    least_conn;                                   # the algorithm\n    server api1:8000 max_fails=2 fail_timeout=10s; # passive health check: 2 failures => out for 10 s\n    server api2:8000 max_fails=2 fail_timeout=10s;\n}\n\nserver {\n    listen 80;\n    location /api/ {\n        proxy_pass http://payroll_api;               # forward to the pool\n        proxy_set_header Host $host;\n        proxy_set_header X-Forwarded-For $remote_addr; # pass the real client IP\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}\n```\nThe app you are using right now is served by an nginx like this inside Docker (`nginx.conf` in the project folder). Open it and find the `listen`, `root` and `try_files` lines.' },
    { warn: 'A load balancer removes the *single server* as a single point of failure but can become one itself. Cloud load balancers are built redundant and are not something you run on one VM. If you self-host nginx, run at least two and put a managed address (or DNS) in front. Also: "autoscaling" does nothing for you if each request depends on state stored in one server\'s memory.' },
    { interview: '**"How would you scale this API to ten times the traffic and avoid downtime when deploying?"** Model answer: "Make the service stateless, move sessions and uploads to shared storage, and run several instances behind a layer 7 load balancer with least-connections or round robin and active health checks on a shallow /health endpoint. Add autoscaling on CPU or request rate. For deployments I would use blue-green or a canary at 5% with connection draining, watching error rate and latency, with a one-step rollback. A CDN would take static content off the origin." Then name one thing that can still fail: the database. That honesty is what senior interviewers want.' },
    { real: 'Your Power Automate flow calls one Azure Function URL. Behind that URL Azure already runs several instances and balances them for you, so you never see the balancer. When the Function becomes slow you will not "add a server": you will change the scale settings or the plan. Knowing what is hidden from you tells you which knobs exist.' },
    `## Recap
- A **forward proxy** works for clients; a **reverse proxy** works for servers; an **API gateway** is a reverse proxy with auth, rate limiting and routing; a **load balancer** spreads traffic over identical servers.
- **L4** balances by IP and port (fast, any protocol); **L7** reads HTTP (routes by path/host, ends TLS, WAF, cookies).
- Algorithms: **round robin, weighted, least connections, IP hash**, least response time. Pick by how uneven requests are.
- **Health checks** (active and passive) remove broken servers; keep \`/health\` shallow to avoid cascading failures.
- Prefer **stateless** servers over **sticky sessions**; deploy with **rolling, blue-green or canary** plus connection draining; use a **CDN** for static content; read the real IP from \`X-Forwarded-For\`.`,
  ],
  quiz: [
    { q: 'Which proxy hides your servers from the internet and decides which backend answers a request?', o: ['Forward proxy', 'Reverse proxy', 'DNS server', 'Firewall rule'], a: 1, why: 'A reverse proxy sits in front of servers and is what clients think is the website.' },
    { q: 'You must balance PostgreSQL connections across read replicas. Which type fits?', o: ['L7, because it reads SQL', 'A CDN', 'Neither', 'L4, because it works on IP and port for any protocol'], a: 3, why: 'PostgreSQL is not HTTP, so an L4 balancer that forwards TCP connections is the natural choice.' },
    { q: 'Some requests (report exports) take 30 seconds, others 50 ms. Which algorithm usually spreads load best?', o: ['Round robin', 'IP hash', 'Least connections', 'Random'], a: 2, why: 'Least connections accounts for long-running requests, while round robin ignores how busy each server is.' },
    { q: 'Why can a deep /health check that queries the database be dangerous?', o: ['A slow database makes every server look unhealthy, so the balancer removes all of them', 'It is too slow to write', 'It breaks TLS', 'It changes the algorithm'], a: 0, why: 'The failure of one dependency cascades into a total outage. Keep liveness checks shallow.' },
    { q: 'What does a canary release do?', o: ['Replaces all servers at once', 'Sends a small share of traffic to the new version first and grows it if metrics stay healthy', 'Rolls back automatically on every deploy', 'Duplicates the database'], a: 1, why: 'The small first slice limits the damage of a bad release and gives real-world evidence.' },
    { q: 'Your app logs the same client IP for every request. The most likely cause?', o: ['All users share one laptop', 'DNS is wrong', 'TLS is disabled', 'You are logging the load balancer\'s address; read X-Forwarded-For from your trusted proxy'], a: 3, why: 'Behind a proxy the connection comes from the proxy. The client address is passed in forwarded headers.' },
  ],
  task: {
    title: 'Break and heal a pool',
    steps: [
      'In the simulator choose Round robin, send 10 requests, then crash S2 and send 10 more. Count how many requests failed before the health check noticed.',
      'Switch to Least connections and repeat. Is the distribution different? Why?',
      'Turn on sticky sessions and send 20 requests. Which server is the busiest and why does that make stickiness risky?',
      'Write a half-page design for the payroll API on the 28th: how many instances, which algorithm, what /health checks, how you deploy a fix at 8:30 am without downtime.',
    ],
    deliverable: 'The numbers from your three simulator runs and a half-page design note with algorithm, health-check design and deployment method.',
  },
};
