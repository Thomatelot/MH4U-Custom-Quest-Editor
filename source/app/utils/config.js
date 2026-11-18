! function() {
  var v1 = angular.module("editor.utils.config", []),
    v2 = require("os"),
    v3 = "ia32" === process.arch ? "ia32" : "x64",
    v4 = process.platform;
  v4 = 0 === v4.indexOf("win") ? "win" : 0 === v4.indexOf("darwin") ? "osx" : "linux";
  var v5 = {
    major: 3,
    minor: 5,
    patch: 0
  };
  v1.factory("$config", [function() {
    var v1 = {
      version: v5,
      versionString: "v" + v5.major + "." + v5.minor + "." + v5.patch,
      platform: {
        isOSX: "osx" === v4,
        isWindows: "win" === v4,
        isLinux: "linux" === v4,
        name: v4 + "-" + v3,
        type: v4,
        arch: v3
      },
      addr: function() {
        var v1 = v2.networkInterfaces(),
          v3 = [];
        return Object.keys(v1).forEach(function(v2) {
          v1[v2].forEach(function(v1) {
            v1.internal === !1 && "IPv4" == v1.family && v3.push(v1.address)
          })
        }), v3
      },
      proxy_port: function(v1) {
        return v1 ? localStorage.setItem("proxy_port", v1) : JSON.parse(localStorage.getItem("proxy_port")) || 8084
      },
      userSettings: {
        set: function(v1, v2) {
          localStorage.setItem(v1, JSON.stringify(v2))
        },
        get: function(v1) {
          return JSON.parse(localStorage.getItem(v1))
        },
        defaults: function(v1, v2) {
          var v3 = JSON.parse(localStorage.getItem(v1));
          null === v3 && (v3 = v2), localStorage.setItem(v1, JSON.stringify(v3))
        }
      }
    };
    return v1
  }])
}()