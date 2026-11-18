"""
Extracts from your own copy of the game the inputs of build_data.py (except corpus.json and
constants.json, made by corpus.js and dump_constants.js).

    python extract_inputs.py --romfs <romfs folder> --code <exefs/code.bin> --work <work folder>

Writes into the work folder:
  base_mib/*.mib     the quests on the game card (loc/data/quest*.arc), for corpus.js
  msgs.json          monster, item and map names and descriptions, English and French (*/data/core_common.arc)
  em_base_hp.json    base HP of each monster (data/em_data.arc, 32-bit value at offset 16 of each monster's data)
  dlc_tables.json    the DLC quest IDs the game knows, and the original monsters of the IDs (code.bin)

code.bin must be the decompressed one (as dumped by Citra or GodMode9 with decompression).
"""
import argparse
import json
import os
import re
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from arc import read_arc          # noqa: E402
from lmd import lmd_strings       # noqa: E402

EM_DATA_TYPE = 1032567724         # entry type of the monster parameter files in em_data.arc
MIB_TYPE = 465555854              # entry type of the quests in loc/data/quest*.arc


def find(romfs, rel):
    """romfs/<rel>, or the first file with that name below romfs (extraction tools differ)"""
    p = os.path.join(romfs, *rel.split("/"))
    if os.path.isfile(p):
        return p
    want = rel.split("/")
    for base, _, files in os.walk(romfs):
        if want[-1] in files and base.replace("\\", "/").endswith("/".join(want[:-1])):
            return os.path.join(base, want[-1])
    raise SystemExit("not found in romfs: " + rel)


def texts(romfs):
    out = {}
    for lang, code in (("en", "eng"), ("fr", "fre")):
        a = {e["name"].split("\\")[-1]: e["data"] for e in read_arc(find(romfs, code + "/data/core_common.arc"))}
        for key, name in (("emName", "emName_"), ("itemName", "itemName_"), ("itemExp", "itemExp_"),
                          ("emExp", "emExp_"), ("map", "mapName_")):
            out[lang + "_" + key] = lmd_strings(a[name + code])
    return out


def base_hp(romfs):
    out = {}
    for e in read_arc(find(romfs, "data/em_data.arc")):
        if e["type"] == EM_DATA_TYPE:
            mid = int(re.search(r"em(\d+)", e["name"]).group(1))
            out[str(mid)] = struct.unpack_from("<I", e["data"], 16)[0]
    return out


def dlc_tables(code):
    # list of the DLC quest IDs: 16-bit IDs from 60001 on, ended by 0
    i = code.find(struct.pack("<3H", 60001, 60002, 60003))
    if i < 0:
        raise SystemExit("DLC ID list not found in code.bin (is it decompressed?)")
    master = []
    while True:
        v = struct.unpack_from("<H", code, i + 2 * len(master))[0]
        if not v:
            break
        master.append(v)
    # original monsters of the IDs: 10-byte records (ID, item, 6 monster bytes), from 60001 on
    start = -1
    pos = code.find(struct.pack("<H", 60001))
    while pos >= 0:
        if struct.unpack_from("<H", code, pos + 10)[0] == 60002 and struct.unpack_from("<H", code, pos + 20)[0] == 60003:
            start = pos
            break
        pos = code.find(struct.pack("<H", 60001), pos + 1)
    if start < 0:
        raise SystemExit("ID restriction table not found in code.bin")
    restr = {}
    o = start
    while True:
        qid, item = struct.unpack_from("<HH", code, o)
        if not 60000 <= qid < 63000:
            break
        restr[str(qid)] = {"item": item, "monsters": [b for b in code[o + 4:o + 10] if b]}
        o += 10
    return {"master": master, "restrictions": restr}


def base_quests(romfs, folder):
    os.makedirs(folder, exist_ok=True)
    n = 0
    d = os.path.dirname(find(romfs, "loc/data/quest00.arc"))
    for f in sorted(os.listdir(d)):
        if re.match(r"quest\d+\.arc$", f):
            for e in read_arc(os.path.join(d, f)):
                if e["type"] == MIB_TYPE:
                    with open(os.path.join(folder, e["name"].split("\\")[-1] + ".mib"), "wb") as out:
                        out.write(e["data"])
                    n += 1
    return n


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--romfs", required=True)
    ap.add_argument("--code", required=True)
    ap.add_argument("--work", required=True)
    a = ap.parse_args()
    os.makedirs(a.work, exist_ok=True)
    with open(a.code, "rb") as f:
        code = f.read()
    for name, data in (("msgs.json", texts(a.romfs)), ("em_base_hp.json", base_hp(a.romfs)), ("dlc_tables.json", dlc_tables(code))):
        with open(os.path.join(a.work, name), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print("written", name)
    print("base quests:", base_quests(a.romfs, os.path.join(a.work, "base_mib")))


if __name__ == "__main__":
    main()
