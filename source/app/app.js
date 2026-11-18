/* MH4U Quest Editor - Citra edition (based on the Dasding Custom Quest Editor v2.1.5) */
! function() {
  var gui = require("nw.gui"),
    app = angular.module("editor", ["ngRoute", "editor.utils.menu", "editor.utils.config", "editor.utils.filter", "editor.utils.i18n", "editor.utils.eastereggs", "editor.utils.citra", "editor.utils.gamedata", "editor.utils.updater", "editor.views.library", "editor.views.editor", "editor.views.palico_editor", "editor.views.settings", "editor.views.game", "editor.views.guide"]);
  app.config(["$routeProvider", "$compileProvider", function($routeProvider, $compileProvider) {
    $routeProvider.otherwise({
      redirectTo: "/library"
    });
    $compileProvider.debugInfoEnabled(false);
  }]);
  app.run(["$config", "$gamedata", "$rootScope", "$updater", function($config, $gamedata, $rootScope, $updater) {
    // $gamedata is injected here so that its fixes of the constants (restrictions, special values...) apply everywhere
    window.document.title = "MH4U Quest Editor " + $config.versionString + " - Citra edition (based on dasding's editor)";
    gui.App.clearCache();
    $updater.cleanup();                 // the previous exe left by an update
    // backspace must not navigate back outside of text fields
    $(document).keydown(function(e) {
      var n = e.target.nodeName.toLowerCase();
      8 === e.which && ("input" === n && "text" === e.target.type || "input" === n && "number" === e.target.type || "input" === n && "password" === e.target.type || "textarea" === n || e.preventDefault());
    });
    // the update server and the analytics page of the original editor are gone: both are disabled for good
    // (updates now come from GitHub, only when asked: Settings > Check for updates)
    $config.userSettings.set("check_update", false);
    $config.userSettings.set("analytics", false);
    $config.userSettings.defaults("quest_nag", true);
    $config.userSettings.defaults("quest_nagv2", true);
    $config.userSettings.defaults("quest_nagv3", true);
    $config.userSettings.defaults("intruder_nag", true);
    $config.userSettings.defaults("small_monster_nag", true);
    $config.userSettings.defaults("locale", "en");
    $config.userSettings.defaults("citra_auto_backup", true);
    // a dialog left open must not stay over the next page
    $rootScope.$on("$routeChangeStart", function() {
      try { if ($(".ui.modal.visible").length) { $(".ui.modal.visible").modal("hide"); } } catch (e) {}
    });
    gui.Window.get().on("new-win-policy", function(frame, url, policy) {
      policy.forceNewWindow();
    });
    gui.Window.get().show();
    gui.Window.get().focus();
  }]);
  // the guide opens in its own window from the editor, so that unsaved edits are never lost
  window.MH4UOpenGuide = function(section) {
    var url = "index.html#/guide/" + (section || "stats") + "?popup=1";
    try {
      gui.Window.open(url, { width: 980, height: 720, toolbar: false, focus: true, position: "center", icon: "icon.png" });
    } catch (e) {
      window.location.hash = "#/guide/" + (section || "stats");
    }
  };
  window.ondragover = function(e) {
    return e.preventDefault(), false;
  };
  window.ondrop = function(e) {
    return e.preventDefault(), false;
  };
}();
