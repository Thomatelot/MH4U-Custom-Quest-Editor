! function() {
  function v1(v1) {
    for (; v1.length < 2;) {
      v1 = "0" + v1
    };
    return v1
  } {
    var v2 = angular.module("editor.views.palico_editor", ["ngRoute", "editor.utils.constants"]);
    require("fs")
  }
  v2.config(["$routeProvider", function(v1) {
    v1.when("/palico_editor/:uuid", {
      controller: "PalicoEditorController",
      templateUrl: "app/views/palico_editor/editor.html"
    })
  }]), v2.controller("PalicoEditorController", ["$scope", "$timeout", "$routeParams", "$location", "$library", "$config", "$otb", "constants", "$i18n", function(v2, v3, v4, v5, v6, v7, v8, v9, va) {
    v2._ = va.get, v4.uuid && (v2.palico = v8.parse(v6.get(v4.uuid).otb), v2.saved_palico = angular.toJson(v2.palico), v2.lib_length = v6.list_otb().length, v2.constants = v9, v2.config = v7, v2.forms = {}, v2.coat_color = "#" + v1(v2.palico["coat_r"].toString(16)) + v1(v2.palico["coat_g"].toString(16)) + v1(v2.palico["coat_b"].toString(16)), v2.clothing_color = "#" + v1(v2.palico["clothing_r"].toString(16)) + v1(v2.palico["clothing_g"].toString(16)) + v1(v2.palico["clothing_b"].toString(16)), v2.coat_color_change = function() {
      var v1 = v2.coat_color;
      v2.palico["coat_r"] = parseInt(v1.substring(1, 3), 16), v2.palico["coat_g"] = parseInt(v1.substring(3, 5), 16), v2.palico["coat_b"] = parseInt(v1.substring(5, 7), 16)
    }, v2.clothing_color_change = function() {
      var v1 = v2.clothing_color;
      v2.palico["clothing_r"] = parseInt(v1.substring(1, 3), 16), v2.palico["clothing_g"] = parseInt(v1.substring(3, 5), 16), v2.palico["clothing_b"] = parseInt(v1.substring(5, 7), 16)
    }, v2.type_gen = function(v1) {
      for (var v2 = {}, v3 = 0; v1 > v3; v3++) {
        v2[v3] = "Type " + (v3 + 1)
      };
      return v2
    }, v2.gotoLibrary = function() {
      return v2.saved_palico === angular.toJson(v2.palico) ? v5.path("/library/1") : void($)("#confirmDialog").modal({
        transition: "scale",
        blurring: !1
      }).modal("show")
    }, v2.save = function() {
      v4.uuid ? v6.update_otb(v4.uuid, v8.export(v2.palico)) : v6.insert_otb(v8.export(v2.palico)), v3(function() {
        v5.path("/library/1")
      }, 0)
    }, v3(function() {
      $(".ui.dropdown").dropdown()
    }, 0), v2.$on("$destroy", function() {
      $(".menu .item").remove(), $("#confirmDialog").remove(), $(".ui.grid .ui.dropdown").remove(), $(".ui.accordion").remove()
    }))
  }])
}()