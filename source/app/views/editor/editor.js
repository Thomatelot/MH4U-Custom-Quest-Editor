! function() {
  function v1(v1) {
    if (0 === v1.small_monster_table["length"]) {
      return void((v1.small_monster_table = [
        [
          []
        ],
        [
          []
        ],
        [
          []
        ]
      ]))
    };
    for (; v1.small_monster_table["length"] < 3;) {
      v1.small_monster_table["push"]([
        []
      ])
    };
    for (var v2, v3 = 0; 3 > v3; v3++) {
      v2 = [], v1.small_monster_table[v3].forEach(function(v1) {
        v1.forEach(function(v1) {
          v2.push(v1)
        })
      }), v1.small_monster_table[v3] = [v2]
    }
  }
  var v2 = angular.module("editor.views.editor", ["ngRoute", "editor.utils.fix", "editor.utils.constants", "editor.utils.eastereggs", "editor.utils.gamedata", "editor.utils.citra"]),
    v3 = require("fs");
  v2.config(["$routeProvider", function(v1) {
    v1.when("/editor/:uuid?", {
      controller: "EditorController",
      templateUrl: "app/views/editor/editor.html"
    })
  }]), v2.controller("EditorController", ["$scope", "$timeout", "$routeParams", "$location", "$library", "$config", "$mib", "$fix", "constants", "$i18n", "$eastereggs", "$gamedata", "$citra", function(v2, v4, v5, v6, v7, v8, v9, va, vb, vc, vd, vgd, vcit) {
    v2._ = vc.get, v2.eastereggs = vd, v5.uuid ? (v2.quest = v9.parse(v7.get(v5.uuid).mib), v1(v2.quest), v2.saved_quest = angular.toJson(v2.quest)) : (v2.quest = vb.default_quest(), v2.saved_quest = {}), v2.lib_length = v7.list().length, v2.constants = vb, v2.text_lang = 0, v2.includes_loaded = 0, v2.repel = 4 & v2.quest["repel_flag"], v2.config = v8, v2.forms = {}, (function() { try { window.MH4UEditorExtras(v2, { $gamedata: vgd, $citra: vcit, constants: vb, $timeout: v4, $i18n: vc }); } catch (e) { console.error("editor extras", e); } })(), v2.reload_dropdown = function() {
      v4(function() {
        $(".ui.dropdown.monster").dropdown({
          fullTextSearch: !0
        }), $("#deliversearch_sub").search({
          maxResults: 5,
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && (v2.quest["objective_sub"].target_id = v1.id)
          }
        }), $("#deliversearch_main1").search({
          maxResults: 5,
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && (v2.quest["objectives"][0].target_id = v1.id)
          }
        }), $("#deliversearch_main2").search({
          maxResults: 5,
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && (v2.quest["objectives"][1].target_id = v1.id)
          }
        }), $("#condition1_search").search({
          maxResults: 5,
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && (v2.quest["small_monster_conditions"][0].target = v1.id)
          }
        }), $("#condition2_search").search({
          maxResults: 5,
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && (v2.quest["small_monster_conditions"][1].target = v1.id)
          }
        })
      }, 0)
    }, v2.reload_special = function() {
      v4(function() {
        $(".special.ui.dropdown").dropdown()
      }, 0)
    }, v2.gotoLibrary = function() {
      return v2.saved_quest === angular.toJson(v2.quest) ? v6.path("/library") : void($)("#confirmDialog").modal({
        transition: "scale",
        blurring: !1
      }).modal("show")
    }, v2.select_lang = function(v1) {
      v2.text_lang = v1
    }, v2.select_quest_id = function(v1) {
      v2.quest["quest_id"] = parseInt(v1, 10)
    }, v2.copy_lang = function() {
      var v1, v3;
      for (v1 = 0; 5 > v1; v1++) {
        for (v3 = 0; 7 > v3; v3++) {
          v2.quest["text"][v1][v3] = v2.quest["text"][v2.text_lang][v3]
        }
      }
    }, $("#importSupplies").change(function() {
      var v1 = $(this).val();
      if ("" !== v1 && null !== v1) {
        var v4 = v3.readFileSync(v1).toString(),
          v5 = [];
        v4.split("\n").forEach(function(v1) {
          var v2 = v1.split("|");
          v2 = {
            item_id: parseInt(v2[0], 10),
            qty: parseInt(v2[1], 10)
          }, v2.item_id && v2.qty && !isNaN(v2.item_id) && !isNaN(v2.qty) && v5.push(v2)
        }), v2.quest["supplies"][v2.supply_import_idx] = v5, $("#importSupplies").val(""), v2.$digest()
      }
    }), v2.supply_import_idx = null, v2.importSupplies = function(v1) {
      v2.supply_import_idx = v1, $("#importSupplies").trigger("click")
    }, $("#exportSupplies").change(function() {
      var v1 = $(this).val();
      if ("" !== v1 && null !== v1) {
        var v4 = "";
        v2.quest["supplies"][v2.supply_export_idx].forEach(function(v1) {
          v4 += v1.item_id + "|" + v1.qty + "\n"
        }), v3.writeFileSync(v1, v4), $("#exportSupplies").val("")
      }
    }), v2.supply_export_idx = null, v2.exportSupplies = function(v1) {
      v2.supply_export_idx = v1, $("#exportSupplies").trigger("click")
    }, $("#importRewards").change(function() {
      var v1 = $(this).val();
      if ("" !== v1 && null !== v1) {
        var v4 = v3.readFileSync(v1).toString(),
          v5 = [{
            flag: 32768,
            items: []
          }];
        v4.split("\n").forEach(function(v1) {
          var v2 = v1.split("|");
          v2 = {
            item_id: parseInt(v2[0], 10),
            qty: parseInt(v2[1], 10),
            chance: parseInt(v2[2], 10)
          }, v2.item_id && v2.qty && v2.chance && !isNaN(v2.item_id) && !isNaN(v2.qty) && !isNaN(v2.chance) && v5[0].items["push"](v2)
        }), v2.quest["loot_" + v2.rewards_import_idx] = v5, $("#importRewards").val(""), v2.$digest()
      }
    }), v2.rewards_import_idx = null, v2.importRewards = function(v1) {
      v2.rewards_import_idx = v1, $("#importRewards").trigger("click")
    }, $("#exportRewards").change(function() {
      var v1 = $(this).val();
      if ("" !== v1 && null !== v1) {
        var v4 = "";
        v2.quest["loot_" + v2.rewards_export_idx][0].items["forEach"](function(v1) {
          v4 += v1.item_id + "|" + v1.qty + "|" + v1.chance + "\n"
        }), v3.writeFileSync(v1, v4), $("#exportRewards").val("")
      }
    }), v2.rewards_export_idx = null, v2.exportRewards = function(v1) {
      v2.rewards_export_idx = v1, $("#exportRewards").trigger("click")
    }, v2.mon_count = function() {
      var v1 = 0;
      return v2.quest["large_monster_table"].forEach(function(v2) {
        v1 += v2.length
      }), v1
    }, v2.calc_abs_mon_idx = function(v1, v3) {
      for (var v4 = 0, v5 = 0; v1 > v5; v5++) {
        v4 += v2.quest["large_monster_table"][v5].length
      };
      return v4 += v3, v4 > 4 && (v4 = 4), v4
    }, v2.add_wave = function() {
      v2.quest["large_monster_table"].push([])
    }, v2.add_monster = function(v1) {
      v2.quest["large_monster_table"][v1].push(vb.default_monster()), v2.quest["large_meta_table"].splice(v2.calc_abs_mon_idx(v1, v2.quest["large_monster_table"][v1].length - 1), 0, vb.default_meta()), v2.quest["large_meta_table"].pop()
    }, v2.duplicate_monster = function(v1, v3) {
      var v4 = v2.calc_abs_mon_idx(v1, v3),
        v5 = angular.copy(v2.quest["large_monster_table"][v1][v3]),
        v6 = angular.copy(v2.quest["large_meta_table"][v4]);
      if (v2.quest["large_monster_table"][v1].length < 2) {
        v2.quest["large_monster_table"][v1].push(v5), v2.quest["large_meta_table"].splice(v4 + 1, 0, v6)
      } else {
        for (var v7 = v1; v7 < v2.quest["large_monster_table"].length; v7++) {
          if (v2.quest["large_monster_table"][v7].length < 2) {
            return v2.quest["large_monster_table"][v7].push(v5), void(v2).quest["large_meta_table"].splice(v2.calc_abs_mon_idx(v7, v2.quest["large_monster_table"][v7].length - 1), 0, v6)
          }
        };
        v2.add_wave(), v2.quest["large_monster_table"][v2.quest["large_monster_table"].length - 1].push(v5), v2.quest["large_meta_table"].splice(v2.calc_abs_mon_idx(v2.quest["large_monster_table"].length - 1, v2.quest["large_monster_table"][v2.quest["large_monster_table"].length - 1].length - 1), 0, v6)
      }
    }, v2.remove_monster = function(v1, v3) {
      var v4 = v2.calc_abs_mon_idx(v1, v3);
      v2.quest["large_monster_table"][v1].splice(v3, 1), v2.quest["large_meta_table"].splice(v4, 1), v2.quest["large_meta_table"].push(vb.default_meta())
    }, v2.remove_wave = function(v1) {
      for (; v2.quest["large_monster_table"][v1].length > 0;) {
        v2.remove_monster(v1, 0)
      };
      v2.quest["large_monster_table"].splice(v1, 1)
    }, v2.area_x = function() {
      var v1 = v2.current_edit_monster,
        v3 = vb.map_coordinates[v2.quest["map_id"]][v1.area],
        v4 = (v3.max_x_img - v3.min_x_img) / (v3.max_x - v3.min_x);
      return v3.min_x_img + -v3.min_x * v4 + v1.x * v4
    }, v2.area_z = function() {
      var v1 = v2.current_edit_monster,
        v3 = vb.map_coordinates[v2.quest["map_id"]][v1.area],
        v4 = (v3.max_z_img - v3.min_z_img) / (v3.max_z - v3.min_z);
      return v3.min_z_img + -v3.min_z * v4 + v1.z * v4
    }, v2.set_coords = function(v1) {
      var v3 = v2.current_edit_monster,
        v4 = vb.map_coordinates[v2.quest["map_id"]][v3.area],
        v5 = (v4.max_x_img - v4.min_x_img) / (v4.max_x - v4.min_x),
        v6 = (v4.max_z_img - v4.min_z_img) / (v4.max_z - v4.min_z);
      v3.x = (v1.offsetX - v4.min_x_img) / v5 + v4.min_x, v3.z = (v1.offsetY - v4.min_z_img) / v6 + v4.min_z
    }, v2.move_monster_down = function(v1, v3) {
      for (var v4 = v2.calc_abs_mon_idx(v1, v3), v5 = angular.copy(v2.quest["large_monster_table"][v1][v3]), v6 = angular.copy(v2.quest["large_meta_table"][v4]), v7 = v1 + 1; v7 < v2.quest["large_monster_table"].length; v7++) {
        if (v2.quest["large_monster_table"][v7].length < 2) {
          return v2.quest["large_monster_table"][v7].push(v5), v2.quest["large_meta_table"].splice(v2.calc_abs_mon_idx(v7, v2.quest["large_monster_table"][v7].length - 1), 0, v6), void(v2).remove_monster(v1, v3)
        }
      };
      v2.add_wave(), v2.quest["large_monster_table"][v2.quest["large_monster_table"].length - 1].push(v5), v2.quest["large_meta_table"].splice(v2.calc_abs_mon_idx(v2.quest["large_monster_table"].length - 1, v2.quest["large_monster_table"][v2.quest["large_monster_table"].length - 1].length - 1), 0, v6), v2.remove_monster(v1, v3)
    }, v2.move_monster_up = function(v1, v3) {
      for (var v4 = v2.calc_abs_mon_idx(v1, v3), v5 = angular.copy(v2.quest["large_monster_table"][v1][v3]), v6 = angular.copy(v2.quest["large_meta_table"][v4]), v7 = v1 - 1; v7 > -1; v7--) {
        if (v2.quest["large_monster_table"][v7].length < 2) {
          return v2.quest["large_monster_table"][v7].push(v5), v2.quest["large_meta_table"].splice(v2.calc_abs_mon_idx(v7, v2.quest["large_monster_table"][v7].length - 1), 0, v6), void(v2).remove_monster(v1, v3)
        }
      }
    }, v2.edit_monster = function(v1, v3) {
      v2.current_edit_monster = angular.copy(v2.quest["large_monster_table"][v1][v3]), v2.current_edit_wave_idx = v1, v2.current_edit_mon_idx = v3, v2.current_edit_meta = angular.copy(v2.quest["large_meta_table"][v2.calc_abs_mon_idx(v1, v3)]), v4(function() {
        $("#monstermodal").modal({
          transition: "vertical flip",
          blurring: !0,
          observeChanges: !0
        }).modal("show"), $("#monstermodal .ui.dropdown").dropdown({
          fullTextSearch: !0
        })
      }, 0)
    }, v2.save_edit_monster = function() {
      var v1 = v2.current_edit_wave_idx,
        v3 = v2.current_edit_mon_idx,
        v4 = v2.current_edit_monster,
        v5 = v2.current_edit_meta,
        v6 = v2.calc_abs_mon_idx(v1, v3);
      v2.quest["large_monster_table"][v1][v3] = v4, v2.quest["large_meta_table"][v6] = v5
    }, v2.area_x_small = function() {
      var v1 = v2.current_edit_small_monster,
        v3 = vb.map_coordinates[v2.quest["map_id"]][v1.area],
        v4 = (v3.max_x_img - v3.min_x_img) / (v3.max_x - v3.min_x);
      return v3.min_x_img + -v3.min_x * v4 + v1.x * v4
    }, v2.area_z_small = function() {
      var v1 = v2.current_edit_small_monster,
        v3 = vb.map_coordinates[v2.quest["map_id"]][v1.area],
        v4 = (v3.max_z_img - v3.min_z_img) / (v3.max_z - v3.min_z);
      return v3.min_z_img + -v3.min_z * v4 + v1.z * v4
    }, v2.set_coords_small = function(v1) {
      var v3 = v2.current_edit_small_monster,
        v4 = vb.map_coordinates[v2.quest["map_id"]][v3.area],
        v5 = (v4.max_x_img - v4.min_x_img) / (v4.max_x - v4.min_x),
        v6 = (v4.max_z_img - v4.min_z_img) / (v4.max_z - v4.min_z);
      v3.x = (v1.offsetX - v4.min_x_img) / v5 + v4.min_x, v3.z = (v1.offsetY - v4.min_z_img) / v6 + v4.min_z
    }, v2.empty_small_wave = function(v1) {
      v2.quest["small_monster_table"][v1] = [
        []
      ]
    }, v2.duplicate_small_monster = function(v1, v3) {
      var v4 = angular.copy(v2.quest["small_monster_table"][v1][0][v3]);
      v2.quest["small_monster_table"][v1][0].push(v4)
    }, v2.remove_small_monster = function(v1, v3) {
      v2.quest["small_monster_table"][v1][0].splice(v3, 1)
    }, v2.add_small_monster = function(v1) {
      v2.quest["small_monster_table"][v1][0].push(vb.default_monster())
    }, v2.move_small_monster_down = function(v1, v3) {
      for (var v4 = angular.copy(v2.quest["small_monster_table"][v1][0][v3]), v5 = v1 + 1; 3 > v5; v5++) {
        return v2.quest["small_monster_table"][v5][0].push(v4), void(v2).remove_small_monster(v1, v3)
      }
    }, v2.move_small_monster_up = function(v1, v3) {
      for (var v4 = angular.copy(v2.quest["small_monster_table"][v1][0][v3]), v5 = v1 - 1; v5 > -1; v5--) {
        return v2.quest["small_monster_table"][v5][0].push(v4), void(v2).remove_small_monster(v1, v3)
      }
    }, v2.edit_small_monster = function(v1, v3) {
      v2.current_edit_small_monster = angular.copy(v2.quest["small_monster_table"][v1][0][v3]), v2.current_edit_small_mon_idx = v3, v2.current_edit_small_wave_idx = v1, v2.current_edit_small_meta = angular.copy(v2.quest["small_meta"]), v4(function() {
        $("#smallmonstermodal").modal({
          transition: "vertical flip",
          blurring: !0,
          observeChanges: !0
        }).modal("show"), $("#smallmonstermodal .ui.dropdown").dropdown({
          fullTextSearch: !0
        })
      }, 0)
    }, v2.save_edit_small_monster = function() {
      var v1 = v2.current_edit_small_mon_idx,
        v3 = v2.current_edit_small_wave_idx,
        v4 = v2.current_edit_small_monster,
        v5 = v2.current_edit_small_meta;
      v2.quest["small_monster_table"][v3][0][v1] = v4, v2.quest["small_meta"] = v5
    }, v2.area_x_unstable = function() {
      var v1 = v2.current_edit_unstable_monster["monster"],
        v3 = vb.map_coordinates[v2.quest["map_id"]][v1.area],
        v4 = (v3.max_x_img - v3.min_x_img) / (v3.max_x - v3.min_x);
      return v3.min_x_img + -v3.min_x * v4 + v1.x * v4
    }, v2.area_z_unstable = function() {
      var v1 = v2.current_edit_unstable_monster["monster"],
        v3 = vb.map_coordinates[v2.quest["map_id"]][v1.area],
        v4 = (v3.max_z_img - v3.min_z_img) / (v3.max_z - v3.min_z);
      return v3.min_z_img + -v3.min_z * v4 + v1.z * v4
    }, v2.set_coords_unstable = function(v1) {
      var v3 = v2.current_edit_unstable_monster["monster"],
        v4 = vb.map_coordinates[v2.quest["map_id"]][v3.area],
        v5 = (v4.max_x_img - v4.min_x_img) / (v4.max_x - v4.min_x),
        v6 = (v4.max_z_img - v4.min_z_img) / (v4.max_z - v4.min_z);
      v3.x = (v1.offsetX - v4.min_x_img) / v5 + v4.min_x, v3.z = (v1.offsetY - v4.min_z_img) / v6 + v4.min_z
    }, v2.remove_unstable_monster = function(v1) {
      v2.quest["unstable_monster_table"].splice(v1, 1)
    }, v2.add_unstable_monster = function() {
      v2.quest["unstable_monster_table"].push({
        chance: 100,
        monster: vb.default_monster()
      })
    }, v2.duplicate_unstable_monster = function(v1) {
      var v3 = angular.copy(v2.quest["unstable_monster_table"][v1]);
      v2.quest["unstable_monster_table"].push(v3)
    }, v2.edit_unstable_monster = function(v1) {
      v2.current_edit_unstable_monster = angular.copy(v2.quest["unstable_monster_table"][v1]), v2.current_edit_unstable_mon_idx = v1, v2.current_edit_unstable_meta = angular.copy(v2.quest["large_meta_table"][2]), v4(function() {
        $("#unstablemonstermodal").modal({
          transition: "vertical flip",
          blurring: !0,
          observeChanges: !0
        }).modal("show"), $("#unstablemonstermodal .ui.dropdown").dropdown({
          fullTextSearch: !0
        })
      }, 0)
    }, v2.save_edit_unstable_monster = function() {
      var v1 = v2.current_edit_unstable_mon_idx,
        v3 = v2.current_edit_unstable_monster,
        v4 = v2.current_edit_unstable_meta;
      v2.quest["unstable_monster_table"][v1] = v3, v2.quest["large_meta_table"][2] = v4
    }, v2.duplicate_supply_item = function(v1, v3) {
      var v4 = angular.copy(v2.quest["supplies"][v1][v3]);
      v2.quest["supplies"][v1].splice(v3, 0, v4)
    }, v2.add_supply_item = function(v1) {
      // Citra edition: a new item opens the item list directly (nothing is added until an item is chosen and saved)
      v2.xt && (v2.xt.item = { cat: "", monster: "", search: "" });
      v2.edit_supply_item(v1, v2.quest["supplies"][v1].length, { item_id: null, qty: 1 })
    }, v2.edit_supply_item = function(v1, v3, vnew) {
      v2.current_edit_supply_item = angular.copy(vnew || v2.quest["supplies"][v1][v3]), v2.current_edit_supply_item_idx = v3, v2.current_edit_supply_item_s_idx = v1, v4(function() {
        $("#supplymodal").modal({
          transition: "vertical flip",
          blurring: !0,
          observeChanges: !0
        }).modal("show"), $("#supplymodal .ui.search").search({
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && v2.current_edit_supply_item && (v2.current_edit_supply_item["item_id"] = v1.id)
          }
        }), $("#supplymodal .ui.search").search("set value", null === v2.current_edit_supply_item["item_id"] ? "" : vc.getFilter(vb.items[v2.current_edit_supply_item["item_id"]]))
      }, 0)
    }, v2.save_edit_supply_item = function() {
      v2.quest["supplies"][v2.current_edit_supply_item_s_idx][v2.current_edit_supply_item_idx] = v2.current_edit_supply_item
    }, v2.duplicate_loot_item = function(v1, v3) {
      var v4 = angular.copy(v2.quest["loot_" + v1][0].items[v3]);
      v2.quest["loot_" + v1][0].items["splice"](v3, 0, v4)
    }, v2.add_loot_item = function(v1) {
      v2.xt && (v2.xt.item = { cat: "", monster: "", search: "" });
      v2.edit_loot_item(v1, v2.quest["loot_" + v1][0].items.length, { item_id: null, qty: 1, chance: 10 })
    }, v2.edit_loot_item = function(v1, v3, vnew) {
      v2.current_edit_loot_item = angular.copy(vnew || v2.quest["loot_" + v1][0].items[v3]), v2.current_edit_loot_item_idx = v3, v2.current_edit_loot_item_table = v1, v4(function() {
        $("#lootmodal").modal({
          transition: "vertical flip",
          blurring: !0,
          observeChanges: !0
        }).modal("show"), $("#lootmodal .ui.search").search({
          source: vb.search_items,
          onSelect: function(v1) {
            v1 && v2.current_edit_loot_item && (v2.current_edit_loot_item["item_id"] = v1.id)
          }
        }), $("#lootmodal .ui.search").search("set value", null === v2.current_edit_loot_item["item_id"] ? "" : vc.getFilter(vb.items[v2.current_edit_loot_item["item_id"]]))
      }, 0)
    }, v2.save_edit_loot_item = function() {
      var v1 = v2.current_edit_loot_item_idx,
        v3 = v2.current_edit_loot_item,
        v4 = v2.current_edit_loot_item_table;
      v2.quest["loot_" + v4][0].items[v1] = v3
    }, v2.save = function() {
      // Citra edition: refuse ids the library cannot hold (the quest used to be silently lost)
      // and warn once when the quest would not fit into a game slot (8192 bytes)
      if (!v2.quest.quest_id) { v2.quest.quest_id = 0; }   // 0 = id chosen automatically when the quest is sent to the game
      var mib = v9.export(va.fix(v2.quest)), qid = parseInt(v2.quest.quest_id, 10);
      v2.save_error = null;
      if ((isNaN(qid) || (qid !== 0 && (qid < 6e4 || qid >= 63e3))) && !vd.get("devmode")) {
        v2.save_error = vc.get("INVALID_QUEST_ID");
        return;
      }
      if (mib.length > v9.MAX_SIZE && v2.size_warned !== mib.length) {
        v2.size_warned = mib.length;
        v2.save_error = vc.get("EDITOR_TOO_BIG") + " (" + mib.length + " > " + v9.MAX_SIZE + " bytes). " + vc.get("SAVE") + " = OK";
        return;
      }
      v5.uuid ? v7.update(v5.uuid, mib) : v7.insert(mib), v4(function() {
        v6.path("/library")
      }, 0)
    }, v2.$on("$includeContentLoaded", function() {
      v2.includes_loaded += 1, 8 === v2.includes_loaded && v4(function() {
        $(".menu .item").tab(), $(".menu .item").on("click", function() {
          $("#viewport").scrollTop(0)
        }), $(".tooltip").popup({
          delay: {
            show: 500,
            hide: 100
          }
        }), $(".ui.accordion").accordion(), $("#general .ui.dropdown").dropdown({
          fullTextSearch: !0
        }), $("#preview .ui.dropdown").dropdown(), $("#text_edit .ui.dropdown").dropdown(), $("#reqobj .ui.dropdown").dropdown(), $("#refillform .ui.dropdown").dropdown(), $("#small_conditions .ui.dropdown").dropdown(), v2.reload_dropdown(), $("#loading").hide()
      }, 0)
    }), v2.$on("$destroy", function() {
      $(".ui.grid .menu .item").remove(), $("#confirmDialog").remove(), $("#monstermodal").remove(), $("#lootmodal").remove(), $("#smallmonstermodal").remove(), $("#supplymodal").remove(), $("#unstablemonstermodal").remove(), $(".special.ui.dropdown").remove(), $(".ui.grid .ui.dropdown").remove(), $(".ui.accordion").remove(), $(".tooltip").remove(), $(".ui.search").remove(), $("#importSupplies").remove(), $("#exportSupplies").remove(), $("#importRewards").remove(), $("#exportRewards").remove()
    })
  }])
}()