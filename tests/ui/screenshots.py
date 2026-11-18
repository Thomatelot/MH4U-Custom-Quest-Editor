"""
Takes the screenshots of docs/images, and walks through the main features on the way
(it stops with an error if a screen does not show what it should).

    python tests/ui/serve.py <folder with quest1..quest5 and otomo1>      (in a first console)
    python tests/ui/screenshots.py [output folder] [--chrome <path>]       (in a second console)

Needs Python 3 with Playwright (pip install playwright) and Chrome or Chromium.
Use a save that holds only the game's own event quests (a backup made before your first custom
quest, for example), so that the pictures show nothing personal. The game files are never written:
the editor runs in the browser with an in-memory copy of them (see shim.js).
"""
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "docs", "images")
CHROME = None
args = sys.argv[1:]
if "--chrome" in args:
    i = args.index("--chrome")
    CHROME = args[i + 1]
    del args[i:i + 2]
if args:
    OUT = args[0]
OUT = os.path.abspath(OUT)
BASE = "http://localhost:8765/index.html"
W, H = 1320, 860

# the in-memory paths look like Linux paths: show them as on Windows in the pictures
NICE_PATHS = """
(function () {
  var user = '/appdata/Citra/sdmc/Nintendo 3DS/' + new Array(33).join('0') + '/' + new Array(33).join('0') + '/extdata/00000000/00001261/user';
  var rep = [[user, 'C:\\\\Users\\\\you\\\\AppData\\\\Roaming\\\\Citra\\\\sdmc\\\\Nintendo 3DS\\\\...\\\\extdata\\\\00000000\\\\00001261\\\\user'],
             ['/editor/Library_Backups', 'C:\\\\Games\\\\MH4U Quest Editor\\\\Library_Backups'],
             ['/editor/Backups', 'C:\\\\Games\\\\MH4U Quest Editor\\\\Backups'],
             ['/appdata/Citra', 'C:\\\\Users\\\\you\\\\AppData\\\\Roaming\\\\Citra']];
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while ((n = w.nextNode())) {
    rep.forEach(function (r) { if (n.nodeValue.indexOf(r[0]) >= 0) { n.nodeValue = n.nodeValue.split(r[0]).join(r[1]); } });
  }
})();
"""

