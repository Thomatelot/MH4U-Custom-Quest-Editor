# Security and legal

## Reporting a problem

* **A bug, a crash, a quest that does not load:** open an Issue (see *Share your experience* in the
  README). Say what you did, the editor version, whether it was Citra or a real 3DS, and what the ⚠
  badge of the quest lists.
* **A security problem** (for example the editor writing outside the folders it should, or code
  execution from a quest file): please use GitHub's *Report a vulnerability* button on the *Security*
  tab of this repository (private), or open an Issue without technical details and ask for a private
  channel.

**Never attach game files** (ROM, `quest1`..`quest5`, `otomo1` or `user1` from your save) to an Issue, a
Discussion or a pull request. Share a quest as a `.mib` file from the library instead: it holds one
quest and nothing else (no ROM, no save), and it is useless without the game. Share quests you made or
changed; a quest copied unchanged from the game is Capcom's data, so do not post those.

## What the editor does and does not do

* It runs **offline**. The only exception is *Settings > Check for updates*: only when you click it, the
  editor reads two public files of this repository (`source/package.json` and `CHANGELOG.md`, from
  `raw.githubusercontent.com`) and, if you then click *Download and install*, downloads
  `MH4U Quest Editor.exe` from there. The download must be the editor, of the announced version (checked
  before anything is written). Nothing about you, your game or your quests is sent; GitHub only sees
  ordinary requests for public files. The other links of *Settings* open your web browser. The proxy,
  upload, update and statistics features of the original editor were removed.
* It only reads and writes in: the folder of the game's quest files (`quest1`..`quest5`, `otomo1`) that
  was found in Citra's folder or that you chose; its own `Backups` and `Library_Backups` folders (next to
  the program, or the backups folder chosen in *Settings*); its own storage (the library and settings,
  in the NW.js profile of the app); the files you export; and, when you install an update, the program
  file `MH4U Quest Editor.exe` (the previous one is renamed `MH4U Quest Editor.exe.old` and deleted at the
  next start). *Restart now* writes a small script to the temporary folder and runs it with Windows
  Script Host, to start the editor again once it is closed. It reads Citra's `config/qt-config.ini` to
  find a custom SD card folder. On Windows it runs `tasklist` to see whether an emulator is running.
* It never modifies the ROM or your game save (`user1`).
* Game files are written to a temporary file first, then renamed, and backed up before every write.
* It does not need administrator rights, contains no installer, and never updates itself without you
  asking.
* Quest files (`.mib`, `.cmib`) and palico files (`.otb`) are binary data read by the editor's own
  parser; nothing in them is executed. Still, only open quests from people you trust and keep your
  backups: a malformed quest can crash the *game*.
* The runtime is an NW.js build from 2016 (the one of the original editor). It only loads the editor's
  own files and opens no web page; do not use it for anything else.

## Legal notice

This is an unofficial fan-made tool. It is not affiliated with, endorsed by or supported by Capcom or
Nintendo. *Monster Hunter* is a trademark of Capcom Co., Ltd. All game content belongs to its owners.

* The repository contains **no game**: no ROM, no save and no quest file of the game. You must own a legal
  copy of Monster Hunter 4 Ultimate. It does include the small monster icons and map pictures the editor
  displays, which are Capcom's artwork (see `THIRD_PARTY.md`).
* Do not share ROMs, extracted game files or your save files.
* `source/app/data/gamedata.js` holds facts about the game (names, numbers, rules) compiled for this
  editor; see `THIRD_PARTY.md` for where they come from.
* Use at your own risk. Modifying quest files can corrupt a save or make the game crash; the code is
  provided "as is" under the MIT licence (see `LICENSE`), without warranty. **Keep backups.**
* Use it for single-player and with friends who have the same quests; do not use modified quests to
  disturb other players online.

If you are a rights holder and think something in this repository should not be here, open an Issue or
contact the author and it will be dealt with promptly.
