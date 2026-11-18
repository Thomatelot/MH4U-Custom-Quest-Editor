! function() {
  function v1(v1) {
    var v2, v3, v4;
    for (v3 = "", v2 = 0; 4 > v2; v2++) {
      v4 = v1 >> 8 * v2 & 255, v3 = String.fromCharCode(v4) + v3
    };
    return v3
  }

  function v2(v1) {
    if (v1.length < 4) {
      return 0
    };
    var v2, v3;
    for (v3 = 0, v2 = 0; 4 > v2; v2++) {
      v3 += v1[v2].charCodeAt(0) << 8 * (3 - v2)
    };
    return v3
  }

  function v3(v1, v2) {
    for (; v1.length % v2 !== 0;) {
      v1 += "\u0000"
    };
    return v1
  }

  function v4(v1) {
    var v2, v3, v4;
    for (v4 = "", v2 = 0; v2 < v1.length; v2 += 4) {
      for (v3 = 3; v3 > -1; v3--) {
        v4 += v1.substring(v2 + v3, v2 + v3 + 1)
      }
    };
    return v4
  }

  function v5(v1, v2) {
    return v1.charAt(v2)
  }

  function v6(v1, v2, v3) {
    return v1.substring(v2, v2 + v3)
  }

  function v7(v1) {
    var v2, v3;
    for (v3 = 0, v2 = 0; v2 < v1.length; v2++) {
      v3 += v1[v2].charCodeAt(0) << 8 * v2
    };
    return v3
  }

  function v8(v1, v2) {
    return v7(v1.charAt(v2))
  }

  function v9(v1, v2, v3) {
    return v8(v1, v2) & 1 << v3 ? 1 : 0
  }

  function va(v1, v2) {
    return v7(v1.substring(v2, v2 + 2))
  }

  function vb(v1, v2) {
    return v7(v1.substring(v2, v2 + 4))
  }

  function vc(v1, v2) {
    for (var v3 = new ArrayBuffer(4), v4 = new Uint8Array(v3), v5 = new Float32Array(v3), v6 = 0; 4 > v6; v6++) {
      v4[v6] = v1[v2 + v6].charCodeAt(0)
    };
    return v5[0]
  }

  function vd(v1, v2, v3) {
    var v4 = 0,
      v5 = [];
    for (v4 = 0; v3 > v4; v4++) {
      v5.push(va(v1, v2)), v2 += 2
    };
    return v5
  }

  function ve(v1, v2, v3) {
    var v4 = 0,
      v5 = [];
    for (v4 = 0; v3 > v4; v4++) {
      v5.push(vb(v1, v2)), v2 += 4
    };
    return v5
  }

  function vf(v1, v2) {
    for (var v3 = 0, v4 = [];;) {
      if (v3 = vb(v1, v2), 0 === v3) {
        break
      };
      v4.push(v3), v2 += 4
    };
    return v4
  }

  function v10(v1, v2) {
    for (var v3, v4, v6 = "";;) {
      if (v3 = v5(v1, v2), v4 = v5(v1, v2 + 1), 0 === v3.charCodeAt(0) && 0 === v4.charCodeAt(0)) {
        break
      };
      if ("" === v3 && "" === v4) {
        break
      };
      v6 += String.fromCharCode(v7(v3 + v4)), v2 += 2
    };
    return v6
  }

  function v11(v1, v2) {
    var v3, v4, v5;
    for (v4 = "", v3 = 0; v2 > v3; v3++) {
      v5 = v1 >> 8 * v3 & 255, v4 += String.fromCharCode(v5)
    };
    return v4
  }

  function v12(v1, v2, v3) {
    return v1.substring(0, v2) + v3 + v1.substring(v2 + v3.length, v1.length)
  }

  function v13(v1, v2, v3, v4) {
    return v1.substring(0, v2) + v11(v3, v4) + v1.substring(v2 + v4, v1.length)
  }

  function v14(v1, v2, v3) {
    return v13(v1, v2, v3, 1)
  }

  function v15(v1, v2, v3, v4) {
    var v5 = v8(v1, v2);
    return v4 ? v5 |= 1 << v3 : v5 &= ~(1 << v3), v14(v1, v2, v5)
  }

  function v16(v1, v2, v3) {
    return v13(v1, v2, v3, 2)
  }

  function v17(v1, v2, v3) {
    return v13(v1, v2, v3, 4)
  }

  function v18(v1, v2, v3) {
    var v4 = new ArrayBuffer(4),
      v5 = new Uint8Array(v4),
      v6 = new Float32Array(v4),
      v7 = "";
    v6[0] = v3;
    for (var v8 = 0; 4 > v8; v8++) {
      v7 += String.fromCharCode(v5[v8])
    };
    return v1.substring(0, v2) + v7 + v1.substring(v2 + 4, v1.length)
  }

  function v19(v1, v2, v3) {
    for (var v4 = "", v5 = 0; v5 < v3.length; v5++) {
      v4 += String.fromCharCode(255 & v3[v5].charCodeAt(0)), v4 += String.fromCharCode(v3[v5].charCodeAt(0) >> 8)
    };
    return v1.substring(0, v2) + v4 + v1.substring(v2 + 2 * v3.length, v1.length)
  }

  function v1a(v1, v2, v3) {
    for (var v4 = 0; v4 < v3.length; v4++) {
      v1 = v16(v1, v2 + 2 * v4, v3[v4])
    };
    return v1
  }

  function v1b(v1, v2) {
    for (var v3 = {}; v1.length % 16 !== 0;) {
      v1 += "\u0000"
    };
    v3.addr = v1.length;
    for (var v4 = 0; v2 > v4; v4++) {
      v1 += "\u0000"
    };
    return v3.buf = v1, v3
  }

  function v1c(v2, v5) {
    var v6, v7, v8;
    return v6 = v3d.createCipheriv("bf-ecb", v5, ""), v7 = v3d.createHash("sha1"), v7.update(v2), v2 += v7.digest().toString("binary"), v8 = v2.length, v2 = v3(v2, 8), v2 = v4(v2), v6.write(v2, "binary"), v2 = v6.read().toString("binary"), v2 = v4(v2), v2 += v1(v8)
  }

  function v1d(v1, v3) {
    var v5, v6;
    return v5 = v3d.createDecipheriv("bf-ecb", v3, ""), v6 = v2(v1.substring(v1.length - 4, v1.length)), 0 === v6 ? "" : (v1 = v1.substring(0, v1.length - 4), v1 = v4(v1), v5.write(v1, "binary"), v1 = v5.read(), null === v5 ? "" : (v1 = v1.toString("binary"), v1 = v4(v1), v1 = v1.substring(0, v6)))
  }

  function v1e(v1, v2) {
    var v3, v4, v5, v6, v7, v8, v9, va = vb(v1, v2),
      vc = [];
    for (v6 = ve(v1, va, 5), v8 = 0; v8 < v6.length && (v3 = v6[v8], 0 !== v3); v8++) {
      for (v5 = [], v7 = ve(v1, v3, 7), v9 = 0; v9 < v7.length; v9++) {
        v4 = v7[v9], v5.push(v10(v1, v4))
      };
      vc.push(v5)
    };
    return vc
  }

  function v1f(v1, v2) {
    var v3 = {};
    return v3.type = vb(v1, v2), v3.target_id = va(v1, v2 + 4), v3.qty = va(v1, v2 + 6), v3
  }

  function v20(v1) {
    for (var v2, v3, v4, v5, v6, v7, v9 = vb(v1, 8), vc = [], vd = 0; 100 > vd && (v2 = v8(v1, v9 + 8 * vd), 255 != v2);) {
      for (v3 = v8(v1, v9 + 8 * vd + 1), v4 = vb(v1, v9 + 8 * vd + 4), v5 = [], v7 = 0; v3 > v7 && (v6 = {}, v6.item_id = va(v1, v4 + 4 * v7), v6.qty = va(v1, v4 + 4 * v7 + 2), 0 !== v6.item_id); v7++) {
        v5.push(v6)
      };
      vc.push(v5), vd++
    };
    return vc
  }

  function v21(v1) {
    for (var v2 = [{}, {}], v3 = 0; 2 > v3; v3++) {
      v2[v3].box = v8(v1, 12 + 8 * v3), v2[v3].condition = v8(v1, 13 + 8 * v3), v2[v3].monster = v8(v1, 14 + 8 * v3), v2[v3].qty = v8(v1, 16 + 8 * v3)
    };
    return v2
  }

  function v22(v1, v2) {
    var v3 = vb(v1, v2);
    if (0 === v3) {
      return [{
        flag: 32768,
        items: []
      }]
    };
    for (var v4, v5, v6, v7, v8, v9 = [], vc = 0; 100 > vc && (v4 = vb(v1, v3 + 8 * vc), 65535 !== v4 && 0 !== v4);) {
      for (v5 = vb(v1, v3 + 8 * vc + 4), v6 = [], v7 = 0; 100 > v7 && (item_chance = va(v1, v5 + 6 * v7), 65535 !== item_chance);) {
        item = {}, item.chance = va(v1, v5 + 6 * v7), item.item_id = va(v1, v5 + 6 * v7 + 2), item.qty = va(v1, v5 + 6 * v7 + 4), v6.push(item), v7++
      };
      v8 = {}, v8.flag = v4, v8.items = v6, v9.push(v8), vc++
    };
    return 0 === v9.length && v9.push({
      flag: 32768,
      items: []
    }), v9
  }

  function v23(v1, v2) {
    var v3 = {};
    return v3.monster_id = vb(v1, v2 + 0), v3.qty = vb(v1, v2 + 4), v3.condition = v8(v1, v2 + 8), v3.area = v8(v1, v2 + 9), v3.crashflag = v8(v1, v2 + 10), v3.special = v8(v1, v2 + 11), v3.unk2 = v8(v1, v2 + 12), v3.unk3 = v8(v1, v2 + 13), v3.unk4 = v8(v1, v2 + 14), v3.infection = v8(v1, v2 + 15), v3.x = vc(v1, v2 + 16), v3.y = vc(v1, v2 + 20), v3.z = vc(v1, v2 + 24), v3.x_rot = vb(v1, v2 + 28), v3.y_rot = vb(v1, v2 + 32), v3.z_rot = vb(v1, v2 + 36), v3
  }

  function v24(v1) {
    var v2 = vb(v1, 40),
      v3 = [];
    return vf(v1, v2).forEach(function(v2) {
      for (var v4, v5, v6 = [], v7 = 0; 5 > v7 && (v4 = vb(v1, v2 + 40 * v7), -1 !== v4);) {
        v5 = v23(v1, v2 + 40 * v7), v6.push(v5), v7++
      };
      v3.push(v6)
    }), v3
  }

  function v25(v1) {
    var v2 = vb(v1, 44),
      v3 = [];
    return vf(v1, v2).forEach(function(v2) {
      v3.push([]), vf(v1, v2).forEach(function(v2) {
        for (var v4, v5, v6 = [], v7 = 0; 100 > v7 && (v4 = vb(v1, v2 + 40 * v7), -1 !== v4);) {
          v5 = v23(v1, v2 + 40 * v7), v6.push(v5), v7++
        };
        v3[v3.length - 1].push(v6)
      })
    }), v3
  }

  function v26(v1) {
    for (var v2, v3, v4 = vb(v1, 48), v5 = [], v6 = 0; 100 > v6 && (v2 = va(v1, v4 + 44 * v6), 65535 !== v2);) {
      v3 = v23(v1, v4 + 44 * v6 + 4), v5.push({
        chance: v2,
        monster: v3
      }), v6++
    };
    return v5
  }

  function v27(v1, v2) {
    var v3 = {};
    return v3.size = va(v1, v2), v3.unk0 = v8(v1, v2 + 2), v3.hp = v8(v1, v2 + 3), v3.atk = v8(v1, v2 + 4), v3.break_res = v8(v1, v2 + 5), v3.stamina = v8(v1, v2 + 6), v3.status_res = v8(v1, v2 + 7), v3
  }

  function v28(v1, v2) {
    var v3 = {};
    return v3.size = va(v1, v2), v3.size_var = v8(v1, v2 + 2), v3.hp = v8(v1, v2 + 3), v3.atk = v8(v1, v2 + 4), v3.break_res = v8(v1, v2 + 5), v3.stamina = v8(v1, v2 + 6), v3.status_res = v8(v1, v2 + 7), v3
  }

  function v29(v1) {
    for (var v2 = 52, v3 = [], v4 = 0; 5 > v4; v4++) {
      v3.push(v28(v1, v2 + 8 * v4))
    };
    return v3
  }

  function v2a(v1) {
    for (var v2, v3 = 100, v4 = [], v5 = 0; 2 > v5; v5++) {
      v2 = {}, v2.type = v8(v1, v3 + 0 + 8 * v5), v2.target = va(v1, v3 + 4 + 8 * v5), v2.qty = v8(v1, v3 + 6 + 8 * v5), v2.group = v8(v1, v3 + 7 + 8 * v5), v4.push(v2)
    };
    return v4
  }

  function v2b(v1) {
    var v2 = {},
      v3 = vb(v1, 0) - 160;
    return v2.version = v6(v1, 4, 4), v2.hrp = vb(v1, 116), v2.hrp_reduction = vb(v1, 120), v2.hrp_sub = vb(v1, 124), v2.intruder_timer = v8(v1, 128), v2.intruder_chance = v8(v1, 130), v2.gather_rank = v8(v1, 137), v2.carve_rank = v8(v1, 138), v2.monster_ai = v8(v1, 139), v2.spawn_area = v8(v1, 140), v2.arena_fence = v8(v1, 141), v2.fence_state = v8(v1, 142), v2.fence_uptime = v8(v1, 143), v2.fence_cooldown = v8(v1, 144), v2.quest_type = v8(v1, v3 + 160), v2.huntathon_flag = v9(v1, v3 + 161, 0), v2.intruder_flag = v9(v1, v3 + 161, 1), v2.repel_flag = v9(v1, v3 + 161, 2), v2.unknown0_flag = v9(v1, v3 + 161, 3), v2.unknown1_flag = v9(v1, v3 + 162, 0), v2.harvest_flag = v9(v1, v3 + 162, 1), v2.challenge_flag = v9(v1, v3 + 162, 2), v2.unknown2_flag = v9(v1, v3 + 162, 3), v2.kushala_flag = v9(v1, v3 + 162, 4), v2.unknown4_flag = v9(v1, v3 + 162, 5), v2.sub_flag = v9(v1, v3 + 162, 6), v2.three_obj_flag = v9(v1, v3 + 162, 7), v2.unknown5_flag = v9(v1, v3 + 163, 0), v2.advanced_flag = v9(v1, v3 + 163, 1), v2.unknown6_flag = v9(v1, v3 + 163, 2), v2.ship_integrity = v9(v1, v3 + 163, 3), v2.fee = vb(v1, v3 + 164), v2.reward_main = vb(v1, v3 + 168), v2.reward_reduction = vb(v1, v3 + 172), v2.reward_sub = vb(v1, v3 + 176), v2.time = vb(v1, v3 + 180), v2.intruder_chance2 = vb(v1, v3 + 184), v2.text = v1e(v1, v3 + 188), v2.quest_id = va(v1, v3 + 192), v2.quest_rank = va(v1, v3 + 194), v2.map_id = v8(v1, v3 + 196), v2.requirements = [0, 0], v2.requirements[0] = v8(v1, v3 + 197), v2.requirements[1] = v8(v1, v3 + 198), v2.objective_amount = v8(v1, v3 + 203), v2.objectives = [0, 0], v2.objectives[0] = v1f(v1, v3 + 204), v2.objectives[1] = v1f(v1, v3 + 212), v2.objective_sub = v1f(v1, v3 + 220), v2.pictures = vd(v1, v3 + 232, 5), v2.supplies = v20(v1), v2.refills = v21(v1), v2.loot_a = v22(v1, 28), v2.loot_b = v22(v1, 32), v2.loot_c = v22(v1, 36), v2.small_monster_conditions = v2a(v1), v2.large_monster_table = v24(v1), v2.small_monster_table = v25(v1), v2.unstable_monster_table = v26(v1), v2.large_meta_table = v29(v1), v2.small_meta = v27(v1, 92), v2
  }

  function v2c(v1, v2, v3) {
    return v1 = v17(v1, v2, v3.type), v1 = v17(v1, v2 + 4, v3.target_id), v1 = v17(v1, v2 + 6, v3.qty)
  }

  function v2d(v1, v2, v3) {
    var v4 = [],
      v5 = 0;
    v3.forEach(function(v2) {
      var v3, v6 = v2.length,
        v7 = v1b(v1, 4 * v6),
        v8 = v7.addr;
      v1 = v7.buf;
      for (var v9 = 0; v6 > v9; v9++) {
        v3 = v2[v9], v1 = v16(v1, v8 + 4 * v9, v3.item_id), v1 = v16(v1, v8 + 4 * v9 + 2, v3.qty)
      };
      v4.push([v5, v6, v8]), v5++
    });
    var v6 = v1b(v1, 8 * v4.length),
      v7 = v6.addr;
    v1 = v6.buf;
    for (var v8 = 0; v8 < v4.length; v8++) {
      v1 = v14(v1, v7 + 8 * v8, v4[v8][0]), v1 = v14(v1, v7 + 8 * v8 + 1, v4[v8][1]), v1 = v17(v1, v7 + 8 * v8 + 4, v4[v8][2])
    };
    return v1 += "\u00ff", v1 = v16(v1, v2, v7)
  }

  function v2e(v1, v2, v3) {
    for (var v4 = 0; 2 > v4; v4++) {
      v1 = v14(v1, v2 + 0 + 8 * v4, v3[v4].box), v1 = v14(v1, v2 + 1 + 8 * v4, v3[v4].condition), v1 = v14(v1, v2 + 2 + 8 * v4, v3[v4].monster), v1 = v14(v1, v2 + 4 + 8 * v4, v3[v4].qty)
    };
    return v1
  }

  function v2f(v1, v2, v3) {
    var v4 = [];
    v3.forEach(function(v2) {
      var v3 = v2.items["length"],
        v5 = v1b(v1, 6 * v3),
        v6 = v5.addr;
      v1 = v5.buf;
      for (var v7 = 0; v3 > v7; v7++) {
        v1 = v16(v1, v6 + 6 * v7, v2.items[v7].chance), v1 = v16(v1, v6 + 6 * v7 + 2, v2.items[v7].item_id), v1 = v16(v1, v6 + 6 * v7 + 4, v2.items[v7].qty)
      };
      v1 += "\u00ff\u00ff", v4.push([v2.flag, v6])
    });
    var v5 = v1b(v1, 8 * v4.length),
      v6 = v5.addr;
    v1 = v5.buf;
    for (var v7 = 0; v7 < v4.length; v7++) {
      v1 = v16(v1, v6 + 8 * v7, v4[v7][0]), v1 = v17(v1, v6 + 8 * v7 + 4, v4[v7][1])
    };
    return v1 += "\u00ff\u00ff", v1 = v17(v1, v2, v6)
  }

  function v30(v1, v2, v3) {
    return v1 = v17(v1, v2 + 0, v3.monster_id), v1 = v17(v1, v2 + 4, v3.qty), v1 = v14(v1, v2 + 8, v3.condition), v1 = v14(v1, v2 + 9, v3.area), v1 = v14(v1, v2 + 10, v3.crashflag), v1 = v14(v1, v2 + 11, v3.special), v1 = v14(v1, v2 + 12, v3.unk2), v1 = v14(v1, v2 + 13, v3.unk3), v1 = v14(v1, v2 + 14, v3.unk4), v1 = v14(v1, v2 + 15, v3.infection), v1 = v18(v1, v2 + 16, v3.x), v1 = v18(v1, v2 + 20, v3.y), v1 = v18(v1, v2 + 24, v3.z), v1 = v17(v1, v2 + 28, v3.x_rot), v1 = v17(v1, v2 + 32, v3.y_rot), v1 = v17(v1, v2 + 36, v3.z_rot)
  }

  function v31(v1, v2, v3) {
    var v4 = [];
    v3.forEach(function(v2) {
      var v3 = v1b(v1, 40 * v2.length),
        v5 = v3.addr;
      v1 = v3.buf;
      for (var v6 = 0; v6 < v2.length; v6++) {
        v1 = v30(v1, v5 + 40 * v6, v2[v6])
      };
      v1 += "\u00ff\u00ff\u00ff\u00ff", v1 += "\u0000\u0000\u0000\u0000", v1 += "\u00ff", v4.push(v5)
    });
    var v5 = v1b(v1, 4 * v4.length),
      v6 = v5.addr;
    v1 = v5.buf;
    for (var v7 = 0; v7 < v4.length; v7++) {
      v1 = v17(v1, v6 + 4 * v7, v4[v7])
    };
    return v1 += "\u0000\u0000\u0000\u0000", v1 = v17(v1, v2, v6)
  }

  function v32(v1, v2, v3) {
    var v4 = [];
    v3.forEach(function(v2) {
      var v3 = [];
      v2.forEach(function(v2) {
        var v4 = v1b(v1, 40 * v2.length),
          v5 = v4.addr;
        v1 = v4.buf;
        for (var v6 = 0; v6 < v2.length; v6++) {
          v1 = v30(v1, v5 + 40 * v6, v2[v6])
        };
        v1 += "\u00ff\u00ff\u00ff\u00ff", v1 += "\u0000\u0000\u0000\u0000", v1 += "\u00ff", v3.push(v5)
      });
      var v5 = v1b(v1, 4 * v3.length),
        v6 = v5.addr;
      v1 = v5.buf;
      for (var v7 = 0; v7 < v3.length; v7++) {
        v1 = v17(v1, v6 + 4 * v7, v3[v7])
      };
      v1 += "\u0000\u0000\u0000\u0000", v4.push(v6)
    });
    var v5 = v1b(v1, 4 * v4.length),
      v6 = v5.addr;
    v1 = v5.buf;
    for (var v7 = 0; v7 < v4.length; v7++) {
      v1 = v17(v1, v6 + 4 * v7, v4[v7])
    };
    return v1 += "\u0000\u0000\u0000\u0000", v1 = v17(v1, v2, v6)
  }

  function v33(v1, v2, v3) {
    var v4, v5 = v1b(v1, 44 * v3.length),
      v6 = v5.addr;
    v1 = v5.buf;
    for (var v7 = 0; v7 < v3.length; v7++) {
      v4 = v3[v7], v1 = v16(v1, v6 + 44 * v7, v4.chance), v1 = v30(v1, v6 + 44 * v7 + 4, v4.monster)
    };
    return 0 === v3.length && (v1 += "\u00ff\u00ff\u0000\u0000"), v1 += "\u00ff\u00ff\u00ff\u00ff", v1 += "\u0000\u0000\u0000\u0000", v1 += "\u00ff", v1 = v17(v1, v2, v6)
  }

  function v34(v1, v2, v3) {
    return v1 = v16(v1, v2, v3.size), v1 = v14(v1, v2 + 2, v3.unk0), v1 = v14(v1, v2 + 3, v3.hp), v1 = v14(v1, v2 + 4, v3.atk), v1 = v14(v1, v2 + 5, v3.break_res), v1 = v14(v1, v2 + 6, v3.stamina), v1 = v14(v1, v2 + 7, v3.status_res)
  }

  function v35(v1, v2, v3) {
    return v1 = v16(v1, v2, v3.size), v1 = v14(v1, v2 + 2, v3.size_var), v1 = v14(v1, v2 + 3, v3.hp), v1 = v14(v1, v2 + 4, v3.atk), v1 = v14(v1, v2 + 5, v3.break_res), v1 = v14(v1, v2 + 6, v3.stamina), v1 = v14(v1, v2 + 7, v3.status_res)
  }

  function v36(v1, v2, v3) {
    for (var v4 = 0; 5 > v4; v4++) {
      v1 = v35(v1, v2 + 8 * v4, v3[v4])
    };
    return v1
  }

  function v37(v1, v2) {
    var v3 = [];
    v2.forEach(function(v2) {
      var v4 = v1b(v1, 2 * v2.length),
        v5 = v4.addr;
      v1 = v4.buf, v1 = v19(v1, v5, v2), v1 += "\u0000\u0000", v3.push(v5)
    });
    var v4 = v1b(v1, 4 * v3.length),
      v5 = v4.addr;
    v1 = v4.buf;
    for (var v6 = 0; v6 < v3.length; v6++) {
      v1 = v17(v1, v5 + 4 * v6, v3[v6])
    };
    return {
      buf: v1,
      addr: v5
    }
  }

  function v38(v1, v2) {
    var v3 = v1b(v1, 4 * v2.length),
      v4 = v3.addr;
    v1 = v3.buf;
    for (var v5 = 0; v5 < v2.length; v5++) {
      v1 = v17(v1, v4 + 4 * v5, v2[v5])
    };
    return v1 += "\u0000\u0000\u0000\u0000", {
      buf: v1,
      addr: v4
    }
  }

  function v39(v1, v2, v3) {
    for (var v4 = 0; 2 > v4; v4++) {
      v1 = v14(v1, v2 + 0 + 8 * v4, v3[v4].type), v1 = v16(v1, v2 + 4 + 8 * v4, v3[v4].target), v1 = v14(v1, v2 + 6 + 8 * v4, v3[v4].qty), v1 = v14(v1, v2 + 7 + 8 * v4, v3[v4].group)
    };
    return v1
  }

  function v3a(v1, v2, v3) {
    var v4 = v1b(v1, 96);
    v1 = v4.buf, v1 = v17(v1, v2, v4.addr);
    var v5 = v4.addr - 160;
    return v1 = v14(v1, v5 + 160, v3.quest_type), v1 = v15(v1, v5 + 161, 0, v3.huntathon_flag), v1 = v15(v1, v5 + 161, 1, v3.intruder_flag), v1 = v15(v1, v5 + 161, 2, v3.repel_flag), v1 = v15(v1, v5 + 161, 3, v3.unknown0_flag), v1 = v15(v1, v5 + 162, 0, v3.unknown1_flag), v1 = v15(v1, v5 + 162, 1, v3.harvest_flag), v1 = v15(v1, v5 + 162, 2, v3.challenge_flag), v1 = v15(v1, v5 + 162, 3, v3.unknown2_flag), v1 = v15(v1, v5 + 162, 4, v3.kushala_flag), v1 = v15(v1, v5 + 162, 5, v3.unknown4_flag), v1 = v15(v1, v5 + 162, 6, v3.sub_flag), v1 = v15(v1, v5 + 162, 7, v3.three_obj_flag), v1 = v15(v1, v5 + 163, 0, v3.unknown5_flag), v1 = v15(v1, v5 + 163, 1, v3.advanced_flag), v1 = v15(v1, v5 + 163, 2, v3.unknown6_flag), v1 = v15(v1, v5 + 163, 3, v3.ship_integrity), v1 = v17(v1, v5 + 164, v3.fee), v1 = v17(v1, v5 + 168, v3.reward_main), v1 = v17(v1, v5 + 172, v3.reward_reduction), v1 = v17(v1, v5 + 176, v3.reward_sub), v1 = v17(v1, v5 + 180, v3.time), v1 = v17(v1, v5 + 184, v3.intruder_chance2), v1 = v16(v1, v5 + 192, v3.quest_id), v1 = v16(v1, v5 + 194, v3.quest_rank), v1 = v14(v1, v5 + 196, v3.map_id), v1 = v14(v1, v5 + 197, v3.requirements[0]), v1 = v14(v1, v5 + 198, v3.requirements[1]), v1 = v14(v1, v5 + 203, v3.objective_amount), v1 = v2c(v1, v5 + 204, v3.objectives[0]), v1 = v2c(v1, v5 + 212, v3.objectives[1]), v1 = v2c(v1, v5 + 220, v3.objective_sub), v1 = v1a(v1, v5 + 232, v3.pictures), {
      buf: v1,
      addr: v4.addr
    }
  }

  function v3b(v1) {
    var v2 = "";
    v2 = v1b(v2, 160).buf, v2 = v12(v2, 4, v1.version), v2 = v14(v2, 12, v1.refill1), v2 = v14(v2, 13, v1.refill2), v2 = v36(v2, 52, v1.large_meta_table), v2 = v34(v2, 92, v1.small_meta), v2 = v39(v2, 100, v1.small_monster_conditions), v2 = v17(v2, 116, v1.hrp), v2 = v17(v2, 120, v1.hrp_reduction), v2 = v17(v2, 124, v1.hrp_sub), v2 = v14(v2, 128, v1.intruder_timer), v2 = v14(v2, 130, v1.intruder_chance), v2 = v14(v2, 137, v1.gather_rank), v2 = v14(v2, 138, v1.carve_rank), v2 = v14(v2, 139, v1.monster_ai), v2 = v14(v2, 140, v1.spawn_area), v2 = v14(v2, 141, v1.arena_fence), v2 = v14(v2, 142, v1.fence_state), v2 = v14(v2, 143, v1.fence_uptime), v2 = v14(v2, 144, v1.fence_cooldown);
    for (var v3, v4, v5 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], v6 = [0, 0, 0, 0, 0], v7 = 0; v5.length > 0;) {
      switch (v3 = v5.splice(Math.floor(Math.random() * v5.length), 1)[0]) {
        case 0:
          v4 = v3a(v2, 0, v1), v2 = v4.buf, v7 = v4.addr;
          break;
        case 1:
          v4 = v37(v2, v1.text[0]), v2 = v4.buf, v6[0] = v4.addr;
          break;
        case 2:
          v4 = v37(v2, v1.text[1]), v2 = v4.buf, v6[1] = v4.addr;
          break;
        case 3:
          v4 = v37(v2, v1.text[2]), v2 = v4.buf, v6[2] = v4.addr;
          break;
        case 4:
          v4 = v37(v2, v1.text[3]), v2 = v4.buf, v6[3] = v4.addr;
          break;
        case 5:
          v4 = v37(v2, v1.text[4]), v2 = v4.buf, v6[4] = v4.addr;
          break;
        case 6:
          v2 = v2d(v2, 8, v1.supplies);
          break;
        case 7:
          v2 = v2e(v2, 12, v1.refills);
          break;
        case 8:
          v2 = v2f(v2, 28, v1.loot_a);
          break;
        case 9:
          v2 = v2f(v2, 32, v1.loot_b);
          break;
        case 10:
          v2 = v2f(v2, 36, v1.loot_c);
          break;
        case 11:
          v2 = v31(v2, 40, v1.large_monster_table);
          break;
        case 12:
          v2 = v32(v2, 44, v1.small_monster_table);
          break;
        case 13:
          v2 = v33(v2, 48, v1.unstable_monster_table)
      }
    };
    return v4 = v38(v2, v6), v2 = v4.buf, v2 = v17(v2, v7 + 188 - 160, v4.addr)
  }

  /* ==================================================================
   * Compact, lossless mib writer (MH4U Citra edition)
   *
   * The original exporter (v3b above, kept for reference) aligned every
   * block to 16 bytes, wrote shared tables several times and shuffled the
   * block order. Many quests ended up larger than 8192 bytes, which is
   * the size of an event-quest slot in the game's extdata, and some
   * unknown bytes of official quests were dropped.
   *
   * This writer produces the same structure the game uses:
   *  - deterministic layout, 4-byte alignment
   *  - identical blocks (empty supply boxes, the 3 small monster waves,
   *    identical strings...) are stored once and shared
   *  - unknown bytes of the 160-byte header and of the 96-byte quest block
   *    are preserved (json.raw_header / json.raw_quest, filled by parse)
   * ================================================================== */
  function MibWriter() {
    this.b = [];
    this.cache = {};
  }
  MibWriter.prototype.align = function (n) {
    while (this.b.length % n) { this.b.push(0); }
  };
  // append a block (array of byte values) and return its address
  MibWriter.prototype.block = function (bytes, align, share) {
    var key, addr, i;
    if (share) {
      key = align + ':' + bytes.join(',');
      if (this.cache.hasOwnProperty(key)) { return this.cache[key]; }
    }
    this.align(align || 4);
    addr = this.b.length;
    for (i = 0; i < bytes.length; i++) { this.b.push(bytes[i] & 0xff); }
    if (share) { this.cache[key] = addr; }
    return addr;
  };
  MibWriter.prototype.toBinaryString = function () {
    var s = '', i, CH = 0x2000;
    this.align(16);
    for (i = 0; i < this.b.length; i += CH) {
      s += String.fromCharCode.apply(null, this.b.slice(i, i + CH));
    }
    return s;
  };

  function B(n) { var a = new Array(n), i; for (i = 0; i < n; i++) { a[i] = 0; } return a; }
  function num(v) { v = Number(v); return isNaN(v) ? 0 : v; }
  function p8(a, o, v) { a[o] = num(v) & 0xff; }
  function p16(a, o, v) { v = num(v); a[o] = v & 0xff; a[o + 1] = (v >>> 8) & 0xff; }
  function p32(a, o, v) { v = num(v) >>> 0; a[o] = v & 0xff; a[o + 1] = (v >>> 8) & 0xff; a[o + 2] = (v >>> 16) & 0xff; a[o + 3] = (v >>> 24) & 0xff; }
  function pf32(a, o, v) {
    var buf = new ArrayBuffer(4), f = new Float32Array(buf), u = new Uint8Array(buf), i;
    f[0] = num(v);
    for (i = 0; i < 4; i++) { a[o + i] = u[i]; }
  }
  function pbit(a, o, bit, on) { if (on) { a[o] |= (1 << bit); } else { a[o] &= ~(1 << bit); } }
  function push(a, arr) { var i; for (i = 0; i < arr.length; i++) { a.push(arr[i]); } return a; }
  function cat(a, b) { return push(a.slice(), b); }

  function monsterBytes(m) {
    var a = B(40);
    p32(a, 0, m.monster_id); p32(a, 4, m.qty);
    p8(a, 8, m.condition); p8(a, 9, m.area); p8(a, 10, m.crashflag); p8(a, 11, m.special);
    p8(a, 12, m.unk2); p8(a, 13, m.unk3); p8(a, 14, m.unk4); p8(a, 15, m.infection);
    pf32(a, 16, m.x); pf32(a, 20, m.y); pf32(a, 24, m.z);
    p32(a, 28, m.x_rot); p32(a, 32, m.y_rot); p32(a, 36, m.z_rot);
    return a;
  }
  var MONSTER_LIST_END = [255, 255, 255, 255, 0, 0, 0, 0, 255, 0, 0, 0];

  function monsterList(w, list) {
    var a = [], i;
    for (i = 0; i < list.length; i++) { push(a, monsterBytes(list[i])); }
    push(a, MONSTER_LIST_END);
    return w.block(a, 4, true);
  }
  function pointerList(w, addrs) {
    var a = B(4 * addrs.length + 4), i;
    for (i = 0; i < addrs.length; i++) { p32(a, 4 * i, addrs[i]); }
    return w.block(a, 4, true);
  }
  function utf16(str) {
    var a = [], i, c;
    str = str || '';
    for (i = 0; i < str.length; i++) { c = str.charCodeAt(i); a.push(c & 0xff, (c >>> 8) & 0xff); }
    a.push(0, 0);
    return a;
  }

  function exportCompact(q) {
    var w = new MibWriter(), hdr, qb, i, j, a, addrs, langs, entries, items;

    /* 160-byte header, always at offset 0 */
    hdr = B(160);
    if (q.raw_header && q.raw_header.length === 160) { hdr = q.raw_header.slice(); }
    for (i = 0; i < 4; i++) { hdr[4 + i] = (q.version || 'v005').charCodeAt(i) & 0xff; }
    w.block(hdr, 4, false);

    /* quest block (96 bytes) */
    qb = (q.raw_quest && q.raw_quest.length === 96) ? q.raw_quest.slice() : B(96);
    p8(qb, 0, q.quest_type);
    pbit(qb, 1, 0, q.huntathon_flag); pbit(qb, 1, 1, q.intruder_flag); pbit(qb, 1, 2, q.repel_flag); pbit(qb, 1, 3, q.unknown0_flag);
    pbit(qb, 2, 0, q.unknown1_flag); pbit(qb, 2, 1, q.harvest_flag); pbit(qb, 2, 2, q.challenge_flag); pbit(qb, 2, 3, q.unknown2_flag);
    pbit(qb, 2, 4, q.kushala_flag); pbit(qb, 2, 5, q.unknown4_flag); pbit(qb, 2, 6, q.sub_flag); pbit(qb, 2, 7, q.three_obj_flag);
    pbit(qb, 3, 0, q.unknown5_flag); pbit(qb, 3, 1, q.advanced_flag); pbit(qb, 3, 2, q.unknown6_flag); pbit(qb, 3, 3, q.ship_integrity);
    p32(qb, 4, q.fee); p32(qb, 8, q.reward_main); p32(qb, 12, q.reward_reduction); p32(qb, 16, q.reward_sub);
    p32(qb, 20, q.time); p32(qb, 24, q.intruder_chance2);
    p16(qb, 32, q.quest_id); p16(qb, 34, q.quest_rank); p8(qb, 36, q.map_id);
    p8(qb, 37, q.requirements[0]); p8(qb, 38, q.requirements[1]); p8(qb, 43, q.objective_amount);
    [[44, q.objectives[0]], [52, q.objectives[1]], [60, q.objective_sub]].forEach(function (o) {
      p32(qb, o[0], o[1].type); p16(qb, o[0] + 4, o[1].target_id); p16(qb, o[0] + 6, o[1].qty);
    });
    for (i = 0; i < 5; i++) { p16(qb, 72 + 2 * i, q.pictures[i]); }

    /* texts: 5 languages x 7 strings */
    langs = [];
    for (i = 0; i < 5; i++) {
      addrs = [];
      for (j = 0; j < 7; j++) { addrs.push(w.block(utf16((q.text[i] || [])[j]), 4, true)); }
      a = B(28);
      for (j = 0; j < 7; j++) { p32(a, 4 * j, addrs[j]); }
      langs.push(w.block(a, 4, true));
    }
    p32(qb, 28, pointerList(w, langs));
    p32(hdr, 0, w.block(qb, 4, false));

    /* supplies */
    entries = [];
    (q.supplies || []).forEach(function (box, idx) {
      var it = [], k;
      for (k = 0; k < box.length; k++) { a = B(4); p16(a, 0, box[k].item_id); p16(a, 2, box[k].qty); push(it, a); }
      entries.push([idx, box.length, w.block(it.length ? it : B(4), 4, true)]);
    });
    a = [];
    entries.forEach(function (e) { var x = B(8); p8(x, 0, e[0]); p8(x, 1, e[1]); p32(x, 4, e[2]); push(a, x); });
    push(a, [255, 0, 0, 0, 0, 0, 0, 0]);
    p32(hdr, 8, w.block(a, 4, false));

    /* refills */
    for (i = 0; i < 2; i++) {
      var r = (q.refills && q.refills[i]) || {};
      p8(hdr, 12 + 8 * i, r.box); p8(hdr, 13 + 8 * i, r.condition); p8(hdr, 14 + 8 * i, r.monster); p8(hdr, 16 + 8 * i, r.qty);
    }

    /* rewards A/B/C */
    [['loot_a', 28], ['loot_b', 32], ['loot_c', 36]].forEach(function (lt) {
      var groups = q[lt[0]] || [], tbl = [];
      groups.forEach(function (g) {
        var it = [], k, x;
        for (k = 0; k < g.items.length; k++) { x = B(6); p16(x, 0, g.items[k].chance); p16(x, 2, g.items[k].item_id); p16(x, 4, g.items[k].qty); push(it, x); }
        push(it, [255, 255, 0, 0]);
        x = B(8); p16(x, 0, g.flag); p32(x, 4, w.block(it, 4, true)); push(tbl, x);
      });
      push(tbl, [255, 255, 0, 0, 0, 0, 0, 0]);
      p32(hdr, lt[1], w.block(tbl, 4, true));
    });

    /* large monsters: waves */
    addrs = (q.large_monster_table || []).map(function (wave) { return monsterList(w, wave); });
    p32(hdr, 40, pointerList(w, addrs));

    /* small monsters: waves -> groups */
    addrs = (q.small_monster_table || []).map(function (wave) {
      return pointerList(w, wave.map(function (grp) { return monsterList(w, grp); }));
    });
    p32(hdr, 44, pointerList(w, addrs));

    /* intruders ("unstable") */
    a = [];
    (q.unstable_monster_table || []).forEach(function (u) { var x = B(4); p16(x, 0, u.chance); push(a, x); push(a, monsterBytes(u.monster)); });
    if (!a.length) { push(a, [255, 255, 0, 0]); }
    push(a, MONSTER_LIST_END);
    p32(hdr, 48, w.block(a, 4, true));

    /* monster stats */
    for (i = 0; i < 5; i++) {
      var m = q.large_meta_table[i] || {};
      p16(hdr, 52 + 8 * i, m.size); p8(hdr, 54 + 8 * i, m.size_var); p8(hdr, 55 + 8 * i, m.hp); p8(hdr, 56 + 8 * i, m.atk);
      p8(hdr, 57 + 8 * i, m.break_res); p8(hdr, 58 + 8 * i, m.stamina); p8(hdr, 59 + 8 * i, m.status_res);
    }
    var sm = q.small_meta || {};
    p16(hdr, 92, sm.size); p8(hdr, 94, sm.unk0); p8(hdr, 95, sm.hp); p8(hdr, 96, sm.atk); p8(hdr, 97, sm.break_res);
    p8(hdr, 98, sm.stamina); p8(hdr, 99, sm.status_res);

    for (i = 0; i < 2; i++) {
      var c = (q.small_monster_conditions && q.small_monster_conditions[i]) || {};
      p8(hdr, 100 + 8 * i, c.type); p16(hdr, 104 + 8 * i, c.target); p8(hdr, 106 + 8 * i, c.qty); p8(hdr, 107 + 8 * i, c.group);
    }
    p32(hdr, 116, q.hrp); p32(hdr, 120, q.hrp_reduction); p32(hdr, 124, q.hrp_sub);
    p8(hdr, 128, q.intruder_timer); p8(hdr, 130, q.intruder_chance);
    p8(hdr, 137, q.gather_rank); p8(hdr, 138, q.carve_rank); p8(hdr, 139, q.monster_ai); p8(hdr, 140, q.spawn_area);
    p8(hdr, 141, q.arena_fence); p8(hdr, 142, q.fence_state); p8(hdr, 143, q.fence_uptime); p8(hdr, 144, q.fence_cooldown);

    /* write the final header and quest block back in place */
    for (i = 0; i < 160; i++) { w.b[i] = hdr[i]; }
    var qa = (hdr[0] | (hdr[1] << 8) | (hdr[2] << 16) | (hdr[3] << 24)) >>> 0;
    for (i = 0; i < 96; i++) { w.b[qa + i] = qb[i]; }
    return w.toBinaryString();
  }

  function rawBytes(s, off, n) {
    var a = [], i;
    for (i = 0; i < n; i++) { a.push(off + i < s.length ? s.charCodeAt(off + i) & 0xff : 0); }
    return a;
  }

  function parseFull(s) {
    var q = v2b(s), qa = vb(s, 0);
    q.raw_header = rawBytes(s, 0, 160);
    q.raw_quest = rawBytes(s, qa, 96);
    return q;
  }

  function dlcDecrypt(data, key) {
    // DLC (server) encryption: blowfish over byte-swapped words of (mib + sha1), then the size
    // (big-endian in files made by this editor, little-endian in files made by other tools)
    var size, d, out, tail, be, le;
    if (data.length < 32 || (data.length - 4) % 8) { return ''; }
    tail = data.substring(data.length - 4);
    be = v2(tail);
    le = v7(tail);
    size = (be >= 20 && be <= data.length - 4) ? be : ((le >= 20 && le <= data.length - 4) ? le : 0);
    if (!size) { return ''; }
    try {
      d = v3d.createDecipheriv('bf-ecb', new Buffer(key, 'binary'), '');
      d.setAutoPadding(false);
      out = v4(data.substring(0, data.length - 4));
      out = d.update(out, 'binary', 'binary') + d.final('binary');
      return v4(out).substring(0, size - 20);      // drop the sha1
    } catch (e) {
      return '';
    }
  }

  var v3c = angular.module("editor.utils.mib", []),
    v3d = require("crypto"),
    v3e = "AgK2DYheaCjyHGPB",
    v3f = "AgK2DYheaCjyHGP8",
    v40 = "AgK2DYheaOjyHGP8",
    v41 = "Capcom123 ",
    v42 = "v005";
  v3c.factory("$mib", function() {
    var KEYS = [v3f, v3e, v40, v41];
    return {
      decrypt: function(v1) {
        var i, d;
        if (v1.substring(4, 8) == v42) { return v1; }
        for (i = 0; i < KEYS.length; i++) {
          d = dlcDecrypt(v1, KEYS[i]);
          if (d.substring(4, 8) == v42) { return d; }
        }
        return null;
      },
      encrypt: function(v1, v2) {
        var v3;
        switch (v1) {
          case "none":
          case "":
            return v2;
          case "us":
          case "eu":
            v3 = v3e;
            break;
          case "kr":
            v3 = v40;
            break;
          case "jp":       // the export dialogs use "jp" (was falling back to the US/EU key)
          case "nihon":
            v3 = v3f;
            break;
          case "tw":
            v3 = v41;
            break;
          default:
            v3 = v3e
        }
        return v1c(v2, v3)
      },
      parse: parseFull,
      "export": exportCompact,
      export_legacy: v3b,
      MAX_SIZE: 8192
    }
  })
}()
