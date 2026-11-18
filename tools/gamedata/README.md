# Game data tools

`source/app/data/gamedata.js` holds the facts about the game the editor needs: the difficulty table,
the base HP of the monsters, the DLC quest IDs and their original monsters, the titles of the official
event quests, and statistics of the official quests (common values, rewards, supplies, small monsters,
objectives, spawn positions, uses of the *Special* field and of hidden fields). It is in the repository,
so **you do not need these tools to use or change the editor**. They rebuild it from your own copy of the
game, for example after improving a statistic.

Needs Python 3 and Node.js, the game's extracted `romfs`, its decompressed `exefs/code.bin`, and the
quest files of a save (`quest1`..`quest5`, a game backup of the editor will do). Use a separate work
folder: it receives game data and must never be shared or committed.

    python extract_inputs.py --romfs <romfs> --code <exefs/code.bin> --work <work>
    node dump_constants.js <work>
    node corpus.js <work>/base_mib <folder with quest1..quest5> <work>
    python build_data.py --work <work> --code <exefs/code.bin>

| Step | Reads | Writes |
|---|---|---|
| `extract_inputs.py` | `*/data/core_common.arc` (names, English and French), `data/em_data.arc` (base HP), `loc/data/quest*.arc` (quests of the game card), `code.bin` (DLC ID list and original monsters of the IDs) | `msgs.json`, `em_base_hp.json`, `dlc_tables.json`, `base_mib/` |
| `dump_constants.js` | `source/app/utils/constants.js` (the editor's tables) | `constants.json` |
| `corpus.js` | `base_mib/` and the five quest files of a save | `corpus.json` (every quest, parsed) |
| `build_data.py` | the work folder, `code.bin` (difficulty table at `0xE3A330`, 141 rows of 8 floats), `wiki_event_titles.json` / `fandom_titles.json`, `data/monster_info.py`, `source/img/areas/` | `source/app/data/gamedata.js` |

* Quests of the save whose title is not on the wiki lists (`wiki_event_titles.json`, `fandom_titles.json`)
  are custom quests: `build_data.py` leaves them out of every statistic, so your own quests never end up in
  the data.
* `data/monster_info.py` (species and an estimated difficulty of each monster) was written for the editor;
  it is not read from the game.
* The offsets were found in the European version (`code.bin` of MH4U EU). The tables are looked up by their
  content where possible, but other versions were not tried.
* `arc.py` reads the game's ARC archives, `lmd.py` its text files.
* The output is the same on every run (`build_data.py` fixes Python's hash seed). With the author's files it
  gives the data of the repository, but not necessarily in the same key order.
