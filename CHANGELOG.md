# Changelog

Versions 1.x and 2.x are dasding's original *MH4U Custom Quest Editor* (2015-2016, last version 2.1.5).
The Citra edition starts at 3.0.0.

## 3.5.0

First public release. A review of the whole Citra edition; checked by the tests and in a browser with
copies of real game files.

* **Fix: restoring a library backup lost the collections.** A backup of the whole library only held the
  quests; it now also holds the collections (empty ones too), and restoring puts every quest back in its
  collection. Restoring no longer deletes the collections themselves. (Backups made by 3.4.5 have no
  collections: their quests come back unsorted.)
* **Faster *In-game quests* page with many backups:** to find the original quests and the last ID of an
  emptied slot, the page decrypted every game backup each time the editor started (about 0.15 s per
  backup, more with the old runtime). Each backup now gets a small `index.json` the first time it is read,
  and the page only reads those. A backup is decrypted again only to put one of its quests back.
* **Safer writes:** if writing the game files fails (disk full, file locked...), the list is reloaded from
  the files at once, so it never shows a change that was not written. The same for the palicos.
* **Settings:** the dead contact links of the original editor (freenode IRC, a goo.gl donation link) are
  replaced by the GitHub page of the project.
* **Guide:** *Quest IDs* now says that the quest check warns about the original monsters of an ID, what to
  do when the game answers *"You cannot accept this Quest data"*, which episodic IDs the game knows, and
  in which order *Auto* picks IDs (the guide still said "free IDs always first", true only before 3.4.2).
  The difficulty of the monsters (1 to 5) is now described as what it is: an estimate written for this
  editor, not a community or game value.
* ID picker: the *Auto* line no longer overflows its box.
* Window title and version of the program updated; unused files removed (a Japanese text file that was
  never loaded, unused fonts and style sheets of the libraries).
* The repository: README, licence, security notes, third-party notes, guide, research notes, interface
  tests and the script that takes the screenshots.

## 3.4.5

* An emptied slot keeps showing the ID it had (greyed, next to *free slot*), remembered when the slot is
  cleared or found in the backups.
* The game backup buttons are only on the *In-game quests* page (*Backup game quests* and *Restore...*),
  no longer on the library page.
* **Library backups:** *Backup library* writes the whole library to `Library_Backups` (next to `Backups`).
  A copy is also made every 12 hours, before *Delete All* and before a restore; the 30 newest are kept.
  *Restore library* lists them; a library can also be saved to or restored from a `.cmib` file. Restoring
  replaces the library (a safety copy is made first).

## 3.4.4

* **Original quests:** when one of your backups holds the official quest that was in a slot, an
  *Original quest* button puts it back, also on a slot that became empty. Clearing a custom quest that sits
  where an official quest was offers to put the official one back.
* In *Put a quest here*, the source can be **a game backup**: any quest of a backup (official or custom).

## 3.4.3

