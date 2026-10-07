export default {
  id: 'python-quality-debugging',
  title: 'Code quality and debugging',
  goal: 'You can use a formatter, a linter and a type checker (Ruff, mypy) and a pre-commit hook to keep code clean, explain how a linter works on the syntax tree, read a traceback, and find a bug with a debugger, breakpoints and bisection instead of guessing.',
  roadmap: ['Ruff', 'mypy basics', 'pre-commit', 'VS Code debugger and breakpoints', 'reading tracebacks'],
  blocks: [
    `## The problem
Two things eat a surprising amount of a developer's day, and both can be mostly automated.

**Review comments about small things.** "Unused import." "Bare except." "Mutable default argument." "Spaces around the operator." "This line is too long." Every comment like this costs a round trip between you and your reviewer, and none of them needs a human, because a program can see them.

**Hunting a bug by guessing.** The total is wrong. You add \`print\` lines, run, add more, run again, and an hour later you have 30 prints and no idea. There is a calm, repeatable way: **reproduce** it, **read the traceback**, **inspect the real values** with a debugger, and **bisect** until the cause has nowhere left to hide.

This lesson gives you both: the tools that keep the code clean without arguments, and the method that finds bugs quickly.`,
    `## The four checkers, and what each one catches
| Tool | Command | What it does |
|---|---|---|
| **Formatter** (\`ruff format\`, similar to \`black\`) | \`ruff format .\` | rewrites the layout: spaces, quotes, line breaks. One style for the whole team, **no more style arguments** |
| **Linter** (\`ruff check\`) | \`ruff check --fix .\` | finds likely **bugs and bad habits**: unused imports, undefined names, bare \`except\`, mutable defaults, ambiguous names. Many problems it fixes by itself |
| **Type checker** (\`mypy\`, or Pyright) | \`mypy .\` | reads your type hints and finds "this can be \`None\`" and "wrong type passed" (you ran it in the Type hints lesson) |
| **Tests** (\`pytest\`) | \`pytest -x -q\` | checks that behaviour is right (previous lesson) |

They answer different questions, so you use them together. **Ruff** is a very fast tool written in Rust that does the work of several older tools (flake8, isort, pyupgrade and more) and the formatting too. You configure it once in \`pyproject.toml\`, choosing which **rule families** to switch on: \`E\` and \`F\` (pycodestyle and pyflakes: the basics), \`B\` (bugbear: likely bugs), \`I\` (import order), \`UP\` (modernise old syntax). A good habit: switch on a sensible set, fix what it finds, and when a rule is wrong for one line, silence it **there** with a comment (\`# noqa: E501\`) and a reason, never globally for convenience.

**Automate it with pre-commit.** A *pre-commit hook* is a script that Git runs **before every commit**. The \`pre-commit\` tool reads \`.pre-commit-config.yaml\` and runs your formatter, linter and fast tests on the files you changed. If anything fails the commit is refused until you fix it. Your CI server (a later phase) runs the same checks again on every push, so nothing sloppy reaches the main branch.

**Naming and style that make code easy to read (PEP 8):** \`snake_case\` for functions and variables, \`CamelCase\` for classes, \`UPPER_CASE\` for constants; no one-letter names except tiny loops (\`l\`, \`O\` and \`I\` look like digits, so linters ban them); a docstring for every public function (first line: what it does, in one sentence); comments explain **why**, not what; keep functions short, with one job; no "magic numbers" (\`0.18\` becomes \`GST_RATE\`).`,
    { sketch: { w: 760, h: 322, caption: 'Each tool catches a different kind of problem; pre-commit runs them before every commit and CI repeats them', items: [
      { t: 'box', x: 14, y: 30, w: 164, h: 112, label: 'format', sub: 'ruff format\nspaces, quotes', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 182, y1: 86, x2: 200, y2: 86 },
      { t: 'box', x: 204, y: 30, w: 164, h: 112, label: 'lint', sub: 'ruff check\nbare except, unused', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 372, y1: 86, x2: 390, y2: 86 },
      { t: 'box', x: 394, y: 30, w: 164, h: 112, label: 'types', sub: 'mypy\n"can be None"', fill: 'green', size: 17 },
      { t: 'arrow', x1: 562, y1: 86, x2: 580, y2: 86 },
      { t: 'box', x: 584, y: 30, w: 162, h: 112, label: 'tests', sub: 'pytest\nwrong behaviour', fill: 'pink', size: 17 },
      { t: 'arrow', x1: 380, y1: 146, x2: 380, y2: 178 },
      { t: 'box', x: 100, y: 182, w: 560, h: 50, label: 'pre-commit hook: runs them on your changed files, before each commit', size: 15, fill: 'grey' },
      { t: 'arrow', x1: 380, y1: 236, x2: 380, y2: 262 },
      { t: 'note', x: 14, y: 266, w: 732, h: 44, fill: 'yellow', size: 14, text: 'Then CI (GitHub Actions) runs the same four checks on every push: your laptop is the fast loop, CI is the safety net.' },
    ] } },
    { local: `**Try Ruff on a messy file** (virtual environment active; \`pip install ruff\`). Save as \`sloppy.py\`:
\`\`\`python
import os
import json
from decimal import Decimal


def add_line(line, lines=[]):
    lines.append(line)
    try:
        total = Decimal(line["amount"])
    except:
        print("failed")
    l = 1
    return {'total':total,   "count":len(lines)}
\`\`\`
and \`pyproject.toml\` next to it:
\`\`\`toml
[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "B", "I", "UP"]
\`\`\`
Run \`ruff check sloppy.py\`. Output to expect (shortened; Ruff 0.16 prints a code frame for each finding, and the exact wording changes between versions):
\`\`\`text
I001 [*] Import block is un-sorted or un-formatted
F401 [*] \`os\` imported but unused
F401 [*] \`json\` imported but unused
B006 Do not use mutable data structures for argument defaults
 --> sloppy.py:6:26
  |
6 | def add_line(line, lines=[]):
  |                          ^^
E722 Do not use bare \`except\`
 --> sloppy.py:10:5
E741 Ambiguous variable name: \`l\`
F841 Local variable \`l\` is assigned to but never used

Found 7 errors.
[*] 3 fixable with the \`--fix\` option (2 hidden fixes can be enabled with the \`--unsafe-fixes\` option).
\`\`\`
The \`[*]\` marks problems Ruff can fix itself: \`ruff check --fix sloppy.py\` removes the two unused imports (and sorts the rest) and reports "Found 6 errors (2 fixed, 4 remaining)". The remaining ones need your judgement: the mutable default, the bare \`except\` and the variable \`l\`. Now \`ruff format --diff sloppy.py\` shows what the formatter would change, without changing the file:
\`\`\`text
-    return {'total':total,   "count":len(lines)}
+    return {"total": total, "count": len(lines)}
\`\`\`
\`ruff format sloppy.py\` applies it. In VS Code, install the Ruff extension and turn on "format on save" so this happens while you type. Run \`mypy sloppy.py\` too, as in the Type hints lesson.

**\`pre-commit\`** (needs Git, which you set up in the Git phase). \`pip install pre-commit\`, then create \`.pre-commit-config.yaml\` in the repository root:
\`\`\`yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: <latest release tag>        # open the repository page and copy the current tag
    hooks:
      - id: ruff-check               # in older releases this hook id is called "ruff"
        args: [--fix]
      - id: ruff-format
  - repo: local
    hooks:
      - id: pytest
        name: fast tests
        entry: python -m pytest -x -q
        language: system
        pass_filenames: false
\`\`\`
Run \`pre-commit install\` once (this writes the Git hook), then \`pre-commit run --all-files\` to try it. From now on every \`git commit\` runs the hooks first. The output has the shape \`ruff-check....Passed\`, \`ruff-format....Failed\` and so on, with the details of the failing hook underneath; if a hook changed a file, stage it again and commit again. Check the current \`pre-commit\` and \`ruff-pre-commit\` pages for the exact hook ids and versions.` },
    `## How a linter sees your code: the syntax tree
A linter does not search text with clever patterns. It asks Python to **parse** the file into an **abstract syntax tree** (AST): a tree of nodes such as \`FunctionDef\`, \`Call\`, \`Assign\`, \`ExceptHandler\`. Then it **walks** the tree and applies rules: "an \`ExceptHandler\` with no exception type is a bare except". The standard module \`ast\` lets you do exactly that, and writing a three-rule linter in the next playground shows there is no magic. It also explains why linters rarely give false alarms for things like "unused import": they know which names are imported and which names are really used.`,
    { py: {
      title: 'A mini linter built on the ast module',
      starter: `import ast

# 1. code is a tree
print(ast.dump(ast.parse("debit - credit", mode="eval"), indent=2))

SOURCE = '''import os
import json
from decimal import Decimal


def add_line(line, lines=[]):
    lines.append(line)
    try:
        return Decimal(line["amount"]) + json.loads("1")
    except:
        print("failed")
'''

class Linter(ast.NodeVisitor):
    """A rule is a method named visit_<NodeType>. generic_visit() keeps walking into the children."""
    def __init__(self):
        self.problems = []

    def report(self, node, code, message):
        self.problems.append((node.lineno, code, message))

    def visit_ExceptHandler(self, node):
        if node.type is None:
            self.report(node, "E722", "bare except hides every error, even Ctrl+C")
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        defaults = node.args.defaults + [d for d in node.args.kw_defaults if d is not None]
        for default in defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.report(default, "B006", "mutable default argument is shared between calls")
        self.generic_visit(node)

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id == "print":
            self.report(node, "T201", "print() found: use logging")
        self.generic_visit(node)

def unused_imports(tree):
    imported = {}                                         # name -> line of the import
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imported[alias.asname or alias.name.split(".")[0]] = node.lineno
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                imported[alias.asname or alias.name] = node.lineno
    used = {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}
    return [(line, "F401", f"'{name}' imported but unused") for name, line in imported.items() if name not in used]

tree = ast.parse(SOURCE)
linter = Linter()
linter.visit(tree)
print()
for line, code, message in sorted(linter.problems + unused_imports(tree)):
    print(f"line {line:>2}  {code}  {message}")`,
      note: 'Three real rules in about thirty lines: a bare except (E722), a mutable default argument (B006), a print call (T201), plus unused imports (F401: os is imported and never used as a name, json and Decimal are). Real linters add hundreds of rules in exactly this way. The numbers in brackets (E722, B006, F401) are the same rule codes Ruff prints, which is why you can look them up.',
    } },
    `## Debugging: read, reproduce, inspect, bisect
**1. Read the traceback, from the bottom up.** The **last line** says what happened: the exception type and its message. The frame just above it says **where**: file, line number, function and the code line. Keep reading upward to see **who called whom**. Frames in your own files matter most; frames inside libraries tell you which of your calls led there. Often the answer is already on the screen.

**2. Reproduce it small.** A bug that appears "sometimes in the big file" is easier to fix after you find **the smallest input that still fails**: one row, three lines, one date. Save it as a test. Half of debugging is just shrinking the problem.

**3. Look at the real values, do not guess.** A **debugger** stops the program at a line you choose (a *breakpoint*) and lets you see every variable and step one line at a time. It replaces dozens of \`print\` lines. In VS Code, click the gutter next to a line number to set a breakpoint and press F5 to start. In the terminal, \`breakpoint()\` in your code, or \`python -m pdb script.py\`, opens the built-in debugger **pdb**. For a failing test: \`pytest --pdb\` drops you into the debugger at the failure.

**4. Bisect.** When the bad value appears somewhere in a long pipeline, do not read everything. Check the data **in the middle**: is it already wrong? If yes, the bug is in the first half, otherwise in the second. Repeat. Ten checks find the bad stage among a thousand steps. Git has the same idea built in (\`git bisect\`, in the Git phase) to find the **commit** that introduced a bug.

**5. Change one thing at a time, and write the fix as a test first** (a regression test, from the Testing lesson). Do not "fix" by trying random edits.

**Data bugs have their own checklist:** compare **row counts** between stages, look at the **smallest failing row**, check types (text vs number), encodings, time zones, NULLs and duplicates, and re-check the **join keys**. The 4 unbalanced journals in the Kollana data were found exactly this way: totals per journal, then the odd ones out.`,
    { sketch: { w: 760, h: 296, caption: 'Read a traceback from the bottom: what happened first, where next, then who called whom', items: [
      { t: 'text', x: 14, y: 22, text: 'Traceback (most recent call last):', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 42, text: '  File "report.py", line 14, in <module>', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 58, text: '    monthly_report(rows)', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 78, text: '  File "report.py", line 11, in monthly_report', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 94, text: '    return {"total": total(rows)}', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 114, text: '  File "report.py", line 7, in total', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 130, text: '    result += parse_amount(r["amount"])', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 150, text: '  File "report.py", line 2, in parse_amount', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 14, y: 166, text: '    return float(text.replace(",", ""))', font: 'mono', size: 12, anchor: 'start' },
      { t: 'box', x: 8, y: 176, w: 456, h: 22, fill: 'pink' },
      { t: 'text', x: 14, y: 192, text: "ValueError: could not convert string to float: 'TBD'", font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'arrow', x1: 468, y1: 188, x2: 500, y2: 188 },
      { t: 'note', x: 504, y: 168, w: 242, h: 44, fill: 'pink', size: 13, text: '1. WHAT: the error type and\nmessage. Start here.' },
      { t: 'arrow', x1: 462, y1: 158, x2: 500, y2: 128 },
      { t: 'note', x: 504, y: 100, w: 242, h: 50, fill: 'yellow', size: 13, text: '2. WHERE: the frame just above.\nFile, line, function, code line.' },
      { t: 'arrow', x1: 462, y1: 82, x2: 500, y2: 54 },
      { t: 'note', x: 504, y: 28, w: 242, h: 56, fill: 'green', size: 13, text: '3. WHO CALLED: read upward to\nsee the chain of calls. The value\n"TBD" came in through rows.' },
      { t: 'note', x: 14, y: 226, w: 732, h: 58, fill: 'grey', size: 14, text: 'The bug is not always in the last frame: parse_amount is correct to refuse "TBD". The real question is why a row\nwith "TBD" reached it. Check the data at the stage before: that is bisecting.' },
    ] } },
    { py: {
      title: 'Read a traceback as data, and run a real debugger session from a script',
      starter: `import io
import pdb
import sys
import tempfile
import traceback
from pathlib import Path

SOURCE = '''def parse_amount(text):
    return float(text.replace(",", ""))

def total(rows):
    result = 0
    for r in rows:
        result += parse_amount(r["amount"])
    return result

def monthly_report(rows):
    return {"total": total(rows)}
'''

with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / "report.py"
    path.write_text(SOURCE, encoding="utf-8")
    ns = {}
    exec(compile(SOURCE, str(path), "exec"), ns)

    rows = [{"amount": "1,250.50"}, {"amount": "TBD"}, {"amount": "900"}]
    try:
        ns["monthly_report"](rows)
    except ValueError as exc:
        print("what happened:", type(exc).__name__, "->", exc)
        print("the frames, outermost first (the same order as a traceback):")
        for frame in traceback.extract_tb(exc.__traceback__):
            if frame.filename == str(path):                       # skip the playground's own frames
                print(f"   {frame.name:<14} line {frame.lineno}: {frame.line}")

    # 2. a debugger session, driven by a script of commands instead of the keyboard
    source2 = '''def total_debit(rows):
    total = 0
    for row in rows:
        total += row["debit"]
    return total
'''
    path2 = Path(tmp) / "gl_report.py"
    path2.write_text(source2, encoding="utf-8")
    ns2 = {}
    exec(compile(source2, str(path2), "exec"), ns2)

    commands = ["break 4", "continue", "p row", "p total", "continue", "p row", "p total",
                "continue", "p row", "p total", "quit"]
    out = io.StringIO()
    debugger = pdb.Pdb(stdin=io.StringIO("\\n".join(commands) + "\\n"), stdout=out)
    debugger.use_rawinput = False
    try:
        debugger.runcall(ns2["total_debit"], [{"debit": 100}, {"debit": 250}, {"debit": None}])
    except Exception as exc:
        print("program raised:", type(exc).__name__, exc)
    print()
    print("--- the pdb session (break at line 4, continue, print row and total each time) ---")
    print(out.getvalue().replace(str(path2), "gl_report.py"))`,
      note: 'Part 1: a traceback is data. extract_tb gives each frame with its function and line, so a program can summarise errors for an email or a log. Part 2 is a real pdb session where the commands come from a list: break 4 sets a breakpoint, continue runs to it, p prints a value. You can see row and total change on each pass, and on the third pass row is {\'debit\': None}, which explains the TypeError that follows. On your laptop you type those commands yourself, or click the same actions in VS Code.',
    } },
    `## The debugger: your commands
| In pdb (terminal) | In VS Code | Meaning |
|---|---|---|
| \`n\` | Step Over (F10) | run the current line, stay in this function |
| \`s\` | Step Into (F11) | go inside the function called on this line |
| \`r\` | Step Out (Shift+F11) | run until this function returns |
| \`c\` | Continue (F5) | run to the next breakpoint |
| \`p x\`, \`pp x\` | Variables and Watch panels | print a value (pretty-print) |
| \`l\`, \`w\`, \`u\` | the Call Stack panel | list the code, show the stack, move up one frame |
| \`b 40\`, \`cl\` | click the gutter | set, clear breakpoints |
| \`q\` | Stop (Shift+F5) | quit |

Two features save the most time. A **conditional breakpoint** (right-click the red dot, "Edit Breakpoint") stops only when an expression is true, for example \`row["debit"] is None\`, so you do not step through 3,000 rows. A **logpoint** prints a message when the line is reached without editing your code. **Post-mortem** debugging opens the debugger at the place where an exception was raised: \`python -m pdb script.py\` (type \`c\` and it stops at the error) or \`pytest --pdb\`.

In VS Code the menu names can change between versions, so look for the purpose: *Run and Debug*, *Python Debugger: Debug Python File*, and for tests the beaker icon with *Debug Test*. If you need arguments, add a \`launch.json\` configuration with \`"args": ["--month", "2026-09"]\`.`,
    { sketch: { w: 760, h: 280, caption: 'Debugger controls: where does each button take you from the current line?', items: [
      { t: 'box', x: 30, y: 28, w: 230, h: 40, label: 'rows = load(path)', size: 14, fill: 'white' },
      { t: 'text', x: 15, y: 108, text: '●', size: 30, color: '#d32f2f', anchor: 'middle' },
      { t: 'box', x: 30, y: 78, w: 230, h: 40, label: 'total = parse_amount(row)', size: 14, fill: 'yellow' },
      { t: 'box', x: 30, y: 128, w: 230, h: 40, label: 'report.append(total)', size: 14, fill: 'white' },
      { t: 'box', x: 30, y: 178, w: 230, h: 40, label: 'return report', size: 14, fill: 'white' },
      { t: 'arrow', x1: 264, y1: 148, x2: 404, y2: 148 },
      { t: 'text', x: 272, y: 138, text: 'Step Over (F10)', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'text', x: 410, y: 153, text: 'next line, same function', size: 13, anchor: 'start', color: '#5c6478' },
      { t: 'arrow', x1: 264, y1: 100, x2: 404, y2: 60 },
      { t: 'text', x: 272, y: 52, text: 'Step Into (F11)', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'box', x: 408, y: 36, w: 338, h: 42, label: 'inside parse_amount(): its first line', size: 13, fill: 'blue' },
      { t: 'arrow', x1: 264, y1: 198, x2: 404, y2: 214 },
      { t: 'text', x: 272, y: 186, text: 'Step Out (Shift+F11)', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'text', x: 410, y: 214, text: 'Out: finish this function.', size: 13, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 410, y: 234, text: 'Continue (F5): to the next red dot or the end.', size: 13, anchor: 'start', color: '#5c6478' },
      { t: 'note', x: 14, y: 246, w: 380, h: 28, fill: 'pink', size: 13, text: 'Red dot = breakpoint. Yellow = the line it is paused at.' },
    ] } },
    { warn: `Things that go wrong with code quality and debugging:
- **Silencing the linter everywhere.** \`# noqa\` on every line, or a rule switched off for the whole project because one file complained. Fix the finding, or silence it on one line with a reason.
- **Running a formatter and a linter with clashing settings.** Use one tool (Ruff) for both, with one line length in \`pyproject.toml\`.
- **Mixing formatting changes with logic changes** in one commit. Run the formatter on its own commit first, so reviewers can see the real change.
- **Adding type hints to please mypy and then using \`Any\` everywhere.** Prefer real types, and tighten gradually.
- **Debugging by random edits.** Without a reproduction you cannot know whether you fixed it. Make the smallest failing case first.
- **Print debugging forever.** It is fine for a quick look, but leave nothing behind: use \`logging.debug\` if the information is worth keeping.
- **Leaving \`breakpoint()\` in committed code.** A hook can catch it (Ruff rule T100). It would freeze a production job waiting for input.
- **Fixing the symptom.** A function that crashes on \`"TBD"\` may be correct; the bug is that bad rows got that far. Ask where the wrong value came from.
- **Skipping the regression test.** The same bug returns in three months.` },
    { pychallenge: {
      id: 'python-quality-debugging-ch1',
      prompt: 'Write `lint(source)` with the `ast` module. Parse the text and return a **sorted list of `(line, code)`** tuples, one for every finding of three rules. **E711**: a comparison with `==` or `!=` where one side is the constant `None` (reported at the line of the comparison). **A001**: an assignment (`name = value`) whose target is a Python built-in name such as `list`, `id`, `sum` or `max` (use `dir(builtins)`). **S110**: an `except` handler whose body is only `pass` (reported at the line of the `except`). Code without findings gives `[]`.',
      starter: `import ast
import builtins

def lint(source):
    # TODO: ast.parse(source); walk the tree; look for Compare, Assign and ExceptHandler nodes
    return []
`,
      tests: `src = "\\n".join([
    "def f(rows):",
    "    list = []",
    "    total = None",
    "    for r in rows:",
    "        if r == None:",
    "            continue",
    "        if total != None:",
    "            total += r",
    "    try:",
    "        pass",
    "    except Exception:",
    "        pass",
    "    id = 5",
    "    return total",
])
assert lint(src) == [(2, "A001"), (5, "E711"), (7, "E711"), (11, "S110"), (13, "A001")], lint(src)

clean = "\\n".join([
    "def g(rows):",
    "    total = None",
    "    for r in rows:",
    "        if r is None or total is not None:",
    "            continue",
    "        total = r",
    "    try:",
    "        total = int(total)",
    "    except ValueError:",
    "        total = 0",
    "    return total",
])
assert lint(clean) == [], lint(clean)
assert lint("") == []
assert lint("if None == x:\\n    pass") == [(1, "E711")]
assert lint("try:\\n    x = 1\\nexcept:\\n    pass") == [(3, "S110")]`,
      solution: `import ast
import builtins

BUILTIN_NAMES = set(dir(builtins))

def lint(source):
    findings = []
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Compare):
            has_equality = any(isinstance(op, (ast.Eq, ast.NotEq)) for op in node.ops)
            sides = [node.left] + node.comparators
            if has_equality and any(isinstance(s, ast.Constant) and s.value is None for s in sides):
                findings.append((node.lineno, "E711"))
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id in BUILTIN_NAMES:
                    findings.append((node.lineno, "A001"))
        elif isinstance(node, ast.ExceptHandler):
            if all(isinstance(stmt, ast.Pass) for stmt in node.body):
                findings.append((node.lineno, "S110"))
    return sorted(findings)
`,
      hint: 'Walk every node with `ast.walk(ast.parse(source))`. For `ast.Compare`: check `any(isinstance(op, (ast.Eq, ast.NotEq)) for op in node.ops)` and whether one of `[node.left] + node.comparators` is an `ast.Constant` whose `value is None`. For `ast.Assign` look at `node.targets` that are `ast.Name` with `id in set(dir(builtins))`. For `ast.ExceptHandler` check that every statement in `node.body` is an `ast.Pass`. Return `sorted(findings)`.',
    } },
    { pychallenge: {
      id: 'python-quality-debugging-ch2',
      prompt: 'Write `first_bad(items, is_bad)`: debugging by bisection. In `items` every item up to some point is good and every item after it is bad (`is_bad(item)` is `False` for the good ones and `True` for the bad ones). Return the **index of the first bad item**, or `None` if there is none (or the list is empty). Call `is_bad` as few times as possible: for 1000 items you may call it at most 11 times (this is how `git bisect` and "check the middle stage of the pipeline" work).',
      starter: `def first_bad(items, is_bad):
    # TODO: binary search: keep a low and a high bound, test the middle item, halve the range each time
    return None
`,
      tests: `calls = []

def make(first):
    def is_bad(item):
        calls.append(item)
        return item >= first
    return is_bad

items = list(range(1000))
for first in (0, 1, 499, 998, 999):
    calls.clear()
    assert first_bad(items, make(first)) == first, first
    assert len(calls) <= 11, (first, len(calls))

calls.clear()
assert first_bad(items, lambda i: calls.append(i) or False) is None
assert len(calls) <= 11, len(calls)
assert first_bad([], lambda i: True) is None
assert first_bad([7], lambda i: True) == 0
assert first_bad([7], lambda i: False) is None
stages = ["read", "clean", "join", "convert", "load"]
assert first_bad(stages, lambda name: stages.index(name) >= 3) == 3`,
      solution: `def first_bad(items, is_bad):
    low, high = 0, len(items)
    while low < high:
        mid = (low + high) // 2
        if is_bad(items[mid]):
            high = mid
        else:
            low = mid + 1
    return low if low < len(items) else None
`,
      hint: 'Keep `low = 0` and `high = len(items)`; the answer is somewhere in `[low, high]` where `high == len(items)` means "none". While `low < high`: take `mid = (low + high) // 2`. If `is_bad(items[mid])` the first bad item is at `mid` or earlier, so `high = mid`; otherwise `low = mid + 1`. At the end return `low` if it is a valid index, else `None`.',
    } },
    { pychallenge: {
      id: 'python-quality-debugging-ch3',
      prompt: 'Write `summarise_exception(exc)` that turns an exception into one line for a log or an email: `"<Type>: <message> (in <function>, line <number>)"`, where the function and the line number come from the **innermost frame** of the traceback (use `traceback.extract_tb(exc.__traceback__)`). For an exception that was never raised (no traceback) return just `"<Type>: <message>"`.',
      starter: `import traceback

def summarise_exception(exc):
    # TODO: take the last frame of traceback.extract_tb(exc.__traceback__); format the one-line summary
    return ""
`,
      tests: `def inner(text):
    return float(text)

def outer(rows):
    return [inner(r) for r in rows]

try:
    outer(["1", "TBD"])
except ValueError as exc:
    summary = summarise_exception(exc)
expected_line = inner.__code__.co_firstlineno + 1
assert summary == f"ValueError: could not convert string to float: 'TBD' (in inner, line {expected_line})", summary

def lookup(d):
    return d["x"]

try:
    lookup({})
except KeyError as exc:
    summary = summarise_exception(exc)
assert summary == f"KeyError: 'x' (in lookup, line {lookup.__code__.co_firstlineno + 1})", summary

assert summarise_exception(ValueError("never raised")) == "ValueError: never raised"`,
      solution: `import traceback

def summarise_exception(exc):
    text = f"{type(exc).__name__}: {exc}"
    frames = traceback.extract_tb(exc.__traceback__)
    if not frames:
        return text
    last = frames[-1]
    return f"{text} (in {last.name}, line {last.lineno})"
`,
      hint: 'Build `text = f"{type(exc).__name__}: {exc}"`. Get `frames = traceback.extract_tb(exc.__traceback__)`: an exception that was never raised gives an empty list. The innermost frame is `frames[-1]`; its attributes are `.name` and `.lineno`.',
    } },
    { real: 'On a team these habits decide how fast you can work with other people. A repository with Ruff, mypy and `pre-commit` set up means reviewers talk about **design and correctness** instead of spaces and imports, and a new colleague can follow the same rules without reading a style guide. For debugging, the habit that impresses is the calm one: reproduce with the smallest input, read the traceback from the bottom, look at real values with a breakpoint, bisect the pipeline by row counts at each stage, and add a regression test. Put the commands in the README of Project A (`ruff check .`, `ruff format .`, `mypy .`, `pytest`), and your project reads as professional work.' },
    { interview: `**"What do you use to keep Python code clean?"**
Model answer: "A formatter and a linter, both Ruff, configured in \`pyproject.toml\`, plus mypy for type checks and pytest for behaviour. They run on save in the editor, in a pre-commit hook before every commit, and again in CI on every push. The formatter ends style arguments and the linter catches likely bugs such as unused imports, bare excepts and mutable default arguments."

**"A job fails with a traceback. How do you approach it?"** "I read the traceback from the bottom: the exception type and message, then the frame where it was raised, then who called it. I reproduce it with the smallest input that still fails, and I look at the real values with a debugger or a breakpoint instead of guessing. If the bad value comes from earlier in a pipeline I bisect: check the data at the middle stage and halve the search. Then I write a regression test and fix the cause, not the symptom."

**"What is the difference between a linter and a type checker?"** "A linter applies rules to the syntax tree and finds likely bugs and bad habits, such as unused names or bare excepts. A type checker reads type hints and follows values through the program to find type errors, for example calling \`.upper()\` on something that can be \`None\`. They overlap little, so I use both."

**"What does a pre-commit hook do?"** "Git runs it before a commit is created. With the \`pre-commit\` tool it runs the formatter, linter and fast tests on the changed files and refuses the commit if something fails. CI repeats the checks so that a developer who skips the hook cannot break the main branch."` },
    `## Recap
- **Formatter** (\`ruff format\`) ends style arguments, **linter** (\`ruff check --fix\`) finds likely bugs by walking the **syntax tree** (\`ast\`), **type checker** (\`mypy\`) follows type hints, **tests** check behaviour. Configure them in \`pyproject.toml\`, run them on save, in a **pre-commit** hook, and again in CI.
- Style that matters: \`snake_case\`, clear names, docstrings, short functions, comments that say **why**, constants instead of magic numbers. Silence a rule on one line with a reason, never everywhere.
- **Read a traceback from the bottom**: what (type and message), where (the frame above), who called (upward). The wrong value often came from an earlier stage.
- **Debug with method:** reproduce small, inspect real values with a **debugger** (breakpoints, step over / into / out, conditional breakpoints, \`pytest --pdb\`), **bisect** the pipeline or the history, change one thing at a time, add a **regression test**.
- Data bugs: compare **row counts** between stages, check the smallest failing row, types, encodings, time zones, NULLs and join keys.`,
  ],
  quiz: [
    { q: 'What is the main job of a code formatter such as `ruff format`?', o: ['to find logic bugs', 'to check types', 'to rewrite the layout (spaces, quotes, line breaks) to one agreed style', 'to run the tests'], a: 2, why: 'A formatter only changes how the code looks, not what it does. That ends style discussions in reviews.' },
    { q: 'How does a linter find a bare `except:` or an unused import?', o: ['it runs the program and watches', 'it parses the code into a syntax tree and applies rules to the nodes', 'it searches the text with one regular expression', 'it asks the developer'], a: 1, why: 'Linters use the abstract syntax tree (the ast module does the same). Rules are checks on node types, such as an ExceptHandler with no exception type.' },
    { q: 'In a traceback, where do you look first?', o: ['at the first line', 'at the library code', 'at the last line: the exception type and message, then the frame just above it', 'at the file name only'], a: 2, why: 'The last line says what happened and the frame above it says where. Then you read upward to see the chain of calls.' },
    { q: 'You must find which of 1,000 pipeline steps first produces a wrong value. Which method needs the fewest checks?', o: ['check every step in order', 'bisect: test the middle step, then keep the half that contains the first bad one', 'add a print line to every step', 'rewrite the pipeline'], a: 1, why: 'Bisection halves the search each time, so about ten checks find one step among a thousand. `git bisect` applies the same idea to commits.' },
    { q: 'What does a conditional breakpoint do?', o: ['it stops only when an expression you wrote is true, for example a row with a missing amount', 'it stops on every line', 'it deletes the breakpoint after one stop', 'it logs a message without stopping'], a: 0, why: 'A condition lets you skip the thousands of normal iterations and stop only at the interesting one.' },
    { q: 'What does a pre-commit hook add on top of running Ruff by hand?', o: ['it makes Ruff faster', 'it replaces the need for tests', 'it uploads the code to GitHub', 'it runs the checks automatically before every commit and refuses the commit if they fail'], a: 3, why: 'The hook makes the checks automatic, so nobody has to remember them. CI then repeats them as a safety net.' },
  ],
  task: {
    title: 'Clean a messy script, and debug a planted bug',
    steps: [
      'In `C:\\fde\\py-recap` create `sloppy.py` and `pyproject.toml` from the lesson. Run `ruff check sloppy.py`, then `ruff check --fix`, then fix the rest by hand (mutable default, bare except, variable `l`). Run `ruff format sloppy.py` and `mypy sloppy.py`. Keep the before and after outputs.',
      'Install the Ruff extension in VS Code and turn on format on save. Break the style on purpose and watch it fix itself.',
      'Create a `.pre-commit-config.yaml` as in the lesson in your `kollana-reports` repository and run `pre-commit install` and `pre-commit run --all-files`. Make a commit with a bad import and see the hook refuse it.',
      'Write `buggy_report.py` that totals the debit column of `fact_gl.csv` after you edit one row to have an empty debit. Read the traceback aloud, write down what / where / who called, then set a conditional breakpoint (`row["debit"] == ""`) in VS Code and look at the row.',
      'Add a regression test in `tests/` that reproduces the empty-debit row, then fix the code so empty becomes zero (and logs a warning). Run `pytest`.',
      'Write `lint(source)` (challenge 1) and run it on your own scripts. Compare its findings with Ruff\'s: which of the three rules does Ruff report with a different code?',
    ],
    deliverable: 'The before and after Ruff output, the pre-commit run, your traceback notes, the regression test, and your `lint` output on your own code.',
  },
};
