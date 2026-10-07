export default {
  id: 'python-scheduling',
  title: 'Scheduling',
  goal: 'You can read and write cron expressions, schedule a Python job with Windows Task Scheduler or APScheduler, design jobs that are safe to schedule (idempotent, no overlap, catch-up aware, business-day aware), and explain when a scheduler is no longer enough and an orchestrator is needed.',
  roadmap: ['Windows Task Scheduler', 'cron', 'APScheduler', 'why you will outgrow it'],
  blocks: [
    `## The problem
Your month-end script works when you run it by hand. But the real requirement is "**every month on the 3rd business day at 2 a.m., without anyone clicking anything**". Now a long list of questions appears:
- Who starts the script, and **with which Python, folder and environment variables**?
- What if the **laptop is switched off** at 2 a.m.? Is the run lost, or does it run when the laptop wakes?
- What if the previous run is **still going** when the next one starts? Two copies writing the same table?
- What if it **fails**? Who finds out, and when? What if it **never ran at all** and nobody noticed?
- How do you express "3rd business day", when cron only knows days of the week and month?

A **scheduler** is the tool that starts jobs at the right time. Windows has **Task Scheduler**, Linux has **cron**, and Python has libraries such as **APScheduler**. They all do the same basic thing: *at this time, run this command*. Everything else in the list above is **your job's design**. This lesson shows the tools and, more importantly, the design rules that make a job safe to schedule. At the end you will see why teams eventually move to an orchestrator (Airflow, Dagster, Azure Data Factory), which later phases cover.`,
    `## Cron: a schedule in five fields
Cron, the Unix scheduler, gave the world a tiny language that almost every tool now understands (Task Scheduler is the exception, with its own forms). A cron expression has **five fields**, separated by spaces:

| Field | Allowed values |
|---|---|
| minute | 0 to 59 |
| hour | 0 to 23 |
| day of month | 1 to 31 |
| month | 1 to 12 |
| day of week | 0 to 6, where Sunday is 0 (7 also means Sunday in most versions) |

Each field can hold: \`*\` (every value), a number (\`2\`), a **list** (\`1,15\`), a **range** (\`1-5\`) or a **step** (\`*/15\` means every 15, \`10-20/5\` means 10, 15, 20).

| Expression | Meaning |
|---|---|
| \`0 2 1 * *\` | 02:00 on the 1st of every month |
| \`*/15 9-17 * * 1-5\` | every 15 minutes, from 09:00 to 17:45, Monday to Friday |
| \`30 6 * * 1-5\` | 06:30 on weekdays |
| \`0 6 1 4,7,10,1 *\` | 06:00 on the 1st of each fiscal quarter (April, July, October, January) |
| \`0 */6 * * *\` | every 6 hours, on the hour |

**Quirks that cause real bugs:**
- If you restrict **both** day of month and day of week (\`0 6 1 * 1\`), cron runs when **either** matches, not both. That job runs on every Monday **and** on the 1st.
- Cron cannot say "the **last day** of the month" or "the **3rd business day**". The usual answer: schedule the job **daily** and have the script **check** the date itself (the playground below does this), or use a scheduler that has such triggers (APScheduler's \`day="last"\`).
- Time zones: cron runs in the **server's** time zone. Mixing laptops and servers, and daylight saving time (an hour that is skipped or repeated twice), has caused many missed or double runs. For technical jobs, many teams fix the schedule in **UTC** and convert in their heads, or state the zone explicitly in the tool.
- Different tools differ: some have a sixth field (**seconds**; Azure's timer triggers use this), some use \`?\`, some count weekdays from 1. Always read the tool's page and test with a "next 5 run times" view.`,
    { sketch: { w: 760, h: 300, caption: 'Five fields, read left to right: minute, hour, day of month, month, day of week', items: [
      { t: 'box', x: 14, y: 30, w: 134, h: 70, label: 'minute', sub: '0 to 59', fill: 'blue', size: 16 },
      { t: 'box', x: 156, y: 30, w: 134, h: 70, label: 'hour', sub: '0 to 23', fill: 'blue', size: 16 },
      { t: 'box', x: 298, y: 30, w: 148, h: 70, label: 'day of month', sub: '1 to 31', fill: 'yellow', size: 16 },
      { t: 'box', x: 454, y: 30, w: 134, h: 70, label: 'month', sub: '1 to 12', fill: 'green', size: 16 },
      { t: 'box', x: 596, y: 30, w: 150, h: 70, label: 'day of week', sub: '0 to 6, Sunday = 0', fill: 'pink', size: 15 },
      { t: 'text', x: 81, y: 138, text: '0', font: 'mono', size: 22, anchor: 'middle', bold: true },
      { t: 'text', x: 223, y: 138, text: '2', font: 'mono', size: 22, anchor: 'middle', bold: true },
      { t: 'text', x: 372, y: 138, text: '1', font: 'mono', size: 22, anchor: 'middle', bold: true },
      { t: 'text', x: 521, y: 138, text: '*', font: 'mono', size: 22, anchor: 'middle', bold: true },
      { t: 'text', x: 671, y: 138, text: '*', font: 'mono', size: 22, anchor: 'middle', bold: true },
      { t: 'text', x: 380, y: 170, text: '= at 02:00 on the 1st of every month', size: 17, anchor: 'middle', color: '#1e8449' },
      { t: 'box', x: 14, y: 190, w: 360, h: 100, fill: 'grey' },
      { t: 'text', x: 26, y: 212, text: 'in a field:', size: 14, anchor: 'start', bold: true },
      { t: 'text', x: 26, y: 234, text: '*', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 76, y: 234, text: 'every value', size: 14, anchor: 'start' },
      { t: 'text', x: 176, y: 234, text: '5', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 246, y: 234, text: 'one value', size: 14, anchor: 'start' },
      { t: 'text', x: 26, y: 256, text: '1,15', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 76, y: 256, text: 'a list', size: 14, anchor: 'start' },
      { t: 'text', x: 176, y: 256, text: '1-5', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 246, y: 256, text: 'a range', size: 14, anchor: 'start' },
      { t: 'text', x: 26, y: 278, text: '*/15', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 76, y: 278, text: 'every 15', size: 14, anchor: 'start' },
      { t: 'text', x: 176, y: 278, text: '10-20/5', font: 'mono', size: 13, anchor: 'start' },
      { t: 'text', x: 246, y: 278, text: 'a range with a step', size: 14, anchor: 'start' },
      { t: 'note', x: 392, y: 190, w: 354, h: 100, fill: 'pink', size: 13, text: 'Careful: with BOTH day fields restricted, cron runs\nwhen EITHER matches. "Last day of month" and\n"3rd business day" cannot be written: the script\nchecks the date itself.' },
    ] } },
    { py: {
      title: 'A cron matcher in plain Python: parse, match and list the next runs',
      starter: `from datetime import datetime, timedelta

BOUNDS = [(0, 59), (0, 23), (1, 31), (1, 12), (0, 6)]      # minute, hour, day of month, month, day of week (Sunday = 0)

def expand(field, low, high):
    """A SIMPLE parser: '*', numbers, lists ('1,15') and steps ('*/15'). Challenge 1 adds ranges and error checks."""
    if field == "*":
        return set(range(low, high + 1))
    if field.startswith("*/"):
        return set(range(low, high + 1, int(field[2:])))
    return {int(part) for part in field.split(",")}

def parse(expr):
    return [expand(field, lo, hi) for field, (lo, hi) in zip(expr.split(), BOUNDS)]

def next_runs(expr, after, count=3):
    minute, hour, dom, month, dow = parse(expr)
    runs, day = [], after.date()
    for _ in range(3000):                                     # look at most ~8 years ahead
        cron_dow = (day.weekday() + 1) % 7                    # Python: Monday = 0; cron: Sunday = 0
        if day.month in month and day.day in dom and cron_dow in dow:
            for h in sorted(hour):
                for m in sorted(minute):
                    t = datetime(day.year, day.month, day.day, h, m)
                    if t > after:
                        runs.append(t)
                        if len(runs) == count:
                            return runs
        day += timedelta(days=1)
    return runs

now = datetime(2026, 10, 6, 12, 0)                            # a Tuesday
presets = [
    ("0 2 1 * *", "02:00 on the 1st of every month"),
    ("30 6 * * 1,2,3,4,5", "06:30 on weekdays (a list, because ranges come in challenge 1)"),
    ("0 6 1 4,7,10,1 *", "06:00 on the 1st of each fiscal quarter"),
    ("0 */6 * * *", "every 6 hours"),
    ("0 8 * * 0", "08:00 every Sunday"),
]
print("now:", now.strftime("%a %d %b %Y %H:%M"))
for expr, meaning in presets:
    runs = next_runs(expr, now)
    print(f"\\n{expr:<20} {meaning}")
    for t in runs:
        print("     ", t.strftime("%a %d %b %Y %H:%M"))`,
      note: 'Check the first schedule: from 6 October the next 02:00 on the 1st is Sunday 1 November, then Tuesday 1 December, then Friday 1 January 2027, which agrees with what APScheduler computes for the same expression. The fiscal-quarter schedule starts on 1 January because the next quarter start after 6 October is 1 January. This is also how a "next 5 run times" preview works, and why you should always look at one before trusting an expression.',
    } },
    { widget: 'CronHelper' },
    `## Windows Task Scheduler
On your Windows laptop the built-in scheduler is **Task Scheduler** (search for it in the Start menu, or run \`taskschd.msc\`). A task has a **trigger** (when), an **action** (what to start), and **settings**. The fields that matter most for a Python job:
- **Action: "Start a program".** *Program/script*: the **full path to the Python in your virtual environment**, for example \`C:\\fde\\kollana-reports\\.venv\\Scripts\\python.exe\`. *Add arguments*: \`-m kollana.cli --month previous\` or \`run.py --month previous\`. **Start in**: the **project folder**. This last box is the most forgotten and the cause of "works by hand, fails in the scheduler": relative paths (\`input\\\`, \`.env\`) are resolved from this folder.
- **Triggers:** daily, weekly, monthly (with months and days, or "last day"), at log-on, at start-up. There is no "3rd business day": run it **daily** and let the script decide.
- **General tab:** "Run whether user is logged on or not" (needs your Windows password; the job then has no window), "Run with highest privileges" only when truly needed.
- **Settings tab:** "**Run task as soon as possible after a scheduled start is missed**" (catch-up after the laptop was off), "**If the task is already running, then: Do not start a new instance**" (no overlap), "Stop the task if it runs longer than ...", and "If the task fails, restart every ...".
- **Conditions tab:** "Start only if the computer is on AC power" and "Wake the computer to run this task". On a laptop these decide whether a night job runs at all.
- **History** tab (enable it): shows every start and end. The **Last Run Result** column shows the **exit code**: \`0x0\` means success; \`0x1\` means your script returned 1 or raised an exception; \`0x2\` often means the file or folder was not found.

On the command line the same thing is \`schtasks\`. **Use a test task that does something harmless**, and delete it afterwards.`,
    { local: `**Task Scheduler from the command line (a harmless test).** First a script that appends one line to a file, \`C:\\fde\\py-recap\\heartbeat.py\`:
\`\`\`python
from datetime import datetime
from pathlib import Path

with open(Path(__file__).with_name("heartbeat.log"), "a", encoding="utf-8") as f:
    f.write(datetime.now().isoformat(timespec="seconds") + " ran\\n")
\`\`\`
Create a task that runs it every 5 minutes (replace the Python path with yours; the quotes are important):
\`\`\`powershell
schtasks /Create /TN "FDE\\Heartbeat" /SC MINUTE /MO 5 /TR "\\"C:\\fde\\kollana-reports\\.venv\\Scripts\\python.exe\\" C:\\fde\\py-recap\\heartbeat.py"
schtasks /Query /TN "FDE\\Heartbeat" /V /FO LIST
schtasks /Run /TN "FDE\\Heartbeat"
Get-Content C:\\fde\\py-recap\\heartbeat.log
schtasks /Delete /TN "FDE\\Heartbeat" /F
\`\`\`
Expected: \`/Create\` prints \`SUCCESS: The scheduled task "FDE\\Heartbeat" has successfully been created.\`, \`/Run\` starts it at once, and \`heartbeat.log\` gets a new line. \`/Query ... /V /FO LIST\` shows the settings as a list. These are the fields to read (this example is a built-in Windows task, so the values are Microsoft's; the names are the same for yours):
\`\`\`text
TaskName:                             \\Microsoft\\Windows\\Defrag\\ScheduledDefrag
Next Run Time:                        N/A
Status:                               Ready
Logon Mode:                           Interactive/Background
Last Run Time:                        05-10-2026 21:25:33
Last Result:                          0
Task To Run:                          %windir%\\system32\\defrag.exe -c -h -o -$
Start In:                             N/A
Scheduled Task State:                 Enabled
Power Management:                     Stop On Battery Mode, No Start On Batteries
Run As User:                          SYSTEM
Stop Task If Runs X Hours and X Mins: 72:00:00
Schedule Type:                        On demand only
\`\`\`
Read these lines for your own task: **Last Result** (0 = success), **Task To Run** (is the full path right?), **Start In**, **Run As User** and **Power Management** (a task set to "No Start On Batteries" will silently skip a night run on an unplugged laptop). The date format follows your Windows region settings.

**Common errors.** *Last Result 0x1 but it works by hand*: the Start in folder is empty or wrong, or the job needs environment variables that exist only in your window; set them in the script's \`.env\` or in the task's action. *Last Result 0x2*: wrong path to python.exe or to the script. *Task does not start at night*: laptop asleep or on battery; check the Conditions tab and "run as soon as possible after a missed start". *"The operator or administrator has refused the request"* (0x800710E0): the task asks for a user who is not logged on without a stored password. After a Windows password change, re-enter the password in the task.` },
    `## cron on Linux and in containers
On Linux, \`crontab -e\` opens your schedule, one line per job: the five fields, then the command. Three habits save hours:
\`\`\`text
# m h dom mon dow  command
0 2 1 * *  cd /srv/kollana && /srv/kollana/.venv/bin/python run.py --month previous >> /var/log/kollana/month_end.log 2>&1
\`\`\`
1. Use **full paths** (to the venv's Python), and \`cd\` into the project. Cron starts with a **very small environment** (a short \`PATH\`, no variables from your shell).
2. **Redirect output** to a log file (\`>> file 2>&1\`), or it disappears, or it is mailed to a local user nobody reads.
3. Remember the cron **time zone** (usually UTC on servers).

The same cron syntax appears in **Kubernetes CronJobs**, **GitHub Actions** (\`schedule:\`, in UTC, and runs can be delayed when the platform is busy), **Airflow** schedules and many cloud services (check each page for the exact flavour, for example Azure timer triggers use six fields).

## APScheduler: scheduling inside a Python program
**APScheduler** runs jobs from **inside your own Python process**. It is useful for a small service that must run something every few minutes, or when you need triggers cron lacks (for example the last day of the month). The process must **stay alive**: you run it as a service, a container, or a Task Scheduler task "at start-up".
\`\`\`python
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BlockingScheduler(timezone="Asia/Kolkata")
scheduler.add_job(
    month_end, CronTrigger(day="last", hour=2, minute=0),      # 02:00 on the last day of every month
    id="month_end",
    max_instances=1,            # never two copies at once (no overlap)
    coalesce=True,              # if several runs were missed, run once
    misfire_grace_time=3600,    # a run up to 1 hour late is still allowed
)
scheduler.start()               # blocks: the program now lives here
\`\`\`
The three settings are the important ones, and they are the same ideas you meet in every scheduler: **overlap** (\`max_instances\`), **missed runs** (\`misfire_grace_time\`, \`coalesce\`) and **time zone**. A job store (for example in a database) lets scheduled jobs survive a restart.`,
    { local: `**APScheduler on your laptop** (virtual environment active; \`pip install apscheduler\`; written for version 3.11, the 4.x line has a different API). Save as \`aps_demo.py\`:
\`\`\`python
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

tz = ZoneInfo("Asia/Kolkata")
now = datetime(2026, 10, 6, 12, 0, tzinfo=tz)


def next_times(trigger, count=3):
    times, previous = [], None
    for _ in range(count):
        nxt = trigger.get_next_fire_time(previous, previous + timedelta(seconds=1) if previous else now)
        times.append(nxt.strftime("%a %d %b %Y %H:%M"))
        previous = nxt
    return times


print("0 2 1 * *      ", next_times(CronTrigger.from_crontab("0 2 1 * *", timezone=tz)))
print("30 6 * * 1-5   ", next_times(CronTrigger.from_crontab("30 6 * * 1-5", timezone=tz)))
print("day=last 02:00 ", next_times(CronTrigger(day="last", hour=2, minute=0, timezone=tz)))
print("*/15 9-11 * * *", next_times(CronTrigger.from_crontab("*/15 9-11 * * *", timezone=tz), 4))

runs = []
def job():
    runs.append(time.time())

scheduler = BackgroundScheduler(timezone=tz)
scheduler.add_job(job, "interval", seconds=1, id="tick", max_instances=1, coalesce=True, misfire_grace_time=30)
scheduler.start()
time.sleep(3.5)
scheduler.shutdown()
print("interval job ran", len(runs), "times in 3.5 s")
\`\`\`
Output to expect:
\`\`\`text
0 2 1 * *       ['Sun 01 Nov 2026 02:00', 'Tue 01 Dec 2026 02:00', 'Fri 01 Jan 2027 02:00']
30 6 * * 1-5    ['Wed 07 Oct 2026 06:30', 'Thu 08 Oct 2026 06:30', 'Fri 09 Oct 2026 06:30']
day=last 02:00  ['Sat 31 Oct 2026 02:00', 'Mon 30 Nov 2026 02:00', 'Thu 31 Dec 2026 02:00']
*/15 9-11 * * * ['Wed 07 Oct 2026 09:00', 'Wed 07 Oct 2026 09:15', 'Wed 07 Oct 2026 09:30', 'Wed 07 Oct 2026 09:45']
interval job ran 3 times in 3.5 s
\`\`\`
The first line is the same answer as our hand-made matcher; the third line is the "last day" trigger that cron cannot express.` },
    `## Designing jobs that are safe to schedule
Most scheduling pain is not about the scheduler. It is about the job. A job that is going to run unattended must have these properties:
1. **Parameterised by the logical date, not by "now".** \`run.py --month 2026-09\`, with \`--month previous\` computed from the **scheduled** time. Then a late or repeated run still processes the right month.
2. **Idempotent.** Running it twice for the same month gives the same result (upserts, replace-the-partition, atomic output). This is what makes catch-up, retries and manual re-runs safe (the Databases and Files lessons).
3. **No overlap.** A **lock** (the scheduler's "do not start a new instance", or a lock file you create exclusively) stops two copies running at once. A lock file needs a **stale lock** rule: if the old run died, the lock must expire.
4. **Business-day aware.** Month-end close is "business day 3", not "the 3rd". Keep a holiday calendar (a file or table), schedule **daily**, and let the script exit quietly if today is not the day.
5. **Exit code, log and alert.** Non-zero on failure (the CLI lesson), a log file (the Logging lesson), and an **alert on failure** (email, Teams message).
6. **A "did it run?" check.** The worst failure is the one that makes **no noise**: the laptop was off, the task was disabled, the password expired. Have the job write a **heartbeat** or "last success" record, and have something else (a person, another job) alert if the last success is **older than expected**.
7. **Upstream readiness.** If your input file arrives "sometime after midnight", do not assume it is there at 02:00: **wait** for it (poll with a time limit) or fail clearly.
8. **Timeouts.** A job that runs longer than the interval, or hangs, must be stopped and reported.

**A good rule for the missed-run policy:** after downtime, usually run **once** to catch up ("coalesce") for a data job, and run **every** missed period only when each period matters on its own (a daily extract for a specific date). Either way, the job is parameterised by the scheduled time and idempotent, so it is safe.`,
    { py: {
      title: 'Business days: month-end close dates, and "daily schedule, script decides"',
      starter: `import calendar
from datetime import date, timedelta

HOLIDAYS = {                                     # in a real job: loaded from a file or a table
    date(2026, 1, 26): "Republic Day",
    date(2026, 8, 15): "Independence Day",
    date(2026, 10, 2): "Gandhi Jayanti",
    date(2026, 12, 25): "Christmas Day",
}

def is_business_day(d):
    return d.weekday() < 5 and d not in HOLIDAYS      # Monday to Friday, and not a holiday

def nth_business_day(year, month, n):
    d, count = date(year, month, 1), 0
    while True:
        if is_business_day(d):
            count += 1
            if count == n:
                return d
        d += timedelta(days=1)

def last_business_day(year, month):
    d = date(year, month, calendar.monthrange(year, month)[1])
    while not is_business_day(d):
        d -= timedelta(days=1)
    return d

print(f"{'month':<10}{'BD1':>12}{'BD3':>12}{'BD5':>12}{'last BD':>12}")
for month in (8, 9, 10, 11, 12):
    row = [nth_business_day(2026, month, n).strftime("%a %d %b") for n in (1, 3, 5)]
    row.append(last_business_day(2026, month).strftime("%a %d %b"))
    print(f"{calendar.month_abbr[month]:<10}" + "".join(f"{x:>12}" for x in row))

print()
print("October 2026: the 1st is a Thursday, the 2nd is a holiday (Friday), so:")
print("   BD1 =", nth_business_day(2026, 10, 1), "| BD2 =", nth_business_day(2026, 10, 2), "<- Monday 5 October, not the 2nd")

# the pattern: a DAILY schedule, and the script decides whether today is its day
def should_run_today(today, business_day_number=3):
    return today == nth_business_day(today.year, today.month, business_day_number)

days = [date(2026, 10, 1) + timedelta(days=i) for i in range(10)]
print()
print("the scheduler fires every day; the script runs only on BD3:")
for d in days:
    print("  ", d.strftime("%a %d %b"), "RUN" if should_run_today(d) else "skip (not business day 3)")`,
      note: 'Cron could not express "3rd business day", but a daily trigger plus a four-line check can. The holiday set here has only fixed national holidays so that the example never goes out of date: in real work you load the official list for your company (it changes every year). In October 2026 the 2nd is a holiday, so the 2nd business day is Monday 5 October. Note that the "skip" days must exit with code 0, otherwise the scheduler reports a failure on almost every day of the month.',
    } },
    { py: {
      title: 'What happens at 09:15 while the 09:00 run is still going, and after the laptop slept?',
      starter: `from datetime import datetime, timedelta

def hhmm(t):
    return t.strftime("%H:%M")

# 1. OVERLAP: a run takes 20 minutes but the schedule fires every 15 minutes
def simulate(ticks, duration_min, allow_overlap):
    events, running_until = [], None
    for t in ticks:
        busy = running_until is not None and t < running_until
        if busy and not allow_overlap:
            events.append(f"{hhmm(t)}  tick skipped: the previous run is still going (until {hhmm(running_until)})")
            continue
        end = t + timedelta(minutes=duration_min)
        events.append(f"{hhmm(t)}  run started (ends {hhmm(end)})" + ("   <- TWO runs at once!" if busy else ""))
        running_until = end if running_until is None or end > running_until else running_until
    return events

start = datetime(2026, 10, 6, 9, 0)
ticks = [start + timedelta(minutes=15 * i) for i in range(6)]
print("overlap allowed (a common default):")
print("\\n".join("  " + e for e in simulate(ticks, 20, allow_overlap=True)))
print("max_instances=1 (do not start a new instance):")
print("\\n".join("  " + e for e in simulate(ticks, 20, allow_overlap=False)))

# 2. MISSED RUNS: an hourly job; the laptop slept from 09:20 to 12:10
schedule = [datetime(2026, 10, 6, h, 0) for h in range(8, 14)]
last_success = datetime(2026, 10, 6, 9, 0)
now = datetime(2026, 10, 6, 12, 10)
missed = [t for t in schedule if last_success < t <= now]
print()
print("scheduled hourly, last success 09:00, laptop back at 12:10. Missed:", [hhmm(t) for t in missed])
policies = {
    "skip them all": [],
    "coalesce: run once": missed[-1:],
    "run every missed one": missed,
}
done = set()                                   # run keys: the scheduled time identifies a run
for name, to_run in policies.items():
    print(f"  {name:<22} -> runs for", [hhmm(t) for t in to_run] or "nothing")
    for t in to_run:
        key = t.strftime("%Y-%m-%d %H:00")
        if key in done:
            print("     already done for", key, "(the line above did it) -> skipped: the run key makes a repeat harmless")
        done.add(key)

# 3. THE DEAD MAN'S SWITCH: alert when the last success is too old
def overdue(last_success, now, every_minutes, grace_minutes=10):
    return now - last_success > timedelta(minutes=every_minutes + grace_minutes)

print()
print("a hourly job, last success 09:00:")
for check in (datetime(2026, 10, 6, 10, 5), datetime(2026, 10, 6, 10, 15), datetime(2026, 10, 6, 12, 10)):
    print("  at", hhmm(check), "->", "ALERT: no success for too long" if overdue(last_success, check, 60) else "ok")`,
      note: 'With overlap allowed, the 09:15 tick starts a second copy while the first is still running: two writers on one table. With "do not start a new instance" the 09:15 and 09:30 ticks are skipped and the next run starts at 09:45. For missed runs there is no single right answer, which is why you choose per job: coalesce for a data refresh, every missed one when each hour must exist. The third part is the one people forget: a monitor that alerts when a success is overdue also catches a job that was never started at all.',
    } },
    { sketch: { w: 760, h: 288, caption: 'A scheduler only starts things: the safety of the run lives in how you design the job', items: [
      { t: 'box', x: 14, y: 36, w: 150, h: 76, label: 'trigger', sub: 'cron, Task Scheduler,\nAPScheduler', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 168, y1: 74, x2: 196, y2: 74 },
      { t: 'box', x: 200, y: 36, w: 164, h: 76, label: 'start the command', sub: 'right Python, folder,\nenvironment', fill: 'yellow', size: 16 },
      { t: 'arrow', x1: 368, y1: 74, x2: 396, y2: 74 },
      { t: 'box', x: 400, y: 36, w: 164, h: 76, label: 'your job', sub: 'idempotent, parameterised\nby the logical date', fill: 'green', size: 16 },
      { t: 'arrow', x1: 568, y1: 74, x2: 596, y2: 74 },
      { t: 'box', x: 600, y: 36, w: 146, h: 76, label: 'result', sub: 'exit code, log,\nalert', fill: 'pink', size: 16 },
      { t: 'note', x: 14, y: 134, w: 176, h: 70, fill: 'grey', size: 13, text: 'Overlap:\nlock, or "do not start\na new instance"' },
      { t: 'note', x: 202, y: 134, w: 176, h: 70, fill: 'grey', size: 13, text: 'Missed runs:\ncatch up once or\nrun each missed one' },
      { t: 'note', x: 390, y: 134, w: 176, h: 70, fill: 'grey', size: 13, text: 'Which day?\nbusiness days and\nholidays, checked by the job' },
      { t: 'note', x: 578, y: 134, w: 168, h: 70, fill: 'grey', size: 13, text: 'Did it run?\nheartbeat and an alert\nwhen a success is overdue' },
      { t: 'note', x: 14, y: 222, w: 732, h: 52, fill: 'yellow', size: 14, text: 'The scheduler says WHEN. These four notes say whether it is SAFE. When you need more than a laptop can give,\nan orchestrator (Airflow, Dagster, Azure Data Factory) provides them as features.' },
    ] } },
    `## Why you will outgrow a plain scheduler
Task Scheduler and cron are excellent for a few independent jobs. The signs that you are outgrowing them:
- **Jobs depend on each other**: "load, then validate, then build the report, then email". With cron you guess times (02:00, 02:20, 02:40) and hope the first finished.
- **You need retries with rules**, alerts, and a **history** of every run you can search and show to an auditor.
- **You need to re-run the past**: "run the pipeline again for June to August after the source was corrected" (a **backfill**).
- **Many people, many jobs, many machines**: who owns this task, where did it run, why did it fail last Tuesday?
- **Data availability, not time, should trigger the run**: "start when the bank file arrives".

**Orchestrators** (Apache Airflow, Dagster, Azure Data Factory, Prefect) are built for exactly this. You describe the jobs and their **dependencies as a graph (a DAG)**, give each a **schedule and a logical date**, and the system handles ordering, retries with backoff, backfills, alerts and a web UI with run history. They use the same ideas as this lesson: cron expressions, a logical date, idempotent tasks, locks (concurrency limits), and exit status. If your jobs are clean and parameterised, moving them to an orchestrator is a **configuration** change, not a rewrite. That is the reason to learn the habits now. You will meet Airflow, Dagster and ADF later in the course.`,
    { sketch: { w: 760, h: 300, caption: 'What a plain scheduler gives you, and what an orchestrator adds', items: [
      { t: 'table', x: 14, y: 36, title: 'what you need (orchestrators: Airflow, Dagster, ADF)', cols: ['need', 'Task Scheduler or cron', 'orchestrator'], colW: [270, 215, 240], rows: [['start a command at a time', 'yes', 'yes'], ['one job waits for another', 'no (you guess times)', 'yes: tasks in a graph'], ['retries with backoff, per task', 'basic or none', 'yes'], ['re-run for past dates (backfill)', 'no', 'yes'], ['run history, search, alerts', 'little', 'yes: a web UI'], ['start when a file arrives', 'no', 'yes: sensors and triggers']], rowH: 28, hl: [1, 3] },
      { t: 'note', x: 14, y: 244, w: 732, h: 48, fill: 'yellow', size: 14, text: 'Start with the simple tool. Move up when jobs depend on each other or need history and backfill.\nClean jobs move easily.' },
    ] } },
    { warn: `Things that go wrong with scheduled jobs:
- **"Works by hand, fails in the scheduler".** Wrong working directory ("Start in"), a different Python, missing environment variables, a different user. Use full paths and set the folder.
- **The laptop was asleep or on battery.** The night job never ran and nobody knew. Check the power conditions, and add a "last success" alert.
- **Overlapping runs** writing to the same table. Use a lock or "do not start a new instance".
- **A daylight-saving or time-zone surprise.** A job at 02:30 may not exist on the night the clocks change in some countries. Fix the zone and prefer UTC for servers.
- **Both day fields in cron.** \`0 6 1 * 1\` means the 1st **or** every Monday.
- **Non-idempotent jobs.** Catch-up runs, retries or a manual re-run add the data twice.
- **The skip days exit with an error.** A "business day 3" job that exits non-zero on every other day floods the alerts. Exit 0 and log "not today".
- **A stale lock file** from a crashed run blocks all future runs. Add an expiry.
- **Passwords and secrets in the task's arguments.** They are visible to others. Use environment variables or a secret store.
- **Output goes nowhere.** Cron mails it, Task Scheduler drops it. Always log to a file.
- **No alert for "did not run".** Alert on missing success, not only on failures.` },
    { pychallenge: {
      id: 'python-scheduling-ch1',
      prompt: 'Write `expand_field(field, low, high)` for one cron field. It returns the **sorted list of distinct integers** the field stands for. Supported forms, combined with commas: `*` (all values from `low` to `high`), a number, a range `a-b`, and steps `*/n` and `a-b/n`. Examples: `"*/15"` with 0 to 59 gives `[0, 15, 30, 45]`; `"1,10-12,*/20"` with 0 to 23 gives `[0, 1, 10, 11, 12, 20]`. Raise `ValueError` for anything invalid: empty text or an empty list item, a number outside `low..high`, a reversed range (`5-1`), a step of 0, a step on a single number (`5/2`), or text that is not a number.',
      starter: `def expand_field(field, low, high):
    # TODO: split on commas; for each part handle step, "*", range and number; check bounds; return a sorted list
    return []
`,
      tests: `assert expand_field("*", 0, 5) == [0, 1, 2, 3, 4, 5]
assert expand_field("5", 0, 59) == [5]
assert expand_field("1,15", 1, 31) == [1, 15]
assert expand_field("1-5", 0, 7) == [1, 2, 3, 4, 5]
assert expand_field("*/15", 0, 59) == [0, 15, 30, 45]
assert expand_field("10-20/5", 0, 59) == [10, 15, 20]
assert expand_field("1,10-12,*/20", 0, 23) == [0, 1, 10, 11, 12, 20]
assert expand_field("1,1,2-3,3", 0, 9) == [1, 2, 3]
assert expand_field("*/2", 1, 12) == [1, 3, 5, 7, 9, 11]
assert expand_field("0", 0, 0) == [0]

for bad, low, high in [("", 0, 59), ("60", 0, 59), ("0", 1, 31), ("a", 0, 59), ("5-1", 0, 59), ("*/0", 0, 59),
                       ("1,,2", 0, 59), ("5/2", 0, 59), ("1-", 0, 59), ("-3", 0, 59), ("1-70", 0, 59), ("*/x", 0, 59), ("*/-2", 0, 59)]:
    try:
        expand_field(bad, low, high)
        raise AssertionError(f"expected ValueError for {bad!r}")
    except ValueError:
        pass`,
      solution: `def expand_field(field, low, high):
    values = set()
    for part in field.split(","):
        if not part:
            raise ValueError("empty list item")
        has_step = "/" in part
        step = 1
        if has_step:
            part, step_text = part.split("/", 1)
            if not step_text.isdigit() or int(step_text) < 1:
                raise ValueError(f"bad step: {step_text!r}")
            step = int(step_text)
        if part == "*":
            start, end = low, high
        elif "-" in part:
            a, b = part.split("-", 1)
            if not (a.isdigit() and b.isdigit()):
                raise ValueError(f"bad range: {part!r}")
            start, end = int(a), int(b)
        elif part.isdigit() and not has_step:
            start = end = int(part)
        else:
            raise ValueError(f"bad value: {part!r}")
        if start < low or end > high or start > end:
            raise ValueError(f"out of range: {part!r}")
        values.update(range(start, end + 1, step))
    return sorted(values)
`,
      hint: 'Loop over `field.split(",")`. If a part contains "/", split off the step (it must be digits and at least 1). Then decide the start and end: `"*"` gives `low` and `high`; a part with "-" gives two numbers; a plain number (without a step) gives the same number twice; anything else is a `ValueError`. Check `start >= low`, `end <= high` and `start <= end`, then `values.update(range(start, end + 1, step))`. Return `sorted(values)`.',
    } },
    { pychallenge: {
      id: 'python-scheduling-ch2',
      prompt: 'The working `expand_field(field, low, high)` from challenge 1 is given. Write `cron_matches(expr, dt)`: does the five-field cron expression match this `datetime` (to the minute)? Fields: minute 0 to 59, hour 0 to 23, day of month 1 to 31, month 1 to 12, day of week 0 to 7 where **both 0 and 7 mean Sunday** (Python\'s `dt.weekday()` has Monday as 0). **Day rule:** if both the day-of-month field and the day-of-week field are restricted (they do not start with `*`) the day matches when **either** matches; otherwise both must match. Raise `ValueError` if the expression does not have exactly five valid fields.',
      starter: `def expand_field(field, low, high):
    values = set()
    for part in field.split(","):
        if not part:
            raise ValueError("empty list item")
        has_step = "/" in part
        step = 1
        if has_step:
            part, step_text = part.split("/", 1)
            if not step_text.isdigit() or int(step_text) < 1:
                raise ValueError(f"bad step: {step_text!r}")
            step = int(step_text)
        if part == "*":
            start, end = low, high
        elif "-" in part:
            a, b = part.split("-", 1)
            if not (a.isdigit() and b.isdigit()):
                raise ValueError(f"bad range: {part!r}")
            start, end = int(a), int(b)
        elif part.isdigit() and not has_step:
            start = end = int(part)
        else:
            raise ValueError(f"bad value: {part!r}")
        if start < low or end > high or start > end:
            raise ValueError(f"out of range: {part!r}")
        values.update(range(start, end + 1, step))
    return sorted(values)

def cron_matches(expr, dt):
    # TODO: split into 5 fields, expand each, map day of week 7 to 0, apply the day rule
    return False
`,
      tests: `from datetime import datetime

def d(*args):
    return datetime(*args)

assert cron_matches("0 2 1 * *", d(2026, 11, 1, 2, 0)) is True
assert cron_matches("0 2 1 * *", d(2026, 11, 1, 2, 1)) is False
assert cron_matches("0 2 1 * *", d(2026, 11, 2, 2, 0)) is False
assert cron_matches("*/15 9-11 * * *", d(2026, 10, 7, 10, 45)) is True
assert cron_matches("*/15 9-11 * * *", d(2026, 10, 7, 10, 40)) is False
assert cron_matches("*/15 9-11 * * *", d(2026, 10, 7, 12, 0)) is False
assert cron_matches("30 6 * * 1-5", d(2026, 10, 7, 6, 30)) is True
assert cron_matches("30 6 * * 1-5", d(2026, 10, 10, 6, 30)) is False
assert cron_matches("0 8 * * 0", d(2026, 10, 11, 8, 0)) is True
assert cron_matches("0 8 * * 7", d(2026, 10, 11, 8, 0)) is True
assert cron_matches("0 8 * * 0", d(2026, 10, 12, 8, 0)) is False
assert cron_matches("0 6 1 * 1", d(2026, 10, 1, 6, 0)) is True
assert cron_matches("0 6 1 * 1", d(2026, 10, 5, 6, 0)) is True
assert cron_matches("0 6 1 * 1", d(2026, 10, 6, 6, 0)) is False
assert cron_matches("0 6 1,15 4,7,10,1 *", d(2026, 10, 15, 6, 0)) is True
assert cron_matches("0 6 1,15 4,7,10,1 *", d(2026, 11, 15, 6, 0)) is False
assert cron_matches("0 6 */2 * 1", d(2026, 10, 7, 6, 0)) is False

for bad in ["* * * *", "* * * * * *", "61 * * * *", "* 24 * * *", "* * 0 * *", "* * * 13 *", "* * * * 8", "a b c d e"]:
    try:
        cron_matches(bad, d(2026, 10, 7, 6, 0))
        raise AssertionError(f"expected ValueError for {bad!r}")
    except ValueError:
        pass`,
      solution: `def expand_field(field, low, high):
    values = set()
    for part in field.split(","):
        if not part:
            raise ValueError("empty list item")
        has_step = "/" in part
        step = 1
        if has_step:
            part, step_text = part.split("/", 1)
            if not step_text.isdigit() or int(step_text) < 1:
                raise ValueError(f"bad step: {step_text!r}")
            step = int(step_text)
        if part == "*":
            start, end = low, high
        elif "-" in part:
            a, b = part.split("-", 1)
            if not (a.isdigit() and b.isdigit()):
                raise ValueError(f"bad range: {part!r}")
            start, end = int(a), int(b)
        elif part.isdigit() and not has_step:
            start = end = int(part)
        else:
            raise ValueError(f"bad value: {part!r}")
        if start < low or end > high or start > end:
            raise ValueError(f"out of range: {part!r}")
        values.update(range(start, end + 1, step))
    return sorted(values)

def cron_matches(expr, dt):
    fields = expr.split()
    if len(fields) != 5:
        raise ValueError("a cron expression needs exactly 5 fields")
    minute = expand_field(fields[0], 0, 59)
    hour = expand_field(fields[1], 0, 23)
    dom = expand_field(fields[2], 1, 31)
    month = expand_field(fields[3], 1, 12)
    dow = {v % 7 for v in expand_field(fields[4], 0, 7)}
    if dt.minute not in minute or dt.hour not in hour or dt.month not in month:
        return False
    dom_ok = dt.day in dom
    dow_ok = (dt.weekday() + 1) % 7 in dow
    if not fields[2].startswith("*") and not fields[4].startswith("*"):
        return dom_ok or dow_ok
    return dom_ok and dow_ok
`,
      hint: 'Split `expr` and check there are 5 fields; expand all five first (so invalid fields raise before any matching). For the weekday use `{v % 7 for v in expand_field(fields[4], 0, 7)}` so 7 becomes 0, and compare with `(dt.weekday() + 1) % 7`. Minute, hour and month must all match. For the day: if neither day field starts with `*`, use `dom_ok or dow_ok`, otherwise `dom_ok and dow_ok`.',
    } },
    { pychallenge: {
      id: 'python-scheduling-ch3',
      prompt: 'Write `acquire_lock(path, now, max_age=3600)` and `release_lock(path)`: a lock file that stops two runs overlapping. `acquire_lock` tries to create the file **exclusively** (it must not be possible for two callers to both succeed; use `os.open` with `O_CREAT | O_EXCL | O_WRONLY`) and writes `now` (a number of seconds) into it; it returns `True`. If the file already exists, read the stored time: if the lock is **older than `max_age`** seconds (`now - stored > max_age`) it is **stale** (the old run died): replace it with a new lock and return `True`; otherwise return `False`. `release_lock` removes the file and does nothing if it is already gone.',
      starter: `import os
from pathlib import Path

def acquire_lock(path, now, max_age=3600):
    # TODO: create the file exclusively and write now; if it exists, decide stale or busy
    return False

def release_lock(path):
    pass
`,
      tests: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as d:
    p = Path(d) / "month_end.lock"
    assert acquire_lock(p, now=1000.0) is True
    assert p.exists()
    assert acquire_lock(p, now=1500.0) is False
    assert acquire_lock(p, now=1000.0 + 3600) is False
    assert acquire_lock(p, now=1000.0 + 3601) is True
    assert acquire_lock(p, now=1000.0 + 3700) is False
    release_lock(p)
    assert not p.exists()
    release_lock(p)
    assert acquire_lock(p, now=5.0, max_age=10) is True
    assert acquire_lock(p, now=20.0, max_age=10) is True
    assert float(p.read_text()) == 20.0
    release_lock(p)

    q = Path(d) / "other.lock"
    assert acquire_lock(q, now=1) is True
    assert acquire_lock(Path(d) / "month_end.lock", now=2) is True
    assert acquire_lock(q, now=3) is False`,
      solution: `import os
from pathlib import Path

def acquire_lock(path, now, max_age=3600):
    path = Path(path)
    flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
    try:
        fd = os.open(path, flags)
    except FileExistsError:
        try:
            started = float(path.read_text())
        except (OSError, ValueError):
            started = None
        if started is not None and now - started <= max_age:
            return False
        path.unlink(missing_ok=True)
        try:
            fd = os.open(path, flags)
        except FileExistsError:
            return False
    with os.fdopen(fd, "w") as f:
        f.write(str(now))
    return True

def release_lock(path):
    Path(path).unlink(missing_ok=True)
`,
      hint: 'Use `os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)`: it raises `FileExistsError` when the file is already there. In that case read the stored time with `float(path.read_text())`; if `now - stored <= max_age` the lock is busy: return `False`. Otherwise `unlink` the old file and create the new one the same exclusive way. Write `str(now)` through `os.fdopen(fd, "w")`. `release_lock` is `Path(path).unlink(missing_ok=True)`.',
    } },
    { real: 'For Project A the scheduling story is: "`python run.py --month previous`, started on the 3rd business day at 02:00 by Task Scheduler (or cron in a container), idempotent, with a lock, a log, an exit code and an alert if no success was recorded by noon". That is also what you tell an interviewer. When the same job moves to Azure it becomes a timer trigger or an Airflow or Data Factory schedule with the same cron expression, the same logical date and the same idempotency rule. The first time a month-end run silently does not happen because a laptop was asleep, you will be glad of the heartbeat check.' },
    { interview: `**"How do you schedule a Python job?"**
Model answer: "On a laptop or a single server I use Task Scheduler or cron to run the virtual environment's Python with full paths and the right working directory. The job takes a date parameter such as \`--month previous\`, is idempotent, logs to a file and returns an exit code. I prevent overlap with a lock or the scheduler's single-instance setting, decide a missed-run policy, and alert both on failures and when a success is overdue. When jobs depend on each other or I need history and backfills, I move to an orchestrator such as Airflow."

**"Explain the cron expression \`0 2 1 * *\`, and what is the catch with day-of-month and day-of-week?"** "Minute 0, hour 2, day of month 1, every month, any weekday: 02:00 on the 1st of every month. If both day fields are restricted, cron runs the job when either matches, not both. And cron cannot express the last day of the month or the third business day, so I schedule daily and let the script check."

**"What if a scheduled run is missed because the machine was off?"** "It depends on the tool and the setting: Task Scheduler can run as soon as possible after a missed start, APScheduler has \`misfire_grace_time\` and \`coalesce\`. For data jobs I usually run once to catch up, and I design the job to be parameterised by the scheduled time and idempotent so a catch-up or a re-run is safe."

**"Why would you use an orchestrator instead of cron?"** "For dependencies between tasks, retries with backoff, backfills for past dates, run history and alerts in a UI, and triggering by data availability. They keep the same ideas, cron schedules, a logical date and idempotent tasks, but provide them as features instead of leaving them to scripts."` },
    `## Recap
- A **scheduler** only starts a command at a time. **cron** (five fields: minute, hour, day of month, month, day of week; \`*\`, lists, ranges, steps) is understood almost everywhere. With both day fields restricted, **either** matches. Cron cannot say "last day" or "3rd business day": schedule **daily** and let the script decide.
- **Windows Task Scheduler**: action = the venv's \`python.exe\` plus arguments, **Start in** = the project folder, settings for missed starts and "do not start a new instance", power conditions on a laptop, and the **Last Result** exit code. \`schtasks\` is the command line. **cron** on Linux needs full paths, redirected output and the right time zone.
- **APScheduler** runs inside a Python process: \`CronTrigger\`, \`max_instances\`, \`coalesce\`, \`misfire_grace_time\`, time zone.
- **Design for scheduling**: parameterise by the logical date, make the job idempotent, prevent overlap (lock with a stale rule), know the business days and holidays, return exit codes, log, alert on failure **and on a missing success**, wait for upstream data, set timeouts.
- **Outgrow it** when jobs depend on each other or need backfills, history and alerts: an **orchestrator** provides those. Clean, idempotent, parameterised jobs move over easily.`,
  ],
  quiz: [
    { q: 'What does the cron expression `0 2 1 * *` mean?', o: ['every 2 minutes on the 1st', 'at 02:00 on every Monday', 'at 01:02 every day', 'at 02:00 on the 1st day of every month'], a: 3, why: 'The fields are minute 0, hour 2, day of month 1, every month, every weekday: 02:00 on the 1st of each month.' },
    { q: 'What does `0 6 1 * 1` do?', o: ['runs at 06:00 on the 1st and also on every Monday', 'runs at 06:00 only when the 1st is a Monday', 'runs every minute', 'is invalid'], a: 0, why: 'When both day-of-month and day-of-week are restricted, cron fires if either matches, so it runs on the 1st and on every Monday.' },
    { q: 'A Task Scheduler task works when you run the script by hand but fails at night with Last Result 0x1. Which setting do you check first?', o: ['the font of the script', 'the screen resolution', 'the "Start in" folder and the full path to the virtual environment\'s python.exe', 'the Python version number only'], a: 2, why: 'The scheduler starts the program from its own folder and environment. Relative paths and the wrong Python are the usual causes of "works by hand, fails scheduled".' },
    { q: 'You need a job on the 3rd business day of each month. What is the practical approach?', o: ['write it in cron as `0 2 3 * *`', 'schedule it daily and let the script exit quietly unless today is business day 3 (using a holiday calendar)', 'run it by hand', 'schedule it every minute and delete the extra output'], a: 1, why: 'Cron cannot express business days. A daily trigger plus a date check in the script handles holidays and weekends correctly.' },
    { q: 'Why must a scheduled job be idempotent?', o: ['so it runs faster', 'because Python requires it', 'because catch-up runs, retries and manual re-runs can execute it twice for the same period', 'to avoid needing a log'], a: 2, why: 'After downtime or a failure the same period may be processed again. An idempotent job gives the same result, so a repeat does no harm.' },
    { q: 'Which is a real sign that you are outgrowing Task Scheduler or cron?', o: ['you have a single script that runs monthly', 'jobs depend on each other, you need backfills for past dates, and a history with alerts', 'your script has a docstring', 'you use a virtual environment'], a: 1, why: 'Dependencies, backfills, run history and alerts are what orchestrators such as Airflow, Dagster and Data Factory provide.' },
  ],
  task: {
    title: 'Schedule a harmless job, guard it, and build a business-day trigger',
    steps: [
      'In `C:\\fde\\py-recap` create `heartbeat.py` and the test task from the laptop box (`schtasks /Create ... /SC MINUTE /MO 5`). Run it with `schtasks /Run`, read `heartbeat.log`, read the **Last Result** and **Start In** fields with `/Query /V /FO LIST`, then delete the task with `/Delete`. Open Task Scheduler\'s GUI and find the same task\'s Conditions and Settings tabs before you delete it.',
      'Install APScheduler and run `aps_demo.py`. Add a fourth trigger for your own month-end schedule (`day="last"`, 02:00, `Asia/Kolkata`) and print the next three run times.',
      'Write `expand_field` and `cron_matches` (challenges 1 and 2) in `cron_tools.py`, plus `next_runs(expr, after, count)` as in the lesson. Check your output against APScheduler for `0 2 1 * *` and `30 6 * * 1-5`.',
      'Write `business_days.py` with `is_business_day`, `nth_business_day` and `last_business_day` and a holidays file `holidays_2026.txt` (one date per line) that you load. Print the BD1, BD3 and last business day for FY2026-27 (April 2026 to March 2027).',
      'Add `acquire_lock` and `release_lock` (challenge 3) to your `run.py` from the CLI lesson. Start it twice at the same time (two PowerShell windows) and show that the second exits with code 4 and the message "another run is active".',
      'Add a "last success" file written at the end of a successful run, and a small `check_overdue.py` that exits with code 1 and prints an alert text when the last success is older than 26 hours. Describe in three sentences how you would run `check_overdue.py` independently of the job.',
    ],
    deliverable: 'The `schtasks` query output, `aps_demo.py` output, `cron_tools.py`, `business_days.py` with the FY2026-27 table, and the two-window lock test.',
  },
};
