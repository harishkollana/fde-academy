export default {
  id: 'python-concurrency',
  title: 'Threads, processes and the GIL',
  goal: 'You can tell I/O-bound work from CPU-bound work, explain the GIL, choose between threads and processes, use concurrent.futures safely (including the Windows main-guard), and avoid shared-state race conditions.',
  roadmap: ['threading', 'multiprocessing', 'concurrent.futures', 'I/O-bound vs CPU-bound', 'the GIL'],
  blocks: [
    `## The problem
Your month-end job checks 200 suppliers against a government API. Each call takes a second to answer, and your script makes them one after another. Most of that second you are not doing anything: your program sends a request and **waits** for the network. Two hundred waits in a row is a long job, and the laptop is almost idle the whole time.

A different job parses 40 big files. Here the laptop is busy all the time, one core at 100 percent, while the other cores do nothing.

Both jobs are "slow", but the cure is **different**. This is the most important idea in this lesson:
- **I/O-bound** work spends its time **waiting** (network, disk, database). Waiting can overlap: while one request waits, send another. The tools are **threads** and **asyncio**.
- **CPU-bound** work spends its time **computing**. Computing cannot overlap on one core. You need **more cores working at the same time**, which means **processes**, or a library that does the heavy work in fast native code (pandas, numpy, the database).

First you measure which kind you have. Guessing wrong makes the program **slower and more complicated**.

**Where this runs.** Threads and processes cannot start in the browser, so the runnable parts of this lesson are *simulations* that let you see the ideas on a page. The real code is shown in code blocks and in "Do this on your laptop" boxes, with the output from a real run. The numbers on your machine will differ, but the pattern will not.`,
    { sketch: { w: 760, h: 298, caption: 'Two kinds of slow: waiting hides well, computing does not', items: [
      { t: 'text', x: 14, y: 22, text: 'I/O-bound: call a vendor API', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 34, w: 56, h: 38, label: 'send', size: 14, fill: 'blue' },
      { t: 'box', x: 74, y: 34, w: 380, h: 38, label: 'WAIT for the server (CPU idle)', size: 14, fill: 'grey' },
      { t: 'box', x: 458, y: 34, w: 84, h: 38, label: 'use reply', size: 14, fill: 'blue' },
      { t: 'note', x: 560, y: 28, w: 186, h: 52, fill: 'yellow', size: 13, text: 'Mostly waiting: let other\nwork run in the meantime.' },
      { t: 'text', x: 14, y: 112, text: 'CPU-bound: parse a huge file', size: 16, bold: true, anchor: 'start' },
      { t: 'box', x: 14, y: 124, w: 528, h: 38, label: 'computing the whole time (one core at 100 percent)', size: 14, fill: 'green' },
      { t: 'note', x: 560, y: 118, w: 186, h: 52, fill: 'pink', size: 13, text: 'Nothing to hide: you need\nmore cores, not more waiters.' },
      { t: 'text', x: 380, y: 200, text: 'the cure is different', size: 15, color: '#5c6478', anchor: 'middle' },
      { t: 'box', x: 14, y: 214, w: 350, h: 66, label: 'threads or asyncio', sub: 'many waits overlap in one process', fill: 'blue', size: 17 },
      { t: 'box', x: 396, y: 214, w: 350, h: 66, label: 'processes (or pandas, numpy, SQL)', sub: 'real parallel computing on several cores', fill: 'green', size: 17 },
    ] } },
    `## The GIL, in plain words
Python (the standard version, called CPython) has a rule called the **GIL**, the *Global Interpreter Lock*. It says: **only one thread may run Python code at any moment**, even on a computer with 16 cores. The reason is historical: it keeps the interpreter's memory handling simple and fast for ordinary programs.

What follows from this rule:
- **Threads help with I/O-bound work.** When a thread waits for the network or the disk, it **lets go** of the lock, and another thread can run. Waits overlap, so 20 calls that each wait 0.2 seconds can finish in about the time of two.
- **Threads do not speed up CPU-bound pure-Python work.** The threads take turns holding the lock; the total computing time stays the same (and the switching adds a little).
- **Processes have no shared lock.** Each process is a separate Python with its **own interpreter and its own GIL**, so several processes really do compute at the same time on different cores. The price: starting a process takes time, every process uses its own memory, and data must be **copied between processes** (the name for that is *pickling*), so only send things that can be pickled and keep them small.
- Libraries such as numpy and pandas run their heavy loops in native code and often release the lock, which is why "use pandas instead of a Python loop" is usually the first and best CPU fix.

Recent Python versions (3.13 and later) also offer an optional "free-threaded" build without the GIL. It is new and not the default, so check the current documentation before relying on it; everything in this lesson describes the normal build.`,
    { sketch: { w: 760, h: 306, caption: 'With the GIL only one thread runs Python at a time, but their waits overlap. Processes run side by side', items: [
      { t: 'text', x: 190, y: 22, text: 'threads: one lock (GIL)', size: 16, bold: true, anchor: 'middle' },
      { t: 'text', x: 570, y: 22, text: 'processes: one GIL each', size: 16, bold: true, anchor: 'middle' },
      { t: 'text', x: 14, y: 62, text: 'thread A', size: 13, anchor: 'start' },
      { t: 'box', x: 76, y: 44, w: 52, h: 28, label: 'run', size: 13, fill: 'blue' },
      { t: 'box', x: 130, y: 44, w: 130, h: 28, label: 'waiting', size: 13, fill: 'grey' },
      { t: 'box', x: 262, y: 44, w: 52, h: 28, label: 'run', size: 13, fill: 'blue' },
      { t: 'text', x: 14, y: 102, text: 'thread B', size: 13, anchor: 'start' },
      { t: 'box', x: 76, y: 84, w: 52, h: 28, label: 'wait', size: 13, fill: 'grey' },
      { t: 'box', x: 130, y: 84, w: 52, h: 28, label: 'run', size: 13, fill: 'blue' },
      { t: 'box', x: 184, y: 84, w: 130, h: 28, label: 'waiting', size: 13, fill: 'grey' },
      { t: 'note', x: 14, y: 132, w: 346, h: 74, fill: 'yellow', size: 13, text: 'Only ONE blue "run" at any moment.\nThe grey waits overlap, so threads speed up\nwaiting work, not computing.' },
      { t: 'line', x1: 380, y1: 20, x2: 380, y2: 216, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 396, y: 62, text: 'proc 1', size: 13, anchor: 'start' },
      { t: 'box', x: 452, y: 44, w: 292, h: 28, label: 'run (its own interpreter, core 1)', size: 13, fill: 'green' },
      { t: 'text', x: 396, y: 102, text: 'proc 2', size: 13, anchor: 'start' },
      { t: 'box', x: 452, y: 84, w: 292, h: 28, label: 'run (its own interpreter, core 2)', size: 13, fill: 'green' },
      { t: 'note', x: 396, y: 132, w: 350, h: 74, fill: 'green', size: 13, text: 'The runs overlap in time: real parallel computing.\nCost: process start-up, extra memory, and data\ncopied between processes (pickled).' },
      { t: 'note', x: 14, y: 232, w: 732, h: 60, fill: 'grey', size: 14, text: 'I/O-bound work: threads or asyncio.   CPU-bound pure Python: processes.\nA numpy or pandas call is already fast native code: try that before any parallel code.' },
    ] } },
    { py: {
      title: 'A model of the speed-up: threads, the GIL and processes (a simulation, not a measurement)',
      starter: `import heapq

def makespan(durations, workers):
    """Greedy schedule: every task goes to the worker that becomes free first. Returns the finish time."""
    free_at = [0.0] * workers
    heapq.heapify(free_at)
    for d in durations:
        start = heapq.heappop(free_at)             # the earliest free worker
        heapq.heappush(free_at, start + d)
    return max(free_at)

def model(tasks, workers, process_startup=0.5, process_overhead=0.005):
    """tasks = [(cpu_seconds, wait_seconds), ...]. Returns the modelled finish time of each approach."""
    totals = [cpu + wait for cpu, wait in tasks]
    sequential = sum(totals)
    # threads: the waits overlap, but all the CPU parts must take turns (GIL)
    threads = max(makespan(totals, workers), sum(cpu for cpu, _ in tasks))
    # processes: no shared lock, but start-up and copying cost time
    processes = process_startup + makespan([t + process_overhead for t in totals], workers)
    return sequential, threads, processes

workloads = {
    "20 API calls (wait 1.0 s, compute 0.01 s)": [(0.01, 1.0)] * 20,
    "20 big files (compute 1.0 s, no waiting)":   [(1.0, 0.0)] * 20,
    "1000 tiny jobs (compute 0.001 s)":           [(0.001, 0.0)] * 1000,
}
print(f"{'workload (8 workers)':<44}{'sequential':>11}{'threads':>9}{'processes':>11}")
for name, tasks in workloads.items():
    seq, thr, proc = model(tasks, workers=8)
    print(f"{name:<44}{seq:>10.1f}s{thr:>8.1f}s{proc:>10.1f}s   speed-up: threads x{seq / thr:.1f}, processes x{seq / proc:.1f}")`,
      note: 'These are modelled seconds from assumptions written in the code, not measurements. The pattern is the lesson. API calls: threads and processes both win. Big files: threads gain nothing (the GIL), processes win. Tiny jobs: processes are slower than doing nothing clever, because start-up and copying cost more than they save. The greedy "next free worker" rule is the same idea a real pool uses.',
    } },
    `## Threads, and the race condition
A **thread** is a second line of execution inside the same program. Threads **share memory**, which is convenient and dangerous. The danger is a **race condition**: two threads read and change the same variable, and the result depends on who is faster.

Take \`counter += 1\`. It looks like one step, but it is **three**: read the value, add one, write it back. If thread A reads 5, then thread B reads 5, then both write 6, one increment is lost. The usual cures:
- **Do not share.** Give each thread its own data and **return** a result; combine the results afterwards. This is by far the best option.
- **Use a \`queue.Queue\`** to hand work and results between threads; it is already safe.
- **Use a \`threading.Lock\`** around the shared change (\`with lock: counter += 1\`). Locks work but are easy to get wrong, and two locks used in the wrong order can **deadlock** (both threads wait for each other for ever).

One honest warning. On a normal current Python, a quick test of \`counter += 1\` with four threads often gives the **right** answer (we ran 4 threads of 1,000,000 increments and the total was exactly right). That does **not** make the code safe. The language does not promise it, other versions and other operations (\`d[key] += 1\`, a read-then-write on a file or a database row) can lose updates, and a bug that "usually works" is the worst kind. Treat any shared change as unsafe until you protect it. The simulation below shows the failure that the rules allow.`,
    { py: {
      title: 'A race condition made visible: simulated threads that can be switched at any step',
      starter: `import dis
import random

counter = 0

def bump():
    global counter
    counter += 1

dis.dis(bump)               # several bytecode instructions: load, add, store. Not one atomic step.

def worker(shared, times, locked):
    """One simulated thread. Every yield is a point where the scheduler may switch to the other thread."""
    for _ in range(times):
        if locked:
            shared["n"] += 1            # a lock makes read-add-write ONE indivisible step
            yield
        else:
            tmp = shared["n"]           # 1. read
            yield                       #    <- another thread may run here
            tmp += 1                    # 2. add
            yield                       #    <- or here
            shared["n"] = tmp           # 3. write (may overwrite what the other thread just wrote)
            yield

def run(times, locked, seed):
    shared = {"n": 0}
    threads = [worker(shared, times, locked), worker(shared, times, locked)]
    rng = random.Random(seed)           # the "operating system" switches threads at random moments
    while threads:
        t = rng.choice(threads)
        try:
            next(t)
        except StopIteration:
            threads.remove(t)
    return shared["n"]

print()
for seed in (1, 2, 3):
    print(f"schedule {seed}: without lock {run(1000, False, seed):>5} | with lock {run(1000, True, seed):>5} | expected 2000")`,
      note: 'Two simulated threads add 1000 each. Without the lock, updates are lost: the final value is far below 2000, and a different schedule gives a different wrong answer. That unpredictability is why race conditions are so hard to debug. With the lock, every schedule gives 2000. The dis output above the table shows that even a single "+= 1" is several instructions.',
    } },
    `## concurrent.futures: the tool to use
You rarely create threads by hand. The standard module \`concurrent.futures\` gives a **pool** of workers with one simple interface, and the same code works with threads or processes:
\`\`\`python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed

with ThreadPoolExecutor(max_workers=10) as pool:       # many waits at once: threads
    results = list(pool.map(fetch_rate, currencies))   # results come back in input order

with ThreadPoolExecutor(max_workers=3) as pool:
    futures = {pool.submit(fetch_rate, c): c for c in currencies}
    for future in as_completed(futures):               # in the order they FINISH
        try:
            print(futures[future], future.result())    # result() re-raises the worker's error here
        except ValueError as exc:
            print(futures[future], "failed:", exc)

with ProcessPoolExecutor() as pool:                    # computing: processes
    totals = list(pool.map(crunch, jobs))
\`\`\`
- \`pool.map(func, items)\` is the shortest form. Use \`submit\` plus \`as_completed\` when you want results as they arrive or want to handle each error separately. A **future** is a promise of a result; \`future.result()\` returns it or **raises the exception** the worker raised, so errors are never silently lost.
- **Choose \`max_workers\` on purpose.** For API calls the limit is usually the provider's **rate limit**, not your CPU: ten threads may be fine, a hundred may get you blocked (429 errors). For processes, the number of cores is the natural limit.
- **Share nothing.** Pass inputs in, return results out. If every call needs a database connection or an HTTP session, create one **per thread** (or use a pool designed for it), because connections are generally not safe to share.
- **Processes need picklable work.** The function must be defined at the top level of a module (a \`lambda\` cannot be sent), and the arguments and the results must be picklable too. Send small things: a file name, not the file's data.
- **On Windows a process pool needs the main guard.** Windows starts a new process by importing your script again. Without \`if __name__ == "__main__":\` around the code that creates the pool, every child tries to create its own pool and Python stops with a \`RuntimeError\` about the "bootstrapping phase" and a \`BrokenProcessPool\`.`,
    { py: {
      title: 'The map and combine pattern, and what a process pool needs to be able to pickle',
      starter: `import pickle
from collections import Counter

lines = ["GST filed", "GST paid", "TDS filed", "GST filed late", "TDS paid", "GST refund"]

def count_words(chunk):                       # a TOP-LEVEL function: a worker process can find it by name
    counts = Counter()
    for line in chunk:
        counts.update(line.lower().split())
    return counts

# 1. split the work into chunks (strided slices here; the challenge builds contiguous chunks)
n = 3
chunks = [lines[i::n] for i in range(n)]
print("chunks  :", chunks)

# 2. map: each chunk is counted on its own (in real life: one worker process per chunk)
partials = [count_words(chunk) for chunk in chunks]
print("partials:", [dict(p) for p in partials])

# 3. combine: add the partial results together
total = sum(partials, Counter())
print("combined equals one single pass:", total == count_words(lines))
print(total.most_common(3))

# what a process pool must do with your function and data: turn them into bytes
try:
    pickle.dumps(lambda x: x)
except Exception as exc:
    print("a lambda cannot be sent to a worker:", type(exc).__name__)
print("a top-level function can be sent:", len(pickle.dumps(count_words)) > 0)
print("small, plain data can be sent too:", len(pickle.dumps(chunks)) > 0)`,
      note: 'This is exactly what ProcessPoolExecutor does for you: split, send each chunk and the function to a worker (pickle), run, send the partial result back, and you combine. Because only small results travel back, the combine step is cheap. The pickle lines explain why lambdas and open files cannot be used as work for a process pool.',
    } },
    { local: `**Measure it yourself.** Save this as \`pool_demo.py\` in \`C:\\fde\\py-recap\` and run it with \`python pool_demo.py\`. It needs no extra packages.
\`\`\`python
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor


def fake_api_call(i):
    time.sleep(0.2)          # waiting for a server: I/O-bound
    return i * 2


def crunch(n):
    total = 0
    for i in range(n):       # pure Python arithmetic: CPU-bound
        total += i * i
    return total


def timed(label, func):
    start = time.perf_counter()
    result = func()
    print(f"{label:<34}{time.perf_counter() - start:6.2f} s")
    return result


if __name__ == "__main__":                      # REQUIRED on Windows for the process pool
    print("--- I/O-bound: 20 calls that each wait 0.2 s")
    timed("one after another", lambda: [fake_api_call(i) for i in range(20)])
    with ThreadPoolExecutor(max_workers=10) as pool:
        timed("10 threads", lambda: list(pool.map(fake_api_call, range(20))))

    print("--- CPU-bound: 8 jobs of pure Python arithmetic")
    jobs = [6_000_000] * 8
    timed("one after another", lambda: [crunch(n) for n in jobs])
    with ThreadPoolExecutor(max_workers=4) as pool:
        timed("4 threads (GIL)", lambda: list(pool.map(crunch, jobs)))
    with ProcessPoolExecutor(max_workers=4) as pool:
        timed("4 processes", lambda: list(pool.map(crunch, jobs)))
\`\`\`
Output to expect (from a 4-core Windows laptop with Python 3.12; your seconds will differ, **compare the ratios**):
\`\`\`text
--- I/O-bound: 20 calls that each wait 0.2 s
one after another                   4.01 s
10 threads                          0.40 s
--- CPU-bound: 8 jobs of pure Python arithmetic
one after another                   3.05 s
4 threads (GIL)                     2.97 s
4 processes                         1.92 s
\`\`\`
Read it: threads made the waiting job **ten times faster**, did **nothing** for the computing job, and four processes helped but did not give a full four times, because starting processes and copying data costs time (and some cores were shared with other programs). Now **delete the \`if __name__ == "__main__":\` line** and run it again: Windows stops with a \`RuntimeError\` that mentions the "bootstrapping phase" and a \`BrokenProcessPool\`. That is the main-guard rule, seen live.

**Handling errors per task.** With \`submit\` and \`as_completed\` an error in one task does not hide the others. Output of the example from the lesson (the order of finished tasks can differ on every run):
\`\`\`text
SGD -> 61.85
USD -> 83.21
XXX failed: unknown currency XXX
EUR -> 90.1
\`\`\`` },
    { warn: `Things that go wrong with concurrency:
- **Using threads for CPU-bound work.** No speed-up, a little slower, more complexity.
- **Using processes for tiny tasks.** Start-up and copying cost more than the work. Batch tiny jobs into chunks.
- **Shared mutable state.** A global list, dict or counter changed by several threads. Return values instead, or use a \`Queue\` or a lock.
- **No \`if __name__ == "__main__":\` on Windows** with a process pool.
- **Too many workers.** A hundred threads against an API that allows ten requests per second gets you blocked. Respect the rate limit, add retry with backoff, and cap \`max_workers\`.
- **Sharing one database connection or HTTP session** between threads. Use one per thread or a proper pool.
- **Swallowed exceptions.** A thread that raises inside \`threading.Thread\` only prints a message and the main program carries on. A future's \`result()\` raises it for you: use pools and call \`result()\`.
- **Starting concurrency before measuring.** First find out where the time goes (the performance lesson), then pick the tool.
- **Pickling surprises.** Lambdas, open files, database connections and local functions cannot be sent to a process.` },
    { pychallenge: {
      id: 'python-concurrency-ch1',
      prompt: 'Write `chunk_list(items, n_chunks)` that splits any sequence into exactly `n_chunks` **contiguous** lists, keeping the order, where the sizes differ by at most one and the **larger chunks come first** (7 items in 3 chunks gives sizes 3, 2, 2). When there are fewer items than chunks, the last chunks are empty lists. Raise `ValueError` if `n_chunks` is less than 1. This is how you prepare work for a process pool.',
      starter: `def chunk_list(items, n_chunks):
    # TODO: use divmod(len(items), n_chunks) to get the base size and how many chunks get one extra item
    return []
`,
      tests: `assert chunk_list([1, 2, 3, 4, 5, 6, 7], 3) == [[1, 2, 3], [4, 5], [6, 7]]
assert chunk_list(list(range(10)), 5) == [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]
assert chunk_list([1, 2], 4) == [[1], [2], [], []]
assert chunk_list([], 3) == [[], [], []]
assert chunk_list((1, 2, 3), 2) == [[1, 2], [3]]
data = list(range(103))
parts = chunk_list(data, 8)
assert len(parts) == 8
assert [x for part in parts for x in part] == data
assert max(map(len, parts)) - min(map(len, parts)) <= 1
try:
    chunk_list([1], 0)
    raise AssertionError("expected ValueError")
except ValueError:
    pass`,
      solution: `def chunk_list(items, n_chunks):
    if n_chunks < 1:
        raise ValueError("n_chunks must be at least 1")
    items = list(items)
    size, extra = divmod(len(items), n_chunks)
    chunks, start = [], 0
    for i in range(n_chunks):
        end = start + size + (1 if i < extra else 0)
        chunks.append(items[start:end])
        start = end
    return chunks
`,
      hint: '`size, extra = divmod(len(items), n_chunks)`. The first `extra` chunks have `size + 1` items, the others have `size`. Keep a `start` index, compute `end = start + size + (1 if i < extra else 0)`, append `items[start:end]`, and set `start = end`.',
    } },
    { pychallenge: {
      id: 'python-concurrency-ch2',
      prompt: 'Write `lpt_makespan(durations, workers)`: the finish time when the tasks are scheduled **longest first** ("LPT") on `workers` identical workers. Sort the durations from largest to smallest; give each task to the worker that becomes free first (use `heapq`); return the time at which the last worker finishes (0 for no tasks). Do not change the list you were given. Raise `ValueError` if `workers` is less than 1. Starting the big jobs first stops one long job from being left until the end.',
      starter: `import heapq

def lpt_makespan(durations, workers):
    # TODO: sort a copy in descending order, keep a heap of "free at" times, add each task to the earliest one
    return 0
`,
      tests: `assert lpt_makespan([2, 3, 3, 4], 2) == 6
assert lpt_makespan([5], 3) == 5
assert lpt_makespan([], 2) == 0
assert lpt_makespan([1, 1, 1, 1], 4) == 1
assert lpt_makespan([1, 1, 1, 1, 1, 1], 4) == 2
assert lpt_makespan([7, 6, 5, 4, 3, 2, 1], 3) == 10
d = [2, 3, 3, 4]
lpt_makespan(d, 2)
assert d == [2, 3, 3, 4], "the input list must not be changed"
try:
    lpt_makespan([1], 0)
    raise AssertionError("expected ValueError")
except ValueError:
    pass

# in arrival order the same tasks would finish at 7, so sorting helped
free = [0, 0]
for t in [2, 3, 3, 4]:
    free.sort()
    free[0] += t
assert max(free) == 7`,
      solution: `import heapq

def lpt_makespan(durations, workers):
    if workers < 1:
        raise ValueError("workers must be at least 1")
    free_at = [0] * workers
    heapq.heapify(free_at)
    for d in sorted(durations, reverse=True):
        start = heapq.heappop(free_at)
        heapq.heappush(free_at, start + d)
    return max(free_at)
`,
      hint: 'Create `free_at = [0] * workers` and `heapq.heapify(free_at)`. For each duration in `sorted(durations, reverse=True)`: `start = heapq.heappop(free_at)` then `heapq.heappush(free_at, start + d)`. The answer is `max(free_at)`. `sorted(...)` returns a new list, so the input is not changed.',
    } },
    { pychallenge: {
      id: 'python-concurrency-ch3',
      prompt: 'The helper `chunk_list` is given. Write `parallel_wordcount(lines, n_chunks, count_fn)`. Split `lines` into `n_chunks` chunks with `chunk_list`, call `count_fn(chunk)` **once per chunk** (each call returns a `Counter`, standing in for one worker process), and combine all partial counters into one `Counter` that is returned. The result must be the same as counting all lines in one pass. Every line must be given to exactly one chunk, in order.',
      starter: `from collections import Counter

def chunk_list(items, n_chunks):
    items = list(items)
    size, extra = divmod(len(items), n_chunks)
    chunks, start = [], 0
    for i in range(n_chunks):
        end = start + size + (1 if i < extra else 0)
        chunks.append(items[start:end])
        start = end
    return chunks

def parallel_wordcount(lines, n_chunks, count_fn):
    # TODO: map count_fn over the chunks, then add the partial Counters together
    return Counter()
`,
      tests: `from collections import Counter

lines = ["GST filed", "gst paid", "TDS filed", "GST filed late", "tds paid", "GST refund", "ITC claimed"]
calls = []

def count_fn(chunk):
    calls.append(list(chunk))
    counts = Counter()
    for line in chunk:
        counts.update(line.lower().split())
    return counts

expected = Counter(w for line in lines for w in line.lower().split())
result = parallel_wordcount(lines, 3, count_fn)
assert result == expected, result
assert len(calls) == 3, calls
assert [x for chunk in calls for x in chunk] == lines
assert max(map(len, calls)) - min(map(len, calls)) <= 1
assert parallel_wordcount([], 4, count_fn) == Counter()
assert parallel_wordcount(lines, 20, count_fn) == expected`,
      solution: `from collections import Counter

def chunk_list(items, n_chunks):
    items = list(items)
    size, extra = divmod(len(items), n_chunks)
    chunks, start = [], 0
    for i in range(n_chunks):
        end = start + size + (1 if i < extra else 0)
        chunks.append(items[start:end])
        start = end
    return chunks

def parallel_wordcount(lines, n_chunks, count_fn):
    total = Counter()
    for chunk in chunk_list(lines, n_chunks):
        total += count_fn(chunk)
    return total
`,
      hint: 'Start with `total = Counter()`. Loop over `chunk_list(lines, n_chunks)`, call `count_fn(chunk)` once for each chunk, and add the returned Counter to `total` with `+=`. Return `total`.',
    } },
    { real: 'You will meet this decision in real jobs constantly. Calling a supplier, GST or bank API for 5,000 records: **threads or asyncio**, with a worker cap that respects the provider\'s rate limit and a retry with backoff for 429 and 5xx. Parsing 200 large files or running a heavy calculation per entity: **processes**, or better, a **vectorised pandas step** or work pushed into SQL. Loading to a database: the database is usually the limit, so ten loaders in parallel can be slower than two. And when one machine is not enough, tools such as Spark, Dask and Airflow do the same "split, map, combine" across many machines. The mental model you built here carries over.' },
    { interview: `**"What is the GIL, and how does it affect threads?"**
Model answer: "The Global Interpreter Lock lets only one thread execute Python bytecode at a time in CPython. Threads are still useful for I/O-bound work, because a thread releases the lock while it waits for the network or the disk, so waits overlap. For CPU-bound pure-Python work threads give no speed-up. Then I use processes, each with its own interpreter and GIL, or move the work to native code such as numpy and pandas."

**"Threads, processes or asyncio?"** "For many waits, such as API calls, threads or asyncio; asyncio scales to thousands of waits with less overhead but needs async-aware libraries. For CPU-bound work, processes. For a lot of tiny tasks I stay sequential or batch them, because start-up and pickling cost more than they save. I always measure first."

**"What is a race condition and how do you avoid it?"** "Two threads read and change shared data and the result depends on timing, for example a lost update on \`counter += 1\`, which is read, add, write. I avoid sharing: each worker returns a result and I combine them. If I must share, I use a queue or a lock around the critical section, and I keep lock ordering simple to avoid deadlock."

**"What do you have to watch for with \`ProcessPoolExecutor\` on Windows?"** "Processes are started by importing the module again, so the pool must be created under \`if __name__ == "__main__":\`. Also, functions and arguments must be picklable, so no lambdas, and I send small inputs and results."` },
    `## Recap
- **I/O-bound** work waits (network, disk, database): overlap the waits with **threads or asyncio**. **CPU-bound** work computes: it needs **processes** or native-code libraries (pandas, numpy, SQL). Measure first.
- The **GIL** lets one thread run Python code at a time. Threads therefore speed up waiting, not computing. Processes each have their own GIL and run in parallel at the cost of start-up, memory and pickling.
- Shared mutable state causes **race conditions** (\`counter += 1\` is read, add, write). Prefer returning results, use a \`Queue\` or \`Lock\` when you must share, and never trust a test that "usually works".
- Use **\`concurrent.futures\`**: \`pool.map\` or \`submit\` with \`as_completed\`; \`future.result()\` re-raises errors. Choose \`max_workers\` for rate limits or cores, one connection per thread.
- On **Windows** a process pool needs \`if __name__ == "__main__":\`, and work must be picklable (no lambdas). Split work into chunks, map, combine; sort long jobs first.`,
  ],
  quiz: [
    { q: 'A script makes 500 API calls one after another and each mostly waits for the answer. What is the best first improvement?', o: ['use `ProcessPoolExecutor` with one process per call', 'rewrite the loop in a faster formula', 'buy a faster CPU', 'use a thread pool (or asyncio) with a sensible worker cap so the waits overlap'], a: 3, why: 'The job is I/O-bound: time is spent waiting. Overlapping the waits with threads or asyncio helps. More CPU or processes would not.' },
    { q: 'What does the GIL mean for four threads that each do pure-Python arithmetic?', o: ['they run on four cores at once', 'they take turns, so the total time is about the same as running them one after another', 'they run twice as fast', 'Python refuses to start them'], a: 1, why: 'Only one thread can run Python code at a time. For computing, threads add switching cost but no parallelism.' },
    { q: 'Why can a `ProcessPoolExecutor` not run `pool.map(lambda x: x * 2, data)`?', o: ['the function has to be sent to the worker process, and a lambda cannot be pickled', 'lambdas are too slow', 'map only works with threads', 'processes cannot do multiplication'], a: 0, why: 'Work for another process is turned into bytes with pickle. Lambdas and local functions have no importable name, so they cannot be sent. Use a top-level function.' },
    { q: 'You run a process pool on Windows and see a RuntimeError about the "bootstrapping phase". What is missing?', o: ['`pip install multiprocessing`', 'a larger `max_workers`', 'the guard `if __name__ == "__main__":` around the code that creates the pool', 'a call to `time.sleep`'], a: 2, why: 'Windows starts child processes by importing your script again. Without the guard every child tries to start its own pool.' },
    { q: 'Why is `counter += 1` unsafe when several threads share `counter`?', o: ['it is a single instruction and cannot be interrupted', 'it is read, add, write: another thread can run in between and one update can be lost', 'integers cannot be shared', 'it is only unsafe on Linux'], a: 1, why: 'The increment is several steps. Without a lock, two threads can both read the old value and overwrite each other. A quick test that "works" proves nothing.' },
    { q: 'In `as_completed`, a worker raised `ValueError`. Where does your code see it?', o: ['it is printed and silently ignored', 'the whole program stops at once without a traceback', 'it is stored in the future and is raised again when you call `future.result()`', 'the other tasks are cancelled automatically'], a: 2, why: 'A future keeps the result or the exception. `result()` returns the value or re-raises the worker\'s error, so you can handle each task separately.' },
  ],
  task: {
    title: 'Measure threads and processes, then parallelise a lookup safely',
    steps: [
      'In `C:\\fde\\py-recap` create `pool_demo.py` from the "Do this on your laptop" box and run it. Write the six timings into a comment and the speed-up ratios next to them.',
      'Remove the `if __name__ == "__main__":` line, run again and copy the first lines of the error into your file as a comment. Put the guard back.',
      'Write `fetch_rate(currency)` that sleeps 0.2 seconds and returns a rate from a small dict (raise `ValueError` for an unknown currency). Call it for 12 currencies with `ThreadPoolExecutor(max_workers=4)` using `submit` and `as_completed`, and print every result or error separately.',
      'Write `chunk_list` (challenge 1) in a module `chunks.py`. Use it to split `fact_gl.csv` rows into 4 chunks, sum the debit of each chunk in a `ProcessPoolExecutor` (a top-level function that takes a list of numbers), and compare with a plain `sum`. Entity 1 + 2 + 3 debits together must be 6688218.74.',
      'Add a counter shared by four threads with and without a `threading.Lock` (250,000 increments each). Note in a comment whether you could make it fail, and why a passing test still would not prove safety.',
    ],
    deliverable: '`pool_demo.py` with timings and ratios, the guard error as a comment, the `as_completed` output, and the chunked debit total.',
  },
};
