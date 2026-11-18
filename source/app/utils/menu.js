! function() {
  var v1 = require("nw.gui"),
    v2 = angular.module("editor.utils.menu", ["editor.utils.config"]);
  v2.run(["$config", function(v2) {
    if (v2.platform["isOSX"]) {
      var v3 = v1.Window["get"](),
        v4 = new v1.Menu({
          type: "menubar"
        });
      v4.createMacBuiltin("Editor", {
        hideEdit: !1,
        hideWindow: !1
      }), v3.menu = v4
    }
  }])
}()