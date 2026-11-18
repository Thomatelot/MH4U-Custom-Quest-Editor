// usage: node --openssl-legacy-provider test_core.js <folder containing quest1..quest5 and otomo1>
var core = require('../source/app/utils/citra_core.js');
var fs = require('fs'), crypto = require('crypto'), path = require('path');
var dir = (process.argv[2] || '.') + path.sep;
function eq(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
var ok = true;
// 1. Blowfish vs OpenSSL (big-endian standard test via byte swapping)
var bf = new core.Blowfish('AgK2DYheaCjyHGPB');
var data = crypto.randomBytes(64);
var mine = new Uint8Array(data); bf.encryptLE(mine);
function bswap(b){var o=Buffer.alloc(b.length);for(var i=0;i<b.length;i+=4){o[i]=b[i+3];o[i+1]=b[i+2];o[i+2]=b[i+1];o[i+3]=b[i];}return o;}
var c = crypto.createCipheriv('bf-ecb', Buffer.from('AgK2DYheaCjyHGPB'), null); c.setAutoPadding(false);
var ref = bswap(Buffer.concat([c.update(bswap(data)), c.final()]));
console.log('blowfish matches openssl:', eq(mine, ref)); ok = ok && eq(mine, ref);
// 2. packs
['quest1','quest2','quest3','quest4','quest5'].forEach(function (n) {
  var raw = new Uint8Array(fs.readFileSync(dir + n));
  var p = core.decodeQuestPackFile(raw);
  var used = p.slots.filter(function (s) { return !s.empty; });
  var re = core.encodeQuestPackFile(p, p.seed);
  var same = eq(re, raw);
  console.log(n, 'checksum', p.checksumOk, 'quests', used.length, 'byte-exact re-encode', same, 'ids', used[0] && used[0].questId, '..', used.length && used[used.length-1].questId);
  ok = ok && same && p.checksumOk;
});
var o = core.decodeOtomoPackFile(new Uint8Array(fs.readFileSync(dir + 'otomo1')));
var used = o.slots.filter(function (s) { return !s.empty; });
var reo = core.encodeOtomoPackFile(o, o.seed);
console.log('otomo1 checksum', o.checksumOk, 'palicos', used.map(function(s){return s.index+':'+s.name;}), 'byte-exact', eq(reo, new Uint8Array(fs.readFileSync(dir + 'otomo1'))));
// 3. placement
var packs = {}; ['quest1','quest2','quest3','quest4','quest5'].forEach(function (n) { packs[n] = core.decodeQuestPackFile(new Uint8Array(fs.readFileSync(dir + n))); });
console.log('place 60013 ->', JSON.stringify(core.findSlotFor(packs, 60013)));
console.log('place 60500 ->', JSON.stringify(core.findSlotFor(packs, 60500)));
console.log('place 61500 ->', JSON.stringify(core.findSlotFor(packs, 61500)));
console.log('place 62500 ->', JSON.stringify(core.findSlotFor(packs, 62500)));
console.log(ok ? 'ALL OK' : 'FAIL');
