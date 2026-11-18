// node tests/test_library_collections.js : collections service (create / move / export scope / import marker / delete)
var load = require("./load_angular_module.js"), assert = require("assert");
var store = {}, ls = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
var f = load(__dirname + "/../source/app/utils/library.js", { localStorage: ls });
var mibMock = { decrypt: function (m) { return m; }, parse: function (m) { return { quest_id: 60001, title: m }; } };
var fn = f.$library[f.$library.length - 1], lib = fn(mibMock, {}, { get: function () { return false; } });
ls.setItem("index", "[]"); ls.setItem("index_otb", "[]");
// fake quests: entries straight into the index
["a", "b", "c"].forEach(function (u) { var idx = JSON.parse(ls.getItem("index")); idx.push({ uuid: u, hosted: false }); ls.setItem("index", JSON.stringify(idx)); });
var c1 = lib.addCollection("  Favourites ", "red"), c2 = lib.addCollection("Solo", "blue");
assert.strictEqual(c1.name, "Favourites");
assert.strictEqual(lib.addCollection("   ", "red"), null);
assert.strictEqual(lib.findCollectionByName("favourites").id, c1.id);
assert.strictEqual(lib.setCollection(["a", "b"], c1.id), 2);
assert.strictEqual(JSON.parse(ls.getItem("index")).filter(function (e) { return e.collection === c1.id; }).length, 2);
lib.moveCollection(c2.id, -1);
assert.strictEqual(lib.collections()[0].id, c2.id);
lib.setCollapsed(c1.id, true);
assert.strictEqual(lib.collections()[1].collapsed, true);
lib.updateCollection(c1.id, "Best", "green");
assert.strictEqual(lib.collections()[1].name, "Best");
lib.setGroupView(false);
assert.strictEqual(lib.collectionSettings().group, false);
// export one collection, then import it into an empty library: the collection is recreated (new quests get its id)
["a", "b", "c"].forEach(function (u) { ls.setItem(u, JSON.stringify({ mib: "MIB-" + u, json: { quest_id: 60001 } })); ls.setItem(u + ".json", JSON.stringify({ quest_id: 60001 })); });
var data = lib.backup(c1.id);
assert.strictEqual(data.substring(0, 4), "cmib");
lib.deleteCollection(c1.id); lib.clear();
assert.strictEqual(lib.import(data), 1);
var after = JSON.parse(ls.getItem("index")), cs = lib.collections();
assert.strictEqual(after.length, 2);
var rec = cs.filter(function (x) { return x.name === "Best"; })[0];
assert.ok(rec && rec.color === "green");
assert.ok(after.every(function (e) { return e.collection === rec.id; }));
// importing the same file again reuses the collection (no duplicate)
lib.import(data);
assert.strictEqual(lib.collections().filter(function (x) { return x.name === "Best"; }).length, 1);
lib.deleteCollection(rec.id);
assert.strictEqual(lib.collections().length, 1);
assert.strictEqual(JSON.parse(ls.getItem("index")).filter(function (e) { return e.collection; }).length, 0);
// a backup of the whole library keeps the collections: quests without one first, then each collection
store = {}; ls.setItem("index", "[]"); ls.setItem("index_otb", "[]");
["x", "y", "z"].forEach(function (u) {
  var idx = JSON.parse(ls.getItem("index")); idx.push({ uuid: u, hosted: false }); ls.setItem("index", JSON.stringify(idx));
  ls.setItem(u, JSON.stringify({ mib: "MIB-" + u, json: { quest_id: 60001 } })); ls.setItem(u + ".json", JSON.stringify({ quest_id: 60001 }));
});
var k1 = lib.addCollection("Hard", "red"); lib.addCollection("Empty", "blue");
lib.setCollection(["y"], k1.id);
var full = lib.backup();
lib.clear();
assert.strictEqual(lib.import(full), 1);
var idx2 = JSON.parse(ls.getItem("index"));
assert.strictEqual(idx2.length, 3);
assert.strictEqual(idx2.filter(function (e) { return e.collection === k1.id; }).length, 1);
assert.strictEqual(idx2.filter(function (e) { return !e.collection; }).length, 2);
assert.ok(lib.findCollectionByName("Empty"));
console.log("collections service: all assertions passed");
