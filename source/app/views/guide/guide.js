/*
 * Guide: what the numbers of a quest really mean, measured from the game itself
 * (stat table of code.bin, base HP of em_data.arc, official quests, DLC id tables)
 */
! function() {
  var mod = angular.module("editor.views.guide", ["ngRoute", "editor.utils.gamedata", "editor.utils.citra", "editor.utils.i18n", "editor.utils.constants"]);

  mod.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when("/guide/:section?", {
      controller: "GuideController",
      templateUrl: "app/views/guide/guide.html"
    });
  }]);

  mod.controller("GuideController", ["$scope", "$routeParams", "$location", "$gamedata", "$citra", "$i18n", "constants",
    function($scope, $routeParams, $location, $gamedata, $citra, $i18n, constants) {
    var s = $scope, G = $gamedata.G;
    s._ = $i18n.get;
    s.constants = constants;
    s.G = G;
    s.popup = !!$location.search().popup;
    s.sections = [
      { id: "stats", icon: "heartbeat", label: "GUIDE_STATS" },
      { id: "monsters", icon: "paw", label: "GUIDE_MONSTERS" },
      { id: "special", icon: "star", label: "GUIDE_SPECIAL" },
      { id: "ids", icon: "list ol", label: "GUIDE_IDS" },
      { id: "maps", icon: "map", label: "GUIDE_MAPS" },
      { id: "hidden", icon: "lab", label: "GUIDE_HIDDEN" }
    ];
    s.section = $routeParams.section || "stats";
    s.go = function(id) { s.section = id; window.scrollTo(0, 0); };
    s.close = function() { try { require("nw.gui").Window.get().close(); } catch (e) { window.close(); } };
    s.monsterName = function(id) { return $gamedata.monsterName(id); };
    s.pad = function(n) { return ("0" + n).slice(-2); };
    s.fmt = function(v, d) { return (v === null || v === undefined) ? "-" : (+v).toFixed(d === undefined ? 2 : d).replace(/\.?0+$/, ""); };

    /* ------------------------------------------------------------ stats */
    s.table = G.diff_table.map(function(r, i) { return { i: i, r: r }; });
    s.table_filter = { col: "all" };
    s.ranks = Object.keys(G.rank_stats).map(function(r) {
      return { rank: parseInt(r, 10), label: constants.ranks[r] + (r === "14" ? " (event)" : ""), st: G.rank_stats[r] };
    }).sort(function(a, b) { return a.rank - b.rank; });

    var big = [];
    Object.keys(G.monsters).forEach(function(id) {
      var m = G.monsters[id];
      if (m.kind === "L" && G.base_hp[id]) { big.push({ id: parseInt(id, 10), name: $gamedata.monsterName(id) }); }
    });
    big.sort(function(a, b) { return a.name < b.name ? -1 : 1; });
    s.calc_monsters = big;
    s.presets = $gamedata.statPresets();
    s.calc = { monster: 2, hp: s.presets.low.hp, atk: s.presets.low.atk, res: s.presets.low.res, players: 1 };
    if (!G.base_hp[2]) { s.calc.monster = big.length ? big[0].id : 1; }
    var calcCache = { key: null, r: null };
    s.calc_result = function() {
      var c = s.calc, key = [c.monster, c.hp, c.atk, c.res].join(","), r;
      if (calcCache.key === key) { return calcCache.r; }
      r = $gamedata.stats({ hp: c.hp, atk: c.atk, break_res: c.res }, c.monster);
      calcCache = { key: key, r: r };
      r.hpRow = $gamedata.row(c.hp);
      r.atkRow = $gamedata.row(c.atk);
      r.resRow = $gamedata.row(c.res);
      return r;
    };
    s.set_calc = function(name) { var p = s.presets[name]; s.calc.hp = p.hp; s.calc.atk = p.atk; s.calc.res = p.res; };
    /* the scale of one stat, from the lowest value to the maximum the field accepts */
    s.ladder_stat = "hp";
    var ladderCache = {};
    var LADDER_KEY = { hp: "hp", atk: "atk", res: "break_res" };
    var BAND_NAME = { low: "Low rank", high: "High rank", g: "G rank" };
    function bandOf(r) { return r <= 3 ? "low" : (r <= 7 ? "high" : "g"); }
    s.ladder = function() {
      var st = s.ladder_stat, key = st + $i18n.current_locale(), vals, maxOff = s.presets.max_official[st], col = { hp: 0, atk: 1, res: 2 }[st];
      if (ladderCache[key]) { return ladderCache[key]; }
      vals = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
      if (vals.indexOf(maxOff) < 0) { vals.push(maxOff); }
      ["low", "high", "g"].forEach(function(b) { var v = s.presets[b][st]; if (vals.indexOf(v) < 0) { vals.push(v); } });
      vals.sort(function(a, b) { return a - b; });
      vals.push(255);
      ladderCache[key] = vals.map(function(v) {
        var row = $gamedata.row(v), used = {}, notes = [];
        Object.keys(G.rank_stats).forEach(function(r) {
          var q = G.rank_stats[r][LADDER_KEY[st]];
          if (v >= q[1] && v <= q[3]) { used[bandOf(+r)] = true; }
        });
        ["low", "high", "g"].forEach(function(b) { if (used[b]) { notes.push(BAND_NAME[b]); } });
        return {
          v: v, row: row, mult: row ? row[col] : null, tol: row ? row.slice(3) : null,
          bands: notes,
          typical: ["low", "high", "g"].filter(function(b) { return s.presets[b][st] === v; }),
          maxOfficial: v === maxOff, tableMax: v === 140, byteMax: v === 255, min: v === 0
        };
      });
      return ladderCache[key];
    };
    s.row_class = function(i) {
      var c = s.calc;
      return { active: i === +c.hp || i === +c.atk || i === +c.res };
    };

    /* ------------------------------------------------------------ monsters */
    s.mf = { kind: "L", species: "", diff: "", search: "", sort: "name" };
    s.species_list = $gamedata.species();
    var monCache = { key: null, list: [] };
    s.monster_list = function() {
      var key = JSON.stringify(s.mf) + $i18n.current_locale(), l;
      if (monCache.key === key) { return monCache.list; }
      l = $gamedata.filterMonsters(s.mf).map(function(x) {
        x.base_hp = G.base_hp[x.id] || null;
        x.species_name = $gamedata.speciesName(x.m.species);
        return x;
      });
      l.sort(function(a, b) {
        if (s.mf.sort === "hp") { return (b.base_hp || 0) - (a.base_hp || 0); }
        if (s.mf.sort === "diff") { return (b.m.diff || 0) - (a.m.diff || 0) || (a.name < b.name ? -1 : 1); }
        return a.name < b.name ? -1 : 1;
      });
      monCache = { key: key, list: l };
      return l;
    };
    s.stars = function(n) { var t = "", i; for (i = 0; i < 5; i++) { t += i < n ? "★" : "☆"; } return t; };

    /* ------------------------------------------------------------ special */
    var special = [];
    Object.keys(G.special_usage).forEach(function(mid) {
      var u = G.special_usage[mid], vals = Object.keys(u);
      if (vals.length < 2 && vals[0] === "0") { return; }
      special.push({
        id: parseInt(mid, 10),
        name: $gamedata.monsterName(mid),
        kind: G.monsters[mid] ? G.monsters[mid].kind : "O",
        values: vals.map(function(v) {
          return {
            v: parseInt(v, 10),
            label: constants.special_mod[mid] && constants.special_mod[mid][v],
            n: u[v].n,
            quests: u[v].q.map(function(q) { return q[0] + " " + q[1]; })
          };
        }).sort(function(a, b) { return a.v - b.v; })
      });
    });
    special.sort(function(a, b) { return a.kind === b.kind ? (a.name < b.name ? -1 : 1) : (a.kind === "L" ? -1 : 1); });
    s.special = special;
    s.special_filter = { kind: "L" };

    /* ------------------------------------------------------------ quest ids */
    s.st = $citra.state ? $citra.state() : null;
    function inGame(qid) {
      try { return s.st && s.st.ok ? $citra.findQuest(qid) : null; } catch (e) { return null; }
    }
    s.id_cat = "event";
    var idCache = { key: null, list: [] };
    s.id_list = function() {
      var key = s.id_cat + ($i18n.current_locale());
      if (idCache.key !== key) {
        idCache = { key: key, list: $gamedata.idTable(s.id_cat, null, inGame).map(function(r) {
          r.req = r.restriction && r.restriction.length ? r.restriction.map(function(m) { return $gamedata.monsterName(m); }).join(", ") : "";
          return r;
        }) };
      }
      return idCache.list;
    };
    s.free_count = function() { return s.id_list().filter(function(r) { return r.free; }).length; };

    /* ------------------------------------------------------------ maps */
    s.maps = Object.keys(constants.maps).filter(function(m) { return +m > 0; }).map(function(m) {
      var areas = G.map_areas[m] || [], sp = G.spawns[m];
      return {
        id: +m,
        name: constants.maps[m],
        areas: areas,
        images: areas.filter(function(a) { return G.area_images.indexOf("m" + s.pad(m) + "a" + s.pad(a)) >= 0; }).length,
        templates: sp ? sp.templates.length : 0,
        points: sp ? Object.keys(sp.large).reduce(function(n, a) { return n + sp.large[a].length; }, 0) : 0
      };
    });

    /* ------------------------------------------------------------ hidden fields */
    s.scenarios = Object.keys(G.scenario_usage).map(function(k) {
      return { v: +k, quests: G.scenario_usage[k].map(function(q) { return q[0] + " " + q[1]; }) };
    }).sort(function(a, b) { return a.v - b.v; });
    s.header_fields = ["132", "136"].map(function(b) {
      return { offset: b, values: Object.keys(G.header_usage[b] || {}).map(function(k) {
        return { v: +k, quests: G.header_usage[b][k].map(function(q) { return q[0] + " " + q[1]; }) };
      }).sort(function(a, b2) { return a.v - b2.v; }) };
    });
  }]);
}();
