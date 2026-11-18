"""
Makes the release zip: the exe built from ./source, the NW.js runtime files and the documents.

    python tools/make_release.py [--runtime-dir <folder>] [--out <folder>]

Optional: the repository itself runs as it is (Download ZIP). This makes a smaller zip of the program
alone, for a GitHub release. The runtime folder (default: the root of the repository) must hold
"MH4U Quest Editor.exe" (or dasding's editor.exe) with nw.pak, icudtl.dat, d3dcompiler_47.dll,
libEGL.dll and libGLESv2.dll next to it. Writes
MH4U-Custom-Quest-Editor-v<version>-windows.zip (default: in ./dist). Python 3, standard library only.
"""
import argparse
import json
import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import build_exe  # noqa: E402

RUNTIME = ["nw.pak", "icudtl.dat", "d3dcompiler_47.dll", "libEGL.dll", "libGLESv2.dll"]
DOCS = ["README.md", "CHANGELOG.md", "LICENSE", "SECURITY.md", "THIRD_PARTY.md"]
EXE = "MH4U Quest Editor.exe"


def main():
    ap = argparse.ArgumentParser(description="Make the release zip")
    ap.add_argument("--runtime-dir", default=ROOT)
    ap.add_argument("--out", default=os.path.join(ROOT, "dist"))
    a = ap.parse_args()
    with open(os.path.join(ROOT, "source", "package.json"), encoding="utf-8") as f:
        version = json.load(f)["version"]
    stub = None
    for name in (EXE, "editor.exe"):
        if os.path.isfile(os.path.join(a.runtime_dir, name)):
            stub = os.path.join(a.runtime_dir, name)
            break
    if not stub:
        raise SystemExit("no exe in " + a.runtime_dir)
    missing = [f for f in RUNTIME if not os.path.isfile(os.path.join(a.runtime_dir, f))]
    if missing:
        raise SystemExit("missing runtime files: " + ", ".join(missing))
    with open(stub, "rb") as f:
        exe = build_exe.runtime_stub(f.read()) + build_exe.build_zip()
    os.makedirs(a.out, exist_ok=True)
    out = os.path.join(a.out, "MH4U-Custom-Quest-Editor-v%s-windows.zip" % version)
    top = "MH4U_Quest_Editor/"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(top + EXE, exe)
        for f in RUNTIME:
            z.write(os.path.join(a.runtime_dir, f), top + f)
        z.writestr(top + "locales/", b"")
        for f in DOCS:
            z.write(os.path.join(ROOT, f), top + f)
        for base, _, files in os.walk(os.path.join(ROOT, "docs")):
            for f in sorted(files):
                full = os.path.join(base, f)
                z.write(full, top + os.path.relpath(full, ROOT).replace(os.sep, "/"))
    print("written", out, os.path.getsize(out), "bytes")


if __name__ == "__main__":
    main()
