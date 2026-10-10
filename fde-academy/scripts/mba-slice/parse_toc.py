import re, json, sys, os

base = sys.argv[1]
SKIP = {
    "contents", "(c) amity university online", "page no", "page no.", "notes",
    "accounting for managers", "managerial economics", "marketing management",
    "professional communication", "statistics for management",
}
books = ["afm", "me", "mm", "pc", "sfm"]
out = {}
for b in books:
    text = open(os.path.join(base, b + ".txt"), encoding="utf-8").read()
    pages = re.split(r"\n=====PDFPAGE (\d+)=====\n", text)
    # pages = ['', '1', text1, '2', text2, ...]
    pg = {int(pages[i]): pages[i + 1] for i in range(1, len(pages), 2)}
    toc_pages = []
    for n in sorted(pg):
        if n < 3:
            continue
        if "Learning Objectives" in pg[n]:
            break
        toc_pages.append(n)
    lines = []
    for n in toc_pages:
        for ln in pg[n].split("\n"):
            s = ln.strip().replace("\t", " ")
            s = re.sub(r"\s+", " ", s)
            if not s or s.lower() in SKIP:
                continue
            lines.append(s)
    modules = []
    mod = sec = les = None
    state = None
    for s in lines:
        if re.match(r"^Module\b", s):
            mod = {"header": s, "sections": []}
            modules.append(mod)
            sec = les = None
            state = "header"
            continue
        m3 = re.match(r"^(\d+\.\d+\.\d+)\s+(.*)$", s)
        m2 = re.match(r"^(\d+\.\d+)\s+(.*)$", s)
        if m3:
            les = {"no": m3.group(1), "title": m3.group(2)}
            sec["lessons"].append(les)
            state = "lesson"
        elif m2:
            sec = {"no": m2.group(1), "title": m2.group(2), "lessons": []}
            mod["sections"].append(sec)
            les = None
            state = "section"
        elif state == "header":
            mod["header"] += " | " + s
        elif state == "lesson":
            les["title"] += " " + s
        elif state == "section":
            sec["title"] += " " + s
        else:
            print("ORPHAN", b, repr(s))
    out[b] = modules
json.dump(out, open(os.path.join(base, "toc.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
for b, mods in out.items():
    print("=====", b)
    for m in mods:
        n = sum(len(s["lessons"]) for s in m["sections"])
        print(" ", m["header"], "| sections", len(m["sections"]), "| lessons", n)
