/*
 * $updater - "Check for updates" (Settings).
 *
 * The program of a release is one file, "MH4U Quest Editor.exe": the NW.js runtime with the application
 * appended as a zip. An update downloads that file from the GitHub repository and swaps it with the
 * running one (Windows lets a running exe be renamed, not overwritten): the new file is written next to
 * it, the running exe becomes "MH4U Quest Editor.exe.old" (deleted at the next start) and the new one takes
 * its name. The library, backups and settings are not in that file, so they are never touched.
 *
 * The editor only goes online when the user clicks the button. Nothing is sent but ordinary requests for
 * public files of the repository.
 */
! function() {
  var mod = angular.module("editor.utils.updater", ["editor.utils.config"]),
    fs = require("fs"),
    path = require("path");

  var REPO_PAGE = "https://github.com/Thomatelot/MH4U-Custom-Quest-Editor";
  var RAW = "https://raw.githubusercontent.com/Thomatelot/MH4U-Custom-Quest-Editor/main/";
  var EXE_NAME = "MH4U Quest Editor.exe";
  var APP_NAME = "mh4u-quest-editor";       // name in package.json (also the name of the editor's storage)

  function base() { return window.MH4U_UPDATE_BASE || RAW; }    // the interface tests point it to a local copy

  /* ---------------------------------------------------------------- versions */
  function parseVersion(v) {
    var m = /(\d+)\.(\d+)\.(\d+)/.exec(String(v || ""));
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : null;
  }
  function cmpVersions(a, b) {
    var x = parseVersion(a), y = parseVersion(b), i;
    if (!x || !y) { return 0; }
    for (i = 0; i < 3; i++) { if (x[i] !== y[i]) { return x[i] < y[i] ? -1 : 1; } }
    return 0;
  }
  // the parts of CHANGELOG.md ("## 1.2.0" ...) newer than the running version, newest first
  function newerNotes(changelog, current) {
    var out = [], cur = null;
    String(changelog || "").split(/\r?\n/).forEach(function(line) {
      var m = /^##\s+v?(\d+\.\d+\.\d+)/.exec(line);
      if (m) {
        cur = cmpVersions(m[1], current) > 0 ? { version: m[1], lines: [] } : null;
        if (cur) { out.push(cur); }
        return;
      }
      if (/^#\s/.test(line)) { cur = null; return; }
      if (cur) { cur.lines.push(line); }
    });
    out.forEach(function(n) { n.text = n.lines.join("\n").replace(/^\s+|\s+$/g, ""); delete n.lines; });
    return out;
  }

  /* ---------------------------------------------------------------- downloads */
  function httpError(status) { var e = new Error("HTTP " + status); e.http = status; return e; }
  function toBuffer(ab) { return new Buffer(new Uint8Array(ab)); }

  // Chromium's network stack (it uses the certificates of Windows)
  function xhrGet(url, binary, onProgress, cb) {
    var x = new XMLHttpRequest(), done = false;
    function end(err, data) { if (!done) { done = true; cb(err, data); } }
    x.open("GET", url, true);
    if (binary) { x.responseType = "arraybuffer"; }
    x.timeout = binary ? 15 * 60 * 1000 : 30 * 1000;
    x.onprogress = function(e) { if (onProgress) { onProgress(e.loaded, e.lengthComputable ? e.total : 0); } };
    x.onload = function() {
      if (x.status !== 200) { return end(httpError(x.status)); }
      end(null, binary ? toBuffer(x.response) : x.responseText);
    };
    x.onerror = function() { end(new Error("network error")); };
    x.ontimeout = function() { end(new Error("timeout")); };
    x.send();
  }
  // Node's https, when Chromium could not connect at all
  function nodeGet(url, binary, onProgress, cb, redirects) {
    var lib = require(url.indexOf("https:") === 0 ? "https" : "http");
    lib.get(url, function(res) {
      var chunks = [], n = 0, total = parseInt(res.headers["content-length"], 10) || 0;
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && (redirects || 0) < 5) {
        res.resume();
        return nodeGet(res.headers.location, binary, onProgress, cb, (redirects || 0) + 1);
      }
      if (res.statusCode !== 200) { res.resume(); return cb(httpError(res.statusCode)); }
      res.on("data", function(c) { chunks.push(c); n += c.length; if (onProgress) { onProgress(n, total); } });
      res.on("end", function() { var b = Buffer.concat(chunks); cb(null, binary ? b : b.toString("utf8")); });
    }).on("error", function(e) { cb(e); });
  }
  function get(url, binary, onProgress, cb) {
    xhrGet(url, binary, onProgress, function(err, data) {
      if (!err || err.http) { return cb(err, data); }     // an answer of the server (404...) is final
      try { nodeGet(url, binary, onProgress, cb, 0); } catch (e) { cb(err); }
    });
  }
  function bust(url) { return url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(); }

  /* ---------------------------------------------------------------- the application inside an exe */
  function rd16(b, o) { return b[o] | (b[o + 1] << 8); }
  function rd32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 0x1000000; }
  // package.json of the zip appended to an NW.js exe: { name, version } or null
  function appInfo(buf) {
    var n = buf.length, i, eocd = -1, cdSize, cdOff, zipStart, p, end, nameLen, extraLen, commentLen, local, method, csize, name, data, j, k;
    try {
      for (i = n - 22; i >= Math.max(0, n - 0x10016); i--) {
        if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) { eocd = i; break; }
      }
      if (eocd < 0) { return null; }
      cdSize = rd32(buf, eocd + 12); cdOff = rd32(buf, eocd + 16);
      zipStart = eocd - cdSize - cdOff;
      p = zipStart + cdOff; end = p + cdSize;
      while (p < end && rd32(buf, p) === 0x02014b50) {
        method = rd16(buf, p + 10); csize = rd32(buf, p + 20);
        nameLen = rd16(buf, p + 28); extraLen = rd16(buf, p + 30); commentLen = rd16(buf, p + 32);
        local = zipStart + rd32(buf, p + 42);
        name = "";
        for (j = 0; j < nameLen; j++) { name += String.fromCharCode(buf[p + 46 + j]); }
        if (name === "package.json") {
          k = local + 30 + rd16(buf, local + 26) + rd16(buf, local + 28);
          data = buf.slice ? buf.slice(k, k + csize) : buf.subarray(k, k + csize);
          if (method === 8) { data = require("zlib").inflateRawSync(new Buffer(data)); }
          data = JSON.parse(new Buffer(data).toString("utf8"));
          return { name: data.name, version: data.version };
        }
        p += 46 + nameLen + extraLen + commentLen;
      }
    } catch (e) {}
    return null;
  }

  mod.factory("$updater", ["$config", function($config) {
    function current() { return $config.versionString.replace(/^v/, ""); }
    function exePath() { return process.execPath; }
    // only the editor's own exe can be swapped (not nw.exe running the sources, not another OS)
    var selfInfo;
    function canSelfUpdate() {
      if (process.platform !== "win32") { return false; }
      if (selfInfo === undefined) {
        try { selfInfo = appInfo(fs.readFileSync(exePath())); } catch (e) { selfInfo = null; }
      }
      return !!(selfInfo && selfInfo.name === APP_NAME);
    }
    // what the repository holds: { current, latest, newer, notes: [{ version, text }] }
    function check(cb) {
      get(bust(base() + "source/package.json"), false, null, function(err, txt) {
        var latest;
        if (err) { return cb(err); }
        try { latest = JSON.parse(txt).version; } catch (e) { return cb(new Error("unexpected answer")); }
        get(bust(base() + "CHANGELOG.md"), false, null, function(err2, log) {
          cb(null, { current: current(), latest: latest, newer: cmpVersions(latest, current()) > 0,
            notes: err2 ? [] : newerNotes(log, current()) });
        });
      });
    }
    // downloads the exe of the repository, checks it and puts it in place of the running one
    function install(expectedVersion, onProgress, cb) {
      get(base() + encodeURIComponent(EXE_NAME), true, onProgress, function(err, buf) {
        var info, exe = exePath(), fresh = exe + ".new", old = exe + ".old";
        if (err) { return cb(err); }
        info = appInfo(buf);
        if (!info || info.name !== APP_NAME || buf[0] !== 0x4d || buf[1] !== 0x5a) {
          return cb(new Error("the downloaded file is not the editor"));
        }
        if (expectedVersion && info.version !== expectedVersion) {
          return cb(new Error("the downloaded program is version " + info.version + ", not " + expectedVersion + " (try again in a few minutes)"));
        }
        try {
          fs.writeFileSync(fresh, buf);
          try { fs.unlinkSync(old); } catch (e) {}
          fs.renameSync(exe, old);
          try {
            fs.renameSync(fresh, exe);
          } catch (e) {
            fs.renameSync(old, exe);         // put the running program back under its name
            throw e;
          }
        } catch (e) {
          try { fs.unlinkSync(fresh); } catch (e2) {}
          return cb(e);
        }
        cb(null, { version: info.version, exe: exe, old: old });
      });
    }
    // closes the editor and starts the (new) exe again, two seconds later, through Windows Script Host
    // (the editor allows one window only: the new one must start after this one is gone)
    function restart() {
      var gui = require("nw.gui"), exe = exePath(), script, ok = true;
      try {
        script = path.join(require("os").tmpdir(), "mh4u-quest-editor-restart.js");
        fs.writeFileSync(script, "WScript.Sleep(2000);\r\nnew ActiveXObject('WScript.Shell').Run('\"' + " +
          JSON.stringify(exe) + " + '\"');\r\ntry { new ActiveXObject('Scripting.FileSystemObject').DeleteFile(WScript.ScriptFullName); } catch (e) {}\r\n");
        require("child_process").spawn("wscript.exe", ["//nologo", script], { detached: true, stdio: "ignore" }).unref();
      } catch (e) { ok = false; }
      gui.App.quit();
      return ok;
    }
    // leftovers of an update (the previous exe), removed once the new one runs
    function cleanup() {
      [".old", ".new"].forEach(function(ext) {
        try { if (fs.existsSync(exePath() + ext)) { fs.unlinkSync(exePath() + ext); } } catch (e) {}
      });
    }
    return {
      REPO_PAGE: REPO_PAGE,
      current: current,
      canSelfUpdate: canSelfUpdate,
      check: check,
      install: install,
      restart: restart,
      cleanup: cleanup,
      // for the tests
      _cmpVersions: cmpVersions,
      _newerNotes: newerNotes,
      _appInfo: appInfo
    };
  }]);
}();
