! function() {
  function v1(v1, v2, v3) {
    v1.search_items = angular.copy(v1.search_items_backup), !v3 || ["es", "fr", "it", "de", "jp"].indexOf(v2) < 0 || v1.search_items["forEach"](function(v1) {
      var v2 = v3[v1.title];
      v2 && (v1.title = v2)
    })
  }
  var v2 = angular.module("editor.utils.i18n", ["editor.utils.constants"]);
  v2.factory("$i18n", ["$config", "constants", function(v2, v3) {
    var v4 = {
        en: locale_en,
        de: locale_de,
        de_filter: locale_de_filter,
        es: locale_es,
        es_filter: locale_es_filter,
        fr: locale_fr,
        fr_filter: locale_fr_filter,
        it: locale_it,
        it_filter: locale_it_filter,
        cn: locale_cn,
        cn_filter: locale_cn_filter
      },
      v5 = v2.userSettings["get"]("locale");
    return v1(v3, v5, v4[v5 + "_filter"]), {
      get: function(v1) {
        var v2 = v4[v5];
        if (!v2) {
          return v4.en[v1]
        };
        var v3 = v4[v5][v1];
        return v3 || (v3 = v4.en[v1]), v3
      },
      getFilter: function(v1) {
        var v2 = v4[v5 + "_filter"];
        if (!v2) {
          return v1
        };
        var v3 = v2[v1];
        return v3 ? v3 : v1
      },
      select_locale: function(v6) {
        v5 = v6, v1(v3, v5, v4[v5 + "_filter"]), v2.userSettings["set"]("locale", v6)
      },
      current_locale: function() {
        return v5
      }
    }
  }])
}()