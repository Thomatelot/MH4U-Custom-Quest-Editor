"""
Builds "MH4U Quest Editor.exe" from the readable sources in ./source

The editor is an NW.js application: the exe is the NW.js runtime with a zip of the application
appended to it (the way dasding built editor.exe). This script takes the runtime from an existing exe
(the one of a release, or dasding's editor.exe: whatever is appended to it is dropped) and appends a
fresh zip of ./source to it.

    python tools/build_exe.py --runtime "<release folder>/MH4U Quest Editor.exe" [--out <exe>]

Without --out the exe is written at the root of the repository. To run it, it needs the other files of
the runtime next to it (nw.pak, icudtl.dat, the dlls and the locales folder of a release).
Only the Python standard library is needed.
"""
import io
import os
import re
import struct
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "source")
EXE = os.path.join(ROOT, "MH4U Quest Editor.exe")
SKIP_DIRS = ("tests", ".git", "node_modules")


def runtime_stub(exe_bytes):
    """NW.js runtime = exe without the appended zip (found through its end-of-central-directory record)."""
    eocd = exe_bytes.rfind(b"PK\x05\x06", max(0, len(exe_bytes) - 0x10016))
    if eocd < 0 or eocd + 22 + struct.unpack_from("<H", exe_bytes, eocd + 20)[0] != len(exe_bytes):
        return exe_bytes          # no application appended (plain NW.js runtime)
    cd_size, cd_offset = struct.unpack_from("<II", exe_bytes, eocd + 12)
    zip_start = eocd - cd_size - cd_offset
    if zip_start <= 0 or exe_bytes[zip_start:zip_start + 4] != b"PK\x03\x04":
        raise SystemExit("Could not locate the application zip inside the exe")
    return exe_bytes[:zip_start]


def ascii_js(text):
    # old Chromium + file:// : keep scripts pure ASCII
    return re.sub(r"[^\x00-\x7f]", lambda m: "\\u%04x" % ord(m.group(0)), text)


def build_zip():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for base, dirs, files in os.walk(SRC):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for name in sorted(files):
                full = os.path.join(base, name)
                rel = os.path.relpath(full, SRC).replace(os.sep, "/")
                with open(full, "rb") as f:
                    data = f.read()
                if name.endswith(".js"):
                    data = ascii_js(data.decode("utf-8")).encode("ascii")
                z.writestr(rel, data)
    return buf.getvalue()


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Build MH4U Quest Editor.exe from ./source")
    ap.add_argument("--runtime", help="an exe holding the NW.js runtime (default: the --out exe if it exists)")
    ap.add_argument("--out", default=EXE, help="exe to write (default: %(default)s)")
    ap.add_argument("runtime_pos", nargs="?", help=argparse.SUPPRESS)       # old form: build_exe.py <exe>
    a = ap.parse_args()
    if not os.path.isfile(os.path.join(SRC, "package.json")):
        raise SystemExit("source/package.json not found")
    stub_path = a.runtime or a.runtime_pos or a.out
    if not os.path.isfile(stub_path):
        raise SystemExit("No runtime: pass --runtime with the exe of a release (or dasding's editor.exe)")
    with open(stub_path, "rb") as f:
        stub = runtime_stub(f.read())
    data = stub + build_zip()
    tmp = a.out + ".tmp"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, a.out)
    print("written", a.out, len(data), "bytes")


if __name__ == "__main__":
    main()
