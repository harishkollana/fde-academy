export default {
  id: 'python-environments-packaging',
  title: 'Environments and packaging',
  goal: 'You can create and use a virtual environment on Windows, manage dependencies with pip or uv, write a pyproject.toml with version ranges, understand lock files, wheels and editable installs, lay out a project, and package a script as an executable for people without Python.',
  roadmap: ['venv and pip', 'uv', 'requirements.txt vs pyproject.toml', 'project layout', 'wheels', 'PyInstaller'],
  blocks: [
    `## The problem
"It works on my machine." Your month-end script uses pandas 2.3. The server has pandas 1.5, so it crashes. You upgrade pandas there, and another project on the same server, which needed 1.5, breaks. A colleague asks "what do I install to run this?" and the honest answer is "I don't remember". A finance user who has no Python at all needs to run your tool by double-clicking.

Four ideas solve nearly all of this:
1. **Isolation.** Every project gets its **own environment** with its own Python and its own packages, so projects cannot disturb each other.
2. **A written recipe.** The list of what the project needs lives in a file (\`pyproject.toml\`), with **version ranges**, and a **lock file** records the exact versions that were tested, so anybody can recreate the same setup.
3. **A package.** Your code is laid out as a proper package that can be installed, imported from anywhere, and tested without path hacks.
4. **Delivery.** You can hand over a wheel to developers or an executable to users.

You will do most of this in PowerShell on your laptop. The playgrounds here take the magic out of it: you will read a \`pyproject.toml\`, compare versions the way pip does, and build and "install" a real wheel in memory.`,
    `## Virtual environments
When you install Python you get one **interpreter** and one shared folder of packages (\`site-packages\`). If every project installs into it, projects fight over versions. A **virtual environment** (venv) is a folder that holds **its own copy of the Python launcher and its own \`site-packages\`**. You create one **per project**:
\`\`\`powershell
cd C:\\fde\\kollana-reports
py -3.12 -m venv .venv                  # create the environment in a folder called .venv
.\\.venv\\Scripts\\Activate.ps1           # activate it: the prompt now starts with (.venv)
python -m pip install pandas            # installs into .venv only
python -m pip freeze                    # lists exactly what is installed
deactivate                              # leave the environment
\`\`\`
What "activate" really does: it puts \`.venv\\Scripts\` at the **front of your PATH**, so the word \`python\` now means the environment's Python. Check it with \`Get-Command python\` (it should point inside \`.venv\`). You can also skip activation and call \`.venv\\Scripts\\python.exe\` directly, which is what schedulers and VS Code do.

**Rules that avoid pain:**
- **One venv per project**, created inside the project folder, and **never committed** (put \`.venv/\` in \`.gitignore\`). It is large and specific to your computer; the recipe is what you share.
- Always write **\`python -m pip\`**, not just \`pip\`. It guarantees pip belongs to the Python you are running.
- **Never install project packages into the global Python.**
- In VS Code choose the interpreter (\`Ctrl+Shift+P\`, "Python: Select Interpreter") and pick the one in \`.venv\`, so the editor, the linter and the debugger all use it.
- To recreate an environment, delete \`.venv\` and make it again from the recipe. If that is painful, the recipe is incomplete.`,
    { sketch: { w: 760, h: 308, caption: 'Each project gets its own Python and packages, so versions can differ without a fight', items: [
      { t: 'box', x: 14, y: 30, w: 220, h: 124, label: 'global Python', sub: 'keep it clean:\ninstall nothing here', fill: 'grey', size: 17 },
      { t: 'box', x: 270, y: 30, w: 222, h: 124, label: 'kollana-reports\\.venv', sub: 'own python.exe, and own\npandas 2.3, pydantic 2', fill: 'green', size: 17 },
      { t: 'box', x: 526, y: 30, w: 220, h: 124, label: 'old-report\\.venv', sub: 'own python.exe, and own\npandas 1.5, numpy 1.24', fill: 'yellow', size: 17 },
      { t: 'arrow', x1: 381, y1: 158, x2: 381, y2: 184 },
      { t: 'text', x: 394, y: 176, text: 'Activate.ps1', size: 13, anchor: 'start', color: '#c0392b' },
      { t: 'box', x: 220, y: 188, w: 320, h: 56, label: 'PATH starts with .venv\\Scripts', sub: 'so "python" and "pip" mean this environment', fill: 'blue', size: 15 },
      { t: 'note', x: 14, y: 254, w: 732, h: 40, fill: 'yellow', size: 14, text: 'Two projects, two pandas versions, no conflict. Share the recipe (pyproject.toml and the lock file), never the .venv folder.' },
    ] } },
    { local: `**Create and use an environment, step by step** (PowerShell, Python 3.12 installed as in the first lesson).
\`\`\`powershell
mkdir C:\\fde\\envdemo ; cd C:\\fde\\envdemo
py -3.12 -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
Get-Command python                       # should point into ...\\envdemo\\.venv\\Scripts\\python.exe
python -m pip list
python -m pip install six==1.16.0
python -m pip freeze
deactivate
\`\`\`
Output to expect (a fresh environment holds only pip; your pip version will differ, and pip may print a "new release is available" notice that you can ignore):
\`\`\`text
Package Version
------- -------
pip     25.0.1
...
six==1.16.0
\`\`\`
**Common errors and fixes on Windows**
- *\`Activate.ps1 cannot be loaded because running scripts is disabled on this system\`*: run once \`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned\` and open a new window. (On many machines this is already set.)
- *\`python\` opens the Microsoft Store, or "Python was not found"*: Windows has an "app execution alias". Use \`py -3.12\`, or switch off the alias in Settings, Apps, Advanced app settings, App execution aliases, and make sure the Python installer's "Add to PATH" was ticked.
- *\`pip\` is not recognised*: use \`python -m pip\`.
- *The prompt has no \`(.venv)\`*: activation failed or you are in another window. Check \`Get-Command python\`.
- *A package fails to build ("Microsoft Visual C++ 14.0 is required")*: the package has no ready-made wheel for your Python version. Try a newer release of the package, or a Python version that the package supports.
- *Behind a company proxy or firewall, SSL errors*: ask IT for the proxy and certificate settings; do not turn off certificate checks.` },
    `## Dependencies: ranges in the recipe, exact versions in the lock
A **dependency** is a package your project needs. Two different files answer two different questions:
- **\`pyproject.toml\`** says what the project **needs**, with **ranges**: \`pandas>=2.3,<3\` means "2.3 or newer, but not 3.0, which may break things". This is the human-edited recipe.
- A **lock file** says what was **actually installed and tested**, with **exact versions** of every package including the sub-dependencies. Installing from it gives the **same result on every machine and next month**. \`pip freeze > requirements.txt\` is the simplest form (a flat list of \`name==version\`); \`uv.lock\` is the richer one; \`pip-tools\` (\`pip-compile\`) produces a locked \`requirements.txt\` from your ranges.

**Version rules to read.** Versions look like **MAJOR.MINOR.PATCH** (\`2.3.3\`). A new PATCH fixes bugs, a new MINOR adds features, a new MAJOR **may break your code**. Common specifiers: \`==2.3.3\` (exactly), \`>=2.3\` (at least), \`<3\` (below), \`!=2.4.0\` (skip a bad release), and **\`~=2.3\`** ("compatible release": 2.3 or newer, but below 3.0). **Compare versions as numbers, not text**: as text \`"1.10"\` is smaller than \`"1.9"\`, but as versions 1.10 is newer.

**Applications and libraries differ.** An **application** (your report job) should be **locked**: exact, tested versions. A **library** (something others import) should declare **wide ranges** so it works with many setups, and be tested against several.

**Optional dependencies** group extras: \`pip install -e ".[dev]"\` installs the project plus the development tools (pytest, Ruff, mypy) you listed under \`[project.optional-dependencies]\`. **Markers** limit a dependency to some systems: \`tzdata; sys_platform == "win32"\`.

**pip or uv?** \`pip\` ships with Python. **\`uv\`** is a newer, much faster tool that does the same jobs (and also manages Python versions and lock files) with simple commands: \`uv init\`, \`uv add pandas\`, \`uv sync\`, \`uv run python script.py\`. Both are fine; learn pip's ideas first, because uv uses the same concepts. Check the current uv documentation for its commands.`,
    { py: {
      title: 'Read a pyproject.toml: project, dependencies, extras and the command it creates',
      starter: `import re
import tomllib
from importlib.metadata import PackageNotFoundError, version

PYPROJECT = '''
[project]
name = "kollana-reports"
version = "0.1.0"
description = "Month-end reporting for Kollana Tech"
requires-python = ">=3.12"
dependencies = [
    "pandas>=2.3,<3",
    "pydantic>=2.7",
    "pyyaml~=6.0",
    "tzdata; sys_platform == 'win32'",
]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff", "mypy"]

[project.scripts]
kollana-report = "kollana.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
'''

data = tomllib.loads(PYPROJECT)                     # tomllib is in the standard library (Python 3.11+)
project = data["project"]
print(project["name"], project["version"], "| needs Python", project["requires-python"])
print("runtime dependencies:")
for dep in project["dependencies"]:
    print("   ", dep)
print("dev extra  :", project["optional-dependencies"]["dev"])
print("commands   :", project["scripts"], "<- pip creates the command kollana-report")
print("built with :", data["build-system"]["build-backend"])

names = [re.match(r"[A-Za-z0-9_.-]+", dep).group().lower() for dep in project["dependencies"]]
print("names only :", names)

# the metadata of an installed package is readable too (this is what pip freeze prints)
import yaml
print("PyYAML major version installed here:", version("PyYAML").split(".")[0])
try:
    version("kollana-reports")
except PackageNotFoundError:
    print("kollana-reports is not installed here: PackageNotFoundError")`,
      note: 'The [project] table is the recipe: name, version, which Python, which packages. [project.scripts] is how a package creates a command after installation. [build-system] says which tool turns the source into a wheel. importlib.metadata reads the same metadata that pip freeze lists, so a program can ask "which version of pandas am I running with?" for its own log file.',
    } },
    { py: {
      title: 'Why versions are compared as numbers, and what ~= means',
      starter: `def parse_version(text):
    return [int(part) for part in text.split(".")]

def pad(a, b):                               # 2.3 and 2.3.0 are the same version: pad with zeros
    n = max(len(a), len(b))
    return a + [0] * (n - len(a)), b + [0] * (n - len(b))

print('as text    : "1.10" > "1.9" is', "1.10" > "1.9", "(wrong: compares character by character)")
print("as versions:", parse_version("1.10") > parse_version("1.9"), "(right: 10 is more than 9)")
print("2.3 == 2.3.0 as raw lists:", parse_version("2.3") == parse_version("2.3.0"), "| after padding:", pad(parse_version("2.3"), parse_version("2.3.0"))[0] == pad(parse_version("2.3"), parse_version("2.3.0"))[1])

def simple_satisfies(version, spec):         # a SIMPLE checker: only >=, < and ==. Challenge 2 builds the full one.
    v = parse_version(version)
    for part in spec.split(","):
        op = "".join(c for c in part if c in "<>=!~")
        target = parse_version(part.strip(op + " "))
        a, b = pad(v, target)
        ok = {">=": a >= b, "<": a < b, "==": a == b}[op]
        if not ok:
            return False
    return True

available = ["2.2.3", "2.3.0", "2.3.3", "2.4.0", "3.0.0"]
spec = ">=2.3,<3"
print(f"which of {available} satisfy '{spec}':")
print("   ", [v for v in available if simple_satisfies(v, spec)])

print("--- the ~= (compatible release) operator, written out")
print("~=2.3   means  >=2.3 and <3.0   (the part before the last number must stay the same)")
print("~=2.3.1 means  >=2.3.1 and <2.4")
print("so pip may install any 2.x newer than 2.3 for the first, but only 2.3.x for the second")`,
      note: 'pip does exactly this kind of comparison for every package and every sub-package to find versions that satisfy all the ranges at once. The text comparison in the first line shows the classic mistake of sorting versions alphabetically. Challenge 2 asks you to write the complete checker.',
    } },
    `## Project layout and installing your own code
Put your code in a **package** (a folder with \`__init__.py\`) and describe the project in \`pyproject.toml\`. A layout that scales:
\`\`\`text
kollana-reports/
  pyproject.toml
  README.md
  .gitignore                 <- includes .venv/
  uv.lock  (or requirements.txt)
  src/
    kollana/
      __init__.py
      finance.py
      cli.py                 <- has main()
  tests/
    test_finance.py
\`\`\`
The **\`src/\` layout** keeps the importable code in \`src/\`, so a test can only import it if it is **installed**, which catches packaging mistakes early. A flat layout (\`kollana/\` next to \`tests/\`) is also fine for small projects.

**Install your own project in editable mode:** \`python -m pip install -e ".[dev]"\`. "Editable" means pip does not copy your code but points at it, so changes are live. After this, \`import kollana\` works from anywhere in that environment, the tests need no \`sys.path\` tricks (this also cures the \`ModuleNotFoundError\` from the Testing lesson), and \`[project.scripts]\` creates the command \`kollana-report\`.

**Build a wheel:** \`python -m pip install build\`, then \`python -m build\` creates \`dist/kollana_reports-0.1.0-py3-none-any.whl\` and a source archive. A **wheel** (\`.whl\`) is the ready-to-install form of a package. Its name tells pip what it works with: \`py3-none-any\` means "any Python 3, no compiled code, any operating system". A wheel is just a **zip file**: your code plus a \`.dist-info\` folder with the metadata (\`METADATA\`, \`WHEEL\`, and \`RECORD\`, which lists every file with its hash). **Installing a wheel is mostly unzipping it into \`site-packages\`.**`,
    { sketch: { w: 760, h: 300, caption: 'From source to installed: a build makes a wheel, and installing a wheel is mainly unzipping it', items: [
      { t: 'box', x: 14, y: 30, w: 146, h: 78, label: 'source', sub: 'src/kollana/\npyproject.toml', fill: 'blue', size: 16 },
      { t: 'text', x: 198, y: 58, text: 'python', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'text', x: 198, y: 74, text: '-m build', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'arrow', x1: 164, y1: 90, x2: 232, y2: 90 },
      { t: 'box', x: 236, y: 30, w: 246, h: 78, label: 'dist/', sub: 'kollana_reports-0.1.0-py3-none-any.whl\nkollana_reports-0.1.0.tar.gz (source)', fill: 'yellow', size: 15 },
      { t: 'text', x: 519, y: 58, text: 'pip', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'text', x: 519, y: 74, text: 'install', size: 14, anchor: 'middle', color: '#c0392b' },
      { t: 'arrow', x1: 486, y1: 90, x2: 552, y2: 90 },
      { t: 'box', x: 556, y: 30, w: 190, h: 78, label: 'site-packages', sub: 'kollana/ and the\nkollana_reports-0.1.0.dist-info/', fill: 'green', size: 16 },
      { t: 'note', x: 14, y: 128, w: 360, h: 120, fill: 'grey', size: 13, text: 'A wheel is a zip file:\n  kollana/__init__.py\n  kollana/finance.py\n  kollana-0.1.0.dist-info/METADATA   name, version\n  kollana-0.1.0.dist-info/WHEEL      how it was built\n  kollana-0.1.0.dist-info/RECORD     every file + its hash' },
      { t: 'note', x: 392, y: 128, w: 354, h: 120, fill: 'yellow', size: 13, text: 'pip install -e .   = editable: no copy, the\nenvironment points at your folder, changes\nare live. Use it while developing.\n\npip install a.whl  = a real install, the code\nis copied into site-packages.' },
      { t: 'note', x: 14, y: 262, w: 732, h: 30, fill: 'pink', size: 13, text: 'PyPI is the public shelf of wheels. Companies often run a private one for their own packages.' },
    ] } },
    { py: {
      title: 'Build a real wheel in memory, "install" it and import it',
      starter: `import base64
import hashlib
import importlib
import importlib.metadata
import io
import sys
import tempfile
import zipfile
from pathlib import Path

sys.dont_write_bytecode = True

FILES = {
    "kollana/__init__.py": "__version__ = '0.1.0'\\n",
    "kollana/finance.py": "def gst(amount, rate=0.18):\\n    return round(amount * rate, 2)\\n",
    "kollana-0.1.0.dist-info/METADATA": "Metadata-Version: 2.1\\nName: kollana\\nVersion: 0.1.0\\nSummary: toy package\\nRequires-Python: >=3.10\\n",
    "kollana-0.1.0.dist-info/WHEEL": "Wheel-Version: 1.0\\nGenerator: toy-builder\\nRoot-Is-Purelib: true\\nTag: py3-none-any\\n",
}

def record_line(path, text):
    digest = base64.urlsafe_b64encode(hashlib.sha256(text.encode("utf-8")).digest()).rstrip(b"=").decode()
    return f"{path},sha256={digest},{len(text.encode('utf-8'))}"

FILES["kollana-0.1.0.dist-info/RECORD"] = "\\n".join(record_line(p, t) for p, t in FILES.items()) + "\\nkollana-0.1.0.dist-info/RECORD,,\\n"

wheel = io.BytesIO()                                  # a wheel is a zip file with a special name
with zipfile.ZipFile(wheel, "w", zipfile.ZIP_DEFLATED) as z:
    for path, text in FILES.items():
        z.writestr(path, text)
print("kollana-0.1.0-py3-none-any.whl contains:")
with zipfile.ZipFile(wheel) as z:
    for name in z.namelist():
        print("   ", name)

with tempfile.TemporaryDirectory() as site_packages:  # stands in for .venv\\Lib\\site-packages
    with zipfile.ZipFile(wheel) as z:
        z.extractall(site_packages)                   # "pip install" is mostly this line
    sys.path.insert(0, site_packages)
    importlib.invalidate_caches()
    try:
        import kollana.finance as finance
        print("import works, gst(1000) =", finance.gst(1000))
        print("installed version (from METADATA):", importlib.metadata.version("kollana"))
        meta = importlib.metadata.distribution("kollana").metadata
        print("requires python:", meta["Requires-Python"])

        # how pip checks that nothing was damaged: re-hash every file listed in RECORD
        record = (Path(site_packages) / "kollana-0.1.0.dist-info" / "RECORD").read_text(encoding="utf-8")
        ok = True
        for line in record.splitlines():
            path, hash_part, size = line.split(",")
            if hash_part:
                text = (Path(site_packages) / path).read_text(encoding="utf-8")
                ok = ok and record_line(path, text) == line
        print("all RECORD hashes match:", ok)
    finally:
        sys.path.remove(site_packages)
        for name in [m for m in sys.modules if m == "kollana" or m.startswith("kollana.")]:
            del sys.modules[name]
        importlib.invalidate_caches()

try:
    importlib.metadata.version("kollana")
except importlib.metadata.PackageNotFoundError:
    print("the folder is gone, so the package is gone: PackageNotFoundError")`,
      note: 'This is the real structure of a wheel: the code, a dist-info folder with METADATA, WHEEL and a RECORD file that lists each file with its SHA-256 hash and size. The "install" is an unzip into a folder that Python searches (a folder on sys.path), which is all site-packages is. The metadata reader found the version because the dist-info folder was on the path. Remove the folder and the package vanishes.',
    } },
    { local: `**The same flow with \`uv\`** (a fast alternative to pip and venv; install it with \`python -m pip install uv\`, or see the current uv documentation for other ways; the examples were run with uv 0.12, your version may print slightly different text):
\`\`\`powershell
uv init kollana-demo ; cd kollana-demo     # creates pyproject.toml, README.md, .python-version and src\\
uv add six                                 # adds the dependency to pyproject.toml, creates .venv and uv.lock
uv run python -c "import six; print(six.__version__)"
uv sync                                    # recreate exactly the locked environment (on another PC, in CI)
\`\`\`
\`uv init\` writes a \`pyproject.toml\` like this one:
\`\`\`toml
[project]
name = "kollana-demo"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.12"
dependencies = []

[project.scripts]
kollana-demo = "kollana_demo:main"

[build-system]
requires = ["uv_build>=0.12.23,<0.13.0"]
build-backend = "uv_build"
\`\`\`
After \`uv add six\` the dependency list reads \`dependencies = ["six>=1.17.0"]\` and the project folder now has \`.venv\` and \`uv.lock\`. Commit \`uv.lock\` and \`pyproject.toml\`, not \`.venv\`. The classic way with pip does the same in three steps: \`python -m venv .venv\`, \`python -m pip install -e ".[dev]"\`, \`python -m pip freeze > requirements.txt\`.` },
    `## An executable for people without Python
Sometimes the person who needs the tool has no Python and should not need it. **PyInstaller** bundles your script, the Python interpreter and your packages into a **single \`.exe\`** (or a folder):
\`\`\`powershell
python -m pip install pyinstaller
pyinstaller --onefile --name run_report run_report.py
.\\dist\\run_report.exe --month 2026-09
\`\`\`
Things to know before you promise it to a user:
- **Build on Windows, for Windows.** PyInstaller does not cross-compile. Build in a **clean venv** that holds only your project's packages, or the exe grows large.
- **It is a snapshot.** Every change needs a rebuild, and a new version of the tool needs a new file sent to users.
- **Data files and paths.** Files that sit next to your script are not automatically included. Add them with \`--add-data\`, and read them relative to the bundle, not the current folder.
- **Hidden imports.** Packages that load modules by name at run time may need \`--hidden-import\`. Test the exe on a **clean computer** without Python.
- **Antivirus tools sometimes flag** unsigned one-file executables. Folder mode (\`--onedir\`) and code signing reduce that, and IT may need to approve it.
- **Size.** Even a tiny script becomes several megabytes; one that includes pandas can be hundreds of megabytes.
Alternatives: \`pipx\` or \`uv tool install\` (for colleagues who do have Python and want a command), the standard \`python -m zipapp\` (a single runnable \`.pyz\` file, needs Python), or a **Docker image** (the Docker phase), which is the usual choice for servers.`,
    { local: `**Build and run an executable** (a small \`run_report.py\` that takes a \`--month\` argument; PyInstaller was installed with pip as above):
\`\`\`python
import argparse
import sys


def main(argv=None):
    parser = argparse.ArgumentParser(description="Month-end report")
    parser.add_argument("--month", required=True)
    args = parser.parse_args(argv)
    print(f"report for {args.month}, python {sys.version_info.major}.{sys.version_info.minor}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
\`\`\`
Run \`pyinstaller --onefile --name run_report run_report.py\`. The last lines of the log say \`Building EXE ... completed successfully\` and \`The results are available in: ...\\dist\`. A folder \`build\\\` and a file \`run_report.spec\` also appear (add them to \`.gitignore\`). Then:
\`\`\`text
PS> .\\dist\\run_report.exe --month 2026-09
report for 2026-09, python 3.12
PS> .\\dist\\run_report.exe
usage: run_report.exe [-h] --month MONTH
run_report.exe: error: the following arguments are required: --month
\`\`\`
The exe in our test was about 8 MB (yours will differ), it ran without a Python installation being needed, exit code 0 for the good run and **2** for the missing argument (the CLI lesson explains exit codes).` },
    { warn: `Things that go wrong with environments and packaging:
- **Installing into the global Python.** The next project breaks. Create a venv first, and check \`Get-Command python\`.
- **Committing \`.venv\`** to Git. Use \`.gitignore\`; share the recipe and the lock file.
- **Only a loose requirements list with no versions.** Next month a new release of a library breaks the job. Lock versions for applications.
- **\`pip freeze\` of a messy environment.** It lists everything ever installed, including tools you do not need. Prefer a hand-written \`pyproject.toml\` plus a generated lock.
- **Forgetting the Python version.** Set \`requires-python\` and a \`.python-version\` file. A script that uses \`tomllib\` or \`match\` fails on Python 3.9.
- **Importing by editing \`sys.path\`.** Install the project (editable) instead.
- **Comparing versions as text.** "1.10" sorts before "1.9". Compare as numbers.
- **Building an exe in a dirty environment**, or sending it without testing on a clean computer.
- **Secrets inside the package or exe.** They end up in the wheel or the exe. Configuration comes from the environment (Logging and configuration lesson).
- **Different environments in development, in CI and on the server.** Use the same lock file in all three.` },
    { pychallenge: {
      id: 'python-environments-packaging-ch1',
      prompt: 'Write `parse_requirement(line)` for one line of a requirements list. Return `None` for a blank line or a comment line (a `#` at the start, or after whitespace, starts a comment). Otherwise return a dict `{"name": ..., "extras": [...], "specs": [(op, version), ...], "marker": ...}`. `name` is normalised: lower case, and every run of `-`, `_` or `.` becomes a single `-`. `extras` are the names in square brackets (stripped, lower case). `specs` are the version specifiers in order, with the operators `~=`, `==`, `!=`, `>=`, `<=`, `>`, `<` (spaces allowed). `marker` is the text after `;` stripped, or `None`.',
      starter: `import re

def parse_requirement(line):
    # TODO: cut the comment, split the marker off at ";", then read name, [extras] and the specifiers
    return None
`,
      tests: `assert parse_requirement('pandas[performance]>=2.3,<3 ; python_version >= "3.10"') == {
    "name": "pandas", "extras": ["performance"], "specs": [(">=", "2.3"), ("<", "3")], "marker": 'python_version >= "3.10"'}
assert parse_requirement("requests==2.32.3") == {"name": "requests", "extras": [], "specs": [("==", "2.32.3")], "marker": None}
assert parse_requirement("Typing_Extensions") == {"name": "typing-extensions", "extras": [], "specs": [], "marker": None}
assert parse_requirement("numpy ~= 1.26   # pinned for the old model") == {"name": "numpy", "extras": [], "specs": [("~=", "1.26")], "marker": None}
assert parse_requirement("# only a comment") is None
assert parse_requirement("   ") is None
assert parse_requirement("") is None
assert parse_requirement("pytest>=8, !=8.1.0") == {"name": "pytest", "extras": [], "specs": [(">=", "8"), ("!=", "8.1.0")], "marker": None}
assert parse_requirement("tzdata; sys_platform == 'win32'") == {"name": "tzdata", "extras": [], "specs": [], "marker": "sys_platform == 'win32'"}
assert parse_requirement("ruff[A, B]") == {"name": "ruff", "extras": ["a", "b"], "specs": [], "marker": None}
assert parse_requirement("My.Package-Name_2<=4.0") == {"name": "my-package-name-2", "extras": [], "specs": [("<=", "4.0")], "marker": None}`,
      solution: `import re

NAME = re.compile(r"^\\s*([A-Za-z0-9][A-Za-z0-9._-]*)\\s*(?:\\[([^\\]]*)\\])?\\s*(.*)$")
SPEC = re.compile(r"(~=|==|!=|>=|<=|>|<)\\s*([A-Za-z0-9.*+!_-]+)")

def parse_requirement(line):
    line = re.split(r"(?:^|\\s)#", line)[0].strip()
    if not line:
        return None
    requirement, _, marker = line.partition(";")
    match = NAME.match(requirement)
    name = re.sub(r"[-_.]+", "-", match.group(1)).lower()
    extras = [e.strip().lower() for e in (match.group(2) or "").split(",") if e.strip()]
    specs = SPEC.findall(match.group(3))
    return {"name": name, "extras": extras, "specs": specs, "marker": marker.strip() or None}
`,
      hint: 'First remove the comment with `re.split(r"(?:^|\\s)#", line)[0].strip()`; return `None` if nothing is left. Use `line.partition(";")` to split off the marker. A regex like `^\\s*([A-Za-z0-9][A-Za-z0-9._-]*)\\s*(?:\\[([^\\]]*)\\])?\\s*(.*)$` gives the name, the extras and the rest; `re.findall(r"(~=|==|!=|>=|<=|>|<)\\s*([A-Za-z0-9.*+!_-]+)", rest)` gives the specifier pairs. Normalise the name with `re.sub(r"[-_.]+", "-", name).lower()`.',
    } },
    { pychallenge: {
      id: 'python-environments-packaging-ch2',
      prompt: 'Write `satisfies(version, spec)`. `version` is text like `"2.3.3"` and `spec` is comma-separated specifiers such as `">=2.3,<3"` or `">= 8 , != 8.1.0"` (spaces allowed). Operators: `==`, `!=`, `>=`, `<=`, `>`, `<` and `~=`. Compare **as numbers** and treat missing parts as zero (`2.3` equals `2.3.0`). `~=X.Y` means `>= X.Y` and the same prefix before the last number (`~=2.3` allows 2.9.1 but not 3.0; `~=2.3.1` allows 2.3.9 but not 2.4.0). An empty spec accepts every version. Return `True` or `False`.',
      starter: `import re

def satisfies(version, spec):
    # TODO: turn versions into lists of ints, pad with zeros, check every comma-separated specifier
    return False
`,
      tests: `assert satisfies("2.3.3", ">=2.3,<3") is True
assert satisfies("3.0.0", ">=2.3,<3") is False
assert satisfies("2.2.9", ">=2.3,<3") is False
assert satisfies("2.3", "==2.3.0") is True
assert satisfies("1.10.0", ">=1.9") is True
assert satisfies("1.9", ">1.10") is False
assert satisfies("2.9.1", "~=2.3") is True
assert satisfies("3.0", "~=2.3") is False
assert satisfies("2.2", "~=2.3") is False
assert satisfies("2.3.9", "~=2.3.1") is True
assert satisfies("2.4.0", "~=2.3.1") is False
assert satisfies("8.1.0", ">=8, !=8.1.0") is False
assert satisfies("8.1.1", ">= 8 , != 8.1.0") is True
assert satisfies("1.0", "") is True
assert satisfies("6.0.1", "<=6.0.1") is True
assert satisfies("6.0.2", "<=6.0.1") is False
assert satisfies("10.0", "<9.5") is False`,
      solution: `import re

def _numbers(text):
    return [int(part) for part in text.strip().split(".")]

def _pad(a, b):
    n = max(len(a), len(b))
    return a + [0] * (n - len(a)), b + [0] * (n - len(b))

def satisfies(version, spec):
    current = _numbers(version)
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        op, target_text = re.match(r"(~=|==|!=|>=|<=|>|<)\\s*(.+)$", part).groups()
        target = _numbers(target_text)
        a, b = _pad(current, target)
        if op == "==":
            ok = a == b
        elif op == "!=":
            ok = a != b
        elif op == ">=":
            ok = a >= b
        elif op == "<=":
            ok = a <= b
        elif op == ">":
            ok = a > b
        elif op == "<":
            ok = a < b
        else:
            prefix = target[:-1]
            ok = a >= b and a[:len(prefix)] == prefix
        if not ok:
            return False
    return True
`,
      hint: 'Make a helper that turns "2.3.3" into `[2, 3, 3]`, and one that pads both lists to the same length with zeros. Split `spec` on commas, skip empty parts, and read each part with `re.match(r"(~=|==|!=|>=|<=|>|<)\\s*(.+)$", part)`. Python compares lists element by element, which is exactly version order. For `~=` the target without its last number is the prefix that must stay the same: `target[:-1]`, and the padded current version must also be `>=` the target.',
    } },
    { pychallenge: {
      id: 'python-environments-packaging-ch3',
      prompt: 'Write `read_project(toml_text)` with `tomllib`. It returns a dict with `name` (normalised: lower case, runs of `-_.` become `-`), `version` (or `None` when the version is listed in `dynamic`), `python` (the `requires-python` text or `None`), `dependencies` (names only, normalised, from `[project].dependencies`), `dev` (names from the `dev` list in `[project.optional-dependencies]`) and `scripts` (a dict, from `[project.scripts]`). Missing optional parts give `[]`, `{}` or `None`. Raise `ValueError` if there is no `[project]` table, no `name`, or neither a `version` nor `"version"` in `dynamic`. The helper `req_name` is given.',
      starter: `import re
import tomllib

def req_name(line):
    match = re.match(r"\\s*([A-Za-z0-9][A-Za-z0-9._-]*)", line)
    return re.sub(r"[-_.]+", "-", match.group(1)).lower()

def read_project(toml_text):
    # TODO: tomllib.loads, check the [project] table, build the result dict
    return {}
`,
      tests: `text = '''
[project]
name = "Kollana_Reports"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["pandas>=2.3,<3", "Typing_Extensions", "pyyaml~=6.0"]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff"]

[project.scripts]
kollana-report = "kollana.cli:main"
'''
assert read_project(text) == {
    "name": "kollana-reports", "version": "0.1.0", "python": ">=3.12",
    "dependencies": ["pandas", "typing-extensions", "pyyaml"], "dev": ["pytest", "ruff"],
    "scripts": {"kollana-report": "kollana.cli:main"}}

minimal = '[project]\\nname = "x"\\ndynamic = ["version"]\\n'
assert read_project(minimal) == {"name": "x", "version": None, "python": None, "dependencies": [], "dev": [], "scripts": {}}

for bad in ('[tool.ruff]\\nline-length = 88\\n', '[project]\\nversion = "1"\\n', '[project]\\nname = "x"\\n'):
    try:
        read_project(bad)
        raise AssertionError("expected ValueError for: " + bad)
    except ValueError:
        pass`,
      solution: `import re
import tomllib

def req_name(line):
    match = re.match(r"\\s*([A-Za-z0-9][A-Za-z0-9._-]*)", line)
    return re.sub(r"[-_.]+", "-", match.group(1)).lower()

def read_project(toml_text):
    data = tomllib.loads(toml_text)
    project = data.get("project")
    if project is None:
        raise ValueError("no [project] table")
    if "name" not in project:
        raise ValueError("project name is missing")
    if "version" not in project and "version" not in project.get("dynamic", []):
        raise ValueError("version is missing")
    return {
        "name": re.sub(r"[-_.]+", "-", project["name"]).lower(),
        "version": project.get("version"),
        "python": project.get("requires-python"),
        "dependencies": [req_name(d) for d in project.get("dependencies", [])],
        "dev": [req_name(d) for d in project.get("optional-dependencies", {}).get("dev", [])],
        "scripts": dict(project.get("scripts", {})),
    }
`,
      hint: '`data = tomllib.loads(toml_text)`, then `project = data.get("project")`. Raise `ValueError` when it is `None`, when `"name"` is missing, or when `"version"` is neither a key of `project` nor in `project.get("dynamic", [])`. Build the result with `project.get(...)` for the optional parts, and `req_name` for each dependency line.',
    } },
    { real: 'For Project A this lesson is the difference between "a folder of scripts" and "a project someone can run". The README says: install Python 3.12, `uv sync` (or create a venv and `pip install -e ".[dev]"`), copy `.env.example` to `.env`, run `python -m kollana.cli --month 2026-09`, run `pytest`. Every one of those steps works because the environment is described and locked. Later phases build on it: a Dockerfile starts from the same lock file, GitHub Actions installs it to run the tests, and an Azure deployment installs the wheel or the image. When the finance team needs the tool and has no Python, you send them the executable and tell them exactly which version it is.' },
    { interview: `**"What is a virtual environment and why use one?"**
Model answer: "A virtual environment is an isolated folder with its own Python and its own installed packages. I create one per project so that different projects can use different versions of the same library without conflicts, and so that I can rebuild the setup from a file. I never install project packages globally, and I do not commit the \`.venv\` folder, only the files that describe it."

**"\`requirements.txt\` or \`pyproject.toml\`?"** "\`pyproject.toml\` is the standard place to describe a project: metadata, Python version, dependencies with ranges, optional groups such as dev, and the build system. A \`requirements.txt\` or a lock file such as \`uv.lock\` records the exact versions that were tested, so installs are reproducible. For an application I keep ranges in \`pyproject.toml\` and commit a lock file."

**"What is a wheel?"** "The built, ready-to-install form of a Python package. It is a zip file with the code and a \`.dist-info\` folder with metadata, and its file name says which Python and platform it supports, for example \`py3-none-any\`. Installing a wheel is mostly unzipping it into \`site-packages\`, which is why it is faster than building from source."

**"How would you give a tool to a user who has no Python?"** "I would build an executable with PyInstaller from a clean environment, test it on a clean machine, and mention that it needs a rebuild per change and may be flagged by antivirus. For servers I would use a Docker image, and for colleagues with Python I would publish a wheel or use \`pipx\` or \`uv tool\`."` },
    `## Recap
- A **virtual environment** (\`py -3.12 -m venv .venv\`, then \`Activate.ps1\`) gives each project its own Python and packages. Use \`python -m pip\`, keep \`.venv\` out of Git, and select it in VS Code. **\`uv\`** does the same faster (\`uv init\`, \`uv add\`, \`uv sync\`, \`uv run\`).
- **\`pyproject.toml\`** is the recipe: name, version, \`requires-python\`, **dependencies with ranges** (\`>=2.3,<3\`, \`~=6.0\`), extras like \`dev\`, \`[project.scripts]\` and the build system. A **lock file** (\`uv.lock\`, or a pinned \`requirements.txt\`) fixes exact versions for reproducible installs.
- Compare versions **as numbers** (1.10 is newer than 1.9), pad with zeros (2.3 equals 2.3.0). MAJOR changes may break code.
- Use a **package** (src layout) and install it **editable** (\`pip install -e ".[dev]"\`) so imports and tests work anywhere. \`python -m build\` makes a **wheel**: a zip with code and \`.dist-info\` metadata (\`METADATA\`, \`WHEEL\`, \`RECORD\`).
- **PyInstaller** (\`--onefile\`) makes a Windows exe for users without Python: build in a clean venv, test on a clean PC, expect a rebuild per change and possible antivirus warnings. Servers use Docker.`,
  ],
  quiz: [
    { q: 'Why does each project get its own virtual environment?', o: ['so projects can use different versions of the same package without conflicts', 'because Python cannot run without one', 'to make Python run faster', 'to hide the code from other users'], a: 0, why: 'Isolation prevents one project\'s upgrade from breaking another, and the environment can be rebuilt from the recipe.' },
    { q: 'Your `pyproject.toml` says `pandas>=2.3,<3` and the lock file says `pandas==2.3.3`. What is each for?', o: ['both mean the same thing', 'the lock file is a comment', 'the range says what the project tolerates, and the lock pins what was actually tested, so every install is identical', 'the range is for Linux and the lock is for Windows'], a: 2, why: 'Ranges keep the recipe flexible and readable. The lock gives reproducible installs with exact versions of every package.' },
    { q: 'Why is `"1.10" > "1.9"` the wrong way to compare versions?', o: ['it is True, which is correct', 'text comparison goes character by character, so "1.10" is smaller than "1.9"; versions must be compared as numbers', 'Python cannot compare strings', 'versions must always be floats'], a: 1, why: 'As text, "1" equals "1", then "." equals ".", then "1" is less than "9", so "1.10" < "1.9". As versions, 10 is greater than 9.' },
    { q: 'What is a wheel (`.whl`) file?', o: ['a log file created by pip', 'a Windows installer for Python', 'a backup of a virtual environment', 'a zip file with your code and a .dist-info folder of metadata, ready to be installed'], a: 3, why: 'A wheel is the built form of a package. Installing it is mostly unzipping it into site-packages.' },
    { q: 'What does `python -m pip install -e ".[dev]"` do?', o: ['deletes the environment', 'installs only the dev tools', 'builds an executable', 'installs your project in editable mode (changes are live) plus the packages from the dev extra'], a: 3, why: 'Editable means the environment points at your source folder. The [dev] part adds the optional development dependencies such as pytest and Ruff.' },
    { q: 'You build an exe with PyInstaller. Which statement is true?', o: ['it runs on Mac and Linux too', 'it must be rebuilt for each change and should be tested on a clean computer, and antivirus tools may flag it', 'it needs no testing because it is the same code', 'it removes the need for configuration'], a: 1, why: 'The exe is a snapshot of your code and packages for Windows. Hidden imports, data files and antivirus are the usual surprises, so test on a clean machine.' },
  ],
  task: {
    title: 'Turn your helpers into an installable, locked project',
    steps: [
      'Create `C:\\fde\\kollana-reports` (or reuse the folder from the Testing lesson). Make a venv, activate it, and check `Get-Command python` points into `.venv`. Add `.venv/` to `.gitignore`.',
      'Write `pyproject.toml` as in the lesson: name, version, `requires-python = ">=3.12"`, dependencies with ranges (pandas, pydantic, pyyaml), a `dev` extra (pytest, ruff, mypy), a script `kollana-report = "kollana.cli:main"` and a build system. Use the `src/` layout with `src/kollana/finance.py` and a `cli.py` with `main()`.',
      'Install it editable: `python -m pip install -e ".[dev]"`. Run `kollana-report` (it can just print a line), and `python -c "import kollana; print(kollana.__file__)"` from another folder. Run `pytest` with no `pythonpath` setting.',
      'Create the lock: `python -m pip freeze > requirements.txt` (or use `uv add` and `uv.lock`). Delete `.venv`, recreate it from the lock file, and check that the tests still pass. Note the time it took and what was missing from your recipe, if anything.',
      'Build a wheel with `python -m pip install build` and `python -m build`. Open the `.whl` with a zip tool (copy it to `.zip` first) and list the files. Install it into a second fresh venv with `pip install dist\\*.whl` and import it.',
      'Build an executable of a small `run_report.py` with `pyinstaller --onefile`. Run it, run it without arguments, and write down its size and the exit codes.',
    ],
    deliverable: '`pyproject.toml`, the lock file, the wheel file list, the output of `pip freeze` from the rebuilt venv, and the exe run with both exit codes.',
  },
};
