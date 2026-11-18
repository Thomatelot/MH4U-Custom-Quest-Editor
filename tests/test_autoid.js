// usage: node --openssl-legacy-provider test_autoid.js <folder containing quest1..quest5>
// checks: quest id rewrite of a mib, automatic id choice against the real game files, game data sanity
var core = require('../source/app/utils/citra_core.js');
var load = require('./load_angular_module.js');
var fs = require('fs'), vm = require('vm'), assert = require('assert');
var dir = (process.argv[2] || '.').replace(/\/?$/, '/');

// game data + $gamedata with stubbed constants / i18n
var ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../source/app/data/gamedata.js', 'utf8'), ctx);
global.window = ctx.window;
var f = load(__dirname + '/../source/app/utils/gamedata.js', { window: ctx.window });
// the module reads window.MH4U_GAMEDATA at load time: expose it to its context
var constants = { quest_restrictions: {}, special_mod: {}, quest_types: {}, objectives: {}, monsters: {}, items: {}, previews: {}, monsterid_to_previewid: {} };
var fac = f.$gamedata;
if (!fac) { throw new Error('$gamedata factory not found'); }
var gd = fac[fac.length - 1](constants, { current_locale: function () { return 'en'; } });

// 1. game data
var G = gd.G;
assert.strictEqual(G.diff_table.length, 141);
assert.strictEqual(G.diff_table[130][1], 18);
assert.strictEqual(G.diff_table[20][0], 0.7);
assert.strictEqual(G.base_hp[2], 4200);
assert.ok(G.area_images.length > 100, 'area images');
assert.strictEqual(gd.stats({ hp: 20, atk: 130, break_res: 110 }, 2).hp, 2940);
console.log('stats OK: Rathalos HP 20 ->', gd.stats({ hp: 20, atk: 130, break_res: 110 }, 2).hp);

// 2. mib id rewrite
var mib = load(__dirname + '/../source/app/utils/mib.js').$mib();
var packs = {};
['quest1', 'quest2', 'quest3', 'quest4', 'quest5'].forEach(function (n) {
  packs[n] = core.decodeQuestPackFile(new Uint8Array(fs.readFileSync(dir + n)));
  packs[n].slots.forEach(function (s) { if (!s.empty) { s.json = mib.parse(s.mib); } });
});
var any = null;
Object.keys(packs).forEach(function (n) { packs[n].slots.forEach(function (s) { if (!s.empty && !any) { any = s; } }); });
var m2 = core.setMibQuestId(any.mib, 60007);
assert.strictEqual(core.mibQuestId(core.toU8(m2)), 60007);
assert.strictEqual(m2.length, any.mib.length);
var diff = 0; for (var i = 0; i < m2.length; i++) { if (m2.charCodeAt(i) !== any.mib.charCodeAt(i)) { diff++; } }
assert.ok(diff <= 2, 'only the id bytes change');
console.log('id rewrite OK:', any.questId, '-> 60007,', diff, 'bytes changed');

