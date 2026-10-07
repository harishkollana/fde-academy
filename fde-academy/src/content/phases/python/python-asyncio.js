export default {
  id: 'python-asyncio',
  title: 'asyncio',
  goal: 'You can explain the event loop, write async functions with await, run many I/O calls at once with gather, TaskGroup and a Semaphore, handle timeouts and errors, and avoid blocking the loop.',
  roadmap: ['async and await', 'the event loop', 'gathering API calls', 'timeouts and cancellation', 'when async helps'],
  blocks: [
    `## The problem
In the last lesson you made 200 slow API calls faster with a pool of threads. It works, but every thread costs memory, you must protect shared data, and a thousand threads is a lot. Many modern tools (FastAPI servers, scrapers, API clients) need **thousands of waits at the same time** while using one thread and very little memory.

\`asyncio\` is Python's answer. It runs **one thread** and many **tasks**. A task runs until it reaches a point where it must **wait** (for the network, a timer, a database), and there it says "I am waiting, someone else can use the CPU". The program then switches to another task that is ready. When the wait is over, the first task continues. Nothing is interrupted at a random moment, so there are far fewer race conditions than with threads.

**Analogy.** One chef, many pots. While the rice boils (a wait), the chef chops vegetables for another dish. There is only one chef and only one thing is being done at any instant, but nothing stands idle.

This lesson is runnable in the browser: Python's \`asyncio\` works in the playground, so you can run real async code. Keep your sleeps short; real servers are replaced by \`asyncio.sleep\`.`,
    `## The vocabulary
- A **coroutine function** is defined with \`async def\`. **Calling it does not run it.** It returns a **coroutine object**, much like calling a generator function returns a generator (and the machinery is related: a coroutine is a function that can pause and resume).
- **\`await\`** means: "run this coroutine or wait for this thing, and **while waiting, let other tasks run**". You can only write \`await\` inside an \`async def\`.
- The **event loop** is the scheduler. It keeps a list of tasks that are ready, runs each one until it awaits, and wakes tasks whose waits are over. \`asyncio.run(main())\` creates a loop, runs \`main\` until it finishes, and closes the loop. Call it **once**, at the top of the program.
- A **task** is a coroutine that the loop is running in the background: \`asyncio.create_task(coro)\`. A task starts as soon as you create it (at the next await).
- **\`await asyncio.gather(a(), b(), c())\`** starts several coroutines together and gives back their results **in the order you listed them**.

Three more tools you will use constantly:
| Tool | What it is for |
|---|---|
| \`asyncio.Semaphore(n)\` | allow at most \`n\` tasks inside a section at once: your **rate limit** |
| \`asyncio.timeout(seconds)\` and \`asyncio.wait_for\` | give up on a wait that takes too long |
| \`asyncio.TaskGroup()\` | start tasks together; if one fails, cancel the others and raise all errors together |

\`async with\` and \`async for\` are the async forms of \`with\` and \`for\`; HTTP clients and database drivers use them (\`async with httpx.AsyncClient() as client\`).`,
    { sketch: { w: 760, h: 304, caption: 'The event loop runs one task at a time; a task that awaits steps aside so another can run', items: [
      { t: 'box', x: 14, y: 24, w: 128, h: 52, label: 'task A', sub: 'calls an API', fill: 'blue', size: 16 },
      { t: 'box', x: 14, y: 96, w: 128, h: 52, label: 'task B', sub: 'parses a row', fill: 'blue', size: 16 },
      { t: 'box', x: 14, y: 168, w: 128, h: 52, label: 'task C', sub: 'waits on a timer', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 146, y1: 50, x2: 292, y2: 98 },
      { t: 'text', x: 198, y: 56, text: 'await: pause', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'arrow', x1: 292, y1: 126, x2: 146, y2: 124, dashed: true, label: 'resume', ly: 16 },
      { t: 'box', x: 296, y: 70, w: 190, h: 112, label: 'event loop', sub: 'one thread: runs a task\nuntil its next await', fill: 'yellow' },
      { t: 'arrow', x1: 490, y1: 100, x2: 548, y2: 70 },
      { t: 'arrow', x1: 490, y1: 152, x2: 548, y2: 160 },
      { t: 'note', x: 552, y: 28, w: 194, h: 76, fill: 'green', size: 13, text: 'READY to run:\nB (its data is here)\nThe loop picks it next.' },
      { t: 'note', x: 552, y: 124, w: 194, h: 96, fill: 'grey', size: 13, text: 'WAITING:\nA, for the server reply\nC, for the timer\nWoken when the wait is over.' },
      { t: 'note', x: 14, y: 240, w: 732, h: 52, fill: 'yellow', size: 14, text: 'One chef, many pots: while the rice boils (await), chop the vegetables. Only one thing runs at an instant,\nbut nothing sits idle. Tasks give up control only at an await, so they are never cut off in the middle.' },
    ] } },
    { py: {
      title: 'Your first coroutines: one by one versus gather',
      starter: `import asyncio
import time

RATES = {"USD": 83.21, "SGD": 61.85, "EUR": 90.10, "GBP": 105.40, "AED": 22.65}

async def fetch_rate(currency):
    await asyncio.sleep(0.05)               # pretend to wait for a server (a wait that lets others run)
    return currency, RATES[currency]

coro = fetch_rate("USD")                    # calling an async function runs NOTHING
print("what the call returned:", type(coro).__name__)
coro.close()                                # we never ran it, so close it tidily

async def one_by_one(currencies):
    return [await fetch_rate(c) for c in currencies]          # finish each before starting the next

async def together(currencies):
    return await asyncio.gather(*(fetch_rate(c) for c in currencies))   # start all, wait for all

currencies = list(RATES)

start = time.perf_counter()
print(asyncio.run(one_by_one(currencies)))                    # one event loop, started once
slow = time.perf_counter() - start

start = time.perf_counter()
print(asyncio.run(together(currencies)))                      # results come back in the order listed
fast = time.perf_counter() - start

print("one by one took more than 0.2 s :", slow > 0.2)        # five waits added up
print("gather took less than 0.15 s    :", fast < 0.15)       # the five waits overlapped
print("gather was faster               :", fast < slow)`,
      note: 'Both versions do exactly the same work. The only difference is whether the five waits happen one after another or at the same time. The checks print True or False so the result does not depend on how fast your computer is. A thousand waits instead of five would show the same overlap.',
    } },
    { sketch: { w: 760, h: 292, caption: 'The same four requests: one by one the waits add up, with gather they overlap', items: [
      { t: 'text', x: 14, y: 22, text: 'one by one', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 34, w: 16, h: 26, fill: 'blue' },
      { t: 'box', x: 30, y: 34, w: 164, h: 26, label: 'wait 1', size: 13, fill: 'grey' },
      { t: 'box', x: 194, y: 34, w: 16, h: 26, fill: 'blue' },
      { t: 'box', x: 210, y: 34, w: 164, h: 26, label: 'wait 2', size: 13, fill: 'grey' },
      { t: 'box', x: 374, y: 34, w: 16, h: 26, fill: 'blue' },
      { t: 'box', x: 390, y: 34, w: 164, h: 26, label: 'wait 3', size: 13, fill: 'grey' },
      { t: 'box', x: 554, y: 34, w: 16, h: 26, fill: 'blue' },
      { t: 'box', x: 570, y: 34, w: 164, h: 26, label: 'wait 4', size: 13, fill: 'grey' },
      { t: 'text', x: 14, y: 82, text: 'total time = four waits added up', size: 14, color: '#c0392b', anchor: 'start' },
      { t: 'text', x: 14, y: 116, text: 'asyncio.gather: all four started at once', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 128, w: 16, h: 22, fill: 'blue' },
      { t: 'box', x: 30, y: 128, w: 164, h: 22, label: 'wait 1', size: 13, fill: 'grey' },
      { t: 'box', x: 32, y: 154, w: 16, h: 22, fill: 'blue' },
      { t: 'box', x: 48, y: 154, w: 164, h: 22, label: 'wait 2', size: 13, fill: 'grey' },
      { t: 'box', x: 50, y: 180, w: 16, h: 22, fill: 'blue' },
      { t: 'box', x: 66, y: 180, w: 164, h: 22, label: 'wait 3', size: 13, fill: 'grey' },
      { t: 'box', x: 68, y: 206, w: 16, h: 22, fill: 'blue' },
      { t: 'box', x: 84, y: 206, w: 164, h: 22, label: 'wait 4', size: 13, fill: 'grey' },
      { t: 'text', x: 14, y: 250, text: 'total time = about ONE wait', size: 14, color: '#1e8449', anchor: 'start' },
      { t: 'note', x: 300, y: 128, w: 446, h: 100, fill: 'yellow', size: 13, text: 'Each request pauses at its await and gives control back,\nso the next request can start straight away. The waits overlap.\nThe blue CPU work (parsing the reply) is tiny. If it were long,\nasync would not help: that is CPU-bound work.' },
    ] } },
    `## Limits, errors and time-outs
Starting everything at once is not always allowed. A real API may accept only five requests at a time, and one failing call must not hide the others.

- **Cap the concurrency with a Semaphore.** Wrap each call in \`async with semaphore:\`. With \`Semaphore(5)\` the sixth task waits at the \`async with\` until one of the first five finishes.
- **\`gather(..., return_exceptions=True)\`** returns the exceptions **as results** instead of raising the first one, so you can sort the successes from the failures yourself. Without it, the first exception reaches you at once and the other tasks keep running in the background, which is rarely what you want.
- **\`TaskGroup\`** (Python 3.11+) is the safer way to run a set of tasks: if one fails, the others are **cancelled**, and every failure is raised together as an \`ExceptionGroup\` that you catch with \`except*\` (you met this in the Errors lesson).
- **Time-outs.** \`async with asyncio.timeout(seconds):\` cancels the wait when time runs out and raises \`TimeoutError\`. **Always** put a time-out on network calls. A call without one can hang for ever and block the job.
- **Cancellation** is how a task is stopped: Python raises \`CancelledError\` inside it at its current \`await\`. Let it propagate, and use \`try/finally\` for clean-up.`,
    { py: {
      title: 'A semaphore, errors collected by gather, a time-out and a TaskGroup',
      starter: `import asyncio

active = {"now": 0, "max": 0}

async def fake_api(i):
    active["now"] += 1
    active["max"] = max(active["max"], active["now"])
    try:
        await asyncio.sleep(0.02)
        if i == 3:
            raise ValueError(f"item {i} has bad data")
        return i * 10
    finally:
        active["now"] -= 1                    # runs even when the call fails or is cancelled

async def limited(i, semaphore):
    async with semaphore:                     # at most 3 tasks inside this block at the same time
        return await fake_api(i)

async def main():
    # 1. eight calls, at most three at once, and the failure does not hide the others
    semaphore = asyncio.Semaphore(3)
    results = await asyncio.gather(*(limited(i, semaphore) for i in range(8)), return_exceptions=True)
    for i, r in enumerate(results):
        print(f"  item {i}:", f"ERROR {r}" if isinstance(r, Exception) else r)
    print("most calls running at once:", active["max"])

    # 2. a time-out on a slow call
    try:
        async with asyncio.timeout(0.05):
            await asyncio.sleep(1)            # far too slow
    except TimeoutError:
        print("time-out: the slow call was cancelled after 0.05 s")

    # 3. a TaskGroup: one failure cancels the others and all errors arrive together
    try:
        async with asyncio.TaskGroup() as group:
            group.create_task(fake_api(1))
            group.create_task(fake_api(3))        # this one fails
            group.create_task(fake_api(2))
    except* ValueError as errors:
        print("TaskGroup raised:", [str(e) for e in errors.exceptions])

    # 4. create_task starts work in the background; await it later
    task = asyncio.create_task(fake_api(5))
    print("task created, not finished yet:", not task.done())
    print("result when awaited:", await task)

asyncio.run(main())`,
      note: 'Item 3 fails but items 0, 1, 2, 4, 5, 6 and 7 still return their results, because of return_exceptions=True. The semaphore keeps the number of calls running at once at three. In the TaskGroup the failing task stops its two neighbours and the error comes out as a group, which except* unpacks.',
    } },
    `## What blocks the loop, and what to do about it
Async has one big rule: **never block the event loop**. The loop runs everything on one thread. If a task does something slow **without** an \`await\` (\`time.sleep(1)\`, a \`requests.get(...)\`, a big CPU loop, a pandas read of a huge file), the loop is stuck: **every other task freezes** until it finishes. That turns your fast async program into a slow one, with no error message to explain it.

How to stay safe:
- Use **async libraries** for I/O: \`httpx.AsyncClient\` or \`aiohttp\` for HTTP, async database drivers (\`asyncpg\`, \`psycopg\` async mode), \`await asyncio.sleep\`, not \`time.sleep\`.
- If you must call a **blocking** function, hand it to a thread: \`result = await asyncio.to_thread(blocking_function, arg)\`. The loop stays free while the thread waits.
- For **CPU-heavy** work, async does not help at all. Use a process pool (\`loop.run_in_executor\` with a \`ProcessPoolExecutor\`) or a better algorithm, as in the last lesson.
- Async is **contagious**: a function that awaits must itself be \`async def\`, and so must its callers, up to \`asyncio.run\`. Mixing sync and async code needs care, so decide the style of a program early.`,
    { sketch: { w: 760, h: 272, caption: 'A blocking call inside async code freezes every task, not just its own', items: [
      { t: 'text', x: 14, y: 22, text: 'await asyncio.sleep(0.2): the other task keeps running', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 66, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 118, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 170, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 222, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 274, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 326, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 378, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 430, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 482, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 534, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 586, y: 34, w: 28, h: 24, fill: 'green' },
      { t: 'text', x: 640, y: 52, text: 'heartbeat ticks', size: 13, color: '#5c6478', anchor: 'start' },
      { t: 'text', x: 14, y: 100, text: 'a blocking call (time.sleep, requests, a long loop): the whole loop is frozen', size: 15, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 112, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 66, y: 112, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 118, y: 112, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 170, y: 112, w: 318, h: 24, label: 'blocked: no task can run', size: 13, fill: 'pink' },
      { t: 'box', x: 492, y: 112, w: 28, h: 24, fill: 'green' },
      { t: 'box', x: 544, y: 112, w: 28, h: 24, fill: 'green' },
      { t: 'note', x: 14, y: 168, w: 732, h: 90, fill: 'yellow', size: 14, text: 'A blocking call (time.sleep, requests.get, a long loop) stops EVERY task until it returns.\nFix: use an async library and await it, or run the blocking function in a thread:\nresult = await asyncio.to_thread(blocking_function, argument)' },
    ] } },
    { py: {
      title: 'Prove it: a heartbeat task goes quiet when another task blocks the loop',
      starter: `import asyncio
import time

def busy(seconds):
    """A stand-in for a long calculation or a blocking library call: it never awaits."""
    end = time.perf_counter() + seconds
    while time.perf_counter() < end:
        pass

async def heartbeat(ticks, stop):
    while not stop.is_set():
        ticks.append(time.perf_counter())
        await asyncio.sleep(0.02)                 # a tick every 0.02 s, as long as the loop is free

async def run(blocking):
    ticks, stop = [], asyncio.Event()
    beat = asyncio.create_task(heartbeat(ticks, stop))
    await asyncio.sleep(0.05)                     # let the heartbeat get going
    if blocking:
        busy(0.2)                                 # BLOCKS the event loop: nobody else can run
    else:
        await asyncio.sleep(0.2)                  # hands control back: the heartbeat keeps ticking
    await asyncio.sleep(0.05)
    stop.set()
    await beat
    gaps = [b - a for a, b in zip(ticks, ticks[1:])]
    return len(ticks), max(gaps)

free_ticks, free_gap = asyncio.run(run(blocking=False))
stuck_ticks, stuck_gap = asyncio.run(run(blocking=True))
print("with await asyncio.sleep : longest silence over 0.15 s?", free_gap > 0.15)
print("with a blocking call     : longest silence over 0.15 s?", stuck_gap > 0.15)
print("the blocked loop managed fewer ticks:", stuck_ticks < free_ticks)`,
      note: 'The only difference between the two runs is whether the 0.2 s is spent with await (the loop is free) or inside a call that never awaits (the loop is stuck). In a real program the "heartbeat" could be hundreds of other API calls, all waiting because one task blocked. The playground uses a busy loop as the blocking call, because the browser treats time.sleep specially and lets other tasks run. On your laptop time.sleep(0.2) blocks the loop exactly like this busy loop.',
    } },
    `## An event loop in twenty lines
It helps to see that there is no magic. A generator can pause at \`yield\` and be resumed later, which is exactly what a coroutine does at \`await\`. This toy loop runs generators as tasks. A task \`yield\`s the number of seconds it wants to wait. The loop keeps a heap of "wake-up time, task", always runs the task that wakes first, and **jumps a virtual clock** forward instead of really waiting. The real \`asyncio\` is this idea plus real clocks and the operating system's "this socket is ready" signals.`,
    { py: {
      title: 'A toy event loop built from generators, with a virtual clock',
      starter: `import heapq

clock = {"now": 0.0}                          # virtual time: nothing really waits

def task(name, steps, delay):
    for step in range(1, steps + 1):
        print(f"t={clock['now']:.1f}  {name}: step {step}, now waiting {delay} s")
        yield delay                           # like "await sleep(delay)": pause and ask to be woken later
    print(f"t={clock['now']:.1f}  {name}: finished")

def run(tasks):
    ready = [(0.0, i, t) for i, t in enumerate(tasks)]      # (wake-up time, tie-breaker, the paused task)
    heapq.heapify(ready)
    while ready:
        wake_at, i, t = heapq.heappop(ready)                # the task that wakes first
        clock["now"] = wake_at                              # jump the clock: no real waiting
        try:
            delay = next(t)                                 # run it until its next yield (its next await)
        except StopIteration:
            continue                                        # this task is finished
        heapq.heappush(ready, (wake_at + delay, i, t))      # put it back, due after its delay

run([task("A", steps=2, delay=1.0), task("B", steps=3, delay=0.5)])
print("total virtual time:", clock["now"], "s, not", 2 * 1.0 + 3 * 0.5, "s")`,
      note: 'Read the output top to bottom: A and B take turns. At t=0.5 task B takes a step while A is still waiting. The total virtual time is 2.0 seconds, the length of the longest task (A), not the 3.5 seconds you get by adding every wait together. That is gather in miniature.',
    } },
    { local: `**Real HTTP calls on your laptop.** The packages \`httpx\` and the standard library are enough. First a slow local "API" (so you can test without the internet). Save as \`slow_api.py\` in \`C:\\fde\\py-recap\` and keep it running in one PowerShell window with \`python slow_api.py\`:
\`\`\`python
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RATES = {"USD": 83.21, "SGD": 61.85, "EUR": 90.10, "GBP": 105.40, "AED": 22.65}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        time.sleep(0.5)                                  # pretend the API is slow
        currency = self.path.rsplit("/", 1)[-1]
        if currency not in RATES:
            self.send_response(404)
            self.end_headers()
            return
        body = json.dumps({"currency": currency, "rate": RATES[currency]}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass                                             # keep the console quiet


if __name__ == "__main__":
    print("serving on http://127.0.0.1:8765  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", 8765), Handler).serve_forever()
\`\`\`
In a second window: \`pip install httpx\`, then save and run \`async_client.py\`:
\`\`\`python
import asyncio
import time

import httpx

BASE = "http://127.0.0.1:8765/rates/"


async def fetch_rate(client, currency):
    response = await client.get(BASE + currency, timeout=10)    # always set a timeout
    response.raise_for_status()                                 # 404 or 500 becomes an exception
    return response.json()


async def one_by_one(currencies):
    async with httpx.AsyncClient() as client:
        return [await fetch_rate(client, c) for c in currencies]


async def together(currencies, max_at_once=5):
    limit = asyncio.Semaphore(max_at_once)               # a cap, so we never flood the API

    async def one(currency):
        async with limit:
            return await fetch_rate(client, currency)

    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*(one(c) for c in currencies), return_exceptions=True)


if __name__ == "__main__":
    currencies = ["USD", "SGD", "EUR", "GBP", "AED", "XXX"]
    start = time.perf_counter()
    asyncio.run(one_by_one(currencies[:5]))
    print(f"one by one : {time.perf_counter() - start:.2f} s for 5 calls")

    start = time.perf_counter()
    results = asyncio.run(together(currencies))
    print(f"gather     : {time.perf_counter() - start:.2f} s for 6 calls")
    for r in results:
        print("  ", r if not isinstance(r, Exception) else f"error: {type(r).__name__}")
\`\`\`
Output to expect (a Windows laptop with Python 3.12 and httpx 0.28; yours will differ a little):
\`\`\`text
one by one : 2.90 s for 5 calls
gather     : 1.55 s for 6 calls
   {'currency': 'USD', 'rate': 83.21}
   {'currency': 'SGD', 'rate': 61.85}
   {'currency': 'EUR', 'rate': 90.1}
   {'currency': 'GBP', 'rate': 105.4}
   {'currency': 'AED', 'rate': 22.65}
   error: HTTPStatusError
\`\`\`
Read it: five calls of 0.5 s one by one take 2.5 s plus start-up cost. Six calls with a limit of five need **two waves** (5 together, then 1), so about 1 s of waiting plus the same start-up cost. The unknown currency XXX returned 404, and \`return_exceptions=True\` delivered it as an error result without hiding the other five. Change \`max_at_once\` to 6 and to 1 and watch the time change.` },
    { warn: `Things that go wrong with asyncio:
- **Forgetting \`await\`.** \`fetch_rate("USD")\` without \`await\` gives you a coroutine object, nothing runs, and Python prints "coroutine ... was never awaited". It is the most common async bug.
- **Blocking calls inside \`async def\`** (\`time.sleep\`, \`requests\`, heavy loops). The whole program stalls. Use async libraries or \`asyncio.to_thread\`.
- **\`asyncio.run\` inside a running loop.** Call it once at the top. In Jupyter or an async framework you already have a loop, so use \`await\` instead.
- **No limit.** \`gather\` over 10,000 items starts 10,000 requests together and gets you blocked. Use a \`Semaphore\` and respect the provider's rate limit.
- **No time-out.** A network call without \`timeout\` can wait for ever. Set a time-out on every call.
- **Lost background tasks.** A task from \`create_task\` that nobody keeps a reference to or awaits can be garbage-collected, and its exception is only reported at the end. Keep the task, or use a \`TaskGroup\`.
- **Using async for CPU-bound work.** It gives no speed-up. Use processes or a faster library.
- **Mixing styles without thought.** One \`async def\` pulls its callers into async too. Decide early, and keep the async part at the edges (I/O).` },
    { pychallenge: {
      id: 'python-asyncio-ch1',
      prompt: 'Write the coroutine `fetch_all(items, fetch, limit)`. `fetch` is an `async` function taking one item. Run `fetch(item)` for **all** items concurrently, but with **at most `limit`** running at the same moment (use `asyncio.Semaphore`). Return the results as a list in the **same order as `items`**, whatever order they finish in. Raise `ValueError` if `limit` is less than 1. An empty list gives an empty list.',
      starter: `import asyncio

async def fetch_all(items, fetch, limit):
    # TODO: validate limit, make a Semaphore, wrap fetch(item) in "async with semaphore", gather the results
    return []
`,
      tests: `import asyncio

state = {"now": 0, "max": 0, "started": []}

async def fetch(item):
    state["started"].append(item)
    state["now"] += 1
    state["max"] = max(state["max"], state["now"])
    await asyncio.sleep(0.01 * (item % 3 + 1))
    state["now"] -= 1
    return item * 2

results = asyncio.run(fetch_all(list(range(10)), fetch, limit=3))
assert results == [i * 2 for i in range(10)], results
assert 1 < state["max"] <= 3, state["max"]
assert sorted(state["started"]) == list(range(10))

state.update(now=0, max=0, started=[])
assert asyncio.run(fetch_all([1, 2, 3], fetch, limit=1)) == [2, 4, 6]
assert state["max"] == 1
assert asyncio.run(fetch_all([], fetch, limit=2)) == []
try:
    asyncio.run(fetch_all([1], fetch, limit=0))
    raise AssertionError("expected ValueError")
except ValueError:
    pass`,
      solution: `import asyncio

async def fetch_all(items, fetch, limit):
    if limit < 1:
        raise ValueError("limit must be at least 1")
    semaphore = asyncio.Semaphore(limit)

    async def one(item):
        async with semaphore:
            return await fetch(item)

    return await asyncio.gather(*(one(item) for item in items))
`,
      hint: 'Check `limit` first and raise `ValueError`. Create `semaphore = asyncio.Semaphore(limit)`. Define an inner `async def one(item)` that does `async with semaphore: return await fetch(item)`. Finish with `return await asyncio.gather(*(one(item) for item in items))`: gather returns results in input order.',
    } },
    { pychallenge: {
      id: 'python-asyncio-ch2',
      prompt: 'Write the coroutine `retry_async(func, attempts, base, retryable, sleep=asyncio.sleep)`. `func` is an async function without arguments. Await it; if it raises one of the exceptions in the tuple `retryable`, wait `base * 2 ** (k - 1)` seconds after failed attempt number `k` with `await sleep(seconds)` and try again. After the last attempt re-raise the error without waiting. Other exceptions are raised at once. Return the result on success.',
      starter: `import asyncio

async def retry_async(func, attempts, base, retryable, sleep=asyncio.sleep):
    # TODO: loop over attempts, await func(), catch only retryable errors, await sleep(...) between attempts
    return await func()
`,
      tests: `import asyncio

class Busy(Exception):
    pass

class Bad(Exception):
    pass

def make(failures, error=Busy):
    state = {"calls": 0}
    async def func():
        state["calls"] += 1
        if state["calls"] <= failures:
            raise error("x")
        return "ok"
    func.state = state
    return func

waits = []
async def fake_sleep(seconds):
    waits.append(seconds)

f = make(3)
assert asyncio.run(retry_async(f, 5, 1, (Busy,), sleep=fake_sleep)) == "ok"
assert waits == [1, 2, 4], waits
assert f.state["calls"] == 4

waits.clear()
f = make(99)
try:
    asyncio.run(retry_async(f, 3, 2, (Busy,), sleep=fake_sleep))
    raise AssertionError("expected Busy")
except Busy:
    pass
assert waits == [2, 4], waits
assert f.state["calls"] == 3

waits.clear()
f = make(99, error=Bad)
try:
    asyncio.run(retry_async(f, 5, 1, (Busy,), sleep=fake_sleep))
    raise AssertionError("expected Bad")
except Bad:
    pass
assert waits == [] and f.state["calls"] == 1

f = make(0)
assert asyncio.run(retry_async(f, 1, 1, (Busy,))) == "ok"`,
      solution: `import asyncio

async def retry_async(func, attempts, base, retryable, sleep=asyncio.sleep):
    for attempt in range(1, attempts + 1):
        try:
            return await func()
        except retryable:
            if attempt == attempts:
                raise
            await sleep(base * 2 ** (attempt - 1))
`,
      hint: 'It is the same loop as the retry in the Errors lesson, with `await`: `for attempt in range(1, attempts + 1):` then `try: return await func()` and `except retryable:`. On the last attempt do a bare `raise`; otherwise `await sleep(base * 2 ** (attempt - 1))`.',
    } },
    { pychallenge: {
      id: 'python-asyncio-ch3',
      prompt: 'Write the coroutine `run_workers(items, n_workers, handler)` with an `asyncio.Queue`. Put every `(index, item)` in a queue. Start `n_workers` worker coroutines that keep taking an entry from the queue and awaiting `handler(item)` until the queue is empty. Return the list of handler results in the **original order of `items`**. At most `n_workers` handlers may run at the same time. An empty `items` returns `[]`.',
      starter: `import asyncio

async def run_workers(items, n_workers, handler):
    # TODO: fill a Queue with (index, item), start n_workers workers, collect results by index
    return []
`,
      tests: `import asyncio

state = {"now": 0, "max": 0, "handled": []}

async def handler(item):
    state["now"] += 1
    state["max"] = max(state["max"], state["now"])
    await asyncio.sleep(0.005 * (item % 4 + 1))
    state["now"] -= 1
    state["handled"].append(item)
    return item + 100

results = asyncio.run(run_workers(list(range(12)), 3, handler))
assert results == [i + 100 for i in range(12)], results
assert sorted(state["handled"]) == list(range(12))
assert 1 < state["max"] <= 3, state["max"]

state.update(now=0, max=0, handled=[])
assert asyncio.run(run_workers([5, 6, 7], 1, handler)) == [105, 106, 107]
assert state["max"] == 1
assert asyncio.run(run_workers([], 4, handler)) == []
assert asyncio.run(run_workers([9], 5, handler)) == [109]`,
      solution: `import asyncio

async def run_workers(items, n_workers, handler):
    queue = asyncio.Queue()
    for index, item in enumerate(items):
        queue.put_nowait((index, item))
    results = [None] * len(items)

    async def worker():
        while True:
            try:
                index, item = queue.get_nowait()
            except asyncio.QueueEmpty:
                return
            results[index] = await handler(item)

    await asyncio.gather(*(worker() for _ in range(n_workers)))
    return results
`,
      hint: 'Fill the queue with `queue.put_nowait((index, item))`. Prepare `results = [None] * len(items)`. Each worker loops: `index, item = queue.get_nowait()` (return when `asyncio.QueueEmpty` is raised), then `results[index] = await handler(item)`. Run the workers with `await asyncio.gather(*(worker() for _ in range(n_workers)))` and return `results`.',
    } },
    { real: 'You will use asyncio in two places. First, as a **client**: fetching many pages, GST or bank API calls, or LLM requests (later in the course) with a semaphore, a time-out and a retry, so a job of thousands of calls finishes while staying inside the provider\'s limits. Second, as a **server**: FastAPI endpoints written with `async def` handle many requests with one process, as long as nothing inside them blocks. The "FastAPI works but is slow under load" problem is very often a blocking call (a sync database driver, `requests`, `time.sleep`, a big pandas step) inside an `async def` endpoint.' },
    { interview: `**"Explain how asyncio works."**
Model answer: "asyncio runs many tasks on one thread with an event loop. A coroutine runs until it reaches an \`await\` on something that has to wait, such as network I/O. Then it gives control back to the loop, which runs another ready task, and resumes the first one when its wait is over. It is cooperative: tasks switch only at awaits. It works well for many I/O waits and does nothing for CPU-bound work."

**"asyncio or threads?"** "For a few dozen waits, a thread pool is simple and works with any library. For thousands of connections, asyncio uses less memory and has fewer race conditions, but needs async-aware libraries and spreads \`async\` through the code. For CPU-bound work, neither: I use processes or a faster library."

**"What happens if you call \`time.sleep\` or \`requests.get\` in an async function?"** "It blocks the event loop, so every task stops until the call returns. I use \`await asyncio.sleep\`, an async client such as httpx, or \`await asyncio.to_thread(...)\` to move a blocking call to a thread."

**"How do you limit concurrency and handle failures in a batch of async calls?"** "A \`Semaphore\` limits how many run at once. I add a time-out and a retry with backoff on each call, and I use \`gather(..., return_exceptions=True)\` or a \`TaskGroup\` so that one failure is handled on purpose instead of hiding the others."` },
    `## Recap
- **asyncio** runs many tasks on **one thread**. A task runs until an \`await\`, then the **event loop** runs another ready task. It is cooperative, so it suits **many I/O waits**, not CPU work.
- Calling \`async def\` returns a **coroutine** and runs nothing. \`await\` runs it. \`asyncio.run(main())\` starts the loop once. \`gather\` runs coroutines together and returns results in input order; \`create_task\` starts background work; \`TaskGroup\` cancels the rest when one fails.
- Control the load: **\`Semaphore\`** for a rate limit, **\`asyncio.timeout\`** on every network call, \`return_exceptions=True\` or \`except*\` to handle errors on purpose, retry with backoff.
- **Never block the loop** (\`time.sleep\`, \`requests\`, long loops). Use async libraries or \`asyncio.to_thread\`. Forgetting \`await\` is the classic bug.
- A toy loop is just generators plus a clock: tasks yield how long to sleep, the loop always runs the task that wakes first.`,
  ],
  quiz: [
    { q: 'What does calling `fetch_rate("USD")` return when `fetch_rate` is defined with `async def`?', o: ['the exchange rate', 'None', 'a coroutine object that has not run yet', 'a thread'], a: 2, why: 'Calling an async function only creates a coroutine. Nothing runs until you `await` it or hand it to the event loop (`asyncio.run`, `gather`, `create_task`).' },
    { q: 'Inside an `async def` function you write `time.sleep(2)`. What is the effect?', o: ['it blocks the event loop, so every task stops for two seconds', 'only that task waits, the others keep running', 'Python raises an error', 'it is converted to `asyncio.sleep` automatically'], a: 0, why: 'The loop is single-threaded. A blocking call without `await` never gives control back, so all other tasks freeze. Use `await asyncio.sleep(2)`.' },
    { q: 'In what order does `await asyncio.gather(a(), b(), c())` return its results?', o: ['the order in which they finished', 'alphabetical order', 'random order', 'the order in which they were listed, whatever order they finished in'], a: 3, why: 'gather preserves the order of the arguments, which makes it easy to match results to inputs.' },
    { q: 'You must call an API 5,000 times, and it allows five requests at once. Which tool enforces that?', o: ['`asyncio.Semaphore(5)` around each call', '`asyncio.run` five times', '`time.sleep(5)` after each call', 'a bigger `max_workers`'], a: 0, why: 'A semaphore allows at most N tasks inside its block at the same time. The other tasks wait their turn.' },
    { q: 'For which job does asyncio give NO speed-up?', o: ['calling 1,000 web APIs', 'waiting for 1,000 database replies', 'a loop that computes a heavy formula for a million rows in pure Python', 'downloading 100 files'], a: 2, why: 'asyncio only overlaps waiting. A CPU-bound loop keeps the one thread busy, so tasks cannot overlap. Use processes or vectorised code.' },
    { q: 'What happens to the other tasks in an `asyncio.TaskGroup` when one task raises an exception?', o: ['they keep running and the error is ignored', 'they are cancelled, and the errors are raised together as an ExceptionGroup', 'the program ends silently', 'they are restarted'], a: 1, why: 'TaskGroup gives structured concurrency: a failure cancels the siblings and all errors surface together, which you handle with `except*`.' },
  ],
  task: {
    title: 'An async rate fetcher with a limit, timeouts and retries',
    steps: [
      'In `C:\\fde\\py-recap` save `slow_api.py` and `async_client.py` from the "Real HTTP calls" box. Start the server in one PowerShell window and run the client in another. Write the two timings and one sentence about why gather took longer than one wait.',
      'Change `max_at_once` to 1, 3 and 6 and note the timings. Explain the three numbers in a comment (waves of requests).',
      'Add `httpx.Timeout(0.2)` to the client so every call times out (the server takes 0.5 s). Catch `httpx.TimeoutException` per call and print which currencies timed out.',
      'Write `retry_async` (challenge 2) and use it around `fetch_rate` for `httpx.TimeoutException` with `sleep=asyncio.sleep`. Make the server fast for the first two calls per currency by editing `slow_api.py` (keep a counter dict) to see the retry succeed.',
      'Write `run_workers` (challenge 3) and process all five currencies with 2 workers. Print the worker order to show that at most two calls run at once.',
      'Add one blocking `time.sleep(1)` inside a coroutine on purpose and watch every other call stall. Remove it and write down in a comment how you would have found it.',
    ],
    deliverable: '`async_client.py` with timing comments for limits 1, 3 and 6, time-out handling, the retry wrapper and the worker run.',
  },
};
