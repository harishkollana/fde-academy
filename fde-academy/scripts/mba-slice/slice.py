import re, json, os, sys

base = sys.argv[1]
toc = json.load(open(os.path.join(base, "toc_pages2.json"), encoding="utf-8"))
RUN = {"accounting for managers", "managerial economics", "marketing management",
       "professional communication", "statistics for management"}


def norm(s):
    s = s.lower().replace("’", "'").replace("–", "-")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def clean_lines(raw):
    out = []
    for ln in raw.split("\n"):
        s = ln.strip().replace("\t", " ")
        if not s:
            continue
        if s.startswith("=====PDFPAGE"):
            out.append(s)
            continue
        low = s.lower()
        if low in RUN or low == "notes" or low.startswith("(c) amity") or re.fullmatch(r"\d{1,3}", s):
            continue
        if s == "●":
            out.append("- ")
            continue
        out.append(s)
    # glue a lone "- " to the next line
    res = []
    i = 0
    while i < len(out):
        if out[i] == "- " and i + 1 < len(out):
            res.append("- " + out[i + 1])
            i += 2
        else:
            res.append(out[i])
            i += 1
    return res


NUMLINE = re.compile(r"^[\d,.\s()₹$€£%+\-–=/`:*xX]+$")
CAP = 3600
END = re.compile(r"^(Summary|Glossary|Check Your Understanding.*|Exercise|Learning Activities)$", re.I)

for b in ["afm", "me", "mm", "pc", "sfm"]:
    raw = open(os.path.join(base, b + ".txt"), encoding="utf-8").read()
    # body starts at the first page that has "Learning Objectives"
    first_body = raw.index("Learning Objectives")
    lines = clean_lines(raw[first_body:])
    mods = toc[b]
    cursor = 0
    for mi, m in enumerate(mods):
        flat = [l for s in m["sections"] for l in s["lessons"]]
        starts = []
        for l in flat:
            no = l["no"]
            ntf = norm(l["title"])
            found = None
            # pass 1: the number as the book prints it, followed by (the start of) the same title
            for j in range(cursor, len(lines)):
                mt = re.match(r"^" + re.escape(no) + r"\s+(.*)$", lines[j])
                if mt:
                    nl = norm(mt.group(1))
                    if nl[:8] == ntf[:8] or ntf[:8] in nl:
                        found = j
                        break
            # pass 2 (the book's body numbers a few lessons differently): a heading line that starts with the title
            if found is None:
                key = ntf[:24]
                for j in range(cursor, len(lines)):
                    if lines[j].startswith("="):
                        continue
                    nb = norm(re.sub(r"^\d+(\.\d+)+\s+", "", lines[j]))
                    if len(key) >= 8 and nb.startswith(key) and len(lines[j]) < 140:
                        found = j
                        break
            if found is None:
                print("NOT FOUND", b, no, l["title"])
                found = starts[-1] if starts else cursor
            starts.append(found)
            cursor = found + 1
        # module end: first END marker after the last lesson start
        last = starts[-1]
        end = len(lines)
        for j in range(last + 1, len(lines)):
            if END.match(lines[j]):
                end = j
                break
        parts = []
        for k, l in enumerate(flat):
            a = starts[k]
            z = starts[k + 1] if k + 1 < len(starts) else end
            body = [x for x in lines[a:z] if not x.startswith("=====") and not NUMLINE.match(x)]
            text = "\n".join(body)
            text = re.sub(r"\n(?=[a-z,;(])", " ", text)  # re-join wrapped lines
            full = len(text)
            if full > CAP:
                text = text[:CAP] + f" [... {full - CAP} more chars cut]"
            parts.append(f"### {l['no']} {l['title']} [book p.{l['page']}] ({len(text)} chars)\n{text}\n")
        out = "\n".join(parts)
        fn = os.path.join(base, f"mod_{b}_{mi + 1}.txt")
        open(fn, "w", encoding="utf-8").write(out)
        print(b, mi + 1, "lessons", len(flat), "chars", len(out))
        nxt = len(lines)
        for j in range(end, len(lines)):
            if "Learning Objectives" in lines[j]:
                nxt = j
                break
        cursor = nxt
