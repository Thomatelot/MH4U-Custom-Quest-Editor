# Research notes

What the Citra edition relies on, found by reading the game's files (European version of MH4U) and a
real save. Everything here is implemented in `source/app/utils/citra_core.js` (files),
`mib.js` (quests) and `tools/gamedata/` (game data), and checked by the tests where it says so.

## Where the game keeps downloaded quests

MH4U stores what it downloaded (event, challenge and episodic quests, DLC palicos) in its **extra
data**, next to the save:

    <sdmc>/Nintendo 3DS/<id0>/<id1>/extdata/00000000/00001261/user/
        quest1  quest2  quest3     event quests          (IDs 60xxx)
        quest4                     challenge quests      (IDs 61xxx)
        quest5                     episodic quests       (IDs 62xxx)
        otomo1                     DLC palicos
        user1                      the save (never touched by the editor)

`00001261` is the European version. The editor also accepts any extdata folder whose `quest*` files
have the right size; `00001263` is labelled as the North American version, untested.

Citra keeps `sdmc` in its user folder (`%APPDATA%\Citra`, a `user` folder next to a portable Citra,
`~/.local/share/citra-emu`...), or in the folder given by `use_custom_storage` / `sdmc_directory` in
`config/qt-config.ini`. Forks (Lime3DS, Azahar) use the same layout.

## Encryption ("savedata" cipher)

`quest1`..`quest5`, `otomo1` (and the save `user1`) use the same cipher:

1. **Blowfish** in ECB mode with the key `blowfish key iorajegqmrna4itjeangmb agmwgtobjteowhv9mope`,
   where every 32-bit word is **little-endian** (Capcom's flavour; standard Blowfish is big-endian).
2. After decryption the first u16 is `0x10` and the next u16 is a **seed**. From offset 4 to the end,
   every u16 is XORed with a key stream: `key = (key == 0 ? 1 : key) * 0xB0 % 0xFF53`, starting from the
   seed.
3. Offset 4 then holds a u32 **checksum**: the sum of every byte of the body (from offset 8).
4. `quest1`..`quest5` end with 0x100 bytes that are not encrypted (zeros).

Writing does the reverse with a new random seed. The tests decode the files of a real save and encode
them again **byte for byte** (with the same seed), and check the Blowfish implementation against
OpenSSL.

## Quest packs (`quest1`..`quest5`)

| | |
|---|---|
| File size | 0x50400 (328,704 bytes): encrypted part + 0x100 zero bytes |
| Decrypted body | 0x502F8 bytes |
| Slots | 40 × 0x2010 bytes: the quest (`.mib`, plain, at most **0x2000 = 8192 bytes**, padded with zeros) and its file name on 0x10 bytes (`m60001.mib`) |
| After the slots | 0x78 bytes, kept as they are |

An empty slot is all zeros. The quest ID is a u16 at offset 0x20 of the quest header block, whose
address is the first u32 of the `.mib` (the `.mib` starts with that pointer and the version `v005`).

**Size limit.** The original editor's exporter could write quests bigger than 8192 bytes (8 of the 139
quests of a real save, once exported again), which do not fit in a slot. The Citra edition writes quests
compactly and deterministically, keeping every unknown byte: the 139 quests are read back identically and
the largest takes 5712 bytes (`tests/test_mib_roundtrip.js`).

## Palicos (`otomo1`)

0x2200 bytes, same cipher without the zero trailer. Decrypted body 0x21F8 bytes. The first slot holds a
palico (`.otb`, 0x80 bytes) followed by its file name on 0x10 bytes (`ot001_eng.otb`). Only one palico
was ever seen in a real file, so the slots after the first (0x90 bytes apart) are **experimental**.

## Quest IDs

`code.bin` holds the **list of the DLC quest IDs** the game accepts: 16-bit values from 60001, ended by
0 (193 values, 191 different: 121 event, 52 challenge, 18 episodic). A downloaded quest whose ID is not
in the list is not shown.

