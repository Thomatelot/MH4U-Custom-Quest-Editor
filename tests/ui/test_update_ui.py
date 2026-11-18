"""
Interface test of Settings > Updates, against a fake repository served by serve.py (/update-test/...).

    python tests/ui/serve.py <folder with quest1..quest5 and otomo1>      (in a first console)
    python tests/ui/test_update_ui.py [--chrome <path>]                   (in a second console)

The editor runs from a fake "MH4U Quest Editor.exe" (version 1.0.0) of the in-memory file system: the test
checks that a newer version is found with its release notes, downloaded, checked and put in place of the
running exe (the previous one kept as .exe.old), and that the latest version and errors are reported.
"""
import asyncio
import os
import sys

from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = "http://localhost:8765/index.html"
CHROME = sys.argv[sys.argv.index("--chrome") + 1] if "--chrome" in sys.argv else None
EXE = "/editor/MH4U Quest Editor.exe"

# runs after shim.js: the editor is "MH4U Quest Editor.exe" 1.0.0, and the repository is the fake one
SETUP = """
(function () {
  var x = new XMLHttpRequest();
  x.open('GET', '/update-test/1.0.0/MH4U%%20Quest%%20Editor.exe', false);
  x.overrideMimeType('text/plain; charset=x-user-defined');
  x.send();
  var s = x.responseText, u = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xff;
  window.__FS['%s'] = u;
  window.process.execPath = '%s';
  window.MH4U_UPDATE_BASE = localStorage.getItem('test_update_base') || '/update-test/2.0.0/';
})();
""" % (EXE, EXE)


async def main():
    res = []
    async with async_playwright() as p:
        opts = {"args": ["--no-sandbox"]}
        if CHROME:
            opts["executable_path"] = CHROME
        browser = await p.chromium.launch(**opts)
        page = await browser.new_page(viewport={"width": 1320, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        for f in ("pako.min.js", "shim.js"):
            with open(os.path.join(HERE, f), encoding="utf-8") as fh:
                await page.add_init_script(fh.read())
        await page.add_init_script(SETUP)
        ev = lambda js: page.evaluate("() => { var up = angular.element(document.body).injector().get('$updater'); " + js + " }")

        await page.goto(BASE + "#/settings")
        await page.wait_for_timeout(1800)
        res.append(("version shown", "v1.0.0" in await page.locator("#updates").inner_text(), ""))
        res.append(("this exe can update itself", await ev("return up.canSelfUpdate()"), ""))

        # a newer version: notes, download, swap
        await page.locator("#updates .button:has-text('Check for updates')").click()
        await page.wait_for_timeout(1200)
        txt = await page.locator("#updates").inner_text()
        res.append(("newer version found", "2.0.0" in txt and "Test release" in txt and "First public release" not in txt, txt[:200]))
        await page.screenshot(path="/tmp/upd1.png")
        await page.locator("#updates .button:has-text('Download and install')").click()
        await page.wait_for_timeout(1500)
        txt = await page.locator("#updates").inner_text()
        res.append(("installed message", "Update installed" in txt and "Restart now" in txt, txt[:200]))
        info = await ev("var fs = require('fs'); return [up._appInfo(fs.readFileSync('%s')).version, up._appInfo(fs.readFileSync('%s.old')).version, fs.existsSync('%s.new')]" % (EXE, EXE, EXE))
        res.append(("exe replaced, previous kept as .old", info == ["2.0.0", "1.0.0", False], info))
        await page.screenshot(path="/tmp/upd2.png")
        await ev("up.cleanup()")
        left = await ev("return require('fs').existsSync('%s.old')" % EXE)
        res.append(("previous exe removed at the next start", left is False, left))

        # the latest version already
        await page.evaluate("() => localStorage.setItem('test_update_base', '/update-test/1.0.0/')")
        await page.goto(BASE + "#/library")
        await page.wait_for_timeout(300)
        await page.goto(BASE + "#/settings")
        await page.wait_for_timeout(1200)
        await page.evaluate("() => { window.MH4U_UPDATE_BASE = '/update-test/1.0.0/'; }")
        await page.locator("#updates .button:has-text('Check for updates')").click()
        await page.wait_for_timeout(1000)
        res.append(("latest version", "You have the latest version" in await page.locator("#updates").inner_text(), ""))

        # a file that is not the editor is refused, nothing is replaced
        await page.evaluate("() => { window.MH4U_UPDATE_BASE = '/update-test/3.0.0/'; }")
        r = await page.evaluate("""() => new Promise(function (ok) {
          var inj = angular.element(document.body).injector(), up = inj.get('$updater'), fs = require('fs');
          var before = up._appInfo(fs.readFileSync('%s')).version;
          window.MH4U_UPDATE_BASE = '/update-test/3.0.0/wrong-';
          up.install('3.0.0', null, function (err) { ok([err ? err.message : null, before, up._appInfo(fs.readFileSync('%s')).version]); });
        })""" % (EXE, EXE))
        res.append(("missing file reported, exe kept", r[0] is not None and r[1] == r[2], r))
        r = await page.evaluate("""() => new Promise(function (ok) {
          var up = angular.element(document.body).injector().get('$updater'), fs = require('fs');
          window.MH4U_UPDATE_BASE = '/update-test/other-3.0.0/';
          up.install('3.0.0', null, function (err) { ok([err ? err.message : null, up._appInfo(fs.readFileSync('%s')).version]); });
        })""" % EXE)
        res.append(("a file that is not the editor is refused", r[0] is not None and "not the editor" in r[0] and r[1] == "2.0.0", r))
        r = await page.evaluate("""() => new Promise(function (ok) {
          var up = angular.element(document.body).injector().get('$updater');
          window.MH4U_UPDATE_BASE = '/update-test/4.0.0/';
          up.install('4.1.0', null, function (err) { ok(err ? err.message : null); });
        })""")
        res.append(("version mismatch refused", r is not None and "4.0.0" in r, r))

        # GitHub unreachable
        await page.evaluate("() => { window.MH4U_UPDATE_BASE = 'http://localhost:1/'; }")
        await page.locator("#updates .button:has-text('Check for updates')").click()
        await page.wait_for_timeout(1500)
        res.append(("error shown", "Could not get the update" in await page.locator("#updates").inner_text(), ""))
        await browser.close()
    bad = 0
    for name, ok, detail in res:
        print("OK " if ok else "BAD", name, detail if not ok else "")
        bad += 0 if ok else 1
    print("page errors:", errors)
    sys.exit(1 if bad or errors else 0)


asyncio.run(main())
