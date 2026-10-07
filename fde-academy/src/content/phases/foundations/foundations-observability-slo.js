export default {
  id: 'foundations-observability-slo',
  title: 'Observability, SLOs and incidents',
  goal: 'You can say what to log, measure and trace in a data pipeline, turn promises into SLIs and SLOs with an error budget, design alerts that people act on, and run a blameless post-mortem.',
  roadmap: ['Logs, metrics and traces', 'Structured logging and correlation IDs', 'SLI, SLO, SLA and error budgets', 'Alerting, incidents and post-mortems', 'Cost awareness (FinOps)'],
  blocks: [
    `## The problem
Monday, 9 am. The CFO opens the MIS dashboard and the numbers are from Friday. The nightly load failed on Saturday. Nothing alerted you, so you hear about it from the CFO.

Next month you overcorrect. Now 200 alert emails arrive every night, everybody filters them, and a real failure drowns in the noise.

Both are failures of **observability**: the ability to understand what a system is doing from the signals it gives off. You cannot fix, or even notice, what you cannot see. This lesson covers what to record, what to promise, what to alert on, and what to do when things break anyway.

## Three pillars: logs, metrics and traces
- **Logs** are timestamped records of events, such as "journal JV202504-0009 does not balance". Logs explain **why**. They are detailed but costly at volume, and hard to search when they are free text.
- **Metrics** are numbers over time, small and cheap: rows loaded per run, run duration, failed runs, minutes since the last load. Metrics tell you **that** something is wrong, and they drive dashboards and alerts.
- **Traces** follow one request, or one pipeline run, across steps and services and record the time each step took. Traces show **where**. The run view of an orchestrator, with one bar per task, is a trace.`,
    { sketch: { w: 760, h: 330, caption: 'Three kinds of signal from one pipeline run. The log and metric values come from the playground below; the bars are only an example.', items: [
      { t: 'box', x: 60, y: 12, w: 120, h: 50, label: 'extract', fill: 'grey', size: 16 },
      { t: 'box', x: 220, y: 12, w: 120, h: 50, label: 'validate', fill: 'grey', size: 16 },
      { t: 'box', x: 380, y: 12, w: 120, h: 50, label: 'transform', fill: 'grey', size: 16 },
      { t: 'box', x: 540, y: 12, w: 120, h: 50, label: 'load', fill: 'grey', size: 16 },
      { t: 'arrow', x1: 180, y1: 37, x2: 220, y2: 37 },
      { t: 'arrow', x1: 340, y1: 37, x2: 380, y2: 37 },
      { t: 'arrow', x1: 500, y1: 37, x2: 540, y2: 37 },
      { t: 'brace', x: 60, y: 68, w: 600, label: 'every step gives off three kinds of signal' },
      { t: 'box', x: 20, y: 130, w: 225, h: 48, label: 'Logs', sub: 'what happened, and why', fill: 'blue' },
      { t: 'box', x: 268, y: 130, w: 225, h: 48, label: 'Metrics', sub: 'how much, how often', fill: 'green' },
      { t: 'box', x: 516, y: 130, w: 225, h: 48, label: 'Traces', sub: 'where the time went', fill: 'purple' },
      { t: 'note', x: 20, y: 190, w: 225, h: 88, text: '{"step": "validate",\n "level": "ERROR",\n "run_id": "gl-load-0001"}', fill: 'white', size: 14 },
      { t: 'note', x: 268, y: 190, w: 225, h: 88, text: 'rows_loaded 1193\nerrors_total 5\nwarnings_total 1', fill: 'white', size: 15 },
      { t: 'note', x: 516, y: 190, w: 225, h: 88, text: '', fill: 'white' },
      { t: 'text', x: 524, y: 203, text: 'extract', size: 13, anchor: 'start' },
      { t: 'text', x: 524, y: 224, text: 'validate', size: 13, anchor: 'start' },
      { t: 'text', x: 524, y: 245, text: 'transform', size: 13, anchor: 'start' },
      { t: 'text', x: 524, y: 266, text: 'load', size: 13, anchor: 'start' },
      { t: 'box', x: 590, y: 196, w: 30, h: 14, fill: 'blue', solid: true },
      { t: 'box', x: 620, y: 217, w: 20, h: 14, fill: 'blue', solid: true },
      { t: 'box', x: 640, y: 238, w: 64, h: 14, fill: 'red', solid: true },
      { t: 'box', x: 704, y: 259, w: 30, h: 14, fill: 'blue', solid: true },
      { t: 'text', x: 380, y: 308, text: 'logs explain, metrics alert, traces locate', size: 16, color: '#5c6478' },
    ] } },
    `## Structured logs and correlation IDs
A line such as \`ERROR load failed again!!\` is written for one human. A **structured log** is readable by machines: usually one JSON object per line with fixed fields (time, level, message) plus context such as \`step\`, \`rows\` or \`journal_id\`. Now you can filter and count: "errors per step in the last run".

Add a **correlation ID** (also called a run ID, request ID or trace ID). Create it when the work starts and put it on every log line and every call, as the HTTP lesson showed with \`X-Request-Id\` and \`traceparent\`. One search for that ID returns the whole story across services.

Three habits. Use levels honestly: ERROR means a person must look, WARNING means odd but survivable, INFO marks normal milestones. Log "missing FX rate for SGD, 2026-02-01, 34 rows" **once with a count**, not once per row. And never log secrets or personal data. The playground below builds a JSON formatter with the \`logging\` module, runs the GL checks, then parses its own log like a monitoring tool would.`,
    { py: {
      title: 'Structured JSON logs, then count errors per step',
      starter: `import io
import json
import logging
from collections import Counter
from datetime import datetime, timezone

import pandas as pd

# Every key that a normal LogRecord already has. Anything else came from extra={...}
STANDARD = set(logging.LogRecord("", 0, "", 0, "", (), None).__dict__) | {"message", "asctime"}

class JsonFormatter(logging.Formatter):
    def format(self, record):
        line = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec="seconds"),
            "level": record.levelname,
            "msg": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in STANDARD:
                line[key] = value              # run_id, step, rows ...
        return json.dumps(line)

stream = io.StringIO()                         # stands in for a log file
handler = logging.StreamHandler(stream)
handler.setFormatter(JsonFormatter())
log = logging.getLogger("gl_pipeline")
log.handlers.clear()                           # so re-running this cell does not double the lines
log.addHandler(handler)
log.setLevel(logging.INFO)
log.propagate = False

RUN_ID = "gl-load-0001"                        # in real life: a uuid made when the run starts

def say(level, step, msg, **fields):
    log.log(level, msg, extra={"run_id": RUN_ID, "step": step, **fields})

# ---- the pipeline ----
gl = pd.read_csv("fact_gl.csv")
fx = pd.read_csv("fx_rates.csv")
say(logging.INFO, "extract", "file read", rows=int(len(gl)))

sums = gl.groupby("journal_id")[["debit", "credit"]].sum()
for journal_id, row in sums[(sums["debit"] - sums["credit"]).abs() > 0.005].iterrows():
    say(logging.ERROR, "validate", "journal does not balance",
        journal_id=journal_id, difference=round(float(row["debit"] - row["credit"]), 2))
duplicates = int(gl.duplicated(subset=[c for c in gl.columns if c != "gl_id"]).sum())
say(logging.WARNING, "validate", "duplicate lines", rows=duplicates)

gl["rate_month"] = gl["posting_date"].str[:7] + "-01"
joined = gl.merge(fx, how="left", on=["currency", "rate_month"])
missing = joined[joined["rate_to_inr"].isna()]
for (currency, month), part in missing.groupby(["currency", "rate_month"]):
    say(logging.ERROR, "transform", "missing FX rate", currency=currency, rate_month=month, rows=int(len(part)))

say(logging.INFO, "load", "rows loaded", rows=int(len(joined) - len(missing)))

# ---- now read the log like a monitoring tool would ----
lines = stream.getvalue().splitlines()
print(lines[0])
print([ln for ln in lines if "missing FX" in ln][0])
print("...", len(lines), "log lines in total")

records = [json.loads(line) for line in lines]
print("lines for this run:", sum(r["run_id"] == RUN_ID for r in records))
print("by level:", dict(Counter(r["level"] for r in records)))
errors = Counter(r["step"] for r in records if r["level"] == "ERROR")
print("errors per step:", dict(errors))`,
      note: 'Expect 8 log lines: 4 validate errors (the four unbalanced journals), 1 validate warning (3 duplicate lines), 1 transform error (34 lines with no SGD rate for 2026-02-01) and 2 INFO lines, so errors per step are validate 4 and transform 1. The timestamps change on every run. Try adding a "dedupe" step of your own with its own WARNING and see it appear in the count.',
    } },
    `## SLI, SLO, SLA and the error budget
Three terms that people mix up:
- **SLI** (*service level indicator*): a measurement. "The share of nightly loads that finished by 07:00."
- **SLO** (*service level objective*): your target for that SLI over a period. "At least 95% of nightly loads finish by 07:00, measured over a quarter."
- **SLA** (*service level agreement*): a promise to a customer with consequences, such as credits or penalties. Keep the SLA looser than the SLO, so you notice and fix trouble before you break the contract.

A target of 100% is the wrong goal: every extra nine costs far more, and nothing in the chain is perfect. The gap is your **error budget**, the failures you are allowed. A quarter has about 90 nightly loads, so a 95% SLO allows 0.05 x 90 = 4.5, which means 4 late loads. While budget remains, ship changes. When it is spent, slow down and fix reliability. A **burn rate** alert fires when you are using the budget much faster than planned. This turns "how reliable is reliable enough?" from an argument into a number.

## SLIs for a data product
An API is measured by availability and latency. A data product also needs SLIs about the **data**.

| SLI | The question | Example SLO |
|---|---|---|
| **Freshness** | How old is the newest data? | The GL table is loaded by 08:00 IST on 95% of working days |
| **Completeness and volume** | Did the expected amount arrive? | Row count is within 20% of normal for that day |
| **Quality pass rate** | What share of checks or rows pass? | At least 99.9% of journals balance |
| **Run health** | Did the pipeline succeed, and how long did it take? | 99% of runs succeed; p95 duration under the agreed limit |

Latency and duration SLOs use **percentiles**, because averages hide pain. Ten response times in milliseconds: 80, 85, 90, 95, 100, 105, 110, 120, 300, 2000. The mean is 308.5, which describes nobody. The median (**p50**) is 100, **p90** is 300 and **p99** is 2000. "p95 under 300 ms" means 95% of requests are at or below 300 ms.`,
    { sql: {
      title: 'Freshness, volume and quality SLIs from fact_gl',
      starter: `WITH params AS (
  SELECT DATE '2026-03-31' AS checked_on
),
monthly AS (
  SELECT date_trunc('month', posting_date)::date AS month, COUNT(*) AS gl_lines
  FROM fact_gl
  GROUP BY 1
),
volume AS (
  SELECT ROUND((SELECT gl_lines FROM monthly ORDER BY month DESC LIMIT 1)::numeric
               / (SELECT AVG(gl_lines) FROM monthly WHERE month < (SELECT MAX(month) FROM monthly)), 3) AS ratio
),
journals AS (
  SELECT journal_id, ABS(SUM(debit) - SUM(credit)) < 0.005 AS balanced
  FROM fact_gl
  GROUP BY journal_id
)
SELECT '1 freshness: days since the last posting' AS sli,
       (p.checked_on - MAX(g.posting_date))::numeric AS measured,
       'at most 3' AS target,
       CASE WHEN p.checked_on - MAX(g.posting_date) <= 3 THEN 'meets SLO' ELSE 'BREACH' END AS status
FROM fact_gl g CROSS JOIN params p
GROUP BY p.checked_on
UNION ALL
SELECT '2 volume: latest month / average of earlier months',
       ratio,
       '0.80 to 1.20',
       CASE WHEN ratio BETWEEN 0.8 AND 1.2 THEN 'meets SLO' ELSE 'BREACH' END
FROM volume
UNION ALL
SELECT '3 quality: % of journals that balance',
       ROUND(100.0 * COUNT(*) FILTER (WHERE balanced) / COUNT(*), 2),
       'at least 99.90',
       CASE WHEN 100.0 * COUNT(*) FILTER (WHERE balanced) / COUNT(*) >= 99.9 THEN 'meets SLO' ELSE 'BREACH' END
FROM journals
ORDER BY 1;`,
      note: 'The practice data is fixed, so the script pretends it is 31 March 2026, the fiscal year end. A real check would use the current time and a load timestamp; the GL table has none, so the newest posting_date stands in for it. Expect: the newest posting is 27 March, 4 days old, which breaks a "3 days" target; the latest month has 0.997 times the earlier monthly average (fine); and 608 of 612 journals balance, which is 99.35% and below the 99.90 target. Two breaches, which is exactly what an SLI report is for.',
    } },
    { pychallenge: {
      id: 'foundations-pych-error-budget',
      prompt: 'Write `error_budget_remaining(slo, total, failed)`. `slo` is the target success rate as a fraction (for example `0.99`), `total` is how many events happened (requests or loads) and `failed` is how many of them failed. The **error budget** is the number of failures the SLO allows: `(1 - slo) * total`. Return the **fraction of that budget still unspent** as a float: `1.0` when nothing failed, `0.5` when half the budget is used, and never below `0.0` (clamp it when the budget is overspent). If `total` is `0` return `1.0`. If `slo` is `1.0` there is no budget at all: return `1.0` when `failed` is `0`, otherwise `0.0`.',
      starter: `def error_budget_remaining(slo, total, failed):
    return 1.0`,
      tests: `def close(a, b):
    return abs(a - b) < 1e-9

assert close(error_budget_remaining(0.99, 1000, 0), 1.0)
assert close(error_budget_remaining(0.99, 1000, 5), 0.5)
assert close(error_budget_remaining(0.99, 2000, 14), 0.3)
assert close(error_budget_remaining(0.999, 1000000, 250), 0.75)
assert close(error_budget_remaining(0.95, 90, 3), 1 - 3 / 4.5)
assert error_budget_remaining(0.99, 1000, 25) == 0.0
assert error_budget_remaining(0.99, 1000, 10000) == 0.0
assert error_budget_remaining(0.99, 0, 0) == 1.0
assert error_budget_remaining(1.0, 100, 0) == 1.0
assert error_budget_remaining(1.0, 100, 1) == 0.0
assert isinstance(error_budget_remaining(0.99, 1000, 5), float)`,
      solution: `def error_budget_remaining(slo, total, failed):
    if total == 0:
        return 1.0
    allowed = (1 - slo) * total
    if allowed <= 0:
        return 1.0 if failed == 0 else 0.0
    return max(0.0, 1 - failed / allowed)`,
      hint: 'allowed = (1 - slo) * total. The unspent fraction is 1 - failed / allowed. Handle total == 0 and allowed == 0 first, and wrap the result in max(0.0, ...).',
    } },
    { pychallenge: {
      id: 'foundations-pych-percentile',
      prompt: 'Write `percentile(values, p)` using the **nearest-rank** method. Sort the values from smallest to largest. The rank is `ceil(p * n / 100)`, where `n` is the number of values (use rank 1 when `p` is 0). Return the value at that rank, counting from 1. `p` is a number from 0 to 100. Raise `ValueError` for an empty list and do **not** change the list you were given. Example: for `[15, 20, 35, 40, 50]` and `p=30` the rank is 2, so the answer is `20`.',
      starter: `import math

def percentile(values, p):
    return 0`,
      tests: `data = [15, 20, 35, 40, 50]
assert percentile(data, 0) == 15
assert percentile(data, 30) == 20
assert percentile(data, 40) == 20
assert percentile(data, 50) == 35
assert percentile(data, 100) == 50
assert percentile([50, 15, 40, 35, 20], 50) == 35
latency = [120, 80, 95, 300, 110, 90, 105, 85, 100, 2000]
assert percentile(latency, 50) == 100
assert percentile(latency, 90) == 300
assert percentile(latency, 95) == 2000
assert percentile(latency, 99) == 2000
assert latency[0] == 120 and latency[-1] == 2000   # the input list must not be sorted in place
assert percentile(list(range(1, 101)), 95) == 95
assert percentile([7], 50) == 7
try:
    percentile([], 50)
    raise AssertionError("an empty list should raise ValueError")
except ValueError:
    pass`,
      solution: `import math

def percentile(values, p):
    if not values:
        raise ValueError("no values")
    ordered = sorted(values)
    rank = max(1, math.ceil(p * len(ordered) / 100))
    return ordered[rank - 1]`,
      hint: 'sorted(values) returns a new list and leaves the original alone. Compute the rank with math.ceil(p * n / 100), make it at least 1, then index with rank - 1.',
    } },
    `## Alerting principles
An alert is an interruption, so spend it carefully.
- **Alert on symptoms users feel, not on every cause.** "The GL data is older than promised" is a symptom. "CPU is at 85%" is a possible cause. Keep causes on dashboards, for diagnosis.
- **Every alert needs action, and soon.** If nobody must act now, make it a ticket or a line in a weekly report.
- **Every alert has an owner and a runbook link.** The owner is a named person or an on-call rotation, never a shared inbox. A **runbook** is a short page: what this alert means, how to check, how to fix or roll back, who to ask.
- **Fight alert fatigue.** Noisy alerts train people to ignore all alerts. Require the condition to last a few minutes, group related alerts, use severities (page now versus ticket), and delete alerts nobody acts on.
- **Alert on budget burn** rather than on every blip: it catches real trouble early and ignores a single failed run.`,
    { sketch: { w: 760, h: 300, caption: 'The alert, runbook and post-mortem loop. Each incident should leave the system a little stronger.', items: [
      { t: 'box', x: 20, y: 24, w: 200, h: 70, label: '1 SLI misses target', sub: 'data older than the SLO', fill: 'red', size: 17 },
      { t: 'box', x: 280, y: 24, w: 200, h: 70, label: '2 Alert the owner', sub: 'with a runbook link', fill: 'yellow', size: 17 },
      { t: 'box', x: 540, y: 24, w: 200, h: 70, label: '3 Triage, mitigate', sub: 'rerun, roll back, inform', fill: 'orange', size: 17 },
      { t: 'box', x: 540, y: 180, w: 200, h: 70, label: '4 Resolve', sub: 'check the SLI is green', fill: 'green', size: 17 },
      { t: 'box', x: 280, y: 180, w: 200, h: 70, label: '5 Post-mortem', sub: 'blameless: timeline, causes', fill: 'blue', size: 17 },
      { t: 'box', x: 20, y: 180, w: 200, h: 70, label: '6 Fix the system', sub: 'test, alert, runbook', fill: 'purple', size: 17 },
      { t: 'arrow', x1: 220, y1: 59, x2: 280, y2: 59 },
      { t: 'arrow', x1: 480, y1: 59, x2: 540, y2: 59 },
      { t: 'arrow', x1: 640, y1: 94, x2: 640, y2: 180 },
      { t: 'arrow', x1: 540, y1: 215, x2: 480, y2: 215 },
      { t: 'arrow', x1: 280, y1: 215, x2: 220, y2: 215 },
      { t: 'arrow', x1: 120, y1: 180, x2: 120, y2: 94 },
      { t: 'note', x: 190, y: 120, w: 380, h: 44, text: 'Actions close the loop: the next incident\nis caught sooner, or never happens', fill: 'white', size: 14 },
      { t: 'text', x: 380, y: 280, text: 'watch the watcher: a heartbeat that raises an alarm when the alerts themselves go quiet', size: 14, color: '#5c6478' },
    ] } },
    `## Incidents and blameless post-mortems
An **incident** is an unplanned event that hurts users. A calm routine beats heroics.
1. **Detect**: an alert finds it, not the CFO.
2. **Triage**: decide how bad it is (severity), who leads (the incident commander) and where everyone talks.
3. **Mitigate first, diagnose later**: roll back, rerun the load, pause the pipeline, or show yesterday's snapshot with a clear banner.
4. **Communicate** on a steady rhythm: what we know, what we are doing, when the next update comes. During month-end close, finance wants to hear it from you.
5. **Resolve** and confirm that the SLI is healthy again.
6. **Learn**, with a post-mortem.

A **blameless post-mortem** asks "how did our system allow this?" and not "who did this?". People who fear blame hide facts, and people who feel safe tell you the real story. It contains a summary with impact in numbers, a timeline, the root cause and contributing factors (ask "why" five times), what went well, and **action items, each with an owner and a due date**. A new test, a new alert or a better runbook step is worth more than a long essay.

## Cost awareness (FinOps) in one section
Cloud is billed by use, so a pipeline that works can still be wasteful. Five habits:
1. **Tag** every resource with owner, project and environment, so the bill can be split and nobody asks "whose is this?".
2. Set **budgets and alerts** in the cloud portal at a few thresholds, and name an owner who reads them. Check the current features of your provider.
3. **Turn things off**: dev and test systems outside working use, idle clusters, unattached disks, old snapshots. Use auto-shutdown or auto-pause where offered.
4. **Right-size**, use cheaper storage for old data, and set a **retention** period on logs, because logs and metrics cost money too.
5. Read the **biggest line** of the bill first. Do not trust remembered prices; check the current pricing page.

## Monitor the monitor
Silence is not health. If the scheduler, the alert rule or the email route breaks, no alert arrives and everything looks fine. Use a **heartbeat** (a *dead man's switch*): the job pings a monitor after every successful run, and the monitor alerts when the ping is **missing**. Treat "no data" as a failure, test your alerts on purpose now and then, and keep the on-call contact list current.`,
    { warn: 'Do not log what you must not keep. A debug line that prints the whole request body can write PAN, bank account numbers or tokens into a log that many people can read and that lives for a long time. Log identifiers and counts, mask the rest (see the governance lesson), and set a retention period for logs.' },
    { interview: '**"What would you monitor for this pipeline, and what would you alert on?"** Model answer: "I would monitor four things: (1) freshness, the age of the newest data against the promise; (2) volume, row counts against what is normal for that day; (3) quality, the pass rate of tests such as balanced journals and valid references; (4) run health, meaning duration and failures per step, plus the platform cost. I would write them as SLIs with SLOs agreed with the finance users. I would alert on symptoms: data older than the promise, quality below its SLO, or the error budget burning fast. Each alert goes to a named owner with a runbook link. Causes such as CPU or memory stay on dashboards for diagnosis. I would also run a heartbeat, so a silent scheduler cannot hide."' },
    { real: 'For the month-end MIS load, agree three promises with the finance lead: "the GL extract is loaded by 08:00 IST on working days", "the row count is within 20% of the same weekday last month" and "all journals balance". Check them in SQL after every load, store the result in a small table, and alert the owner on a breach. The first time a number looks wrong, "which run, which step, which rows?" is one search away, because you logged a run ID and a step on every line.' },
    `## Recap
- **Logs** explain why, **metrics** show that something is wrong, **traces** show where. Write **structured JSON logs** with a **correlation ID** and never log secrets or personal data.
- **SLI** is the measurement, **SLO** the internal target, **SLA** the external promise. The **error budget** is 1 minus the SLO and decides when to ship and when to fix.
- Data products need SLIs for **freshness, volume, quality pass rate** and run health. Use **percentiles** (p50, p95, p99), not averages.
- **Alert on symptoms**, with an owner and a runbook link, and fight alert fatigue. Run incidents as detect, triage, mitigate, communicate, resolve, learn, with a **blameless post-mortem**.
- **FinOps basics**: tags, budgets, turn things off, retention. **Monitor the monitor** with a heartbeat.`,
  ],
  quiz: [
    { q: 'What is a correlation ID (run ID or trace ID) for?', o: ['To encrypt log files', 'To tag every log line of one run or request so you can follow it across services', 'To count how many users logged in', 'To speed up a database query'], a: 1, why: 'The same ID on every line lets one search return the whole story of a run.' },
    { q: 'What is the difference between an SLO and an SLA?', o: ['They are the same thing', 'An SLO is a customer contract with penalties and an SLA is an internal measurement', 'An SLO is an internal target and an SLA is a promise to a customer with consequences', 'An SLA measures latency and an SLO measures cost'], a: 2, why: 'You steer by the SLO and promise the SLA. Keep the SLA looser than the SLO.' },
    { q: 'An SLO says 99% of 2,000 requests must succeed this month. 14 have failed. How much of the error budget is left?', o: ['86%', '99%', '14%', '30%'], a: 3, why: 'The budget is 1% of 2,000 = 20 failures. 14 are used, so 6 of 20 remain, which is 30%.' },
    { q: 'Which is the best alert for a finance data product?', o: ['The GL table is older than its promised freshness', 'CPU on the database server is above 80%', 'Any WARNING line in the logs', 'The disk usage changed'], a: 0, why: 'Alert on symptoms the users feel. CPU and disk are possible causes and belong on dashboards.' },
    { q: 'In a blameless post-mortem, which question is most useful?', o: ['Who uploaded the bad file?', 'Who should be warned in writing?', 'Why did nobody catch this earlier than the CFO?', 'How did our checks and process allow a bad file to reach the dashboard?'], a: 3, why: 'Blameless reviews look for weaknesses in the system and the process, so the fix is a test, an alert or a runbook step.' },
    { q: 'The scheduler for the nightly job was switched off by mistake and no alert fired. What would have caught it?', o: ['A heartbeat check that alerts when the expected success ping is missing', 'A higher CPU threshold', 'More INFO log lines', 'A longer log retention period'], a: 0, why: 'A dead man\'s switch treats "no data" as a failure. Silence is not health.' },
  ],
  task: {
    title: 'Write an SLO sheet and a post-mortem for the Kollana GL load',
    steps: [
      'Run the logging playground. Add a "dedupe" step that logs a WARNING for the duplicate lines, then change the parser to also print warnings per step.',
      'In the SQL playground add a fourth SLI: the share of orders whose customer_id exists in customers (use orders and a LEFT JOIN to customers). Decide a target and show meets SLO or BREACH.',
      'Write a one-page SLO sheet for the monthly MIS pack: three SLIs, an SLO for each, the window, the error budget in runs, the alert rule, the owner and five lines of runbook.',
      'Write a blameless post-mortem for this incident: the SGD rate for 2026-02-01 was missing, so 34 GL lines could not be converted and the Singapore P&L was wrong. Include summary, impact, timeline, root cause, what went well and three action items with owners.',
      'List five cloud resources a pipeline like this might use and, for each one, the tags, the budget alert and what you could switch off outside working use.',
    ],
    deliverable: 'Your edited logging script and its output, the SQL for the fourth SLI, the one-page SLO sheet, the post-mortem, and the five-line FinOps table.',
  },
};
