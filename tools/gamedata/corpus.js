// Collects every official quest into corpus.json, the main input of build_data.py.
// usage: node corpus.js <folder of the game's base quests (*.mib)> <folder holding quest1..quest5> <work folder>
//   - base quests: the .mib files of the quests on the game card (romfs quest archives, extracted);
//   - quest1..quest5: the event / challenge / episodic quests the game downloaded (a game backup of the
//     editor will do). Custom quests found there are left out later by build_data.py (wiki title lists).
var path = require('path'), fs = require('fs');
var SRC = path.join(__dirname, '..', '..', 'source', 'app', 'utils');
var core = require(path.join(SRC, 'citra_core.js'));
var mib = require(path.join(__dirname, '..', '..', 'tests', 'load_angular_module.js'))(path.join(SRC, 'mib.js')).$mib();
var baseDir = process.argv[2], packDir = process.argv[3], work = process.argv[4];
if (!baseDir || !packDir || !work) { console.log('usage: node corpus.js <base quests folder> <quest1..quest5 folder> <work folder>'); process.exit(1); }
var out = [];
fs.readdirSync(baseDir).sort().forEach(function (f) {
  if (!/\.mib$/i.test(f)) { return; }
  var s = fs.readFileSync(path.join(baseDir, f)).toString('binary');
  try { var j = mib.parse(s); j._src = 'base'; out.push(j); } catch (e) { console.log('fail', f, e.message); }
});
['quest1', 'quest2', 'quest3', 'quest4', 'quest5'].forEach(function (p) {
  var pack = core.decodeQuestPackFile(new Uint8Array(fs.readFileSync(path.join(packDir, p))));
  pack.slots.forEach(function (s) { if (!s.empty) { var j = mib.parse(s.mib); j._src = 'event'; out.push(j); } });
});
fs.writeFileSync(path.join(work, 'corpus.json'), JSON.stringify(out));
console.log(out.length, 'quests ->', path.join(work, 'corpus.json'));
