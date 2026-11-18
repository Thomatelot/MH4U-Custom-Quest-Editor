// node tests/test_updater.js : version comparison, release notes and the check of a downloaded exe (no network)
var load = require('./load_angular_module.js'), assert = require('assert'), zlib = require('zlib'), fs = require('fs'), path = require('path');
var f = load(__dirname + '/../source/app/utils/updater.js', { window: {} });
var fac = f.$updater, up = fac[fac.length - 1]({ versionString: 'v1.0.0' });

// versions
assert.strictEqual(up._cmpVersions('1.0.1', '1.0.0'), 1);
assert.strictEqual(up._cmpVersions('1.0.0', '1.0.0'), 0);
assert.strictEqual(up._cmpVersions('0.9.9', '1.0.0'), -1);
assert.strictEqual(up._cmpVersions('1.10.0', '1.9.3'), 1);
assert.strictEqual(up._cmpVersions('v2.0.0', '1.9.9'), 1);
assert.strictEqual(up.current(), '1.0.0');

// release notes: only the sections newer than the running version
var log = '# Changelog\n\nintro\n\n## 1.2.0\n\n* two\n\n## 1.1.0\n\n* one\n\n## 1.0.0\n\n* first\n';
var notes = up._newerNotes(log, '1.0.0');
assert.strictEqual(JSON.stringify(notes.map(function (n) { return n.version; })), '["1.2.0","1.1.0"]');
assert.strictEqual(notes[0].text, '* two');
assert.strictEqual(up._newerNotes(log, '1.2.0').length, 0);

// an exe = runtime + appended zip: the editor's package.json is found (stored or deflated)
function zipWith(name, data, deflate) {
  var body = deflate ? zlib.deflateRawSync(data) : data, n = Buffer.from(name);
  var lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(deflate ? 8 : 0, 8);
  lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(n.length, 26);
  var cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(deflate ? 8 : 0, 10);
  cd.writeUInt32LE(body.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(n.length, 28); cd.writeUInt32LE(0, 42);
  var local = Buffer.concat([lh, n, body]), central = Buffer.concat([cd, n]);
  var eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12); eocd.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, central, eocd]);
}
var stub = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(5000, 7)]);
var pkg = Buffer.from(JSON.stringify({ name: 'mh4u-quest-editor', version: '1.2.0' }));
[false, true].forEach(function (d) {
  var info = up._appInfo(Buffer.concat([stub, zipWith('package.json', pkg, d)]));
  assert.strictEqual(JSON.stringify(info), JSON.stringify({ name: 'mh4u-quest-editor', version: '1.2.0' }));
});
assert.strictEqual(up._appInfo(Buffer.concat([stub, zipWith('index.html', pkg, true)])), null);
assert.strictEqual(up._appInfo(stub), null);

// the exe of the repository, when it is there
var exe = path.join(__dirname, '..', 'MH4U Quest Editor.exe');
if (fs.existsSync(exe)) {
  var real = up._appInfo(fs.readFileSync(exe)), pj = require('../source/package.json');
  assert.strictEqual(real.name, 'mh4u-quest-editor');
  assert.strictEqual(real.version, pj.version, 'the exe at the root is built from source/ (run tools/build_exe.py)');
  console.log('exe of the repository: version', real.version);
}
console.log('updater: all assertions passed');
