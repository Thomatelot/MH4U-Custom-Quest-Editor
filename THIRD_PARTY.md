# Third-party material and data sources

## What this repository contains

* **The application** (`source/`): dasding's *MH4U Custom Quest Editor* v2.1.5 (published under the MIT
  licence, as its `package.json` says), made readable again (it was shipped minified) and extended by the
  Citra edition: `app/utils/citra_core.js`, `citra.js`, `gamedata.js`, `findbar.js`,
  `app/views/game/`, `app/views/guide/`, `app/views/editor/editor_extras.js`,
  `app/locales/citra_texts.js` and many changes in the other files. MIT (see `LICENSE`).
* **`tests/`, `tools/`, `docs/`**: written for the Citra edition, MIT.
* **`source/app/data/gamedata.js`**: tables of facts about the game that the editor needs: the
  difficulty table (141 rows of multipliers read from the game's `code.bin`), the base HP of the monsters
  (read from the game's monster data), the list of DLC quest IDs and the original monsters of each ID
  (read from `code.bin`), the titles of the official event quests (English and French), and statistics
  of the official quests (common values, reward, supply, small-monster and objective patterns, spawn
  positions, uses of the *Special* field and of hidden fields). Computed from the author's own copy of
  the game with the scripts of `tools/gamedata/`. They hold numbers and names, not pictures, text blocks,
  sounds or program code of the game, and none of your quests.
* **`tools/gamedata/wiki_event_titles.json`, `fandom_titles.json`**: the titles of the official event
  quests as listed by the [Monster Hunter Wiki](https://monsterhunterwiki.org/wiki/Category:MH4U_Quests)
  and the [Monster Hunter Fandom wiki](https://monsterhunter.fandom.com/); used only to tell official
  quests from custom ones. The research on relics (guide, *Hidden parameters*) also used the Fandom wiki.
  No wiki text or image is included.
* The monster difficulty ratings (1 to 5) of the monster browser and the guide are an estimate written
  for this editor (`tools/gamedata/data/monster_info.py`), not values of the game.

## Capcom's pictures (not under the MIT licence)

The monster and quest preview icons (`source/img/sprite1.png`), the palico pictures
(`palico.png`, `abilitites.png`), the map pictures (`maps/`, `overview/`), the area pictures (`areas/`)
and the application icon (`source/icon.png`) are **Capcom's artwork**. Most come with dasding's original
editor; the overview maps and a few area pictures were taken from the game's files by the author of the
Citra edition. They are included only so that the editor can show the monsters and maps it edits, as
many fan tools do. They remain Capcom's property and are **not** covered by this project's licence. If
you are a rights holder and want them removed, open an Issue and they will be.

The pictures in `source/img/eggs/` (easter eggs of the original editor) come with dasding's editor.

Monster Hunter is a trademark of Capcom. This project is not affiliated with Capcom or Nintendo.

## Libraries and fonts

| What | Where | Licence |
|---|---|---|
| AngularJS 1.4.4 and angular-route | `source/bower_components/angular*` | MIT, (c) Google, Inc. |
| jQuery 2.1.4 | `source/bower_components/jquery` | MIT, (c) jQuery Foundation |
| Semantic UI 2.0.8 (with its icon font, from Font Awesome) | `source/bower_components/semantic-ui` | MIT; the icon font: SIL Open Font License 1.1 |
| Lato | `source/fonts/` | SIL Open Font License 1.1, (c) Łukasz Dziedzic |
| pako 1.0.11 (interface tests only) | `tests/ui/pako.min.js` | MIT and Zlib, (c) Andrei Tuputcyn, Vitaly Puzrin, Jean-loup Gailly, Mark Adler |
| NW.js runtime (releases only, not in the repository) | next to `MH4U Quest Editor.exe` | MIT (NW.js); BSD-style and other open-source licences for Chromium and Node.js |

The runtime of the releases is the one dasding's editor shipped (an NW.js 0.12-era build from 2016);
`tools/build_exe.py` takes it from an existing exe and appends the application to it.
