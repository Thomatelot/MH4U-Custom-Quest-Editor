! function() {
  var gui = require("nw.gui"),
    mod = angular.module("editor.views.settings", ["ngRoute", "editor.utils.config", "editor.utils.eastereggs", "editor.utils.citra", "editor.utils.updater"]);
  mod.config(["$routeProvider", function($routeProvider) {
    $routeProvider.when("/settings", {
      controller: "SettingsController",
      templateUrl: "app/views/settings/settings.html"
    });
  }]);
  mod.controller("SettingsController", ["$scope", "$location", "$config", "$i18n", "$eastereggs", "$citra", "$updater", function(s, $location, $config, $i18n, $eastereggs, $citra, $updater) {
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

    /* ---------------------------------------------------------------- updates (GitHub) */
    s.upd = { state: "idle" };          // idle, checking, latest, available, downloading, installed, error
    s.repo_page = $updater.REPO_PAGE;
    s.can_self_update = $updater.canSelfUpdate();
    s.open_repo = function() { gui.Shell.openExternal($updater.REPO_PAGE); };
    s.check_updates = function() {
      s.upd = { state: "checking" };
      $updater.check(function(err, r) {
        s.$evalAsync(function() {
          if (err) { s.upd = { state: "error", error: err.message }; return; }
          s.upd = { state: r.newer ? "available" : "latest", info: r };
        });
      });
    };
    s.install_update = function() {
      var info = s.upd.info;
      s.upd = { state: "downloading", info: info, done: 0, total: 0 };
      $updater.install(info.latest, function(n, total) {
        s.$evalAsync(function() { s.upd.done = n; s.upd.total = total; });
      }, function(err, r) {
        s.$evalAsync(function() {
          if (err) { s.upd = { state: "error", error: err.message, info: info }; return; }
          s.upd = { state: "installed", info: info, version: r.version };
        });
      });
    };
    s.restart = function() { $updater.restart(); };
    s.mb = function(n) { return (n / 1048576).toFixed(1); };
    s.gotoLibrary = function() {
      us.set("citra_auto_backup", !!s.settings.citra_auto_backup);
      $location.path("/library");
    };
    s.$on("$destroy", function() { $("#citraDirDialog").remove(); });
  }]);
}();
