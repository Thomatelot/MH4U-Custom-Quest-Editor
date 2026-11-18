/*
 * $citra - reads and writes the MH4U event quests stored by Citra
 * (extdata of the game: sdmc/Nintendo 3DS/<id>/<id>/extdata/00000000/<game>/user/quest1..5, otomo1)
 *
 * Replaces the proxy of the original editor: quests are written straight into
 * the game's downloaded-quest files, with automatic backups.
 */
! function() {
  var mod = angular.module("editor.utils.citra", ["editor.utils.config", "editor.utils.mib", "editor.utils.otb"]),
    fs = require("fs"),
    path = require("path"),
    core = window.MH4UCitraCore;

  var QUEST_PACKS = ["quest1", "quest2", "quest3", "quest4", "quest5"];
  var GAME_FILES = QUEST_PACKS.concat(["otomo1"]);
  var KNOWN_GAMES = {
    "00001261": "Monster Hunter 4 Ultimate (Europe)",
    "00001263": "Monster Hunter 4 Ultimate (USA)"
  };
  var EMULATOR_PROCESSES = ["citra-qt.exe", "citra.exe", "citra-room.exe", "lime3ds-gui.exe", "lime3ds.exe", "lime3ds-qt.exe",
    "azahar.exe", "azahar-qt.exe", "pabloMK2-citra.exe", "citra-nightly.exe", "citra-canary.exe"];

  function exists(p) {
    try { fs.statSync(p); return true; } catch (e) { return false; }
  }
  function isDir(p) {
    try { return fs.statSync(p).isDirectory(); } catch (e) { return false; }
  }
  function fileSize(p) {
    try { return fs.statSync(p).size; } catch (e) { return -1; }
  }
  function listDir(p) {
    try { return fs.readdirSync(p); } catch (e) { return []; }
  }
  function readU8(p) {
    return core.toU8(fs.readFileSync(p));
  }
  function toBuffer(u8) {
    var b = new Buffer(u8.length), i;
    for (i = 0; i < u8.length; i++) { b[i] = u8[i]; }
    return b;
  }
  function mkdirp(p) {
    if (isDir(p)) { return; }
    mkdirp(path.dirname(p));
    fs.mkdirSync(p);
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function stamp(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + "_" + pad2(d.getHours()) + "-" + pad2(d.getMinutes()) + "-" + pad2(d.getSeconds());
  }
  function sameBytes(a, b) {
    var i;
    if (a.length !== b.length) { return false; }
    for (i = 0; i < a.length; i++) { if (a[i] !== b[i]) { return false; } }
    return true;
  }
  // write through a temporary file so that a crash never leaves a half-written save file
  function safeWrite(p, u8) {
    var tmp = p + ".tmp-mh4uqe";
    fs.writeFileSync(tmp, toBuffer(u8));
    try {
      fs.renameSync(tmp, p);
    } catch (e) {
      fs.writeFileSync(p, toBuffer(u8));
      try { fs.unlinkSync(tmp); } catch (e2) {}
    }
  }

  function readIni(p) {
    var out = {};
    try {
      fs.readFileSync(p, "utf8").split(/\r?\n/).forEach(function(line) {
        var i = line.indexOf("=");
        if (i > 0 && line.charAt(0) !== "[" && line.charAt(0) !== ";") { out[line.substring(0, i).trim()] = line.substring(i + 1).trim(); }
      });
    } catch (e) {}
    return out;
  }
  function iniPath(v) {
    // Citra writes C:\\Users\\x\\AppData\\Roaming/Citra/sdmc/
    return v ? path.normalize(v.replace(/\\\\/g, "\\").replace(/^"|"$/g, "")) : "";
  }

  /* where can Citra (or a fork) keep its data? */
  function candidateUserDirs() {
    var list = [], appdata = process.env.APPDATA, home = process.env.USERPROFILE || process.env.HOME;
    if (appdata) {
      ["Citra", "citra-emu", "Lime3DS", "lime3ds-emu", "Azahar", "azahar-emu"].forEach(function(n) { list.push(path.join(appdata, n)); });
    }
    if (home) {
      [".local/share/citra-emu", ".local/share/lime3ds-emu", ".local/share/azahar-emu", "Library/Application Support/Citra"].forEach(function(n) { list.push(path.join(home, n)); });
    }
    // portable installs: "user" folder next to the emulator, or the editor placed next to it
    var here = path.dirname(process.execPath);
    list.push(path.join(here, "user"));
    list.push(path.join(path.dirname(here), "user"));
    return list;
  }

  /* given a folder chosen by the user, find the sdmc folder */
  function sdmcFromUserDir(dir) {
    var ini, custom, sd;
    if (!dir) { return null; }
    if (path.basename(dir).toLowerCase() === "sdmc" && isDir(dir)) { return dir; }
    if (isDir(path.join(dir, "Nintendo 3DS"))) { return dir; }      // an SD card root
    ini = readIni(path.join(dir, "config", "qt-config.ini"));
    custom = ini.use_custom_storage === "true" || ini.use_custom_storage === "1";
    sd = iniPath(ini.sdmc_directory);
    if (custom && sd && isDir(sd)) { return sd; }
    if (isDir(path.join(dir, "sdmc"))) { return path.join(dir, "sdmc"); }
    if (sd && isDir(sd)) { return sd; }
    return null;
  }

  /* all MH4U-like extdata folders below an sdmc folder */
  function findGames(sdmc) {
    var games = [], root = path.join(sdmc, "Nintendo 3DS");
    listDir(root).forEach(function(id0) {
      listDir(path.join(root, id0)).forEach(function(id1) {
        var ext = path.join(root, id0, id1, "extdata", "00000000");
        listDir(ext).forEach(function(gid) {
          var user = path.join(ext, gid, "user"), n = 0;
          QUEST_PACKS.forEach(function(q) { if (fileSize(path.join(user, q)) === core.QUEST_PACK.FILE_SIZE) { n++; } });
          if (n > 0) {
            games.push({
              extdataId: gid.toUpperCase(),
              label: KNOWN_GAMES[gid.toUpperCase()] || ("MH4U / MH4G (extdata " + gid.toUpperCase() + ")"),
              userPath: user,
              packCount: n
            });
          }
        });
      });
    });
    return games;
  }

  mod.factory("$citra", ["$config", "$mib", "$otb", "$injector", function($config, $mib, $otb, $injector) {
    var settings = $config.userSettings;
    var state = { loaded: false };

    function backupsRoot() {
      var custom = settings.get("citra_backup_dir");
      return custom || path.join(path.dirname(process.execPath), "Backups");
    }

    /* ---------------------------------------------------------- detection */
    function detect() {
      var tried = [], userDir = settings.get("citra_user_dir"), dirs, i, sd, games;
      dirs = userDir ? [userDir] : candidateUserDirs();
      for (i = 0; i < dirs.length; i++) {
        if (!dirs[i] || !isDir(dirs[i])) { continue; }
        // the game's extdata "user" folder itself (or a copy of it) was chosen
        if (fileSize(path.join(dirs[i], "quest1")) === core.QUEST_PACK.FILE_SIZE) {
          return { ok: true, userDir: dirs[i], sdmc: null, games: [{ extdataId: path.basename(path.dirname(dirs[i])).toUpperCase(),
            label: KNOWN_GAMES[path.basename(path.dirname(dirs[i])).toUpperCase()] || "MH4U quest files", userPath: dirs[i], packCount: 5 }] };
        }
        sd = sdmcFromUserDir(dirs[i]);
        tried.push(dirs[i]);
        if (!sd) { continue; }
        games = findGames(sd);
        if (games.length) { return { ok: true, userDir: dirs[i], sdmc: sd, games: games }; }
      }
      return { ok: false, tried: tried, manual: !!userDir };
    }

    function pickGame(det) {
      var wanted = settings.get("citra_extdata_id"), i;
      for (i = 0; i < det.games.length; i++) { if (det.games[i].extdataId === wanted) { return det.games[i]; } }
      for (i = 0; i < det.games.length; i++) { if (det.games[i].extdataId === "00001261" || det.games[i].extdataId === "00001263") { return det.games[i]; } }
      return det.games[0];
    }

    /* ---------------------------------------------------------- loading */
    function describeMib(mibStr) {
      try {
        return $mib.parse(mibStr);
      } catch (e) {
        return null;
      }
    }

    function load() {
      var det = detect(), game, packs = {}, errors = [], otomo = null;
      state = { loaded: true, ok: false, detection: det, packs: packs, otomo: null, errors: errors };
      if (!det.ok) {
        state.error = det.manual ? "NOT_FOUND_MANUAL" : "NOT_FOUND";
        return state;
      }
      game = pickGame(det);
      state.game = game;
      state.userPath = game.userPath;
      QUEST_PACKS.forEach(function(name) {
        var p = path.join(game.userPath, name), pack;
        if (!exists(p)) {
          packs[name] = { name: name, missing: true, slots: core.emptyQuestPack().slots, extra: core.emptyQuestPack().extra };
          return;
        }
        try {
          pack = core.decodeQuestPackFile(readU8(p));
          pack.name = name;
          if (!pack.checksumOk) { errors.push(name + ": checksum mismatch (file may be damaged)"); }
          pack.slots.forEach(function(s) {
            s.pack = name;
            if (!s.empty) {
              s.json = describeMib(s.mib);
              s.category = core.questCategory(s.questId);
            }
          });
          packs[name] = pack;
        } catch (e) {
          errors.push(name + ": " + e.message);
          packs[name] = { name: name, broken: true, error: e.message, slots: [] };
        }
      });
      if (exists(path.join(game.userPath, "otomo1"))) {
        try {
          otomo = core.decodeOtomoPackFile(readU8(path.join(game.userPath, "otomo1")));
          otomo.slots.forEach(function(s) {
            if (!s.empty) {
              try { s.json = $otb.parse(s.otb); } catch (e) { s.json = null; }
            }
          });
        } catch (e) {
          errors.push("otomo1: " + e.message);
        }
      }
      state.otomo = otomo;
      state.ok = true;
      return state;
    }

    function ensureLoaded() {
      if (!state.loaded) { load(); }
      return state;
    }

    /* ---------------------------------------------------------- queries */
    function allSlots() {
      var out = [];
      QUEST_PACKS.forEach(function(n) {
        var p = state.packs[n];
        if (p && p.slots) { p.slots.forEach(function(s) { out.push(s); }); }
      });
      return out;
    }

    function summary() {
      var s = { event: 0, challenge: 0, episodic: 0, free: { event: 0, challenge: 0, episodic: 0 } };
      if (!state.ok) { return s; }
      ["event", "challenge", "episodic"].forEach(function(cat) {
        core.CATEGORY_PACKS[cat].forEach(function(n) {
          var p = state.packs[n];
          if (!p || !p.slots || p.broken) { return; }
          p.slots.forEach(function(sl) {
            if (sl.empty) { s.free[cat]++; } else { s[cat]++; }
          });
        });
      });
      return s;
    }

    function findQuest(questId) {
      var r = null;
      allSlots().forEach(function(s) { if (!s.empty && s.questId === questId && !r) { r = s; } });
      return r;
    }

    function packOfSlot(slot) { return state.packs[slot.pack]; }
    function packCategory(name) {
      var c = null;
      Object.keys(core.CATEGORY_PACKS).forEach(function(k) { if (core.CATEGORY_PACKS[k].indexOf(name) >= 0) { c = k; } });
      return c;
    }

    /* mib that fits into a slot (re-written compactly when the stored one is too big) */
    function slotMib(mibStr) {
      var out = mibStr, json;
      if (out.length > core.QUEST_PACK.MIB_MAX) {
        json = $mib.parse(mibStr);
        out = $mib["export"](json);
      }
      if (out.length > core.QUEST_PACK.MIB_MAX) {
        throw new Error("quest data is " + out.length + " bytes, a slot holds at most " + core.QUEST_PACK.MIB_MAX);
      }
      return out;
    }

    /*
     * Plan the installation of a list of quests (mib strings). Nothing is written.
     * target can force a slot: { pack: "quest3", slot: 5 }
     */
    function gdSvc() { return $injector.has("$gamedata") ? $injector.get("$gamedata") : null; }
    // does this game slot hold an official quest (never replaced nor deleted)?
    function isProtected(slot) {
      var g = gdSvc();
      return !!(g && slot && !slot.empty && slot.json && g.isOfficialSlot(slot.questId, slot));
    }
    function plan(items) {
      var taken = {}, results = [];
      ensureLoaded();
      items.forEach(function(item) {
        var r = { item: item, ok: false }, mibStr, qid, cat, dst, existing, slots, i, cur, inJson;
        results.push(r);
        if (!state.ok) { r.error = "NO_GAME"; return; }
        try { mibStr = slotMib(item.mib); } catch (e) { r.error = "TOO_BIG"; r.detail = e.message; return; }
        qid = core.mibQuestId(core.toU8(mibStr));
        r.questId = qid;
        r.mib = mibStr;
        if (qid === 0) {
          // quest without id: take a free official id of the category (the target slot's when one is forced)
          var gd = $injector.has("$gamedata") ? $injector.get("$gamedata") : null, json, pick, usedIds = {};
          cat = item.target ? packCategory(item.target.pack) : "event";
          Object.keys(taken).forEach(function(k) { if (taken[k] !== true) { usedIds[taken[k]] = true; } });
          try { json = item.json || $mib.parse(mibStr); } catch (e) { json = null; }
          // no empty place left in the game for this category: only one of your own quests can be replaced
          var freePlaces = 0;
          if (!item.target) {
            core.CATEGORY_PACKS[cat].forEach(function(n) {
              var pk = state.packs[n];
              if (pk && pk.slots && !pk.broken) { pk.slots.forEach(function(sl) { if (sl.empty && !taken[sl.pack + ":" + sl.index]) { freePlaces++; } }); }
            });
          }
          pick = gd && json ? gd.autoId(json, function(q) {
            var sl = findQuest(q);
            // the slot that will be overwritten does not keep its id
            if (sl && item.target && sl.pack === item.target.pack && sl.index === item.target.slot) { return null; }
            return sl;
          }, usedIds, cat, { noFree: !item.target && freePlaces === 0 }) : null;
          if (!pick) { r.error = "NO_AUTO_ID"; r.detail = cat; return; }
          mibStr = core.setMibQuestId(mibStr, pick.id);
          qid = pick.id;
          r.questId = qid;
          r.mib = mibStr;
          r.autoId = pick;
        }
        cat = core.questCategory(qid);
        r.category = cat;
        if (!cat) { r.error = "BAD_ID"; return; }
        if (results.some(function(o) { return o !== r && o.ok && o.questId === qid; })) {
          r.error = "DUPLICATE_ID"; r.detail = String(qid); return;
        }
        if (item.target) {
          dst = { pack: item.target.pack, slot: item.target.slot };
          if (core.CATEGORY_PACKS[cat].indexOf(dst.pack) < 0) { r.error = "WRONG_PACK"; r.detail = cat; return; }
          existing = findQuest(qid);
          if (existing && !(existing.pack === dst.pack && existing.index === dst.slot)) {
            r.error = "DUPLICATE_ID"; r.detail = existing.pack + " #" + (existing.index + 1); return;
          }
        } else {
          // same id already in the game -> replace it, otherwise the first free slot of the category
          existing = findQuest(qid);
          if (existing) {
            dst = { pack: existing.pack, slot: existing.index };
          } else {
            slots = [];
            core.CATEGORY_PACKS[cat].forEach(function(n) {
              var p = state.packs[n];
              if (p && p.slots && !p.broken) { p.slots.forEach(function(s) { if (s.empty) { slots.push(s); } }); }
            });
            for (i = 0; i < slots.length; i++) {
              if (!taken[slots[i].pack + ":" + slots[i].index]) { dst = { pack: slots[i].pack, slot: slots[i].index }; break; }
            }
            if (!dst) { r.error = "NO_FREE_SLOT"; r.detail = cat; return; }
          }
        }
        if (taken[dst.pack + ":" + dst.slot]) { r.error = "SAME_TARGET"; return; }
        // official quests (MH4U wiki list) are never replaced, except by themselves
        cur = state.packs[dst.pack].slots[dst.slot];
        if (cur && !cur.empty && isProtected(cur)) {
          try { inJson = item.json || $mib.parse(mibStr); } catch (e) { inJson = null; }
          if (!inJson || !gdSvc() || !gdSvc().isOfficialCopy(angular.extend({}, inJson, { quest_id: qid }))) {
            r.error = "PROTECTED"; r.replaces = cur; return;
          }
        }
        taken[dst.pack + ":" + dst.slot] = qid;
        r.pack = dst.pack;
        r.slot = dst.slot;
        r.replaces = state.packs[dst.pack].slots[dst.slot];
        r.replace = r.replaces && !r.replaces.empty;
        r.ok = true;
      });
      return results;
    }

    /* ---------------------------------------------------------- backups */
    function listBackups() {
      var root = backupsRoot(), out = [];
      listDir(root).forEach(function(name) {
        var dir = path.join(root, name), info = {};
        if (!isDir(dir)) { return; }
        try { info = JSON.parse(fs.readFileSync(path.join(dir, "backup.json"), "utf8")); } catch (e) {}
        out.push({ name: name, dir: dir, created: info.created || name, reason: info.reason || "", source: info.source || "",
          files: listDir(dir).filter(function(f) { return GAME_FILES.indexOf(f) >= 0; }) });
      });
      out.sort(function(a, b) { return a.name < b.name ? 1 : -1; });
      return out;
    }

    function latestBackupMatches(src) {
      var b = listBackups()[0];
      if (!b) { return false; }
      return GAME_FILES.every(function(f) {
        var cur = path.join(src, f), old = path.join(b.dir, f);
        if (!exists(cur)) { return !exists(old); }
        if (!exists(old)) { return false; }
        return sameBytes(readU8(cur), readU8(old));
      });
    }

    /* copies the game's quest files; returns the backup name (or the latest one if nothing changed) */
    function backup(reason, force) {
      var src, name, dir, n = 0;
      ensureLoaded();
      if (!state.ok) { throw new Error("Citra save data not found"); }
      src = state.userPath;
      if (!force && latestBackupMatches(src)) { return listBackups()[0].name; }
      name = stamp() + (reason ? "_" + reason.replace(/[^A-Za-z0-9_-]+/g, "-").substring(0, 40) : "");
      dir = path.join(backupsRoot(), name);
      mkdirp(dir);
      GAME_FILES.forEach(function(f) {
        var p = path.join(src, f);
        if (exists(p)) { fs.writeFileSync(path.join(dir, f), fs.readFileSync(p)); n++; }
      });
      fs.writeFileSync(path.join(dir, "backup.json"), JSON.stringify({
        created: new Date().toString(), reason: reason || "", source: src, game: state.game && state.game.label, files: n
      }, null, 2));
      return name;
    }

    function restore(name) {
      var dir = path.join(backupsRoot(), name), safety;
      ensureLoaded();
      if (!state.ok) { throw new Error("Citra save data not found"); }
      safety = backup("before-restore");
      GAME_FILES.forEach(function(f) {
        var p = path.join(dir, f);
        if (exists(p)) { safeWrite(path.join(state.userPath, f), readU8(p)); }
      });
      load();
      return safety;
    }

    /* ---------------------------------------------------------- writing */
    function writePacks(names, reason) {
      var b = null;
      if (settings.get("citra_auto_backup") !== false) { b = backup(reason || "auto"); }
      names.forEach(function(n) {
        var p = state.packs[n];
        safeWrite(path.join(state.userPath, n), core.encodeQuestPackFile(p));
      });
      return b;
    }

    /* apply a plan (from plan()) */
    function apply(results, reason) {
      var touched = {}, names = [], b;
      results.forEach(function(r) {
        if (!r.ok) { return; }
        var p = state.packs[r.pack];
        p.slots[r.slot] = { index: r.slot, empty: false, pack: r.pack, questId: r.questId, mib: r.mib, name: core.questFileName(r.questId) };
        touched[r.pack] = true;
      });
      Object.keys(touched).forEach(function(n) { names.push(n); });
      if (!names.length) { return { written: [], backup: null }; }
      try {
        b = writePacks(names, reason || "install");
      } finally {
        load();                     // on an error too: the list must show what is really in the files
      }
      return { written: names, backup: b };
    }

    var PROTECTED_MSG = "This place holds an official quest: it is never deleted or replaced.";

    /* ---------------------------------------------------------- original (official) quests kept in the backups */
    var bkCache = {};
    function readBackupPacks(b) {
      var out = [];
      QUEST_PACKS.forEach(function(n) {
        var p = path.join(b.dir, n), pack;
        if (!exists(p)) { return; }
        try { pack = core.decodeQuestPackFile(readU8(p)); } catch (e) { return; }
        pack.slots.forEach(function(sl) {
          if (sl.empty) { return; }
          sl.pack = n;
          sl.json = describeMib(sl.mib);
          sl.category = core.questCategory(sl.questId);
          out.push(sl);
        });
      });
      return out;
    }
    /* index.json of a backup: one line per quest (place, ID, official or not, title), so that the
       In-game page does not have to decrypt every backup each time it opens */
    var INDEX_VERSION = 1, idxCache = {};
    function indexOfSlots(slots) {
      var g = gdSvc();
      if (!g) { return null; }
      return { v: INDEX_VERSION, quests: slots.filter(function(sl) { return !sl.empty; }).map(function(sl) {
        var off = !!(sl.json && g.G.official_event_quests[sl.questId] && g.isOfficialSlot(sl.questId, sl));
        return { p: sl.pack, i: sl.index, id: sl.questId, off: off,
          t: off && sl.json.text && sl.json.text[0] ? sl.json.text[0][0] : "" };
      }) };
    }
    function writeIndex(dir, idx) {
      if (idx) { fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(idx)); }
    }
    function backupIndex(b) {
      var idx = idxCache[b.name];
      if (idx) { return idx; }
      try { idx = JSON.parse(fs.readFileSync(path.join(b.dir, "index.json"), "utf8")); } catch (e) { idx = null; }
      if (!idx || idx.v !== INDEX_VERSION || !idx.quests) {
        idx = indexOfSlots(backupQuests(b.name)) || { v: 0, quests: [] };
        delete bkCache[b.name];               // keep only the small index in memory
        try { writeIndex(b.dir, idx.v ? idx : null); } catch (e) {}      // read-only folder: computed again next time
      }
      idxCache[b.name] = idx;
      return idx;
    }
    // every quest of a backup (decoded once: a backup never changes)
    function backupQuests(name) {
      var b = listBackups().filter(function(x) { return x.name === name; })[0];
      if (!b) { return []; }
      if (!bkCache[name]) { bkCache[name] = readBackupPacks(b); }
      return bkCache[name];
    }
    // "pack:index" -> { slot, backup }: the official quest that the backups hold for a place of the game
    // (not when its id already lives in another place of the game)
    function isOfficialBackupSlot(sl) { var g = gdSvc(); return !!(g && sl.json && g.G.official_event_quests[sl.questId] && g.isOfficialSlot(sl.questId, sl)); }
    function originals() {
      var map = {}, bs = listBackups();
      ensureLoaded();
      if (!state.ok) { return map; }
      bs.slice().reverse().forEach(function(b) {   // oldest backup first: closest to the untouched game
        backupIndex(b).quests.forEach(function(q) {
          var k = q.p + ":" + q.i, cur;
          if (!q.off || map[k]) { return; }
          cur = findQuest(q.id);
          if (cur && !(cur.pack === q.p && cur.index === q.i)) { return; }
          map[k] = { backup: b.name, pack: q.p, index: q.i, questId: q.id, title: q.t };
        });
      });
      return map;
    }
    // the quest data of an original, read from its backup only when it is put back
    function originalSlot(o) {
      return backupQuests(o.backup).filter(function(sl) { return sl.pack === o.pack && sl.index === o.index; })[0] || null;
    }
    // the ID of a slot that gets emptied is remembered, so the list can still show which ID the slot carries
    function lastIds() {
      try { return JSON.parse(localStorage.getItem("citra_last_ids")) || {}; } catch (e) { return {}; }
    }
    function rememberId(packName, index, slot) {
      var m;
      if (!slot || slot.empty || !slot.questId) { return; }
      m = lastIds(); m[packName + ":" + index] = slot.questId;
      try { localStorage.setItem("citra_last_ids", JSON.stringify(m)); } catch (e) {}
    }
    // last resort for slots emptied before IDs were remembered: the newest backup that still holds a quest there
    var bkIdCache = {};
    function backupLastId(packName, index) {
      var k = packName + ":" + index, bs, i, j, q;
      if (k in bkIdCache) { return bkIdCache[k]; }
      bs = listBackups();                       // newest first
      for (i = 0; i < bs.length; i++) {
        q = backupIndex(bs[i]).quests;
        for (j = 0; j < q.length; j++) { if (q[j].p === packName && q[j].i === index) { return (bkIdCache[k] = q[j].id); } }
      }
      return (bkIdCache[k] = null);
    }
    function rememberAll() {
      var m = lastIds(), changed = false;
      Object.keys(state.packs || {}).forEach(function(n) {
        var pk = state.packs[n];
        pk && pk.slots && pk.slots.forEach(function(sl) {
          if (!sl.empty && sl.questId && m[n + ":" + sl.index] !== sl.questId) { m[n + ":" + sl.index] = sl.questId; changed = true; }
        });
      });
      if (changed) { try { localStorage.setItem("citra_last_ids", JSON.stringify(m)); } catch (e) {} }
    }
    // empties a place; restore: put back the official quest that the backups hold for it, when there is one
    function clearSlot(packName, index, restore) {
      var p, o, b;
      ensureLoaded();
      p = state.packs[packName];
      if (isProtected(p.slots[index])) { throw new Error(PROTECTED_MSG); }
      rememberId(packName, index, p.slots[index]);
      o = restore ? originals()[packName + ":" + index] : null;
      o = o ? originalSlot(o) : null;
      p.slots[index] = o ? { index: index, empty: false, pack: packName, questId: o.questId, mib: o.mib, name: core.questFileName(o.questId) }
        : { index: index, empty: true, pack: packName, name: "", questId: null, mib: null };
      try {
        b = writePacks([packName], (o ? "restore-original-" : "clear-") + packName + "-" + (index + 1));
      } finally {
        load();
      }
      return b;
    }

    /* palicos (otomo1) */
    function writeOtomo(reason) {
      var b = null;
      if (settings.get("citra_auto_backup") !== false) { b = backup(reason || "palico"); }
      safeWrite(path.join(state.userPath, "otomo1"), core.encodeOtomoPackFile(state.otomo));
      load();
      return b;
    }
    function putPalico(index, otbStr, name) {
      ensureLoaded();
      if (!state.otomo) { throw new Error("otomo1 not found"); }
      var old = state.otomo.slots[index];
      state.otomo.slots[index] = { index: index, empty: false, dirty: true, otb: otbStr, name: (old && !old.empty && old.name) || name };
      try { return writeOtomo("palico-" + (index + 1)); } catch (e) { load(); throw e; }
    }
    function clearPalico(index) {
      ensureLoaded();
      if (!state.otomo) { throw new Error("otomo1 not found"); }
      state.otomo.slots[index] = { index: index, empty: true, dirty: true };
      try { return writeOtomo("clear-palico-" + (index + 1)); } catch (e) { load(); throw e; }
    }

    /* ---------------------------------------------------------- misc */
    function emulatorRunning(cb) {
      if (process.platform !== "win32") { return cb([]); }
      try {
        require("child_process").exec("tasklist /FO CSV /NH", { windowsHide: true }, function(err, out) {
          var found = [];
          if (err || !out) { return cb([]); }
          out.split(/\r?\n/).forEach(function(line) {
            var n = line.split('","')[0].replace(/^"/, "").toLowerCase();
            if (EMULATOR_PROCESSES.indexOf(n) >= 0 && found.indexOf(n) < 0) { found.push(n); }
          });
          cb(found);
        });
      } catch (e) {
        cb([]);
      }
    }

    function openFolder(p) {
      try {
        if (p && !exists(p)) { mkdirp(p); }
        require("nw.gui").Shell.openItem(p);
      } catch (e) {}
    }

    return {
      core: core,
      QUEST_PACKS: QUEST_PACKS,
      MIB_MAX: core.QUEST_PACK.MIB_MAX,
      load: load,
      state: function() { return ensureLoaded(); },
      reload: load,
      summary: summary,
      allSlots: allSlots,
      findQuest: findQuest,
      plan: plan,
      apply: apply,
      clearSlot: clearSlot,
      originals: originals,
      lastIds: lastIds,
      backupLastId: backupLastId,
      rememberAll: rememberAll,
      isOfficialBackupSlot: isOfficialBackupSlot,
      backupQuests: backupQuests,
      isProtected: isProtected,
      putPalico: putPalico,
      clearPalico: clearPalico,
      backup: backup,
      restore: restore,
      listBackups: listBackups,
      backupsRoot: backupsRoot,
      emulatorRunning: emulatorRunning,
      openFolder: openFolder,
      candidateUserDirs: candidateUserDirs,
      sdmcFromUserDir: sdmcFromUserDir,
      findGames: findGames,
      packOfSlot: packOfSlot
    };
  }]);
}();
