# Changelog

The Citra edition continues dasding's *MH4U Custom Quest Editor* (last version 2.1.5, 2016). Its own
version numbers start again at 1.0.0 with this first public release.

## 1.0.0

First public release. Everything below is new or fixed compared with dasding's editor 2.1.5.

### Quests straight into the game

* The quests are written into the game's own quest files (`quest1`..`quest5`, `otomo1`) in Citra's save
  folder, found by itself (Citra, Lime3DS, Azahar, a portable Citra, or a folder chosen in *Settings*).
  This replaces the proxy of the original editor, which stopped working with the 3DS online services.
  No ROM hack: the game is not changed.
* **In-game quests** page: every slot of the event, challenge and episodic quests and of the DLC
  palicos; copy to the library, put a quest in a slot, replace or clear your own quests, export `.mib`.
  An emptied slot keeps showing the ID it had.
* **Automatic IDs:** leave the ID at 0 (Auto). A free ID that works with any monster (or with the
  quest's monsters) is used first, then the ID of one of your own quests, then a free ID that asks for
  other monsters. The chosen ID is saved in the library. An **ID picker** lists your own slots and the
  free IDs (views *Custom*, *Free IDs with conditions*, *All IDs*).
* **Official quests are locked** (78 event, 24 challenge and 18 episodic quests, from the MH4U wikis):
  never replaced or deleted, but they can be copied to the library.
* **Before writing**, a window shows where each quest goes and what the quest check found.
* **Backups:** the six game files before every write (`Backups`), a manual backup, restore in one click
  (the current state is backed up first). The **original quests** of the game are found in the backups:
  a slot that lost its official quest offers to put it back, and a backup can be the source of *Put a
  quest here*. Each backup gets a small `index.json` so the page stays fast with many backups.
* Writes go through a temporary file; if a write fails, the list is reloaded from the files. A warning
  appears when the emulator is running.

### Help in the editor

* **Quest check:** a ⚠ badge lists what the game may refuse (*"You cannot accept this Quest data"*): a
  refill that points to a supply box that does not exist, a hunt / slay / capture / break objective
  without a monster, an ID used with monsters it does not list, rewards that do not add up to 100 %.
  Simple cases are fixed in one click. Removing a supply box renumbers the refills.
* **Auto-fill** from the official quests of the same map, rank and monsters: rewards (tables A, B and
  subquest, with the rare items of the monsters), Supply Box (map items, standard kit, refills, box by
  box), small monsters (the most common layout of each area, or the layout of one official quest).
* Common values of the official quests (fees, Zenny, HRP) behind a **?**; proposals for the main
  objectives, subquest and requirements; official spawn positions of each area; real HP, damage dealt
  and damage taken of a large monster; standard values (low, high, G rank, highest in the game).
* Browsers for monsters (type, species, estimated difficulty, base HP), maps (pictures), items (category,
  monster) and preview icons. Adding a monster or an item opens the browser; nothing is added before a
  choice.
* *Special*: every value used by an official quest can be chosen; Everwood rules with a button.
* **Guide** (button of the library): monster stats with a calculator and the full table of the game,
  monsters, the *Special* field, quest IDs, maps, hidden parameters (with the research on relics).
* **Ctrl+F** in every page; the interface text can be selected and copied.
* Texts of this edition in English and French.

### Library

* **Collections:** your own groups of quests (name, colour), filter buttons, grouped view, move quests,
  export one collection (importing it creates the collection again).
* **Library backups:** *Backup library* copies the whole library (with its collections) to
  `Library_Backups`; a copy is also made every 12 hours, before *Delete All* and before a restore (30
  kept). *Restore library* lists them, or restores a `.cmib` file.
* *In game* column: where each quest is in the game.

### Updates

* *Settings > Check for updates* compares the version with the one on GitHub, shows what changed and
  replaces the program in one click (the library, backups and settings are not touched). The editor
  only goes online when this button is pressed.

### Fixed (from the original editor)

* An exported quest could be bigger than **8192 bytes**, the size of a slot of the game. The new exporter
  is compact, lossless and deterministic: the 139 quests of a real save are read back identically, 5712
  bytes at most.
* The unknown bytes of the header and quest block of official quests were lost on export: they are kept,
  as are the rare small-monster flag values (3, 4, 6) and the quest types 0 and 16 and objective 2048 of
  official quests.
* Small monsters: one stat byte was read at the wrong place and another one cleared on export.
* The *JP encrypted* export used the US/EU key.
* A new quest with an ID outside 60000-62999 silently disappeared when saved: an error is shown.
* Importing invalid files showed nothing; importing a library backup (`.cmib`) gave an error after
  importing: both fixed.
* The original list of the monsters allowed on each DLC ID had 16 differences with the game; it is now read
  from the game.
* Decryption of encrypted `.mib` files made more robust; small fixes (palico dialogue choice, `NaN` in the
  old exporter).

### Removed

* The proxy, puush uploads, the old update check and the statistics of the original editor (their
  servers are gone), and its dead contact links.