* **Quest check:** a ⚠ badge in the editor lists what the game may refuse (*"You cannot accept this Quest
  data"*): a refill that points to a supply box that does not exist, a hunt / slay / capture / break
  objective without a monster, an ID used with monsters it does not list, rewards that do not add up to
  100 %. Simple cases are fixed in one click. The checks also appear before writing into the game.
* Removing a supply box now renumbers the refills that point to the boxes after it.

## 3.4.2

* ID picker: by default (*Custom* view) it shows your own slots and the free IDs that work with any
  monster. Free IDs that need specific monsters are behind *Free IDs with conditions*; *All IDs* shows
  everything. *Auto* prefers your own slots to free IDs with conditions.

## 3.4.1

* The common values of the official quests (fees, Zenny, HRP) are shown only when you click the **?**
  next to the field.
* Proposals for the main objectives and the subquest, from the large monsters of the quest.
* **Ctrl+F**: a find bar in every page (Enter = next, Shift+Enter = previous, Escape = close).
* Adding a monster opens the browser directly; nothing is added before a monster is chosen.
* Relics: the research is in the guide (*Hidden parameters*); the option was removed, as what a relic
  turns into comes from the save, not from the quest.

## 3.4.0

* **Auto-fill of the Supply Box:** map items, standard kit and refills from the official quests of the
  same map, rank and monsters, previewed box by box.
* Interface text can be selected and copied.
* Common values of the official quests of the same star rank for fees, Zenny and HRP.
* Proposals for the quest requirements, from what the official quests ask.

## 3.3.1

* The monster browser is no longer blurred.

## 3.3.0

* **Collections** in the library: your own groups of quests (name and colour), filter buttons, grouped
  view with folding, move one quest or the ticked ones, rename / delete / reorder a collection (its quests
  are kept), export a collection as `.cmib` (importing it creates the collection again).
* Auto-fill of the rewards: the rare items of the monsters (gems, plates, mantles...) are no longer left out.
* Official quests are also found with the list of the Fandom wiki, so the DLC quests of the base game are
  locked and left out of the statistics.
* Standard values (low, high, G rank, highest in the game) for Health, Attack and Resistance, on a scale
  from 0 to 140 (last row of the game's table) and 255 (most the field accepts).
* Guide: personal examples removed; calculator and scales based on the standard values.

## 3.2.0

* **IDs:** free IDs are always used first, official quests are locked, your own quests can be replaced.
* The windows to choose an ID, a monster, an icon, a map or an auto-fill are plain panels in front of the
  editor that can no longer get stuck behind it; Escape or a click outside closes them.
* **Auto-fill of the rewards** (tables A, B and subquest) from the official quests that hunt the same
  monsters at the same rank, with a preview.
* The map is chosen in a grid of pictures.
* *Add Item* opens the list of all items; nothing is added before an item is chosen.

## 3.1.0

* **Automatic quest ID** (0 = Auto) and an ID picker.
* **Auto-fill of the small monsters:** the most common layout of each area in the official quests of the
  map (by rank), or the layout of one official quest.
* Official spawn positions of each area in the monster editor.
* Real HP, damage dealt and damage taken of a large monster (game table and base HP).
* **Built-in guide:** stats with a calculator, the full 141-row table, values of the official quests by
  rank, monsters, the *Special* field, quest IDs, maps, hidden parameters.
* Monster browser by type, species and difficulty, with base HP; preview icon browser; items by category
  and by monster.
* *Special*: the values used by the official quests can be chosen (*Variant N*).
* Everwood: the rules of the map (coordinates 0, 0, 0) with a button to apply them.
* Quest types 0 and 16 and objective 2048 (official quests) added; the rare small-monster flag values
  (3, 4, 6) are kept.

## 3.0.0

The Citra edition of dasding's editor v2.1.5.

* **New:** reading and writing of the event, challenge and episodic quests and DLC palicos of Citra
  (Citra, Lime3DS, Azahar, portable or a chosen folder); *In-game quests* page (copy to the library, put a
  quest in a slot, replace, clear, export `.mib`); *In game* column in the library; automatic backups
  and restore; warning when the emulator is running; files written through a temporary file; the original
  monsters of an ID shown for information; texts of this edition in English and French.
* **Fixed:**
  * an exported quest could be bigger than **8192 bytes**, the size of a slot of the game (8 of 139 quests
    of a real save, once exported again). New compact, lossless and deterministic exporter: 139 / 139
    quests read back identically, 5712 bytes at most;
  * the unknown bytes of the header and quest block of official quests were lost on export: they are kept;
  * small monsters: one stat byte was read at the wrong place and another one cleared on export;
  * the *JP encrypted* export used the US/EU key;
  * a new quest with an ID outside 60000-62999 silently disappeared when saved: an error is shown;
  * importing invalid files (drag and drop or button) showed nothing: an error is shown;
  * importing a library backup (`.cmib`) gave an error after importing;
  * decryption of encrypted `.mib` files made more robust; small fixes (palico dialogue choice, `NaN` in
    the old exporter).
* **Removed:** the proxy, puush uploads, the update check and the statistics (their servers are gone).
* The application code is readable (it was minified).
