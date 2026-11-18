! function() {
  var gui = require("nw.gui"),
    mod = angular.module("editor.views.settings", ["ngRoute", "editor.utils.config", "editor.utils.eastereggs", "editor.utils.citra"]);
  mod.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when("/settings", {
      controller: "SettingsController",
      templateUrl: "app/views/settings/settings.html"
    });
  }]);
  mod.controller("SettingsController", ["$scope", "$location", "$config", "$i18n", "$eastereggs", "$citra", function(s, $location, $config, $i18n, $eastereggs, $citra) {
    var us = $config.userSettings;
    s._ = $i18n.get;
    s.config = $config;
    s.gui = gui;
    s.eastereggs = $eastereggs;
    s.settings = {
      citra_auto_backup: us.get("citra_auto_backup") !== false
    };
    s.custom_dir = us.get("citra_user_dir");
    s.refresh = function() {
      var st = $citra.reload();
      s.st = st;
      s.games = st.detection && st.detection.games ? st.detection.games : [];
      s.extdata_id = st.game ? st.game.extdataId : null;
      s.backups_root = $citra.backupsRoot();
    };
    s.refresh();
    $("#citraDirDialog").change(function() {
      var p = $(this).val();
      if ("" !== p && null !== p) {
        $(this).val("");
        us.set("citra_user_dir", p);
        s.custom_dir = p;
        s.refresh();
        s.$digest();
      }
    });
    s.browse = function() { $("#citraDirDialog").trigger("click"); };
    s.auto_detect = function() {
      localStorage.removeItem("citra_user_dir");
      s.custom_dir = null;
      s.refresh();
    };
    s.select_game = function(id) {
      us.set("citra_extdata_id", id);
      s.refresh();
    };
    s.open_folder = function(p) { $citra.openFolder(p); };
    s.gotoLibrary = function() {
      us.set("citra_auto_backup", !!s.settings.citra_auto_backup);
      $location.path("/library");
    };
    s.$on("$destroy", function() { $("#citraDirDialog").remove(); });
  }]);
}();
