// minimal angular stub to load a Dasding factory module in node
module.exports = function (file, deps) {
  var fs = require('fs'), vm = require('vm');
  var factories = {};
  var mod = { factory: function (n, f) { factories[n] = f; return mod; }, controller: function () { return mod; }, config: function () { return mod; }, run: function () { return mod; }, filter: function () { return mod; }, directive: function () { return mod; }, constant: function (n, v) { factories[n] = function () { return v; }; return mod; }, value: function (n, v) { factories[n] = function () { return v; }; return mod; } };
  var ctx = { angular: { module: function () { return mod; }, copy: function (x) { return JSON.parse(JSON.stringify(x)); } }, require: require, Buffer: Buffer, console: console, localStorage: deps && deps.localStorage, Math: Math, JSON: JSON, String: String, Uint8Array: Uint8Array, ArrayBuffer: ArrayBuffer, Float32Array: Float32Array, process: process, window: (deps && deps.window) || {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return factories;
};
