! function() {
  var v1 = angular.module("editor.utils.filter", ["editor.utils.constants", "editor.utils.i18n"]);
  v1.filter("num", function() {
    return function(v1) {
      return parseInt(v1, 10)
    }
  }), v1.filter("doublenum", function() {
    return function(v1) {
      return 10 > v1 ? "0" + v1 : v1
    }
  }), v1.filter("round_float", function() {
    return function(v1) {
      return v1.toFixed(2)
    }
  }), v1.filter("strip_c", function() {
    return function(v1) {
      return v1 ? v1.replace("[C] ", "") : "undefined"
    }
  }), v1.filter("qid_rank", function() {
    return function(v1) {
      return v1 >= 6e4 && 60100 > v1 ? "Low Rank" : v1 >= 60100 && 60200 > v1 ? "High Rank" : v1 >= 60200 && 60300 > v1 ? "G Rank" : ""
    }
  }), v1.filter("qid_desc", ["constants", "$i18n", function(v1, v2) {
    return function(v3) {
      switch (typeof v3) {
        case "object":
          return v3.map(function(v3) {
            return v2.getFilter(v1.monsters[v3])
          }).join(", ");
        case "string":
          return v3;
        default:
          return v3
      }
    }
  }]), v1.filter("i18n", ["$i18n", function(v1) {
    return function(v2) {
      return v1.getFilter(v2)
    }
  }]), v1.filter("proxy_filter", [function() {
    return function(v1) {
      var v2 = "";
      return v1 ? (v1.forEach(function(v1) {
        v2 += v1 + "\n"
      }), v2.substring(0, v2.length - 1)) : v2
    }
  }]), v1.filter("ceil", [function() {
    return function(v1) {
      return v1 ? isNaN(v1) ? "Inf" : Math.ceil(v1) : ""
    }
  }]), v1.directive("selectOnClick", ["$window", function(v1) {
    return {
      restrict: "A",
      link: function(v2, v3) {
        v3.on("click", function() {
          v1.getSelection().toString() || this.setSelectionRange(0, this.value["length"])
        })
      }
    }
  }])
}()