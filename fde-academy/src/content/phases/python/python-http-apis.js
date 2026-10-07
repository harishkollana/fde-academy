export default {
  id: 'python-http-apis',
  title: 'Calling APIs',
  goal: 'You can call HTTP APIs from Python with requests or httpx, set timeouts, send headers and tokens, page through results lazily, handle 4xx and 5xx differently, retry with backoff and Retry-After only when it is safe, and test API code without a network.',
  roadmap: ['requests and httpx', 'headers and auth', 'pagination', 'timeouts', 'retries with backoff', '4xx vs 5xx'],
  blocks: [
    `## The problem
Your reconciliation needs data from outside: supplier invoices from a vendor portal, exchange rates, a bank statement from an API. A script that works on a test call fails in real life in five ways:
1. The API returns **5,000 records over 50 pages**, and you read only the first.
2. Once in a while the server answers **429 "slow down"** or **503 "busy"**, and your script crashes at 2 a.m.
3. A call **hangs for ever** because there is no timeout.
4. The **token expires** during a long run.
5. A failed request is **retried blindly**, and a payment is made twice.

Calling an API is easy. Calling it **reliably** is a set of habits: always set timeouts, send credentials safely, page properly, treat client errors and server errors differently, and retry only what is safe, with waiting. You already know the pieces: HTTP from the Foundations phase, error handling and backoff from the Errors lesson, generators, Pydantic and \`Decimal\`. This lesson puts them together.

Browsers cannot make arbitrary network calls from the playground, so the runnable parts **simulate the server** with scripted responses. That is also exactly how you test API code for real. On your laptop you will run a small practice API of your own and call it with \`requests\` and \`httpx\`.`,
    `## Status codes: who is at fault, and what do you do?
A response has a **status code**. The first digit tells you who is responsible, and so what to do:

| Code | Meaning | What your code does |
|---|---|---|
| 200, 201, 204 | success | use the result |
| 301, 302, 307 | redirect | follow it (libraries do), but only to trusted places |
| 400, 422 | your request is wrong (bad input) | **fix the request. Do not retry** |
| 401 | missing or expired credentials | get a fresh token, try **once** more |
| 403 | no permission | stop and report; retrying cannot help |
| 404 | not found | stop (or treat as "no data") |
| 409 | conflict (for example a duplicate) | handle it: it means the thing already exists |
| 429 | **too many requests** | wait (the \`Retry-After\` header says how long) and retry |
| 500, 502, 503, 504 | the **server** has a problem | retry with backoff, if the request is safe to repeat |

So: **4xx means "you did something wrong", and repeating the same request will fail again** (with the exceptions 401 and 429). **5xx means "they have a problem", and repeating later may work.** Network errors (connection reset, timeout) behave like 5xx: retry.

**Safe to repeat?** \`GET\` only reads, so repeating is harmless. \`PUT\` and \`DELETE\` are designed to be **idempotent** (the same effect when repeated). \`POST\` usually creates something: repeating it can create two. A \`POST\` is safe to retry only when the API supports an **\`Idempotency-Key\`** header: you send a unique key, and the server remembers it, so a repeat returns the first result instead of doing the work twice.`,
    { sketch: { w: 760, h: 306, caption: 'The first digit says who is at fault, and what to do next', items: [
      { t: 'table', x: 14, y: 36, title: 'what to do with each answer', cols: ['status', 'who is at fault', 'what to do'], colW: [150, 210, 340], rows: [['2xx', 'nobody', 'use the result'], ['400, 422', 'you (bad request)', 'fix the request, do NOT retry'], ['401', 'you (expired token)', 'refresh the token and try once more'], ['403, 404', 'you (no right / no data)', 'stop and report, do not retry'], ['429', 'you (too fast)', 'wait for Retry-After, then retry'], ['500, 502, 503, 504', 'them (server)', 'retry with backoff, if the call is safe']], rowH: 28, hl: [4, 5] },
      { t: 'note', x: 14, y: 246, w: 732, h: 52, fill: 'yellow', size: 14, text: 'Timeouts and dropped connections behave like 5xx: retry.\nA POST that creates something is safe to retry only with an Idempotency-Key.' },
    ] } },
    `## requests and httpx
\`requests\` is the classic library; \`httpx\` has almost the same interface and adds **async** support and a few modern features. Both are installed with \`pip\`; neither runs in the browser playground. The shape is the same:
\`\`\`python
import requests

with requests.Session() as session:                    # reuses the connection; share headers
    session.headers["User-Agent"] = "kollana-client/0.1"
    response = session.get(
        "https://api.example.com/invoices",
        params={"page": 1, "size": 100},               # becomes ?page=1&size=100 (and is URL-encoded)
        headers={"Authorization": f"Bearer {token}"},
        timeout=(3, 10),                               # (connect, read) in seconds: ALWAYS set this
    )
    response.raise_for_status()                        # raises HTTPError for any 4xx or 5xx
    data = response.json()                             # the body parsed as JSON
\`\`\`
What to remember:
- **\`timeout=\` is not optional.** The default is **no limit**: one stuck server connection freezes your whole job for ever. Set a connect and a read timeout (httpx: \`httpx.Timeout(10.0, connect=3.0)\`).
- **\`raise_for_status()\`** turns an error response into an exception, so a 404 is not silently parsed as data. In httpx it raises \`httpx.HTTPStatusError\`.
- A **\`Session\`** (httpx: \`Client\`) keeps connections open and is much faster for many calls. Create one per job, close it with \`with\`.
- Send **JSON** with \`json=payload\` (the library sets the header), form data with \`data=\`. Read \`response.status_code\`, \`response.headers\`, \`response.text\`, \`response.json()\`.
- **Never turn off TLS checks** (\`verify=False\`): you lose protection against someone in the middle. Fix the certificate problem instead (the Foundations TLS lesson).
- **Money in JSON:** a number like \`1037.50\` arrives as a float and loses exactness. Parse with \`json.loads(text, parse_float=Decimal)\` or ask the API for amounts as **strings**, then use \`Decimal\`.
- Check the **content**, not only the status: a 200 can still carry an error message or missing fields. Validate with a Pydantic model (the Type hints lesson).

**Authentication.** An **API key** goes in a header (check the API's docs for the name). A **Bearer token** goes in \`Authorization: Bearer <token>\`. With OAuth (Foundations phase) you first POST your client id and secret to a token endpoint and receive an **access token that expires** after \`expires_in\` seconds. Cache it, refresh it a little **before** it expires, and on a 401 refresh once and retry once. Keep keys and secrets in environment variables, never in the code, and never log them.`,
    { py: {
      title: 'A scripted transport: retries, Retry-After and "do not retry a 404"',
      starter: `class FakeResponse:
    def __init__(self, status, payload=None, headers=None):
        self.status_code, self._payload, self.headers = status, payload, headers or {}
    def json(self):
        return self._payload

class HTTPError(Exception):
    def __init__(self, status):
        super().__init__(f"HTTP {status}")
        self.status = status

class FakeTransport:
    """Plays back a script, one item per call: a response, or an exception to raise. Like a server having a bad day."""
    def __init__(self, script):
        self.script = list(script)
    def get(self, url, timeout=None):
        item = self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

RETRY_STATUSES = {429, 500, 502, 503, 504}

def call_api(transport, url, attempts=4, base=1.0, sleep=None, log=print):
    for attempt in range(1, attempts + 1):
        try:
            response = transport.get(url, timeout=(3, 10))
        except (ConnectionError, TimeoutError) as exc:                  # network trouble: transient
            if attempt == attempts:
                raise
            wait = base * 2 ** (attempt - 1)
            log(f"  attempt {attempt}: {type(exc).__name__}; wait {wait:g}s")
            sleep(wait)
            continue
        status = response.status_code
        if status < 400:
            log(f"  attempt {attempt}: HTTP {status}, success")
            return response.json()
        if status in RETRY_STATUSES and attempt < attempts:             # server-side or rate limit: retry
            retry_after = response.headers.get("Retry-After")
            wait = float(retry_after) if retry_after else base * 2 ** (attempt - 1)
            why = "Retry-After says" if retry_after else "backoff"
            log(f"  attempt {attempt}: HTTP {status}; wait {wait:g}s ({why})")
            sleep(wait)
            continue
        log(f"  attempt {attempt}: HTTP {status}, giving up")
        raise HTTPError(status)                                          # 4xx, or out of attempts

class Clock:                                       # fake time: nothing really waits
    def __init__(self):
        self.waited = 0.0
    def sleep(self, seconds):
        self.waited += seconds

scenarios = {
    "two 503s, then success": [FakeResponse(503), FakeResponse(503), FakeResponse(200, {"rate": 83.21})],
    "429 with Retry-After: 3": [FakeResponse(429, headers={"Retry-After": "3"}), FakeResponse(200, {"rate": 83.21})],
    "a dropped connection, then success": [ConnectionError("reset by peer"), FakeResponse(200, {"rate": 83.21})],
    "404 not found": [FakeResponse(404)],
    "500 every time": [FakeResponse(500)] * 4,
}
for name, script in scenarios.items():
    clock = Clock()
    print(name)
    try:
        result = call_api(FakeTransport(script), "https://api.example.test/rate", sleep=clock.sleep)
        print("   ->", result, "| virtual time waited:", clock.waited, "s")
    except HTTPError as exc:
        print("   -> raised", exc, "| virtual time waited:", clock.waited, "s")`,
      note: 'The 404 is raised at once with no waiting, because retrying cannot fix it. The 429 waits exactly as long as the server asked (3 seconds), not our own backoff. The 500 case retries three times with doubling waits (1, 2, 4 seconds) and then gives up. Because the transport is a script and sleep is a fake clock, this runs instantly and you can assert on every wait: that is how real API code is tested.',
    } },
    { sketch: { w: 760, h: 316, caption: 'The retry loop: decide by the answer, wait by the rules, and always have a way out', items: [
      { t: 'note', x: 14, y: 8, w: 360, h: 68, fill: 'grey', size: 13, text: 'Rules: only retry what is safe to repeat,\nset a maximum number of attempts,\nafter the last one raise, and log every attempt.' },
      { t: 'box', x: 14, y: 112, w: 130, h: 56, label: 'send request', sub: 'with a timeout', fill: 'blue', size: 15 },
      { t: 'arrow', x1: 148, y1: 140, x2: 196, y2: 140 },
      { t: 'box', x: 200, y: 102, w: 160, h: 76, label: 'what came back?', sub: 'status or error', fill: 'yellow', size: 15 },
      { t: 'arrow', x1: 364, y1: 118, x2: 516, y2: 40 },
      { t: 'text', x: 446, y: 62, text: '2xx', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'arrow', x1: 364, y1: 140, x2: 516, y2: 140 },
      { t: 'text', x: 440, y: 126, text: 'other 4xx', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'arrow', x1: 364, y1: 162, x2: 516, y2: 222 },
      { t: 'text', x: 362, y: 232, text: '429, 5xx, timeout', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'box', x: 520, y: 14, w: 170, h: 48, label: 'return the data', size: 14, fill: 'green' },
      { t: 'box', x: 520, y: 116, w: 170, h: 48, label: 'raise the error', size: 14, fill: 'pink' },
      { t: 'box', x: 520, y: 190, w: 170, h: 72, label: 'wait, then retry', sub: 'Retry-After, or\nbackoff + jitter', fill: 'white', size: 14 },
      { t: 'line', x1: 605, y1: 266, x2: 605, y2: 298, dashed: true },
      { t: 'line', x1: 605, y1: 298, x2: 79, y2: 298, dashed: true },
      { t: 'arrow', x1: 79, y1: 298, x2: 79, y2: 172, dashed: true },
      { t: 'text', x: 342, y: 290, text: 'again, up to N attempts', size: 14, anchor: 'middle', color: '#c0392b' },
    ] } },
    `## Pagination: reading everything, lazily
An API rarely returns everything at once. It returns a **page** and tells you how to get the next. Three common styles:
- **Page number**: \`?page=2&size=100\`. Simple, but see the trap below.
- **Offset and limit**: \`?offset=100&limit=100\`. The same idea.
- **Cursor** (also "next token" or a \`next\` URL): each response contains an opaque value that you send back to get the next page. This is **the safest** style.

**The trap with page numbers.** Suppose the list is sorted newest first and you have read page 1. A new item arrives. Everything shifts by one, so page 2 now starts with the **last item of page 1 again**: you get a **duplicate**. (If an item is deleted you can **miss** one instead.) A cursor, or a "give me items older than id 20" key, does not shift.

**Write pagination as a generator** (the Iterators lesson). The consumer loops over items and never thinks about pages, and pages are only fetched when needed:
\`\`\`python
def iter_invoices(session, size=100):
    path = f"/invoices?page=1&size={size}"
    while path:
        data = get_json(session, path)
        yield from data["items"]
        path = data["next"]            # None on the last page ends the loop
\`\`\`
Guard against bad servers: a **maximum number of pages**, a check that the cursor **changed**, and handling of an **empty page** that still has a \`next\`. Ask for the **largest page size** the API allows, and respect its **rate limit**: space calls out, or use a semaphore with async (the asyncio lesson).`,
    { sketch: { w: 760, h: 240, caption: 'When data changes while you read, page numbers can repeat an item; a cursor cannot', items: [
      { t: 'text', x: 190, y: 22, text: 'page numbers (offset)', size: 16, bold: true, anchor: 'middle' },
      { t: 'box', x: 14, y: 34, w: 350, h: 44, label: 'page 1: ids 29, 28, 27 ... 21, 20', size: 14, fill: 'blue' },
      { t: 'arrow', x1: 120, y1: 82, x2: 120, y2: 112 },
      { t: 'text', x: 134, y: 102, text: 'a new invoice (id 30) arrives at the top', size: 13, anchor: 'start', color: '#c0392b' },
      { t: 'box', x: 14, y: 116, w: 350, h: 44, label: 'page 2: ids 20, 19, 18 ... 12, 11', size: 14, fill: 'pink' },
      { t: 'note', x: 14, y: 172, w: 350, h: 52, fill: 'pink', size: 13, text: 'id 20 is read twice: everything shifted down by one,\nso position 11 is now the old position 10.' },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 226, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 570, y: 22, text: 'cursor ("older than the last id")', size: 16, bold: true, anchor: 'middle' },
      { t: 'box', x: 396, y: 34, w: 350, h: 44, label: 'page 1: ids 29 ... 20   (last seen: 20)', size: 14, fill: 'blue' },
      { t: 'arrow', x1: 502, y1: 82, x2: 502, y2: 112 },
      { t: 'text', x: 516, y: 102, text: 'id 30 arrives: does not matter', size: 13, anchor: 'start', color: '#5c6478' },
      { t: 'box', x: 396, y: 116, w: 350, h: 44, label: 'page 2: ids below 20: 19, 18 ... 11, 10', size: 14, fill: 'green' },
      { t: 'note', x: 396, y: 172, w: 350, h: 52, fill: 'green', size: 13, text: 'No repeat and no gap: the cursor remembers the last\nitem it saw, not a position in a moving list.' },
    ] } },
    { py: {
      title: 'Lazy pagination, and why page numbers can repeat an item while a cursor cannot',
      starter: `import csv
from itertools import islice

with open("supplier_invoices.csv", newline="") as f:
    rows = list(csv.DictReader(f))
DB = sorted(rows, key=lambda r: int(r["si_id"]), reverse=True)     # newest first, 29 invoices

class FakeAPI:
    """A page-number API. It counts the requests it receives."""
    def __init__(self, data):
        self.data, self.requests = data, 0
    def get_page(self, page, size):
        self.requests += 1
        items = self.data[(page - 1) * size: page * size]
        return {"items": items, "next": page + 1 if page * size < len(self.data) else None}

def iter_all(api, size):
    page = 1
    while page:
        data = api.get_page(page, size)
        yield from data["items"]
        page = data["next"]

api = FakeAPI(DB)
print("all invoices:", len(list(iter_all(api, 10))), "| requests made:", api.requests)

api = FakeAPI(DB)
first_twelve = list(islice(iter_all(api, 10), 12))
print("only 12 wanted:", len(first_twelve), "| requests made:", api.requests, "(pages are fetched on demand)")

print()
print("--- a new invoice arrives while we are paging (newest first)")
api = FakeAPI(list(DB))
page1 = api.get_page(1, 10)["items"]
api.data.insert(0, {"si_id": "100", "invoice_no": "INV/NEW", "supplier_gstin": "", "invoice_date": "", "taxable_value": "0", "gst_amount": "0"})
page2 = api.get_page(2, 10)["items"]
seen = [r["si_id"] for r in page1 + page2]
print("page numbers: ids read:", seen)
print("   duplicates:", sorted({i for i in seen if seen.count(i) > 1}), "<- the last item of page 1 came again")

def cursor_page(data, after_id, size):
    items = [r for r in data if after_id is None or int(r["si_id"]) < after_id]
    return items[:size]

data = list(DB)
read = []
after = None
page = cursor_page(data, after, 10)
read += [r["si_id"] for r in page]
after = int(page[-1]["si_id"])
data.insert(0, {"si_id": "100", "invoice_no": "INV/NEW", "supplier_gstin": "", "invoice_date": "", "taxable_value": "0", "gst_amount": "0"})
while page:
    page = cursor_page(data, after, 10)
    read += [r["si_id"] for r in page]
    if page:
        after = int(page[-1]["si_id"])
print("cursor      : ids read:", len(read), "| duplicates:", len(read) - len(set(read)), "| the new invoice arrived at the front and is simply not part of this walk")`,
      note: 'The first two lines show the generator at work: wanting 12 invoices cost only 2 requests, not 3. In the second half the page-number walk read one invoice twice, because a new row pushed everything down by one. The cursor walk keeps its place by remembering the last id it saw, so it never repeats. In real APIs the cursor is usually a token the server gives you, and it is the better choice whenever data changes while you read.',
    } },
    { widget: 'ApiPlayground' },
    { py: {
      title: 'Parsing a response defensively: nulls, extras, text numbers and exact money',
      starter: `import json
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ValidationError

text = '''{"items": [
  {"invoice_no": "INV/0001/25-26", "amount": 1037.50, "gst": 186.75, "status": "open", "internal_flag": 1},
  {"invoice_no": "INV/0002/25-26", "amount": "1075.00", "gst": null, "status": "paid"},
  {"invoice_no": "INV/0003/25-26", "amount": 0.1, "gst": 0.2, "status": "open"},
  {"invoice_no": "INV/0004/25-26", "amount": 50, "gst": 9, "status": "cancelled"}
]}'''

# 1. floats lose exactness; Decimal parsed from the JSON text does not
as_float = json.loads(text)
as_decimal = json.loads(text, parse_float=Decimal)
third_float, third_decimal = as_float["items"][2], as_decimal["items"][2]
print("float  :", third_float["amount"] + third_float["gst"])
print("Decimal:", third_decimal["amount"] + third_decimal["gst"])

# 2. validate every record: extra keys are ignored, null is allowed where we say so, text numbers are converted
class Invoice(BaseModel):
    invoice_no: str
    amount: Decimal
    gst: Decimal | None = None
    status: Literal["open", "paid"]

good, bad = [], []
for number, item in enumerate(as_decimal["items"], start=1):
    try:
        good.append(Invoice.model_validate(item))
    except ValidationError as exc:
        bad.append((number, [(e["loc"][0], e["type"]) for e in exc.errors()]))

print(len(good), "valid records:", [(i.invoice_no, i.amount, i.gst) for i in good])
print("rejected:", bad)

# 3. the totals you can trust
print("sum of amounts:", sum(i.amount for i in good))
print("sum of GST    :", sum((i.gst for i in good if i.gst is not None), Decimal("0")), "(null GST counts as 'not given', not zero)")`,
      note: 'Never trust the shape of an API answer. The first record has an extra key (ignored), the second has the amount as text and a null GST (both accepted), the third shows the float problem, and the fourth has a status your model does not know, so it is rejected with the reason instead of crashing the job. Write rejects to a file, as in the Types and Errors lessons.',
    } },
    { local: `**Run a practice API of your own and call it** (virtual environment active; \`pip install requests httpx\`). This is the same stdlib server idea as in the asyncio lesson, with the endpoints a real API gives you. Save as \`test_api.py\` in \`C:\\fde\\py-recap\` and keep it running in one window with \`python test_api.py\`:
\`\`\`python
"""A small practice API (standard library only): python test_api.py"""
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

TOKEN = "demo-token-123"
INVOICES = [{"id": i, "invoice_no": f"INV/{i:04d}/25-26", "amount": f"{1000 + i * 37.5:.2f}"} for i in range(1, 26)]
STATE = {"flaky": 0, "limited": 0}


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        q = parse_qs(url.query)
        if url.path == "/health":
            return self.send_json(200, {"status": "ok"})
        if url.path == "/secure":                                   # needs a Bearer token
            if self.headers.get("Authorization") != f"Bearer {TOKEN}":
                return self.send_json(401, {"error": "missing or bad token"})
            return self.send_json(200, {"user": "uploader"})
        if url.path == "/invoices":                                 # page-number pagination
            page, size = int(q.get("page", ["1"])[0]), int(q.get("size", ["10"])[0])
            items = INVOICES[(page - 1) * size: page * size]
            nxt = f"/invoices?page={page + 1}&size={size}" if page * size < len(INVOICES) else None
            return self.send_json(200, {"items": items, "page": page, "next": nxt, "total": len(INVOICES)})
        if url.path == "/flaky":                                    # 503, 503, then 200
            STATE["flaky"] += 1
            if STATE["flaky"] % 3 != 0:
                return self.send_json(503, {"error": "busy"})
            return self.send_json(200, {"ok": True, "call": STATE["flaky"]})
        if url.path == "/limited":                                  # 429 with Retry-After, then 200
            STATE["limited"] += 1
            if STATE["limited"] % 2 == 1:
                return self.send_json(429, {"error": "slow down"}, {"Retry-After": "1"})
            return self.send_json(200, {"ok": True})
        if url.path == "/slow":                                     # answers after 3 seconds
            time.sleep(3)
            return self.send_json(200, {"ok": True})
        return self.send_json(404, {"error": "not found"})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print("practice API on http://127.0.0.1:8800  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", 8800), Handler).serve_forever()
\`\`\`
In a second window save and run \`api_client.py\`:
\`\`\`python
"""Calling an API: timeouts, auth, pagination, retries with backoff."""
import random
import time
from decimal import Decimal

import requests

BASE = "http://127.0.0.1:8800"
RETRY_STATUSES = {429, 502, 503, 504}


def get_json(session, path, *, attempts=5, base_wait=0.2, **kwargs):
    """GET with a timeout, retries with exponential backoff and jitter, and Retry-After support."""
    for attempt in range(1, attempts + 1):
        try:
            response = session.get(BASE + path, timeout=(3, 5), **kwargs)      # (connect, read) seconds
        except (requests.ConnectionError, requests.Timeout) as exc:
            if attempt == attempts:
                raise
            wait = base_wait * 2 ** (attempt - 1)
            print(f"  attempt {attempt}: {type(exc).__name__}, waiting {wait:.2f}s")
            time.sleep(wait)
            continue
        if response.status_code in RETRY_STATUSES and attempt < attempts:
            retry_after = response.headers.get("Retry-After")
            wait = float(retry_after) if retry_after else random.uniform(0, base_wait * 2 ** (attempt - 1))
            print(f"  attempt {attempt}: HTTP {response.status_code}, waiting {wait:.2f}s")
            time.sleep(wait)
            continue
        response.raise_for_status()                                            # 4xx / 5xx -> HTTPError
        return response.json()


def iter_invoices(session, size=10):
    """A generator: pages are fetched only when the consumer asks for more items."""
    path = f"/invoices?page=1&size={size}"
    while path:
        data = get_json(session, path)
        yield from data["items"]
        path = data["next"]


if __name__ == "__main__":
    with requests.Session() as session:
        session.headers["User-Agent"] = "kollana-client/0.1"
        print("health  :", get_json(session, "/health"))

        print("--- auth")
        try:
            get_json(session, "/secure")
        except requests.HTTPError as exc:
            print("without a token:", exc.response.status_code, exc.response.json())
        print("with a token   :", get_json(session, "/secure", headers={"Authorization": "Bearer demo-token-123"}))

        print("--- flaky endpoint (503, 503, 200)")
        random.seed(1)
        print(get_json(session, "/flaky"))
        print("--- rate limited endpoint (429 with Retry-After: 1)")
        print(get_json(session, "/limited"))

        print("--- timeout")
        try:
            session.get(BASE + "/slow", timeout=1)
        except requests.Timeout as exc:
            print("raised", type(exc).__name__, "after 1 second")

        print("--- pagination")
        items = list(iter_invoices(session, size=10))
        print(len(items), "invoices; first:", items[0]["invoice_no"], "last:", items[-1]["invoice_no"])
        first_three = []
        for item in iter_invoices(session, size=10):
            first_three.append(item["id"])
            if len(first_three) == 3:
                break
        print("lazy: took", first_three, "(stopped after the first page was read)")

        print("--- money as text and Decimal")
        data = session.get(BASE + "/invoices?page=1&size=2", timeout=5).json()
        print([Decimal(i["amount"]) for i in data["items"]])

        print("--- a 404 is an error, not a retry")
        try:
            get_json(session, "/missing")
        except requests.HTTPError as exc:
            print("HTTPError:", exc.response.status_code)
\`\`\`
Output to expect (the waits for the flaky call use random jitter, so your two numbers will differ; the rest is the same):
\`\`\`text
health  : {'status': 'ok'}
--- auth
without a token: 401 {'error': 'missing or bad token'}
with a token   : {'user': 'uploader'}
--- flaky endpoint (503, 503, 200)
  attempt 1: HTTP 503, waiting 0.03s
  attempt 2: HTTP 503, waiting 0.34s
{'ok': True, 'call': 3}
--- rate limited endpoint (429 with Retry-After: 1)
  attempt 1: HTTP 429, waiting 1.00s
{'ok': True}
--- timeout
raised ReadTimeout after 1 second
--- pagination
25 invoices; first: INV/0001/25-26 last: INV/0025/25-26
lazy: took [1, 2, 3] (stopped after the first page was read)
--- money as text and Decimal
[Decimal('1037.50'), Decimal('1075.00')]
--- a 404 is an error, not a retry
HTTPError: 404
\`\`\`
Restart \`test_api.py\` before running again, because the flaky and limited endpoints count calls. Read the 429 line: the client waited **exactly the 1.00 s** the server asked for, not its own backoff.

**Less code with the libraries' own tools.** \`requests\` can retry by itself through urllib3, and \`httpx\` has a mock transport for tests:
\`\`\`python
import httpx
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry = Retry(
    total=5,
    backoff_factor=0.2,                      # growing waits between attempts
    status_forcelist=[429, 502, 503, 504],
    allowed_methods=["GET", "HEAD"],         # only retry requests that are safe to repeat
    respect_retry_after_header=True,
)
session = requests.Session()
session.mount("http://", HTTPAdapter(max_retries=retry))
session.mount("https://", HTTPAdapter(max_retries=retry))
print(session.get("http://127.0.0.1:8800/flaky", timeout=5).json())      # {'ok': True, 'call': 3}

timeout = httpx.Timeout(5.0, connect=3.0)
with httpx.Client(base_url="http://127.0.0.1:8800", timeout=timeout) as client:
    data = client.get("/invoices", params={"page": 2, "size": 5}).json()
    print([i["id"] for i in data["items"]], data["next"])                # [6, 7, 8, 9, 10] /invoices?page=3&size=5

def handler(request: httpx.Request) -> httpx.Response:                   # a test without a network
    return httpx.Response(200, json={"USD": "83.21"}) if request.url.path == "/rates" else httpx.Response(404)

with httpx.Client(transport=httpx.MockTransport(handler), base_url="http://fake") as client:
    print(client.get("/rates").json(), client.get("/nope").status_code)  # {'USD': '83.21'} 404
\`\`\`
Common errors: \`ConnectionError\` or "connection refused" means the server is not running (check the window). \`ReadTimeout\` means the server accepted the call but did not answer in time. \`SSLError\` or certificate errors against a real API: update your certificates or the \`certifi\` package; do not set \`verify=False\`. \`401\` with a token you think is right: check the header name, the word "Bearer" and a trailing newline in the value.` },
    { warn: `Things that go wrong when calling APIs:
- **No timeout.** One hung connection stops the whole job. Always pass \`timeout=\`.
- **Not calling \`raise_for_status()\`** and parsing an error page as data.
- **Retrying everything.** A 400, 404 or 422 will fail every time. Retry only 429, 5xx and network errors, and only for requests that are safe to repeat.
- **Retrying a POST that creates something** without an \`Idempotency-Key\`: duplicate payments or duplicate records.
- **Ignoring \`Retry-After\`** and hammering a server that asked you to wait. You may get blocked.
- **Retry loops with no limit, or no jitter.** Cap the attempts and add randomness (the Errors lesson).
- **Reading only the first page**, or trusting page numbers while the data changes. Use a cursor where possible, and a max-pages guard.
- **Floats for money in JSON.** Parse with \`parse_float=Decimal\` or request strings.
- **Trusting the response shape.** Validate with a model; handle null and missing keys.
- **Tokens and keys in code, in logs or in URLs.** Use environment variables, mask them in logs, and send them in headers.
- **Disabling TLS verification** (\`verify=False\`) to "make the error go away".
- **Calling the API once per record** when a bulk endpoint exists, or opening a new connection for every call. Use a \`Session\` and batch where you can.` },
    { pychallenge: {
      id: 'python-http-apis-ch1',
      prompt: 'Write `retry_after_seconds(value, now)` for the `Retry-After` response header. `value` is the header text (or `None`). It is either a **whole number of seconds** (`"120"`) or an **HTTP date** (`"Wed, 21 Oct 2026 07:28:00 GMT"`). Return the number of seconds to wait as an `int`. For a date, count from `now` (a timezone-aware `datetime`); a date in the past gives `0`. Return `None` for `None`, an empty string, text with spaces only, negative numbers, decimals or anything that is neither a whole number nor a date. Spaces around the value are ignored. Hint: `email.utils.parsedate_to_datetime` reads HTTP dates.',
      starter: `from datetime import timezone
from email.utils import parsedate_to_datetime

def retry_after_seconds(value, now):
    # TODO: whole seconds -> int; HTTP date -> seconds from now (never below 0); anything else -> None
    return None
`,
      tests: `from datetime import datetime, timezone

now = datetime(2026, 10, 21, 7, 27, 0, tzinfo=timezone.utc)
assert retry_after_seconds("120", now) == 120
assert retry_after_seconds(" 5 ", now) == 5
assert retry_after_seconds("0", now) == 0
assert retry_after_seconds("Wed, 21 Oct 2026 07:28:00 GMT", now) == 60
assert retry_after_seconds("Wed, 21 Oct 2026 07:20:00 GMT", now) == 0
assert retry_after_seconds("Wed, 21 Oct 2026 08:27:30 GMT", now) == 3630
assert retry_after_seconds(None, now) is None
assert retry_after_seconds("", now) is None
assert retry_after_seconds("   ", now) is None
assert retry_after_seconds("soon", now) is None
assert retry_after_seconds("-5", now) is None
assert retry_after_seconds("1.5", now) is None
assert isinstance(retry_after_seconds("120", now), int)
assert isinstance(retry_after_seconds("Wed, 21 Oct 2026 07:28:00 GMT", now), int)`,
      solution: `from datetime import timezone
from email.utils import parsedate_to_datetime

def retry_after_seconds(value, now):
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None
    if text.isdigit():
        return int(text)
    try:
        when = parsedate_to_datetime(text)
    except (TypeError, ValueError):
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return max(0, int((when - now).total_seconds()))
`,
      hint: 'Strip the text. If `text.isdigit()` return `int(text)` (this also rejects "-5" and "1.5"). Otherwise try `parsedate_to_datetime(text)` inside `try/except (TypeError, ValueError)` and return `None` on failure. If the date has no timezone, set UTC. The wait is `max(0, int((when - now).total_seconds()))`.',
    } },
    { pychallenge: {
      id: 'python-http-apis-ch2',
      prompt: 'Write the generator `iter_pages(fetch_page, max_pages=100)` for cursor pagination. `fetch_page(cursor)` returns `{"items": [...], "next_cursor": ...}`; the first call uses the cursor `None`; a `next_cursor` of `None` means the last page. Yield the items one by one across all pages, and fetch a page **only when the consumer needs more items** (lazy). Raise `RuntimeError` if a cursor repeats (the server loops) or if more than `max_pages` pages would be fetched. An empty page that has a next cursor must not stop the walk.',
      starter: `def iter_pages(fetch_page, max_pages=100):
    # TODO: loop with a cursor; yield from page["items"]; stop when next_cursor is None; add the two guards
    return iter(())
`,
      tests: `pages = {
    None: {"items": [1, 2, 3], "next_cursor": "a"},
    "a": {"items": [4, 5], "next_cursor": "b"},
    "b": {"items": [], "next_cursor": "c"},
    "c": {"items": [6], "next_cursor": None},
}
calls = []

def fetch(cursor):
    calls.append(cursor)
    return pages[cursor]

assert list(iter_pages(fetch)) == [1, 2, 3, 4, 5, 6]
assert calls == [None, "a", "b", "c"], calls

calls.clear()
it = iter_pages(fetch)
assert next(it) == 1 and calls == [None], calls
assert [next(it), next(it), next(it)] == [2, 3, 4] and calls == [None, "a"], calls

loop = {None: {"items": [1], "next_cursor": "x"}, "x": {"items": [2], "next_cursor": "x"}}
try:
    list(iter_pages(lambda c: loop[c]))
    raise AssertionError("a repeating cursor must raise RuntimeError")
except RuntimeError:
    pass

n = {"i": 0}
def endless(cursor):
    n["i"] += 1
    return {"items": [n["i"]], "next_cursor": f"c{n['i']}"}

try:
    list(iter_pages(endless, max_pages=5))
    raise AssertionError("too many pages must raise RuntimeError")
except RuntimeError:
    pass
assert n["i"] == 5, n

assert list(iter_pages(lambda c: {"items": [], "next_cursor": None})) == []`,
      solution: `def iter_pages(fetch_page, max_pages=100):
    cursor, seen, fetched = None, set(), 0
    while True:
        if cursor in seen:
            raise RuntimeError(f"cursor repeated: {cursor!r}")
        seen.add(cursor)
        if fetched >= max_pages:
            raise RuntimeError("too many pages")
        page = fetch_page(cursor)
        fetched += 1
        yield from page["items"]
        cursor = page["next_cursor"]
        if cursor is None:
            return
`,
      hint: 'Keep `cursor = None`, a `seen` set and a counter `fetched`. At the top of a `while True` loop raise `RuntimeError` if the cursor is in `seen` or if `fetched >= max_pages`; then add the cursor to `seen`, call `fetch_page(cursor)`, `yield from page["items"]`, and set `cursor = page["next_cursor"]`; `return` when it is `None`. Because it is a generator, nothing is fetched until the consumer asks.',
    } },
    { pychallenge: {
      id: 'python-http-apis-ch3',
      prompt: 'Write `should_retry(status, method, has_idempotency_key=False)`. The method is case-insensitive. **429** is always retryable (the request was not processed). **502, 503 and 504** are retryable if the method is idempotent (`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`) **or** an idempotency key was sent. **500** is retryable only for read-only methods (`GET`, `HEAD`, `OPTIONS`). Everything else (2xx, 3xx, 400, 401, 403, 404, 409, 422, 501 and so on) is not retryable. Return `True` or `False`.',
      starter: `def should_retry(status, method, has_idempotency_key=False):
    # TODO: apply the rules for 429, 502/503/504 and 500
    return False
`,
      tests: `assert should_retry(429, "GET") is True
assert should_retry(429, "POST") is True
assert should_retry(429, "post") is True
assert should_retry(503, "GET") is True
assert should_retry(503, "put") is True
assert should_retry(504, "DELETE") is True
assert should_retry(502, "POST") is False
assert should_retry(503, "POST") is False
assert should_retry(503, "POST", has_idempotency_key=True) is True
assert should_retry(504, "PATCH", has_idempotency_key=True) is True
assert should_retry(500, "GET") is True
assert should_retry(500, "head") is True
assert should_retry(500, "PUT") is False
assert should_retry(500, "POST", has_idempotency_key=True) is False
for status in (200, 201, 204, 301, 400, 401, 403, 404, 409, 422, 501):
    assert should_retry(status, "GET") is False, status
    assert should_retry(status, "POST", has_idempotency_key=True) is False, status`,
      solution: `IDEMPOTENT = {"GET", "HEAD", "OPTIONS", "PUT", "DELETE"}
READ_ONLY = {"GET", "HEAD", "OPTIONS"}

def should_retry(status, method, has_idempotency_key=False):
    method = method.upper()
    if status == 429:
        return True
    if status in (502, 503, 504):
        return method in IDEMPOTENT or has_idempotency_key
    if status == 500:
        return method in READ_ONLY
    return False
`,
      hint: 'Upper-case the method first. `if status == 429: return True`. For 502, 503 and 504 return `method in IDEMPOTENT or has_idempotency_key` where `IDEMPOTENT` is the set of five methods. For 500 return `method in READ_ONLY`. Everything else returns `False`.',
    } },
    { pychallenge: {
      id: 'python-http-apis-ch4',
      prompt: 'Write the class `TokenCache(fetch_token, clock, margin=30)`. `fetch_token()` returns a tuple `(token, expires_in_seconds)`; `clock()` returns the current time in seconds. `get()` returns a token: it calls `fetch_token` the first time and then returns the **same token** until the time is within `margin` seconds of its expiry (so a token is reused while `clock() < expires_at - margin`). After that `get()` fetches a new one. `invalidate()` forgets the cached token, so the next `get()` fetches a new one (use it after a 401).',
      starter: `class TokenCache:
    def __init__(self, fetch_token, clock, margin=30):
        self.fetch_token = fetch_token
        self.clock = clock
        self.margin = margin
        # TODO: remember the token and the time it expires

    def get(self):
        return None

    def invalidate(self):
        pass
`,
      tests: `t = {"now": 1000.0}
calls = []

def fetch():
    calls.append(t["now"])
    return f"tok{len(calls)}", 3600

cache = TokenCache(fetch, lambda: t["now"], margin=60)
assert cache.get() == "tok1"
t["now"] += 3000
assert cache.get() == "tok1" and len(calls) == 1
t["now"] += 539
assert cache.get() == "tok1" and len(calls) == 1
t["now"] += 1
assert cache.get() == "tok2" and len(calls) == 2, calls
assert cache.get() == "tok2" and len(calls) == 2
cache.invalidate()
assert cache.get() == "tok3" and len(calls) == 3
t["now"] += 10_000
assert cache.get() == "tok4" and len(calls) == 4

default = TokenCache(lambda: ("x", 100), lambda: t["now"])
assert default.margin == 30`,
      solution: `class TokenCache:
    def __init__(self, fetch_token, clock, margin=30):
        self.fetch_token = fetch_token
        self.clock = clock
        self.margin = margin
        self._token = None
        self._expires_at = 0.0

    def get(self):
        if self._token is None or self.clock() >= self._expires_at - self.margin:
            token, expires_in = self.fetch_token()
            self._token = token
            self._expires_at = self.clock() + expires_in
        return self._token

    def invalidate(self):
        self._token = None
`,
      hint: 'Store `_token` (start with `None`) and `_expires_at`. In `get()` fetch a new token when there is none or when `self.clock() >= self._expires_at - self.margin`; after fetching set `_expires_at = self.clock() + expires_in`. `invalidate()` sets the token back to `None`.',
    } },
    { real: 'Nearly every integration in this course is an API call: supplier and GST data, exchange rates, bank APIs, the Payroll Bank Mandate Validation API of Project C, and later the LLM APIs, which add token limits and cost on top of the same rules (timeouts, 429, retries, idempotency, pagination, validation). When a vendor says "the API is unreliable", the usual truth is that the client did not set timeouts, did not respect `Retry-After`, did not page properly, or retried something unsafe. A client that does these five things is the difference between a demo script and a job you can leave running overnight, and it is a favourite interview topic.' },
    { interview: `**"How do you call an API reliably from Python?"**
Model answer: "I use a \`Session\` or \`Client\` with a connect and read timeout on every call, send the token in the \`Authorization\` header from an environment variable, call \`raise_for_status\` and validate the payload with a model. I retry only transient failures: 429, 502, 503, 504 and network errors, with exponential backoff and jitter, a maximum number of attempts, and I honour \`Retry-After\`. I never retry 4xx errors, apart from refreshing an expired token once."

**"What is the difference between 4xx and 5xx, and what do you do about each?"** "4xx means the client request is wrong, so repeating it fails again: I fix the request, refresh credentials on 401, and wait on 429. 5xx means the server has a problem, so I retry with backoff, but only if the request is safe to repeat."

**"How do you retry a POST safely?"** "A POST that creates something is not idempotent, so I send an \`Idempotency-Key\`, a unique value per logical operation. The server stores the first result under the key and returns it for repeats, so a retry cannot create a duplicate. Without that support I do not retry a POST blindly; I check whether the first call succeeded."

**"How do you read all the data from a paginated API?"** "I write a generator that follows the next link or cursor, so items are fetched lazily. I prefer cursor pagination because page numbers can duplicate or skip items when data changes during the walk. I add guards: a maximum number of pages and a check that the cursor changes. I also respect the rate limit."

**"How do you test code that calls an API?"** "I do not call the real API in unit tests. I inject the transport or the client, or use \`httpx.MockTransport\`, and play back scripted responses: a 503, then a 200, a 429 with \`Retry-After\`, a timeout. A fake clock replaces sleep, so the tests are instant and I can assert the exact waits."` },
    `## Recap
- **Status codes**: 2xx success; **4xx = the request is wrong** (do not retry; 401 refresh once, 429 wait); **5xx = the server has a problem** (retry with backoff). Network errors and timeouts behave like 5xx.
- **requests / httpx**: use a \`Session\` or \`Client\`, **always set timeouts**, \`raise_for_status()\`, \`params=\` and \`json=\`, tokens in headers from the environment, never \`verify=False\`. Parse money with \`Decimal\` (\`parse_float=Decimal\` or strings) and **validate** responses with Pydantic.
- **Retry only what is safe**: GET and idempotent methods, or POST with an **Idempotency-Key**. Honour **\`Retry-After\`**, add exponential backoff with jitter, cap the attempts, log each one. Refresh an expired token once (a \`TokenCache\`).
- **Pagination**: write a lazy **generator**; prefer **cursors** to page numbers (which can duplicate or skip); guard with max pages and a changed-cursor check.
- **Test without a network**: a scripted transport (or \`MockTransport\`) plus a fake clock makes retry and pagination logic instant to test.`,
  ],
  quiz: [
    { q: 'An API returns 404 for an invoice id. What should the client do?', o: ['retry five times with backoff', 'retry once after refreshing the token', 'not retry: the same request will fail again; report or treat it as "no data"', 'switch to a POST'], a: 2, why: '404 is a client-side status: the thing is not there. Retrying the same request cannot change that.' },
    { q: 'What is the default timeout of `requests.get(url)` when you do not pass `timeout=`?', o: ['30 seconds', 'no timeout at all: it can wait for ever', '5 seconds', 'the same as the server\'s timeout'], a: 1, why: 'requests waits indefinitely by default, so one unresponsive server can freeze a job. Always set a (connect, read) timeout.' },
    { q: 'The server answers 429 with the header `Retry-After: 3`. What does a good client do?', o: ['retries immediately', 'waits about 3 seconds and then retries', 'gives up and raises', 'sends the request twice at once'], a: 1, why: '429 means "too many requests". Retry-After tells you how long to wait, so you honour it instead of using your own guess.' },
    { q: 'Why can paging with `?page=2` repeat an item when new data arrives while you read?', o: ['a new row shifts everything by one, so the last item of page 1 becomes the first of page 2', 'the server is broken', 'page numbers are random', 'the client is too slow'], a: 0, why: 'Offset and page-number pagination count positions. If the list changes between requests, positions move. A cursor remembers the last item, not the position.' },
    { q: 'You must retry a `POST /payments` after a timeout. What makes this safe?', o: ['nothing: POST can never be retried', 'waiting longer', 'switching to HTTP/2', 'sending the same Idempotency-Key, so the server returns the first result instead of paying twice'], a: 3, why: 'Without protection a repeated POST can create a second payment. With an idempotency key the server recognises the repeat and does not do the work twice.' },
    { q: 'Which statement about `raise_for_status()` is right?', o: ['it retries the request', 'it validates the JSON body', 'it turns a 4xx or 5xx response into an exception, so an error page is not parsed as data', 'it closes the session'], a: 2, why: 'Without it a failed call returns a normal response object and your code may carry on with an error message as data.' },
  ],
  task: {
    title: 'A reliable client for the practice API, tested without a network',
    steps: [
      'In `C:\\fde\\py-recap` save `test_api.py` and `api_client.py` from the laptop box. Start the server, run the client, and compare every output line. Write one sentence for the 429 line: why did it wait exactly 1 second?',
      'Add a `TokenCache` (challenge 4) with a fake `fetch_token` that returns `("demo-token-123", 60)`. Make the client call `/secure` through it, and on a 401 call `invalidate()` and retry once. Show the 401 path by sending a wrong token the first time.',
      'Replace the hand-written retry with the urllib3 `Retry` adapter from the box and compare the output and the waits. Add `allowed_methods=["GET"]` and explain why `POST` is left out.',
      'Write `iter_pages` (challenge 2) for a cursor API: extend `test_api.py` with a `/events?cursor=...` endpoint that returns `next_cursor`. Read all events lazily, then stop after 7 items and count how many requests were made.',
      'Write tests with `httpx.MockTransport` (or a scripted fake) for: 503, 503, 200; 429 with `Retry-After`; a 404; a timeout. Use a fake `sleep` and assert the waits `[0.2, 0.4]`-style that your code asked for.',
      'Add a Pydantic model for an invoice (`id`, `invoice_no`, `amount` as `Decimal`), validate every item from `/invoices`, and write failures to `rejects.jsonl` with the item index and reason. Parse the response with `parse_float=Decimal` and check the total equals the sum of the string amounts.',
    ],
    deliverable: '`api_client.py` with the token cache, retries and lazy pagination, the pytest or unittest file with the scripted tests, and the printed output of a full run.',
  },
};
