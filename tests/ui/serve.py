"""
Serves the editor (../../source) to a normal browser for the UI tests and the screenshots.

    python tests/ui/serve.py <folder with quest1..quest5 and otomo1> [port]

shim.js (loaded first by the test scripts) stands in for NW.js: a small in-memory file system that
starts with the game files of the folder, placed where Citra keeps them. Nothing is written to disk.
"""
import http.server
import json
import os
import socketserver
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.normpath(os.path.join(HERE, "..", "..", "source"))
FIX = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else None
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8765
USER = "/appdata/Citra/sdmc/Nintendo 3DS/" + "0" * 32 + "/" + "0" * 32 + "/extdata/00000000/00001261/user/"
GAME_FILES = ["quest1", "quest2", "quest3", "quest4", "quest5", "otomo1"]


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
        if path == "/fixture/listing.json":
            data = listing()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
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