// 3. automatic id against the real game
function inGame(q) {
  var r = null;
  Object.keys(packs).forEach(function (n) { packs[n].slots.forEach(function (s) { if (!s.empty && s.questId === q) { r = s; } }); });
  return r;
}
function quest(mons) { return { large_monster_table: [mons.map(function (m) { return { monster_id: m }; })] }; }
var table = gd.idTable('event', null, inGame);
var free = table.filter(function (r) { return r.free; }).map(function (r) { return r.id; });
var officialIds = table.filter(function (r) { return r.official; }).map(function (r) { return r.id; });
var customIds = table.filter(function (r) { return r.custom; }).map(function (r) { return r.id; });
console.log('event ids: free', free.length, '| official', officialIds.length, '| custom', customIds.length, customIds.join(' '));
// a quest of the game whose title is not on the wiki lists is one of your own (custom)
customIds.forEach(function (id) { var s = inGame(id); assert.ok(s && !gd.isOfficialSlot(id, s), 'custom ' + id); });
// two official titles are spelled differently on the wiki: still official (when the save has them)
[60113, 60203].forEach(function (id) { if (inGame(id)) { assert.ok(officialIds.indexOf(id) >= 0, 'wiki spelling variant ' + id); } });
var cases = [[2], [1, 2], [48], [26, 95], [117], [7]];
var freeUnr = table.filter(function (r) { return r.free && r.known && r.unrestricted; }).map(function (r) { return r.id; });
var freeCond = table.filter(function (r) { return r.free && !(r.known && r.unrestricted); }).map(function (r) { return r.id; });
cases.forEach(function (c) {
  var a = gd.autoId(quest(c), inGame, {}, 'event');
  assert.ok(a, 'an id is found');
  if (a.how === 'free_matching') { assert.ok(free.indexOf(a.id) >= 0, 'free id matching the monsters'); }
  else if (a.how === 'free_unrestricted') { assert.ok(freeUnr.indexOf(a.id) >= 0); }
  else { assert.ok(customIds.indexOf(a.id) >= 0 || freeCond.indexOf(a.id) >= 0); }
});
// free ids without condition (or whose conditions the quest meets) first, then your own quests, and a free id with
// other conditions only when nothing else is left
var taken = {}, n = 0, a;
while ((a = gd.autoId(quest([2]), inGame, taken, 'event')) && (a.how === 'free_unrestricted' || a.how === 'free_matching')) { taken[a.id] = true; n++; }
if (customIds.length) {
  assert.ok(a && a.how === 'replace_custom', 'then a custom quest is replaced');
  assert.ok(customIds.indexOf(a.id) >= 0 && officialIds.indexOf(a.id) < 0, 'only customs are replaced');
}
var cn = 0;
while ((a = gd.autoId(quest([2]), inGame, taken, 'event')) && a.how === 'replace_custom') { assert.ok(customIds.indexOf(a.id) >= 0); taken[a.id] = true; cn++; }
assert.strictEqual(cn, customIds.length, 'every custom quest is proposed before a conditional free id');
assert.ok(!a || (a.how === 'free' && freeCond.indexOf(a.id) >= 0), 'conditional free ids come last');
// official ids are never proposed, whatever is taken
for (var k = 0; k < 40; k++) { var x = gd.autoId(quest([2]), inGame, taken, 'event'); if (!x) { break; } assert.ok(officialIds.indexOf(x.id) < 0); taken[x.id] = true; }
assert.strictEqual(gd.autoId(quest([2]), inGame, taken, 'event'), null, 'nothing left when only official quests remain');
console.log('auto id OK:', n, 'free ids without condition first, then', cn, 'customs, then conditional free ids');
// official slots are recognised
var off = 0, tot = 0;
Object.keys(packs).forEach(function (n) { packs[n].slots.forEach(function (s) { if (!s.empty && G.official_event_quests[s.questId]) { tot++; if (gd.isOfficialSlot(s.questId, s)) { off++; } } }); });
console.log('official quests recognised in the game:', off + '/' + tot);
assert.strictEqual(off, tot);
assert.strictEqual(Object.keys(G.official_event_quests).length, 120);
// a copy of an official quest is recognised as such (can go back to its own slot)
var o1 = inGame(officialIds[0]); assert.ok(gd.isOfficialCopy(o1.json));
if (customIds.length) { var c1 = inGame(customIds[0]); assert.ok(!gd.isOfficialCopy(c1.json)); }
// 4. rewards auto-fill
var lf = gd.lootFor([2], 'high', 'a');
var ids = function (r) { return r.items.map(function (i) { return i.item_id; }); };
assert.ok(ids(gd.lootFor([2], 'g', 'a')).indexOf(1279) >= 0 || ids(gd.lootFor([2], 'g', 'b')).indexOf(1279) >= 0 || ids(gd.lootFor([2], 'g', 'c')).indexOf(1279) >= 0, 'rare Rathalos mantle in G rank');
assert.ok(ids(gd.lootFor([44], 'g', 'a')).some(function (i) { return G.items[i].fr.indexOf('Pallium') === 0 || G.items[i].fr.indexOf('Gemme') === 0; }), 'rare Brachydios items');
assert.ok(ids(gd.lootFor([48], 'high', 'a')).every(function (i) { return !G.items[i].m || G.items[i].m.indexOf(48) >= 0; }), 'no foreign monster materials');
assert.ok(lf.items.length >= 5 && lf.items.length <= 14);
assert.strictEqual(lf.items.reduce(function (a, i) { return a + i.chance; }, 0), 100);
assert.ok(lf.items.every(function (i) { return i.qty >= 1 && i.chance >= 1; }));
var lf2 = gd.lootFor([2, 1], 'g', 'b'); assert.strictEqual(lf2.items.reduce(function (a, i) { return a + i.chance; }, 0), 100);
var lf3 = gd.lootFor([9999], 'low', 'a'); assert.ok(lf3.generic && lf3.items.length > 0);
assert.strictEqual(JSON.stringify(gd.huntedMonsters({ objectives: [{ type: 257, target_id: 2 }, { type: 0, target_id: 0 }], objective_sub: { type: 129, target_id: 7 } })), '[2,7]');
console.log('loot fill OK: Rathalos high rank A ->', JSON.stringify(lf.items.slice(0, 4)), 'n=' + lf.n);
console.log('ALL OK');
