export default {
  id: 'python-cli',
  title: 'Command-line tools',
  goal: 'You can turn a script into a command-line tool with argparse (options, flags, choices, validation, subcommands), structure it with a testable main(argv) function, use exit codes and stdout/stderr properly, and know how Typer does the same with type hints.',
  roadmap: ['argparse', 'Typer', 'exit codes', 'python run.py --month 2026-09'],
  blocks: [
    `## The problem
Your reporting script starts with \`month = "2026-09"\` on line 3. To run another month you open the file, edit the line and save. The scheduler cannot do that. A colleague who runs it by hand edits the wrong line. When the job fails at night, the scheduler cannot tell, because the script always "finishes". And nobody can find out what the options are without reading the code.

A **command-line interface** (CLI) fixes all four. The script takes its settings as **arguments** and reports its result as an **exit code**:
\`\`\`powershell
python run.py --month 2026-09
python run.py --month 2026-09 --entity SG01 --dry-run
python run.py --help
\`\`\`
This is the form that schedulers, CI pipelines, Docker containers and orchestration tools all expect. Every tool you will meet later in the course (\`git\`, \`dbt\`, \`docker\`, \`az\`, \`pytest\`) is a CLI, and the Project A engineering step asks for exactly \`python run.py --month 2026-09\`. The standard module for building one is \`argparse\`, and the modern, shorter alternative is **Typer**.`,
    `## Anatomy of a command
A command line is a list of words that your program receives in \`sys.argv\`. The words follow conventions:
- **Positional arguments** are identified by position: \`copy source.csv target.csv\`.
- **Options** (also called named arguments) have a name and take a value: \`--month 2026-09\`.
- **Flags** are options with no value; they are on or off: \`--dry-run\`. A **counted flag** such as \`-v\` / \`-vv\` counts how often it appears.
- **Short and long forms**: \`-v\` and \`--verbose\`, and long options use hyphens (\`--input-dir\`), which become underscores in Python (\`args.input_dir\`).
- **Subcommands** group several actions in one tool: \`git commit\`, \`git push\`. Each subcommand has its own options.
- **\`--help\`** prints how to use the tool. You get it for free.

You *could* read \`sys.argv\` yourself, but you would have to write the parsing, the error messages, the type conversion and the help text, and you would get them wrong. \`argparse\` does all of this from a short description of your options.`,
    { sketch: { w: 760, h: 292, caption: 'A command line is a list of words; argparse turns it into named values', items: [
      { t: 'box', x: 14, y: 30, w: 92, h: 40, label: 'python', size: 15, fill: 'grey' },
      { t: 'box', x: 110, y: 30, w: 100, h: 40, label: 'run.py', size: 15, fill: 'blue' },
      { t: 'box', x: 214, y: 30, w: 210, h: 40, label: '--month 2026-09', size: 15, fill: 'yellow' },
      { t: 'box', x: 428, y: 30, w: 140, h: 40, label: '--dry-run', size: 15, fill: 'green' },
      { t: 'box', x: 572, y: 30, w: 70, h: 40, label: '-vv', size: 15, fill: 'pink' },
      { t: 'text', x: 60, y: 96, text: 'interpreter', size: 13, anchor: 'middle', color: '#5c6478' },
      { t: 'text', x: 160, y: 96, text: 'your script', size: 13, anchor: 'middle', color: '#5c6478' },
      { t: 'text', x: 319, y: 96, text: 'option with a value', size: 13, anchor: 'middle', color: '#5c6478' },
      { t: 'text', x: 498, y: 96, text: 'flag: on or off', size: 13, anchor: 'middle', color: '#5c6478' },
      { t: 'text', x: 607, y: 96, text: 'counted flag', size: 13, anchor: 'middle', color: '#5c6478' },
      { t: 'arrow', x1: 380, y1: 112, x2: 380, y2: 140 },
      { t: 'note', x: 14, y: 144, w: 732, h: 42, fill: 'grey', size: 13, text: 'sys.argv = ["run.py", "--month", "2026-09", "--dry-run", "-vv"]   (a plain list of text)' },
      { t: 'arrow', x1: 380, y1: 190, x2: 380, y2: 214, label: 'argparse', lx: 50, ly: 0 },
      { t: 'note', x: 14, y: 218, w: 732, h: 62, fill: 'green', size: 14, text: 'Namespace(month="2026-09", dry_run=True, verbose=2)\nChecked, converted, with defaults filled in. A mistake gives a usage message and exit code 2.' },
    ] } },
    `## argparse step by step
\`\`\`python
import argparse

parser = argparse.ArgumentParser(prog="run.py", description="Month-end report")
parser.add_argument("--month", required=True, help="month to process, YYYY-MM")
parser.add_argument("--entity", choices=["IN01", "SG01", "US01"], default="IN01")
parser.add_argument("--dry-run", action="store_true", help="validate only, write nothing")
parser.add_argument("-v", "--verbose", action="count", default=0)
args = parser.parse_args()          # reads sys.argv; or parse_args(["--month", "2026-09"]) in tests
\`\`\`
The main pieces of \`add_argument\`:
- **\`type=\`** converts the text: \`type=int\`, \`type=Path\`, or **your own function** that raises \`argparse.ArgumentTypeError("...")\` when the text is wrong. That is how you validate \`2026-13\` before any real work starts.
- **\`required=True\`** makes an option mandatory; **\`default=\`** fills in a value; **\`choices=[...]\`** limits the values.
- **\`action="store_true"\`** makes a flag; **\`action="count"\`** makes \`-v\`, \`-vv\`.
- **\`nargs="+"\`** accepts several values (\`--files a.csv b.csv\`); **\`help=\`** is the text in \`--help\` (\`%(default)s\` inserts the default).
- **\`parse_args(argv)\`** reads the list you give it, or \`sys.argv[1:]\` if you give none. **Always accept an \`argv\` list in your own functions**: it is what makes the tool testable, and it is what lets us run argparse right here in the browser.
- **Mistakes end the program with exit code 2** and a usage message on stderr: argparse raises \`SystemExit(2)\`. In tests you catch \`SystemExit\`.
- **Subcommands** use \`add_subparsers(dest="command", required=True)\` and \`sub.add_parser("report")\`, each with its own \`add_argument\` calls.
- A **trap**: argparse only turns \`ValueError\`, \`TypeError\` and \`ArgumentTypeError\` from your \`type\` function into a clean usage error. Anything else, such as \`decimal.InvalidOperation\` from \`Decimal("abc")\`, escapes as an ugly traceback. Wrap it and raise \`ArgumentTypeError\`.`,
    { py: {
      title: 'argparse in the browser: options, validation, help text and usage errors',
      starter: `import argparse
import io
import re
from contextlib import redirect_stderr
from pathlib import Path

def month_type(text):
    """A custom type: validate YYYY-MM before any work starts."""
    if not re.fullmatch(r"\\d{4}-(0[1-9]|1[0-2])", text):
        raise argparse.ArgumentTypeError(f"{text!r} is not a month like 2026-09")
    return text

def build_parser():
    parser = argparse.ArgumentParser(prog="run.py", description="Month-end report")
    parser.add_argument("--month", type=month_type, required=True, help="month to process, YYYY-MM")
    parser.add_argument("--entity", choices=["IN01", "SG01", "US01"], default="IN01", help="entity code (default: %(default)s)")
    parser.add_argument("--input-dir", type=Path, default=Path("input"), help="folder with the files")
    parser.add_argument("--dry-run", action="store_true", help="validate only, write nothing")
    parser.add_argument("-v", "--verbose", action="count", default=0, help="-v for INFO, -vv for DEBUG")
    return parser

parser = build_parser()

# 1. a normal run: pass the argument list yourself (in a real run it comes from sys.argv)
args = parser.parse_args(["--month", "2026-09", "-vv", "--dry-run"])
print(args)
print("input_dir is a Path:", type(args.input_dir).__name__, "| long option --input-dir became args.input_dir")

# 2. mistakes: argparse prints a usage message to stderr and exits with code 2
def try_parse(argv):
    err = io.StringIO()
    try:
        with redirect_stderr(err):
            parser.parse_args(argv)
        print("OK     ", argv)
    except SystemExit as exc:
        last_line = err.getvalue().strip().splitlines()[-1]
        print(f"EXIT {exc.code}", argv, "->", last_line)

try_parse(["--month", "2026-09"])
try_parse([])
try_parse(["--month", "2026-13"])
try_parse(["--month", "2026-09", "--entity", "XX"])
try_parse(["--month", "2026-09", "--bogus"])

# 3. --help is generated from your descriptions
print()
print(parser.format_help())`,
      note: 'Look at the exit codes: every usage mistake is exit code 2 and the last line says what to fix, in words you chose in month_type. Nothing runs before the arguments are valid. The help text at the end is built from the help= strings, so documentation and behaviour cannot drift apart. The exact wording of the "invalid choice" message differs a little between Python versions.',
    } },
    `## The main(argv) pattern
A script that does everything at the top level cannot be tested, cannot be imported and cannot be called by another tool. Use this shape instead:
\`\`\`python
def build_parser(): ...               # arguments only

def run(month, entity, dry_run):      # the real work: plain parameters, no argparse here
    ...

def main(argv=None):
    args = build_parser().parse_args(argv)     # argv=None means "use the real command line"
    try:
        run(args.month, args.entity, args.dry_run)
    except DataError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 3
    return 0

if __name__ == "__main__":
    raise SystemExit(main())          # the return value becomes the exit code
\`\`\`
Why this shape wins:
- **Tests** call \`main(["--month", "2026-09"])\` and check the return value and the output.
- **\`[project.scripts]\`** in \`pyproject.toml\` (Environments lesson) points a command such as \`kollana-report\` at \`kollana.cli:main\`, which works only if \`main\` is a function.
- The logic in \`run\` is **reusable** from other Python code and from tests, without parsing anything.
- \`raise SystemExit(main())\` passes the **exit code** to the operating system.

**Exit codes are the tool's answer to the scheduler.** \`0\` means success; **anything else means failure**. A few agreed values make a tool easier to operate:

| Code | Meaning |
|---|---|
| 0 | success |
| 1 | unexpected error (a bug, an unhandled exception) |
| 2 | usage error: wrong or missing arguments (argparse does this for you) |
| 3 | the data was rejected, for example too many bad rows (your own choice) |
| 4 | an outside system was unavailable (your own choice) |

Windows Task Scheduler, GitHub Actions, Airflow and Azure all look at this number to decide whether a run succeeded, and whether to retry or alert. In PowerShell you read it with \`$LASTEXITCODE\`; in \`cmd\` with \`%ERRORLEVEL%\`.

**Two output streams.** Print the **result** (the thing a user or another program might want to pipe or save) to **stdout**, and print **messages, warnings and errors** to **stderr** (\`print(..., file=sys.stderr)\`, or the logging module). Then \`python run.py > report.txt\` captures only the result, and errors still show on the screen.

**Good CLI habits.** A \`--dry-run\` flag that validates and prints what would happen, without writing anything. A \`--yes\` flag for dangerous actions instead of an \`input()\` prompt (a scheduled job cannot answer a prompt). \`-v\`/\`-vv\` mapped to log levels. Defaults that read an environment variable (\`default=os.environ.get("APP_ENTITY", "IN01")\`) so the order of precedence is: command line, then environment, then default (the Logging and configuration lesson).`,
    { sketch: { w: 760, h: 296, caption: 'One main(argv) serves everyone: the shell, the scheduler, a test and the installed command', items: [
      { t: 'box', x: 14, y: 30, w: 218, h: 50, label: 'python run.py --month ...', size: 14, fill: 'grey' },
      { t: 'box', x: 14, y: 90, w: 218, h: 50, label: 'kollana-report (installed command)', size: 13, fill: 'grey' },
      { t: 'box', x: 14, y: 150, w: 218, h: 50, label: 'a test', sub: 'main(["--month", "2026-09"])', size: 13, fill: 'blue' },
      { t: 'arrow', x1: 236, y1: 55, x2: 286, y2: 96 },
      { t: 'arrow', x1: 236, y1: 115, x2: 286, y2: 115 },
      { t: 'arrow', x1: 236, y1: 175, x2: 286, y2: 134 },
      { t: 'box', x: 290, y: 50, w: 190, h: 130, label: 'main(argv=None)', sub: 'parse, then run the logic,\nthen return an exit code', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 484, y1: 84, x2: 602, y2: 56 },
      { t: 'text', x: 516, y: 56, text: 'stdout', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'arrow', x1: 484, y1: 115, x2: 602, y2: 115 },
      { t: 'text', x: 543, y: 108, text: 'stderr', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'arrow', x1: 484, y1: 146, x2: 602, y2: 174 },
      { t: 'text', x: 530, y: 184, text: 'exit code', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'box', x: 606, y: 34, w: 140, h: 46, label: 'the result', size: 14, fill: 'green' },
      { t: 'box', x: 606, y: 92, w: 140, h: 46, label: 'messages, errors', size: 13, fill: 'pink' },
      { t: 'box', x: 606, y: 152, w: 140, h: 46, label: '0 ok, other = fail', size: 13, fill: 'white' },
      { t: 'note', x: 14, y: 224, w: 732, h: 58, fill: 'grey', size: 14, text: 'The scheduler, CI or Airflow reads the exit code. A pipe or a file captures stdout. People read stderr.\nKeep the real work in run(...) so it never needs argparse.' },
    ] } },
    { py: {
      title: 'A real main(argv): subcommands, exit codes and streams on the GL data',
      starter: `import argparse
import csv
import sys

EXIT_OK, EXIT_ERROR, EXIT_USAGE, EXIT_DATA = 0, 1, 2, 3

class DataError(Exception):
    pass

def load_rows(month):
    with open("fact_gl.csv", newline="", encoding="utf-8-sig") as f:
        return [r for r in csv.DictReader(f) if r["posting_date"].startswith(month)]

def report(month):
    rows = load_rows(month)
    if not rows:
        raise DataError(f"no GL lines for {month}")
    total = sum(float(r["debit"]) for r in rows)
    return f"{month}: {len(rows)} lines, total debit {total:,.2f}"      # the RESULT, printed to stdout

def validate(month):
    rows = load_rows(month)
    if not rows:
        raise DataError(f"no GL lines for {month}")
    bad = [r["gl_id"] for r in rows if float(r["debit"]) < 0 or float(r["credit"]) < 0]
    return f"{month}: {len(rows)} lines checked, {len(bad)} negative amounts"

def build_parser():
    parser = argparse.ArgumentParser(prog="kollana")
    sub = parser.add_subparsers(dest="command", required=True)
    for name, helptext in (("report", "totals for a month"), ("validate", "check a month")):
        p = sub.add_parser(name, help=helptext)
        p.add_argument("--month", required=True, help="YYYY-MM")
    return parser

def main(argv=None):
    args = build_parser().parse_args(argv)                # a usage mistake ends here with exit code 2
    handlers = {"report": report, "validate": validate}
    try:
        print(handlers[args.command](args.month))         # result -> stdout
    except DataError as exc:
        print(f"error: {exc}", file=sys.stderr)           # message -> stderr
        return EXIT_DATA
    except Exception as exc:                              # a bug: still report it, with a different code
        print(f"unexpected error: {type(exc).__name__}: {exc}", file=sys.stderr)
        return EXIT_ERROR
    return EXIT_OK

# In a terminal: python kollana.py report --month 2025-04   then   $LASTEXITCODE
# Here we call main() with a list and show the codes.
for argv in (["report", "--month", "2025-04"],
             ["validate", "--month", "2025-04"],
             ["report", "--month", "2026-09"],          # a month with no data in the file
             ["export", "--month", "2025-04"],          # an unknown subcommand
             []):
    try:
        code = main(argv)
    except SystemExit as exc:                             # argparse's own exit for a usage error
        code = exc.code
    print(f"   -> exit code {code}   for {argv}")
    print()`,
      note: 'The three kinds of outcome have three different codes: success is 0, bad data is 3, and a usage mistake is 2. In the output, the results (stdout) and the messages (stderr) appear in the order they happened. On your laptop you can see the difference: python kollana.py report --month 2026-09 > out.txt leaves the error on the screen and out.txt empty. April 2025 has 103 GL lines in the practice data (all three entities together, so the total is only a demo number).',
    } },
    `## Typer: a CLI from type hints
**Typer** (a library built on Click) writes the argparse part for you from your function's **type hints**. A parameter without a default becomes a required argument, a parameter with a default becomes an option, a \`bool\` becomes a flag, and the docstring becomes the help text. It also gives colour, nice error boxes and shell completion.
\`\`\`python
from typing import Annotated

import typer

app = typer.Typer(help="Month-end report")


@app.command()
def report(
    month: Annotated[str, typer.Option(help="Month to process, YYYY-MM")],
    entity: Annotated[str, typer.Option(help="Entity code")] = "IN01",
    dry_run: Annotated[bool, typer.Option("--dry-run", help="Validate only, write nothing")] = False,
    verbose: Annotated[int, typer.Option("--verbose", "-v", count=True, help="-v for INFO, -vv for DEBUG")] = 0,
):
    """Build the month-end report for one entity."""
    typer.echo(f"month={month} entity={entity} dry_run={dry_run} verbose={verbose}")


if __name__ == "__main__":
    app()
\`\`\`
Typer is not available in the browser playground, so this block and the box below are for your laptop (\`pip install typer\`). Use **argparse** when you want no extra dependency (standard library), and **Typer** when you want less code, many subcommands and friendly output. The structure (a \`main\`, exit codes, stdout and stderr) stays the same, and Typer's \`typer.Exit(code=3)\` sets a custom exit code.`,
    { local: `**Run an argparse tool and a Typer tool on your laptop.** Save \`run.py\` (argparse) in \`C:\\fde\\py-recap\` next to your exported \`fact_gl.csv\`:
\`\`\`python
"""Month-end report: python run.py --month 2026-09"""
import argparse
import csv
import re
import sys
from pathlib import Path

EXIT_OK, EXIT_ERROR, EXIT_DATA = 0, 1, 3


def month_type(text):
    if not re.fullmatch(r"\\d{4}-(0[1-9]|1[0-2])", text):
        raise argparse.ArgumentTypeError(f"{text!r} is not a month like 2026-09")
    return text


def build_parser():
    parser = argparse.ArgumentParser(prog="run.py", description="Month-end report")
    parser.add_argument("--month", type=month_type, required=True, help="month to process, YYYY-MM")
    parser.add_argument("--input", type=Path, default=Path("fact_gl.csv"), help="GL file (default: %(default)s)")
    parser.add_argument("--dry-run", action="store_true", help="validate only, write nothing")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        with open(args.input, newline="", encoding="utf-8-sig") as f:
            rows = [r for r in csv.DictReader(f) if r["posting_date"].startswith(args.month)]
    except FileNotFoundError:
        print(f"error: {args.input} not found", file=sys.stderr)
        return EXIT_ERROR
    if not rows:
        print(f"error: no GL lines for {args.month}", file=sys.stderr)
        return EXIT_DATA
    total = sum(float(r["debit"]) for r in rows)
    print(f"{args.month}: {len(rows)} lines, total debit {total:,.2f}" + ("  (dry run)" if args.dry_run else ""))
    return EXIT_OK


if __name__ == "__main__":
    raise SystemExit(main())
\`\`\`
Try these in PowerShell and read the exit code after each one with \`$LASTEXITCODE\` (run them **without** \`2>&1\`; PowerShell wraps redirected error text in a confusing red block). Output to expect:
\`\`\`text
PS> python run.py --month 2025-04 --dry-run
2025-04: 103 lines, total debit 586,540.16  (dry run)          exit code 0

PS> python run.py --month 2026-09
error: no GL lines for 2026-09                                  exit code 3

PS> python run.py --month 2026-13
usage: run.py [-h] --month MONTH [--input INPUT] [--dry-run]
run.py: error: argument --month: '2026-13' is not a month like 2026-09      exit code 2

PS> python run.py --month 2025-04 --input nope.csv
error: nope.csv not found                                       exit code 1

PS> python run.py --help
usage: run.py [-h] --month MONTH [--input INPUT] [--dry-run]

Month-end report

options:
  -h, --help     show this help message and exit
  --month MONTH  month to process, YYYY-MM
  --input INPUT  GL file (default: fact_gl.csv)
  --dry-run      validate only, write nothing
\`\`\`
Now save the Typer example from the lesson as \`typer_demo.py\` (\`pip install typer\`). \`python typer_demo.py --help\` prints a boxed help screen (tested with Typer 0.27; the text differs a little between versions):
\`\`\`text
 Usage: typer_demo.py [OPTIONS]

 Build the month-end report for one entity.

 Options
 * --month    <str>  Month to process, YYYY-MM [required]
   --entity   <str>  Entity code [default: IN01]
   --dry-run         Validate only, write nothing
   --verbose  -v <int>  -v for INFO, -vv for DEBUG [default: 0]
   --help            Show this message and exit.
\`\`\`
(Typer also lists \`--install-completion\` and \`--show-completion\`, and draws the options inside a frame.) \`python typer_demo.py --month 2026-09 --dry-run -vv\` prints \`month=2026-09 entity=IN01 dry_run=True verbose=2\` and exits with 0. Without \`--month\` it prints \`Missing option '--month'.\` in an error box and exits with code **2**, the same code argparse uses.

**Test it from outside** (end to end): \`subprocess.run([sys.executable, "run.py", "--month", "2025-04"], capture_output=True, text=True)\` gives you \`.returncode\`, \`.stdout\` and \`.stderr\`. For quick tests call \`main([...])\` directly, as in the playground, and use \`capsys\` in pytest to read the output.` },
    { warn: `Things that go wrong with command-line tools:
- **Reading \`sys.argv\` by hand.** You lose validation, help text and good error messages. Use argparse or Typer.
- **A script with no \`main(argv=None)\`.** It cannot be tested or reused. Move the work into functions and call \`parse_args(argv)\`.
- **Always exiting with 0.** The scheduler thinks a failed run was fine. Return a non-zero code on failure, and make sure unhandled exceptions also end non-zero (Python does that by itself: exit code 1).
- **Printing errors to stdout.** They end up inside the redirected report file. Errors go to stderr.
- **\`input()\` prompts in a job** that runs unattended: it hangs for ever. Use options (\`--yes\`) and defaults.
- **A validator that raises something else.** \`Decimal("abc")\` as an argparse \`type\` gives a traceback; wrap it in \`ArgumentTypeError\`.
- **Required options with no help text.** Always write \`help=\`; it is free documentation.
- **Hard-coded paths** (\`C:\\fde\\...\`). Take a \`--input\` option with a default relative to the project.
- **Secrets as command-line arguments** (\`--password ...\`). They show up in the process list and in shell history. Use environment variables.
- **Forgetting that PowerShell wraps stderr.** With \`2>&1\` a normal error message is shown as a red error record. Look at the exit code instead.` },
    { pychallenge: {
      id: 'python-cli-ch1',
      prompt: 'Write `build_parser()` that returns an `argparse.ArgumentParser` (with `prog="run.py"`). Options: `--month` (required; must look like `YYYY-MM` with a real month 01 to 12, otherwise a usage error; the value stays a string), `--entity` (choices `IN01`, `SG01`, `US01`, default `IN01`), `--dry-run` (a flag, default `False`) and `-v` / `--verbose` (counted, default `0`). Wrong input must make `parse_args` raise `SystemExit` with code 2.',
      starter: `import argparse
import re

def build_parser():
    parser = argparse.ArgumentParser(prog="run.py")
    # TODO: add --month (validated), --entity (choices), --dry-run (flag), -v/--verbose (count)
    return parser
`,
      tests: `import io
from contextlib import redirect_stderr

p = build_parser()

def parse(argv):
    with redirect_stderr(io.StringIO()):
        try:
            return p.parse_args(argv)
        except SystemExit as exc:
            raise AssertionError(f"parse_args exited with code {exc.code} for {argv}")

a = parse(["--month", "2026-09"])
assert a.month == "2026-09" and a.entity == "IN01" and a.dry_run is False and a.verbose == 0
a = parse(["--month", "2026-01", "--entity", "SG01", "--dry-run", "-vv"])
assert (a.month, a.entity, a.dry_run, a.verbose) == ("2026-01", "SG01", True, 2)
a = parse(["-v", "--month", "2025-12", "--verbose"])
assert a.verbose == 2 and a.month == "2025-12"

def exit_code(argv):
    with redirect_stderr(io.StringIO()):
        try:
            p.parse_args(argv)
        except SystemExit as exc:
            return exc.code
    return None

assert exit_code([]) == 2
assert exit_code(["--month", "2026-13"]) == 2
assert exit_code(["--month", "2026-00"]) == 2
assert exit_code(["--month", "26-09"]) == 2
assert exit_code(["--month", "2026-9"]) == 2
assert exit_code(["--month", "2026-09", "--entity", "XX"]) == 2
assert exit_code(["--month", "2026-09", "--bogus"]) == 2
assert exit_code(["--month", "2026-09"]) is None`,
      solution: `import argparse
import re

def month_type(text):
    if not re.fullmatch(r"\\d{4}-(0[1-9]|1[0-2])", text):
        raise argparse.ArgumentTypeError(f"{text!r} is not a month like 2026-09")
    return text

def build_parser():
    parser = argparse.ArgumentParser(prog="run.py")
    parser.add_argument("--month", type=month_type, required=True)
    parser.add_argument("--entity", choices=["IN01", "SG01", "US01"], default="IN01")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("-v", "--verbose", action="count", default=0)
    return parser
`,
      hint: 'Write a type function `month_type(text)` that checks `re.fullmatch(r"\\d{4}-(0[1-9]|1[0-2])", text)` and raises `argparse.ArgumentTypeError(...)` when it does not match, otherwise returns the text. Then use `type=month_type, required=True` for `--month`, `choices=[...]` with `default="IN01"` for `--entity`, `action="store_true"` for `--dry-run` and `action="count", default=0` for `-v/--verbose`.',
    } },
    { pychallenge: {
      id: 'python-cli-ch2',
      prompt: 'Write `main(argv=None)` for a tool `fx.py --amount 100 --rate 83.21 [--currency USD]`. Both `--amount` and `--rate` are required and are read as `Decimal`; text that is not a number must be a **usage error** (argparse exit code 2, so use a `type` function that raises `argparse.ArgumentTypeError`). If the amount or the rate is zero or negative, print `error: amount and rate must be positive` to **stderr** and **return 3**. Otherwise print one line to **stdout**, `<amount> <currency> = <inr> INR`, where `inr` is amount times rate rounded to 2 places, half up, and **return 0**. The default currency is `USD`.',
      starter: `import argparse
import sys
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

def main(argv=None):
    # TODO: parse --amount, --rate, --currency; validate; print the result to stdout; return the exit code
    return 0
`,
      tests: `import io
from contextlib import redirect_stderr, redirect_stdout

def run(argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        try:
            code = main(argv)
        except SystemExit as exc:
            code = exc.code
    return code, out.getvalue(), err.getvalue()

assert run(["--amount", "100", "--rate", "83.21"]) == (0, "100 USD = 8321.00 INR\\n", "")
assert run(["--amount", "1250.50", "--rate", "61.855", "--currency", "SGD"]) == (0, "1250.50 SGD = 77349.68 INR\\n", "")
assert run(["--amount", "19.99", "--rate", "0.5"]) == (0, "19.99 USD = 10.00 INR\\n", "")
assert run(["--amount", "-5", "--rate", "83"]) == (3, "", "error: amount and rate must be positive\\n")
assert run(["--amount", "10", "--rate", "0"]) == (3, "", "error: amount and rate must be positive\\n")

code, out, err = run(["--amount", "abc", "--rate", "83"])
assert code == 2 and out == "" and "usage:" in err, (code, out, err)
code, out, err = run([])
assert code == 2 and out == "" and "usage:" in err
code, out, err = run(["--amount", "5"])
assert code == 2 and out == ""`,
      solution: `import argparse
import sys
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

def number(text):
    try:
        return Decimal(text)
    except InvalidOperation:
        raise argparse.ArgumentTypeError(f"{text!r} is not a number")

def main(argv=None):
    parser = argparse.ArgumentParser(prog="fx.py", description="Convert an amount to INR")
    parser.add_argument("--amount", type=number, required=True)
    parser.add_argument("--rate", type=number, required=True)
    parser.add_argument("--currency", default="USD")
    args = parser.parse_args(argv)
    if args.amount <= 0 or args.rate <= 0:
        print("error: amount and rate must be positive", file=sys.stderr)
        return 3
    inr = (args.amount * args.rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    print(f"{args.amount} {args.currency} = {inr} INR")
    return 0
`,
      hint: 'Write `number(text)` that returns `Decimal(text)` and turns `InvalidOperation` into `argparse.ArgumentTypeError`, and use it as `type=number`. After `parse_args(argv)`, check `args.amount <= 0 or args.rate <= 0` first: print the error with `file=sys.stderr` and `return 3`. Otherwise `quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)`, print the line and `return 0`.',
    } },
    { pychallenge: {
      id: 'python-cli-ch3',
      prompt: 'Write `dispatch(argv, handlers)` for a tool with two subcommands. `load` takes a required `--file`; `report` takes a required `--month`. `handlers` is a dict `{"load": function, "report": function}`; call the handler of the chosen subcommand with the parsed `args` and **return its result** (the exit code). A missing or unknown subcommand, or a missing option, is a usage error (`SystemExit` with code 2). `--help` exits with code 0.',
      starter: `import argparse

def dispatch(argv, handlers):
    # TODO: ArgumentParser(prog="kollana"); add_subparsers(dest="command", required=True); load and report
    return 0
`,
      tests: `import io
from contextlib import redirect_stderr, redirect_stdout

calls = []
handlers = {
    "load": lambda a: (calls.append(("load", a.file)), 0)[1],
    "report": lambda a: (calls.append(("report", a.month)), 4)[1],
}
assert dispatch(["load", "--file", "gl.csv"], handlers) == 0
assert dispatch(["report", "--month", "2026-09"], handlers) == 4
assert calls == [("load", "gl.csv"), ("report", "2026-09")], calls

def code(argv):
    with redirect_stderr(io.StringIO()), redirect_stdout(io.StringIO()):
        try:
            dispatch(argv, handlers)
        except SystemExit as exc:
            return exc.code
    return None

assert code([]) == 2
assert code(["delete"]) == 2
assert code(["load"]) == 2
assert code(["report", "--month"]) == 2
assert code(["--help"]) == 0
assert calls == [("load", "gl.csv"), ("report", "2026-09")], "no handler may run on a usage error"`,
      solution: `import argparse

def dispatch(argv, handlers):
    parser = argparse.ArgumentParser(prog="kollana")
    sub = parser.add_subparsers(dest="command", required=True)
    load = sub.add_parser("load", help="load a GL file")
    load.add_argument("--file", required=True)
    report = sub.add_parser("report", help="report a month")
    report.add_argument("--month", required=True)
    args = parser.parse_args(argv)
    return handlers[args.command](args)
`,
      hint: 'Create the main parser, then `sub = parser.add_subparsers(dest="command", required=True)`. For each subcommand call `sub.add_parser("load")` (and `"report"`) and add its own `required=True` option. After `args = parser.parse_args(argv)` return `handlers[args.command](args)`; argparse itself raises `SystemExit` for every usage mistake and for `--help`.',
    } },
    { real: 'Every job you hand over needs this shape. The scheduler runs `python run.py --month 2026-09`, so one script serves every month and every entity. When it fails, the exit code makes Task Scheduler, GitHub Actions or Airflow mark the run as failed and alert someone, while the message on stderr says why. `--dry-run` lets the finance user check a file without loading it, and `--help` documents the tool for the next person. In Project A this is the "engineering" step: `python run.py --month 2026-09`, with logging, settings from the environment, pytest on the transforms and a clean exit code.' },
    { interview: `**"How do you make a script run for any month without editing it?"**
Model answer: "I turn it into a command-line tool with argparse or Typer. The month comes in as \`--month 2026-09\`, validated at the start, with the work in a function that takes plain parameters. \`main(argv=None)\` parses the arguments and returns an exit code, so I can test it by calling \`main([...])\`, the scheduler can run it, and an installed console script can point at it."

**"What are exit codes and why do they matter?"** "The process exit code tells the caller if a run succeeded: 0 is success and anything else is failure. Schedulers, CI and orchestrators use it to mark runs failed, retry or alert. I use 0 for success, 1 for an unexpected error, 2 for bad usage (argparse does this), and my own codes for known failure types such as rejected data. Errors go to stderr and results to stdout so redirecting output stays clean."

**"argparse or Typer?"** "argparse is in the standard library and needs no dependency, so it suits small tools and containers. Typer builds the CLI from type hints with less code, nicer help and subcommands, at the cost of a dependency. The structure is the same: a \`main\`, validation of arguments, exit codes."

**"How do you make a script safe to run by hand?"** "A \`--dry-run\` flag that validates and prints what would happen, no interactive prompts in unattended runs but a \`--yes\` flag for dangerous actions, idempotent behaviour so a second run does not duplicate data, and clear errors with non-zero exit codes."` },
    `## Recap
- A **CLI** takes settings as **arguments** and reports success as an **exit code**. Words in \`sys.argv\` become **options** (\`--month 2026-09\`), **flags** (\`--dry-run\`), **counted flags** (\`-vv\`), positional arguments and **subcommands**. \`--help\` is free.
- **argparse**: \`add_argument\` with \`type\`, \`required\`, \`default\`, \`choices\`, \`action="store_true"\` or \`"count"\`, \`help\`. A custom \`type\` that raises \`ArgumentTypeError\` validates early. \`parse_args(argv)\` accepts a list, which makes tools testable. Usage mistakes exit with code **2**.
- The **\`main(argv=None)\` pattern**: \`build_parser()\`, \`run(...)\` with plain parameters, \`main\` returns an exit code, \`raise SystemExit(main())\`. It works for the shell, the scheduler, tests and \`[project.scripts]\`.
- **Exit codes**: 0 success, 1 unexpected error, 2 usage, your own for data rejected or a system down. **stdout** for results, **stderr** for messages. Prefer \`--dry-run\` and \`--yes\` over prompts; never pass secrets as arguments.
- **Typer** builds the same CLI from type hints (laptop only here). Read the exit code in PowerShell with \`$LASTEXITCODE\`.`,
  ],
  quiz: [
    { q: 'What exit code does argparse use when the command line is wrong (a missing required option, say)?', o: ['0', '1', '2', '255'], a: 2, why: 'argparse prints a usage message to stderr and exits with code 2, which by convention means "wrong usage".' },
    { q: 'Why should your own code take an `argv` list, as in `main(argv=None)` and `parse_args(argv)`?', o: ['it makes the script run faster', 'it lets tests and other programs call the tool with a list of arguments instead of the real command line', 'it is required by Python 3', 'it hides the arguments from the user'], a: 1, why: 'With argv=None argparse reads the real command line. Passing a list lets a test (or the browser playground) call main directly and check the result.' },
    { q: 'Where should the result of a report and where should error messages go?', o: ['both to stdout', 'both to stderr', 'result to a log file, errors to nowhere', 'the result to stdout and messages and errors to stderr'], a: 3, why: 'This way `python run.py > report.txt` captures only the result, and warnings or errors still appear on the screen and in the scheduler log.' },
    { q: 'A scheduler runs your script every night. The script catches all errors and prints "failed" but ends normally. What does the scheduler think?', o: ['that the run succeeded, because the exit code is 0', 'that the run failed', 'that the script was not found', 'that it must run again at once'], a: 0, why: 'Schedulers read the exit code. A script that always exits 0 hides failures. Return a non-zero code when the run did not succeed.' },
    { q: 'Which argparse setting gives you `-v` and `-vv` as a number 1 or 2?', o: ['`action="store_true"`', '`type=int`', '`nargs="+"`', '`action="count"`'], a: 3, why: 'action="count" counts how often the flag appears, which is the usual way to map -v and -vv to INFO and DEBUG.' },
    { q: 'Your `type=Decimal` option gets the text "abc" and the user sees a long traceback instead of a usage message. What is the fix?', o: ['catch the error in the shell', 'write a type function that turns InvalidOperation into argparse.ArgumentTypeError', 'remove the type', 'use `nargs="*"`'], a: 1, why: 'argparse only converts ValueError, TypeError and ArgumentTypeError into usage errors. Decimal raises InvalidOperation, so wrap it.' },
  ],
  task: {
    title: 'Turn the GL job into a command-line tool with exit codes',
    steps: [
      'In `C:\\fde\\py-recap` save `run.py` from the "Run an argparse tool" box. Run all five commands from the box in PowerShell and write the exit code of each (`$LASTEXITCODE`) as a comment. Run the missing-data command with `> out.txt` and check that `out.txt` is empty while the error shows on the screen.',
      'Extend `build_parser` with `--entity` (choices from `dim_entity.csv`) and `-v/--verbose`. Map `-v` to INFO and `-vv` to DEBUG with the logging setup from the Logging lesson, and filter the rows by entity.',
      'Move the work into `run(month, entity, input_path)` that raises `DataError`, and make `main` translate `DataError` to exit code 3 and any other exception to exit code 1 with `logging.exception`.',
      'Add the `--dry-run` flag so that without it the program writes `report_<month>.json` (use the atomic write from the Files lesson) and with it nothing is written.',
      'Write `test_cli.py` with pytest: call `main([...])` for a good month, a month without data (exit 3) and a bad month (`SystemExit` with code 2), and use `capsys` to check stdout and stderr.',
      'Install your project in editable mode with `[project.scripts] kollana-report = "kollana.cli:main"` (Environments lesson) and run `kollana-report --month 2025-04`. Finally try `pip install typer` and write the same tool in Typer; compare the two files in a sentence.',
    ],
    deliverable: '`run.py`, `test_cli.py`, the five commands with their exit codes, and the output of `kollana-report --month 2025-04`.',
  },
};
