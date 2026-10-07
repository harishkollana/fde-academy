export default {
  id: 'python-files',
  title: 'Files and folders',
  goal: 'You can use pathlib to find and manage files, read and write text, CSV, JSON and JSON Lines with the right encoding, write output safely so nobody ever sees a half-written file, and move files through an incoming, processed and failed folder pipeline.',
  roadmap: ['pathlib', 'glob', 'open and encodings', 'csv and json modules', 'JSON Lines', 'many files in a folder', 'shutil and zipfile'],
  blocks: [
    `## The problem
Every month the branches drop their sales files into a shared folder. Twenty files arrive: \`sales_2026-09.csv\`, \`Sales Sep (final) v2.csv\`, one zipped file, one saved by Excel with an invisible mark at the start, and one that is still being copied when your job starts. Your script has to find the right files, read them without crashing on strange characters, write the report so that nobody opens a half-finished file, and put every input file in the right place afterwards, so that tomorrow's run does not process it a second time.

None of this is hard, but each point has a classic mistake that costs people an afternoon: a path with a backslash that breaks, a CSV whose first column name has a ghost character in it, a report that is corrupted because the job was stopped halfway, a file that is processed twice. This lesson gives you the small set of tools and habits that avoid them.

One rule for this lesson: every example in the browser writes to a **temporary folder** that is deleted at the end, so you cannot damage anything. On your laptop you will use real folders in the task.`,
    `## pathlib: paths are objects, not strings
Do not build paths by gluing strings (\`folder + "\\\\" + name\`). Use \`pathlib.Path\`. A \`Path\` knows how to join parts, pull a path apart, and ask the file system questions, and it works on Windows, Mac and Linux.
\`\`\`python
from pathlib import Path

p = Path("C:/fde/incoming") / "sales_2026-09.csv"   # / joins parts
p.name        # 'sales_2026-09.csv'     file name
p.stem        # 'sales_2026-09'         name without the last suffix
p.suffix      # '.csv'
p.parent      # Path('C:/fde/incoming')
p.exists(), p.is_file(), p.is_dir()
p.with_suffix(".done")                  # change the extension
p.read_text(encoding="utf-8")           # whole file as text (small files only)
p.write_text("hello", encoding="utf-8")
p.parent.mkdir(parents=True, exist_ok=True)   # create folders, no error if present
\`\`\`
**Finding files.** \`folder.glob("sales_*.csv")\` finds matches in one folder, \`folder.rglob("*.csv")\` searches all sub-folders, \`folder.iterdir()\` lists everything. They return a **generator** (you know that word now), so wrap in \`sorted(...)\` when the order matters. Sorting makes runs repeatable.

**Windows tips.** A path like \`"C:\\fde"\` in code is a trap, because \`\\f\` and \`\\n\` are escape codes in Python strings. Write forward slashes (\`"C:/fde"\`), a raw string (\`r"C:\\fde"\`) or build it with \`/\`. \`Path.home()\` gives your user folder and \`Path.cwd()\` the current folder.`,
    { sketch: { w: 760, h: 292, caption: 'A Path is taken apart with attributes, and put together with the slash operator', items: [
      { t: 'text', x: 380, y: 28, text: 'p = Path("C:/fde/incoming") / "sales_2026-09.csv"', font: 'mono', size: 14, bold: true, anchor: 'middle' },
      { t: 'table', x: 14, y: 70, title: 'taking it apart', cols: ['expression', 'result'], colW: [196, 224], rows: [['p.name', 'sales_2026-09.csv'], ['p.stem', 'sales_2026-09'], ['p.suffix', '.csv'], ['p.parent', 'C:/fde/incoming'], ['p.with_suffix(".done")', 'sales_2026-09.done']], rowH: 28, hl: [0] },
      { t: 'note', x: 450, y: 56, w: 296, h: 96, fill: 'green', size: 13, text: 'Join with the slash:\nroot / "processed" / p.name\nNo manual backslashes, no string +,\nthe same code runs on any system.' },
      { t: 'note', x: 450, y: 166, w: 296, h: 96, fill: 'pink', size: 13, text: 'Find files with glob:\nfolder.glob("sales_*.csv")  one folder\nfolder.rglob("*.csv")  all sub-folders\nWrap in sorted() for a stable order.' },
    ] } },
    { py: {
      title: 'pathlib tour inside a temporary folder',
      starter: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as tmp:          # a folder that disappears at the end
    root = Path(tmp)
    incoming = root / "incoming"                    # / joins parts on any system
    incoming.mkdir(parents=True, exist_ok=True)
    (incoming / "sales_2026-08.csv").write_text("invoice_no,amount\\nINV/1,100\\n", encoding="utf-8")
    (incoming / "sales_2026-09.csv").write_text("invoice_no,amount\\nINV/2,250\\nINV/3,75\\n", encoding="utf-8")
    (incoming / "notes.txt").write_text("not data", encoding="utf-8")
    (incoming / "archive").mkdir()
    (incoming / "archive" / "sales_2025-12.csv").write_text("invoice_no,amount\\n", encoding="utf-8")

    p = incoming / "sales_2026-09.csv"
    print(p.name, "|", p.stem, "|", p.suffix, "|", p.parent.name)
    print(p.exists(), p.is_file(), incoming.is_dir(), "| not there:", (incoming / "nope.csv").exists())
    print(p.with_suffix(".done").name, "|", p.with_name("copy_of_" + p.name).name)

    print("glob :", sorted(x.name for x in incoming.glob("sales_*.csv")))
    print("rglob:", sorted(x.relative_to(root).as_posix() for x in root.rglob("*.csv")))
    print("iterdir:", sorted(x.name for x in incoming.iterdir()))

    print(p.read_text(encoding="utf-8").splitlines())

    done = incoming / "processed"
    done.mkdir()
    p.rename(done / p.name)                          # move a file
    print("after rename:", sorted(x.name for x in incoming.iterdir()))
    (done / p.name).unlink()                         # delete a file
    print("deleted:", not (done / p.name).exists())

print("the temporary folder is gone:", not root.exists())`,
      note: 'glob looks only in the folder itself, so it does not find archive/sales_2025-12.csv; rglob does. Every path is printed relative to the temporary root, so the output is the same on every computer.',
    } },
    `## Opening files: modes, encodings and the invisible mark
\`open(path, mode, encoding=..., newline=...)\` is the general tool. Always use it inside a \`with\` block so the file is closed.

| Mode | Meaning |
|---|---|
| \`"r"\` | read text (the default) |
| \`"w"\` | write text, **erasing** the old content first |
| \`"a"\` | append to the end |
| \`"x"\` | create, and fail if the file exists |
| add \`"b"\` (\`"rb"\`, \`"wb"\`) | bytes instead of text (images, zips, PDFs) |

**Encoding** is how characters are stored as bytes. **Always write \`encoding="utf-8"\`.** Without it Python uses the Windows default, which is not UTF-8, and a file with \`₹\` or an accented name works on one PC and fails on another. Three cases you will meet:
- **\`utf-8\`** is the standard.
- **\`utf-8-sig\`** is UTF-8 **with a BOM** (byte order mark: three invisible bytes at the start). Excel's "CSV UTF-8" option adds one. If you read such a file as plain \`utf-8\`, the first column name becomes \`'\\ufeffinvoice_no'\` and \`row["invoice_no"]\` raises \`KeyError\`. Read files that come from Excel with \`utf-8-sig\`: it removes the mark if present and does no harm if absent.
- **\`cp1252\`** is the old Windows encoding. If \`utf-8\` raises \`UnicodeDecodeError\`, try it.

**CSV rules.** Always open CSV files with \`newline=""\`: the \`csv\` module handles line endings itself, and without it Windows writes a blank line after every row. Every value you read is **text**, even \`"100"\`. Convert it yourself (and use \`Decimal\` for money). Use \`DictReader\` and \`DictWriter\` so you work with column names, and pass \`delimiter=";"\` for files made on computers where the comma is the decimal separator.`,
    { py: {
      title: 'CSV with a BOM, a semicolon file and a legacy encoding',
      starter: `import csv
import io
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / "vendor_export.csv"

    # a file as Excel saves it: UTF-8 with a BOM, a comma and a quote inside values
    rows = [["invoice_no", "supplier", "amount"],
            ["INV/1", "Nandi Electricals, Pune", "1,250.50"],
            ["INV/2", 'Godavari "Chem" Ltd', "900"]]
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        csv.writer(f).writerows(rows)                  # the writer quotes values when needed
    print("first bytes:", path.read_bytes()[:3])       # the invisible BOM

    with open(path, newline="", encoding="utf-8") as f:            # WRONG encoding for this file
        print("utf-8     header:", next(csv.reader(f)))
    with open(path, newline="", encoding="utf-8-sig") as f:        # RIGHT: the BOM is removed
        reader = csv.DictReader(f)
        data = list(reader)
        print("utf-8-sig header:", reader.fieldnames)
    print(data[0])
    print(data[1]["supplier"])
    print("every value is text:", type(data[0]["amount"]).__name__, repr(data[0]["amount"]))

    # a semicolon file (comma used as the decimal mark)
    text = "invoice_no;amount\\nINV/3;1250,50\\n"
    print(list(csv.DictReader(io.StringIO(text), delimiter=";")))

    # stream a few columns of the practice file into a new CSV, row by row
    out = Path(tmp) / "gl_sample.csv"
    with open("fact_gl.csv", newline="", encoding="utf-8") as src, open(out, "w", newline="", encoding="utf-8") as dst:
        writer = csv.DictWriter(dst, fieldnames=["gl_id", "journal_id", "debit", "credit"], extrasaction="ignore")
        writer.writeheader()
        for number, row in enumerate(csv.DictReader(src)):
            if number == 3:
                break
            writer.writerow(row)
    print(out.read_text(encoding="utf-8").splitlines())

    # an old Windows file
    legacy = Path(tmp) / "legacy.csv"
    legacy.write_bytes("supplier\\nCafé Ltd\\n".encode("cp1252"))
    try:
        legacy.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print("UnicodeDecodeError: this file is not UTF-8")
    print(legacy.read_text(encoding="cp1252").splitlines()[1])`,
      note: 'The comma inside "Nandi Electricals, Pune" and the quotes inside "Godavari Chem Ltd" are handled by the csv module (it adds quotes around such values), which is why you never split CSV lines with line.split(","). The three bytes at the start are the BOM: reading with plain utf-8 leaves them in the first column name.',
    } },
    `## JSON and JSON Lines
**JSON** stores nested data (dictionaries, lists, text, numbers, true/false, null). \`json.dumps(obj)\` makes text, \`json.loads(text)\` reads it, and \`json.dump(obj, f)\` / \`json.load(f)\` work on open files. Three details:
- JSON has **no date and no Decimal**. \`json.dumps\` raises \`TypeError\` for them. Pass \`default=str\` to write them as text (a \`Decimal\` as text keeps every digit; a float would not).
- Use \`ensure_ascii=False\` to keep \`₹\` and accents readable, and \`indent=2\` for files people will read.
- One big JSON array must be **read completely** before you can use it. That is a problem for large data.

**JSON Lines** (\`.jsonl\`, also called NDJSON) fixes that: **one JSON object per line**. You can append a record with one write, read the file **line by line** (a generator again), and one broken line does not ruin the rest. It is the usual format for logs, event streams and files that an ingestion tool reads. Rule of thumb: a **small, nested config or result** goes in JSON, **many similar records** go in JSON Lines (or CSV when they are flat).`,
    { py: {
      title: 'JSON with dates and Decimals, and JSON Lines with a broken line',
      starter: `import json
import tempfile
from datetime import date
from decimal import Decimal
from pathlib import Path

journal = {"journal_id": "JV202504-0001", "posting_date": date(2025, 4, 7),
           "amount": Decimal("130833.18"), "narration": "Café ₹ sale"}

try:
    json.dumps(journal)
except TypeError as exc:
    print("TypeError:", exc)

print(json.dumps(journal, default=str, ensure_ascii=False, indent=2))

with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / "events.jsonl"
    events = [{"id": i, "status": s} for i, s in enumerate(["ok", "ok", "failed", "ok"], start=1)]
    with open(path, "w", encoding="utf-8") as f:
        for event in events:
            f.write(json.dumps(event) + "\\n")               # ONE object per line
    with open(path, "a", encoding="utf-8") as f:            # appending is a single write
        f.write(json.dumps({"id": 5, "status": "ok"}) + "\\n")

    with open(path, encoding="utf-8") as f:
        for number, line in enumerate(f, start=1):          # a stream: one line in memory
            record = json.loads(line)
            if record["status"] != "ok":
                print("line", number, "->", record)

    # one damaged line does not ruin the rest
    path.write_text('{"id": 1}\\n{"id": 2,\\n{"id": 3}\\n', encoding="utf-8")
    good, bad_lines = [], []
    with open(path, encoding="utf-8") as f:
        for number, line in enumerate(f, start=1):
            try:
                good.append(json.loads(line))
            except json.JSONDecodeError:
                bad_lines.append(number)
    print("good records:", good, "| damaged lines:", bad_lines)`,
      note: 'The date and the Decimal are written as text by default=str: "2025-04-07" and "130833.18". When you read this JSON back they are strings again, so convert them (a Pydantic model does that for you). The damaged line 2 is found by its line number, and records 1 and 3 are still usable.',
    } },
    `## Writing safely: never leave a half-written file
Imagine the job writes \`report.csv\` directly. It takes ten seconds. In the middle, the laptop restarts, the disk fills up, or an error is raised. The file now holds **half a report**, and the finance team opens it and uses it. Even without a crash, someone who opens the file during those ten seconds sees incomplete data.

The standard fix is the **atomic write**:
1. Write the whole content to a **temporary file in the same folder** (\`report.csv.tmp\`).
2. Only when it is complete, **rename it over the real name** with \`os.replace(tmp, final)\`.

The rename is a single step on the file system, so a reader sees either the **complete old file or the complete new file**, never something in between. If anything fails before step 2, delete the temp file and the old report is untouched. The temporary file must be in the **same folder** (the same disk), because a rename across disks is not atomic.

Habits that go with it: never overwrite your **input** files, put outputs in a separate folder, and name outputs by date or run so a re-run replaces the same file instead of creating a second one. That is part of making a job **idempotent**.`,
    { sketch: { w: 760, h: 300, caption: 'Direct write exposes a half file. Temp file plus os.replace shows the old or the new file, never half', items: [
      { t: 'text', x: 380, y: 22, text: 'write directly to report.csv', size: 16, bold: true, anchor: 'middle' },
      { t: 'doc', x: 14, y: 40, w: 100, h: 66, label: 'old report', fill: 'grey' },
      { t: 'arrow', x1: 118, y1: 72, x2: 246, y2: 72, label: 'open "w" erases', ly: -14 },
      { t: 'doc', x: 250, y: 40, w: 120, h: 66, label: 'HALF a file', fill: 'pink' },
      { t: 'arrow', x1: 374, y1: 72, x2: 470, y2: 72, label: 'crash', ly: -14 },
      { t: 'note', x: 474, y: 38, w: 272, h: 70, fill: 'pink', size: 13, text: 'A reader opens the file now\nand sees broken data.\nThe old report is already gone.' },
      { t: 'line', x1: 14, y1: 130, x2: 746, y2: 130, dashed: true, color: '#9aa3b5' },
      { t: 'text', x: 380, y: 152, text: 'write report.csv.tmp, then os.replace', size: 16, bold: true, anchor: 'middle' },
      { t: 'doc', x: 14, y: 170, w: 100, h: 66, label: 'old report', fill: 'grey' },
      { t: 'arrow', x1: 118, y1: 202, x2: 246, y2: 202, label: 'still readable', ly: -14 },
      { t: 'doc', x: 250, y: 170, w: 120, h: 66, label: 'report.csv.tmp', fill: 'yellow' },
      { t: 'arrow', x1: 374, y1: 202, x2: 470, y2: 202, label: 'os.replace', ly: -14 },
      { t: 'doc', x: 474, y: 170, w: 100, h: 66, label: 'new report', fill: 'green' },
      { t: 'note', x: 588, y: 168, w: 158, h: 74, fill: 'green', size: 13, text: 'One step. Readers\nsee old OR new,\nnever half.' },
      { t: 'note', x: 14, y: 256, w: 732, h: 34, fill: 'grey', size: 14, text: 'Keep the temp file in the SAME folder: a rename across two disks is not atomic.' },
    ] } },
    `## Many files: the incoming, processed, failed pipeline
A reliable folder job follows one pattern, and you will see it again in ingestion tools:
1. List the new files with \`glob\`, **sorted**.
2. Process each file **inside a try block**.
3. On success, **move** the file to \`processed/\`. On failure, move it to \`failed/\` and write a small \`.reason.txt\` next to it. A failed file must never block the others.
4. Write outputs atomically, and only move the input **after** the output is safely written.

Because finished files leave \`incoming/\`, running the job again does not process them twice. \`shutil\` is the toolbox for this: \`shutil.move\`, \`shutil.copy2\` (copy with timestamps), \`shutil.make_archive\`, \`shutil.rmtree\` (delete a folder tree: be careful) and \`shutil.disk_usage\`. For zip files use \`zipfile\`: you can list the names, extract, or read a file **inside** the zip without unpacking it. When you extract a zip from someone else, never trust the names inside it (a name like \`../../x\` could write outside your folder); the Security lesson shows the guard.`,
    { sketch: { w: 760, h: 300, caption: 'The folder pipeline: a file leaves incoming only when its output is safe; failures keep their reason', items: [
      { t: 'box', x: 14, y: 110, w: 130, h: 62, label: 'incoming/', sub: 'new csv files', fill: 'blue' },
      { t: 'arrow', x1: 148, y1: 141, x2: 238, y2: 141, label: 'sorted glob', ly: -14 },
      { t: 'box', x: 242, y: 96, w: 200, h: 90, label: 'job: try each file', sub: 'read, check, summarise', fill: 'yellow' },
      { t: 'arrow', x1: 446, y1: 112, x2: 536, y2: 52, label: 'ok', lx: -2, ly: -14 },
      { t: 'arrow', x1: 446, y1: 141, x2: 536, y2: 141, label: 'output', ly: -14 },
      { t: 'arrow', x1: 446, y1: 170, x2: 536, y2: 230, label: 'error', lx: -6, ly: 20 },
      { t: 'box', x: 540, y: 22, w: 206, h: 60, label: 'processed/', sub: 'moved after success', fill: 'green' },
      { t: 'box', x: 540, y: 111, w: 206, h: 60, label: 'output/ totals.json', sub: 'written atomically', fill: 'teal' },
      { t: 'box', x: 540, y: 200, w: 206, h: 60, label: 'failed/', sub: 'file + name.reason.txt', fill: 'pink' },
      { t: 'note', x: 14, y: 214, w: 428, h: 70, fill: 'grey', size: 13, text: 'Run it again: the finished files are gone from incoming,\nso nothing is processed twice. One bad file never\nstops the others.' },
    ] } },
    { py: {
      title: 'The whole pipeline: atomic write, processed and failed folders, and a zip',
      starter: `import csv
import io
import json
import os
import shutil
import tempfile
import zipfile
from pathlib import Path

def summarise(path):
    """Total of one sales file. Raises ValueError when the header is not the expected one."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ["invoice_no", "amount"]:
            raise ValueError(f"unexpected header {reader.fieldnames}")
        return sum(float(r["amount"]) for r in reader)

def write_atomic(path, text):
    tmp_path = path.with_name(path.name + ".tmp")
    tmp_path.write_text(text, encoding="utf-8")      # 1. write everything to a temp file
    os.replace(tmp_path, path)                       # 2. one step: old or new, never half

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    incoming, processed, failed, output = (root / n for n in ("incoming", "processed", "failed", "output"))
    for folder in (incoming, processed, failed, output):
        folder.mkdir()

    (incoming / "sales_a.csv").write_text("invoice_no,amount\\nINV/1,100\\nINV/2,250.5\\n", encoding="utf-8")
    (incoming / "sales_b.csv").write_text("inv,amt\\nINV/3,75\\n", encoding="utf-8")                  # wrong header
    (incoming / "sales_c.csv").write_bytes(b"\\xef\\xbb\\xbfinvoice_no,amount\\r\\nINV/4,40\\r\\n")        # BOM + Windows line ends
    (incoming / "readme.txt").write_text("ignore me", encoding="utf-8")

    totals = {}
    for path in sorted(incoming.glob("sales_*.csv")):
        try:
            totals[path.name] = summarise(path)
        except Exception as exc:                                       # a bad file must not stop the run
            shutil.move(path, failed / path.name)
            (failed / (path.name + ".reason.txt")).write_text(str(exc), encoding="utf-8")
        else:
            write_atomic(output / "totals.json", json.dumps(totals, indent=2))   # output first ...
            shutil.move(path, processed / path.name)                             # ... then move the input

    for folder in (incoming, processed, failed, output):
        print(f"{folder.name:<10}", sorted(x.name for x in folder.iterdir()))
    print("reason:", (failed / "sales_b.csv.reason.txt").read_text(encoding="utf-8"))
    print("totals:", json.loads((output / "totals.json").read_text(encoding="utf-8")))

    archive = root / "processed_2026-09.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(processed.iterdir()):
            z.write(p, arcname=p.name)
    with zipfile.ZipFile(archive) as z:
        print("zip contains:", z.namelist())
        with z.open("sales_a.csv") as raw:                 # read inside the zip, no unpacking
            rows = list(csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")))
    print(rows)`,
      note: 'sales_b.csv fails because of its header and goes to failed/ with the reason, while sales_a.csv and sales_c.csv (with a BOM and Windows line endings) are processed. Read the loop once more: the output is written before the input is moved. If the write fails, the input is still in incoming/ and tomorrow\'s run tries again.',
    } },
    { warn: `Things that go wrong with files:
- **No \`encoding=\`.** The file works on your PC and breaks on the server. Always write \`encoding="utf-8"\` (or \`utf-8-sig\` for files from Excel).
- **\`"w"\` erases first.** Opening an existing file with \`"w"\` empties it at once. Use the atomic pattern for outputs, and never open an input file with \`"w"\`.
- **A file open in Excel is locked on Windows.** Writing or replacing it raises \`PermissionError\`. Close it, or write the report under a new name with the date.
- **Reading a huge file with \`read()\` or \`readlines()\`.** Loop over the file or use \`csv\` to stream it (see the iterators lesson).
- **Half-copied files in \`incoming/\`.** If another system is still copying a file when you start, you read part of it. Agree on a rule: the sender uploads under a temporary name and renames at the end, or you skip files modified in the last minute.
- **Relying on the current folder.** \`open("data.csv")\` depends on where you started Python (and the Task Scheduler starts elsewhere). Build paths from a known base, for example \`Path(__file__).parent\`.
- **\`shutil.rmtree\` on the wrong path.** It deletes the whole tree with no recycle bin. Print the path first and never build it from user input.
- **Time-of-check problems.** Checking \`if path.exists()\` and then opening leaves a gap. Just open and handle \`FileNotFoundError\`.` },
    { pychallenge: {
      id: 'python-files-ch1',
      prompt: 'Write `write_lines_atomic(path, lines)`. It writes every item of the iterable `lines`, each followed by a newline, as UTF-8 into `path` using the **atomic pattern**: write to `<name>.tmp` in the same folder, then `os.replace` it over the real file. Create missing parent folders. If anything fails while writing (for example the iterable raises), the old file must stay unchanged, the error must reach the caller and no `.tmp` file may be left behind.',
      starter: `import os
from pathlib import Path

def write_lines_atomic(path, lines):
    # TODO: write to a temp file next to path, then os.replace; remove the temp file when an error happens
    with open(path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\\n")
`,
      tests: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as d:
    p = Path(d) / "report.csv"
    write_lines_atomic(p, ["a", "b"])
    assert p.read_text(encoding="utf-8") == "a\\nb\\n"
    write_lines_atomic(p, iter(["é", "ü"]))
    assert p.read_text(encoding="utf-8") == "é\\nü\\n"

    def breaking():
        yield "new1"
        yield "new2"
        raise RuntimeError("source failed half way")

    try:
        write_lines_atomic(p, breaking())
        raise AssertionError("expected RuntimeError")
    except RuntimeError:
        pass
    assert p.read_text(encoding="utf-8") == "é\\nü\\n", "the old file must survive a failed write"
    assert sorted(x.name for x in Path(d).iterdir()) == ["report.csv"], "no temp file may be left"

    q = Path(d) / "sub" / "deeper" / "new.txt"
    write_lines_atomic(q, [])
    assert q.read_text(encoding="utf-8") == ""`,
      solution: `import os
from pathlib import Path

def write_lines_atomic(path, lines):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            for line in lines:
                f.write(line + "\\n")
        os.replace(tmp, path)
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
`,
      hint: 'Make `path = Path(path)`, create `path.parent` with `mkdir(parents=True, exist_ok=True)`, and build `tmp = path.with_name(path.name + ".tmp")`. In a `try`: write all lines to `tmp`, then `os.replace(tmp, path)`. In `except BaseException:` do `tmp.unlink(missing_ok=True)` and `raise`.',
    } },
    { pychallenge: {
      id: 'python-files-ch2',
      prompt: 'Write `read_csv_rows(path)` for files of unknown origin. Open it as UTF-8 and remove a BOM if there is one. The delimiter is the one of `,` `;` tab and `|` that occurs **most often in the first line** (the header; use a comma if none occurs). Return a list of dictionaries, one per data row, with the header names stripped of spaces and the values left as they are. Skip completely empty lines. A file with only a header returns an empty list.',
      starter: `import csv

def read_csv_rows(path):
    # TODO: open with utf-8-sig and newline="", detect the delimiter from the header line, return dicts
    return []
`,
      tests: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as d:
    d = Path(d)
    (d / "a.csv").write_bytes("\\ufeffinvoice_no,amount\\r\\nINV/1,100\\r\\nINV/2,250.5\\r\\n".encode("utf-8"))
    (d / "b.csv").write_text("invoice_no;amount\\nINV/3;75,5\\n", encoding="utf-8")
    (d / "c.csv").write_text(" invoice_no\\t amount \\nINV/4\\t40\\n\\n", encoding="utf-8")
    (d / "e.csv").write_text("invoice_no,amount\\n", encoding="utf-8")
    (d / "f.csv").write_text('invoice_no,supplier\\nINV/5,"Nandi, Pune"\\n', encoding="utf-8")
    (d / "g.csv").write_text("invoice_no|amount\\nINV/6|9\\n", encoding="utf-8")

    assert read_csv_rows(d / "a.csv") == [{"invoice_no": "INV/1", "amount": "100"}, {"invoice_no": "INV/2", "amount": "250.5"}], read_csv_rows(d / "a.csv")
    assert read_csv_rows(d / "b.csv") == [{"invoice_no": "INV/3", "amount": "75,5"}]
    assert read_csv_rows(d / "c.csv") == [{"invoice_no": "INV/4", "amount": "40"}]
    assert read_csv_rows(d / "e.csv") == []
    assert read_csv_rows(d / "f.csv") == [{"invoice_no": "INV/5", "supplier": "Nandi, Pune"}]
    assert read_csv_rows(d / "g.csv") == [{"invoice_no": "INV/6", "amount": "9"}]`,
      solution: `import csv

def read_csv_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        header = f.readline()
        delimiter = max(",;\\t|", key=header.count)
        f.seek(0)
        reader = csv.reader(f, delimiter=delimiter)
        names = [n.strip() for n in next(reader, [])]
        return [dict(zip(names, row)) for row in reader if row]
`,
      hint: 'Open with `encoding="utf-8-sig", newline=""`. Read the first line with `f.readline()` and pick the delimiter with `max(",;\\t|", key=header.count)` (the first character wins a tie, so a comma is the default). Then `f.seek(0)`, build `csv.reader(f, delimiter=delimiter)`, take the header with `next(reader, [])`, strip the names and `zip` them with each non-empty row.',
    } },
    { pychallenge: {
      id: 'python-files-ch3',
      prompt: 'Write `sort_into_folders(incoming, processed, failed, handler)`. For every `*.csv` file in `incoming` (in sorted name order; ignore other files) call `handler(path)`. If it returns normally, move the file into `processed`. If it raises any `Exception`, move the file into `failed` and write `<file name>.reason.txt` there that contains `str(error)`. Create the two target folders if they are missing. Return `{"processed": [names...], "failed": [names...]}` in processing order.',
      starter: `import shutil
from pathlib import Path

def sort_into_folders(incoming, processed, failed, handler):
    # TODO: loop over sorted(incoming.glob("*.csv")); try the handler; move to processed or failed
    return {"processed": [], "failed": []}
`,
      tests: `import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as d:
    root = Path(d)
    incoming, processed, failed = root / "in", root / "ok", root / "bad"
    incoming.mkdir()
    (incoming / "b.csv").write_text("2", encoding="utf-8")
    (incoming / "a.csv").write_text("1", encoding="utf-8")
    (incoming / "c.csv").write_text("x", encoding="utf-8")
    (incoming / "notes.txt").write_text("ignore", encoding="utf-8")
    seen = []

    def handler(path):
        seen.append(path.name)
        int(path.read_text(encoding="utf-8"))

    result = sort_into_folders(incoming, processed, failed, handler)
    assert result == {"processed": ["a.csv", "b.csv"], "failed": ["c.csv"]}, result
    assert seen == ["a.csv", "b.csv", "c.csv"], seen
    assert sorted(p.name for p in processed.iterdir()) == ["a.csv", "b.csv"]
    assert sorted(p.name for p in failed.iterdir()) == ["c.csv", "c.csv.reason.txt"]
    assert "invalid literal" in (failed / "c.csv.reason.txt").read_text(encoding="utf-8")
    assert sorted(p.name for p in incoming.iterdir()) == ["notes.txt"]
    assert sort_into_folders(incoming, processed, failed, handler) == {"processed": [], "failed": []}`,
      solution: `import shutil
from pathlib import Path

def sort_into_folders(incoming, processed, failed, handler):
    incoming, processed, failed = Path(incoming), Path(processed), Path(failed)
    processed.mkdir(parents=True, exist_ok=True)
    failed.mkdir(parents=True, exist_ok=True)
    result = {"processed": [], "failed": []}
    for path in sorted(incoming.glob("*.csv")):
        try:
            handler(path)
        except Exception as exc:
            shutil.move(str(path), str(failed / path.name))
            (failed / (path.name + ".reason.txt")).write_text(str(exc), encoding="utf-8")
            result["failed"].append(path.name)
        else:
            shutil.move(str(path), str(processed / path.name))
            result["processed"].append(path.name)
    return result
`,
      hint: 'Convert the three arguments with `Path(...)` and create both target folders with `mkdir(parents=True, exist_ok=True)`. Loop over `sorted(incoming.glob("*.csv"))`. Put `handler(path)` in `try`, move to `failed` and write the reason in `except Exception as exc`, and move to `processed` in the `else` branch.',
    } },
    { real: 'This is the shape of a real month-end drop-folder job: branch files arrive in `incoming/`, a scheduled script validates and loads them, writes the consolidated report atomically into `output/`, and moves each input to `processed/` or `failed/`. The person on the finance side only needs to look in `failed/` for the file and the `.reason.txt`. Later, ingestion tools such as dlt and Airflow sensors do the same thing with cloud storage instead of folders: list new objects, process each one, mark it done. The habits are identical: sorted listing, per-file error handling, write output first and only then mark the input as done.' },
    { interview: `**"How do you process a folder of files reliably?"**
Model answer: "I list the files in a sorted order with \`pathlib\`, process each one inside its own try block, write the output atomically, and then move the input to a \`processed\` folder, or to \`failed\` with a reason file. One bad file does not stop the others, and re-running the job does not process a file twice, because finished files have left the incoming folder."

**"What is an atomic write and why use it?"** "I write to a temporary file in the same folder and then rename it over the target with \`os.replace\`. The rename is one step, so readers see the complete old file or the complete new file, never a half-written one, and a crash leaves the old file intact."

**"A CSV from Excel has a strange first column name and a KeyError. What happened?"** "The file has a BOM, an invisible byte order mark. Reading it as \`utf-8\` keeps the mark in the first header name. I open it with \`utf-8-sig\`. I also pass \`newline=""\` for the csv module."

**"JSON or JSON Lines?"** "JSON for one nested document such as a config. JSON Lines for many records: I can append one line at a time, stream it line by line, and a corrupt line only loses that record."` },
    `## Recap
- Use **\`pathlib.Path\`**: join with \`/\`, take apart with \`.name .stem .suffix .parent\`, find with \`glob\` / \`rglob\` (wrap in \`sorted\`), create with \`mkdir(parents=True, exist_ok=True)\`. Avoid backslash strings.
- Always pass **\`encoding="utf-8"\`**; use **\`utf-8-sig\`** for Excel files (the BOM), \`cp1252\` for old Windows files. Open CSV with **\`newline=""\`**; every CSV value is text; use \`DictReader\` / \`DictWriter\`.
- **JSON** for nested documents (use \`default=str\` for dates and Decimals), **JSON Lines** for many records: append, stream, and lose only a bad line.
- Write outputs **atomically**: temp file in the same folder, then \`os.replace\`; delete the temp file on error. Never open inputs with \`"w"\`.
- Folder pipeline: sorted listing, try per file, output first, then move the input to \`processed/\` or \`failed/\` with a reason. \`shutil\` moves and copies, \`zipfile\` reads inside zips.`,
  ],
  quiz: [
    { q: 'Which line builds a path the right way for Windows, Mac and Linux?', o: ['`"C:\\fde" + "\\\\" + name`', '`"C:/fde" + "/" + name` and hope for the best', '`Path("C:/fde") / name`', '`name.join("C:/fde")`'], a: 2, why: 'A Path joins parts with `/` and hides the separator, so the same code works everywhere. Gluing strings is fragile and backslashes are escape characters in Python strings.' },
    { q: 'After reading a CSV from Excel, `row["invoice_no"]` raises `KeyError` although the header shows `invoice_no`. The most likely cause and fix?', o: ['the file has a BOM in the first header name: open it with `encoding="utf-8-sig"`', 'the file is too large: use `readlines()`', 'the delimiter is a tab: use `csv.writer`', 'the column name is a Python keyword'], a: 0, why: 'Excel\'s "CSV UTF-8" adds an invisible BOM. With plain utf-8 it stays in the first column name, which becomes "\\ufeffinvoice_no".' },
    { q: 'What makes `os.replace(tmp_path, final_path)` a good last step for writing a report?', o: ['it compresses the file', 'it copies the data twice to be safe', 'it checks the file for errors', 'it swaps the file in one step, so readers see the complete old file or the complete new one, never half'], a: 3, why: 'The rename is a single file-system operation. All the slow writing happened earlier into the temporary file, in the same folder.' },
    { q: 'Why is JSON Lines often better than one big JSON array for many records?', o: ['it uses less disk space in every case', 'it can store dates and Decimals without help', 'you can append one record with a single write and read the file line by line, and one bad line only loses that record', 'it is the only format Python can stream'], a: 2, why: 'One JSON object per line allows appending and streaming, and damage stays local. A big array must be read as a whole.' },
    { q: 'Why do you open CSV files with `newline=""`?', o: ['to make the file read-only', 'so the csv module handles line endings itself; otherwise Windows writes blank lines and quoted line breaks can break', 'to remove the header', 'to speed up reading'], a: 1, why: 'The csv module needs to see the raw line endings. Without newline="" you get extra blank rows on Windows and wrong handling of line breaks inside quoted values.' },
    { q: 'In the folder pipeline, when should an input file be moved to `processed/`?', o: ['after its output has been written safely', 'before reading it, so nobody else takes it', 'only at the end of the month', 'never: inputs stay in incoming/'], a: 0, why: 'If the output step fails, the input must still be in incoming/ so the next run can try again. Moving after success also stops files being processed twice.' },
  ],
  task: {
    title: 'A drop-folder job for monthly order files',
    steps: [
      'In `C:\\fde\\py-recap` create `files_practice.py`. It needs `orders.csv` (exported in the *Comprehensions and control flow* task).',
      'Split `orders.csv` into one file per month with `csv.DictReader` and `DictWriter`: `incoming/orders_2025-04.csv`, `incoming/orders_2025-05.csv` and so on (use the first 7 characters of `order_date`). Open every file with `newline=""` and `encoding="utf-8"`.',
      'Damage two files on purpose: delete the `amount` header name from one (rename the column to `amt`) and save another with a BOM (`encoding="utf-8-sig"`).',
      'Write the pipeline: a sorted `glob`, a `summarise(path)` that totals `amount` by `channel` and raises `ValueError` on a wrong header, the `try/except/else` loop, atomic writing of `output/totals.json`, and the move to `processed/` or `failed/` with a `.reason.txt`.',
      'Run it twice. The second run must find nothing to do. Check that `failed/` holds the damaged file and its reason, and that the BOM file was processed correctly.',
      'Add a zip step: `shutil.make_archive` or `zipfile` to pack `processed/` into `processed_2025-26.zip`, then read one CSV inside the zip without extracting it.',
    ],
    deliverable: '`files_practice.py`, the four folders after two runs (listing), `totals.json` and the reason file.',
  },
};
