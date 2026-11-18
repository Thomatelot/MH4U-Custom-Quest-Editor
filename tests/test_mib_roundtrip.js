// parse -> export -> parse for every quest found in the game's extdata packs
// usage: node test_mib_roundtrip.js <folder containing quest1..quest5>
var core = require('../source/app/utils/citra_core.js'), fs = require('fs'), path = require('path');
var load = require('./load_angular_module.js');
var mib = load(__dirname + '/../source/app/utils/mib.js').$mib();
var dir = (process.argv[2] || '.') + path.sep;
var n = 0, bad = 0, maxlen = 0, over = 0, smaller = 0, sumO = 0, sumN = 0;
var PTR = {}; [0,1,2,3,8,9,10,11].concat([28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51]).forEach(function(i){PTR[i]=1;});
function strip(j) { var c = JSON.parse(JSON.stringify(j)); delete c.raw_header; delete c.raw_quest; return c; }
['quest1','quest2','quest3','quest4','quest5'].forEach(function (p) {
  var pack = core.decodeQuestPackFile(new Uint8Array(fs.readFileSync(dir + p)));
  pack.slots.forEach(function (s) {
    if (s.empty) return; n++;
    var j = mib.parse(s.mib), out = mib['export'](j), j2 = mib.parse(out);
    maxlen = Math.max(maxlen, out.length); if (out.length > 8192) over++; if (out.length <= s.mib.length) smaller++;
    sumO += s.mib.length; sumN += out.length;
    var a = JSON.stringify(strip(j)), b = JSON.stringify(strip(j2));
    var hdrOk = j.raw_header.every(function (v, i) { return PTR[i] || v === j2.raw_header[i]; });
    var qOk = j.raw_quest.every(function (v, i) { return (i >= 28 && i < 32) || v === j2.raw_quest[i]; });
    if (a !== b || !hdrOk || !qOk) { bad++; if (bad < 4) { console.log('MISMATCH', s.questId, hdrOk, qOk); var x=strip(j), y=strip(j2); for (var k in x) if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) console.log('  field', k, JSON.stringify(x[k]).slice(0,160), '=>', JSON.stringify(y[k]).slice(0,160)); } }
    // export is deterministic
    if (mib['export'](j2) !== out) { bad++; console.log('non deterministic', s.questId); }
  });
});
console.log('quests', n, 'mismatches', bad, 'max size', maxlen, 'over 8192:', over, 'not bigger than original:', smaller + '/' + n, 'total', sumO, '->', sumN);
process.exit(bad ? 1 : 0);
