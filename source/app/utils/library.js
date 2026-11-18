! function() {
  function v1() {
    var v1 = (new Date).getTime(),
      v2 = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" ["replace"](/[xy]/g, function(v2) {
        var v3 = (v1 + 16 * Math.random()) % 16 | 0;
        return v1 = Math.floor(v1 / 16), ("x" == v2 ? v3 : 3 & v3 | 8).toString(16)
      });
    return v2
  }

  function v2(v1, v2) {
    for (var v3 = v1.split("\n"), v4 = ""; v3.length < v2;) {
      v3.push("")
    };
    for (; v3.length > v2;) {
      v3.pop()
    };
    for (var v5 = 0; v2 > v5; v5++) {
      v4 += "|" + v3[v5]
    };
    return v4
  }

  function v3(v1) {
    for (var v2, v3 = "", v4 = 0; v4 < v1.length; v4++) {
      v2 = v1[v4].charCodeAt(0), v3 += v2 > 255 ? "?" : String.fromCharCode(v2)
    };
    return v3
  }

  function v4(v1) {
    var v4 = "";
    return v4 += "2015050128", v4 += "|" + v1.quest_id, v4 += "|" + v3(v1.text[0][0]), v4 += "|0", v4 += "|" + v1.quest_rank, v4 += "|0", v4 += "|" + v1.map_id, v4 += "|" + v1.time, v4 += "|" + v1.reward_main, v4 += "|" + v1.fee, v4 += "|" + v1.pictures[0], v4 += "|" + v1.pictures[1], v4 += "|" + v1.pictures[2], v4 += "|" + v1.pictures[3], v4 += "|" + v1.pictures[4], v4 += "|" + v1.requirements[0], v4 += "|" + v1.requirements[1], v4 += v2(v3(v1.text[0][1]), 2), v4 += "|" + v3(v1.text[0][6]), v4 += v2(v3(v1.text[0][2]), 2), v4 += v2(v3(v1.text[0][4]), 2), v4 += "|" + v3(v1.text[0][5]), v4 += v2(v3(v1.text[0][3]), 7), v4 += "\n"
  }

  function v5(v1, v2) {
    var v4 = "";
    return v4 += "2015030602", v4 += "|" + v2, v4 += "|" + v3(v1.owner), v4 += "|" + v3(v1.name), v4 += "|" + v1.level, v4 += "|1", v4 += "|" + v1.ability, v4 += "|" + v1.skill1, v4 += "|" + v1.skill2, v4 += "|" + v1.skill3, v4 += "|" + v1.skill4, v4 += "|" + v1.skill5, v4 += "|" + v1.skillSig, v4 += "|" + v1.teamAtk, v4 += "|" + v1.coat, v4 += "|" + v3(v1.shout), v4 += "\n"
  }
  function cleanName(n) { return String(n === undefined || n === null ? "" : n).replace(/\s+/g, " ").trim().substring(0, 40); }
  function readColl() {
    var c;
    try { c = JSON.parse(localStorage.getItem("collections")); } catch (e) { c = null; }
    if (!c || !Array.isArray(c.list)) { c = { v: 1, group: true, list: [] }; }
    return c;
  }
  function writeColl(c) { localStorage.setItem("collections", JSON.stringify(c)); }
  var v6 = angular.module("editor.utils.library", ["editor.utils.mib", "editor.utils.otb", "editor.utils.eastereggs"]),
    v7 = require("zlib");
  v6.factory("$library", ["$mib", "$otb", "$eastereggs", function(v2, v3, v6) {
    var v8 = {
      "import": function(v1) {
        if ("cmib" === v1.substring(0, 4)) {
          try {
            var v4 = Buffer(v1.substring(4, v1.length), "binary"),
              v5 = JSON.parse(v7.inflateSync(v4)),
              cur = null;
            v5.forEach(function(v1) {
              if (v1 && "object" == typeof v1) {          // {collection: "name"}: the next quests belong to that collection
                if (v1.collection) {                       // ({collection: null}: the next ones belong to none)
                  var f = v8.findCollectionByName(v1.collection) || v8.addCollection(v1.collection, v1.color);
                  cur = f ? f.id : null
                } else { cur = null }
                return
              };
              var r = v8.import(v1);
              1 === r && cur && v8.lastUuid && v8.setCollection([v8.lastUuid], cur)
            })
          } catch (v6) {
            return -1
          }
          return 1
        };
        var v9 = v2.decrypt(v1);
        if (null !== v9) {
          return v8.insert(v9)
        };
        var va = v3.decrypt(v1);
        return null !== va ? v8.insert_otb(va) : -1
      },
      insert: function(v3) {
        var v4 = JSON.parse(localStorage.getItem("index")),
          v5 = v1(),
          v7 = v2.parse(v3);
        return 0 !== v7.quest_id && (6e4 > v7.quest_id || v7.quest_id >= 63e3) && !v6.get("devmode") ? -2 : (v8.lastUuid = v5, v4.push({
          uuid: v5,
          hosted: !1,
          collection: v8.insertInto || null
        }), localStorage.setItem(v5, JSON.stringify({
          mib: v3,
          json: v7
        })), localStorage.setItem(v5 + ".json", JSON.stringify(v7)), localStorage.setItem("index", JSON.stringify(v4)), 1)
      },
      insert_otb: function(v2) {
        var v4 = JSON.parse(localStorage.getItem("index_otb")),
          v5 = v1(),
          v6 = v3.parse(v2);
        return v4.push({
          uuid: v5,
          hosted: !1
        }), localStorage.setItem(v5, JSON.stringify({
          otb: v2,
          json: v6
        })), localStorage.setItem(v5 + ".json", JSON.stringify(v6)), localStorage.setItem("index_otb", JSON.stringify(v4)), 1
      },
      "delete": function(v1) {
        for (var v2, v3 = JSON.parse(localStorage.getItem("index")), v4 = 0; v4 < v3.length; v4++) {
          if (v3[v4].uuid === v1) {
            v2 = v4;
            break
          }
        };
        v2 > -1 && v3.splice(v2, 1), localStorage.removeItem(v1), localStorage.removeItem(v1 + ".json"), localStorage.setItem("index", JSON.stringify(v3))
      },
      delete_otb: function(v1) {
        for (var v2, v3 = JSON.parse(localStorage.getItem("index_otb")), v4 = 0; v4 < v3.length; v4++) {
          if (v3[v4].uuid === v1) {
            v2 = v4;
            break
          }
        };
        v2 > -1 && v3.splice(v2, 1), localStorage.removeItem(v1), localStorage.removeItem(v1 + ".json"), localStorage.setItem("index_otb", JSON.stringify(v3))
      },
      get: function(v1) {
        return JSON.parse(localStorage.getItem(v1))
      },
      update: function(v1, v3) {
        var v4 = v2.parse(v3);
        localStorage.setItem(v1, JSON.stringify({
          mib: v3,
          json: v4
        })), localStorage.setItem(v1 + ".json", JSON.stringify(v4))
      },
      update_otb: function(v1, v2) {
        var v4 = v3.parse(v2);
        localStorage.setItem(v1, JSON.stringify({
          otb: v2,
          json: v4
        })), localStorage.setItem(v1 + ".json", JSON.stringify(v4))
      },
      persistHosted: function(v1) {
        for (var v2 = JSON.parse(localStorage.getItem("index")), v3 = 0; v3 < v1.length; v3++) {
          v2[v3].hosted = v1[v3].hosted
        };
        localStorage.setItem("index", JSON.stringify(v2))
      },
      persistPalicoHosted: function(v1) {
        for (var v2 = JSON.parse(localStorage.getItem("index_otb")), v3 = 0; v3 < v1.length; v3++) {
          v2[v3].hosted = v1[v3].hosted
        };
        localStorage.setItem("index_otb", JSON.stringify(v2))
      },
      /* ---------------------------------------------------------- collections (Citra edition)
       * user-defined groups of quests: localStorage "collections" = { v, group, list: [{ id, name, color, collapsed }] },
       * the collection of a quest is stored on its index entry (index[i].collection). A quest is in one collection or in none.
       */
      collections: function() { return readColl().list; },
      collectionSettings: function() { var c = readColl(); return { group: c.group !== false }; },
      setGroupView: function(on) { var c = readColl(); c.group = !!on; writeColl(c); },
      addCollection: function(name, color) {
        var c = readColl(), n = cleanName(name), item;
        if (!n) { return null; }
        item = { id: "c" + v1().substring(0, 8), name: n, color: color || "blue", collapsed: false };
        c.list.push(item);
        writeColl(c);
        return item;
      },
      findCollectionByName: function(name) {
        var n = cleanName(name).toLowerCase(), l = readColl().list, i;
        for (i = 0; i < l.length; i++) { if (l[i].name.toLowerCase() === n) { return l[i]; } }
        return null;
      },
      updateCollection: function(id, name, color) {
        var c = readColl(), n = cleanName(name), i;
        for (i = 0; i < c.list.length; i++) {
          if (c.list[i].id === id) {
            if (n) { c.list[i].name = n; }
            if (color) { c.list[i].color = color; }
            writeColl(c);
            return true;
          }
        }
        return false;
      },
      setCollapsed: function(id, on) {
        var c = readColl(), i;
        for (i = 0; i < c.list.length; i++) { if (c.list[i].id === id) { c.list[i].collapsed = !!on; } }
        writeColl(c);
      },
      moveCollection: function(id, dir) {
        var c = readColl(), i, j, t;
        for (i = 0; i < c.list.length; i++) { if (c.list[i].id === id) { break; } }
        j = i + dir;
        if (i >= c.list.length || j < 0 || j >= c.list.length) { return; }
        t = c.list[i]; c.list[i] = c.list[j]; c.list[j] = t;
        writeColl(c);
      },
      // the quests of a deleted collection are kept, they just become unsorted
      deleteCollection: function(id) {
        var c = readColl(), idx = JSON.parse(localStorage.getItem("index")), i;
        c.list = c.list.filter(function(x) { return x.id !== id; });
        writeColl(c);
        for (i = 0; i < idx.length; i++) { if (idx[i].collection === id) { idx[i].collection = null; } }
        localStorage.setItem("index", JSON.stringify(idx));
      },
      // uuids: array of quest uuids; id: collection id or null (unsorted)
      setCollection: function(uuids, id) {
        var idx = JSON.parse(localStorage.getItem("index")), i, n = 0;
        for (i = 0; i < idx.length; i++) {
          if (uuids.indexOf(idx[i].uuid) >= 0) { idx[i].collection = id || null; n++; }
        }
        localStorage.setItem("index", JSON.stringify(idx));
        return n;
      },
      list: function() {
        var v1 = JSON.parse(localStorage.getItem("index")),
          v2 = [];
        return v1.forEach(function(v1) {
          var v3 = JSON.parse(localStorage.getItem(v1.uuid + ".json"));
          v3 ? v1.json = v3 : (v1.json = JSON.parse(localStorage.getItem(v1.uuid)).json, localStorage.setItem(v1.uuid + ".json", JSON.stringify(v1.json))), v2.push(v1)
        }), v2
      },
      list_otb: function() {
        var v1 = JSON.parse(localStorage.getItem("index_otb")),
          v2 = [];
        return v1.forEach(function(v1) {
          var v3 = JSON.parse(localStorage.getItem(v1.uuid + ".json"));
          v3 ? v1.json = v3 : (v1.json = JSON.parse(localStorage.getItem(v1.uuid)).json, localStorage.setItem(v1.uuid + ".json", JSON.stringify(v1.json))), v2.push(v1)
        }), v2
      },
      clear: function() {
        var v1 = JSON.parse(localStorage.getItem("index"));
        v1.forEach(function(v1) {
          localStorage.removeItem(v1.uuid), localStorage.removeItem(v1.uuid + ".json")
        }), localStorage.setItem("index", "[]")
      },
      clear_otb: function() {
        var v1 = JSON.parse(localStorage.getItem("index_otb"));
        v1.forEach(function(v1) {
          localStorage.removeItem(v1.uuid), localStorage.removeItem(v1.uuid + ".json")
        }), localStorage.setItem("index_otb", "[]")
      },
      // scope: undefined = the whole library, or a collection id (then the file starts with the collection's name)
      backup: function(scope) {
        var v1 = [], c, all = v8.list(), known = {};
        if (scope) {
          c = readColl().list.filter(function(x) { return x.id === scope })[0];
          c && v1.push({ collection: c.name, color: c.color });
          all.forEach(function(v2) { v2.collection === scope && v1.push(v8.get(v2.uuid).mib) })
        } else {
          // whole library: the quests without a collection first, then each collection (empty ones too)
          // with its quests, so that restoring the file brings the collections back
          readColl().list.forEach(function(x) { known[x.id] = true });
          all.forEach(function(v2) { (!v2.collection || !known[v2.collection]) && v1.push(v8.get(v2.uuid).mib) });
          readColl().list.forEach(function(x) {
            v1.push({ collection: x.name, color: x.color });
            all.forEach(function(v2) { v2.collection === x.id && v1.push(v8.get(v2.uuid).mib) })
          })
        };
        var v2 = JSON.stringify(v1);
        return v2 = v7.deflateSync(v2).toString("binary"), v2 = "cmib" + v2
      },
      generateIndex: v4,
      generatePalicoIndex: v5
    };
    return v8
  }]), v6.config(function() {
    null === localStorage.getItem("index") && localStorage.setItem("index", "[]"), null === localStorage.getItem("index_otb") && localStorage.setItem("index_otb", "[]")
  })
}()