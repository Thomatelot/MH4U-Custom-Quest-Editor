"""
Serves the editor (../../source) to a normal browser for the UI tests and the screenshots.

    python tests/ui/serve.py <folder with quest1..quest5 and otomo1> [port]

shim.js (loaded first by the test scripts) stands in for NW.js: a small in-memory file system that
starts with the game files of the folder, placed where Citra keeps them. Nothing is written to disk.
"""
import http.server
import io
import json
import os
import socketserver
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.normpath(os.path.join(HERE, "..", "..", "source"))
FIX = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else None
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8765
USER = "/appdata/Citra/sdmc/Nintendo 3DS/" + "0" * 32 + "/" + "0" * 32 + "/extdata/00000000/00001261/user/"
GAME_FILES = ["quest1", "quest2", "quest3", "quest4", "quest5", "otomo1"]

# /update-test/<version>/... stands for the GitHub repository in the update test (test_update_ui.py):
# source/package.json, CHANGELOG.md and a small fake "MH4U Quest Editor.exe" of that version
def fake_exe(version, name="mh4u-quest-editor"):
    buf = io.BytesIO()
    buf.write(b"MZ" + b"\0" * 4094)
    with zipfile.ZipFile(buf, "a", zipfile.ZIP_DEFLATED) as z:
        z.writestr("package.json", json.dumps({"name": name, "version": version}))
        z.writestr("index.html", "<html></html>")
    return buf.getvalue()


def update_test(path):
    parts = path.split("/", 3)          # '', 'update-test', version, file
    if len(parts) < 4:
        return None
    version, f = parts[2], parts[3]
    if f == "source/package.json":
        return json.dumps({"name": "mh4u-quest-editor", "version": version}).encode()
    if f == "CHANGELOG.md":
        return ("# Changelog\n\n## %s\n\n* Test release.\n\n## 1.0.0\n\n* First public release.\n" % version).encode()
    if f in ("MH4U%20Quest%20Editor.exe", "MH4U Quest Editor.exe"):
        if version.startswith("other-"):             # a file that is not the editor
            return fake_exe(version[6:], "another-app")
        return fake_exe(version)
    return None


def listing():
    out = []
    if FIX:
        for f in GAME_FILES:
            if os.path.isfile(os.path.join(FIX, f)):
                out.append({"path": USER + f, "src": f})
    return json.dumps(out).encode()


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        data = update_test(path) if path.startswith("/update-test/") else None
        if path.startswith("/update-test/") and data is None:
            self.send_error(404)
            return
        if path == "/fixture/listing.json":
            data = listing()
        if data is not None:
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def translate_path(self, path):
        path = path.split("?")[0].split("#")[0]
        if path.startswith("/fixture/") and FIX:
            return os.path.join(FIX, os.path.basename(path))
        return os.path.join(APP, path.lstrip("/"))

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    print("serving", APP, "on http://localhost:%d/index.html" % PORT, "game files:", FIX or "(none)")
    Server(("127.0.0.1", PORT), Handler).serve_forever()
