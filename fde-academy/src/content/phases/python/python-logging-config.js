export default {
  id: 'python-logging-config',
  title: 'Logging and configuration',
  goal: 'You can replace print with the logging module (levels, loggers, handlers, formatters, one logger per module, no secrets in logs) and load configuration from defaults, files and environment variables, validated at start-up, with secrets kept out of the code.',
  roadmap: ['logging levels and handlers', 'one logger per module', 'environment variables', '.env files', 'YAML and TOML configuration'],
  blocks: [
    `## The problem
Your month-end job runs at 2 a.m. In the morning the report is missing and the only output is a window that closed itself. Even with a log file made of \`print\` lines you cannot tell **when** things happened, **which** step failed, or whether the warning on line 40 is new. And the script contains a database password and the name of a server, so it cannot be shared, and it behaves the same on your laptop and on the production server, which is exactly what you do not want.

These are two separate habits, and every professional script has both:
- **Logging** answers "**what happened** during this run?", after the fact, without anyone watching.
- **Configuration** answers "**how is this run set up**?" (which database, which month, how verbose) without editing the code, and keeps **secrets out of the code**.

Together they make a script something a team can operate: when it fails, the log tells you why; when you move it to another machine, you change settings, not code.`,
    `## Logging: more than a fancy print
The standard \`logging\` module gives you what \`print\` cannot: a **timestamp**, a **level** (how serious), the **place** the message came from, and a choice of **destinations** (screen, file, a log service), all configurable **without changing the lines that write messages**.

**Levels** run from detail to disaster:

| Level | Number | Use it for |
|---|---|---|
| \`DEBUG\` | 10 | details that help while developing (a row, a SQL text) |
| \`INFO\` | 20 | normal milestones: "started", "612 journals loaded", "finished in 12 s" |
| \`WARNING\` | 30 | unexpected but handled: "4 unbalanced journals", "retry 2 of 3" |
| \`ERROR\` | 40 | an operation failed: "month 2026-09 could not be totalled" |
| \`CRITICAL\` | 50 | the job cannot continue |

A handler or logger set to a level shows that level **and everything more serious**. The surprise that catches every beginner: the default level is **WARNING**, so a plain \`logging.info("...")\` shows **nothing** until you configure logging.

**Four parts, each with one job:**
- A **logger** is the object you call (\`log.info(...)\`). Loggers have **dotted names that form a tree**: \`kollana.reports.gl\` is a child of \`kollana.reports\`, which is a child of \`kollana\`, which is a child of the **root** logger. A message travels **up** the tree.
- A **handler** sends a message to a destination: \`StreamHandler\` (console), \`FileHandler\`, \`RotatingFileHandler\` (starts a new file at a size limit and keeps a few old ones), \`TimedRotatingFileHandler\` (one file per day).
- A **formatter** decides how the line looks: \`"%(asctime)s %(levelname)-8s %(name)s: %(message)s"\`.
- A **level** on the logger and on each handler is the filter. You can show INFO on the screen and DEBUG in the file.`,
    { sketch: { w: 760, h: 296, caption: 'A log call is checked against the logger level, then travels to handlers that format it for each destination', items: [
      { t: 'box', x: 14, y: 54, w: 148, h: 70, label: 'your code', sub: 'log.info("loaded %s", n)', fill: 'blue', size: 16 },
      { t: 'arrow', x1: 166, y1: 89, x2: 208, y2: 89 },
      { t: 'box', x: 212, y: 32, w: 196, h: 114, label: 'Logger', sub: 'level check:\ntoo low = dropped', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 412, y1: 89, x2: 454, y2: 89 },
      { t: 'box', x: 458, y: 32, w: 132, h: 114, label: 'Handlers', sub: 'own level and\nown Formatter', fill: 'green', size: 17 },
      { t: 'arrow', x1: 594, y1: 56, x2: 634, y2: 40 },
      { t: 'arrow', x1: 594, y1: 89, x2: 634, y2: 89 },
      { t: 'arrow', x1: 594, y1: 122, x2: 634, y2: 138 },
      { t: 'box', x: 638, y: 22, w: 108, h: 36, label: 'console', fill: 'white', size: 15 },
      { t: 'box', x: 638, y: 71, w: 108, h: 36, label: 'run.log', fill: 'white', size: 15 },
      { t: 'box', x: 638, y: 120, w: 108, h: 36, label: 'JSON lines', fill: 'white', size: 15 },
      { t: 'note', x: 14, y: 176, w: 360, h: 100, fill: 'grey', size: 13, text: 'The tree of names:\nroot > kollana > kollana.reports > kollana.reports.gl\nA record travels UP, so one handler on the root\nlogger serves the whole application.' },
      { t: 'note', x: 392, y: 176, w: 354, h: 100, fill: 'pink', size: 13, text: 'Configure handlers ONCE, at the program entry\npoint. Modules only create a logger and call it.\nLibraries never add handlers of their own.' },
    ] } },
    { sketch: { w: 760, h: 268, caption: 'The five levels: choose the lowest level that still tells the right story', items: [
      { t: 'table', x: 14, y: 40, title: 'what each level is for in a finance job', cols: ['level', 'number', 'example message'], colW: [120, 90, 500], rows: [['DEBUG', '10', 'row 4812: debit=1250.50 credit=0 account=6110'], ['INFO', '20', 'loaded 612 journals from fact_gl.csv'], ['WARNING', '30', '4 of 612 journals are unbalanced (written to rejects.csv)'], ['ERROR', '40', 'could not total month 2026-09: database timeout'], ['CRITICAL', '50', 'configuration missing, the job cannot start']], rowH: 28, hl: [1] },
      { t: 'note', x: 14, y: 220, w: 732, h: 40, fill: 'yellow', size: 14, text: 'Production usually runs at INFO. Switch to DEBUG for one run when you investigate, using configuration, not an edit.' },
    ] } },
    { py: {
      title: 'Levels, a logger tree, handlers and a formatter',
      starter: `import logging
import sys

root = logging.getLogger()
root.handlers[:] = []                          # start clean: the playground keeps logging state between runs
root.setLevel(logging.WARNING)                 # this is Python's default level

logging.info("1. invisible: the default level is WARNING")
logging.warning("2. visible: warnings get through even with no setup")

def setup(level):
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(levelname)-8s %(name)-20s %(message)s"))
    root.handlers[:] = [handler]               # REPLACE the handlers: adding on every call prints each line twice
    root.setLevel(level)

setup(logging.DEBUG)
log = logging.getLogger("kollana.reports")     # in a real module: logging.getLogger(__name__)
child = logging.getLogger("kollana.reports.gl")   # a child: its records travel UP to the root handler

log.debug("debug: details for the developer")
log.info("loaded %s rows from %s", 1227, "fact_gl.csv")      # lazy %-style arguments, not an f-string
log.warning("%d of %d journals are unbalanced", 4, 612)
child.error("account %s has no parent account", 6999)
try:
    1 / 0
except ZeroDivisionError:
    log.exception("could not total the month")                # ERROR plus the full traceback
log.critical("database unreachable, stopping")

print("--- raise the level to WARNING: INFO and DEBUG disappear")
root.setLevel(logging.WARNING)
log.info("this INFO line is hidden")
log.warning("this WARNING line still shows")

print("--- quiet one noisy part only")
root.setLevel(logging.INFO)
logging.getLogger("kollana.reports.gl").setLevel(logging.ERROR)
child.warning("hidden: its own level is ERROR")
child.error("shown")
log.info("the parent logger is not affected")`,
      note: 'Three things to notice. First, a message below the level is dropped silently, which is why the first line printed nothing. Second, the child logger kollana.reports.gl has no handler of its own, yet its message appears: it travels up to the root handler. Third, "%s" arguments are only turned into text if the message is actually used, which is cheaper than an f-string when the level is off.',
    } },
    `## What to log, and what never to log
**Log the story of the run:** start and end, the **counts** at each stage (rows read, accepted, rejected, loaded), the **durations**, the **settings in use** (not secrets), warnings for handled oddities, and \`log.exception\` (an ERROR with the traceback) inside every \`except\` that handles a failure. A good log lets someone who was not there answer "what happened, to which data, and why".

**One logger per module** with \`log = logging.getLogger(__name__)\` at the top. The name tells you where each line came from, and you can raise or lower the level for one module. Configure handlers **only at the entry point** (the \`main\` of your script), because libraries that configure logging themselves cause duplicate lines and fights.

**Make runs traceable.** Put a **run id** in every line (a filter or a \`LoggerAdapter\` adds it) so you can pull one run out of a shared log file. For machines, write **JSON lines**: one JSON object per line with the same fields every time, which log tools can search and chart.

**Never log secrets or personal data.** Passwords, tokens, API keys, full PAN, full bank account numbers and salary figures must not be written to logs: logs are copied to many places and kept for a long time. Mask them (keep the last four digits), or log an id instead. \`SecretStr\` in Pydantic prints as \`**********\` for exactly this reason.

**Avoid** logging inside tight loops at INFO (a million lines helps nobody), \`print\` in production code, and \`log.error(e)\` without the traceback (use \`log.exception\`).`,
    { py: {
      title: 'A run id on every line and JSON log lines you can read back',
      starter: `import io
import json
import logging

class RunIdFilter(logging.Filter):
    """Adds the id of this run to every record that passes through the handler."""
    def __init__(self, run_id):
        super().__init__()
        self.run_id = run_id

    def filter(self, record):
        record.run_id = self.run_id
        return True

class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {"level": record.levelname, "logger": record.name,
                   "message": record.getMessage(), "run_id": getattr(record, "run_id", None)}
        if record.exc_info:
            payload["error"] = repr(record.exc_info[1])
        return json.dumps(payload)

buffer = io.StringIO()                         # stands in for a log file
handler = logging.StreamHandler(buffer)
handler.setFormatter(JsonFormatter())
handler.addFilter(RunIdFilter("run-2026-09-30-01"))

log = logging.getLogger("kollana.loader")
log.handlers[:] = [handler]
log.setLevel(logging.INFO)
log.propagate = False                          # do not also send these records to the root handlers

log.info("start")
log.info("loaded %d rows", 1227)
log.warning("rejected %d rows", 10)
try:
    int("TBD")
except ValueError:
    log.exception("bad amount")

for line in buffer.getvalue().splitlines():
    print(line)

# the point of structured logs: a tool (or you) can read them back as data
records = [json.loads(line) for line in buffer.getvalue().splitlines()]
print("levels:", [r["level"] for r in records])
print("one run id on every line:", len({r["run_id"] for r in records}) == 1)
print("warnings and errors:", [r["message"] for r in records if r["level"] in ("WARNING", "ERROR")])`,
      note: 'Because every line is one JSON object with the same keys, the last three lines can filter and count the log with ordinary Python. That is what log platforms do at scale. The run id lets you pick out one run from a file that holds many. In your own scripts you would write to a file handler instead of a StringIO.',
    } },
    { local: `**Logging to the screen and a rotating file on your laptop.** Save as \`run_demo.py\` in \`C:\\fde\\py-recap\`:
\`\`\`python
import logging
import logging.handlers
import sys

log = logging.getLogger("kollana.reports")          # in a module use __name__


def setup_logging(level="INFO", log_file="run.log"):
    root = logging.getLogger()
    root.setLevel(level)
    fmt = logging.Formatter("%(asctime)s %(levelname)-8s %(name)s: %(message)s", "%Y-%m-%d %H:%M:%S")
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(fmt)
    file = logging.handlers.RotatingFileHandler(log_file, maxBytes=1_000_000, backupCount=3, encoding="utf-8")
    file.setFormatter(fmt)
    root.handlers[:] = [console, file]               # replace, so calling it twice cannot duplicate lines


def load_month(month):
    log.info("loading month %s", month)
    log.debug("this debug line is hidden at INFO")
    try:
        return 1 / 0
    except ZeroDivisionError:
        log.exception("could not total month %s", month)


if __name__ == "__main__":
    setup_logging("INFO")
    load_month("2026-09")
    log.warning("3 of 612 journals are unbalanced")
\`\`\`
Run \`python run_demo.py\`. Output to expect on the screen **and** in \`run.log\` (the timestamp and the path in the traceback will be yours):
\`\`\`text
2026-10-06 23:03:24 INFO     kollana.reports: loading month 2026-09
2026-10-06 23:03:24 ERROR    kollana.reports: could not total month 2026-09
Traceback (most recent call last):
  File "C:\\fde\\py-recap\\run_demo.py", line 23, in load_month
    return 1 / 0
           ~~^~~
ZeroDivisionError: division by zero
2026-10-06 23:03:24 WARNING  kollana.reports: 3 of 612 journals are unbalanced
\`\`\`
Change \`setup_logging("INFO")\` to \`"DEBUG"\` and the debug line appears. \`maxBytes\` and \`backupCount\` mean: at about 1 MB the file is renamed to \`run.log.1\`, a new \`run.log\` starts, and only three old files are kept, so the log can never fill the disk.` },
    `## Configuration: settings that change without editing code
A program needs values that differ between your laptop, a test run and production: the database host, the month to process, the log level, a batch size, and **secrets** such as passwords and API keys. Writing them into the code is the classic mistake (and the classic leak, when the file goes to GitHub).

The rule of the "twelve-factor" style is simple: **the same code everywhere, the settings come from outside.** Settings are read from several **layers**, and a later layer **overrides** an earlier one:
1. **Defaults in code**: safe values that let the program start in development.
2. **A config file** (YAML or TOML) for non-secret settings that belong to the project and can be committed.
3. **Environment variables** (\`APP_DB_HOST\`, \`APP_BATCH_SIZE\`): the standard way for a server, a container or a CI job to inject settings and **all secrets**.
4. **Command-line arguments** (\`--month 2026-09\`): the most specific, for one run (the CLI lesson).

**Environment variables are always text.** \`os.environ["APP_BATCH_SIZE"]\` is \`"5000"\`, not 5000, and \`"false"\` is a non-empty string, which is true in Python. Convert and validate at start-up. \`os.environ["X"]\` raises \`KeyError\` when missing, \`os.environ.get("X", default)\` does not.

**\`.env\` files.** During development you do not want to set five variables by hand every time. A \`.env\` file (lines like \`APP_DB_PASSWORD=...\`) is read by \`python-dotenv\` or \`pydantic-settings\` into the environment. Rules: **add \`.env\` to \`.gitignore\`**, commit a \`.env.example\` with the names and fake values, and never use \`.env\` for production secrets (production gets real environment variables or a secret store such as Azure Key Vault, which you meet later).

**File formats.** **TOML** (\`tomllib\`, built in since Python 3.11, read-only) is clear for settings and is what \`pyproject.toml\` uses. **YAML** (\`pyyaml\`, always \`yaml.safe_load\`) allows lists and nesting and is common in data tools. **JSON** has no comments, so it is a poor choice for hand-edited settings.

**Validate at start-up and fail fast.** Turn the raw values into a **typed settings object** (a Pydantic model), so a missing password or a batch size of 0 stops the program **at the start** with a clear message instead of failing an hour into the run.`,
    { sketch: { w: 760, h: 292, caption: 'Settings come in layers: each layer overrides the one below. Secrets only travel in the environment', items: [
      { t: 'box', x: 14, y: 218, w: 470, h: 56, label: '1. defaults in code', sub: 'safe values, the program can start', fill: 'grey' },
      { t: 'box', x: 14, y: 156, w: 470, h: 56, label: '2. config file (YAML or TOML)', sub: 'project settings, committed to git, no secrets', fill: 'blue' },
      { t: 'box', x: 14, y: 94, w: 470, h: 56, label: '3. environment variables (and .env in development)', sub: 'APP_DB_HOST, APP_BATCH_SIZE, ALL secrets', fill: 'yellow' },
      { t: 'box', x: 14, y: 32, w: 470, h: 56, label: '4. command-line arguments', sub: '--month 2026-09, for this run only', fill: 'green' },
      { t: 'arrow', x1: 520, y1: 262, x2: 520, y2: 46 },
      { t: 'text', x: 520, y: 26, text: 'higher wins', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'note', x: 568, y: 32, w: 178, h: 112, fill: 'pink', size: 13, text: 'Validate everything at\nstart-up into a typed\nsettings object. A bad or\nmissing value stops the\njob BEFORE it starts.' },
      { t: 'note', x: 568, y: 160, w: 178, h: 112, fill: 'yellow', size: 13, text: '.env is for your laptop:\nin .gitignore. Commit\n.env.example with fake\nvalues. Production uses\nreal env vars or a vault.' },
    ] } },
    { py: {
      title: 'Layered settings from TOML, YAML and the environment, validated with Pydantic',
      starter: `import tomllib
import yaml
from typing import Literal
from pydantic import BaseModel, Field, SecretStr, ValidationError

DEFAULTS = {"db_host": "localhost", "db_port": 5432, "db_name": "fde_practice",
            "log_level": "INFO", "batch_size": 1000}

toml_text = """
db_host = "db.internal"          # TOML: comments and clear types
batch_size = 5000
"""
yaml_text = """
db_name: kollana_prod            # YAML: also popular in data tools
log_level: DEBUG
"""

class Settings(BaseModel):
    db_host: str
    db_port: int                                  # an env var is text: Pydantic converts "5432" to 5432
    db_name: str
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"]
    batch_size: int = Field(gt=0)
    db_password: SecretStr                        # no default: required

def load(environ, prefix="APP_"):
    raw = dict(DEFAULTS)                          # layer 1: defaults in code
    raw.update(tomllib.loads(toml_text))          # layer 2: config files
    raw.update(yaml.safe_load(yaml_text))
    for key in list(DEFAULTS) + ["db_password"]:  # layer 3: environment variables win
        if prefix + key.upper() in environ:
            raw[key] = environ[prefix + key.upper()]
    return Settings(**raw)

fake_env = {"APP_DB_PASSWORD": "s3cret-value", "APP_DB_PORT": "6543", "UNRELATED": "x"}
settings = load(fake_env)
print(settings)
print("port is a real int:", settings.db_port + 1, "| secret length:", len(settings.db_password.get_secret_value()))

print("--- fail fast: the password is missing and the batch size is wrong")
try:
    load({"APP_BATCH_SIZE": "0"})
except ValidationError as exc:
    for err in exc.errors():
        print("  ", err["loc"][0], "->", err["type"])

print("--- the classic env-var trap: the text 'false' is truthy")
flag = "false"
print(bool(flag), "| a proper parse:", flag.strip().lower() in {"1", "true", "yes", "on"})`,
      note: 'The result shows the layers: db_host comes from TOML, db_name and log_level from YAML, the port and password from the environment, and the rest from the defaults. The password prints as SecretStr with stars, so it cannot slip into a log by accident. The failure case reports both problems at once, before any work has started.',
    } },
    { local: `**Settings class with \`pydantic-settings\` (read \`.env\` and environment variables) on your laptop.** Needs \`pip install pydantic-settings\`. Save as \`settings_demo.py\`:
\`\`\`python
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", env_file_encoding="utf-8")

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "fde_practice"
    db_user: str = "postgres"
    db_password: SecretStr                       # required: no default
    log_level: str = "INFO"
    batch_size: int = Field(1000, gt=0)


if __name__ == "__main__":
    settings = Settings()
    print(settings)
    print("password length:", len(settings.db_password.get_secret_value()))
\`\`\`
Create \`.env\` next to it (and add \`.env\` to \`.gitignore\`):
\`\`\`text
APP_DB_PASSWORD=s3cret-value
APP_BATCH_SIZE=5000
APP_LOG_LEVEL=DEBUG
\`\`\`
Output to expect (tested with pydantic 2.13 and pydantic-settings 2.15; the stars hide the secret):
\`\`\`text
db_host='localhost' db_port=5432 db_name='fde_practice' db_user='postgres' db_password=SecretStr('**********') log_level='DEBUG' batch_size=5000
password length: 12
\`\`\`
Now see the layers: in PowerShell run \`$env:APP_BATCH_SIZE = "250"; python settings_demo.py\`: the environment variable **beats** \`.env\` and \`batch_size\` becomes 250. Delete \`.env\` and run again: Python stops with \`1 validation error for Settings: db_password: Field required\`, which is the fail-fast behaviour. Set \`$env:APP_BATCH_SIZE = "0"\` and you get \`Input should be greater than 0\`. Remove the variable afterwards with \`Remove-Item Env:APP_BATCH_SIZE\`.

With \`python-dotenv\` alone it is two lines: \`from dotenv import load_dotenv\` and \`load_dotenv()\`, after which \`os.environ["APP_DB_PASSWORD"]\` works.` },
    { warn: `Things that go wrong with logging and configuration:
- **\`logging.info\` shows nothing.** The default level is WARNING. Configure the level once at the entry point.
- **Duplicate log lines.** A handler is added every time \`setup\` runs, or both a child and the root have handlers (propagation). Replace the handlers (\`root.handlers[:] = [...]\`) and configure once.
- **\`logging.basicConfig\` in a library or at import time.** Libraries must not configure logging. Only the application's \`main\` does.
- **f-strings in log calls** (\`log.info(f"...")\`): the text is built even when the level is off. Use \`log.info("loaded %s rows", n)\`.
- **Passwords, tokens, full PAN or account numbers in logs.** Mask or leave them out. Never log a whole request or the whole settings object unless secrets are \`SecretStr\`.
- **\`log.error(e)\` instead of \`log.exception\`.** You lose the traceback.
- **A secret in the code, in \`config.yaml\` or in git history.** If it ever reached git, treat it as leaked and rotate it (the Git phase covers recovery).
- **Environment variables are text.** \`"false"\` is truthy and \`"5000"\` is not a number until converted.
- **No validation.** A missing setting should stop the job at start-up with a clear message, not fail after an hour.
- **Different code per environment** (\`if prod:\` blocks everywhere). Use settings, not branches.` },
    { pychallenge: {
      id: 'python-logging-config-ch1',
      prompt: 'Write `make_logger(name, stream, level="INFO")`. It returns the logger called `name`, set to `level`, with **exactly one** `StreamHandler` writing to `stream` in the format `"%(levelname)s %(name)s: %(message)s"`, and with `propagate` turned off. Calling it again for the same name with a new level must **not** create duplicate lines: it replaces the handler. Lines below the level are not written.',
      starter: `import logging

def make_logger(name, stream, level="INFO"):
    # TODO: get the logger, set the level, replace its handlers with ONE StreamHandler(stream), no propagation
    return logging.getLogger(name)
`,
      tests: `import io
import logging

s = io.StringIO()
log = make_logger("t.one", s, "INFO")
log.debug("hidden")
log.info("hello %s", "world")
log.warning("careful")
assert s.getvalue().splitlines() == ["INFO t.one: hello world", "WARNING t.one: careful"], s.getvalue()

log2 = make_logger("t.one", s, "WARNING")
assert log2 is log
s.truncate(0)
s.seek(0)
log2.info("hidden now")
log2.error("boom")
assert s.getvalue().splitlines() == ["ERROR t.one: boom"], s.getvalue()
assert log.propagate is False
assert len(log.handlers) == 1`,
      solution: `import logging

def make_logger(name, stream, level="INFO"):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    handler = logging.StreamHandler(stream)
    handler.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
    logger.handlers[:] = [handler]
    logger.propagate = False
    return logger
`,
      hint: 'Use `logging.getLogger(name)` and `logger.setLevel(level)` (a level name such as "INFO" is accepted). Create a `StreamHandler(stream)`, give it a `Formatter("%(levelname)s %(name)s: %(message)s")`, then replace the handler list with `logger.handlers[:] = [handler]` and set `logger.propagate = False`.',
    } },
    { pychallenge: {
      id: 'python-logging-config-ch2',
      prompt: 'Write `mask_sensitive(text)` for log lines. (1) A PAN (five capital letters, four digits, one capital letter, as a whole word) becomes `[PAN]`. (2) A whole-word run of 9 to 18 digits (a bank account number) becomes `****` plus its last four digits. (3) In `password=...`, `token=...`, `secret=...` and `api_key=...` (any letter case, the value runs to the next space) the value becomes `***` and the key is kept as written. Everything else is unchanged.',
      starter: `import re

def mask_sensitive(text):
    # TODO: three re.sub steps: PAN, account numbers (keep the last 4 digits), key=value secrets
    return text
`,
      tests: `assert mask_sensitive("Paid to PAN AAHCN9902L ok") == "Paid to PAN [PAN] ok"
assert mask_sensitive("account 18163244337 credited") == "account ****4337 credited"
assert mask_sensitive("login password=hunter2 token=abc.def ok") == "login password=*** token=*** ok"
assert mask_sensitive("API_KEY=xyz123 and Password=Pa55") == "API_KEY=*** and Password=***"
assert mask_sensitive("invoice INV/0042/25-26 amount 125000") == "invoice INV/0042/25-26 amount 125000"
assert mask_sensitive("") == ""
assert mask_sensitive("two 111122223333 and 444455556666") == "two ****3333 and ****6666"
assert mask_sensitive("password=123456789012") == "password=***"
assert mask_sensitive("nothing secret here") == "nothing secret here"`,
      solution: `import re

PAN = re.compile(r"\\b[A-Z]{5}\\d{4}[A-Z]\\b")
ACCOUNT = re.compile(r"\\b\\d{9,18}\\b")
SECRET = re.compile(r"(?i)\\b(password|token|secret|api_key)=\\S+")

def mask_sensitive(text):
    text = PAN.sub("[PAN]", text)
    text = ACCOUNT.sub(lambda m: "****" + m.group()[-4:], text)
    return SECRET.sub(lambda m: m.group(1) + "=***", text)
`,
      hint: 'Make three compiled patterns: `\\b[A-Z]{5}\\d{4}[A-Z]\\b` for PAN, `\\b\\d{9,18}\\b` for accounts and `(?i)\\b(password|token|secret|api_key)=\\S+` for secrets. For accounts pass a function to `sub`: `lambda m: "****" + m.group()[-4:]`. For secrets use `lambda m: m.group(1) + "=***"` so the key keeps its original letter case.',
    } },
    { pychallenge: {
      id: 'python-logging-config-ch3',
      prompt: 'The class `ConfigError` is given. Write `load_settings(environ, defaults, prefix)`. Start from `defaults`; for each key look for the environment variable `prefix + KEY.upper()` in the dict `environ`. Convert the text to the type of the default: a `bool` default accepts `true/1/yes/on` (True) and `false/0/no/off/empty` (False) in any letter case; an `int` default uses `int()`; anything else stays text. A default of `None` means **required**. If required keys are missing, or a value cannot be converted, raise ONE `ConfigError` whose message lists `missing: key, key` and/or `invalid: key=\'value\'` (keys sorted). Otherwise return the dict of settings.',
      starter: `class ConfigError(Exception):
    pass

def load_settings(environ, defaults, prefix):
    # TODO: layer the environment over the defaults, convert types, collect missing and invalid keys
    return dict(defaults)
`,
      tests: `defaults = {"db_host": "localhost", "db_port": 5432, "debug": False, "db_password": None}
env = {"APP_DB_HOST": "db.internal", "APP_DB_PORT": "6543", "APP_DEBUG": "Yes", "APP_DB_PASSWORD": "s3cret", "OTHER": "x"}
assert load_settings(env, defaults, "APP_") == {"db_host": "db.internal", "db_port": 6543, "debug": True, "db_password": "s3cret"}

assert load_settings({"APP_DB_PASSWORD": "p"}, defaults, "APP_") == {"db_host": "localhost", "db_port": 5432, "debug": False, "db_password": "p"}
assert load_settings({"APP_DB_PASSWORD": "p", "APP_DEBUG": "0"}, defaults, "APP_")["debug"] is False

try:
    load_settings({}, defaults, "APP_")
    raise AssertionError("a missing required key must raise ConfigError")
except ConfigError as exc:
    assert "missing: db_password" in str(exc), str(exc)

try:
    load_settings({"APP_DB_PASSWORD": "p", "APP_DB_PORT": "abc", "APP_DEBUG": "maybe"}, defaults, "APP_")
    raise AssertionError("invalid values must raise ConfigError")
except ConfigError as exc:
    assert "invalid: db_port='abc', debug='maybe'" in str(exc), str(exc)

try:
    load_settings({"APP_DB_PORT": "x"}, defaults, "APP_")
    raise AssertionError("expected ConfigError")
except ConfigError as exc:
    assert "missing: db_password" in str(exc) and "invalid: db_port='x'" in str(exc), str(exc)`,
      solution: `class ConfigError(Exception):
    pass

TRUE = {"true", "1", "yes", "on"}
FALSE = {"false", "0", "no", "off", ""}

def load_settings(environ, defaults, prefix):
    result, missing, invalid = {}, [], []
    for key, default in defaults.items():
        raw = environ.get(prefix + key.upper())
        if raw is None:
            if default is None:
                missing.append(key)
            result[key] = default
            continue
        try:
            if isinstance(default, bool):
                low = raw.strip().lower()
                if low in TRUE:
                    value = True
                elif low in FALSE:
                    value = False
                else:
                    raise ValueError(raw)
            elif isinstance(default, int):
                value = int(raw)
            else:
                value = raw
        except ValueError:
            invalid.append(f"{key}={raw!r}")
            continue
        result[key] = value
    if missing or invalid:
        parts = []
        if missing:
            parts.append("missing: " + ", ".join(sorted(missing)))
        if invalid:
            parts.append("invalid: " + ", ".join(sorted(invalid)))
        raise ConfigError("; ".join(parts))
    return result
`,
      hint: 'Loop over `defaults.items()`. Read `environ.get(prefix + key.upper())`. If it is `None`, keep the default and note the key as missing when the default is `None`. Otherwise convert by the default\'s type: check `isinstance(default, bool)` BEFORE `int` (a bool is also an int). Collect `missing` and `invalid` lists, and raise one `ConfigError("; ".join(parts))` at the end if either has entries.',
    } },
    { real: 'On Project A these two habits turn a script into a job you can hand over. The README says "set `APP_DB_PASSWORD` and run `python run.py --month 2026-09`"; the log file shows what happened last night with counts and rejects; a settings object refuses to start when something is missing; and nothing secret is in git. When you move to Azure later, the same code reads the same names from App Service or Container Apps settings and Key Vault, and the log lines flow to the monitoring tool, because you used standard logging and environment variables.' },
    { interview: `**"Why use \`logging\` instead of \`print\`?"**
Model answer: "Logging adds timestamps, levels and the logger name, can send output to several places such as the console and a rotating file, and lets me change the verbosity through configuration without editing code. I use one logger per module with \`getLogger(__name__)\`, configure handlers once at the entry point, use \`log.exception\` for failures, and never log secrets or personal data."

**"What are the logging levels and what is the default?"** "DEBUG, INFO, WARNING, ERROR and CRITICAL. The default level is WARNING, so INFO messages do not appear until logging is configured. I run production at INFO and switch to DEBUG for investigations."

**"How do you manage configuration and secrets?"** "The same code runs everywhere and settings come from outside: defaults in code, a config file for non-secret settings, environment variables for environment-specific values and all secrets, and command-line arguments per run. I validate them at start-up with a typed settings class so a missing value stops the job at once. \`.env\` is for local development and is git-ignored, and production uses real environment variables or a secret store."

**"An environment variable says \`DEBUG=false\` and your code treats it as true. Why?"** "Environment variables are strings and any non-empty string is truthy. I convert explicitly, for example by checking against a set of accepted true values, or I let Pydantic settings parse it."` },
    `## Recap
- Use **\`logging\`**, not \`print\`: levels (DEBUG 10, INFO 20, WARNING 30, ERROR 40, CRITICAL 50; the default is **WARNING**), **loggers** named by module (\`getLogger(__name__)\`), **handlers** for destinations (console, rotating file), **formatters** for the look. Messages travel **up** the logger tree.
- Configure handlers **once** at the entry point and **replace** the handler list so lines are not duplicated. Use lazy \`%s\` arguments and \`log.exception\` in \`except\` blocks. Add a **run id**, or write **JSON lines**, so logs can be searched.
- **Never log secrets or personal data** (passwords, tokens, PAN, full account numbers). Mask them; use \`SecretStr\`.
- **Configuration** comes in layers: defaults < config file (TOML, YAML) < environment variables < command-line arguments. Environment variables are **text**: convert them. \`.env\` is for local development, in \`.gitignore\`, with a committed \`.env.example\`.
- **Validate at start-up** into a typed settings object (Pydantic, or \`pydantic-settings\`) and **fail fast**, so a missing password or a bad value stops the job before it starts.`,
  ],
  quiz: [
    { q: 'You call `logging.info("loaded")` in a new script with no logging setup. What happens?', o: ['it prints "loaded" to the screen', 'it raises an error', 'nothing is shown, because the default level is WARNING', 'it writes to a file called app.log'], a: 2, why: 'The root logger starts at WARNING. INFO and DEBUG messages are dropped until you configure a lower level and a handler.' },
    { q: 'Which call is best inside an `except` block that handles a failure?', o: ['`log.exception("could not total month %s", month)`', '`print(e)`', '`log.info(e)`', '`log.debug(str(e))`'], a: 0, why: '`log.exception` writes an ERROR line and the full traceback, which is what you need to find the cause later.' },
    { q: 'Why is `log.info("loaded %s rows", n)` preferred to `log.info(f"loaded {n} rows")`?', o: ['f-strings do not work in logging', 'the text is only built when the message is actually emitted, and log tools can group the same message', 'it is shorter', '%s is required by Python 3'], a: 1, why: 'Lazy arguments avoid building the text when the level is off, and the constant message template lets log systems group identical events.' },
    { q: 'A log shows each line twice. What is the most likely cause?', o: ['the disk is full', 'the file handler is rotating', 'the log level is too high', 'handlers were added more than once (setup called twice, or both a child logger and the root have a handler)'], a: 3, why: 'Every added handler writes the record. Configure once, and replace the handler list instead of appending to it.' },
    { q: 'Where do database passwords belong?', o: ['in `config.yaml` committed to git', 'in an environment variable or secret store, never in code or git', 'in a comment at the top of the script', 'in the log, so you can find them later'], a: 1, why: 'Secrets must stay out of the code and the repository. Environment variables (or a vault) inject them at run time, and `.env` is only for local development and is git-ignored.' },
    { q: 'The environment variable `APP_DEBUG=false` makes your code behave as if debug were on. Why?', o: ['environment variables are text, and the text "false" is a non-empty string, which is truthy', 'Python ignores environment variables', 'the variable name is too long', 'false must be written in capitals'], a: 0, why: 'Every environment variable is a string. Convert it explicitly (compare with accepted true values) or let a settings class such as pydantic-settings parse it.' },
  ],
  task: {
    title: 'Add logging and validated settings to a small job',
    steps: [
      'In `C:\\fde\\py-recap` create `logconfig_practice.py` with `setup_logging(level, log_file)` (console plus `RotatingFileHandler`, replacing the handlers so it is safe to call twice). Run it with `INFO` and `DEBUG` and compare the two `run.log` files.',
      'Write a function that reads `fact_gl.csv` and logs: start, rows read, the number of unbalanced journals (4) as a WARNING, and the elapsed time at the end. Use `getLogger(__name__)` and lazy `%s` arguments. Wrap one risky step in `try/except` with `log.exception`.',
      'Add a `RunIdFilter` and a JSON formatter handler to a second file `run.jsonl`. Read it back with `json.loads` line by line and count the WARNING lines.',
      'Create `Settings` with `pydantic-settings` (host, port, database, user, password as `SecretStr`, month, log level, batch size) and a `.env` file. Add `.env` to `.gitignore` and create `.env.example`. Print the settings object and check that the password is hidden.',
      'Add a `config.toml` with non-secret settings and merge it under the environment variables (use `tomllib`). Prove the layering by setting `$env:APP_BATCH_SIZE` in PowerShell.',
      'Write `mask_sensitive` (challenge 2) and apply it as a `logging.Filter` that rewrites `record.msg` before output. Log one line that contains a PAN from `employees.csv` and show it comes out masked.',
    ],
    deliverable: '`logconfig_practice.py`, `run.log`, `run.jsonl`, `.env.example`, `config.toml` and the printed settings object.',
  },
};
