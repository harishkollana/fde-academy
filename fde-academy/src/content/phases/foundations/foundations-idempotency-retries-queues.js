// Payments table for the SQL playground. UNIQUE (idempotency_key) is the whole trick.
const PAYMENTS_SETUP = `CREATE TABLE payments (
  payment_id      serial PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  supplier        text NOT NULL,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);
INSERT INTO payments (idempotency_key, supplier, amount)
VALUES ('inv-2026-0041', 'Mehta Logistics', 18500);`;

export default {
  id: 'foundations-idempotency-retries-queues',
  title: 'Idempotency, retries and queues',
  goal: 'You can explain why a timeout is not a failure, make an operation safe to repeat with an idempotency key, choose a retry policy (which errors, backoff, cap, jitter), and explain queues, delivery guarantees, dead-letter queues and what "exactly-once" really means.',
  roadmap: ['Idempotency and idempotency keys', 'Retry with exponential backoff and jitter', 'Queues vs pub/sub', 'Delivery guarantees: at-most-once, at-least-once, "exactly-once"', 'Dead-letter queues and backpressure'],
  blocks: [
    `## The problem
Your payments job sends a ₹50,000 supplier payment to a bank API. The bank receives it and pays. Then the network drops the reply. Your code sees only "timed out".

Did the payment happen? You cannot know. If you give up, the supplier may stay unpaid. If you retry, the supplier may be paid twice. **A timeout does not mean failure. It means "I don't know".**

Networks, servers and gateways fail all the time: a restart, an overloaded server, a 502 or 504 from a proxy, as the HTTP and load balancer lessons showed. So clients **must retry**, and servers must expect the same request to arrive twice. This lesson gives you three tools: **idempotency** (safe to repeat), **retry discipline** (backoff, cap, jitter) and **queues** (absorb bursts, with delivery guarantees).

## Idempotent: the same effect if repeated
An operation is **idempotent** if doing it once or ten times leaves the system in the same state. The *effect* must match; the response text may differ.

| Operation | Idempotent? | Why |
|---|---|---|
| Set invoice INV/0042 to status PAID | yes | repeating it leaves PAID |
| Upsert the row with key X | yes | the row exists once |
| Add ₹50,000 to a balance | no | every repeat adds again |
| Create a payment of ₹50,000 | no | every call makes a new payment |
| Send the approval email | no | the person gets it again |

The HTTP lesson called GET, PUT and DELETE idempotent and POST not. That is a promise of the protocol. Your server keeps it only if its code is written that way. Three ways to make an operation safe to repeat:
1. **Say "set to", not "add".** "Balance is 30,000" is safe; "subtract 20,000" is not.
2. **Use a natural key** with a UNIQUE constraint, for example supplier plus invoice number, stored once.
3. **Use an idempotency key** when neither fits, as with "create a payment".

## Idempotency keys
The client makes a unique key for each *intended action*: a UUID, or a business id such as \`inv-2026-0042\`. It sends the key with the request, usually as a header \`Idempotency-Key: inv-2026-0042\`. Every retry of that action carries the **same** key.

The server then:
1. Looks the key up.
2. If it is new: does the work and saves the key **together with the result**.
3. If it was seen: does **nothing** and returns the saved result.

Three rules matter. Save the key and the effect in **one transaction** (last lesson). Enforce uniqueness with a **UNIQUE constraint**, so two simultaneous retries cannot both pass the check. Reject a reused key that comes with a different body. The picture shows one lost response, twice.`,
    { sketch: { w: 760, h: 360, caption: 'The same lost response. Without a key the retry pays again; with a key the server recognises the repeat', items: [
      { t: 'box', x: 100, y: 8, w: 140, h: 34, label: 'client', fill: 'yellow', size: 16 },
      { t: 'box', x: 350, y: 8, w: 140, h: 34, label: 'bank server', fill: 'blue', size: 16 },
      { t: 'line', x1: 170, y1: 46, x2: 170, y2: 352, dashed: true, color: '#9aa3b5' },
      { t: 'line', x1: 420, y1: 46, x2: 420, y2: 352, dashed: true, color: '#9aa3b5' },
      { t: 'line', x1: 10, y1: 192, x2: 750, y2: 192, color: '#c9cfdb' },
      { t: 'text', x: 12, y: 96, text: 'no key', anchor: 'start', bold: true, size: 17, color: '#e03131' },
      { t: 'arrow', x1: 170, y1: 78, x2: 420, y2: 78, label: '1 POST pay 50,000', ly: -9 },
      { t: 'arrow', x1: 420, y1: 108, x2: 300, y2: 108, dashed: true, color: '#e03131', label: '2 response lost', ly: -9 },
      { t: 'mark', x: 286, y: 108, ok: false },
      { t: 'arrow', x1: 170, y1: 142, x2: 420, y2: 142, label: '3 timeout: same POST again', ly: -9 },
      { t: 'arrow', x1: 420, y1: 172, x2: 170, y2: 172, label: '4 ok', ly: -9 },
      { t: 'table', x: 520, y: 70, title: 'bank ledger (no key)', cols: ['#', 'amount'], colW: [40, 100], rows: [['1', '50,000'], ['2', '50,000']], hl: [1] },
      { t: 'note', x: 672, y: 98, w: 80, h: 44, text: 'paid\ntwice!', fill: 'red', size: 14 },
      { t: 'text', x: 12, y: 276, text: 'with key', anchor: 'start', bold: true, size: 17, color: '#2f9e44' },
      { t: 'arrow', x1: 170, y1: 238, x2: 420, y2: 238, label: '1 POST + Key k-42', ly: -9 },
      { t: 'arrow', x1: 420, y1: 268, x2: 300, y2: 268, dashed: true, color: '#e03131', label: '2 response lost', ly: -9 },
      { t: 'mark', x: 286, y: 268, ok: false },
      { t: 'arrow', x1: 170, y1: 302, x2: 420, y2: 302, label: '3 retry, SAME Key k-42', ly: -9 },
      { t: 'arrow', x1: 420, y1: 332, x2: 170, y2: 332, label: '4 old result, no charge', ly: -9 },
      { t: 'table', x: 520, y: 250, title: 'bank ledger (with key)', cols: ['#', 'amount'], colW: [40, 100], rows: [['1', '50,000']], fill: 'green' },
      { t: 'note', x: 672, y: 252, w: 80, h: 44, text: 'paid\nonce', fill: 'green', size: 14 },
    ] } },
    `## Try it in SQL
The \`payments\` table below has \`idempotency_key text NOT NULL UNIQUE\`. The statement \`INSERT ... ON CONFLICT (idempotency_key) DO NOTHING\` says: if this key already exists, skip quietly. \`RETURNING\` shows what was really inserted. Run it and read the result tables. The first insert returns one row. The repeat returns **zero rows**, and the table still holds one payment for invoice 0042.`,
    { sql: {
      title: 'A repeated insert is harmless',
      setup: PAYMENTS_SETUP,
      starter: `-- Attempt 1 for invoice 0042: the row is inserted and RETURNING shows the new payment_id.
INSERT INTO payments (idempotency_key, supplier, amount)
VALUES ('inv-2026-0042', 'Ravi Traders', 50000)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING payment_id, idempotency_key;

-- The response was lost, so the client retries with the SAME key. Nothing is inserted: 0 rows come back.
INSERT INTO payments (idempotency_key, supplier, amount)
VALUES ('inv-2026-0042', 'Ravi Traders', 50000)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING payment_id, idempotency_key;

-- A third retry that asks for the ORIGINAL payment back (what a server returns to a repeated request).
WITH ins AS (
  INSERT INTO payments (idempotency_key, supplier, amount)
  VALUES ('inv-2026-0042', 'Ravi Traders', 50000)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING payment_id
)
SELECT payment_id, 'new' AS outcome FROM ins
UNION ALL
SELECT payment_id, 'repeat: original returned' FROM payments WHERE idempotency_key = 'inv-2026-0042'
LIMIT 1;

-- The table holds one payment for invoice 0042, not three.
SELECT payment_id, idempotency_key, supplier, amount FROM payments ORDER BY payment_id;`,
      note: 'Run it twice: on the second run even the first insert returns 0 rows, because the key already exists. Then delete the ON CONFLICT line from the second INSERT and run again: PostgreSQL stops with "duplicate key value violates unique constraint". That error is also a safe outcome, since no second payment was made. Press "reset data" afterwards (and run ROLLBACK; if the run stopped inside a transaction).',
    } },
    `## Retrying: when, how often, how long
Retry only when it is safe: the call is idempotent, or it carries a key. Then decide **which results** deserve a retry. The HTTP lesson gives the idea:

| Result | Retry? |
|---|---|
| Timeout, connection reset | Yes. You do not know what happened |
| 429 Too Many Requests | Yes, after waiting. Honour \`Retry-After\` |
| 502, 503, 504 | Yes, with backoff. The problem is temporary |
| 500 | Maybe once or twice. It may be a bug that repeats |
| 400, 401, 403, 404, 422 | No. The request is wrong and repeating cannot fix it |

How you wait matters as much as whether you retry:
- Retrying at once in a tight loop makes *you* the outage. Many clients doing it is a **retry storm**.
- **Exponential backoff** doubles the wait each time: 1, 2, 4, 8 seconds. The sick server gets room to recover.
- A **cap** limits the wait, and a **maximum number of attempts** (or total time) limits the effort. Without them a client retries forever.
- **Jitter** makes each wait random, for example anywhere from 0 up to the exponential value:

\`\`\`python
delay = random.uniform(0, min(cap, base * 2 ** attempt))   # "full jitter"
\`\`\`

Without jitter, clients that failed together retry together, in waves. Each wave can knock the recovering server down again. That is the **thundering herd**.

**Part A of the simulator: eight clients, one outage.** Keep the outage at 5 s and click the four policies one by one. A cross is a failed try, a circle a success. Read the verdict line under the bars.
- *No retry*: 0 of 8 succeed.
- *Fixed 1 s*: all succeed, but with 48 requests. The moment the server is back (second 5), all 8 clients hit it **at once**.
- *Exponential*: only 32 requests, but the clients stay in lock-step: all 8 arrive together at second 7.
- *Exponential + jitter*: 40 requests, yet the busiest second after the server is back holds only 3. The towers dissolve and the recovering server is not flattened.

Watch the verdict line, which reports the **busiest second after the server is back**. That is the number a recovering server cares about: 8 at once is a wave, 3 is a trickle.

Now drag the outage to 12 s. Fixed 1 s runs out of attempts: 0 of 8 succeed after 48 requests, and each client is marked *gave up*. Exponential succeeds late, at 15 s. Jitter gets 4 of 8 through. Pick attempts and cap for the outage you expect, and decide where the ones who give up go (a dead-letter queue, below).

**Part B: pay ₹50,000.** Leave the key box unticked and click *Pay ₹50,000 to the supplier*. The response is lost, the client retries, and the ledger shows two entries: ₹1,00,000 for a ₹50,000 invoice. Now tick *send an Idempotency-Key* and click again. One entry. Read the numbered story above the ledger.`,
    { widget: 'RetryBackoff' },
    `## The same policy in code
This helper retries only 429, 502, 503 and 504, backs off exponentially up to a cap, adds full jitter, and raises the error after the last attempt. It does not sleep. It records the waits, so the run is instant and the same every time.`,
    { py: {
      title: 'Retry with backoff, cap and jitter',
      starter: `import random


class HttpError(Exception):
    def __init__(self, status):
        super().__init__(f"HTTP {status}")
        self.status = status


RETRYABLE = {429, 502, 503, 504}          # temporary problems. 400/401/403/404/422 are our own mistakes.


def call_with_retry(fn, max_attempts=5, base=1.0, cap=8.0, rng=None):
    rng = rng or random.Random(7)         # fixed seed so the output is the same every run
    waits = []
    for attempt in range(1, max_attempts + 1):
        try:
            return fn(), waits
        except HttpError as e:
            if e.status not in RETRYABLE or attempt == max_attempts:
                raise                      # not worth retrying, or out of attempts: fail loudly
            limit = min(cap, base * 2 ** (attempt - 1))   # 1, 2, 4, 8, 8 ...
            delay = rng.uniform(0, limit)                 # "full jitter": a random wait up to the limit
            waits.append(round(delay, 2))                 # a real client would time.sleep(delay) here


# A bank API that answers 503 for the first three calls, then recovers.
state = {"calls": 0}
def bank_payment():
    state["calls"] += 1
    if state["calls"] <= 3:
        raise HttpError(503)
    return "payment accepted"

result, waits = call_with_retry(bank_payment)
print(result, "| calls:", state["calls"], "| waits in seconds:", waits)

# A 422 means our request is wrong. Retrying cannot fix it, so it fails at once.
def bad_request():
    raise HttpError(422)

try:
    call_with_retry(bad_request)
except HttpError as e:
    print("not retried:", e)

# A bank that stays down: after the last attempt the error is raised, not swallowed.
def always_down():
    raise HttpError(503)

try:
    call_with_retry(always_down, max_attempts=3)
except HttpError as e:
    print("gave up after 3 attempts:", e)`,
      note: 'Expect 4 calls and 3 waits, each below its limit (1, 2 and 4 seconds). Change the bank to fail 6 times and watch the last error escape. Change base or cap and compare the waits.',
    } },
    { pychallenge: {
      id: 'foundations-pych-backoff-delays',
      prompt: 'Write `backoff_delays(attempts, base, cap)` that returns the list of waits before each retry: `attempts` numbers, where wait number `i` (counting from 0) is `base` doubled `i` times, but never more than `cap`. For example `backoff_delays(6, 1, 8)` returns `[1, 2, 4, 8, 8, 8]`. When `attempts` is 0 return an empty list.',
      starter: `def backoff_delays(attempts, base, cap):
    return []`,
      tests: `assert backoff_delays(6, 1, 8) == [1, 2, 4, 8, 8, 8]
assert backoff_delays(4, 2, 100) == [2, 4, 8, 16]
assert backoff_delays(3, 5, 7) == [5, 7, 7]
assert backoff_delays(1, 1, 60) == [1]
assert backoff_delays(0, 1, 8) == []`,
      solution: `def backoff_delays(attempts, base, cap):
    return [min(cap, base * 2 ** i) for i in range(attempts)]`,
      hint: 'Loop i from 0 to attempts - 1. Each wait is min(cap, base * 2 ** i).',
    } },
    `## Queues and pub/sub
Calling a service directly ties you to its health: if it is slow or down, you wait or fail. A **queue** sits in between. The **producer** puts a message in the queue and carries on. A **consumer** takes messages at its own pace. You get:
- **Bursts absorbed.** 600 payroll files at 8 am on the 28th wait their turn instead of crashing the validator.
- **Retries for free.** A message that fails can be tried again.
- **Independent scaling.** Add consumers when the queue grows.

There are two shapes:
- A **queue** (point-to-point) gives each message to **one** consumer in a group of workers. Use it for jobs: "validate this payroll file".
- **Pub/sub** (publish/subscribe) sends an event to a **topic**, and **every subscriber** gets its own copy. Use it for facts several systems care about: "invoice approved" goes to the ledger, the email service and the audit log.

Azure Service Bus (queues and topics), Azure Storage queues, AWS SQS and SNS, RabbitMQ and Kafka topics are examples. Later phases use them.

## Delivery guarantees
- **At-most-once**: send and forget. The message arrives 0 or 1 times, so it can be lost. Fine for a debug log or a metric.
- **At-least-once**: the queue keeps the message until the consumer **acknowledges** (acks) it. If the consumer crashes before the ack, the queue delivers it again. It arrives 1 or more times, so **duplicates happen**. This is the usual default.
- **Exactly-once**: arrives once. A sender can never tell whether a lost ack means "done" or "not done", which is the timeout problem from the start of this lesson, so between two separate systems this cannot be guaranteed. Some platforms offer it inside their own boundary. In practice **"exactly-once" means at-least-once delivery plus an idempotent consumer**: the message may arrive twice, but its effect happens once.`,
    { sketch: { w: 760, h: 330, caption: 'At-least-once delivery: an ack that never arrives means a second delivery, and repeated failures end in the dead-letter queue', items: [
      { t: 'box', x: 12, y: 100, w: 120, h: 64, label: 'producer', sub: 'payroll API', fill: 'yellow' },
      { t: 'box', x: 250, y: 86, w: 210, h: 92, label: 'queue', sub: 'm3 · m2 · m1', fill: 'blue' },
      { t: 'box', x: 590, y: 100, w: 150, h: 64, label: 'consumer', sub: 'keeps a seen-set', fill: 'green' },
      { t: 'box', x: 250, y: 238, w: 210, h: 66, label: 'dead-letter queue', sub: 'poison messages wait', fill: 'red' },
      { t: 'arrow', x1: 132, y1: 132, x2: 250, y2: 132, label: 'send m1', ly: -10 },
      { t: 'arrow', x1: 460, y1: 112, x2: 590, y2: 112, label: 'deliver m1', ly: -10 },
      { t: 'arrow', x1: 590, y1: 152, x2: 460, y2: 152, dashed: true, color: '#2f9e44', label: 'ack = done', ly: 16 },
      { t: 'arrow', x1: 355, y1: 178, x2: 355, y2: 238, color: '#e03131', label: 'after N failed tries', lx: 86 },
      { t: 'note', x: 500, y: 214, w: 240, h: 96, text: 'No ack (consumer crashed,\nreply lost)? The queue\nsends m1 again.\nSo duplicates happen.', fill: 'yellow', size: 14 },
      { t: 'note', x: 12, y: 214, w: 210, h: 96, text: 'At-least-once delivery\n+ idempotent consumer\n= the effect happens\nexactly once.', fill: 'purple', size: 14 },
    ] } },
    `## Dead-letter queues and poison messages
Some messages can never succeed: broken JSON, or a GL line for an account that does not exist. This **poison message** fails, is redelivered, fails again, and so on, and can block the queue or burn CPU. So brokers count delivery attempts. After N failures the message moves to a **dead-letter queue** (DLQ), a side queue for people and tools to inspect.

A DLQ is not a bin. Alert when it is not empty, keep the original message and the error reason, and build a way to **replay** messages once the bug is fixed. A DLQ nobody watches is silent data loss.

Last, **backpressure**. If producers send faster than consumers can work, the queue grows without limit and every message waits longer. Backpressure pushes back on the producers (a length limit, a 429 or 503 reply, a slower sender) while you add consumers.

Here is at-least-once delivery meeting a consumer that is **not** idempotent. The ack for m1 is lost, so m1 arrives twice. Run it and read the totals.`,
    { py: {
      title: 'A duplicate delivery pays Ravi Traders twice',
      starter: `# At-least-once delivery: if the consumer's acknowledgement is lost, the broker delivers the message again.
messages = [
    {"id": "m1", "supplier": "Ravi Traders", "amount": 50000},
    {"id": "m2", "supplier": "Mehta Logistics", "amount": 12000},
    {"id": "m3", "supplier": "Ravi Traders", "amount": 7500},
]
ack_lost_for = {"m1"}                       # the ack for m1 is lost, so m1 arrives twice


def broker(messages):
    for m in messages:
        yield m
        if m["id"] in ack_lost_for:
            yield m                          # redelivery of the very same message


paid = {}

def pay(m):                                  # a NON-idempotent consumer: every call adds money
    paid[m["supplier"]] = paid.get(m["supplier"], 0) + m["amount"]
    print("paid", m["amount"], "to", m["supplier"], "for", m["id"])


for m in broker(messages):
    pay(m)

print()
print("totals:", paid)
owed = 50000 + 7500
print("Ravi Traders is owed", owed, "but was paid", paid["Ravi Traders"], "-> overpaid by", paid["Ravi Traders"] - owed)`,
      note: 'Ravi Traders is paid 107500 instead of 57500. The fix is a seen-set of message ids, which you write in the next challenge.',
    } },
    { pychallenge: {
      id: 'foundations-pych-process-once',
      prompt: 'Write `process_once(seen, message_id, handler)`. `seen` is a `set` of message ids already handled, and `handler` is a function with no arguments. If `message_id` is already in `seen`, do not call `handler` and return `False`. Otherwise call `handler()`, then add `message_id` to `seen` and return `True`. If `handler` raises an error, let it escape and do **not** add the id, so a later redelivery can try again.',
      starter: `def process_once(seen, message_id, handler):
    handler()
    return True`,
      tests: `seen = set()
calls = []
assert process_once(seen, "m1", lambda: calls.append("m1")) is True
assert process_once(seen, "m1", lambda: calls.append("m1-again")) is False
assert process_once(seen, "m2", lambda: calls.append("m2")) is True
assert calls == ["m1", "m2"]
assert seen == {"m1", "m2"}

def boom():
    raise RuntimeError("bank down")

try:
    process_once(seen, "m3", boom)
    raise AssertionError("the handler error should escape")
except RuntimeError:
    pass
assert "m3" not in seen
assert process_once(seen, "m3", lambda: calls.append("m3")) is True
assert calls == ["m1", "m2", "m3"]`,
      solution: `def process_once(seen, message_id, handler):
    if message_id in seen:
        return False
    handler()
    seen.add(message_id)
    return True`,
      hint: 'Check "message_id in seen" first. Call handler() before seen.add(...), so a handler that raises never reaches the add.',
    } },
    { warn: 'Retries plus a non-idempotent call are a **double-payment machine**. Never enable automatic retries on a POST that moves money unless it carries an idempotency key. And the seen-set has the same rule as the key: the **effect and the "seen" record must be saved in one database transaction**. If you pay first and record afterwards, a crash in between brings the duplicate back; if you record first, a crash loses the payment. Your in-memory set in the challenge is only a model. In real systems it is a table with a UNIQUE message id (see the ACID lesson).' },
    { warn: 'Be careful with the phrase "exactly-once" in product pages. Inside one platform\'s closed pipeline it can be true. The moment a message leaves for an outside system (a bank, an email service, a REST API), you are back to at-least-once, and the receiving side must be idempotent.' },
    { interview: '**"What is idempotency and why does it matter for retries?"** Model answer: "An operation is idempotent if running it several times has the same effect as running it once. It matters because networks fail in ways where a client cannot tell whether the request was processed, for example a timeout after the server already acted. The client must retry to be reliable, and a retry of a non-idempotent call such as creating a payment can duplicate it. So I make it idempotent: the client sends an idempotency key per intended action, and the server stores the key with the result under a UNIQUE constraint in the same transaction, then returns the saved result to any repeat. On the client I retry only temporary errors such as 429, 502, 503 and 504, with exponential backoff, a cap and jitter, and a limit on attempts. For queues, delivery is at-least-once, so the consumer dedupes by message id, and failures go to a dead-letter queue." Mention that exactly-once is really at-least-once plus idempotency, and you will sound like someone who has run this in production.' },
    { real: 'A Power Automate flow calls a bank or ERP API to post a supplier payment. The HTTP action times out, and the flow\'s retry policy sends the POST again. Before this lesson you hoped for the best. Now you (1) build the key from something stable, such as the GL journal id or invoice number, and send it as `Idempotency-Key`, (2) set the action\'s retry policy on purpose, since defaults change, so check the current settings, and (3) when the flow is started by a queue or Service Bus message, first look up "did I already process this message id?", because the same message can arrive twice.' },
    `## Recap
- A **timeout means "I don't know"**, so clients must retry. That is safe only for **idempotent** operations or calls with an **idempotency key**.
- The server saves the key with the result under a **UNIQUE** constraint, in one transaction, and returns the saved result to any repeat. \`ON CONFLICT DO NOTHING\` is the SQL form.
- Retry only **temporary** errors (timeouts, 429, 502, 503, 504). Use **exponential backoff, a cap, jitter and a maximum number of attempts** to avoid a thundering herd.
- A **queue** gives each message to one worker; **pub/sub** gives every subscriber a copy. **At-least-once** is the usual delivery, so duplicates happen.
- **"Exactly-once" = at-least-once delivery + an idempotent consumer.** Poison messages go to a watched **dead-letter queue**; **backpressure** stops a queue from growing without limit.`,
  ],
  quiz: [
    { q: 'An "invoice approved" event must reach the ledger service, the email service and the audit log, each doing its own work. What fits best?', o: ['One queue with three competing workers', 'A pub/sub topic with three subscribers', 'At-most-once delivery to the ledger only', 'A dead-letter queue'], a: 1, why: 'Pub/sub gives every subscriber its own copy. On a plain queue the workers compete, so each event would reach only one of them.' },
    { q: 'A client retries a payment with the same Idempotency-Key after a timeout. What should a correct server do?', o: ['Charge again and refund later', 'Return an error for every repeat', 'Delete the key and start over', 'Return the saved result of the first attempt without charging again'], a: 3, why: 'The key identifies one intended action. The server stores it with the result and replays that result for repeats.' },
    { q: 'Why add jitter to exponential backoff?', o: ['So clients that failed together do not all retry at the same moment', 'To make every wait longer', 'To make the request idempotent', 'So no maximum number of attempts is needed'], a: 0, why: 'Random waits spread the retries out, so a recovering server is not hit by a wave (the thundering herd).' },
    { q: 'Which response is generally worth an automatic retry?', o: ['422 Unprocessable (validation failed)', '403 Forbidden', '404 Not Found', '503 Service Unavailable'], a: 3, why: '503 is a temporary problem. 4xx errors say the request itself is wrong, so repeating it cannot help.' },
    { q: 'What does "exactly-once" usually mean in practice?', o: ['The network never delivers a duplicate', 'Messages are processed in order', 'At-least-once delivery plus a consumer that applies each message id only once', 'The message is sent once and never retried'], a: 2, why: 'Duplicates can still arrive. The idempotent consumer makes sure the effect happens once.' },
    { q: 'A message with broken JSON fails on every delivery. What keeps it from blocking the queue forever?', o: ['Retry it forever with a longer wait', 'Switch the whole system to at-most-once', 'Delete it silently', 'After N failed deliveries the broker moves it to a dead-letter queue for inspection'], a: 3, why: 'A dead-letter queue parks poison messages so others can flow, and people can inspect and replay them later.' },
  ],
  task: {
    title: 'Stop a double payment and tame a retry storm',
    steps: [
      'In the simulator, part B: click Pay without the key and note the total debited. Tick the key, click again and note the total. Write one sentence on what changed.',
      'In part A, with the outage at 5 s, record for each of the four policies: clients that succeeded, total requests, and the biggest number of requests in any second after second 0. Repeat at 12 s.',
      'Run the SQL playground twice. Then remove ON CONFLICT from the second INSERT and copy the error message. Explain why this error is also a safe result.',
      'In the retry helper, make the bank fail 6 times instead of 3. Write down what the caller sees and what the caller should do next.',
      'Write half a page for a Kollana payroll bank-file upload: where you would use an idempotency key (and what you would build it from), which errors you would retry, your maximum attempts and cap, which queue pattern you would use, and who watches the dead-letter queue.',
    ],
    deliverable: 'A one-page note with the two result tables from steps 1 and 2, the copied error from step 3, and your half-page design.',
  },
};
