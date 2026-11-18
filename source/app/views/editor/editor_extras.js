/*
 * Additions to the quest editor (Citra edition 3.1):
 *  - quest id picker (automatic id, official free ids, compatibility with the quest's monsters)
 *  - live stats preview (HP, attack, defense, tolerances) from the game's own tables
 *  - small monster auto-fill from the official quests of the same map
 *  - monster / item / preview icon pickers with filters
 *  - official spawn points, Everwood handling, "special" value usage
 *
 * Called by EditorController: window.MH4UEditorExtras(scope, deps)
 */
window.MH4UEditorExtras = function(s, d) {
  var gd = d.$gamedata, citra = d.$citra, constants = d.constants, $timeout = d.$timeout, i18n = d.$i18n;
  s.gd = gd;
  // ng-repeat needs stable arrays: cache computed lists by their parameters
  var cache = {};
  // results are cached per key (several dialogs may ask for different keys in the same digest)
  function memo(name, key, fn) {
    var k = JSON.stringify(key), c = cache[name];
    if (!c || c.n > 200) { c = cache[name] = { n: 0, v: {} }; }
    if (!c.v.hasOwnProperty(k)) { c.v[k] = fn(); c.n++; }
    return c.v[k];
  }
  s.species_list = gd.species();
  s.i18n = i18n;
  // getter used by the dialogs: xt_get('current_edit_monster') -> function returning that object
  s.xt_get = function(path) {
    return function() { return path.split(".").reduce(function(o, k) { return o ? o[k] : null; }, s); };
  };
  /* picker windows: plain overlays (not Semantic modals: stacked Semantic modals could stay on top and block every click) */
  var OV_ORDER = ["id", "mon", "icon", "fill", "map", "rf", "sf", "chk"];
  s.ov_open = function(n) { s.xt.ov[n] = true; };
  s.ov_close = function(n) { s.xt.ov[n] = false; };
  s.ov_backdrop = function(ev, n) { if (ev.target === ev.currentTarget) { s.ov_close(n); } };
  function onKey(ev) {
    var i;
    if (ev.keyCode !== 27) { return; }
    for (i = OV_ORDER.length - 1; i >= 0; i--) {
      if (s.xt.ov[OV_ORDER[i]]) { ev.stopPropagation(); s.$evalAsync(function() { s.ov_close(OV_ORDER[i]); }); return; }
    }
  }
  $(document).on("keydown.xtov", onKey);
  // the overlays must live directly in <body>: inside the view they sit under Semantic's dimmer (clicks blocked)
  $timeout(function() { $(".xt-ov").appendTo(document.body); }, 0);
  s.$on("$destroy", function() { $(document).off("keydown.xtov", onKey); $(".xt-ov").remove(); });
  s.xt = { ov: {}, rf: { rank: "quest", tables: { a: true, b: true, c: true }, preview: [], mons: [] },
    sf: { rank: "quest", boxes: { 0: true, 1: true, 3: true }, res: null, mons: [], refills: true }, idFilter: { view: "std", fits: false, search: "" }, mon: { kind: "L", species: "", diff: "", search: "" },
    item: { cat: "", monster: "", search: "" }, icon: { search: "", species: "" },
    fill: { source: "typical", rank: "quest", waves: "all", mode: "replace", template: null } };

  // slots of the game, cached per loaded state: watchers must see the same object between digests
  var slotCache = { st: null, v: {} };
  function inGame(qid) {
    try {
      var st = citra.state(), sl;
      if (!st.ok) { return null; }
      if (slotCache.st !== st) { slotCache = { st: st, v: {} }; }
      if (!slotCache.v.hasOwnProperty(qid)) {
        sl = citra.findQuest(qid);
        slotCache.v[qid] = sl ? { pack: sl.pack, index: sl.index, json: sl.json, title: sl.json ? sl.json.text[s.text_idx || 0][0] : "" } : null;
      }
      return slotCache.v[qid];
    } catch (e) { return null; }
  }
  s.xt.inGame = inGame;

  /* ------------------------------------------------------------------ quest id */
  var idInfoCache = { k: null, v: null };
  s.id_info = function() {
    var q = s.quest, qid = q ? parseInt(q.quest_id, 10) : 0, r = {}, k;
    if (!q) { return r; }
    k = [qid, gd.questMonsters(q).join(","), slotCache.st === null ? "" : "s", i18n.current_locale()].join("|");
    try { if (citra.state() !== slotCache.st) { k += "|new"; } } catch (e) {}
    if (idInfoCache.k === k && idInfoCache.v) { return idInfoCache.v; }
    idInfoCache.k = k;
    idInfoCache.v = r = computeIdInfo(q, qid);
    return r;
  };
  function computeIdInfo(q, qid) {
    var r = {};
    r.auto = !qid;
    if (r.auto) { return r; }
    r.category = gd.category(qid);
    r.official = gd.officialTitle(qid);
    r.listed = gd.G.dlc_master.indexOf(qid) >= 0;
    r.known = !!gd.G.dlc_restrictions[qid];
    r.slot = inGame(qid);
    r.locked = !!(r.slot && gd.isOfficialSlot(qid, r.slot) && !gd.isOfficialCopy(q));
    r.fits = gd.fits(qid, q);
    return r;
  }
  s.open_id_picker = function() {
    var cat = gd.category(parseInt(s.quest.quest_id, 10)) || "event";
    s.xt.idCat = cat;
    s.refresh_id_rows();
    s.ov_open("id");
  };
  s.refresh_id_rows = function() {
    s.xt.idRows = gd.idTable(s.xt.idCat, s.quest, inGame);
    s.xt.idAuto = gd.autoId(s.quest, inGame, {}, s.xt.idCat);
  };
  s.id_rows = function() {
    var f = s.xt.idFilter, q = (f.search || "").toLowerCase();
    return (s.xt.idRows || []).filter(function(r) {
      // "std": your own quests' slots and the free IDs that need no condition; "free": free IDs that work only with specific monsters; "all": everything
      if (f.view === "std" && !(r.custom || (r.free && r.known && r.unrestricted))) { return false; }
      if (f.view === "free" && !(r.free && !(r.known && r.unrestricted))) { return false; }
      if (f.fits && r.official) { return false; }
      if (q) {
        var txt = (r.id + " " + (r.title || "") + " " + (r.restriction || []).map(gd.monsterName).join(" ")).toLowerCase();
        if (txt.indexOf(q) < 0) { return false; }
      }
      return true;
    });
  };
  s.choose_id = function(id) {
    if (id) { var row = (s.xt.idRows || []).filter(function(r) { return r.id === id; })[0]; if (row && row.official) { return; } }
    s.quest.quest_id = id;
    s.ov_close("id");
  };
  s.monster_list_names = function(ids) { return (ids || []).map(gd.monsterName).join(", "); };

  /* ------------------------------------------------------------------ stats */
  s.stats_of = function(meta, mid) { return gd.stats(meta, mid); };
  s.fmt = function(x, digits) { return (x === null || x === undefined) ? "?" : Number(x).toFixed(digits === undefined ? 2 : digits); };

  /* ------------------------------------------------------------------ monster picker */
  var monTarget = null;
  // a monster that was just added opens the picker at once; closing the picker without choosing cancels the addition
  var monPending = null;
  s.open_monster_picker = function(target, kind, cancel) {
    monTarget = target;
    monPending = cancel ? { cancel: cancel } : null;
    s.xt.mon.kind = kind || "L";
    s.ov_open("mon");
  };
  var monAdd = null;
  s.open_monster_add = function(kind, adder) {
    monTarget = null; monPending = null; monAdd = adder;
    s.xt.mon.kind = kind || "L";
    s.ov_open("mon");
  };
  s.$watch("xt.ov.mon", function(now, was) {
    if (was && !now) {
      if (monPending) { var p = monPending; monPending = null; p.cancel(); }
      monAdd = null;
    }
  });
  // nothing is added to the quest until a monster is chosen in the picker (like the items)
  s.add_monster_pick = function(wave) {
    s.open_monster_add("L", function(id) {
      var arr;
      s.add_monster(wave);
      arr = s.quest.large_monster_table[wave];
      arr[arr.length - 1].monster_id = id;
    });
  };
  s.add_small_monster_pick = function(wave) {
    s.open_monster_add("S", function(id) {
      var arr;
      s.add_small_monster(wave);
      arr = s.quest.small_monster_table[wave][0];
      arr[arr.length - 1].monster_id = id;
    });
  };
  s.add_unstable_monster_pick = function() {
    s.open_monster_add("L", function(id) {
      var arr;
      s.add_unstable_monster();
      arr = s.quest.unstable_monster_table;
      arr[arr.length - 1].monster.monster_id = id;
    });
  };
  s.monster_rows = function() { return memo("mon", [s.xt.mon, i18n.current_locale()], function() { return gd.filterMonsters(s.xt.mon); }); };
  s.pick_monster = function(id) {
    var o = monTarget && monTarget(), add = monAdd;
    monAdd = null;
    if (add) { add(id); } else if (o) { o.monster_id = id; }
    monPending = null;
    s.ov_close("mon");
    $timeout(function() {
      if (s.reload_special) { s.reload_special(); }
      // semantic dropdowns wrap the <select>: show the text of the option angular selected
      $(".modal select").each(function() {
        var sel = $(this), wrap = sel.closest(".ui.dropdown"), opt = sel.find("option:selected");
        if (!wrap.length || !opt.length) { return; }
        try { wrap.dropdown("refresh"); } catch (e) {}
        wrap.children(".text").first().removeClass("default").text(opt.text());
        wrap.find(".menu .item").removeClass("active selected").filter(function() { return $(this).attr("data-value") === opt.attr("value"); }).addClass("active selected");
      });
    }, 50);
  };

  /* ------------------------------------------------------------------ standard stat values */
  var presets = gd.statPresets();
  s.apply_stat_preset = function(name) {
    var p = presets[name], m = s.current_edit_meta;
    if (!p || !m) { return; }
    m.hp = p.hp; m.atk = p.atk; m.break_res = p.res;
  };
  s.preset_title = function(name) {
    var p = presets[name];
    return p ? ("Health " + p.hp + " / Attack " + p.atk + " / Resistance " + p.res) : "";
  };

  /* ------------------------------------------------------------------ rewards auto-fill */
  var RF_LABEL = { a: "MAIN_REWARD_A", b: "MAIN_REWARD_B", c: "SUB_REWARD" };
  s.open_rewardfill = function() {
    s.xt.rf.rank = "quest";
    s.refresh_rf();
    s.ov_open("rf");
  };
  s.refresh_rf = function() {
    var rf = s.xt.rf, mons = gd.huntedMonsters(s.quest), band;
    rf.src = "objectives";
    if (!mons.length) { mons = gd.questMonsters(s.quest); rf.src = "large"; }
    band = rf.rank === "quest" ? gd.rankBandOf(parseInt(s.quest.quest_rank, 10) || 1) : rf.rank;
    rf.band = band;
    rf.mons = mons.map(gd.monsterName);
    rf.preview = ["a", "b", "c"].filter(function(t) { return s.quest["loot_" + t] && s.quest["loot_" + t].length > 0; }).map(function(t) {
      var res = gd.lootFor(mons, band, t);
      return { t: t, label: RF_LABEL[t], res: res, rows: res.items.map(function(i) {
        return { name: i18n.getFilter(constants.items[i.item_id]) || ("#" + i.item_id), qty: i.qty, chance: i.chance };
      }) };
    });
  };
  s.apply_rf = function() {
    s.xt.rf.preview.forEach(function(p) {
      if (s.xt.rf.tables[p.t] && p.res.items.length) { s.quest["loot_" + p.t][0].items = angular.copy(p.res.items); }
    });
    s.ov_close("rf");
  };

  /* ------------------------------------------------------------------ initial supplies auto-fill */
  var SF_BOXES = [0, 1, 3];
  s.open_supplyfill = function() {
    s.xt.sf.rank = "quest";
    s.refresh_sf();
    s.ov_open("sf");
  };
  function itemName(id) { return i18n.getFilter(constants.items[id]) || ("#" + id); }
  s.refresh_sf = function() {
    var sf = s.xt.sf, q = angular.copy(s.quest), res;
    if (sf.rank !== "quest") { q.quest_rank = { low: 2, high: 5, g: 9 }[sf.rank]; }
    res = gd.supplyFor(q);
    sf.res = res;
    sf.mons = res.mons.map(gd.monsterName);
    sf.map = s.map_name(s.quest.map_id);
    sf.cols = SF_BOXES.map(function(b) {
      return { b: b, label: b === 0 ? "SF_BOX_MAP" : (b === 1 ? "SF_BOX_KIT" : "SF_BOX_REFILL"), count: res.boxes[b].length,
        rows: res.rows[b].map(function(r) { return { name: itemName(r.item_id), qty: r.qty, copies: r.copies, kind: r.kind }; }) };
    });
  };
  s.apply_sf = function() {
    var sf = s.xt.sf, res = sf.res, q = s.quest;
    while (q.supplies.length < 4) { q.supplies.push([]); }
    SF_BOXES.forEach(function(b) {
      if (sf.boxes[b] && res.boxes[b].length) { q.supplies[b] = angular.copy(res.boxes[b]); }
    });
    // the refill box is only used by the game when a refill points to it (like the official quests)
    if (sf.refills && sf.boxes[3] && res.boxes[3].length && q.refills && q.refills.length >= 2 && !q.refills[0].box && !q.refills[0].condition) {
      q.refills[0].box = 3; q.refills[0].condition = 3; q.refills[1].box = 1; q.refills[1].condition = 1;
    }
    s.ov_close("sf");
  };

  /* ------------------------------------------------------------------ common values of the official quests (Zenny, HRP...) */
  s.cvList = function(field) {
    return memo("cv", [field, s.quest.quest_rank], function() {
      var c = gd.commonValues(s.quest, field);
      if (c) { c.modes_txt = c.modes.map(function(m) { return s.fmtn(m[0]); }).join(" · "); }
      return c ? [c] : [];
    });
  };
  s.cvOpen = {};
  s.cv_toggle = function(f) { s.cvOpen[f] = !s.cvOpen[f]; };
  s.fmtn = function(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f"); };

  /* ------------------------------------------------------------------ requirement proposals */
  s.reqList = function() {
    return memo("req", [s.quest.quest_rank, gd.huntedMonsters(s.quest), gd.questMonsters(s.quest)], function() {
      return gd.requirementSuggestions(s.quest, 5).map(function(r) {
        return { pair: r.pair, monster: r.monster, label: r.pair.map(function(v) { return i18n.getFilter(constants.requirements[v]); }).join(" + ") };
      });
    });
  };
  // Semantic dropdowns do not follow a model changed from code: rebuild them and copy the selected text
  function syncDropdowns() {
    $timeout(function() {
      if (s.reload_dropdown) { s.reload_dropdown(); }
      $timeout(function() {
        $("#reqobj select").each(function() {
          var sel = $(this), wrap = sel.closest(".ui.dropdown"), opt = sel.find("option:selected");
          if (!wrap.length || !opt.length) { return; }
          try { wrap.dropdown("refresh"); } catch (e) {}
          wrap.children(".text").first().removeClass("default").text(opt.text());
        });
      }, 40);
    }, 30);
  }
  s.apply_req = function(pair) {
    s.quest.requirements[0] = pair[0]; s.quest.requirements[1] = pair[1];
    syncDropdowns();
  };

  /* ------------------------------------------------------------------ objective proposals (main objectives, subquest) */
  function objLabel(r) {
    var part, name = r.type === 2 ? (i18n.getFilter(constants.items[r.target_id]) || ("#" + r.target_id)) : gd.monsterName(r.target_id);
    if (r.type === 516) {
      part = (constants.break_parts[r.target_id] || {})[r.qty];
      return i18n.getFilter(constants.objectives[516]) + " " + name + (part ? " (" + i18n.getFilter(part) + ")" : "");
    }
    return i18n.getFilter(constants.objectives[r.type]) + " " + name + " \u00d7" + r.qty;
  }
  s.objList = function() {
    var q = s.quest;
    return memo("obj", [gd.questMonsters(q), gd.huntedMonsters(q), q.quest_type, (q.objectives || []).map(function(o) { return o.type + ":" + o.target_id + ":" + o.qty; }), i18n.current_locale()], function() {
      var res = gd.objectiveSuggestions(q), f = function(r) { return { type: r.type, target_id: r.target_id, qty: r.qty, label: objLabel(r), count: r.count }; };
      return { main: res.main.map(f), sub: res.sub.map(f) };
    });
  };
  s.apply_obj = function(slot, r) {
    var o = { type: r.type, target_id: r.target_id, qty: r.qty };
    if (slot === "sub") { s.quest.objective_sub = o; } else { s.quest.objectives[slot] = o; }
    syncDropdowns();
  };

  /* ------------------------------------------------------------------ quest check */
  s.checkList = function() {
    var q = s.quest;
    return memo("chk", [q.quest_id, q.refills, (q.supplies || []).map(function(b) { return b.length; }), q.objectives, q.objective_sub, gd.questMonsters(q),
      ["loot_a", "loot_b", "loot_c"].map(function(k) { return (q[k] || []).map(function(g) { return g.items.reduce(function(a, i) { return a + i.chance; }, 0); }); })], function() {
      return gd.checkQuestText(q, s._);
    });
  };
  s.checkErrors = function() { return s.checkList().filter(function(c) { return c.level === "error"; }).length; };
  s.open_checks = function() { s.ov_open("chk"); };
  s.fix_check = function(c) {
    var f = c.fix, o;
    if (f.type === "refill") {
      o = s.quest.refills[f.idx];
      if (f.last) { o.box = f.last; } else { o.box = 0; o.condition = 0; o.monster = 0; o.qty = 0; }
    } else if (f.type === "objective") {
      o = f.idx === "sub" ? s.quest.objective_sub : s.quest.objectives[f.idx];
      o.type = 0; o.target_id = 0; o.qty = 0;
      syncDropdowns();
    } else if (f.type === "id") {
      s.ov_close("chk"); s.open_id_picker();
    }
  };
  // removing a supply box renumbers the refills that point to the boxes after it
  s.remove_supply_box = function(idx) {
    s.quest.supplies.splice(idx, 1);
    (s.quest.refills || []).forEach(function(r) {
      if (!r.box && !r.condition) { return; }
      if (r.box === idx) { r.box = 0; r.condition = 0; r.monster = 0; r.qty = 0; }
      else if (r.box > idx) { r.box -= 1; }
    });
  };

  /* ------------------------------------------------------------------ map picker */
  s.map_name = function(id) { return constants.maps[id] === undefined ? "?" : i18n.getFilter(constants.maps[id]); };
  s.map_list = function() {
    return memo("maps", [i18n.current_locale()], function() {
      return Object.keys(constants.maps).map(function(k) { return parseInt(k, 10); }).sort(function(a, b) { return a - b; })
        .map(function(id) { return { id: id, name: s.map_name(id) }; });
    });
  };
  s.pick_map = function(id) { s.quest.map_id = id; s.ov_close("map"); };

  /* ------------------------------------------------------------------ preview icon picker */
  var iconSlot = 0;
  s.open_icon_picker = function(idx) {
    iconSlot = idx;
    s.ov_open("icon");
  };
  s.icon_rows = function() { return memo("icon", s.xt.icon, function() { return gd.previews(s.xt.icon); }); };
  s.pick_icon = function(pid) {
    s.quest.pictures[iconSlot] = pid;
    s.ov_close("icon");
    $timeout(function() { $("#preview select.ui.dropdown").dropdown("refresh"); }, 50);
  };
  s.icon_auto = function() {
    // fill the 5 icons from the quest's large monsters (then intruders), "none" for the rest
    var ids = gd.questMonsters(s.quest), out = [], i;
    (s.quest.unstable_monster_table || []).forEach(function(u) { if (ids.indexOf(u.monster.monster_id) < 0) { ids.push(u.monster.monster_id); } });
    ids.forEach(function(mid) {
      var p = constants.monsterid_to_previewid[mid];
      if (p !== undefined && out.indexOf(p) < 0 && out.length < 5) { out.push(p); }
    });
    for (i = 0; i < 5; i++) { s.quest.pictures[i] = out[i] !== undefined ? out[i] : 98; }
    $timeout(function() { $("#preview select.ui.dropdown").dropdown("refresh"); }, 50);
  };

  /* ------------------------------------------------------------------ item filter (supply / reward dialogs) */
  s.item_rows = function() { return memo("item", s.xt.item, function() { return gd.filterItems({ cat: s.xt.item.cat, monster: s.xt.item.monster, search: s.xt.item.search, limit: 250 }); }); };
  s.item_categories = gd.itemCategories();
  s.item_monsters = gd.itemMonsters();
  s.pick_item = function(target, item) {
    var o = target();
    if (o) { o.item_id = item.id; }
    var label = i18n.getFilter(constants.items[item.id]);
    $(".modal.visible .ui.search").search("set value", label);
  };

  /* ------------------------------------------------------------------ spawn points */
  s.spawn_points = function(area) { return gd.spawnPoints(s.quest.map_id, area); };
  s.use_spawn = function(target, p) {
    var o = target();
    if (!o) { return; }
    o.x = p.p[0]; o.y = p.p[1]; o.z = p.p[2]; o.y_rot = p.p[3];
  };
  s.small_points = function(area) { return memo("sp", [s.quest.map_id, area], function() { return smallPoints(area); }); };
  function smallPoints(area) {
    var pts = [], seen = {};
    gd.areaLayouts(s.quest.map_id, area).forEach(function(l) {
      l.m.forEach(function(r) {
        var m = gd.toMonster(r), k = Math.round(m.x / 50) + "," + Math.round(m.z / 50);
        if (!seen[k] && pts.length < 12) { seen[k] = 1; pts.push({ p: [m.x, m.y, m.z, m.y_rot], mons: [m.monster_id], n: l.n }); }
      });
    });
    return pts;
  }
  s.zero_coords = function(target) {
    var o = target();
    if (o) { o.x = 0; o.y = 0; o.z = 0; }
  };
  s.is_everwood = function() { return s.quest && s.quest.map_id === 13; };
  s.map_areas = function() { return gd.areasOf(s.quest.map_id); };
  s.open_guide = function(section) { if (window.MH4UOpenGuide) { window.MH4UOpenGuide(section); } };

  s.has_area_image = function(area) {
    return gd.G.area_images.indexOf("m" + ("0" + s.quest.map_id).slice(-2) + "a" + ("0" + area).slice(-2)) >= 0;
  };

  /* ------------------------------------------------------------------ special usage */
  s.special_usage = function(mid, val) { return gd.specialUsage(mid, val); };
  s.special_usage_list = function(mid) { return memo("spu", [mid, i18n.current_locale()], function() { return specialList(mid); }); };
  function specialList(mid) {
    var u = gd.specialUsage(mid), out = [];
    if (!u) { return out; }
    Object.keys(u).forEach(function(v) {
      out.push({ v: parseInt(v, 10), n: u[v].n, q: u[v].q.slice(0, 4).map(function(x) { return x[i18n.current_locale() === "fr" ? 2 : 1]; }) });
    });
    return out;
  }

  /* ------------------------------------------------------------------ small monster auto-fill */
  s.open_smallfill = function() {
    s.xt.fill.templates = gd.smallTemplates(s.quest.map_id);
    s.xt.fill.template = s.xt.fill.templates.length ? s.xt.fill.templates[0] : null;
    s.refresh_fill_preview();
    s.ov_open("fill");
  };
  function rankBand(r) {
    if (r <= 3) { return [1, 3]; }
    if (r <= 7) { return [4, 7]; }
    return [8, 14];
  }
  function fillGroups() {
    var f = s.xt.fill, band;
    if (f.source === "template") { return f.template ? gd.templateGroups(f.template) : []; }
    if (f.rank === "any") { return gd.typicalLayout(s.quest.map_id); }
    band = rankBand(f.rank === "quest" ? s.quest.quest_rank : parseInt(f.rank, 10));
    return gd.typicalLayout(s.quest.map_id, band[0], band[1]);
  }
  s.refresh_fill_preview = function() {
    var groups = fillGroups(), byArea = {};
    groups.forEach(function(g) {
      g.forEach(function(m) {
        if (!byArea[m.area]) { byArea[m.area] = {}; }
        byArea[m.area][m.monster_id] = (byArea[m.area][m.monster_id] || 0) + 1;
      });
    });
    s.xt.fill.preview = Object.keys(byArea).sort(function(a, b) { return a - b; }).map(function(a) {
      return { area: a, mons: Object.keys(byArea[a]).map(function(mid) { return byArea[a][mid] + "× " + gd.monsterName(mid); }).join(", ") };
    });
    s.xt.fill.count = groups.reduce(function(n, g) { return n + g.length; }, 0);
  };
  s.apply_smallfill = function() {
    var groups = fillGroups(), flat = [], t = s.quest.small_monster_table, f = s.xt.fill, w;
    groups.forEach(function(g) { g.forEach(function(m) { flat.push(angular.copy(m)); }); });
    for (w = 0; w < 3; w++) {
      if (f.waves !== "all" && w !== 0) { continue; }
      if (!t[w]) { t[w] = [[]]; }
      if (f.mode === "replace") { t[w] = [angular.copy(flat)]; } else { t[w][0] = (t[w][0] || []).concat(angular.copy(flat)); }
    }
    // small monster stats: keep the quest's, unless they are empty
    var sm = s.quest.small_meta;
    if (!sm || !sm.hp) {
      var src = (f.source === "template" && f.template && f.template.sm && f.template.sm.hp) ? f.template.sm : gd.G.small_meta_by_rank[s.quest.quest_rank];
      if (src) { s.quest.small_meta = angular.copy(src); }
    }
    s.ov_close("fill");
  };
};
