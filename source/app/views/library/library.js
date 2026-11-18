/* Library view - quest & palico library, exports, and (new) sending quests into the game through Citra */
! function() {
  var mod = angular.module("editor.views.library", ["ngRoute", "editor.utils.library", "editor.utils.citra", "editor.utils.config", "editor.utils.eastereggs"]),
    fs = require("fs");

  mod.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when("/library/:palico?", {
      controller: "LibraryController",
      templateUrl: "app/views/library/library.html"
    });
  }]);

  mod.controller("LibraryController", ["$scope", "$timeout", "$filter", "$library", "$mib", "$otb", "$citra", "$config", "$i18n", "constants", "$routeParams", "$eastereggs", "$gamedata",
    function($scope, $timeout, $filter, $library, $mib, $otb, $citra, $config, $i18n, constants, $routeParams, $eastereggs, $gamedata) {
    var s = $scope;
    s.i18n = $i18n;
    s.eastereggs = $eastereggs;
    s._ = $i18n.get;
    s.constants = constants;
    s._EDIT = $i18n.get("EDIT");
    s._EXPORT = $i18n.get("EXPORT");
    s._DELETE = $i18n.get("DELETE");
    s._COPY = $i18n.get("DUPLICATE");
    s.palico_tab = $routeParams.palico;
    s.library = $library;
    s.list = $library.list();
    s.palico_list = $library.list_otb();
    s.export_local = "none";
    s.exportselected_local = "none";
    s.MIB_MAX = $citra.MIB_MAX;

    /* ------------------------------------------------------------ Citra */
    s.refresh_citra = function(reload) {
      var st = reload ? $citra.reload() : $citra.state();
      s.citra = {
        ok: st.ok,
        error: st.error,
        game: st.game,
        userPath: st.userPath,
        errors: st.errors,
        tried: st.detection && st.detection.tried,
        summary: $citra.summary()
      };
    };
    s.refresh_citra(true);

    s.in_game = function(quest) {
      if (!s.citra.ok) { return null; }
      return $citra.findQuest(quest.json.quest_id);
    };
    s.mib_size = function(quest) {
      var q = $library.get(quest.uuid);
      return q && q.mib ? q.mib.length : 0;
    };

    // restricted official ids only work with their original monsters
    s.restriction_warning = function(json) {
      var r = constants.quest_restrictions[json.quest_id], used = [], bad = [];
      if (!r || typeof r === "string" || !r.length) { return null; }
      json.large_monster_table.forEach(function(wave) {
        wave.forEach(function(m) { used.push(m.monster_id); });
      });
      used.forEach(function(id) { if (r.indexOf(id) < 0 && bad.indexOf(id) < 0) { bad.push(id); } });
      if (!bad.length) { return null; }
      return r.map(function(id) { return $i18n.getFilter(constants.monsters[id]); }).join(", ");
    };

    function showPlan(items) {
      var res = $citra.plan(items);
      res.forEach(function(r) {
        var json = r.ok ? $mib.parse(r.mib) : (r.item.json || null);
        r.title = json && json.text && json.text[s.text_idx] ? json.text[s.text_idx][0] : "";
        r.restriction = json ? s.restriction_warning(json) : null;
        r.checks = json ? $gamedata.checkQuestText(json, s._) : [];
        if (r.replace && r.replaces.json) { r.replacesTitle = r.replaces.json.text[s.text_idx][0]; }
      });
      s.install_plan = res;
      s.install_ok_count = res.filter(function(r) { return r.ok; }).length;
      s.install_running = [];
      $citra.emulatorRunning(function(list) {
        s.install_running = list;
        s.$evalAsync();
      });
      $("#installmodal").modal({ closable: false, observeChanges: true }).modal("show");
    }

    // quests saved without id (0) got one when installed: keep it in the library
    function storeAutoIds(plan) {
      plan.forEach(function(r) {
        var e, m;
        if (!r.ok || !r.autoId || !r.item.uuid) { return; }
        e = $library.get(r.item.uuid);
        m = e && $citra.core.setMibQuestId(e.mib, r.questId);
        if (m) { $library.update(r.item.uuid, m); }
      });
      s.refresh_list();
    }
    s.storeAutoIds = storeAutoIds;

    s.send_to_game = function(quest) {
      s.refresh_citra(true);
      if (!s.citra.ok) { return $("#citraNotFound").modal("show"); }
      showPlan([{ mib: $library.get(quest.uuid).mib, json: quest.json, uuid: quest.uuid }]);
    };

    s.send_selected = function() {
      var items = [];
      s.refresh_citra(true);
      if (!s.citra.ok) { return $("#citraNotFound").modal("show"); }
      s.list.forEach(function(q) {
        if (q.hosted) { items.push({ mib: $library.get(q.uuid).mib, json: q.json, uuid: q.uuid }); }
      });
      if (!items.length) { return $("#nohosted").modal("show"); }
      showPlan(items);
    };

    s.confirm_install = function() {
      var result;
      try {
        result = $citra.apply(s.install_plan, "before-install");
        storeAutoIds(s.install_plan);
        s.last_result = { ok: true, written: result.written, backup: result.backup, count: s.install_ok_count };
      } catch (e) {
        s.last_result = { ok: false, error: e.message };
      }
      $("#installmodal").modal("hide");
      s.refresh_citra(false);
      $timeout(function() { $("#installresult").modal("show"); }, 400);
    };

    /* ------------------------------------------------------------ library backups (game backups live in the In-game quests view) */
    var path = require("path"), zlib = require("zlib"), LIB_KEEP = 30;
    function libDir() { return path.join(path.dirname($citra.backupsRoot()), "Library_Backups"); }
    function stamp() {
      var d = new Date(), p = function(n) { return (n < 10 ? "0" : "") + n; };
      return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    }
    function mkdirs(d) {
      if (fs.existsSync(d)) { return; }
      mkdirs(path.dirname(d));
      fs.mkdirSync(d);
    }
    function libFiles() {
      var dir = libDir(), out = [];
      try {
        fs.readdirSync(dir).forEach(function(f) { if (/\.cmib$/.test(f)) { out.push(f); } });
      } catch (e) {}
      out.sort().reverse();
      return out;
    }
    function countQuests(data) {
      try {
        var arr = JSON.parse(zlib.inflateSync(Buffer(data.substring(4), "binary"))), n = 0;
        arr.forEach(function(x) { if (!(x && typeof x === "object" && x.collection)) { n++; } });
        return n;
      } catch (e) { return -1; }
    }
    // writes a snapshot of the whole library into the Library_Backups folder; returns its name (null if the library is empty)
    function libSnapshot(reason) {
      var dir = libDir(), name, files;
      if (!$library.list().length) { return null; }
      mkdirs(dir);
      name = stamp() + "_" + reason + ".cmib";
      fs.writeFileSync(path.join(dir, name), $library.backup(), { encoding: "binary" });
      files = libFiles();
      files.slice(LIB_KEEP).forEach(function(f) { try { fs.unlinkSync(path.join(dir, f)); } catch (e) {} });
      return name;
    }
    function libFlash(kind, text) { s.lib_flash = { kind: kind, text: text }; }
    s.lib_dir = libDir();
    s.lib_backup_now = function() {
      try {
        var n = libSnapshot("manual");
        if (n) { libFlash("green", s._("LIBRARY_BACKUP_DONE") + " " + n); } else { libFlash("red", s._("LIBRARY_EMPTY")); }
      } catch (e) { libFlash("red", e.message); }
    };
    s.open_lib_restore = function() {
      s.lib_confirm = null;
      s.lib_dir = libDir();
      s.lib_backups = libFiles().map(function(f) {
        var m = /^(\d{4})(\d\d)(\d\d)-(\d\d)(\d\d)(\d\d)_(.*)\.cmib$/.exec(f), data = "", cnt = -1;
        try { data = fs.readFileSync(path.join(libDir(), f), { encoding: "binary" }); cnt = countQuests(data); } catch (e) {}
        return { name: f, count: cnt, reason: m ? m[7] : "",
          created: m ? m[1] + "-" + m[2] + "-" + m[3] + " " + m[4] + ":" + m[5] + ":" + m[6] : f };
      });
      $("#libRestoreModal").modal({ closable: true, observeChanges: true }).modal("show");
    };
    s.lib_open_folder = function() { try { mkdirs(libDir()); } catch (e) {} $citra.openFolder(libDir()); };
    // replaces the whole library by the content of a .cmib (a safety snapshot of the current library is made first)
    function libReplaceBy(data) {
      var safety, r;
      if (countQuests(data) < 0) { libFlash("red", s._("INVALID_FILE")); return; }
      safety = libSnapshot("before-restore");
      $library.clear();               // quests only: palicos and the collections themselves stay
      r = importContent(data);        // the collection markers of the file put the quests back in their collections
      s.refresh_list();
      libFlash(r === -1 ? "red" : "green", s._("LIBRARY_RESTORED") + (safety ? " (" + s._("GAME_RESTORE_SAFETY") + " " + safety + ")" : ""));
    }
    s.lib_restore = function(b) { s.lib_confirm = b; };
    s.lib_restore_go = function() {
      var b = s.lib_confirm;
      s.lib_confirm = null;
      try {
        libReplaceBy(fs.readFileSync(path.join(libDir(), b.name), { encoding: "binary" }));
      } catch (e) { libFlash("red", e.message); }
      $("#libRestoreModal").modal("hide");
    };
    s.lib_from_file = function() { $("#restoreDialog").trigger("click"); };
    $("#restoreDialog").change(function() {
      var files = this.files;
      if (files && files.length) {
        try { libReplaceBy(fs.readFileSync(files[0].path, { encoding: "binary" })); } catch (e) { libFlash("red", e.message); }
        $("#restoreDialog").val("");
        $("#libRestoreModal").modal("hide");
        s.$digest();
      }
    });
    // automatic snapshot when the last one is older than 12 hours
    try {
      var lf = libFiles(), last = lf[0] ? fs.statSync(path.join(libDir(), lf[0])).mtime.getTime() : 0;
      if (Date.now() - last > 12 * 3600 * 1000) { libSnapshot("auto"); }
    } catch (e) {}

    /* ------------------------------------------------------------ original library features */
    s.toggle_sort = function(key) {
      if (s.sortBy === key) {
        if (s.sortReverse) { s.sortBy = null; } else { s.sortReverse = true; }
      } else {
        s.sortBy = key;
        s.sortReverse = false;
      }
    };
    s.toggle_palico = function() { $(".shape").shape("flip over"); };
    s.isEpisodic = function(q) { return 62000 <= q.json.quest_id && q.json.quest_id < 63000; };
    s.isChallenge = function(q) { return 61000 <= q.json.quest_id && q.json.quest_id < 62000; };
    s.select_export_local = function(v) { s.export_local = v; };
    s.select_exportselected_local = function(v) { s.exportselected_local = v; };
    s.refresh_list = function() {
      s.list = $library.list();
      s.palico_list = $library.list_otb();
      s.refresh_collections();
    };
    s.refresh_text_idx = function() {
      switch ($i18n.current_locale()) {
        case "fr": s.text_idx = 1; break;
        case "es": s.text_idx = 2; break;
        case "de": s.text_idx = 3; break;
        case "it": s.text_idx = 4; break;
        default: s.text_idx = 0;
      }
    };
    s.refresh_text_idx();
    s.refresh_buttons = function() {
      s.refresh_text_idx();
      s._EDIT = $i18n.get("EDIT");
      s._EXPORT = $i18n.get("EXPORT");
      s._DELETE = $i18n.get("DELETE");
      s._COPY = $i18n.get("DUPLICATE");
    };

    s.duplicate = function(quest) {
      $library.insertInto = null;
      $library.insert($library.get(quest.uuid).mib);
      if (quest.collection && $library.lastUuid) { $library.setCollection([$library.lastUuid], quest.collection); }
      s.refresh_list();
    };

    s.select_all_toggle = true;
    s.select_all = function() {
      var i, v = s.visible || s.list;
      if (s.select_all_toggle) {
        s.select_all_toggle = false;
        for (i = v.length - 1; i >= 0; i--) { v[i].hosted = true; s.clearDuplicateHost(v[i]); }
      } else {
        s.select_all_toggle = true;
        for (i = v.length - 1; i >= 0; i--) { v[i].hosted = false; }
      }
      $library.persistHosted(s.list);
    };
    s.select_all_toggle_otb = true;
    s.select_all_otb = function() {
      var i;
      if (s.select_all_toggle_otb) {
        s.select_all_toggle_otb = false;
        for (i = s.palico_list.length - 1; i >= 0; i--) { s.palico_list[i].hosted = true; }
      } else {
        s.select_all_toggle_otb = true;
        for (i = s.palico_list.length - 1; i >= 0; i--) { s.palico_list[i].hosted = false; }
      }
      $library.persistPalicoHosted(s.palico_list);
    };
    // two selected quests with the same id would end up in the same game slot
    s.clearDuplicateHost = function(quest) {
      for (var i = 0; i < s.list.length; i++) {
        if (s.list[i].json.quest_id === quest.json.quest_id && s.list[i].uuid !== quest.uuid) { s.list[i].hosted = false; }
      }
      $library.persistHosted(s.list);
    };
    s.clearDuplicatePalicoHost = function() { $library.persistPalicoHosted(s.palico_list); };

    s.deleteLibrary = function() {
      $("#deleteLibraryDialog").modal({
        closable: false,
        onDeny: function() {},
        onApprove: function() { try { libSnapshot("before-delete"); } catch (e) {} $library.clear(); s.refresh_list(); s.$digest(); }
      }).modal("show");
    };
    s.deletePalicoLibrary = function() {
      $("#deleteLibraryDialog").modal({
        closable: false,
        onDeny: function() {},
        onApprove: function() { $library.clear_otb(); s.refresh_list(); s.$digest(); }
      }).modal("show");
    };

    function importContent(data) {
      var r = $library.import(data);
      if (r === -1) { s.error = "INVALID_FILE"; }
      else if (r === -2) { s.error = "INVALID_QUEST_ID"; }
      return r;
    }

    $("#saveas").change(function() {
      var p = $(this).val();
      if ("" !== p && null !== p) {
        $(this).val("");
        fs.writeFileSync(p, $mib.encrypt(s.export_local, s.export_quest.mib), { encoding: "binary" });
        if (s.export_info_file) { fs.writeFileSync(p.replace(/.mib$/, ".txt"), $mib.encrypt(s.export_local, $library.generateIndex(s.export_quest.json)), { encoding: "binary" }); }
        $("#exportmodal").modal("hide");
      }
    });
    $("#savePalico").change(function() {
      var p = $(this).val();
      if ("" !== p && null !== p) {
        $(this).val("");
        fs.writeFileSync(p, $otb.encrypt(s.export_local, s.export_palico.otb), { encoding: "binary" });
        if (s.export_info_file) { fs.writeFileSync(p.replace(/.otb$/, ".txt"), $otb.encrypt(s.export_local, $library.generatePalicoIndex(s.export_palico.json, 1)), { encoding: "binary" }); }
        $("#exportPalico").modal("hide");
      }
    });
    $("#importDialog").change(function() {
      var files = $("#importDialog")[0].files, i;
      if (files && files.length) {
        s.error = null;
        for (i = 0; i < files.length; i++) { importContent(fs.readFileSync(files[i].path, { encoding: "binary" })); }
        $("#importDialog").val("");
        s.refresh_list();
        s.$digest();
      }
    });
    $("#backupDialog").change(function() {
      var p = $(this).val();
      if ("" !== p && null !== p) {
        $(this).val("");
        fs.writeFileSync(p, $library.backup(s.backup_scope || undefined), { encoding: "binary" });
        s.backup_scope = null;
      }
    });
    $("#saveSelectedDialog").change(function() {
      var dir = $(this).val();
      if ("" !== dir && null !== dir) {
        $(this).val("");
        var index = "";
        $library.list().forEach(function(q) {
          if (q.hosted) {
            fs.writeFileSync(dir + "/m" + q.json.quest_id + ".mib", $mib.encrypt(s.exportselected_local, $library.get(q.uuid).mib), { encoding: "binary" });
            index += $library.generateIndex(q.json);
          }
        });
        if (s.export_info_file) { fs.writeFileSync(dir + "/DLC_EventQuestInfo.txt", $mib.encrypt(s.exportselected_local, index), { encoding: "binary" }); }
        $("#exportselectedmodal").modal("hide");
      }
    });
    s.backup = function() { s.backup_scope = null; $("#backupDialog").attr("nwsaveas", "cq_backup.cmib"); $("#backupDialog").trigger("click"); };
    s.saveDialog = function() { $("#saveas").trigger("click"); };
    s.savePalicoDialog = function() { $("#savePalico").trigger("click"); };
    s.saveSelectedDialog = function() { $("#saveSelectedDialog").trigger("click"); };
    s.importDialog = function() { $("#importDialog").trigger("click"); };
    s["export"] = function(uuid) {
      s.export_quest = $library.get(uuid);
      $("#exportmodal").modal({ transition: "scale", blurring: true }).modal("show");
    };
    s.export_selected = function() {
      $("#exportselectedmodal").modal({ transition: "scale", blurring: true }).modal("show");
    };
    s.exportPalico = function(uuid) {
      s.export_palico = $library.get(uuid);
      $("#exportPalico").modal({ transition: "scale", blurring: true }).modal("show");
    };


    /* ------------------------------------------------------------ collections (user-defined groups of quests) */
    s.xt = { ov: {} };
    s.colors = ["blue", "teal", "green", "olive", "yellow", "orange", "red", "pink", "violet", "purple", "brown", "grey"];
    s.coll = "all";                    // "all" | "none" | a collection id
    s.coll_list = [];
    s.groups = [];
    s.visible = [];
    s.gv = { on: $library.collectionSettings().group };
    s.set_coll = function(id) { s.coll = id; };
    s.ce = {};
    $library.insertInto = null;

    s.is_coll = function(id) { return id !== "all" && id !== "none" && !!s.cinfo(id); };
    s.cinfo = function(id) {
      var i;
      if (!id) { return null; }
      for (i = 0; i < s.coll_list.length; i++) { if (s.coll_list[i].id === id) { return s.coll_list[i]; } }
      return null;
    };
    s.refresh_collections = function() {
      var counts = {}, none = 0;
      s.coll_list = $library.collections();
      s.coll_list.forEach(function(c) { counts[c.id] = 0; });
      s.list.forEach(function(q) {
        if (q.collection && counts[q.collection] !== undefined) { counts[q.collection]++; } else { q.collection = null; none++; }
      });
      s.coll_list.forEach(function(c) { c.count = counts[c.id]; });
      s.count_none = none;
      if (s.coll !== "all" && s.coll !== "none" && !s.cinfo(s.coll)) { s.coll = "all"; }
      s.rebuild();
    };
    // the quests shown (search, collection, sort) and their groups; computed here, not in the template, so that the objects stay stable
    s.rebuild = function() {
      var l = s.list, groups = [], byId = {}, grouped;
      if (s.search) { l = $filter("filter")(l, s.search); }
      if (s.sortBy) { l = $filter("orderBy")(l, s.sortBy, s.sortReverse); }
      if (s.coll === "none") { l = l.filter(function(q) { return !q.collection; }); }
      else if (s.coll !== "all") { l = l.filter(function(q) { return q.collection === s.coll; }); }
      s.visible = l;
      s.visible_count = l.length;
      grouped = s.coll === "all" && s.gv.on && s.coll_list.length > 0;
      s.show_coll_label = s.coll === "all" && !grouped && s.coll_list.length > 0;
      if (!grouped) {
        groups.push({ key: "_flat", header: false, items: l, rows: l });
      } else {
        s.coll_list.forEach(function(c) {
          var g = { key: c.id, id: c.id, name: c.name, color: c.color, header: true, collapsed: !!c.collapsed, items: [], rows: [] };
          byId[c.id] = g; groups.push(g);
        });
        byId._none = { key: "_none", id: null, header: true, collapsed: false, items: [], rows: [] };
        groups.push(byId._none);
        l.forEach(function(q) { (byId[q.collection] || byId._none).items.push(q); });
        groups.forEach(function(g) { g.rows = g.collapsed ? [] : g.items; });
        // while searching, hide the groups without result
        if (s.search) { groups = groups.filter(function(g) { return g.items.length; }); }
        else if (!byId._none.items.length) { groups = groups.filter(function(g) { return g !== byId._none; }); }
      }
      s.groups = groups;
    };
    s.$watchGroup(["search", "sortBy", "sortReverse", "coll", "gv.on"], function() { s.rebuild(); });
    s.toggle_group = function(g) {
      if (!g.id) { g.collapsed = !g.collapsed; g.rows = g.collapsed ? [] : g.items; return; }
      g.collapsed = !g.collapsed;
      g.rows = g.collapsed ? [] : g.items;
      $library.setCollapsed(g.id, g.collapsed);
    };
    s.set_group_view = function() { $library.setGroupView(s.gv.on); };
    s.coll_move_by = function(id, dir) { $library.moveCollection(id, dir); s.refresh_collections(); };

    // overlays live in <body> (above every Semantic dimmer)
    s.ov_open = function(n) { s.xt.ov[n] = true; };
    s.ov_close = function(n) { s.xt.ov[n] = false; };
    s.ov_backdrop = function(ev, n) { if (ev.target === ev.currentTarget) { s.ov_close(n); } };
    function onKey(ev) {
      if (ev.keyCode !== 27) { return; }
      s.$evalAsync(function() { s.ov_close("cedit"); if (!s.xt.ov.cedit) { s.ov_close("move"); } });
    }
    $(document).on("keydown.collov", onKey);
    $timeout(function() { $("#collmovemodal, #colleditmodal").appendTo(document.body); }, 0);

    // move quests to a collection
    s.open_move = function(uuids) { s.move_uuids = uuids; s.move_count = uuids.length; s.ov_open("move"); };
    s.open_move_selected = function() {
      var u = s.list.filter(function(q) { return q.hosted; }).map(function(q) { return q.uuid; });
      if (!u.length) { s.error = "COLL_NOTHING_SELECTED"; return; }
      s.error = null;
      s.open_move(u);
    };
    s.do_move = function(id) {
      $library.setCollection(s.move_uuids || [], id);
      s.ov_close("move");
      s.refresh_list();
    };
    // create / rename / delete a collection
    s.open_coll_edit = function(id, thenMove) {
      var c = id ? s.cinfo(id) : null;
      s.ce = c ? { id: c.id, name: c.name, color: c.color } : { id: null, name: "", color: s.colors[s.coll_list.length % s.colors.length] };
      s.ce.thenMove = !!thenMove;
      s.ov_open("cedit");
      $timeout(function() { $("#collname").focus(); }, 50);
    };
    s.ce_key = function(ev) { if (ev.keyCode === 13) { s.ce_save(); } };
    s.ce_save = function() {
      var name = (s.ce.name || "").trim(), dup = name && $library.findCollectionByName(name), item;
      if (!name) { s.ce.error = "COLL_ERR_EMPTY"; return; }
      if (dup && dup.id !== s.ce.id) { s.ce.error = "COLL_ERR_EXISTS"; return; }
      if (s.ce.id) {
        $library.updateCollection(s.ce.id, name, s.ce.color);
      } else {
        item = $library.addCollection(name, s.ce.color);
        if (item && s.ce.thenMove) { $library.setCollection(s.move_uuids || [], item.id); s.ov_close("move"); }
      }
      s.ov_close("cedit");
      s.refresh_list();
    };
    s.ce_delete = function() {
      if (!s.ce.confirm_delete) { s.ce.confirm_delete = true; return; }
      $library.deleteCollection(s.ce.id);
      if (s.coll === s.ce.id) { s.coll = "all"; }
      s.ov_close("cedit");
      s.refresh_list();
    };
    // export one collection (a .cmib file that recreates the collection when imported)
    s.export_collection = function() {
      var c = s.cinfo(s.coll);
      if (!c) { return; }
      s.backup_scope = c.id;
      $("#backupDialog").attr("nwsaveas", c.name.replace(/[\\/:*?"<>|]/g, "_") + ".cmib");
      $("#backupDialog").trigger("click");
    };
    // new quests created from here go into the collection being viewed
    s.set_insert_target = function() { $library.insertInto = s.is_coll(s.coll) ? s.coll : null; };
    s.refresh_collections();

    $timeout(function() {
      $("#exportmodal .ui.dropdown").dropdown();
      $("#exportselectedmodal .ui.dropdown").dropdown();
      $("#exportPalico .ui.dropdown").dropdown();
      $("#language_changer").dropdown();
      $(".shape").shape();
    }, 0);

    s.$on("$destroy", function() {
      $(document).off("keydown.collov", onKey);
      $("#collmovemodal, #colleditmodal").remove();
      $(".shape").remove();
      $("#dragdrop .ui.modal").remove();
      $("#exportmodal .ui.dropdown").remove();
      $("#exportselectedmodal .ui.dropdown").remove();
      ["#nohosted", "#language_changer", "#saveas", "#exportmodal", "#exportselectedmodal", "#exportPalico", "#importDialog",
        "#deleteLibraryDialog", "#installmodal", "#installresult", "#citraNotFound", "#saveSelectedDialog", "#savePalico", "#backupDialog", "#restoreDialog", "#libRestoreModal"].forEach(function(id) { $(id).remove(); });
    });

    /* drag & drop import */
    var dz = $("#dragdrop");
    dz.on("dragover", function() {
      $("#dragdropicon").toggleClass("outline", false);
      $("#dropzone").toggleClass("pulse", true);
    });
    dz.on("dragleave", function() {
      $("#dragdropicon").toggleClass("outline", true);
      $("#dropzone").toggleClass("pulse", false);
    });
    dz.on("drop", function(e) {
      e.preventDefault();
      if (s.importing) { return false; }
      s.importing = true;
      s.error = null;
      $("#dragdropicon").toggleClass("outline", true);
      $("#dropzone").toggleClass("pulse", false);
      var files = e.originalEvent.dataTransfer.files, done = 0, i;
      if (!files.length) { s.importing = null; return false; }
      for (i = 0; i < files.length; i++) {
        (function(file) {
          var reader = new FileReader();
          reader.onloadend = function() {
            done++;
            if (null !== reader.result) { importContent(reader.result); }
            if (done === files.length) {
              s.importing = null;
              s.refresh_list();
              s.$digest();
            }
          };
          reader.readAsBinaryString(file);
        })(files[i]);
      }
    });
  }]);
}();
