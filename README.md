# 🏡 Kaveri's Town: a pixel-art resume

My resume as a tiny explorable town. Pick a character, walk around, and step into
each building to read a section. Recruiters in a hurry can hit **📜 Quick View**
(or "Skip the game" on the start screen) to read everything on one page.

## Buildings

| Building | Section |
|---|---|
| 🏫 University | Education |
| 🏢 Glass office | Experience |
| 🧪 Tech lab | Projects |
| 🏡 Cottage (by the fountain) | About me |
| 📚 Library | Skills |
| 🏛️ Town hall (trophy room) | Achievements |
| ☕ Café | Leadership |
| 📮 Post office | Contact |

Each building has its own pixel-art interior (drawn in code in `interiors.js`, so it
animates): a high-tech lab and glass office, and a cozy cottage, university, library,
trophy room and café. The townsfolk have a few things to say too.

## Controls

- **WASD / arrow keys** to walk, or **click/tap** anywhere to walk there
- **SPACE / ENTER** at a door, or just **click a building** to open it
- **ESC** closes a window · **Q** quick view · **?** help
- Phones get an on-screen pad and an **A** button

## Running it

No build step. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Editing

- **Resume text:** `data/resume-data.js`
- **Town layout** (building positions, NPC lines): top of `script.js`
- **Sprites:** the raw AI-generated sheets in `assets/*.png` are cut into clean,
  transparent sprites in `assets/sprites/` by:

  ```bash
  pip install pillow numpy scipy
  python3 tools/prep_sprites.py
  ```

  The generated sprites are committed, so you only need this if you change a sheet.

## Project structure

```
index.html              page shell, HUD, modal
style.css               cozy pixel UI
script.js               game engine (rendering, movement, collisions, modals)
interiors.js            building interiors (procedural pixel art)
data/resume-data.js     resume content
assets/                 raw sprite sheets
assets/sprites/         cleaned sprites used by the game
tools/prep_sprites.py   sheet → sprite cutter
```
