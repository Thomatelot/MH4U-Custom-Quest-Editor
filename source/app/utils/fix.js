! function() {
  function v1(v1, v2) {
    // Citra edition: use the value the official quests use for this monster (herbivores are 5, most
    // others 1) and keep the rare special values (3, 4, 6) of imported official quests
    var gd = window.MH4U_GAMEDATA, def = function(id) {
      var d = gd && gd.small_defaults[id];
      return d ? d.crashflag : (v2.monster_is_large[id] ? 5 : 1)
    };
    v1.small_monster_table["forEach"](function(v1) {
      v1.forEach(function(v3) {
        v3.forEach(function(v1) {
          (!v1.crashflag || 1 === v1.crashflag || 5 === v1.crashflag) && (v1.crashflag = def(v1.monster_id))
        })
      })
    })
  }

  function v2(v1, v2) {
    var v3 = v2.item_restrictions;
    if (v3[v1.quest_id]) {
      var v4 = {
        item_id: v3[v1.quest_id],
        qty: 0,
        chance: 0
      };
      0 === v1.loot_a["length"] ? v1.loot_a["push"]({
        flag: 32768,
        items: [v4]
      }) : 0 === v1.loot_a[0].items["length"] ? v1.loot_a[0].items["push"](v4) : v1.loot_a[0].items[0].item_id !== v3[v1.quest_id] && v1.loot_a[0].items["splice"](0, 0, v4)
    }
  }

  function v3(v1) {
    v1.objective_amount = 0, 0 !== v1.objectives[0].type && v1.objective_amount++, 0 !== v1.objectives[1].type && v1.objective_amount++, 0 !== v1.objective_sub["type"] && v1.three_obj_flag && v1.objective_amount++, v1.objective_or && (v1.objective_amount = 1)
  }

  function v4(v1) {
    if (v1.intruder_chance > 0 && v1.unstable_monster_table["length"] > 0) {
      v1.intruder_chance2 = 100, v1.intruder_flag = 1;
      var v2 = !1;
      if (v1.pictures["forEach"](function(v1) {
          84 === v1 && (v2 = !0)
        }), !v2) {
        for (var v3 = !1, v4 = 0; 5 > v4; v4++) {
          if (98 === v1.pictures[v4]) {
            v1.pictures[v4] = 84, v3 = !0;
            break
          }
        };
        v3 || (v1.pictures[4] = 84)
      }
    } else {
      v1.intruder_chance = 0, v1.intruder_chance2 = 0, v1.intruder_flag = 0
    }
  }

  function v5(v1) {
    v1.sub_flag = 0 === v1.objective_sub["type"] || v1.three_obj_flag ? 0 : 1
  }

  function v6(v1) {
    v1.large_monster_table["length"] > 1 ? (v1.quest_type |= 8, v1.huntathon_flag = 0) : v1.quest_type &= 247
  }

  function v7(v1) {
    v1.ship_integrity = 6 === v1.map_id ? 1 : 0
  }

  function v8(v1) {
    11 !== v1.map_id && (v1.arena_fence = 0, v1.fence_uptime = 0, v1.fence_state = 0, v1.fence_cooldown = 0)
  }

  function v9(v1) {
    v1.large_meta_table["forEach"](function(v1) {
      100 !== v1.size && (v1.size_var = 0)
    })
  }
  var va = angular.module("editor.utils.fix", ["editor.utils.constants"]);
  va.factory("$fix", ["constants", function(va) {
    var vb = {
      fix: function(vb) {
        return v1(vb, va), v2(vb, va), v7(vb), v3(vb), v4(vb), v6(vb), v5(vb), v8(vb), v9(vb), vb
      }
    };
    return vb
  }])
}()