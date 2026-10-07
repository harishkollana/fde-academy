export default {
  id: 'foundations-windows-dev-setup',
  title: 'Your Windows dev setup: PowerShell, WSL2, VS Code and the Linux commands you need',
  goal: 'You can move around Windows with PowerShell, set environment variables and PATH correctly, install tools with winget, start Ubuntu under WSL2, and use the Linux commands (grep, pipes, redirects, chmod, ps) that every tutorial and server assumes.',
  roadmap: ['PowerShell basics, paths and environment variables', 'WSL2 + Ubuntu', 'VS Code and winget', 'Linux commands: grep, pipes, chmod, ps'],
  blocks: [
    `## The problem
A tutorial says \`export API_KEY=abc\`, then \`source venv/bin/activate\`, then \`ls -la | grep .env\`. On Windows every line fails. Another day a script runs on a colleague's machine and on the server, but on yours it dies with \`bash\\r: No such file or directory\`.

Nothing is wrong with you. Tutorials are written for Linux, almost every server and container runs Linux, and your laptop runs Windows. The fix is to know **which of three layers you are typing into**:
- **Windows 11**: your apps, VS Code, Docker Desktop. Paths look like \`C:\\Users\\you\`.
- **PowerShell**: the command line for Windows. Use it for winget, Git, Python and Azure.
- **WSL2 with Ubuntu** (*Windows Subsystem for Linux*): a real Linux inside Windows. Use it for Linux-first tools and to practise the commands your servers use.

The two worlds have separate file systems. Most "works there, not here" bugs happen when a file, a path or a variable crosses that wall.`,
    { sketch: { w: 760, h: 380, caption: 'One laptop, two worlds. Crossing from the Windows side to /mnt/c is slow; the Linux home folder is fast.', items: [
      { t: 'text', x: 380, y: 18, text: 'your laptop: Windows 11', bold: true, size: 18 },
      { t: 'box', x: 8, y: 34, w: 744, h: 336 },
      { t: 'text', x: 160, y: 52, text: 'Windows side', size: 15, color: '#5c6478' },
      { t: 'text', x: 570, y: 52, text: 'WSL2: real Linux in a light VM', size: 15, color: '#5c6478' },
      { t: 'box', x: 24, y: 70, w: 270, h: 56, label: 'PowerShell', sub: 'winget, git, python, Azure', fill: 'yellow' },
      { t: 'box', x: 24, y: 140, w: 270, h: 56, label: 'VS Code', sub: 'editor and terminal', fill: 'blue' },
      { t: 'box', x: 24, y: 222, w: 120, h: 84, label: 'Docker\nDesktop', fill: 'teal' },
      { t: 'db', x: 160, y: 222, w: 134, h: 84, label: 'C: drive', fill: 'grey' },
      { t: 'text', x: 227, y: 324, text: 'C:\\Users\\you', size: 13, color: '#5c6478' },
      { t: 'text', x: 84, y: 324, text: 'uses WSL2 inside', size: 13, color: '#5c6478' },
      { t: 'box', x: 400, y: 66, w: 340, h: 292 },
      { t: 'box', x: 416, y: 82, w: 150, h: 56, label: 'bash', sub: 'grep, chmod, ps', fill: 'green' },
      { t: 'box', x: 580, y: 82, w: 146, h: 56, label: 'Linux tools', sub: 'python3, git, dbt', fill: 'green' },
      { t: 'box', x: 416, y: 160, w: 146, h: 100, label: '/mnt/c', sub: 'your C: drive', fill: 'grey' },
      { t: 'db', x: 580, y: 160, w: 146, h: 100, label: '~ Linux home', fill: 'green' },
      { t: 'text', x: 489, y: 276, text: 'SLOW to cross', size: 13, color: '#e03131' },
      { t: 'text', x: 653, y: 276, text: '/home/you  FAST', size: 13, color: '#2f9e44' },
      { t: 'note', x: 416, y: 296, w: 310, h: 54, text: 'Keep WSL projects in ~ (fast).\nOpen them from Ubuntu with: code .', fill: 'yellow', size: 14 },
      { t: 'arrow', x1: 294, y1: 94, x2: 416, y2: 98, label: 'wsl', ly: -12 },
      { t: 'arrow', x1: 294, y1: 172, x2: 416, y2: 128, label: 'code .', dashed: true, ly: 14 },
      { t: 'arrow', x1: 294, y1: 264, x2: 416, y2: 226, label: 'slow', ly: 14 },
    ] } },
    `## PowerShell: it passes objects, not text
Older shells pass **text** between commands and you cut it up with grep. PowerShell passes **objects** with properties such as \`Name\`, \`Id\` and \`CPU\`:

\`\`\`powershell
Get-Process | Where-Object CPU -gt 100 | Select-Object -First 3 Name, Id, CPU
\`\`\`

Read it left to right: every process, keep those with CPU above 100, take three, show three properties. No column counting.

Commands are named **Verb-Noun** (\`Get-ChildItem\`, \`Set-Location\`, \`Select-String\`, \`Out-File\`). Short **aliases** help people arriving from other shells: \`ls\`, \`cd\` and \`cat\` are nicknames for Get-ChildItem, Set-Location and Get-Content. So \`ls -la\` fails; the PowerShell way is \`Get-ChildItem -Force\`.

Three gotchas:
1. **curl is an alias.** In Windows PowerShell 5.1, \`curl\` runs \`Invoke-WebRequest\`, which has different options. Type \`curl.exe\` for the real curl.
2. **Redirect encoding.** \`>\` in Windows PowerShell 5.1 normally writes UTF-16 (some setups write UTF-8 with a BOM). PowerShell 7 writes UTF-8 without a BOM. Python then fails with \`invalid start byte\`. Say what you want: \`Out-File report.txt -Encoding utf8\`.
3. **Two PowerShells exist.** Windows PowerShell 5.1 (\`powershell.exe\`) is built in. PowerShell 7 (\`pwsh.exe\`) is a separate install. Check yours with \`$PSVersionTable.PSVersion\`.

\`Select-String\` is PowerShell's grep. Unlike grep it **ignores case by default**; add \`-CaseSensitive\` when it matters.`,
    { local: `**Your first PowerShell session.** Open Windows Terminal (PowerShell tab) and run these one at a time.
\`\`\`powershell
$PSVersionTable.PSVersion
Get-Location
Get-ChildItem | Select-Object -First 3 Name, Length
Get-Process | Sort-Object CPU -Descending | Select-Object -First 3 Name, Id, CPU
Get-Alias curl
curl.exe --version
\`\`\`
What to expect (your values will differ):
- The first command prints a small table with Major, Minor, Build, Revision. On a stock Windows 11 it starts with \`5  1\`; in PowerShell 7 it starts with \`7\`.
- \`Get-Location\` prints a \`Path\` heading and your current folder.
- \`Get-Process ...\` prints a three-column table of the busiest programs. The numbers change every run.
- \`Get-Alias curl\` shows a line ending in \`curl -> Invoke-WebRequest\` in Windows PowerShell 5.1. In other versions it may print an error because no such alias exists, which is also fine.
- \`curl.exe --version\` starts with \`curl 8.\` or a similar version number, then \`(Windows)\`.` },
    `## Paths: backslash, slash, spaces and quotes
A **path** says where a file lives. Windows and Linux write it differently.

| | Windows | Linux and WSL |
|---|---|---|
| Separator | \`\\\` (\`/\` also works in most tools) | \`/\` |
| Root | one per drive: \`C:\\\` | one tree: \`/\` |
| Case | not case-sensitive | \`Data.csv\` and \`data.csv\` are two files |
| Home | \`C:\\Users\\you\` or \`~\` | \`/home/you\` or \`~\` |
| The C: drive | \`C:\\\` | \`/mnt/c\` |

Three habits remove most path errors:
1. **Quote paths that contain spaces.** If your project is in \`E:\\My Projects\\FDE\`, write \`cd "E:\\My Projects\\FDE"\`. To run a program from such a path add the call operator: \`& "C:\\Program Files\\Git\\cmd\\git.exe" --version\`.
2. **Build paths, do not glue strings**: \`Join-Path $HOME "projects\\fde"\` in PowerShell, \`pathlib.Path\` in Python.
3. **Know relative from absolute.** An absolute path starts at the root (\`C:\\...\` or \`/...\`). A relative path starts from the current folder, where \`.\` is here and \`..\` is the parent. A script that finds \`data\\gl.csv\` only when launched from one folder is the commonest "works on my machine" bug.

In Python, \`"C:\\new\\table"\` holds a newline and a tab, because \`\\n\` and \`\\t\` are escapes. Use a raw string \`r"C:\\new\\table"\` or \`pathlib\`. Run the playground to see both.`,
    { py: {
      title: 'Windows paths vs Linux paths, and a PATH string',
      starter: `from pathlib import PureWindowsPath, PurePosixPath

win = PureWindowsPath(r"C:\\Users\\Asha Rao\\FDE\\fde-academy\\src\\app.py")
print("drive    :", win.drive)
print("parts    :", win.parts)
print("name     :", win.name, "| stem:", win.stem, "| suffix:", win.suffix)
print("parent   :", win.parent)
print("as_posix :", win.as_posix())

lin = PurePosixPath("/mnt/c/Users/Asha Rao/FDE/fde-academy/src/app.py")
print("linux parts:", lin.parts)

print("Windows ignores case  :", PureWindowsPath("C:/Tools") == PureWindowsPath(r"c:\\tools"))
print("Linux respects case   :", PurePosixPath("/tmp/Data.csv") == PurePosixPath("/tmp/data.csv"))
print(PureWindowsPath("C:/data") / "bronze" / "gl.csv")
print(PurePosixPath("/home/asha") / "data" / "gl.csv")

print("normal string :", "C:\\new\\table")      # \\n became a newline, \\t a tab
print("raw string    :", r"C:\\new\\table")

# A PATH value is one long string. Windows separates entries with ;  Linux uses :
path_value = r"C:\\Windows\\system32;C:\\Program Files\\Git\\cmd;;C:\\Python312;c:\\windows\\SYSTEM32"
pieces = path_value.split(";")
print(len(pieces), "pieces after split")
for p in pieces:
    print("  ", repr(p))
unique = {}
for p in pieces:
    if p.strip():
        unique.setdefault(p.strip().lower(), p.strip())
print("distinct entries:", len(unique))`,
      note: 'The second PATH entry has a space, which is fine inside PATH but must be quoted on a command line. The last entry is the first one again in different capitals: Windows treats them as the same folder, so it is a duplicate. The empty piece comes from the double semicolon.',
      hint: 'Change one separator in the path_value string, or add your own folder, and read how the pieces change.',
    } },
    `## Environment variables and PATH
An **environment variable** is a named setting the system hands to every program it starts: \`USERPROFILE\`, \`TEMP\`, \`API_KEY\`, \`DATABASE_URL\`. Programs read them instead of hard-coding values, which is why settings and secrets live there.

The key rule: **a program gets a copy of the variables when it starts.** Change one later and programs already running do not notice.

| Command | Takes effect |
|---|---|
| \`$env:NAME = "value"\` | This PowerShell window only |
| \`setx NAME "value"\` | Saved for your user, but seen only by programs started **afterwards** |
| Environment Variables window (search the Start menu) | Same as setx, with an editor |

So after \`setx\`, open a **new terminal**, and restart VS Code, which started with the old copy.

**PATH** is the most important variable: a list of folders. When you type \`git\`, Windows searches them in order for \`git.exe\`. Entries are separated by \`;\` on Windows and \`:\` on Linux. The error *"'python' is not recognized"* nearly always means one of three things: not installed, folder not on PATH, or terminal opened before the install. If \`python\` opens the Microsoft Store, a Store shortcut sits ahead of the real Python: search Settings for "app execution aliases" and switch the python.exe ones off.`,
    { local: `**Set, save and read a variable.**
\`\`\`powershell
$env:DEMO_KEY = "this-window-only"
$env:DEMO_KEY
setx DEMO_SAVED "saved-for-later"
$env:DEMO_SAVED
\`\`\`
Expected: the second line prints \`this-window-only\`. \`setx\` prints \`SUCCESS: Specified value was saved.\` The last line prints **nothing**, because this window started before the variable existed.

Now close the terminal, open a new one and run:
\`\`\`powershell
$env:DEMO_SAVED
$env:Path -split ';'
Get-Command python
[Environment]::SetEnvironmentVariable("DEMO_SAVED", $null, "User")
\`\`\`
Expected: \`saved-for-later\`, then one PATH folder per line (the list is different on every laptop), then a row showing where \`python\` resolves from (an error if Python is not installed yet). The last line deletes the demo variable. \`where.exe python\` lists every match, not just the winner.` },
    { pychallenge: {
      id: 'foundations-pych-path-var',
      prompt: 'Write `parse_path_var(value, sep=";")` that splits a PATH-style string on `sep` and returns a **list of the entries**: strip spaces around each entry, drop empty entries, and drop **duplicates, comparing case-insensitively** (Windows treats `C:\\Tools` and `c:\\tools` as the same folder). Keep the **first-seen order** and the first spelling you saw. Change nothing else (for example leave a trailing slash alone).',
      starter: `def parse_path_var(value, sep=";"):
    return value.split(sep)`,
      tests: `assert parse_path_var(r"C:\\Python312;C:\\Git\\cmd") == [r"C:\\Python312", r"C:\\Git\\cmd"]
assert parse_path_var(r"C:\\A;;C:\\B; ;") == [r"C:\\A", r"C:\\B"]
assert parse_path_var(r"C:\\Tools;c:\\tools;C:\\TOOLS") == [r"C:\\Tools"]
assert parse_path_var(r"  C:\\A  ; C:\\B ") == [r"C:\\A", r"C:\\B"]
assert parse_path_var("C:/Bin/;C:/Bin") == ["C:/Bin/", "C:/Bin"]
assert parse_path_var("/usr/bin:/bin:/usr/bin:", sep=":") == ["/usr/bin", "/bin"]
assert parse_path_var("") == []
assert parse_path_var(" ; ;") == []`,
      solution: `def parse_path_var(value, sep=";"):
    seen = set()
    result = []
    for piece in value.split(sep):
        item = piece.strip()
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result`,
      hint: 'Loop over value.split(sep). Strip each piece, skip it if empty, and remember item.lower() in a set so a second spelling of the same folder is skipped. Append the original spelling to the result list.',
    } },
    `## Execution policy and winget
**Execution policy.** PowerShell can refuse to run \`.ps1\` script files. The classic moment is activating a Python virtual environment (\`.venv\\Scripts\\Activate.ps1\`) and seeing *"running scripts is disabled on this system"*. It is a safety belt, not real security. For your own user only:

\`\`\`powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
\`\`\`

\`RemoteSigned\` runs scripts you wrote and wants a signature on downloaded ones. Do not use \`Bypass\` as a permanent setting. On a company laptop a Group Policy may block the change; ask IT. Check your settings with \`Get-ExecutionPolicy -List\`.

**winget** is the package manager built into Windows 11. A new laptop can be set up from a list of commands instead of from memory.`,
    { local: `**Install your tools with winget.** Written against winget 1.x. Package ids are exact names; if a command differs on your machine, run \`winget install --help\` or check the current winget documentation.
\`\`\`powershell
winget --version
winget search git
winget install --id Git.Git -e --source winget
winget install --id Microsoft.VisualStudioCode -e --source winget
winget install --id Python.Python.3.12 -e --source winget
winget list --id Git.Git
winget upgrade
\`\`\`
Expected: the first time, winget asks you to accept the source terms (type \`Y\`). Each install shows a download bar and ends with \`Successfully installed\`; some installers open a Windows permission prompt. \`winget search\` prints a table with Name, Id, Version and Source. \`winget upgrade\` lists programs that have newer versions (it can be an empty list). Other ids you will meet later are \`Microsoft.PowerShell\` and \`Docker.DockerDesktop\`; confirm with \`winget search\`.

Then **open a new terminal** (remember the PATH rule) and check:
\`\`\`powershell
git --version
python --version
code --version
\`\`\`
Expected: \`git version 2.\` and a number, \`Python 3.12.\` and a number, and VS Code prints a version number followed by a commit id and \`x64\`. If \`python\` opens the Microsoft Store, switch off the app execution alias as described above.` },
    `## VS Code: habits worth learning first
VS Code is an editor with a terminal, Git and a debugger built in.
- **Open a folder, not a file** (\`code .\`), so search, Git and the terminal work on the whole project.
- **Ctrl+Shift+P** is the command palette: type what you want, such as *Python: Select Interpreter*. **Ctrl+P** opens a file by name and **Ctrl+Shift+F** searches the folder.
- Watch the **bottom-right status bar**. It shows the line ending (\`CRLF\` or \`LF\`) and the encoding. Click either to change it.

Recommended extensions (check the publisher before installing): **Python** and **WSL** (both from Microsoft), **Docker**, **YAML** (Red Hat), **Ruff** (fast Python lint and format), **GitLens**, **Rainbow CSV**, and **Markdown All in One** for READMEs and design docs.`,
    { local: `**Open VS Code from the terminal and add extensions.**
\`\`\`powershell
code .
code --install-extension ms-python.python
code --install-extension ms-vscode-remote.remote-wsl
code --install-extension ms-azuretools.vscode-docker
code --install-extension redhat.vscode-yaml
code --list-extensions
\`\`\`
Expected: \`code .\` opens a window on the current folder. Each install prints \`Installing extensions...\` and then \`Extension '...' was successfully installed.\` The last command prints one extension id per line. If \`code\` is not recognised, open a new terminal; the installer adds it to PATH.` },
    `## WSL2 and Ubuntu
**WSL2** runs a genuine Linux kernel in a light virtual machine that Windows manages. It is not an emulator: the programs are the same ones that run on a cloud server. **Ubuntu** is the distribution most tutorials assume.

Why this course uses it: Docker Desktop runs Linux containers on WSL2; many data tools (dbt, Airflow, Dagster, CI scripts) are documented for Linux first; and your servers and pipelines will run Linux.

**Where files live.** Ubuntu keeps its files in a virtual disk. From Windows open them at \`\\\\wsl.localhost\\Ubuntu\\home\\you\` (older builds: \`\\\\wsl$\\Ubuntu\`), or type \`explorer.exe .\` inside Ubuntu. Your Windows drives appear inside Ubuntu as \`/mnt/c\`, \`/mnt/e\`.

**The speed rule.** Crossing the wall is slow. A project under \`/mnt/c\` makes git, pip and npm noticeably slower. For Linux tools, **keep the project in the Linux home folder** (\`~/projects\`) and open it with \`code .\` from Ubuntu. Permissions also work properly there; on \`/mnt/c\` they usually do not.

Use PowerShell for Windows jobs (winget, Azure CLI, Office files) and Ubuntu for Linux jobs (Docker CLI, shell scripts, dbt). Keep one copy of a repository, not two.`,
    { local: `**Install WSL2 with Ubuntu.** Open Windows Terminal **as administrator** (right-click, Run as administrator).
\`\`\`powershell
wsl --install
\`\`\`
Expected: Windows turns on the required features and downloads Ubuntu (the default distribution; the exact messages depend on your Windows build). **Restart when asked.** After the restart an Ubuntu window opens and asks you to create a Linux username and password. These are separate from your Windows login. If it fails with a message about virtualization, enable virtualization (VT-x or SVM) in the BIOS settings and try again. On a laptop where WSL is not installed yet, \`wsl --version\` simply tells you that and suggests \`wsl.exe --install\`.

Check it from PowerShell:
\`\`\`powershell
wsl --list --verbose
wsl --shutdown
\`\`\`
Expected: a table with columns NAME, STATE and VERSION, a row for \`Ubuntu\` (with \`*\` marking the default), STATE \`Running\` or \`Stopped\`, and VERSION \`2\`. \`wsl --shutdown\` stops all Linux machines; it is the reset button when something hangs.

Inside Ubuntu (type \`wsl\` in PowerShell, or open Ubuntu from the Start menu):
\`\`\`bash
pwd
cat /etc/os-release
sudo apt update
sudo apt install -y python3-venv python3-pip curl
code .
\`\`\`
Expected: \`pwd\` prints \`/home/<your username>\`. \`os-release\` shows lines such as \`PRETTY_NAME="Ubuntu 24.04 LTS"\` (the version is whatever the current release is). The apt commands print many lines and end without an error. \`code .\` installs a small "VS Code Server" the first time and then opens VS Code connected to Ubuntu.` },
    `## The Linux commands you will use every week
The right column is the nearest PowerShell equivalent, because you will switch between the two.

| Linux | What it does | PowerShell near-equivalent |
|---|---|---|
| \`pwd\` | print the current folder | \`Get-Location\` |
| \`ls -la\` | list files, long format, hidden included | \`Get-ChildItem -Force\` |
| \`cd folder\` | move; \`cd ..\` up, \`cd ~\` home | \`Set-Location\` |
| \`cat file\` | print a file | \`Get-Content file\` |
| \`head -n 5 file\` | first 5 lines | \`Get-Content file -TotalCount 5\` |
| \`tail -n 5 file\` | last 5 lines; \`tail -f\` follows a growing log | \`Get-Content file -Tail 5\` (add \`-Wait\` to follow) |
| \`grep -n -i text file\` | lines containing text, numbered, ignoring case | \`Select-String -Pattern text -Path file\` |
| \`grep -r text .\` | search every file under here | \`Get-ChildItem -Recurse\`, then \`Select-String\` |
| \`find . -name "*.csv"\` | find files by name | \`Get-ChildItem -Recurse -Filter *.csv\` |
| \`wc -l file\` | count lines | \`(Get-Content file).Count\` |
| \`sort\` and \`uniq -c\` | sort lines; count identical neighbouring lines | \`Sort-Object\` and \`Group-Object\` |
| \`ps aux\` and \`kill 1234\` | list processes; ask one to stop | \`Get-Process\` and \`Stop-Process -Id 1234\` |

### Pipes and redirects
A **pipe** \`|\` feeds the output of the command on its left into the command on its right. Each tool does one small job and pipes chain them: *show the file, keep the ERROR lines, sort them, count the repeats.*

A **redirect** sends output to a file. \`>\` **replaces** the file, \`>>\` **appends**, \`2>\` sends error messages, and \`2>&1\` merges errors into normal output: \`python load.py > run.log 2>&1\`.`,
    { sketch: { w: 760, h: 340, caption: 'A pipe passes one command\'s output to the next. uniq only counts neighbouring lines, so sort comes first.', items: [
      { t: 'doc', x: 10, y: 26, w: 100, h: 68, label: 'run.log', fill: 'yellow' },
      { t: 'box', x: 190, y: 34, w: 140, h: 52, label: 'grep ERROR', fill: 'orange' },
      { t: 'box', x: 400, y: 34, w: 120, h: 52, label: 'sort', fill: 'orange' },
      { t: 'box', x: 590, y: 34, w: 150, h: 52, label: 'uniq -c', fill: 'orange' },
      { t: 'arrow', x1: 110, y1: 60, x2: 190, y2: 60, label: '|', ly: -12 },
      { t: 'arrow', x1: 330, y1: 60, x2: 400, y2: 60, label: '|', ly: -12 },
      { t: 'arrow', x1: 520, y1: 60, x2: 590, y2: 60, label: '|', ly: -12 },
      { t: 'note', x: 4, y: 112, w: 160, h: 104, text: 'INFO load start\nERROR missing file\nINFO load end\nERROR missing file\nERROR bad row', fill: 'yellow', size: 14 },
      { t: 'note', x: 186, y: 112, w: 150, h: 76, text: 'ERROR missing file\nERROR missing file\nERROR bad row', fill: 'orange', size: 14 },
      { t: 'note', x: 372, y: 112, w: 164, h: 76, text: 'ERROR bad row\nERROR missing file\nERROR missing file', fill: 'orange', size: 14 },
      { t: 'note', x: 560, y: 112, w: 190, h: 56, text: '1 ERROR bad row\n2 ERROR missing file', fill: 'green', size: 14 },
      { t: 'text', x: 84, y: 236, text: 'the input:\n5 lines', size: 13, color: '#5c6478' },
      { t: 'text', x: 261, y: 208, text: 'keeps 3 of 5 lines', size: 13, color: '#5c6478' },
      { t: 'text', x: 454, y: 208, text: 'equal lines now\nsit side by side', size: 13, color: '#5c6478' },
      { t: 'text', x: 655, y: 188, text: 'each distinct line\nwith its count', size: 13, color: '#5c6478' },
      { t: 'note', x: 60, y: 272, w: 640, h: 52, text: 'uniq only merges NEIGHBOURING identical lines.\nWithout sort first, equal lines far apart are counted separately.', fill: 'pink', size: 14 },
    ] } },
    `### Permissions in one paragraph
\`ls -l\` starts each line with something like \`-rwxr-xr--\`: the type (\`-\` file, \`d\` folder), then three groups of r (read), w (write), x (execute) for the **owner**, the **group** and **everyone else**. A script needs \`x\` before Linux will run it: \`chmod +x deploy.sh\`, then \`./deploy.sh\`. Numbers add up as r=4, w=2, x=1, so \`755\` is \`rwxr-xr-x\`, \`644\` is \`rw-r--r--\` (an ordinary file) and \`600\` is \`rw-------\` (private, right for keys and \`.env\` files). \`sudo\` runs one command as administrator: never paste one you do not understand.

### Processes and curl
\`ps aux | grep python\` finds your processes. \`kill 4321\` asks one to stop politely; \`kill -9 4321\` forces it with no clean-up, so use it last. **Ctrl+C** stops the program in front of you. \`ss -ltnp\` lists listening ports with the program behind each. \`curl\` is the command from the HTTP lesson: plain \`curl\` in Ubuntu, \`curl.exe\` in PowerShell.`,
    { local: `**A short practice session in Ubuntu.** Type the lines; they create their own sample file.
\`\`\`bash
cd ~ && mkdir -p lab && cd lab
printf 'INFO load start\\nERROR missing file\\nINFO load end\\nERROR missing file\\nERROR bad row\\n' > run.log
grep -n ERROR run.log
wc -l run.log
cat run.log | grep ERROR | sort | uniq -c
printf '#!/bin/bash\\necho "hello from $(whoami)"\\n' > hello.sh
./hello.sh
chmod +x hello.sh
./hello.sh
ls -l hello.sh
\`\`\`
Expected output, in order:
\`\`\`text
2:ERROR missing file
4:ERROR missing file
5:ERROR bad row
5 run.log
      1 ERROR bad row
      2 ERROR missing file
bash: ./hello.sh: Permission denied
hello from <your Linux username>
-rwxr-xr-x 1 <you> <you> 40 <date and time> hello.sh
\`\`\`
The count column of \`uniq -c\` is right-aligned and padded. The owner, date and time in \`ls -l\` are yours.` },
    { py: {
      title: 'A tiny grep -n, and two invisible file problems',
      starter: `def grep_n(lines, pattern, ignore_case=False):
    """Like grep -n: return 'number:line' for lines that contain pattern."""
    hits = []
    for number, line in enumerate(lines, start=1):
        text, needle = (line.lower(), pattern.lower()) if ignore_case else (line, pattern)
        if needle in text:
            hits.append(f"{number}:{line}")
    return hits

log = [
    "08:00:01 INFO  load started",
    "08:00:03 ERROR missing file sales_2026-09.csv",
    "08:00:04 INFO  retrying in 5 s",
    "08:00:09 error bad IFSC on row 7",
    "08:00:10 INFO  load finished",
]
print("grep -n ERROR    ->", grep_n(log, "ERROR"))
print("grep -n -i error ->", grep_n(log, "error", ignore_case=True))

# Invisible problem 1: line endings. A Windows editor saves each line ending as \\r\\n
script = "echo start\\r\\necho done\\r\\n"
print(script.split("\\n"))       # a Linux shell would see the \\r as part of each command
print(script.splitlines())      # splitlines() understands both endings

# Invisible problem 2: encoding. Windows PowerShell 5.1 may write UTF-16 with  >
data = "gross_pay,net_pay\\n".encode("utf-16")
print(data[:6])
try:
    data.decode("utf-8")
except UnicodeDecodeError as e:
    print("UnicodeDecodeError:", e)
print(data.decode("utf-16").strip())`,
      note: 'The first list shows each line still ends in a carriage return. That invisible character is why a script saved on Windows fails on Linux. The error text for the second problem is the one you see when Python or pandas opens a UTF-16 file as UTF-8.',
      hint: 'Change ignore_case to False in the second call and see the uppercase "ERROR" line disappear.',
    } },
    { pychallenge: {
      id: 'foundations-pych-grep',
      prompt: 'Write `grep(lines, pattern, ignore_case=False)` that behaves like `grep -n`: return a list of strings `"N:line"` for every line that **contains `pattern` as a plain substring** (not a regular expression), where `N` is the **1-based** line number. Keep the original text of the line. When `ignore_case` is true, compare ignoring case. Return `[]` when nothing matches.',
      starter: `def grep(lines, pattern, ignore_case=False):
    return []`,
      tests: `lines = ["load started", "ERROR: file missing", "load finished", "error: retrying", "ERROR again"]
assert grep(lines, "ERROR") == ["2:ERROR: file missing", "5:ERROR again"]
assert grep(lines, "error") == ["4:error: retrying"]
assert grep(lines, "error", ignore_case=True) == ["2:ERROR: file missing", "4:error: retrying", "5:ERROR again"]
assert grep(lines, "zzz") == []
assert grep([], "x") == []
assert grep(["a.b", "axb"], ".") == ["1:a.b"]
assert grep(["total (INR)", "total INR"], "(INR)") == ["1:total (INR)"]
assert grep(["Load", "load"], "LOAD", True) == ["1:Load", "2:load"]`,
      solution: `def grep(lines, pattern, ignore_case=False):
    hits = []
    needle = pattern.lower() if ignore_case else pattern
    for number, line in enumerate(lines, start=1):
        text = line.lower() if ignore_case else line
        if needle in text:
            hits.append(f"{number}:{line}")
    return hits`,
      hint: 'enumerate(lines, start=1) gives the 1-based number. Use the "in" operator for a plain substring, and lower-case both sides only when ignore_case is true. Format the hit with the ORIGINAL line.',
    } },
    `## Line endings: the invisible bug
Every line of a text file ends with an invisible marker. Windows uses two characters, **CRLF** (\`\\r\\n\`). Linux uses one, **LF** (\`\\n\`). Windows tools read both. Linux shell programs treat the stray \`\\r\` as part of the text, so a script saved with CRLF fails in Ubuntu or in a container:

\`\`\`text
bash: ./deploy.sh: /bin/bash^M: bad interpreter: No such file or directory
./deploy.sh: line 2: $'\\r': command not found
\`\`\`

\`^M\` is how a carriage return is displayed. The same problem breaks Dockerfile entry scripts and \`.env\` files (a hidden \`\\r\` ends up inside the value).

Three fixes. (1) **In VS Code**, click \`CRLF\` in the status bar, choose \`LF\`, save. (2) **In Ubuntu**, run \`sed -i 's/\\r$//' deploy.sh\` or \`dos2unix deploy.sh\`. (3) **In Git**, prevent it: add \`*.sh text eol=lf\` to a \`.gitattributes\` file, and consider \`git config --global core.autocrlf input\`. Git for Windows may default to CRLF on checkout, which is wrong for scripts.`,
    { warn: 'Never run \`setx PATH "%PATH%;C:\\tool"\`. \`setx\` has a documented limit of 1,024 characters, so a long PATH can be silently cut off, and \`%PATH%\` expands to the machine and user lists together, which then get saved into your user PATH. Add folders with the Environment Variables window instead, and open a new terminal.' },
    { warn: 'Do not run \`sudo\` or \`rm -rf\` lines pasted from a web page unless you can say what each part does. A stray space in \`rm -rf ~ /tmp/x\` deletes your whole home folder. In PowerShell take the same care with \`Remove-Item -Recurse -Force\`, and add \`-WhatIf\` first to preview what would be deleted.' },
    { interview: '**"How do you find which process is using port 8000 and stop it?"** Model answer: "On Windows I use PowerShell. \`Get-NetTCPConnection -LocalPort 8000 -State Listen\` shows the OwningProcess id, \`Get-Process -Id <id>\` tells me which program it really is so I do not stop the wrong one, and \`Stop-Process -Id <id>\` stops it. The older way is \`netstat -ano | findstr :8000\` and \`taskkill /PID <id> /F\`. On Linux or in WSL I run \`ss -ltnp | grep :8000\` or \`lsof -i :8000\` to get the PID, then \`kill <pid>\`, and \`kill -9\` only if it ignores that. If the process keeps coming back I look for its parent, such as an auto-reloader or a service manager. A Windows program and a WSL program are on different sides, so I check the side where the app runs."' },
    { real: 'Next time a script "works on my machine", ask five questions and put the answers at the top of the bug report. (1) Which shell and system: PowerShell, Ubuntu in WSL, or a container? (2) Which Python: \`python --version\` and \`where.exe python\`, or \`which python3\`? (3) Which folder did you start from: \`pwd\`? (4) Is the variable set in **this** terminal, or only in the one you set it in? (5) Could it be CRLF line endings or a UTF-16 file? On a client laptop, most "the tool is broken" calls turn out to be questions 2 to 4.' },
    `## Recap
- You are always typing into one of three layers: **Windows apps, PowerShell, or Ubuntu in WSL2**. Most "works there, not here" bugs are a path, a variable or a file crossing between them.
- PowerShell pipes **objects**. \`curl\` is an alias, so use \`curl.exe\`. Say \`-Encoding utf8\` when you write files.
- **Quote paths with spaces**, build them with \`Join-Path\` or \`pathlib\`. A program gets a **copy** of the environment at start, so open a new terminal after \`setx\`. PATH is a list of folders split on \`;\` (Windows) or \`:\` (Linux).
- Install with **winget**, set the execution policy for your user only, and keep Linux-tool projects in the **Linux home folder**, not \`/mnt/c\`.
- Learn the weekly set: \`pwd ls cd cat head tail grep find wc sort uniq\`, pipes, \`>\` and \`>>\`, \`chmod\`, \`ps\`, \`kill\`.
- **CRLF** line endings break Linux scripts. Fix them in the editor, with \`sed\` or \`dos2unix\`, and prevent them with \`.gitattributes\`.`,
  ],
  quiz: [
    { q: 'In Windows PowerShell 5.1 you type `curl -I https://example.com` and get an error about a parameter. What is happening?', o: ['You must be an administrator', 'The server is down', '`curl` is an alias for Invoke-WebRequest; use `curl.exe` for the real curl', 'curl is not installed on Windows'], a: 2, why: 'The alias hides the real program, and Invoke-WebRequest has different options. Type curl.exe (or check Get-Alias curl).' },
    { q: 'You ran `setx API_KEY "abc"` and then `$env:API_KEY` prints nothing in the same window. Why?', o: ['A program gets a copy of the variables when it starts, so only terminals opened afterwards see the saved value', 'API_KEY is a reserved name', 'setx failed silently', 'Environment variables only work in Linux'], a: 0, why: 'setx stores the value for future processes. Open a new terminal (and restart VS Code) to see it.' },
    { q: 'You use Linux tools in WSL2 on a repository that is also under C:\\Users\\you\\code. Where should you keep the working copy for speed?', o: ['On a USB drive', 'It makes no difference', 'In /mnt/c/Users/you/code', 'Inside the Linux home folder, such as ~/projects'], a: 3, why: 'Files accessed through /mnt/c cross the Windows/Linux boundary and are noticeably slower; permissions also behave properly in the Linux home folder.' },
    { q: 'Why does `sort` come before `uniq -c` in `cat run.log | grep ERROR | sort | uniq -c`?', o: ['uniq cannot read files', 'uniq only counts identical lines that are next to each other', 'sort removes the ERROR word', 'grep needs sorted input'], a: 1, why: 'uniq compares each line with the previous one. Sorting puts equal lines side by side so they are counted together.' },
    { q: 'What does `chmod 600 .env` do?', o: ['Lets the owner read and write it and gives nobody else any access', 'Hides it from ls', 'Makes it executable for everyone', 'Deletes the file after 600 seconds'], a: 0, why: '6 = read + write for the owner; the two zeros give the group and everyone else no access. It is the right mode for secrets and keys.' },
    { q: 'A shell script fails in Ubuntu with `/bin/bash^M: bad interpreter: No such file or directory`. What is the cause?', o: ['Python is not installed', 'The script is too long', 'A missing semicolon', 'The file has Windows CRLF line endings'], a: 3, why: 'The carriage return (shown as ^M) became part of the interpreter name. Convert the file to LF with the editor, sed or dos2unix.' },
  ],
  task: {
    title: 'Set up your laptop and prove it works',
    steps: [
      'Install Git, VS Code and Python 3.12 with winget. Open a new terminal and run `git --version`, `python --version` and `code --version`. Set the execution policy for your user if activating a virtual environment is blocked.',
      'Run `$env:Path -split \';\'` and count the entries. Copy the whole value of `$env:Path` into the browser playground, call `parse_path_var` on it, and note how many entries are duplicates or empty.',
      'Install WSL2 with Ubuntu, run `wsl --list --verbose`, then run the practice session from the callout in `~/lab`. Compare your output with the expected output.',
      'In VS Code on Windows create `hello.sh` with CRLF endings, copy it into your Ubuntu home folder and run it. Write down the exact error, switch the file to LF in the status bar, and run it again.',
      'Write the port-8000 answer for both PowerShell and Linux in your own words, then start `python -m http.server 8000` in one window and use your commands from another window to find and stop it.',
    ],
    deliverable: 'A file `setup-notes.md` with: the three version outputs, the output of `wsl --list --verbose`, your PATH entry count and duplicate count, the CRLF error text and how you fixed it, and the two port-8000 command sets.',
  },
};
