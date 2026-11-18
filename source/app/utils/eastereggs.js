! function() {
  var v1 = angular.module("editor.utils.eastereggs", ["editor.utils.config"]),
    v2 = ["rainbows", "darkmode", "redmode", "abstract", "bbq", "konchu", "dancingjho"],
    v3 = {
      "!devmode": ["devmode"],
      "#japanoshit": ["rainbows", "abstract", "konchu", "bbq"],
      "#swag": ["abstract"],
      "#science": ["bbq"],
      "#partyjho": ["dancingjho"],
      "#darkside": ["darkmode"],
      "#blood": ["redmode"],
      "#unicorns": ["rainbows"]
    };
  v1.controller("EastereggsController", ["$scope", "$eastereggs", function(v1, v2) {
    v1.eastereggs = v2, v1.current_code = "", $(document).keypress(function(v4) {
      var v5 = String.fromCharCode(v4.charCode);
      return "#" === v5 || "!" === v5 ? void((v1.current_code = v5)) : void((v1.current_code["length"] < 30 && (v1.current_code += v5, v3[v1.current_code] && (v3[v1.current_code].forEach(function(v1) {
        v2.unlock(v1)
      }), v1.$root.$digest()))))
    })
  }]), v1.factory("$eastereggs", ["$config", function(v1) {
    var v3 = {
      list: v2,
      unlocked: function(v2) {
        return v1.userSettings["get"](v2 ? v2 + "_unlocked" : "eastereggs_unlocked")
      },
      unlock: function(v2) {
        v1.userSettings["set"]("eastereggs_unlocked", !0), v1.userSettings["set"](v2 + "_unlocked", !0), v1.userSettings["set"](v2, !v1.userSettings["get"](v2))
      },
      get: function(v2) {
        return v1.userSettings["get"](v2)
      },
      set: function(v2, v3) {
        v1.userSettings["set"](v2, v3)
      },
      toggle: function(v2) {
        v1.userSettings["set"](v2, !v1.userSettings["get"](v2))
      },
      unlock_count: function() {
        var v1 = 0;
        return v3.list["forEach"](function(v2) {
          v3.unlocked(v2) && v1++
        }), v1
      }
    };
    return v3
  }])
}()