/*
 * $gamedata - data extracted from the MH4U ROM and the official quests (app/data/gamedata.js)
 *
 *  - monster stat table (141 rows, code.bin) + base HP of every monster (em_data.arc)
 *  - DLC quest id list and monster restrictions as the game itself stores them
 *  - small monster layouts and spawn points of official quests, per map / area
 *  - item categories / monster tags, monster species and difficulty
 *  - how the "special" byte and other hidden fields are used by official quests
 */
! function() {
  var mod = angular.module("editor.utils.gamedata", ["editor.utils.constants", "editor.utils.i18n"]);
  var G = window.MH4U_GAMEDATA;

  var EVENT = [60000, 61000], CHALLENGE = [61000, 62000], EPISODIC = [62000, 63000];
  function category(qid) {
    if (qid >= EVENT[0] && qid < EVENT[1]) { return "event"; }
    if (qid >= CHALLENGE[0] && qid < CHALLENGE[1]) { return "challenge"; }
    if (qid >= EPISODIC[0] && qid < EPISODIC[1]) { return "episodic"; }
    return null;
  }

  mod.factory("$gamedata", ["constants", "$i18n", function(constants, $i18n) {
    var lang = function() { return $i18n.current_locale() === "fr" ? "fr" : "en"; };

    /* ---------------------------------------------------------------- constants fixes */
    // 1. monster restrictions of the official ids: use the game's own table (dasding's list had 16 errors)
    Object.keys(G.dlc_restrictions).forEach(function(qid) {
      var r = G.dlc_restrictions[qid];
      constants.quest_restrictions[qid] = r.monsters.length ? r.monsters.slice() : "Unrestricted";
    });
    G.dlc_master.forEach(function(qid) {
      if (!constants.quest_restrictions[qid]) { constants.quest_restrictions[qid] = "Unrestricted"; }
    });
    // 2. "special" values used by official quests but missing from the editor
    Object.keys(G.special_usage).forEach(function(mid) {
      var u = G.special_usage[mid], vals = Object.keys(u);
      if (vals.length < 2 && vals[0] === "0") { return; }
      if (!constants.special_mod[mid]) { constants.special_mod[mid] = { 0: "Normal" }; }
      vals.forEach(function(v) {
        if (constants.special_mod[mid][v] === undefined) { constants.special_mod[mid][v] = "Variant " + v; }
      });
    });
    // 3. quest types / objectives found in official quests
    if (!constants.quest_types[16]) { constants.quest_types[16] = "Special (research / bonus / repel)"; }
    if (!constants.quest_types[0]) { constants.quest_types[0] = "Multiple targets (no type)"; }
    if (!constants.objectives[2048]) { constants.objectives[2048] = "Reach the goal (research)"; }

    /* ---------------------------------------------------------------- stats */
    var T = G.diff_table;
    var COLS = ["hp", "atk", "def", "tol1", "tol2", "tol3", "tol4", "tol5"];
    /*
     * Standard values for Health / Attack / Resistance, taken from the official quests (quartiles per rank in rank_stats):
     * typical value of a rank band (median of the medians), highest value used by an official quest, last table row, 255 (the byte limit)
     */
    var STAT_KEYS = { hp: "hp", atk: "atk", res: "break_res" };
    var BANDS = { low: [1, 2, 3], high: [4, 5, 6, 7], g: [8, 9, 10] };
    function median(a) { a = a.slice().sort(function(x, y) { return x - y; }); return a.length ? a[Math.floor((a.length - 1) / 2)] : 0; }
    function statPresets() {
      var RS = G.rank_stats || {}, out = {}, band, k;
      function pick(ranks, key, idx) { return ranks.filter(function(r) { return RS[r]; }).map(function(r) { return RS[r][key][idx]; }); }
      for (band in BANDS) {
        out[band] = {};
        for (k in STAT_KEYS) { out[band][k] = median(pick(BANDS[band], STAT_KEYS[k], 2)); }
      }
      out.max_official = {};
      out.table_max = { hp: T.length - 1, atk: T.length - 1, res: T.length - 1 };
      out.byte_max = { hp: 255, atk: 255, res: 255 };
      for (k in STAT_KEYS) {
        out.max_official[k] = Math.max.apply(null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(function(r) { return RS[r]; }).map(function(r) { return RS[r][STAT_KEYS[k]][4]; }));
      }
      return out;
    }
    function row(i) { i = parseInt(i, 10); return (i >= 0 && i < T.length) ? T[i] : null; }
    function stats(meta, monsterId) {
      var r = {}, base = G.base_hp[monsterId], h, a, d;
      if (!meta) { return r; }
      h = row(meta.hp); a = row(meta.atk); d = row(meta.break_res);
      r.base_hp = base;
      r.hp_mult = h ? h[0] : null;
      r.hp = (h && base) ? Math.round(base * h[0] * (meta.size ? 1 : 1)) : null;
      r.atk_mult = a ? a[1] : null;
      r.def_mult = d ? d[2] : null;
      r.tol = d ? d.slice(3) : null;
      r.out_of_range = { hp: !h, atk: !a, res: !d };
      return r;
    }

    /* ---------------------------------------------------------------- monsters */
    function monster(id) { return G.monsters[id]; }
    function monsterName(id) {
      var m = G.monsters[id];
      if (!m) { return constants.monsters[id] || ("#" + id); }
      return lang() === "fr" ? m.fr : m.en;
    }
    function speciesName(sp) {
      var s = G.species[sp];
      return s ? s[lang()] : sp;
    }
    function filterMonsters(f) {
      var out = [], q = (f.search || "").toLowerCase();
      Object.keys(G.monsters).forEach(function(id) {
        var m = G.monsters[id];
        if (f.kind && f.kind !== "all" && m.kind !== f.kind) { return; }
        if (f.species && m.species !== f.species) { return; }
        if (f.diff && String(m.diff) !== String(f.diff)) { return; }
        if (q && (m.en + " " + m.fr).toLowerCase().indexOf(q) < 0) { return; }
        out.push({ id: parseInt(id, 10), name: lang() === "fr" ? m.fr : m.en, m: m, preview: constants.monsterid_to_previewid[id] });
      });
      return out;
    }

    /* ---------------------------------------------------------------- preview icons */
    var PREVIEW_GROUPS = null;
    function previews(f) {
      var out = [], q = (f.search || "").toLowerCase(), byPreview = {};
      Object.keys(constants.monsterid_to_previewid).forEach(function(mid) {
        var p = constants.monsterid_to_previewid[mid];
        if (!byPreview[p]) { byPreview[p] = []; }
        byPreview[p].push(parseInt(mid, 10));
      });
      Object.keys(constants.previews).forEach(function(pid) {
        var name = constants.previews[pid], mids = byPreview[pid] || [], m = mids.length ? G.monsters[mids[0]] : null;
        if (q && (name + " " + (m ? m.fr : "")).toLowerCase().indexOf(q) < 0) { return; }
        if (f.species && (!m || m.species !== f.species)) { return; }
        if (f.kind === "L" && (!m || m.kind !== "L")) { return; }
        if (f.kind === "S" && m && m.kind === "L") { return; }
        out.push({ id: parseInt(pid, 10), name: name, species: m ? m.species : null });
      });
      return out;
    }

    /* ---------------------------------------------------------------- items */
    function itemCategories() {
      var l = lang() === "fr" ? 1 : 0, out = [];
      Object.keys(G.item_categories).forEach(function(k) { out.push({ id: k, name: G.item_categories[k][l] }); });
      out.sort(function(a, b) { return a.name < b.name ? -1 : 1; });
      return out;
    }
    function filterItems(f) {
      var out = [], q = (f.search || "").toLowerCase(), limit = f.limit || 300;
      Object.keys(G.items).forEach(function(id) {
        var it = G.items[id], name = constants.items[id] || "";
        if (out.length >= limit) { return; }
        if (!f.showUnused && it.c === "unused") { return; }
        if (f.cat && it.c !== f.cat) { return; }
        if (f.monster && (!it.m || it.m.indexOf(parseInt(f.monster, 10)) < 0)) { return; }
        if (f.other && !it.o) { return; }
        if (q && (name + " " + (it.fr || "")).toLowerCase().indexOf(q) < 0) { return; }
        out.push({ id: parseInt(id, 10), name: name, fr: it.fr, cat: it.c, monsters: it.m || [] });
      });
      return out;
    }
    function itemMonsters() {
      var seen = {}, out = [];
      Object.keys(G.items).forEach(function(id) { (G.items[id].m || []).forEach(function(m) { seen[m] = true; }); });
      Object.keys(seen).forEach(function(m) { out.push({ id: parseInt(m, 10), name: monsterName(m) }); });
      out.sort(function(a, b) { return a.name < b.name ? -1 : 1; });
      return out;
    }

    /* ---------------------------------------------------------------- quest ids */
    function questMonsters(json) {
      var ids = [];
      (json.large_monster_table || []).forEach(function(w) { w.forEach(function(m) { if (ids.indexOf(m.monster_id) < 0) { ids.push(m.monster_id); } }); });
      return ids;
    }
    // does a quest (its large monsters) satisfy an official id's monster restriction?
    function fits(qid, json) {
      var r = G.dlc_restrictions[qid], mons;
      if (!r || !r.monsters.length) { return { ok: true, unrestricted: true }; }
      mons = questMonsters(json);
      var bad = mons.filter(function(m) { return r.monsters.indexOf(m) < 0; });
      return { ok: bad.length === 0 && mons.length > 0, unrestricted: false, required: r.monsters, bad: bad };
    }
    function officialTitle(qid) {
      var o = G.official_event_quests[qid];
      return o ? o[lang()] : null;
    }
    // does a game slot still hold the official quest of its id (and not a custom quest)?
    function isOfficialSlot(qid, slot) {
      var o = G.official_event_quests[qid], titles = [];
      if (!o || !slot) { return false; }
      if (!slot.json || !slot.json.text) { return false; }
      slot.json.text.forEach(function(t) { if (t && t[0]) { titles.push(String(t[0]).replace(/\s+/g, " ").trim()); } });
      return titles.indexOf(o.en) >= 0 || titles.indexOf(o.fr) >= 0;
    }
    // does a quest (library / editor) carry the title of the official quest of its id? (then it is a copy of it)
    function isOfficialCopy(json) {
      return !!json && isOfficialSlot(json.quest_id, { json: json });
    }
    /*
     * every DLC id of a category with its status in the game:
     *   free    - not in the game: a new quest can be added without replacing anything
     *   custom  - holds one of your own quests: can be replaced (after confirmation)
     *   official- holds an official quest (see the MH4U wiki): never replaced
     * inGame: function(qid) -> slot or null
     */
    function idTable(cat, json, inGame) {
      var out = [];
      G.dlc_master.forEach(function(qid) {
        if (cat && category(qid) !== cat) { return; }
        var r = G.dlc_restrictions[qid], slot = inGame ? inGame(qid) : null, f = json ? fits(qid, json) : null, st;
        st = !slot ? "free" : (isOfficialSlot(qid, slot) || category(qid) !== "event" ? "official" : "custom");
        out.push({
          id: qid,
          category: category(qid),
          known: !!r,
          restriction: r ? r.monsters : null,
          unrestricted: !r || !r.monsters.length,
          slot: slot,
          free: !slot,
          status: st,
          official: st === "official",
          custom: st === "custom",
          title: officialTitle(qid),
          fits: f
        });
      });
      return out;
    }
    /*
     * Pick an id for a quest that has none (quest_id 0). Monsters do not matter:
     *   1. a free id (empty slot of the game): ids without restriction, then the ones whose monsters match, then the others
     *   2. only when nothing is free: the id of one of YOUR OWN quests (never an official quest)
     */
    function autoId(json, inGame, taken, cat, opts) {
      var t = idTable(cat || "event", json, inGame), i, c;
      taken = taken || {};
      var free = t.filter(function(r) { return r.free && !taken[r.id]; });
      if (opts && opts.noFree) { free = []; }   // every empty place of the game is already used
      for (i = 0; i < free.length; i++) { if (free[i].unrestricted) { return { id: free[i].id, how: "free_unrestricted" }; } }
      for (i = 0; i < free.length; i++) { c = free[i]; if (c.fits && c.fits.ok) { return { id: c.id, how: "free_matching" }; } }
      // a free id that works only with other monsters is not proposed while one of your own quests can be replaced
      var cus = t.filter(function(r) { return r.custom && !taken[r.id]; });
      for (i = cus.length - 1; i >= 0; i--) { if (cus[i].unrestricted) { return { id: cus[i].id, how: "replace_custom", replaces: customTitle(cus[i]) }; } }
      if (cus.length) { return { id: cus[cus.length - 1].id, how: "replace_custom", replaces: customTitle(cus[cus.length - 1]) }; }
      if (free.length) { return { id: free[0].id, how: "free" }; }
      return null;
    }
    function customTitle(row) {
      var j = row.slot && row.slot.json;
      return (j && j.text && j.text[0] && j.text[0][0]) || (row.slot && row.slot.title) || "";
    }

    /* ---------------------------------------------------------------- rewards auto-fill */
    var HUNT_TYPES = [1, 257, 129, 516, 8196, 16388];
    // monsters of the success conditions (hunt / slay / capture / break / topple / suppress); the quest's large monsters when there are none
    function huntedMonsters(json) {
      var out = [];
      (json.objectives || []).concat(json.objective_sub ? [json.objective_sub] : []).forEach(function(o) {
        if (o && HUNT_TYPES.indexOf(o.type) >= 0 && o.target_id > 0 && out.indexOf(o.target_id) < 0) { out.push(o.target_id); }
      });
      return out;
    }
    function rankBandOf(rank) { return rank <= 3 ? "low" : (rank <= 7 ? "high" : "g"); }
    var BAND_ORDER = { low: ["low", "high", "g"], high: ["high", "g", "low"], g: ["g", "high", "low"] };
    function profileOf(band, mid, tk) {
      var P = G.loot_profiles || {}, order = BAND_ORDER[band] || BAND_ORDER.high, i, d, t;
      for (i = 0; i < order.length; i++) {
        d = P[order[i]] && P[order[i]][String(mid)];
        t = d && (d[tk] || (tk !== "a" ? d.a : null));
        if (t && t.items.length) { return { items: t.items, n: t.n, band: order[i] }; }
      }
      return null;
    }
    /*
     * Items of a reward table for a set of monsters and a rank band, from the official quests that hunt them.
     * Chances sum to 100 (like every official table); returns { items: [{item_id, qty, chance}], used: [mid], fallback: [mid], generic: bool, n }
     */
    function lootFor(mons, band, tk, maxItems) {
      var agg = {}, used = [], fallback = [], n = 0, generic = false, list, rows, total, out, left, i, own, fill, capOwn, cap, minOwn;
      mons = mons || [];
      function owners(id) { var it = G.items[id]; return it && it.m ? it.m : null; }
      function isOwn(id) { var o = owners(id); return !!o && o.some(function(m) { return mons.indexOf(m) >= 0; }); }
      function isForeign(id) { var o = owners(id); return !!o && !isOwn(id); }   // material of another monster
      mons.forEach(function(m) {
        var p = profileOf(band, m, tk), sum;
        if (!p) { return; }
        used.push(m); n += p.n;
        if (p.band !== band) { fallback.push(m); }
        sum = p.items.reduce(function(a, r) { return a + r[1]; }, 0) || 1;
        p.items.forEach(function(r) {
          if (isForeign(r[0])) { return; }   // e.g. a Rathalos item from a quest that hunts Rathalos and Zinogre
          var e = agg[r[0]] || (agg[r[0]] = { id: r[0], w: 0, q: r[2], qw: 0, cond: 0, f: 0 });
          e.cond = Math.max(e.cond, r[3] > 0 ? r[1] / r[3] : r[1]); e.f = Math.max(e.f, r[3] || 0);
          e.w += r[1] / sum * 100;
          if (r[1] / sum > e.qw) { e.qw = r[1] / sum; e.q = r[2]; }
        });
      });
      if (!used.length) {
        var g = profileOf(band, 0, tk);
        if (!g) { return { items: [], used: [], fallback: [], generic: true, n: 0 }; }
        generic = true; n = g.n;
        g.items.forEach(function(r) { agg[r[0]] = { id: r[0], w: r[1], q: r[2] }; });
      }
      list = Object.keys(agg).map(function(k) { return agg[k]; }).sort(function(a, b) { return b.w - a.w; });
      cap = maxItems || Math.min(14, 11 + used.length);
      if (!generic) {
        // the materials of the hunted monsters come first (including the rare ones: gems, pallium, mantle...), then the usual extras
        // rare drops of the monster (gems, pallium, mantle...): official tables give them 1-3 % each time they appear
        var rare = list.filter(function(e) { return isOwn(e.id) && e.cond <= 3.5 && e.f >= 0.1; }).sort(function(a, b) { return b.f - a.f; }).slice(0, 3 * used.length);
        own = list.filter(function(e) { return isOwn(e.id) && rare.indexOf(e) < 0; });
        fill = list.filter(function(e) { return !isOwn(e.id); });
        capOwn = Math.max(3 * used.length, Math.min(own.length, cap - rare.length - 3));
        list = rare.concat(own.slice(0, capOwn));
        list = list.concat(fill.slice(0, Math.max(3, cap - list.length)));
        list.sort(function(a, b) { return b.w - a.w; });
      } else {
        list = list.slice(0, cap);
      }
      total = list.reduce(function(a, e) { return a + e.w; }, 0) || 1;
      rows = list.map(function(e) { var x = e.w / total * 100; return { e: e, c: Math.max(1, Math.floor(x)), r: x - Math.floor(x) }; });
      left = 100 - rows.reduce(function(a, r) { return a + r.c; }, 0);
      rows.slice().sort(function(a, b) { return b.r - a.r; }).forEach(function(r) { if (left > 0) { r.c++; left--; } });
      for (i = rows.length - 1; i >= 0 && left < 0; i--) { if (rows[i].c > 1) { rows[i].c--; left++; } }
      out = rows.map(function(r) { return { item_id: r.e.id, qty: r.e.q || 1, chance: r.c }; });
      return { items: out, used: used, fallback: fallback, generic: generic, n: n };
    }

    /* ---------------------------------------------------------------- initial supplies auto-fill */
    // boxes of the official quests: 0 = map items (maps, torches, drinks), 1 = standard kit + counters of the monsters, 3 = refill box
    function supplyFor(json) {
      var P = G.supply_profiles || { map: {}, kit: {}, mon: {} }, band = rankBandOf(parseInt(json.quest_rank, 10) || 1),
        mons = huntedMonsters(json), src = "objectives", rows = { 0: [], 1: [], 3: [] }, generic = false, m, k, mm, seen = {}, i, out = { 0: [], 1: [], 3: [] };
      if (!mons.length) { mons = questMonsters(json); src = "large"; }
      function pick(o) { return o && (o[band] || o.high || o.g || o.low); }
      function add(box, r, kind) { rows[box].push({ item_id: r[0], qty: r[1], copies: r[2], freq: r[3], kind: kind }); }
      m = pick(P.map[String(json.map_id)]);
      if (m) { m.items.forEach(function(r) { add(0, r, "map"); }); }
      else {
        // map without enough official quests: only the items shared by (almost) every known map
        var cnt = {}, maps = Object.keys(P.map), nm = 0;
        maps.forEach(function(k2) {
          var p2 = pick(P.map[k2]); if (!p2) { return; }
          nm++; var u = {};
          p2.items.forEach(function(r) { if (r[2] > 1 && !u[r[0]]) { u[r[0]] = 1; cnt[r[0]] = (cnt[r[0]] || 0) + 1; cnt[r[0] + "q"] = r[1]; cnt[r[0] + "c"] = r[2]; } });
        });
        Object.keys(cnt).forEach(function(id) {
          if (/[qc]$/.test(id) || cnt[id] < nm * 0.75) { return; }
          add(0, [parseInt(id, 10), cnt[id + "q"], cnt[id + "c"], 0.5], "map");
        });
        generic = rows[0].length > 0;
      }
      k = P.kit[band] || P.kit.high;
      if (k) {
        [1, 3].forEach(function(b) { (k.boxes[String(b)] || []).forEach(function(r) { add(b, r, "kit"); }); });
      }
      mons.forEach(function(id) {
        mm = pick(P.mon[String(id)]);
        if (!mm) { return; }
        [1, 3].forEach(function(b) {
          (mm[String(b)] || []).forEach(function(r) {
            var key = b + ":" + r[0] + ":" + r[1];
            if (seen[key]) { return; }
            seen[key] = true; add(b, r, "monster");
          });
        });
      });
      [0, 1, 3].forEach(function(b) {
        rows[b].forEach(function(r) { for (i = 0; i < r.copies; i++) { if (out[b].length < 40) { out[b].push({ item_id: r.item_id, qty: r.qty }); } } });
      });
      return { band: band, mons: mons, src: src, rows: rows, boxes: out, n: k ? k.n : 0, mapGeneric: generic };
    }
    // what the official quests use for a numeric field of the same star rank (Zenny, HRP...)
    function commonValues(json, field) {
      var C = G.common_values || { star: {}, band: {} }, r = parseInt(json.quest_rank, 10) || 1, st = C.star[String(r)], d = st && st[field], scope = "star";
      if (!d) { d = (C.band[rankBandOf(r)] || {})[field]; scope = "band"; }
      return d ? { min: d.min, med: d.med, max: d.max, modes: d.modes, n: d.nz, scope: scope } : null;
    }
    /*
     * Consistency check of a quest before it goes into the game. Rules come from what every quest of the game respects
     * (official and custom ones alike) and from the monster restriction of DLC ids; the game may answer
     * "You cannot accept this Quest data" when one of the errors below is present.
     */
    function checkQuest(json) {
      var out = [], hunt = [1, 257, 129, 8196, 16388, 516], mons = questMonsters(json), n = (json.supplies || []).length, f;
      (json.refills || []).forEach(function(r, i) {
        if ((r.box || r.condition) && r.box >= n) {
          var last = n - 1;
          out.push({ level: "error", key: "CHK_REFILL", p: { n: i + 1, box: r.box, len: n }, fix: { type: "refill", idx: i, last: (last >= 1 && json.supplies[last].length) ? last : 0 } });
        }
      });
      (json.objectives || []).concat([json.objective_sub]).forEach(function(o, i) {
        var which = i < 2 ? "FIRST_MAIN_OBJECTIVE:SECOND_MAIN_OBJECTIVE".split(":")[i] : "SUB_OBJECTIVE";
        if (!o || !o.type) { return; }
        if (hunt.indexOf(o.type) >= 0 && !o.target_id) {
          out.push({ level: "error", key: "CHK_OBJ_NONE", p: { which: which }, fix: { type: "objective", idx: i < 2 ? i : "sub" } });
        } else if (hunt.indexOf(o.type) >= 0 && mons.length && mons.indexOf(o.target_id) < 0 && huntedMonsters({ objectives: [o] }).length) {
          out.push({ level: "warn", key: "CHK_OBJ_ABSENT", p: { which: which, mon: o.target_id } });
        }
      });
      if (json.quest_id) {
        f = fits(json.quest_id, json);
        if (G.dlc_master.indexOf(json.quest_id) < 0) { out.push({ level: "warn", key: "CHK_ID_NOT_DLC", p: { id: json.quest_id } }); }
        else if (!f.ok && !f.unrestricted) { out.push({ level: "error", key: "CHK_ID_RESTRICT", p: { id: json.quest_id, mons: f.required }, fix: { type: "id" } }); }
      }
      [["loot_a", "MAIN_REWARD_A"], ["loot_b", "MAIN_REWARD_B"], ["loot_c", "SUB_REWARD"]].forEach(function(t) {
        (json[t[0]] || []).forEach(function(g) {
          var sum = g.items.reduce(function(a, i) { return a + i.chance; }, 0);
          if (g.items.length && sum !== 100) { out.push({ level: "warn", key: "CHK_LOOT", p: { table: t[1], sum: sum } }); }
        });
      });
      return out;
    }
    // checkQuest with the messages written out (get = i18n getter)
    function checkQuestText(json, get) {
      return checkQuest(json).map(function(c) {
        var t = get("CHK_TEXT_" + c.key.slice(4)), p = c.p || {};
        t = t.replace("{n}", p.n).replace("{box}", p.box).replace("{len}", p.len).replace("{id}", p.id).replace("{sum}", p.sum);
        if (p.which) { t = t.replace("{which}", get(p.which)); }
        if (p.table) { t = t.replace("{table}", get(p.table)); }
        if (p.mon !== undefined) { t = t.replace("{mon}", monsterName(p.mon)); }
        if (p.mons) { t = t.replace("{mons}", p.mons.map(monsterName).join(", ")); }
        return { level: c.level, text: t, fix: c.fix, key: c.key, fixKey: c.fix ? (c.fix.type === "refill" ? (c.fix.last ? "refill_last" : "refill_off") : c.fix.type) : "" };
      });
    }
    // proposals for the main objectives and the subquest, from what official quests ask for the large monsters of the quest
    function objectiveSuggestions(json) {
      var O = G.objective_profiles || { main: {}, sub: {} }, mons = questMonsters(json).slice(), main = [], sub = [], acc = {}, qt = { 1: 257, 2: 129, 3: 1 }[json.quest_type], used = {};
      huntedMonsters(json).forEach(function(m) { if (mons.indexOf(m) < 0) { mons.push(m); } });
      mons.forEach(function(m) {
        var list = (O.main[String(m)] || []).slice(0, 2), seen = 0;
        list.forEach(function(r) { main.push({ type: r[0], target_id: m, qty: r[1], count: r[2] }); seen++; });
        if (!seen && qt) { main.push({ type: qt, target_id: m, qty: 1, count: 0 }); }
      });
      mons.forEach(function(m) {
        (O.sub[String(m)] || []).forEach(function(r) {
          var key = r[0] + ":" + r[1] + ":" + r[2];
          if (r[0] !== 2 && mons.indexOf(r[1]) < 0) { return; }
          if (!acc[key]) { acc[key] = { type: r[0], target_id: r[1], qty: r[2], count: 0 }; }
          acc[key].count += r[3];
        });
      });
      Object.keys(acc).forEach(function(k) { sub.push(acc[k]); });
      sub.sort(function(a, b) { return b.count - a.count; });
      (json.objectives || []).forEach(function(o) { if (o) { used[o.type + ":" + o.target_id + ":" + o.qty] = 1; } });
      return { main: main.slice(0, 8), sub: sub.filter(function(r) { return !used[r.type + ":" + r.target_id + ":" + r.qty]; }).slice(0, 8) };
    }
    // proposals for the two "who may post / join" requirements, from the official quests that hunt the same monsters
    function requirementSuggestions(json, max) {
      var R = G.requirement_profiles || { mon: {}, star: {} }, band = rankBandOf(parseInt(json.quest_rank, 10) || 1),
        mons = huntedMonsters(json), acc = {}, out, why = {};
      if (!mons.length) { mons = questMonsters(json); }
      mons.forEach(function(id) {
        var d = R.mon[String(id)], l = d && (d[band] || d.g || d.high || d.low);
        (l || []).forEach(function(r) { var k = r[0].join(","); acc[k] = (acc[k] || 0) + r[1] * 3; why[k] = true; });
      });
      ((R.star[String(parseInt(json.quest_rank, 10) || 1)]) || []).forEach(function(r) { var k = r[0].join(","); acc[k] = (acc[k] || 0) + r[1]; });
      out = Object.keys(acc).map(function(k) { return { pair: k.split(",").map(Number), score: acc[k], monster: !!why[k] }; });
      out.sort(function(a, b) { return b.score - a.score; });
      return out.slice(0, max || 5);
    }

    /* ---------------------------------------------------------------- spawns */
    var F = G.spawn_fields;
    function toMonster(rec) {
      var m = {}, i;
      for (i = 0; i < F.length; i++) { m[F[i]] = rec[i]; }
      return m;
    }
    function smallTemplates(mapId) {
      var s = G.spawns[mapId];
      return s ? s.templates : [];
    }
    function areaLayouts(mapId, area) {
      var s = G.spawns[mapId];
      return (s && s.areas[area]) ? s.areas[area] : [];
    }
    function areasOf(mapId) { return G.map_areas[mapId] || []; }
    /* layout made of the most frequent group of every area, optionally restricted to a rank band */
    function typicalLayout(mapId, rmin, rmax) {
      var s = G.spawns[mapId], groups = [];
      if (!s) { return groups; }
      Object.keys(s.areas).sort(function(a, b) { return a - b; }).forEach(function(a) {
        var lst = s.areas[a].filter(function(l) { return rmin === undefined || (l.rmax >= rmin && l.rmin <= rmax); });
        if (!lst.length) { lst = s.areas[a]; }
        if (lst.length) { groups.push(lst[0].m.map(toMonster)); }
      });
      return groups;
    }
    function templateGroups(t) {
      return t.groups.map(function(g) { return g.map(toMonster); });
    }
    function spawnPoints(mapId, area) {
      var s = G.spawns[mapId];
      return (s && s.large[area]) ? s.large[area] : [];
    }

    /* ---------------------------------------------------------------- special / hidden */
    function specialUsage(mid, val) {
      var u = G.special_usage[mid];
      if (!u) { return null; }
      return val === undefined ? u : u[val];
    }
    function smallCrashflag(mid) {
      var d = G.small_defaults[mid];
      if (d) { return d.crashflag; }
      return constants.monster_is_large[mid] ? 5 : 1;
    }

    return {
      G: G,
      category: category,
      table: T,
      row: row,
      statPresets: statPresets,
      stats: stats,
      monster: monster,
      monsterName: monsterName,
      speciesName: speciesName,
      species: function() { return Object.keys(G.species).map(function(k) { return { id: k, name: speciesName(k) }; }); },
      filterMonsters: filterMonsters,
      previews: previews,
      itemCategories: itemCategories,
      itemCategoryName: function(c) { var x = G.item_categories[c]; return x ? x[lang() === "fr" ? 1 : 0] : c; },
      filterItems: filterItems,
      itemMonsters: itemMonsters,
      fits: fits,
      questMonsters: questMonsters,
      officialTitle: officialTitle,
      idTable: idTable,
      autoId: autoId,
      isOfficialSlot: isOfficialSlot,
      isOfficialCopy: isOfficialCopy,
      huntedMonsters: huntedMonsters,
      rankBandOf: rankBandOf,
      lootFor: lootFor,
      supplyFor: supplyFor,
      commonValues: commonValues,
      requirementSuggestions: requirementSuggestions,
      objectiveSuggestions: objectiveSuggestions,
      checkQuest: checkQuest,
      checkQuestText: checkQuestText,
      smallTemplates: smallTemplates,
      areaLayouts: areaLayouts,
      areasOf: areasOf,
      typicalLayout: typicalLayout,
      templateGroups: templateGroups,
      toMonster: toMonster,
      spawnPoints: spawnPoints,
      specialUsage: specialUsage,
      smallCrashflag: smallCrashflag
    };
  }]);
}();
