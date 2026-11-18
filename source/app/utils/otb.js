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

  function v6(v1) {
    var v2, v3;
    for (v3 = 0, v2 = 0; v2 < v1.length; v2++) {
      v3 += v1[v2].charCodeAt(0) << 8 * v2
    };
    return v3
  }

  function v7(v1, v2) {
    return v6(v1.charAt(v2))
  }

  function v8(v1, v2) {
    return v6(v1.substring(v2, v2 + 4))
  }

  function v9(v1, v2) {
    for (var v3, v4, v7 = "";;) {
      if (v3 = v5(v1, v2), v4 = v5(v1, v2 + 1), 0 === v3.charCodeAt(0) && 0 === v4.charCodeAt(0)) {
        break
      };
      if ("" === v3 && "" === v4) {
        break
      };
      v7 += String.fromCharCode(v6(v3 + v4)), v2 += 2
    };
    return v7
  }

  function va(v1, v2) {
    var v3, v4, v5;
    for (v4 = "", v3 = 0; v2 > v3; v3++) {
      v5 = v1 >> 8 * v3 & 255, v4 += String.fromCharCode(v5)
    };
    return v4
  }

  function vb(v1, v2, v3, v4) {
    return v1.substring(0, v2) + va(v3, v4) + v1.substring(v2 + v4, v1.length)
  }

  function vc(v1, v2, v3) {
    return vb(v1, v2, v3, 1)
  }

  function vd(v1, v2, v3) {
    return vb(v1, v2, v3, 4)
  }

  function ve(v1, v2, v3) {
    for (var v4 = "", v5 = 0; v5 < v3.length; v5++) {
      v4 += String.fromCharCode(255 & v3[v5].charCodeAt(0)), v4 += String.fromCharCode(v3[v5].charCodeAt(0) >> 8)
    };
    return v1.substring(0, v2) + v4 + v1.substring(v2 + 2 * v3.length, v1.length)
  }

  function vf(v1, v2) {
    for (var v3 = {}; v1.length % 4 !== 0;) {
      v1 += "\u0000"
    };
    v3.addr = v1.length;
    for (var v4 = 0; v2 > v4; v4++) {
      v1 += "\u0000"
    };
    return v3.buf = v1, v3
  }

  function v10(v2, v5) {
    var v6, v7, v8;
    return v6 = v15.createCipheriv("bf-ecb", v5, ""), v7 = v15.createHash("sha1"), v7.update(v2), v2 += v7.digest().toString("binary"), v8 = v2.length, v2 = v3(v2, 8), v2 = v4(v2), v6.write(v2, "binary"), v2 = v6.read().toString("binary"), v2 = v4(v2), v2 += v1(v8)
  }

  function v11(v1, v3) {
    var v5, v6;
    return v5 = v15.createDecipheriv("bf-ecb", v3, ""), v6 = v2(v1.substring(v1.length - 4, v1.length)), 0 === v6 ? "" : (v1 = v4(v1), v5.write(v1, "binary"), v1 = v5.read(), null === v5 ? "" : (v1 = v1.toString("binary"), v1 = v4(v1), v1 = v1.substring(0, v6 - 20)))
  }

  function v12(v1) {
    var v2 = {};
    v2.level = v7(v1, 8), v2.s00 = v7(v1, 9), v2.s01 = v7(v1, 10), v2.ability = v7(v1, 11), v2.skill1 = v7(v1, 12), v2.skill2 = v7(v1, 13), v2.skill3 = v7(v1, 14), v2.skillSig = v7(v1, 15), v2.skill4 = v7(v1, 16), v2.skill5 = v7(v1, 17), v2.teamAtk = v7(v1, 18), v2.coat = v7(v1, 19), v2.clothing = v7(v1, 20), v2.voice = v7(v1, 21), v2.eyes = v7(v1, 22), v2.ears = v7(v1, 23), v2.tail = v7(v1, 24), v2.unk0 = v7(v1, 25), v2.unk1 = v7(v1, 26), v2.unk2 = v7(v1, 27), v2.coat_r = v7(v1, 28), v2.coat_g = v7(v1, 29), v2.coat_b = v7(v1, 30), v2.t1 = v7(v1, 31), v2.clothing_r = v7(v1, 32), v2.clothing_g = v7(v1, 33), v2.clothing_b = v7(v1, 34), v2.t2 = v7(v1, 35);
    var v3 = v8(v1, 36);
    return v2.owner = v9(v1, v8(v1, v3)), v2.name = v9(v1, v8(v1, v3 + 4)), v2.shout = v9(v1, v8(v1, v3 + 8)), v2
  }

  function v13(v1) {
    var v2, v3 = "";
    for (v3 = vf(v3, 40).buf, v3 = vc(v3, 8, v1.level), v3 = vc(v3, 9, v1.s00), v3 = vc(v3, 10, v1.s01), v3 = vc(v3, 11, v1.ability), v3 = vc(v3, 12, v1.skill1), v3 = vc(v3, 13, v1.skill2), v3 = vc(v3, 14, v1.skill3), v3 = vc(v3, 15, v1.skillSig), v3 = vc(v3, 16, v1.skill4), v3 = vc(v3, 17, v1.skill5), v3 = vc(v3, 18, v1.teamAtk), v3 = vc(v3, 19, v1.coat), v3 = vc(v3, 20, v1.clothing), v3 = vc(v3, 21, v1.voice), v3 = vc(v3, 22, v1.eyes), v3 = vc(v3, 23, v1.ears), v3 = vc(v3, 24, v1.tail), v3 = vc(v3, 25, v1.unk0), v3 = vc(v3, 26, v1.unk1), v3 = vc(v3, 27, v1.unk2), v3 = vc(v3, 28, v1.coat_r), v3 = vc(v3, 29, v1.coat_g), v3 = vc(v3, 30, v1.coat_b), v3 = vc(v3, 31, v1.t1), v3 = vc(v3, 32, v1.clothing_r), v3 = vc(v3, 33, v1.clothing_g), v3 = vc(v3, 34, v1.clothing_b), v3 = vc(v3, 35, v1.t2), v3 = vd(v3, 36, 40), v3 = vf(v3, 16).buf, v2 = vf(v3, 2 * v1.owner["length"] + 2), v3 = v2.buf, v3 = ve(v3, v2.addr, v1.owner), v3 = vd(v3, 40, v2.addr), v2 = vf(v3, 2 * v1.name["length"] + 2), v3 = v2.buf, v3 = ve(v3, v2.addr, v1.name), v3 = vd(v3, 44, v2.addr), v2 = vf(v3, 2 * v1.shout["length"] + 2), v3 = v2.buf, v3 = ve(v3, v2.addr, v1.shout), v3 = vd(v3, 48, v2.addr); v3.length < 128;) {
      v3 += "\u0000"
    };
    return v3
  }
  var v14 = angular.module("editor.utils.otb", []),
    v15 = require("crypto"),
    v16 = "AgK2DYheaCjyHGPB",
    v17 = "AgK2DYheaCjyHGP8",
    v18 = "AgK2DYheaOjyHGP8",
    v19 = "Capcom123 ",
    v1a = "\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000";
  v14.factory("$otb", function() {
    return {
      decrypt: function(v1) {
        var v2;
        return v1.substring(0, 8) == v1a ? v1 : (v2 = v11(v1, v17), v2.substring(0, 8) == v1a ? v2 : (v2 = v11(v1, v16), v2.substring(0, 8) == v1a ? v2 : (v2 = v11(v1, v18), v2.substring(0, 8) == v1a ? v2 : (v2 = v11(v1, v19), v2.substring(0, 8) == v1a ? v2 : null))))
      },
      encrypt: function(v1, v2) {
        var v3;
        switch (v1) {
          case "none":
            ;
          case "":
            return v2;
          case "us":
            ;
          case "eu":
            v3 = v16;
            break;
          case "kr":
            v3 = v18;
            break;
          case "nihon":
            v3 = v17;
            break;
          case "tw":
            v3 = v19;
            break;
          default:
            v3 = v16
        };
        return v10(v2, v3)
      },
      parse: v12,
      "export": v13
    }
  })
}()