It also holds a table of **10-byte records** for 139 of these IDs: the ID (u16), an item (u16) and up to
six monster IDs (bytes, 0 = none). These are the monsters of the original DLC quest; a record with
no monster means "any monster" (most of the free IDs). The original
editor's copy of this table had 16 differences with the game. Whether the game refuses a quest whose
monsters differ from the record **is not known**: the editor shows the record (ID picker) and warns
(quest check), but does not block.

| Kind | IDs in the list | Official quests | File |
|---|---|---|---|
| Event | 60001-60252 (121) | 78 | `quest1`-`quest3` (120 slots) |
| Challenge | 61001-61280 | 24 | `quest4` (40 slots) |
| Episodic | 62101-62212 (18) | 18 | `quest5` |

Challenge IDs 61251-61280 are in the list but not in the record table: **experimental**.

**Official or custom?** A quest of the save is treated as official when its ID belongs to an official
quest **and** its title (in any of the five languages) is the official one, from the lists of the
Monster Hunter Wiki and the Fandom wiki (two titles are spelled differently there). Everything else is
a custom quest and can be replaced.

**"You cannot accept this Quest data".** The game shows this when it refuses a quest. Seen with:
a refill that points to a supply box the quest does not have; a second main objective of type hunt with
no monster. Fixing both made a quest work on ID 60024; the same quest was still refused on ID 60117,
for a reason not found (both IDs have an empty monster record, so any monster should be allowed). The quest check covers the known
causes.

## Monster statistics

`code.bin` holds at `0xE3A330` (EU) a table of **141 rows × 8 floats**. A quest's Health, Attack and
Resistance fields are **row numbers** into it, not percentages:

| Column | Used by | Effect |
|---|---|---|
| 1 | Health | HP = base HP of the monster × value |
| 2 | Attack | every hit of the monster × value |
| 3 | Resistance | damage the monster takes × value (lower = tougher) |
| 4-8 | Resistance | tolerances (flinch, KO, exhaust, mount, trip...): exact order not confirmed |

Examples: row 20 = HP × 0.7; row 130 = attack × 18. The fields accept 0-255, but the table ends at row
140 and no official quest goes higher; what the game does above 140 is not known. *Stamina* and
*Status* are small profile numbers (0-4, 0-2) pointing to tables that were not decoded.

The **base HP** of each monster is a u32 at offset 16 of its parameter file in `data/em_data.arc`
(Rathalos 4200, Rathian 4500, Great Jaggi 2600...).

## Hidden fields kept by the editor

Fields of the official quests the original editor did not show, and that it lost or overwrote. The
Citra edition keeps the original bytes when it rewrites a quest:

* quest types 0, 16 and 160, objective 2048 ("reach the goal", research quests);
* a **scenario** byte that selects a scripted quest (tutorials, harvest tour, hunt-a-thon), and a few
  header bytes used by some quests (meaning unknown);
* large monster `unk2`: 1 on the second monster of two-monster waves;
* small monster "crash flag": 1 for small monsters, 5 for large monsters in the small-monster list,
  and 3, 4 or 6 on about 5 % of the entries (meaning unknown);
* small monster "condition": 255 = always there, 1-70 = tied to a spawn condition of the quest;
* every value of the *Special* field used by an official quest (each monster reads it its own way:
  Congalala's mushroom, Akantor 1 = always enraged, Ruby Basarios 0 / 1 = fire / gas, 100 and above in
  collaboration quests...).

## Relics

Relic weapons and armor (items 762-767 and 1650-1653) can be put in any reward table. What a relic turns
into (weapon type, armor series, piece) is **not in the quest**: expedition quests (IDs 45000-45002,
Everwood) take that bias from the save. A custom quest can give relics but not choose what they become.

## Not possible without changing the game

New monsters, maps or items, more than 3 × 40 event slots, or new quest IDs. The editor only writes
quests into the files the game already has, so the game itself is unchanged.
