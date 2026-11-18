// usage: node --openssl-legacy-provider test_check.js : consistency check of a quest (refills, objectives, id restriction, rewards)
var load = require('./load_angular_module.js'), fs = require('fs'), vm = require('vm'), assert = require('assert');
var ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../source/app/data/gamedata.js', 'utf8'), ctx);
global.window = ctx.window;
var f = load(__dirname + '/../source/app/utils/gamedata.js', { window: ctx.window });
var constants = { quest_restrictions: {}, special_mod: {}, quest_types: {}, objectives: {}, monsters: {}, items: {}, previews: {}, monsterid_to_previewid: {} };
var fac = f.$gamedata, gd = fac[fac.length - 1](constants, { current_locale: function () { return 'en'; } });
function q(extra) {
  var j = { quest_id: 60117, supplies: [[{ item_id: 1, qty: 1 }], [{ item_id: 2, qty: 1 }], [{ item_id: 3, qty: 1 }]],
    refills: [{ box: 3, condition: 3, monster: 0, qty: 0 }, { box: 1, condition: 1, monster: 0, qty: 0 }],
    objectives: [{ type: 1, target_id: 107, qty: 1 }, { type: 1, target_id: 0, qty: 1 }], objective_sub: { type: 0, target_id: 0, qty: 0 },
    large_monster_table: [[{ monster_id: 107 }], []], loot_a: [{ items: [{ chance: 60, item_id: 1, qty: 1 }] }], loot_b: [], loot_c: [] };
  for (var k in extra) { j[k] = extra[k]; }
  return j;
}
// the quest of the report: refill on a missing box + second objective without monster
var c = gd.checkQuest(q());
var keys = c.map(function (x) { return x.key; });
assert.ok(keys.indexOf('CHK_REFILL') >= 0, 'refill on a missing box');
assert.ok(keys.indexOf('CHK_OBJ_NONE') >= 0, 'objective without monster');
assert.ok(keys.indexOf('CHK_LOOT') >= 0, 'reward table not at 100');
assert.strictEqual(c.filter(function (x) { return x.level === 'error'; }).length, 2);
assert.strictEqual(c.filter(function (x) { return x.key === 'CHK_REFILL'; })[0].fix.last, 2, 'fix points to the last box');
// a coherent quest has no error
var ok = q({ refills: [{ box: 2, condition: 3, monster: 0, qty: 0 }, { box: 1, condition: 1, monster: 0, qty: 0 }], objectives: [{ type: 1, target_id: 107, qty: 1 }, { type: 0, target_id: 0, qty: 0 }],
  loot_a: [{ items: [{ chance: 100, item_id: 1, qty: 1 }] }] });
assert.strictEqual(gd.checkQuest(ok).length, 0);
// unused refills are fine
assert.strictEqual(gd.checkQuest(q({ refills: [{ box: 0, condition: 0, monster: 0, qty: 0 }, { box: 0, condition: 0, monster: 0, qty: 0 }], objectives: ok.objectives, loot_a: ok.loot_a })).length, 0);
// restricted id with other monsters
var r = gd.checkQuest(q({ quest_id: 60002, refills: ok.refills, objectives: ok.objectives, loot_a: ok.loot_a }));
assert.ok(r.some(function (x) { return x.key === 'CHK_ID_RESTRICT' && x.level === 'error'; }), '60002 only accepts Brachydios / Gore Magala');
// objective on a monster absent from the quest = warning only
var w = gd.checkQuest(q({ refills: ok.refills, objectives: [{ type: 1, target_id: 2, qty: 1 }, { type: 0, target_id: 0, qty: 0 }], loot_a: ok.loot_a }));
assert.ok(w.length === 1 && w[0].level === 'warn' && w[0].key === 'CHK_OBJ_ABSENT');
console.log('quest check OK');
