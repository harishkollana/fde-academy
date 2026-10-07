export default {
  id: 'python-modules',
  title: 'Modules and packages',
  goal: 'You can split code into modules and packages, explain what import does and where Python looks for files, use absolute and relative imports, guard a script with __name__, run a package with python -m, and fix shadowed names and circular imports.',
  roadmap: ['imports, modules and packages', 'if __name__ == "__main__"', 'import paths (sys.path)', 'project layout of a Python package'],
  blocks: [
    `## The problem
Your reporting script started at 40 lines. Today it is 900 lines in one file: cleaning functions, file readers, the Excel writer, and the code that runs it all. You scroll for a minute to find one function. You want to reuse \`clean_amount\` in the GST project, so you copy it there, and now two copies drift apart.

Python's answer is the **module**. A module is simply **a \`.py\` file**. Another file can *import* it and use the names inside. When one file is not enough, several modules go into a folder, and that folder is a **package**. Every library you will use (\`csv\`, \`pandas\`, \`fastapi\`) is a module or a package, and your own code works the same way.

This lesson answers four questions that cause most beginner pain:
1. What does \`import\` actually do?
2. How does Python find the file?
3. What is \`if __name__ == "__main__"\` for?
4. Why do I get *circular import* and *No module named* errors?`,
    `## What import really does
When Python meets \`import kollana_reports.cleaning\` it does four things:
1. **Looks in \`sys.modules\`**, a dict of everything already imported in this run. If the module is there, Python reuses it and stops. This is why importing the same module ten times costs almost nothing.
2. If not, **searches for the file**, folder by folder, in the list \`sys.path\`.
3. **Runs the file from top to bottom, once.** Every \`def\`, \`class\` and top-level statement executes now. The result is a *module object* whose attributes are the names the file defined.
4. **Stores it in \`sys.modules\`** and gives you a name for it.

Step 3 matters. A module that prints, reads a file or connects to a database *at the top level* does that work on import, which surprises everybody who imports it. Keep the top level of a module for definitions (\`def\`, \`class\`, constants) and put the work inside functions.`,
    { sketch: { w: 760, h: 322, caption: 'The four steps of import. Step 1 is why a module runs only once per program run', items: [
      { t: 'text', x: 380, y: 22, text: 'import kollana_reports.cleaning', font: 'mono', size: 14, bold: true, anchor: 'middle' },
      { t: 'box', x: 14, y: 46, w: 168, h: 76, label: '1  sys.modules', sub: 'already loaded?', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 184, y1: 84, x2: 206, y2: 84 },
      { t: 'box', x: 208, y: 46, w: 168, h: 76, label: '2  sys.path', sub: 'find the file', fill: 'blue', size: 17 },
      { t: 'arrow', x1: 378, y1: 84, x2: 400, y2: 84 },
      { t: 'box', x: 402, y: 46, w: 168, h: 76, label: '3  run the file', sub: 'top to bottom, ONCE', fill: 'orange', size: 17 },
      { t: 'arrow', x1: 572, y1: 84, x2: 594, y2: 84 },
      { t: 'box', x: 596, y: 46, w: 150, h: 76, label: '4  save + bind', sub: 'in sys.modules', fill: 'green', size: 17 },
      { t: 'arrow', x1: 98, y1: 124, x2: 98, y2: 168, label: 'yes', lx: 18, ly: 0 },
      { t: 'box', x: 14, y: 172, w: 168, h: 46, label: 'reuse it', sub: 'nothing runs', fill: 'green', size: 16 },
      { t: 'table', x: 208, y: 150, title: 'sys.path: Python tries these in order, first hit wins', cols: ['#', 'folder'], colW: [34, 400], rows: [['1', "your script's folder (the current folder with -m)"], ['2', 'folders in the PYTHONPATH variable'], ['3', 'the standard library (csv, json, datetime ...)'], ['4', 'site-packages (what pip installed)']], rowH: 26, hl: [0] },
      { t: 'note', x: 14, y: 244, w: 190, h: 66, fill: 'pink', size: 13, text: 'Not found anywhere:\nModuleNotFoundError:\nNo module named ...' },
    ] } },
    `### The forms of import
| You write | You get | Use it when |
|---|---|---|
| \`import csv\` | the module; use \`csv.reader\` | the default: the name shows where things come from |
| \`import numpy as np\` | the module under a short name | a well-known short alias |
| \`from csv import reader\` | just that name; use \`reader\` | a few names used a lot |
| \`from kollana_reports import cleaning\` | a module from a package | importing a module out of a package |
| \`from csv import *\` | every public name | **avoid**: you cannot tell where a name came from |

\`from x import y\` and \`import x\` run the whole of \`x\` the same way. The difference is only which names you receive.`,
    { py: {
      title: 'Build a package on disk, import it, and look inside',
      starter: `import importlib, shutil, sys, tempfile
from pathlib import Path

sys.dont_write_bytecode = True                 # keep the demo folder free of .pyc files
root = Path(tempfile.mkdtemp())                # a scratch folder for our demo package
pkg = root / "kollana_demo"
(pkg / "loaders").mkdir(parents=True)

(pkg / "__init__.py").write_text('''
print("  [running kollana_demo/__init__.py]")
VERSION = "1.0"
''')
(pkg / "cleaning.py").write_text('''
print("  [running cleaning.py, __name__ is", __name__, "]")

def clean_amount(text):
    return float(text.replace(",", "").strip())
''')
(pkg / "loaders" / "__init__.py").write_text("")
(pkg / "loaders" / "gl.py").write_text('''
from ..cleaning import clean_amount      # two dots: go up to the parent package, kollana_demo

def total(rows):
    return sum(clean_amount(r) for r in rows)
''')
importlib.invalidate_caches()

sys.path.insert(0, str(root))                  # now Python can find kollana_demo
try:
    print("1) first import runs the files:")
    from kollana_demo.loaders import gl
    print("2) second import is served from sys.modules, nothing runs:")
    from kollana_demo.loaders import gl as again
    print("   same module object:", gl is again)

    print("3) use it:", gl.total(["1,000.50", " 2,000 "]))
    print("   __name__   :", gl.__name__)
    print("   __package__:", gl.__package__)
    print("   file       :", Path(gl.__file__).relative_to(root).as_posix())
    print("   in sys.modules:", sorted(m for m in sys.modules if m.startswith("kollana_demo")))
finally:
    sys.path.remove(str(root))                 # clean up: leave nothing behind
    for name in [m for m in sys.modules if m.startswith("kollana_demo")]:
        del sys.modules[name]
    shutil.rmtree(root)`,
      note: 'Notice the order of the "[running ...]" lines: the package `__init__.py` runs first, then `cleaning.py` (pulled in by the relative import), and the second import prints nothing at all.',
    } },
    `## Where Python looks: sys.path, and the shadowing trap
\`sys.path\` is a plain list of folders. Python walks it from the first entry to the last and takes the **first** match. Two consequences:

**1. "No module named x"** means no folder in \`sys.path\` contains \`x\`. Usual causes: you are in the wrong working folder, you forgot to install it with pip, or you installed it for a different Python than the one that runs your script.

**2. Shadowing.** The folder of your script comes **first**, before the standard library. If your project contains a file called \`csv.py\`, \`random.py\`, \`email.py\`, \`logging.py\` or \`types.py\`, then \`import csv\` gives *your* file, and a library that needs the real one breaks with a strange error such as \`AttributeError: partially initialized module 'csv' has no attribute 'reader'\`. The cure is to rename your file. The diagnostic is one line: print \`module.__file__\` and see where it came from.`,
    { py: {
      title: 'Shadowing: my sched.py beats the standard-library sched',
      starter: `import shutil, sys, tempfile
from pathlib import Path

sys.dont_write_bytecode = True
sys.modules.pop("sched", None)                 # make sure the real one is not cached yet
root = Path(tempfile.mkdtemp())
(root / "sched.py").write_text('VERSION = "my own sched.py"\\n')   # same name as a standard-library module

sys.path.insert(0, str(root))                  # first in the list wins
try:
    import sched
    print("imported:", getattr(sched, "VERSION", "the real standard-library sched"))
    print("came from:", "my folder" if str(root) in sched.__file__ else "the standard library")
    print("has the real scheduler class?", hasattr(sched, "scheduler"))
finally:
    sys.path.remove(str(root))
    sys.modules.pop("sched", None)
    shutil.rmtree(root)

import sched                                   # path is clean again
print("after cleanup:", hasattr(sched, "scheduler"), "(the real module is back)")`,
      note: 'Your own file looked like a normal module, so nothing complained at import time. The failure appears later, when somebody calls something that is not there. That delay is what makes shadowing hard to debug.',
    } },
    `## Packages: a folder of modules
A **package** is a folder that contains an \`__init__.py\` file (it may be empty). Once it exists you can import from the folder with dots: \`kollana_reports.loaders.gl\` means "folder \`kollana_reports\`, folder \`loaders\`, file \`gl.py\`". The \`__init__.py\` runs when the package is first imported, so it is also the place to expose a tidy public interface.

Inside a package you can import a sibling in two styles:
- **Absolute**: \`from kollana_reports.cleaning import clean_amount\`. Always works, always clear. Prefer it.
- **Relative**: \`from ..cleaning import clean_amount\`. One dot (\`.\`) means "this package", two dots (\`..\`) mean "the parent package". Short, and it survives renaming the top folder, but it **only works inside a package**.`,
    { sketch: { w: 760, h: 300, caption: 'A small package and what each kind of import means from inside loaders/gl.py', items: [
      { t: 'text', x: 14, y: 26, text: 'C:\\fde\\py-recap\\', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 200, y: 26, text: '<- run your commands from here', size: 14, anchor: 'start', color: '#c0392b' },
      { t: 'text', x: 34, y: 52, text: 'kollana_reports\\', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 200, y: 52, text: 'a package (has __init__.py)', size: 14, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 54, y: 78, text: '__init__.py', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 54, y: 104, text: '__main__.py', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 200, y: 104, text: 'runs for: py -m kollana_reports', size: 14, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 54, y: 130, text: 'cleaning.py', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 200, y: 130, text: 'a module', size: 14, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 54, y: 156, text: 'loaders\\', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 200, y: 156, text: 'a sub-package', size: 14, anchor: 'start', color: '#5c6478' },
      { t: 'text', x: 74, y: 182, text: '__init__.py', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 74, y: 208, text: 'gl.py', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 200, y: 208, text: 'we write the imports in this file', size: 14, anchor: 'start', color: '#5c6478' },
      { t: 'box', x: 470, y: 30, w: 276, h: 66, fill: 'green' },
      { t: 'text', x: 482, y: 54, text: 'from . import helpers', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 482, y: 78, text: '1 dot  = loaders (this package)', size: 14, anchor: 'start' },
      { t: 'box', x: 470, y: 108, w: 276, h: 66, fill: 'blue' },
      { t: 'text', x: 482, y: 132, text: 'from ..cleaning import clean', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 482, y: 156, text: '2 dots = kollana_reports (parent)', size: 14, anchor: 'start' },
      { t: 'box', x: 470, y: 186, w: 276, h: 66, fill: 'yellow' },
      { t: 'text', x: 482, y: 210, text: 'from kollana_reports.cleaning import x', font: 'mono', size: 11, anchor: 'start' },
      { t: 'text', x: 482, y: 234, text: 'absolute: the full path, always OK', size: 14, anchor: 'start' },
      { t: 'note', x: 14, y: 246, w: 440, h: 46, fill: 'pink', size: 13, text: 'py kollana_reports\\loaders\\gl.py  ->  ImportError: attempted relative\nimport with no known parent package. Run it as a module (py -m) instead.' },
    ] } },
    `## Scripts, imports and \`__name__\`
Every module has a built-in variable called \`__name__\`:
- When the file is **imported**, \`__name__\` is the module's name (\`"cleaning"\`).
- When the file is **run** as the program (\`py report.py\`), \`__name__\` is the text \`"__main__"\`.

That gives you the most common idiom in Python:
\`\`\`python
def build_report(month):
    ...

if __name__ == "__main__":      # true only when you RUN this file
    build_report("2026-09")
\`\`\`
Without the guard, importing the file (from a test, or from another script that only wants \`build_report\`) would also run the report. With it, the same file is both a **library** and a **program**.

To run a module that lives inside a package, use \`py -m package.module\` from the folder that **contains** the package. \`-m\` puts the current folder on \`sys.path\` and runs the module with its package known, so relative imports work. A file named \`__main__.py\` inside a package is what runs for \`py -m kollana_reports\`.`,
    { py: {
      title: 'Imported or run? The same file, two behaviours',
      starter: `import runpy, shutil, sys, tempfile
from pathlib import Path

sys.dont_write_bytecode = True
root = Path(tempfile.mkdtemp())
tool = root / "month_end_tool.py"
tool.write_text('''
def build_report(month):
    return f"report for {month}"

print("file executed, __name__ is", __name__)

if __name__ == "__main__":
    # this block runs only when the file is RUN, not when it is imported
    print("running as a script:", build_report("2026-09"))
''')

sys.path.insert(0, str(root))
try:
    print("--- import month_end_tool   (what a test or another script does)")
    import month_end_tool
    print("the function is available:", month_end_tool.build_report("2026-08"))

    print("--- run it   (like: py month_end_tool.py)")
    runpy.run_path(str(tool), run_name="__main__")
finally:
    sys.path.remove(str(root))
    sys.modules.pop("month_end_tool", None)
    shutil.rmtree(root)`,
      note: '`runpy.run_path(..., run_name="__main__")` is how Python itself starts a script. Look at the first printed line in each case: only the name differs, and that one difference decides whether the guarded block runs.',
    } },
    `## Circular imports
Suppose \`gl.py\` imports something from \`tax.py\`, and \`tax.py\` imports something from \`gl.py\`. Python starts \`gl.py\`, hits the import on line 1, pauses \`gl.py\` and runs \`tax.py\`. When \`tax.py\` asks \`gl\` for a name, \`gl\` is in \`sys.modules\` but only **half-built**: the lines after its import have not run, so the name does not exist yet. You get:
\`ImportError: cannot import name 'post' from partially initialized module 'gl' (most likely due to a circular import)\`.

Fixes, in order of preference:
1. **Move the shared code into a third module** that imports neither of the two. This is almost always the right answer: a cycle is a sign that two modules share something that deserves its own home.
2. Import **inside the function** that needs it (the import then runs at call time, when both modules are complete). It works, but it hides the design problem.
3. Import the module (\`import tax\`) instead of a name from it (\`from tax import gst_on\`), and use \`tax.gst_on(...)\` later.`,
    { sketch: { w: 760, h: 330, caption: 'A circular import and its usual fix: move the shared code to a third module', items: [
      { t: 'text', x: 190, y: 22, text: 'The cycle', size: 17, bold: true, anchor: 'middle' },
      { t: 'box', x: 20, y: 34, w: 330, h: 70, fill: 'blue' },
      { t: 'text', x: 32, y: 54, text: 'circ_gl.py', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 32, y: 78, text: '1  from circ_tax import gst_on', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 32, y: 98, text: '2  def post(amount): ...', font: 'mono', size: 12, anchor: 'start', color: '#9aa3b5' },
      { t: 'box', x: 20, y: 150, w: 330, h: 70, fill: 'yellow' },
      { t: 'text', x: 32, y: 170, text: 'circ_tax.py', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 32, y: 194, text: '1  from circ_gl import post', font: 'mono', size: 12, anchor: 'start' },
      { t: 'text', x: 32, y: 214, text: '2  def gst_on(amount): ...', font: 'mono', size: 12, anchor: 'start', color: '#9aa3b5' },
      { t: 'arrow', x1: 120, y1: 106, x2: 120, y2: 148, label: '1', lx: -14, ly: 0 },
      { t: 'arrow', x1: 250, y1: 148, x2: 250, y2: 106, color: '#c0392b', label: '2', lx: 14, ly: 0 },
      { t: 'mark', x: 300, y: 127, ok: false },
      { t: 'note', x: 20, y: 232, w: 430, h: 88, fill: 'pink', size: 13, text: '1  Python runs circ_gl, line 1, and pauses to load circ_tax.\n2  circ_tax line 1 asks circ_gl for post. But circ_gl is only\n    half-built (its line 2 has not run), so post does not exist\n    yet: ImportError.' },
      { t: 'text', x: 613, y: 22, text: 'The fix', size: 17, bold: true, anchor: 'middle' },
      { t: 'box', x: 480, y: 40, w: 266, h: 56, fill: 'green' },
      { t: 'text', x: 492, y: 60, text: 'circ_rules.py', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 492, y: 84, text: 'def gst_on(amount): ...', font: 'mono', size: 12, anchor: 'start' },
      { t: 'arrow', x1: 613, y1: 148, x2: 613, y2: 100, label: 'imports', lx: 36, ly: 0 },
      { t: 'box', x: 480, y: 152, w: 266, h: 56, fill: 'blue' },
      { t: 'text', x: 492, y: 172, text: 'circ_gl.py', font: 'mono', size: 12, anchor: 'start', bold: true },
      { t: 'text', x: 492, y: 196, text: 'from circ_rules import gst_on', font: 'mono', size: 11, anchor: 'start' },
      { t: 'note', x: 480, y: 232, w: 266, h: 88, fill: 'green', size: 13, text: 'Arrows only point one way,\nso there is no cycle.\nDraw your imports as arrows\non paper to check.' },
    ] } },
    { py: {
      title: 'Cause a circular import, read the error, then fix it',
      starter: `import importlib, shutil, sys, tempfile
from pathlib import Path

sys.dont_write_bytecode = True
root = Path(tempfile.mkdtemp())

(root / "circ_gl.py").write_text('''
from circ_tax import gst_on        # needs circ_tax to be finished...

def post(amount):
    return amount + gst_on(amount)
''')
(root / "circ_tax.py").write_text('''
from circ_gl import post           # ...but circ_tax needs circ_gl to be finished first

def gst_on(amount):
    return round(amount * 0.18, 2)
''')
importlib.invalidate_caches()

sys.path.insert(0, str(root))
try:
    try:
        import circ_gl
    except ImportError as e:
        print("ImportError:", str(e).replace(str(root), "<tmp>"))

    # The fix: shared code goes into a third module that imports neither
    (root / "circ_rules.py").write_text('''
def gst_on(amount):
    return round(amount * 0.18, 2)
''')
    (root / "circ_gl.py").write_text('''
from circ_rules import gst_on

def post(amount):
    return amount + gst_on(amount)
''')
    for name in ("circ_gl", "circ_tax", "circ_rules"):
        sys.modules.pop(name, None)
    importlib.invalidate_caches()
    import circ_gl
    print("fixed: post(1000) =", circ_gl.post(1000))
finally:
    sys.path.remove(str(root))
    for name in ("circ_gl", "circ_tax", "circ_rules"):
        sys.modules.pop(name, None)
    shutil.rmtree(root)`,
      note: 'The error text names the module that was "partially initialized". Read it as: "you asked a half-built module for a name it has not defined yet".',
    } },
    { warn: `Four traps with imports:
- **Shadowing**: never name your own file after a standard-library module (\`csv.py\`, \`random.py\`, \`email.py\`, \`logging.py\`, \`types.py\`, \`test.py\`). Print \`module.__file__\` to see which file you really got.
- **Import side effects**: a module that connects to a database or reads a big file at the top level does it on every import, including in tests. Put work inside functions.
- **Relative imports only work inside a package.** Running \`py loaders\\gl.py\` makes \`gl.py\` a loose script with no package, so \`from ..cleaning import x\` fails. Run \`py -m kollana_reports.loaders.gl\` from the folder that contains \`kollana_reports\`.
- **Editing a module while a program is running**: Python does not re-read it. Restart the program (\`importlib.reload\` exists, but treat it as a debugging tool, not as a design).` },
    { local: `**Build and run a real package on your laptop**
Do this once. It is the shape of every project you will build in this course. (If you have not exported the practice CSV files yet, do the export step in the *Comprehensions and control flow* task first. You need \`fact_gl.csv\` in \`C:\\fde\\py-recap\`.)

1. Create these files. \`__init__.py\` in both folders can stay empty.
\`\`\`text
C:\\fde\\py-recap\\
    fact_gl.csv
    kollana_reports\\
        __init__.py
        __main__.py
        cleaning.py
        loaders\\
            __init__.py
            gl.py
\`\`\`
2. \`kollana_reports\\cleaning.py\`:
\`\`\`python
"""Small cleaning helpers shared by all loaders."""


def clean_amount(text):
    return float(text.replace(",", "").replace("₹", "").strip() or 0)
\`\`\`
3. \`kollana_reports\\loaders\\gl.py\`:
\`\`\`python
import csv

from ..cleaning import clean_amount


def total_debit(path):
    with open(path, newline="", encoding="utf-8") as f:
        return sum(clean_amount(row["debit"]) for row in csv.DictReader(f))
\`\`\`
4. \`kollana_reports\\__main__.py\`:
\`\`\`python
from .loaders.gl import total_debit


def main():
    print("Total debit:", round(total_debit("fact_gl.csv"), 2))


if __name__ == "__main__":
    main()
\`\`\`
5. In PowerShell, from \`C:\\fde\\py-recap\` (the folder that **contains** \`kollana_reports\`):
\`\`\`powershell
cd C:\\fde\\py-recap
py -m kollana_reports
\`\`\`
Expected output (the sum of the debit column of all 1,227 GL lines):
\`\`\`text
Total debit: 6688218.74
\`\`\`
**Errors you can now read:**
- \`py kollana_reports\\loaders\\gl.py\` gives \`ImportError: attempted relative import with no known parent package\`. You ran a file inside a package as a loose script. Use \`py -m\` from the project root.
- Running \`py -m kollana_reports\` from **inside** the \`kollana_reports\` folder gives \`No module named kollana_reports\`. The folder that contains the package is not on \`sys.path\`; \`cd\` one level up.` },
    { pychallenge: {
      id: 'python-modules-ch1',
      prompt: 'Write `imported_modules(source)`. `source` is the text of a Python file. Return a **sorted list** of the **top-level** names of the modules it imports, without duplicates: `import os.path` gives `os`, `from pandas.io import x` gives `pandas`, `import numpy as np` gives `numpy`. Ignore relative imports such as `from . import x` or `from ..cleaning import y`. Use the `ast` module (`ast.parse`, then `ast.walk`, looking at `ast.Import` and `ast.ImportFrom`). This is how tools such as `pipreqs` list what a project needs.',
      starter: `import ast

def imported_modules(source):
    # TODO: parse the source, walk the tree, collect the first part of each imported module name
    return []
`,
      tests: `src = """
import os.path
import numpy as np, csv
from pandas.io import parsers
from . import helpers
from ..cleaning import clean_amount
from kollana_reports.loaders import gl
import csv

def f():
    import json
"""
r = imported_modules(src)
assert r == ["csv", "json", "kollana_reports", "numpy", "os", "pandas"], r
assert imported_modules("x = 1") == []
assert imported_modules("from . import a") == []`,
      solution: `import ast

def imported_modules(source):
    found = set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            for alias in node.names:
                found.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            if node.level == 0 and node.module:
                found.add(node.module.split(".")[0])
    return sorted(found)
`,
      hint: 'For `ast.Import`, loop over `node.names` and take `alias.name.split(".")[0]`. For `ast.ImportFrom`, check `node.level == 0` (0 means an absolute import) and use `node.module.split(".")[0]`. Collect into a set, then `sorted(...)`.',
    } },
    { pychallenge: {
      id: 'python-modules-ch2',
      prompt: 'Write `resolve_import(current, level, name, is_package=False)` that turns a relative import into an absolute module name. `current` is the dotted name of the file doing the import (`"kollana.etl.load"`), `level` is the number of dots, `name` is the text after the dots (it may be empty, as in `from . import x`). For a normal module, one dot means "the package that contains it" (`"kollana.etl"`); if `is_package` is true, `current` already is a package (an `__init__.py`), so one dot means `current` itself. Going above the top-level package must raise `ValueError`.',
      starter: `def resolve_import(current, level, name, is_package=False):
    # TODO: find the base package, go up (level - 1) more packages, then add name
    return name
`,
      tests: `assert resolve_import("kollana.etl.load", 1, "utils") == "kollana.etl.utils"
assert resolve_import("kollana.etl.load", 2, "utils") == "kollana.utils"
assert resolve_import("kollana.etl.load", 1, "") == "kollana.etl"
assert resolve_import("kollana.etl.load", 2, "") == "kollana"
assert resolve_import("kollana.etl", 1, "load", is_package=True) == "kollana.etl.load"
assert resolve_import("kollana.etl", 2, "cleaning", is_package=True) == "kollana.cleaning"
assert resolve_import("kollana.cleaning", 1, "x") == "kollana.x"
try:
    resolve_import("kollana.etl.load", 3, "x")
    raise AssertionError("level 3 is above the top-level package")
except ValueError:
    pass
try:
    resolve_import("script", 1, "x")
    raise AssertionError("a top-level module has no parent package")
except ValueError:
    pass`,
      solution: `def resolve_import(current, level, name, is_package=False):
    parts = current.split(".")
    base = parts if is_package else parts[:-1]
    if level - 1 >= len(base):
        raise ValueError("attempted relative import beyond top-level package")
    base = base[:len(base) - (level - 1)]
    if name:
        base = base + [name]
    return ".".join(base)
`,
      hint: 'The base package is `current.split(".")` for a package, or the same list without its last item for a normal module. Each extra dot beyond the first removes one more part: `base[:len(base) - (level - 1)]`. If there is nothing left to remove, raise `ValueError`.',
    } },
    { pychallenge: {
      id: 'python-modules-ch3',
      prompt: 'Write `find_cycle(graph)`. `graph` is a dict that maps a module name to the list of modules it imports. Return one import cycle as a list that starts and ends with the same module, for example `["a", "b", "a"]`, or `None` when there is no cycle. A module that imports itself is a cycle `["a", "a"]`. Use depth-first search and remember which modules are on the current path.',
      starter: `def find_cycle(graph):
    # TODO: depth-first search; a module that is already on the current path means a cycle
    return None
`,
      tests: `def is_cycle(c, graph):
    return c[0] == c[-1] and len(c) >= 2 and all(b in graph.get(a, []) for a, b in zip(c, c[1:]))

g1 = {"gl": ["tax"], "tax": ["gl"]}
c1 = find_cycle(g1)
assert c1 and is_cycle(c1, g1), c1
g2 = {"main": ["gl", "tax"], "gl": ["rules"], "tax": ["rules"], "rules": []}
assert find_cycle(g2) is None
g3 = {"a": ["a"]}
assert find_cycle(g3) == ["a", "a"], find_cycle(g3)
g4 = {"app": ["a"], "a": ["b"], "b": ["c"], "c": ["a", "d"], "d": []}
c4 = find_cycle(g4)
assert c4 and is_cycle(c4, g4), c4
assert find_cycle({}) is None
assert find_cycle({"x": ["y"]}) is None`,
      solution: `def find_cycle(graph):
    state = {}          # 1 = on the current path, 2 = finished
    path = []

    def visit(node):
        state[node] = 1
        path.append(node)
        for nxt in graph.get(node, []):
            if state.get(nxt) == 1:
                return path[path.index(nxt):] + [nxt]
            if nxt not in state:
                found = visit(nxt)
                if found:
                    return found
        path.pop()
        state[node] = 2
        return None

    for node in graph:
        if node not in state:
            found = visit(node)
            if found:
                return found
    return None
`,
      hint: 'Keep a dict of states and a list \`path\` of the modules on the current route. When you meet a module that is already on the path, the cycle is \`path[path.index(nxt):] + [nxt]\`. Mark a module finished when all its imports were visited, and pop it from the path.',
    } },
    { real: 'Every real project you will build here has the same skeleton: a package folder with a `cleaning` module, a few `loaders`, a `reports` module and a `__main__.py` that wires them together, run with `py -m yourpackage --month 2026-09`. The payoff is testing and teamwork: a colleague can import `clean_amount` without launching your whole report, and a test file can import it too. When you read someone else\'s repository, start at `__main__.py` or the file with the `if __name__ == "__main__"` guard and follow the imports from there.' },
    { interview: `**"What does \`if __name__ == "__main__"\` do?"**
Model answer: "\`__name__\` is \`"__main__"\` when the file is run directly and the module's name when it is imported. The guard makes a file usable both ways: other code can import its functions without side effects, and running it directly starts the program. It is also what lets tests import a script safely."

**"How does Python find a module?"** "It checks \`sys.modules\` first. If the module is not cached, it walks \`sys.path\` in order: the script's folder, \`PYTHONPATH\`, the standard library, then \`site-packages\`. The first match wins, which is why a local file named \`random.py\` can shadow the standard library."

**"What is a circular import and how do you fix it?"** "Two modules import each other, so one of them is used before it has finished running, and you get an \`ImportError\` about a partially initialized module. The best fix is to move the shared code into a third module that neither depends on. Importing inside a function also works but hides the design problem."

**"What is the difference between a module and a package?"** "A module is one \`.py\` file. A package is a folder with an \`__init__.py\` that groups modules and can be imported with dotted names."` },
    `## Recap
- A **module** is a \`.py\` file; a **package** is a folder with \`__init__.py\`. \`import\` checks \`sys.modules\`, searches \`sys.path\` (script folder first, then the standard library and site-packages), runs the file **once**, and caches it.
- Keep the top level of a module for definitions. Work at import time (prints, connections, file reads) surprises every importer.
- A local file named like a standard-library module **shadows** it. \`module.__file__\` tells you which file you got.
- Prefer absolute imports; relative imports (\`.\`, \`..\`) work only inside a package. Run package code with \`py -m package\` from the folder that contains it.
- \`if __name__ == "__main__":\` makes a file both a library and a program. Fix circular imports by moving shared code into a third module.`,
  ],
  quiz: [
    { q: 'You import the same module in five different files of one program. How many times does Python run its top-level code?', o: ['five times, once per import', 'twice', 'once: later imports reuse the module from `sys.modules`', 'never, imports only read the file'], a: 2, why: 'The first import runs the file and caches the module object in `sys.modules`. Later imports find it there and run nothing.' },
    { q: 'Your project has a file `csv.py`. A script in the same folder does `import csv; csv.reader(...)` and fails with `AttributeError`. Why?', o: ['the standard library has no `csv`', 'your own `csv.py` is found first in `sys.path` and shadows the standard one', 'you must install `csv` with pip', '`reader` was removed in Python 3.12'], a: 1, why: 'The script\'s folder is first in `sys.path`, so `import csv` returns your file, which has no `reader`. Rename your file.' },
    { q: 'What is the value of `__name__` inside a file that you start with `py report.py`?', o: ['`"report"`', '`"report.py"`', '`None`', '`"__main__"`'], a: 3, why: 'The file that Python starts as the program always gets `__name__ == "__main__"`. An imported file gets its module name.' },
    { q: 'You run `py kollana_reports\\loaders\\gl.py` and it fails with "attempted relative import with no known parent package". What is the right fix?', o: ['run `py -m kollana_reports.loaders.gl` from the folder that contains the package', 'replace the dots with slashes', 'add `import sys` at the top', 'delete the `__init__.py` files'], a: 0, why: 'Running the file directly makes it a loose script without a package, so relative imports have nothing to start from. `-m` runs it as a module inside its package.' },
    { q: 'Module A does `from b import f` and module B does `from a import g`. Importing A raises an ImportError about a "partially initialized module". What is the best fix?', o: ['wrap both imports in `try / except`', 'rename the two modules', 'move the shared code into a third module that neither A nor B imports from each other', 'use `from x import *`'], a: 2, why: 'A cycle usually means two modules share something that deserves its own module. With one-way arrows there is no half-built module to hit.' },
    { q: 'Where does Python look first when you write `import helpers`?', o: ['the standard library', 'site-packages', 'the internet', 'the folder of the script being run (the first entry of `sys.path`)'], a: 3, why: 'The first entry of `sys.path` is the script\'s folder (or the current folder with `-m`), so your own files win over the standard library and installed packages.' },
  ],
  task: {
    title: 'Turn your helper functions into a real package and run it with -m',
    steps: [
      'In `C:\\fde\\py-recap` create the package `kollana_reports` exactly as in the laptop callout (with `cleaning.py`, `loaders\\gl.py` and `__main__.py`) and run `py -m kollana_reports`. Check that the total matches `6688218.74`.',
      'Move `clean_amount` and `make_converter` from your *Functions* practice file into `kollana_reports\\cleaning.py`, and add a `loaders\\payroll.py` with `total_gross(path, run_month)` that reads `payroll.csv` and uses `clean_amount`.',
      'Change `__main__.py` so it prints the GL total and the September payroll total (`run_month` `2026-09-01`).',
      'Add `if __name__ == "__main__":` to a second file, `kollana_reports\\check.py`, that prints `"checks ok"`. Import it from a Python REPL (nothing should print) and run it with `py -m kollana_reports.check` (it should print).',
      'On purpose create a file `csv.py` in `C:\\fde\\py-recap`, run `py -m kollana_reports`, read the error, print `csv.__file__` in the REPL to prove the shadowing, then delete `csv.py`.',
      'Draw your imports as arrows on paper (which module imports which). Are there any cycles?',
    ],
    deliverable: 'The `kollana_reports` package folder, the output of `py -m kollana_reports`, and a short note of the shadowing error you saw.',
  },
};
