import sys, os, pymupdf

src = r"D:\Ed\MBA\1st Sem"
out = sys.argv[1]
books = {
    "afm": "Accounting For Managers.pdf",
    "me": "Managerial Economics_R1 enc.pdf",
    "mm": "Marketing Management_ Final.pdf",
    "pc": "Professional Communication F.pdf",
    "sfm": "Statistics For Management_Final.pdf",
}
os.makedirs(out, exist_ok=True)
for key, name in books.items():
    doc = pymupdf.open(os.path.join(src, name))
    if doc.needs_pass:
        print(key, "NEEDS PASSWORD")
        continue
    chars = 0
    with open(os.path.join(out, key + ".txt"), "w", encoding="utf-8") as f:
        for i, page in enumerate(doc):
            t = page.get_text()
            chars += len(t)
            f.write(f"\n=====PDFPAGE {i + 1}=====\n{t}")
    print(key, len(doc), "pages", chars, "chars")
