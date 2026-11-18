/* In-game quests view: what is stored in Citra's extdata, slot by slot */
! function() {
  var mod = angular.module("editor.views.game", ["ngRoute", "editor.utils.citra", "editor.utils.library", "editor.utils.config"]),
    fs = require("fs");

  mod.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when("/game/:tab?", {
      controller: "GameController",
      templateUrl: "app/views/game/game.html"
    });
  }]);

  mod.controller("GameController", ["$scope", "$timeout", "$location", "$routeParams", "$citra", "$library", "$mib", "$otb", "$i18n", "constants",
    function($scope, $timeout, $location, $routeParams, $citra, $library, $mib, $otb, $i18n, constants) {
    var s = $scope;
    s._ = $i18n.get;
    s.constants = constants;
    s.tab = $routeParams.tab || "event";
    s.MIB_MAX = $citra.MIB_MAX;

    switch ($i18n.current_locale()) {
      case "fr": s.text_idx = 1; break;
      case "es": s.text_idx = 2; break;
      case "de": s.text_idx = 3; break;
      case "it": s.text_idx = 4; break;
      default: s.text_idx = 0;
    }

    s.category_packs = $citra.core.CATEGORY_PACKS;

    s.refresh = function(reload) {
      var st = reload ? $citra.reload() : $citra.state();
      s.st = st;
      s.summary = $citra.summary();
      s.backups = $citra.listBackups();
      s.backups_root = $citra.backupsRoot();
      try { s.originals = $citra.originals(); } catch (e) { s.originals = {}; }
      try { $citra.rememberAll(); s.last_ids = $citra.lastIds(); } catch (e) { s.last_ids = {}; }
      s.library_list = $library.list();
      s.palico_library = $library.list_otb();
    };
    s.refresh(true);

    s.set_tab = function(t) { s.tab = t; $location.path("/game/" + t).replace(); };
    s.show_free = true;
    s.slots_of = function(cat) {
      var out = [];
      if (!s.st.ok) { return out; }
      s.category_packs[cat].forEach(function(n) {
        var p = s.st.packs[n];
        if (p && p.slots) { p.slots.forEach(function(sl) { if (s.show_free || !sl.empty) { out.push(sl); } }); }
      });
      return out;
    };
    s.title_of = function(slot) {
      return slot && slot.json && slot.json.text && slot.json.text[s.text_idx] ? slot.json.text[s.text_idx][0] : "?";
    };
    s.in_library = function(slot) {
      var found = null;
      s.library_list.forEach(function(q) { if (!found && q.json.quest_id === slot.questId) { found = q; } });
      return found;
    };
    s.rank_label = function(qid) {
      if (qid >= 60000 && qid < 60100) { return "LR"; }
      if (qid >= 60100 && qid < 60200) { return "HR"; }
      if (qid >= 60200 && qid < 60300) { return "G"; }
      return "";
    };
    s.original_of = function(sl) { return s.originals ? s.originals[sl.pack + ":" + sl.index] : null; };
    // ID shown for an emptied slot: the one it carried before, else the one of the original game quest
    s.last_id = function(sl) {
      var o = s.originals && s.originals[sl.pack + ":" + sl.index];
      return (s.last_ids && s.last_ids[sl.pack + ":" + sl.index]) || (o && o.questId) || $citra.backupLastId(sl.pack, sl.index) || null;
    };
    s.locked = function(sl) { return $citra.isProtected(sl); };
    s.unrestricted = function(qid) {
      var r = constants.quest_restrictions[qid];
      return r === "Unrestricted";
    };

    function flash(kind, text) {
      s.flash = { kind: kind, text: text };
      $timeout(function() { if (s.flash && s.flash.text === text) { s.flash = null; } }, 8000);
    }

    /* ---------------------------------------------------------------- slot actions */
    s.to_library = function(slot) {
      var r = $library.insert(slot.mib);
      s.library_list = $library.list();
      if (r === 1) { flash("green", s._("GAME_COPIED") + " " + slot.questId); } else { flash("red", s._("INVALID_QUEST_ID")); }
    };
    s.all_to_library = function(cat) {
      var n = 0;
      s.slots_of(cat).forEach(function(sl) {
        if (!sl.empty && !s.in_library(sl)) { if ($library.insert(sl.mib) === 1) { n++; } }
      });
      s.library_list = $library.list();
      flash("green", n + " " + s._("GAME_COPIED_N"));
    };

    $("#gameExportDialog").change(function() {
      var p = $(this).val();
      if ("" !== p && null !== p && s.export_slot) {
        $(this).val("");
        fs.writeFileSync(p, s.export_slot.mib, { encoding: "binary" });
      }
    });
    s.export_mib = function(slot) {
      s.export_slot = slot;
      s.export_name = "m" + slot.questId + ".mib";
      $timeout(function() { $("#gameExportDialog").trigger("click"); }, 0);
    };

    /* choose a library quest for a slot */
    s.pick = function(slot) {
      s.pick_slot = slot;
      s.pick_cat = slot.empty ? $citra.core.questCategory(slot.pack === "quest4" ? 61000 : slot.pack === "quest5" ? 62000 : 60000) : slot.category;
      s.pick_search = "";
      s.pick_choice = null;
      s.pick_plan = null;
      s.pick_src = "library";
      s.pick_backups = $citra.listBackups();
      s.pick_backup = s.pick_backups.length ? s.pick_backups[s.pick_backups.length - 1].name : null;
      $("#pickmodal").modal({ observeChanges: true }).modal("show");
    };
    // quests of the chosen backup, for the category of the place
    s.set_pick_src = function(src) { s.pick_src = src; s.pick_choice = null; s.pick_plan = null; if (src === "backup") { s.load_backup_rows(); } };
    s.load_backup_rows = function() {
      var g = s.pick_backup ? $citra.backupQuests(s.pick_backup) : [];
      s.pick_choice = null; s.pick_plan = null;
      s.backup_rows = g.filter(function(sl) { return sl.category === s.pick_cat && sl.json; }).map(function(sl) {
        return { key: sl.pack + ":" + sl.index, mib: sl.mib, json: sl.json, uuid: null, official: $citra.isOfficialBackupSlot(sl) };
      });
    };
    s.pick_candidates = function() {
      if (s.pick_src === "backup") { return s.backup_rows || []; }
      return s.library_list.filter(function(q) { return !q.json.quest_id || $citra.core.questCategory(q.json.quest_id) === s.pick_cat; });
    };
    s.choose = function(q) {
      s.pick_choice = q;
      s.pick_plan = $citra.plan([{ mib: q.mib || $library.get(q.uuid).mib, json: q.json, uuid: q.uuid, target: { pack: s.pick_slot.pack, slot: s.pick_slot.index } }])[0];
      s.pick_plan.restriction = s.pick_plan.ok ? restriction(angular.extend({}, q.json, { quest_id: s.pick_plan.questId })) : null;
    };
    function restriction(json) {
      var r = constants.quest_restrictions[json.quest_id], bad = [];
      if (!r || typeof r === "string" || !r.length) { return null; }
      json.large_monster_table.forEach(function(w) { w.forEach(function(m) { if (r.indexOf(m.monster_id) < 0) { bad.push(m.monster_id); } }); });
      return bad.length ? r.map(function(id) { return $i18n.getFilter(constants.monsters[id]); }).join(", ") : null;
    }
    s.confirm_pick = function() {
      try {
        var res = $citra.apply([s.pick_plan], "before-slot-" + s.pick_plan.pack + "-" + (s.pick_plan.slot + 1)), e, m;
        if (s.pick_plan.autoId && s.pick_plan.item.uuid) {
          e = $library.get(s.pick_plan.item.uuid);
          m = e && $citra.core.setMibQuestId(e.mib, s.pick_plan.questId);
          if (m) { $library.update(s.pick_plan.item.uuid, m); }
        }
        flash("green", s._("CITRA_DONE_MSG") + " " + res.written.join(", ") + (res.backup ? " - " + s._("CITRA_BACKUP_DONE") + " " + res.backup : ""));
      } catch (e) {
        flash("red", e.message);
      }
      $("#pickmodal").modal("hide");
      s.refresh(false);
    };

    s.clear_opts = { restore: true };
    s.ask_clear = function(slot) {
      s.clear_slot_target = slot;
      s.clear_original = s.original_of(slot) || null;
      s.clear_opts.restore = true;
      $("#clearmodal").modal({
        closable: false,
        onApprove: function() {
          try {
            var b = $citra.clearSlot(slot.pack, slot.index, !!(s.clear_original && s.clear_opts.restore));
            flash("green", (s.clear_original && s.clear_opts.restore ? s._("GAME_ORIGINAL_BACK") + " " + s.clear_original.questId : s._("GAME_CLEARED")) + (b ? " - " + s._("CITRA_BACKUP_DONE") + " " + b : ""));
          } catch (e) {
            flash("red", e.message);
          }
          s.refresh(false);
          s.$digest();
        }
      }).modal("show");
    };
    // put the official quest of the backups back on a place (empty, or holding a custom quest)
    s.ask_original = function(slot) {
      s.orig_target = slot;
      s.orig_info = s.original_of(slot);
      $("#origmodal").modal({
        closable: false,
        onApprove: function() {
          try {
            var b = $citra.clearSlot(slot.pack, slot.index, true);
            flash("green", s._("GAME_ORIGINAL_BACK") + " " + s.orig_info.questId + (b ? " - " + s._("CITRA_BACKUP_DONE") + " " + b : ""));
          } catch (e) {
            flash("red", e.message);
          }
          s.refresh(false);
          s.$digest();
        }
      }).modal("show");
    };

    /* ---------------------------------------------------------------- palicos */
    s.palico_slots = function() {
      if (!s.st.ok || !s.st.otomo) { return []; }
      var out = [], firstFree = true;
      s.st.otomo.slots.forEach(function(sl) {
        if (!sl.empty) { out.push(sl); } else if (firstFree) { out.push(sl); firstFree = false; }
      });
      return out;
    };
    s.palico_to_library = function(sl) {
      $library.insert_otb(sl.otb);
      s.palico_library = $library.list_otb();
      flash("green", s._("GAME_COPIED") + " " + (sl.json ? sl.json.name : ""));
    };
    s.pick_palico = function(sl) {
      s.palico_slot = sl;
      $("#palicomodal").modal({ observeChanges: true }).modal("show");
    };
    s.confirm_palico = function(p) {
      try {
        var otb = $library.get(p.uuid).otb, b = $citra.putPalico(s.palico_slot.index, otb, null);
        flash("green", s._("CITRA_DONE_MSG") + " otomo1" + (b ? " - " + s._("CITRA_BACKUP_DONE") + " " + b : ""));
      } catch (e) {
        flash("red", e.message);
      }
      $("#palicomodal").modal("hide");
      s.refresh(false);
    };
    s.clear_palico = function(sl) {
      try {
        var b = $citra.clearPalico(sl.index);
        flash("green", s._("GAME_CLEARED") + (b ? " - " + s._("CITRA_BACKUP_DONE") + " " + b : ""));
      } catch (e) {
        flash("red", e.message);
      }
      s.refresh(false);
    };

    /* ---------------------------------------------------------------- backups */
    s.backup_now = function() {
      try {
        var n = $citra.backup("manual", true);
        flash("green", s._("CITRA_BACKUP_DONE") + " " + n);
      } catch (e) {
        flash("red", e.message);
      }
      s.refresh(false);
    };
    s.ask_restore = function(b) {
      s.restore_target = b;
      $("#restoremodal").modal({
        closable: false,
        onApprove: function() {
          try {
            var safety = $citra.restore(b.name);
            flash("green", s._("GAME_RESTORED") + " " + b.name + " (" + s._("GAME_RESTORE_SAFETY") + " " + safety + ")");
          } catch (e) {
            flash("red", e.message);
          }
          s.refresh(false);
          s.$digest();
        }
      }).modal("show");
    };
    s.open_folder = function(p) { $citra.openFolder(p); };

    $citra.emulatorRunning(function(list) {
      s.running = list;
      s.$evalAsync();
    });

    s.$on("$destroy", function() {
      ["#pickmodal", "#clearmodal", "#origmodal", "#palicomodal", "#restoremodal", "#gameExportDialog"].forEach(function(id) { $(id).remove(); });
    });
  }]);
}();
