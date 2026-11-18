// Fake NW.js / node environment so the editor can be exercised in a normal browser.
(function () {
  var FS = window.__FS = {};          // path -> Uint8Array
  var DIRS = window.__DIRS = {};      // dir path -> true
  function norm(p) { p = String(p).replace(/\\/g, '/').replace(/\/+/g, '/'); if (p.length > 1) p = p.replace(/\/$/, ''); return p; }
  function addDir(p) { p = norm(p); while (p && p !== '/' && !DIRS[p]) { DIRS[p] = true; p = p.substring(0, p.lastIndexOf('/')) || '/'; } DIRS['/'] = true; }
  function load(url) { var x = new XMLHttpRequest(); x.open('GET', url, false); x.overrideMimeType('text/plain; charset=x-user-defined'); x.send(); var s = x.responseText, u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xff; return u; }
  var listing = JSON.parse(new TextDecoder().decode(load('/fixture/listing.json')));
  listing.forEach(function (f) { FS[norm(f.path)] = load('/fixture/' + f.src); addDir(f.path.substring(0, f.path.lastIndexOf('/'))); });
  addDir('/editor');

  function Buf(a, enc) {
    var u;
    if (typeof a === 'number') u = new Uint8Array(a);
    else if (typeof a === 'string') { u = new Uint8Array(a.length); for (var i = 0; i < a.length; i++) u[i] = a.charCodeAt(i) & 0xff; }
    else u = new Uint8Array(a);
    u.toString = function (e) { if (e === 'binary' || e === 'latin1') { var s = ''; for (var i = 0; i < this.length; i++) s += String.fromCharCode(this[i]); return s; } return new TextDecoder().decode(this); };
    return u;
  }
  window.Buffer = Buf;
  window.process = { platform: 'win32', arch: 'x64', execPath: '/editor/editor.exe', env: { APPDATA: '/appdata', USERPROFILE: '/home/user' } };
  function statOf(p) { p = norm(p); if (DIRS[p]) return { isDirectory: function () { return true; }, size: 0 }; if (FS[p]) return { isDirectory: function () { return false; }, size: FS[p].length }; var e = new Error('ENOENT ' + p); e.code = 'ENOENT'; throw e; }
  var fs = {
    statSync: statOf,
    existsSync: function (p) { try { statOf(p); return true; } catch (e) { return false; } },
    readdirSync: function (p) { p = norm(p); if (!DIRS[p]) throw new Error('ENOENT ' + p); var out = {}; Object.keys(FS).concat(Object.keys(DIRS)).forEach(function (k) { if (k !== p && k.indexOf(p === '/' ? '/' : p + '/') === 0) { var rest = k.substring(p === '/' ? 1 : p.length + 1); out[rest.split('/')[0]] = 1; } }); return Object.keys(out); },
    readFileSync: function (p, o) { p = norm(p); if (!FS[p]) throw new Error('ENOENT ' + p); var enc = typeof o === 'string' ? o : o && o.encoding; var b = Buf(FS[p]); if (enc === 'binary') return b.toString('binary'); if (enc) return new TextDecoder().decode(FS[p]); return b; },
    writeFileSync: function (p, data, o) { p = norm(p); var enc = typeof o === 'string' ? o : o && o.encoding; var d = (typeof data === 'string') ? (enc === 'binary' ? Buf(data) : new TextEncoder().encode(data)) : new Uint8Array(data); FS[p] = d; addDir(p.substring(0, p.lastIndexOf('/'))); window.__writes = (window.__writes || []).concat([p]); },
    mkdirSync: function (p) { addDir(p); },
    renameSync: function (a, b) { a = norm(a); b = norm(b); FS[b] = FS[a]; delete FS[a]; window.__writes = (window.__writes || []).concat(['rename ' + b]); },
    unlinkSync: function (p) { delete FS[norm(p)]; }
  };
  var path = {
    join: function () { return norm(Array.prototype.slice.call(arguments).join('/')); },
    dirname: function (p) { p = norm(p); var i = p.lastIndexOf('/'); return i <= 0 ? '/' : p.substring(0, i); },
    basename: function (p) { p = norm(p); return p.substring(p.lastIndexOf('/') + 1); },
    normalize: norm
  };
  var gui = { App: { clearCache: function () {} }, Window: { get: function () { return { on: function () {}, show: function () {}, focus: function () {}, menu: null }; } }, Shell: { openItem: function (p) { window.__opened = p; }, openExternal: function () {} }, Menu: function () {} };
  var mods = {
    fs: fs, path: path, 'nw.gui': gui, os: { networkInterfaces: function () { return {}; } },
    crypto: { createCipheriv: function () { throw new Error('no crypto in harness'); }, createDecipheriv: function () { throw new Error('no crypto in harness'); }, createHash: function () { throw new Error('no'); } },
    zlib: { inflateSync: function (b) { if (!window.pako) throw new Error('no zlib'); return Buf(window.pako.inflate(b)); }, deflateSync: function (b) { if (!window.pako) throw new Error('no zlib'); return Buf(window.pako.deflate(typeof b === 'string' ? new TextEncoder().encode(b) : b)); } },
    async: {}, child_process: { exec: function (cmd, opt, cb) { setTimeout(function () { cb(null, window.__tasklist || '"explorer.exe","1"\r\n'); }, 10); } }
  };
  window.require = function (n) { if (!(n in mods)) throw new Error('harness: no module ' + n); return mods[n]; };
  window.onerror = function (m, s, l) { (window.__errors = window.__errors || []).push(m + ' @' + s + ':' + l); };
})();