EXAMPLES = [
    # (official quest copied as a starting point, new title, collection)
    ("Yian Kut-Ku", "Example: First Hunt", "Practice"),
    ("Gore Magala", "Example: Frenzy Rematch", "G rank ideas"),
    ("Diablos", "Example: Horns in the Sand", "G rank ideas"),
]


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        opts = {"args": ["--no-sandbox"]}
        if CHROME:
            opts["executable_path"] = CHROME
        browser = await p.chromium.launch(**opts)
        page = await browser.new_page(viewport={"width": W, "height": H})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        with open(os.path.join(HERE, "pako.min.js"), encoding="utf-8") as f:
            await page.add_init_script(f.read())
        with open(os.path.join(HERE, "shim.js"), encoding="utf-8") as f:
            await page.add_init_script(f.read())
        # Settings > Check for updates reads the fake copy of the repository of serve.py (same version: up to date)
        with open(os.path.join(HERE, "..", "..", "source", "package.json"), encoding="utf-8") as f:
            version = json.load(f)["version"]
        await page.add_init_script("window.MH4U_UPDATE_BASE = '/update-test/%s/';" % version)

        async def ev(js):
            return await page.evaluate("() => { var inj = angular.element(document.body).injector();"
                                       "var c = inj.get('$citra'), lib = inj.get('$library'), mib = inj.get('$mib'); " + js + " }")

        async def shot(name, clip=None):
            await page.evaluate(NICE_PATHS)
            await page.wait_for_timeout(150)
            path = os.path.join(OUT, name)
            await page.screenshot(path=path, clip=clip)
            print("saved", path)

        async def go(hash_, wait=1200):
            await page.goto(BASE + hash_)
            await page.wait_for_timeout(wait)

        await go("", 1500)
        await page.evaluate("angular.reloadWithDebugInfo()")
        await page.wait_for_timeout(1500)

        # ------------------------------------------------------------ example quests in the library
        await go("#/game")
        made = await ev("""
          var ex = %s, out = [], st = c.reload(), cols = {};
          ex.forEach(function (e) {
            var hit = null;
            ['quest1', 'quest2', 'quest3'].forEach(function (n) {
              st.packs[n].slots.forEach(function (sl) {
                if (hit || sl.empty || !sl.json) return;
                var mons = []; sl.json.large_monster_table.forEach(function (w) { w.forEach(function (m) { mons.push(m.monster_id); }); });
                var names = mons.map(function (id) { return inj.get('constants').monsters[id]; });
                if (names.length === 1 && names[0] === e[0]) hit = sl;
              });
            });
            if (!hit) { out.push('no quest with ' + e[0]); return; }
            var j = mib.parse(hit.mib);
            j.quest_id = 0;
            j.text.forEach(function (t) { t[0] = e[1]; });
            if (!cols[e[2]]) cols[e[2]] = lib.findCollectionByName(e[2]) || lib.addCollection(e[2], e[2] === 'Practice' ? 'green' : 'purple');
            lib.insertInto = cols[e[2]].id;
            lib.insert(mib['export'](j));
            lib.insertInto = null;
            out.push(e[1]);
          });
          return out;""" % repr(EXAMPLES).replace("(", "[").replace(")", "]"))
        print("library examples:", made)
        assert all(m.startswith("Example") for m in made), made

        # two of them go to the game (Auto ID -> free places)
        sent = await ev("""
          var items = lib.list().slice(0, 2).map(function (q) { return { mib: lib.get(q.uuid).mib, json: q.json, uuid: q.uuid }; });
          var plan = c.plan(items), r = c.apply(plan, 'install');
          plan.forEach(function (p) { if (p.ok && p.autoId) { lib.update(p.item.uuid, c.core.setMibQuestId(lib.get(p.item.uuid).mib, p.questId)); } });
          return plan.map(function (p) { return [p.ok, p.questId, p.pack, p.slot]; });""")
        print("installed:", sent)
        assert all(s[0] for s in sent), sent

        # an official quest that disappeared from the game (as after an old tool or a bad copy):
        # the backups still hold it, so the list offers to put it back, and the place keeps its ID
        await ev("""var st = c.state(), pk = st.packs.quest1, fs = require('fs');
          pk.slots[2] = { index: 2, empty: true, pack: 'quest1', name: '', questId: null, mib: null };
          fs.writeFileSync(st.userPath + '/quest1', c.core.encodeQuestPackFile(pk)); c.reload();""")

        # ------------------------------------------------------------ In-game quests
        await go("#/game/event")
        assert await page.locator("tbody tr", has_text="quest1 #3").locator(".button:has-text('Original quest')").count() == 1, "original quest"
        await shot("home.png")
        await page.locator("tbody tr", has_text="quest1 #3").locator(".button:has-text('Original quest')").click()
        await page.wait_for_timeout(800)
        await shot("original-quest.png")
        await page.locator(".modal.visible .button:has-text('Cancel')").first.click()
        await page.wait_for_timeout(800)
        await go("#/game/backups")
        assert await page.locator("tbody tr .button:has-text('Restore')").count() >= 1, "backups listed"

        # ------------------------------------------------------------ library
        await go("#/library")
        await shot("library.png")
        # sending quests: the confirmation says where each one goes
        await page.locator("tbody tr", has_text="Horns in the Sand").locator("input[type=checkbox]").first.check(force=True)
        await page.locator(".button:has-text('Send selected to game')").first.click()
        await page.wait_for_timeout(900)
        assert await page.locator(".modal.visible").count() >= 1, "install window"
        await shot("install.png")
        await page.locator(".modal.visible .button:has-text('Cancel')").first.click()
        await page.wait_for_timeout(800)
        await go("#/library")
        await page.locator(".button:has-text('Backup library')").first.click()
        await page.wait_for_timeout(400)
        await page.locator(".button:has-text('Restore library')").first.click()
        await page.wait_for_timeout(900)
        assert await page.locator("#libRestoreModal tbody tr").count() >= 1, "library backups listed"
        await shot("library-restore.png")
        await page.evaluate("() => $('.ui.modal').modal('hide')")
        await page.wait_for_timeout(800)

        # ------------------------------------------------------------ editor
        SC = "angular.element(document.querySelector('#general')).scope()"

        async def sc(js):
            return await page.evaluate("() => { var sc = " + SC + "; var r = (function () { " + js + " })(); sc.$apply(); return r; }")

        await go("#/library")
        await page.locator("tbody tr", has_text="Horns in the Sand").locator(".button:has-text('Edit')").first.click()
        await page.wait_for_timeout(3000)
        await shot("editor-general.png")
        # common values of the official quests, behind the "?"
        await page.locator(".cv-help").first.click()
        await page.wait_for_timeout(300)
        assert await page.locator("text=Common in official quests").count() >= 1, "common values"
        await page.locator(".cv-help").first.click()
        # ID picker
        await sc("sc.open_id_picker();")
        await page.wait_for_timeout(700)
        assert await page.locator("#idpickermodal").is_visible(), "ID picker"
        await shot("id-picker.png")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)
        # monsters
        await page.click("a.item[data-tab=monster]")
        await page.wait_for_timeout(600)
        await sc("sc.edit_monster(0, 0);")
        await page.wait_for_timeout(800)
        await shot("monster-stats.png")
        await page.locator(".modal.visible .button:has-text('Cancel')").first.click()
        await page.wait_for_timeout(800)
        # supply box auto-fill
        await page.click("a.item[data-tab=supply]")
        await page.wait_for_timeout(500)
        await sc("sc.open_supplyfill();")
        await page.wait_for_timeout(800)
        assert await page.locator("#supplyfillmodal").is_visible(), "supply fill"
        await shot("supply-autofill.png")
        await page.locator("#supplyfillmodal .green.button:has-text('Apply')").click()
        await page.wait_for_timeout(500)
        # rewards auto-fill
        await page.click("a.item[data-tab=rewards]")
        await page.wait_for_timeout(500)
        await sc("sc.open_rewardfill();")
        await page.wait_for_timeout(800)
        await shot("rewards-autofill.png")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)
        # the quest check: a refill pointing to a supply box that does not exist
        await sc("sc.quest.refills[0].box = sc.quest.supplies.length; sc.quest.refills[0].condition = 3;")
        await page.wait_for_timeout(400)
        assert await page.locator(".xt-chk").count() == 1, "check badge"
        await sc("sc.open_checks();")
        await page.wait_for_timeout(600)
        await shot("quest-check.png")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # ------------------------------------------------------------ guide and French
        await go("#/guide/stats", 2500)
        await shot("guide.png")
        # French interface (the setting reloads the page: the in-memory game files start again from the folder)
        await go("#/library")
        await page.evaluate("() => { angular.element(document.body).injector().get('$i18n').select_locale('fr'); }")
        await page.wait_for_timeout(1500)
        await go("#/game/event", 1500)
        await shot("french.png")
        await page.evaluate("() => { angular.element(document.body).injector().get('$i18n').select_locale('en'); }")
        await page.wait_for_timeout(1000)

        # Settings > Updates
        await go("#/settings", 1500)
        await page.locator("#updates .button:has-text('Check for updates')").click()
        await page.wait_for_timeout(1000)
        assert "latest version" in await page.locator("#updates").inner_text(), "update check"
        box = await page.locator("#updates").bounding_box()
        await shot("update.png", {"x": box["x"] - 12, "y": box["y"] - 12, "width": box["width"] + 24, "height": box["height"] + 24})

        print("page errors:", errors)
        await browser.close()


asyncio.run(main())
