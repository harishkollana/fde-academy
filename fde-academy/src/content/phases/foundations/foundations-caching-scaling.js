export default {
  id: 'foundations-caching-scaling',
  title: 'Caching, rate limiting and scaling',
  goal: 'You can explain where caches live and how to keep them fresh, choose a rate-limiting algorithm, and describe how a system grows with bigger machines, more machines, replicas and shards.',
  roadmap: ['Caching layers: browser, CDN, application, database', 'Cache-aside, TTL and invalidation', 'Rate limiting: fixed window, sliding window, token bucket', 'Vertical vs horizontal scaling', 'Replication and sharding basics'],
  blocks: [
    `## The problem
It is the 3rd of the month. Forty people in finance open the monthly MIS dashboard within ten minutes. Every page load runs the same heavy query over every GL line, so the database spends its morning repeating one answer, and the page times out.

Nothing is wrong with the answer. It is just **computed again and again**. The oldest trick is to work it out once, **remember the result**, and hand out copies. That memory is a **cache**. This lesson covers caches, **rate limiting** (protecting a service from too many requests) and **scaling** (what to do when one machine is not enough).

## Why caches exist, and where they live
A cache is a **small, fast store of copies** of expensive answers. Reading memory takes microseconds, a database query over the network takes milliseconds or more, and a report can take seconds. Caches come in layers, and a request stops at the first layer that holds a fresh copy.
- **Browser cache**: steered by \`Cache-Control\` and \`ETag\` headers (see the HTTP lesson).
- **CDN**: a provider's cache near the user, best for static files (see the proxies lesson).
- **Application cache**: a fast key-value store such as **Redis**, shared by all app servers. You design this one yourself.
- **Database buffer cache**: the database keeps recently read pages in RAM. You get it for free.`,
    { sketch: { w: 760, h: 250, caption: 'A request moves right until a layer has a fresh copy. Each hit ends the trip early.', items: [
      { t: 'text', x: 380, y: 22, text: 'one request, five places that might already know the answer', size: 16, color: '#5c6478' },
      { t: 'box', x: 10, y: 60, w: 110, h: 70, label: 'browser', sub: 'cache', fill: 'yellow', size: 17 },
      { t: 'box', x: 165, y: 60, w: 110, h: 70, label: 'CDN', sub: 'edge cache', fill: 'yellow', size: 17 },
      { t: 'box', x: 320, y: 60, w: 110, h: 70, label: 'app server', sub: 'local memory', fill: 'blue', size: 16 },
      { t: 'box', x: 475, y: 60, w: 110, h: 70, label: 'Redis', sub: 'shared cache', fill: 'yellow', size: 17 },
      { t: 'box', x: 630, y: 60, w: 110, h: 70, label: 'database', sub: 'buffer cache', fill: 'green', size: 17 },
      { t: 'arrow', x1: 120, y1: 95, x2: 165, y2: 95 },
      { t: 'arrow', x1: 275, y1: 95, x2: 320, y2: 95 },
      { t: 'arrow', x1: 430, y1: 95, x2: 475, y2: 95 },
      { t: 'arrow', x1: 585, y1: 95, x2: 630, y2: 95 },
      { t: 'note', x: 10, y: 148, w: 120, h: 46, text: 'Cache-Control\nETag', size: 14 },
      { t: 'note', x: 160, y: 148, w: 120, h: 46, text: 'static files,\npublic pages', size: 14 },
      { t: 'note', x: 315, y: 148, w: 120, h: 46, text: 'one process\nonly', size: 14 },
      { t: 'note', x: 470, y: 148, w: 120, h: 46, text: 'TTL per key,\nshared by all', size: 14 },
      { t: 'note', x: 625, y: 148, w: 120, h: 46, text: 'hot pages\nstay in RAM', size: 14 },
      { t: 'text', x: 10, y: 226, text: 'fastest, may be stale', size: 14, anchor: 'start', color: '#5c6478' },
      { t: 'arrow', x1: 200, y1: 226, x2: 560, y2: 226 },
      { t: 'text', x: 750, y: 226, text: 'slowest, always current', size: 14, anchor: 'end', color: '#5c6478' },
    ] } },
    `## Cache-aside: the pattern you will use most
In **cache-aside** (also called *lazy loading*) your own code manages the cache:
1. Ask the cache for the key, for example \`customer:6\`.
2. **Hit**: the value is there. Return it.
3. **Miss**: read the database, **store the value in the cache with a TTL**, then return it.

When the data changes, write to the database first, then **delete** the cache key so the next read fetches the new value. Other patterns exist (*write-through* writes both together, *write-behind* writes the database later), but cache-aside is the simplest and the most common.`,
    { sketch: { w: 760, h: 250, caption: 'Cache-aside. A hit needs steps 1 and 2 only. A miss runs all five, once.', items: [
      { t: 'box', x: 10, y: 20, w: 150, h: 90, label: 'cache', sub: 'Redis, TTL 300 s', fill: 'yellow' },
      { t: 'box', x: 305, y: 20, w: 150, h: 90, label: 'your app', sub: 'cache-aside logic', fill: 'blue' },
      { t: 'db', x: 600, y: 14, w: 140, h: 100, label: 'database', fill: 'green' },
      { t: 'arrow', x1: 305, y1: 44, x2: 160, y2: 44, label: '1 GET key', ly: -10 },
      { t: 'arrow', x1: 160, y1: 86, x2: 305, y2: 86, dashed: true, label: '2 hit or miss', ly: 16 },
      { t: 'arrow', x1: 455, y1: 44, x2: 600, y2: 44, label: '3 SELECT', ly: -10 },
      { t: 'arrow', x1: 600, y1: 86, x2: 455, y2: 86, dashed: true, label: '4 the row', ly: 16 },
      { t: 'arrow', x1: 340, y1: 112, x2: 90, y2: 112, bend: -50, label: '5 SET key + TTL', ly: 0 },
      { t: 'note', x: 20, y: 196, w: 330, h: 44, text: 'Hit: steps 1 and 2 only.\nThe database is not touched.', fill: 'green', size: 14 },
      { t: 'note', x: 400, y: 196, w: 340, h: 44, text: 'Miss: all five steps. The slow query runs once,\nthe next ask is a hit.', fill: 'orange', size: 14 },
    ] } },
    `## TTL, stale data and invalidation
The **TTL** (*time to live*) is how long a copy may live, the same idea as in the DNS lesson. A short TTL means fresher data and more database work; a long TTL means the opposite. **Stale data** is a copy that no longer matches the truth: harmless for a closed month, dangerous for a payment status.

**Invalidation** means replacing copies when the truth changes. Three ways: let the **TTL** run out; **delete the key** when the data is written; or **put a version in the key** (\`mis:2026-09:v3\`) so a new version is a new key. An old joke calls cache invalidation one of the two hard problems in computer science (the other is naming things). It is hard because the cache and the database must agree, and nothing forces them to.

A **cache stampede** happens when a popular key expires and hundreds of requests miss together and all run the slow query. Let one request rebuild the value while the others use the old copy, and add random jitter to TTLs so keys do not expire together.

The **hit ratio** is hits divided by hits plus misses. If a hit costs 1 ms and a miss 50 ms (illustrative), a 90% hit ratio averages 0.9 x 1 + 0.1 x 50 = 5.9 ms, and 50% averages 25.5 ms. When a cache is full it must **evict**: **LRU** (*least recently used*) drops the key touched longest ago. The code below replays the 220 orders in \`orders.csv\` and asks for the customer behind each one.`,
    { py: {
      title: 'An LRU cache and its hit ratio',
      starter: `from collections import OrderedDict
import pandas as pd

class LRUCache:
    """Keeps at most \`capacity\` items. When full, drops the least recently used one."""
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()      # oldest first, newest last
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key in self.data:
            self.data.move_to_end(key)  # mark as most recently used
            self.hits += 1
            return self.data[key]
        self.misses += 1
        return None

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)   # evict the least recently used

    def hit_ratio(self):
        total = self.hits + self.misses
        return self.hits / total if total else 0.0

customers = pd.read_csv("customers.csv").set_index("customer_id")
orders = pd.read_csv("orders.csv").sort_values(["order_date", "order_id"])
lookups = orders["customer_id"].tolist()     # one customer lookup per order

def load_customer(customer_id):
    """Stands in for a slow database query."""
    if customer_id in customers.index:
        return customers.loc[customer_id, "customer_name"]
    return "(unknown customer)"

def run(capacity):
    cache = LRUCache(capacity)
    db_queries = 0
    for cid in lookups:
        value = cache.get(cid)
        if value is None:                # cache-aside: miss -> ask the database -> store
            value = load_customer(cid)
            db_queries += 1
            cache.put(cid, value)
    return cache, db_queries

print("lookups:", len(lookups), " distinct customers:", len(set(lookups)))
for capacity in (1, 3, 6, 11):
    cache, queries = run(capacity)
    print(f"capacity {capacity:>2}: hits {cache.hits:>3}  misses {cache.misses:>3}  hit ratio {cache.hit_ratio():.1%}  database queries {queries}")`,
      note: 'Capacity 11 holds every customer id that appears (ten real customers plus the unknown id 99 from order 77), so only the first lookup of each one misses: 11 misses and 95.0%. Try other capacities. Then delete the line with move_to_end inside get to make a FIFO cache and compare. The orders here follow no special pattern, so LRU gains little; real traffic has hot keys, where LRU wins.',
    } },
    `## Rate limiting: protecting a service from too many requests
A **rate limit** says "at most N requests per time window for each client". It stops a buggy script from flattening a service, keeps one heavy client from slowing the rest, respects the quota of a downstream or paid API, and slows password guessing.

It is usually enforced at the API gateway (see the proxies lesson). A client over the limit gets **HTTP 429 Too Many Requests**, often with a \`Retry-After\` header giving the seconds to wait (see the HTTP lesson). A good client obeys it and retries with backoff, as the retries lesson in this module explains.

| Algorithm | How it works | Strength | Weakness |
|---|---|---|---|
| **Fixed window** | Count requests per clock window (each minute), reset at the boundary | Simple, tiny memory | Boundary burst: 100 requests at 12:00:59 and 100 at 12:01:00 is 200 in two seconds |
| **Sliding window** | Count requests in the last 60 seconds from now | No boundary burst | More memory (timestamps) or an approximation |
| **Token bucket** | A bucket of up to C tokens refills at R per second. Each request takes one. None left means 429 | Bursts up to C, average capped at R | Two numbers to tune |

Many servers share one limit, so the counter must live in a **shared store** such as Redis. A counter in each server's own memory would allow the limit once per server.`,
    { py: {
      title: 'A token bucket, request by request',
      starter: `class TokenBucket:
    """Holds up to \`capacity\` tokens and gains \`refill_per_sec\` tokens every second."""
    def __init__(self, capacity, refill_per_sec):
        self.capacity = capacity
        self.refill_per_sec = refill_per_sec
        self.tokens = capacity          # starts full
        self.last = 0.0                 # time of the previous request

    def allow(self, now):
        # 1) add the tokens earned since the last request, but never above capacity
        earned = (now - self.last) * self.refill_per_sec
        self.tokens = min(self.capacity, self.tokens + earned)
        self.last = now
        # 2) each request costs one token
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False

bucket = TokenBucket(capacity=5, refill_per_sec=2)

# A burst of 8 requests at t=0, then one request every 0.25 seconds
times = [0.0] * 8 + [1.0 + 0.25 * i for i in range(8)]

print(" time  result   tokens left")
allowed = 0
for t in times:
    ok = bucket.allow(t)
    allowed += ok
    print(f"{t:5.2f}  {'allow' if ok else '429  '}    {bucket.tokens:4.2f}")
print(f"allowed {allowed} of {len(times)} requests")`,
      note: 'The burst of 8 gets 5 through (the bucket started full) and 3 get a 429. Then the client asks 4 times per second but earns only 2 tokens per second, so rejections keep appearing. In total 10 of the 16 requests are allowed. Change capacity to 10 and see how much more of the burst gets through.',
    } },
    { pychallenge: {
      id: 'foundations-pych-token-bucket',
      prompt: 'Write `allow_requests(timestamps, capacity, refill_per_sec)`. `timestamps` is a list of request times in seconds, in increasing order. The bucket **starts full** with `capacity` tokens. Before each request add `(now - previous request time) * refill_per_sec` tokens, never going above `capacity`. A request costs **1 token**: if at least 1 token is available, take it and the request is allowed (`True`); otherwise it is rejected (`False`) and **no token is taken**. Return the list of booleans, one per request. For `[0, 0, 0, 0]` with capacity 3 and refill 1 the answer is `[True, True, True, False]`.',
      starter: `def allow_requests(timestamps, capacity, refill_per_sec):
    return [True] * len(timestamps)`,
      tests: `T, F = True, False
assert allow_requests([0, 0, 0, 0], 3, 1) == [T, T, T, F]
assert allow_requests([0, 0, 0, 1, 1], 2, 1) == [T, T, F, T, F]
assert allow_requests([0, 100, 100, 100], 2, 1) == [T, T, T, F]
assert allow_requests([0, 0, 1, 2, 2], 1, 0.5) == [T, F, F, T, F]
assert allow_requests([0, 0, 0, 2], 1, 0.5) == [T, F, F, T]
assert allow_requests([0, 0, 0, 0, 0.5, 0.5, 0.5], 3, 2) == [T, T, T, F, T, F, F]
assert allow_requests([0, 0, 0, 0.5, 1.0], 3, 1) == [T, T, T, F, T]
assert allow_requests([], 5, 1) == []`,
      solution: `def allow_requests(timestamps, capacity, refill_per_sec):
    tokens = float(capacity)
    previous = None
    results = []
    for now in timestamps:
        if previous is not None:
            tokens = min(capacity, tokens + (now - previous) * refill_per_sec)
        previous = now
        if tokens >= 1:
            tokens -= 1
            results.append(True)
        else:
            results.append(False)
    return results`,
      hint: 'Keep two variables: tokens and the previous timestamp. For each request first refill (with min to cap it), then check tokens >= 1. Only subtract a token when the request is allowed.',
    } },
    `## Scaling: bigger or more?
When one machine is not enough, you have two moves.
- **Scale up (vertical)**: a bigger machine. It is simple and needs no code change, but there is a ceiling and it is still a single point of failure.
- **Scale out (horizontal)**: more machines behind a load balancer. It goes further and survives the loss of one, but the app must be **stateless**, with state in a shared database or cache (see the load balancing lesson).

App servers scale out easily. The **database** is the hard part, because there must still be one consistent truth. A sensible order: fix slow queries and indexes, add a cache, scale up, add read replicas, and only then shard.

## Replication: copies for reading
In **primary/replica** replication the **primary** accepts all writes and ships every change to **replicas** that keep copies. Reads spread over the replicas, and a replica can take over if the primary dies. The price is **replication lag**: a replica applies changes a little later, usually milliseconds, sometimes seconds. A user saves a journal, refreshes, is served by a replica, and the journal is missing. That is a trade-off between scale and consistency ("what I wrote is what I read"). Fixes: read from the primary right after a write, and send only delay-tolerant reports to replicas. The ACID and CAP lesson goes deeper.

## Sharding: splitting the data itself
Replicas copy *all* the data, so they do not help when the data or the write load is too big for one machine. **Sharding** splits rows across several databases, each holding a slice. The usual rule is **hash by key**: \`shard = hash(key) mod number_of_shards\`, so one customer always lands on the same shard. Use a **stable** hash such as MD5, not Python's built-in \`hash()\`, which changes for strings on every run. **Partitioning** inside one database (a table split by month) is the gentler cousin: queries skip whole slices, but it stays on one machine.`,
    { sketch: { w: 760, h: 330, caption: 'Left: replicas add read capacity but lag a little. Right: shards split the data, and a bad key makes one shard hot.', items: [
      { t: 'text', x: 190, y: 16, text: 'replication: more READS', size: 17, bold: true, color: '#c2410c' },
      { t: 'text', x: 575, y: 16, text: 'sharding: more WRITES and size', size: 17, bold: true, color: '#c2410c' },
      { t: 'line', x1: 385, y1: 10, x2: 385, y2: 322, dashed: true, color: '#9aa3b5' },
      { t: 'db', x: 125, y: 40, w: 130, h: 72, label: 'primary', fill: 'green' },
      { t: 'db', x: 10, y: 170, w: 120, h: 70, label: 'replica 1', fill: 'teal' },
      { t: 'db', x: 250, y: 170, w: 120, h: 70, label: 'replica 2', fill: 'teal' },
      { t: 'box', x: 125, y: 268, w: 130, h: 50, label: 'app', fill: 'blue' },
      { t: 'arrow', x1: 160, y1: 114, x2: 70, y2: 172, dashed: true, label: 'copy', ly: -8 },
      { t: 'arrow', x1: 220, y1: 114, x2: 310, y2: 172, dashed: true, label: 'copy', ly: -8 },
      { t: 'arrow', x1: 190, y1: 266, x2: 190, y2: 116, label: 'writes', lx: 32, ly: 0 },
      { t: 'arrow', x1: 125, y1: 292, x2: 70, y2: 244, label: 'reads', lx: -10, ly: 6 },
      { t: 'arrow', x1: 255, y1: 292, x2: 310, y2: 244, label: 'reads', lx: 10, ly: 6 },
      { t: 'note', x: 6, y: 44, w: 112, h: 52, text: 'one primary\ntakes writes', size: 14 },
      { t: 'note', x: 266, y: 44, w: 106, h: 52, text: 'a replica is\na little late', size: 14, fill: 'orange' },
      { t: 'box', x: 400, y: 150, w: 110, h: 66, label: 'hash(key)\nmod 3', fill: 'yellow', size: 17 },
      { t: 'db', x: 630, y: 40, w: 110, h: 66, label: 'shard 0', fill: 'green' },
      { t: 'db', x: 630, y: 150, w: 110, h: 66, label: 'shard 1', fill: 'red' },
      { t: 'db', x: 630, y: 260, w: 110, h: 60, label: 'shard 2', fill: 'green' },
      { t: 'arrow', x1: 510, y1: 170, x2: 630, y2: 75, label: '0' },
      { t: 'arrow', x1: 510, y1: 183, x2: 630, y2: 183, label: '1' },
      { t: 'arrow', x1: 510, y1: 196, x2: 630, y2: 290, label: '2', lx: 12 },
      { t: 'note', x: 396, y: 40, w: 160, h: 64, text: 'a join across shards\nmust gather rows\nfrom several servers', size: 14, fill: 'orange' },
      { t: 'note', x: 396, y: 262, w: 170, h: 50, text: 'a hot key overloads\none shard', size: 14, fill: 'red' },
    ] } },
    `Sharding has real costs, so it comes last.
- **Hot partition**: a lopsided key sends most traffic to one shard while the others idle. A column with three values (entity, channel) cannot spread over ten shards, and one huge customer still dominates a \`customer_id\` shard. Choose a key with many values and even traffic.
- **Cross-shard joins hurt**: a customer on shard 0 and its orders on shard 2 cannot be joined by one database. The application must fetch both and combine, and transactions across shards are hard too. Shard so that rows you join live together, for example orders by \`customer_id\`.
- **Changing the shard count moves data**: with \`mod\`, going from 4 to 5 shards moves about 8 keys in 10 (7,970 of 10,000 test keys). Consistent hashing (load balancing lesson) moves far fewer.`,
    { pychallenge: {
      id: 'foundations-pych-shard-for',
      prompt: 'Write `shard_for(key, n_shards)` that returns the shard number, an integer from `0` to `n_shards - 1`. Use a **stable** hash so every run and every machine agrees: take `str(key)`, encode it as UTF-8, compute the MD5 hex digest with `hashlib`, read it as one integer with `int(digest, 16)`, and return that integer modulo `n_shards`. Do not use the built-in `hash()`: for strings it changes every time Python starts, so the same customer would move shards after a restart.',
      starter: `import hashlib

def shard_for(key, n_shards):
    return 0`,
      tests: `for n in (1, 2, 3, 8, 16):
    for i in range(200):
        s = shard_for("customer-%d" % i, n)
        assert isinstance(s, int) and 0 <= s < n, (n, i, s)
assert shard_for("customer-42", 8) == shard_for("customer-42", 8)
# pinned values: they stay the same on every run because MD5 is stable
assert shard_for("customer-42", 8) == 0
assert shard_for("customer-43", 8) == 3
assert shard_for("IN01", 3) == 0
assert shard_for(42, 8) == 6
counts = [0] * 4
for i in range(10000):
    counts[shard_for("cust-%d" % i, 4)] += 1
assert sum(counts) == 10000
assert all(2250 <= c <= 2750 for c in counts), counts`,
      solution: `import hashlib

def shard_for(key, n_shards):
    digest = hashlib.md5(str(key).encode("utf-8")).hexdigest()
    return int(digest, 16) % n_shards`,
      hint: 'hashlib.md5(text.encode("utf-8")).hexdigest() gives a hex string. int(that_string, 16) turns it into a big integer. Then use the % operator.',
    } },
    `## Back to the slow dashboard: pre-compute the heavy part
Sometimes the best cache lives inside the database. Monthly totals by entity need a join and a group over every GL line, and the answer only changes when new journals arrive. So compute it **once** and store it. A normal **view** is a saved query that runs again on every read. A **materialised view** stores the result like a table: reads are fast, and you run \`REFRESH MATERIALIZED VIEW\` after each load. It is the same trade-off as any cache, fast but stale until refreshed. PostgreSQL's \`REFRESH ... CONCURRENTLY\` option lets people keep reading meanwhile; other warehouses have their own versions, so check the current documentation.

The script shows 1,227 GL lines collapsing into 36 summary rows, then a late journal that the live view sees at once and the materialised view misses until the refresh.`,
    { sql: {
      title: 'A heavy aggregate, pre-computed with a materialised view',
      starter: `-- 1) The heavy aggregate: three tables joined, every GL line grouped
CREATE VIEW v_monthly_totals AS
SELECT date_trunc('month', g.posting_date)::date AS month,
       e.entity_code,
       e.currency,
       COUNT(*) AS gl_lines,
       SUM(CASE WHEN a.account_type = 'Revenue' THEN g.credit ELSE 0 END) AS revenue,
       SUM(CASE WHEN a.account_type IN ('COGS', 'Opex') THEN g.debit ELSE 0 END) AS expenses
FROM fact_gl g
JOIN dim_entity e  ON e.entity_id = g.entity_id
JOIN dim_account a ON a.account_id = g.account_id
GROUP BY 1, 2, 3;

SELECT * FROM v_monthly_totals ORDER BY month, entity_code LIMIT 8;

-- How much smaller is the answer than the data?
SELECT COUNT(*) AS rows_in_summary, SUM(gl_lines) AS gl_lines_summarised FROM v_monthly_totals;

-- 2) Pre-compute once and store the answer as a small real table
CREATE MATERIALIZED VIEW mv_monthly_totals AS SELECT * FROM v_monthly_totals;

SELECT * FROM mv_monthly_totals WHERE entity_code = 'IN01' ORDER BY month LIMIT 3;

-- 3) A late balanced journal arrives for IN01, April 2025
INSERT INTO fact_gl (gl_id, journal_id, entity_id, bu_id, account_id, posting_date, currency, debit, credit, source_system) VALUES
(2001, 'JV202504-9999', 1, 1, 4100, '2025-04-20', 'INR', 0, 100000, 'Manual'),
(2002, 'JV202504-9999', 1, 1, 1000, '2025-04-20', 'INR', 100000, 0, 'Manual');

SELECT 'live view' AS source, revenue FROM v_monthly_totals WHERE entity_code = 'IN01' AND month = '2025-04-01'
UNION ALL
SELECT 'materialised view', revenue FROM mv_monthly_totals WHERE entity_code = 'IN01' AND month = '2025-04-01';

-- 4) Refresh, and the stored copy catches up
REFRESH MATERIALIZED VIEW mv_monthly_totals;
SELECT 'materialised view after refresh' AS source, revenue FROM mv_monthly_totals WHERE entity_code = 'IN01' AND month = '2025-04-01';`,
      note: 'Amounts are in each entity\'s own currency (INR, SGD, USD); a real MIS would convert with fx_rates first. The live view shows 333914.19 and the materialised view still shows 233914.19 until the refresh. That gap is the staleness you accept in exchange for speed.',
    } },
    { warn: 'A shared cache is shared. If a response depends on **who is asking** (a payroll summary for one entity\'s HR manager) and you cache it under a key that does not name the user or role, such as `payroll:summary`, the next person receives the previous person\'s data. Put the identity in the key or do not cache it. On a CDN or in a browser, mark personal responses `Cache-Control: private`. And a cache is not a source of truth: it must always be safe to empty it.' },
    { interview: '**"How would you make a slow report fast?"** Model answer: "First I measure where the time goes, with the query plan and the logs, because guessing wastes effort. Then in this order: (1) fix the query and add the right index; (2) read less data, by filtering early and pre-aggregating into a summary table or materialised view that the pipeline refreshes after each load; (3) cache the finished result with a sensible TTL, keyed by period and entity, so repeat opens cost almost nothing; (4) if it is still heavy, build it in the background and notify the user. For each step I say what it costs: a summary table and a cache can be stale, so I show an as-of time and invalidate when a late journal arrives."' },
    { real: 'Your September MIS pack is built once after the books close and then opened by dozens of people. Cache the finished result under a key that names the period, the entity and the close version, for example `mis:2026-09:IN01:v3`. When a late journal or a reopened period changes the numbers, publish v4 and the old key simply stops being used. Show an "as of" time on the page so readers know how fresh it is, and give the finance lead a manual rebuild button.' },
    { local: '**Try a real cache with Redis in Docker (read it now, run it after the Docker lessons; written against Redis 7, check the current image).**\n```powershell\ndocker run -d --name redis-lab -p 6379:6379 redis:7\ndocker exec -it redis-lab redis-cli\n```\nInside `redis-cli` type:\n```text\nSET customer:6 "Falcon Logistics" EX 60\nGET customer:6\nTTL customer:6\n```\nExpected: `OK`, then `"Falcon Logistics"`, then a number just below 60 such as `(integer) 57`. After a minute `TTL customer:6` prints `(integer) -2` (the key no longer exists) and `GET` prints `(nil)`. That is a TTL doing its job. Clean up with `docker rm -f redis-lab`.' },
    `## Recap
- **Caches** sit in layers (browser, CDN, Redis, database buffer). **Cache-aside**: check the cache, on a miss read the database and store with a **TTL**.
- Keep copies fresh by TTL, by deleting the key on write, or by versioned keys. Watch the **hit ratio** and use jitter against stampedes.
- **Rate limiting** answers with **429** and \`Retry-After\`. A **token bucket** allows bursts up to its capacity and caps the average rate; shared limits need a shared store.
- **Scale up** is simple but capped; **scale out** needs stateless servers. **Replicas** add reads (with **replication lag**); **shards** add writes and size.
- Shard with a **stable hash**, expect **hot partitions** and painful **cross-shard joins**, and try everything else first.`,
  ],
  quiz: [
    { q: 'In the cache-aside pattern, what does the application do on a cache miss?', o: ['Returns an error to the user', 'Reads the database, stores the value in the cache with a TTL, then returns it', 'Waits for the cache to fill itself', 'Deletes the database row'], a: 1, why: 'In cache-aside your code owns the logic: ask the cache, and on a miss load from the database and write the value back with a TTL.' },
    { q: 'A cached MIS page must show a late journal soon after it is posted. Which approach fits best?', o: ['Set the TTL to one year', 'Delete or re-version the cache key when the journal is written', 'Ask users to press refresh', 'Restart the application every night'], a: 1, why: 'Invalidating on write (or publishing a new version key) keeps the copy honest. A very long TTL guarantees stale numbers.' },
    { q: 'A cache answered 66 of 220 lookups from memory. What is its hit ratio?', o: ['70%', '66%', '30%', '154%'], a: 2, why: 'Hit ratio is hits divided by all lookups: 66 / 220 = 0.30, which is 30%. This matches the LRU run with capacity 3.' },
    { q: 'A token bucket has capacity 5 and refills 2 tokens per second. After a long idle time, a client sends 8 requests at the same instant. How many are allowed?', o: ['2', '5', '8', '0'], a: 1, why: 'The bucket is full at 5 tokens and nothing is refilled within the same instant, so 5 are allowed and 3 get a 429.' },
    { q: 'A user saves a journal, reloads, and the new journal is missing. Reads are served by a replica. What is this?', o: ['A cache stampede', 'A hot partition', 'Replication lag', 'A fixed-window burst'], a: 2, why: 'The replica has not yet applied the latest change from the primary. Read from the primary right after a write if this matters.' },
    { q: 'Why is Python\'s built-in hash() a poor way to choose a shard for string keys?', o: ['It is too slow', 'It only works for numbers', 'It can return negative numbers only', 'It changes between runs, so a key can move to a different shard after a restart'], a: 3, why: 'String hashing is randomised per process. Use a stable hash such as MD5 so every run and machine agrees.' },
  ],
  task: {
    title: 'Make the MIS dashboard fast, and break your own cache',
    steps: [
      'In the LRU playground run capacities 1, 3, 6 and 11 and write down the hit ratios. Then remove the move_to_end line from get() to make a FIFO cache and compare. Explain in two sentences why the two behave about the same on this data.',
      'In the token bucket playground choose a capacity and refill rate for "an HR tool may send a burst of 10 requests, then 2 per second on average". Prove it with a request pattern of your own.',
      'In the SQL playground add a second materialised view, monthly expenses by bu_code (join dim_bu), insert one late journal, and show the stale value before the refresh and the correct value after it.',
      'Write half a page on "how I would make the monthly MIS dashboard fast": name the layers you would use, the cache key, the TTL or invalidation rule, and what could go stale.',
    ],
    deliverable: 'The hit-ratio table from step 1, your token bucket numbers, the SQL for your second materialised view with the before/after values, and the half-page design note.',
  },
};
