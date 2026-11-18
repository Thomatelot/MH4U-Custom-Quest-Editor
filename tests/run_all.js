// Runs every test of this folder.
// usage: node tests/run_all.js <folder holding quest1..quest5 and otomo1, e.g. one of your game backups>
// Tests that need the game files are skipped when no folder is given. Nothing is written.
var cp = require('child_process'), path = require('path'), fs = require('fs');
var dir = process.argv[2];
var withFiles = !!dir && fs.existsSync(path.join(dir, 'quest1'));
var tests = [
  ['test_library_collections.js', false],
  ['test_check.js', false],
  ['test_updater.js', false],
  ['test_core.js', true],
  ['test_mib_roundtrip.js', true],
  ['test_autoid.js', true]
];
var failed = 0;
tests.forEach(function (t) {
  if (t[1] && !withFiles) { console.log('-- skipped (no game files):', t[0]); return; }
  // Blowfish: test_core.js compares with OpenSSL, which needs the legacy provider on Node 17+
  var args = ['--openssl-legacy-provider', '--no-deprecation', path.join(__dirname, t[0])];
  if (t[1]) { args.push(dir); }
  var r = cp.spawnSync(process.execPath, args, { encoding: 'utf8' });
  var out = (r.stdout || '') + (r.stderr || '');
  var last = out.trim().split(/\r?\n/).pop();
  if (r.status !== 0) { failed++; console.log('FAIL', t[0]); console.log(out); }
  else { console.log('ok  ', t[0], '-', last); }
});
if (!withFiles) { console.log('Give a folder with quest1..quest5 and otomo1 to run all the tests.'); }
console.log(failed ? failed + ' test(s) failed' : 'all tests passed');
process.exit(failed ? 1 : 0);
