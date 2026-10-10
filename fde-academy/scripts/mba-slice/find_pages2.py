import re, json, sys, os

base = sys.argv[1]
toc = json.load(open(os.path.join(base, "toc.json"), encoding="utf-8"))
first_pdf = {"afm": 8, "me": 8, "mm": 10, "pc": 8, "sfm": 8}

def norm(s):
    s = s.lower().replace("’", "'").replace("‘", "'").replace("–", "-").replace("—", "-")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return s.strip()

for b, mods in toc.items():
    text = open(os.path.join(base, b + ".txt"), encoding="utf-8").read()
    parts = re.split(r"\n=====PDFPAGE (\d+)=====\n", text)
    pg = {int(parts[i]): parts[i + 1] for i in range(1, len(parts), 2)}
    off = first_pdf[b] - 1
    # normalised line list per page
    plines = {n: [norm(x) for x in t.split("\n")] for n, t in pg.items() if n >= first_pdf[b]}
    pfull = {n: norm(t) for n, t in pg.items() if n >= first_pdf[b]}
    last = first_pdf[b]
    disagree = []
    for mi, m in enumerate(mods):
        for s in m["sections"]:
            for l in s["lessons"]:
                nt = norm(l["title"])
                key = nt[:22]
                numpat = re.compile(r"^\s*" + re.escape(l["no"]) + r"[\s\t]+(.*)$", re.M)
                num_page = None
                for n in range(last, max(pg) + 1):
                    mt = numpat.search(pg[n])
                    if mt:
                        num_page = n
                        num_title_ok = norm(mt.group(1))[:12] == nt[:12] or nt[:12] in norm(mt.group(1)) or norm(mt.group(1))[:12] in nt
                        break
                # title-only: a line that starts with the first words of the title, on/after `last`
                title_page = None
                for n in range(last, max(pg) + 1):
                    if any(ln.startswith(key) or (re.match(r"^\d+ \d+ \d+ ", ln) and ln.split(" ", 3)[3].startswith(key)) for ln in plines[n]):
                        title_page = n
                        break
                if num_page is not None and num_title_ok:
                    chosen = num_page
                    how = "num+title"
                elif title_page is not None:
                    chosen = title_page
                    how = "title"
                    disagree.append((l["no"], l["title"], "num_page", num_page, "title_page", title_page))
                else:
                    chosen = None
                    how = "none"
                    disagree.append((l["no"], l["title"], "num_page", num_page, "NO TITLE MATCH"))
                l["page"] = (chosen - off) if chosen else None
                l["how"] = how
                if chosen:
                    last = chosen
    print("=====", b, "disagreements:", len(disagree))
    for d in disagree:
        print("  ", d)
json.dump(toc, open(os.path.join(base, "toc_pages2.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
