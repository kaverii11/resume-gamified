// ============================================================
//  PIXEL CITY RESUME — Game Engine v3 (Sparse Map + Char Select)
// ============================================================

// ── Constants ────────────────────────────────────────────────
const TILE_SIZE = 48;   // world-space px per tile
const ZOOM = 2;    // pixel scale — chunky retro look
const MAP_COLS = 30;
const MAP_ROWS = 20;
const WORLD_W = MAP_COLS * TILE_SIZE;   // 1440
const WORLD_H = MAP_ROWS * TILE_SIZE;   // 960
const PLAYER_SPEED = 3;
const INTERACT_DIST = 90;  // px in world-space

// ── Tile IDs ─────────────────────────────────────────────────
const T = {
    PARK: 0,   // grass / open ground
    ROAD_H: 1,   // horizontal road
    ROAD_V: 2,   // vertical road
    CROSS: 3,   // intersection
    SIDE: 4,   // sidewalk
    TREE: 5,
    BENCH: 6,
    // Resume buildings (row 0 of sprite sheet)
    UNIV: 7,   // University  → Education
    OFFICE: 8,   // Glass Office → Experience
    HOUSE: 9,   // Cottage      → About Me
    LAB: 10,  // Tech Lab     → Projects / Skills
    POST: 11,  // Post Office  → Contact
    // Flavor buildings (row 1 of sprite sheet)
    CAFE: 12,  // Cafe
    CITYHALL: 13, // City Hall
    LIB: 14,  // Library
    BURGER: 15,  // Burger Joint
};

// ── Sprite-sheet grid positions [col, row] ───────────────────
// city_day.png / city_night.png: 5 cols × 3 rows
// Row 0: Univ | Office | House | Lab | Post
// Row 1: Cafe | CityHall | Library | Burger | (empty)
// Row 2: Grass | Road | Tree | Bench | Sidewalk
const TILE_GRID_POS = {
    [T.UNIV]: [0, 0],
    [T.OFFICE]: [1, 0],
    [T.HOUSE]: [2, 0],
    [T.LAB]: [3, 0],
    [T.POST]: [4, 0],
    [T.CAFE]: [0, 1],
    [T.CITYHALL]: [1, 1],
    [T.LIB]: [2, 1],
    [T.BURGER]: [3, 1],
    [T.PARK]: [0, 2],
    [T.ROAD_H]: [1, 2],
    [T.ROAD_V]: [1, 2],
    [T.CROSS]: [1, 2],
    [T.TREE]: [2, 2],
    [T.BENCH]: [3, 2],
    [T.SIDE]: [4, 2],
};

// ── Solid tiles (player cannot walk through) ─────────────────
const SOLID_TILES = new Set([
    T.UNIV, T.OFFICE, T.HOUSE, T.LAB, T.POST,
    T.CAFE, T.CITYHALL, T.LIB, T.BURGER,
    T.TREE, T.BENCH,
]);

// ── Sparse CITY_MAP (30 cols × 20 rows) ──────────────────────
// Buildings are placed far apart with grass, roads, trees between them.
// Two horizontal roads (rows 6, 13) and one vertical road (col 14).
const P = T.PARK, H = T.ROAD_H, V = T.ROAD_V, X = T.CROSS, S = T.SIDE;
const TR = T.TREE, BN = T.BENCH;
const U = T.UNIV, O = T.OFFICE, C = T.HOUSE, L = T.LAB, M = T.POST;
const A = T.CAFE, Y = T.CITYHALL, R = T.LIB, G = T.BURGER;

const CITY_MAP = [
    //   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 0
    [P, U, U, P, P, TR, P, P, P, P, P, P, P, P, V, P, P, P, O, O, P, P, P, P, P, TR, P, P, P, P], // 1
    [P, U, U, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, O, O, P, P, P, P, P, P, P, P, P, P], // 2
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 3
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 4
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 5
    [H, H, H, H, H, H, H, H, H, H, H, H, H, H, X, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H], // 6  ← H-road
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 7
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 8
    [P, A, A, P, P, BN, P, P, P, P, P, P, P, P, V, P, P, P, Y, Y, P, P, P, P, P, BN, P, P, P, P], // 9
    [P, A, A, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, Y, Y, P, P, P, P, P, P, P, P, P, P], // 10
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 11
    [P, P, TR, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P], // 12
    [H, H, H, H, H, H, H, H, H, H, H, H, H, H, X, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H], // 13 ← H-road
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 14
    [P, L, L, P, P, TR, P, P, P, P, P, P, P, P, V, P, P, P, R, R, P, P, P, P, P, TR, P, P, P, P], // 15
    [P, L, L, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, R, R, P, P, P, P, P, P, P, P, P, P], // 16
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 17
    [P, P, P, P, P, BN, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, BN, P, P, P, P], // 18
    [P, P, P, P, P, P, P, P, P, P, P, P, P, P, V, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P], // 19
];

// ── Hotspot Definitions (tile-coord anchored) ─────────────────
// Each hotspot anchors to the top-left tile of the building.
const HOTSPOT_DEFS = [
    { id: 'education', tileX: 1, tileY: 1, w: 2, h: 2, label: 'EDUCATION', icon: '🎓', color: '#ff006e' },
    { id: 'experience', tileX: 18, tileY: 1, w: 2, h: 2, label: 'EXPERIENCE', icon: '💼', color: '#00f5ff' },
    { id: 'projects', tileX: 1, tileY: 9, w: 2, h: 2, label: 'PROJECTS', icon: '💻', color: '#b967ff' },
    { id: 'fun', tileX: 18, tileY: 9, w: 2, h: 2, label: 'FUN FACTS', icon: '⭐', color: '#ff9500' },
    { id: 'skills', tileX: 1, tileY: 15, w: 2, h: 2, label: 'SKILLS', icon: '🛠️', color: '#ffea00' },
    { id: 'about', tileX: 18, tileY: 15, w: 2, h: 2, label: 'ABOUT ME', icon: '👤', color: '#b967ff' },
    { id: 'contact', tileX: 1, tileY: 3, w: 2, h: 2, label: 'CONTACT', icon: '📧', color: '#00f5ff' },
];

// ── Asset Loader ──────────────────────────────────────────────
class AssetLoader {
    constructor() { this.images = {}; }

    load(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { this.images[key] = img; resolve(img); };
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    }

    loadAll(manifest) {
        return Promise.all(
            Object.entries(manifest).map(([key, src]) => this.load(key, src))
        );
    }
}

// ── Game State ────────────────────────────────────────────────
const assets = new AssetLoader();

const gameState = {
    phase: 'select',         // 'select' | 'playing'
    player: {
        x: 14 * TILE_SIZE,
        y: 9 * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        speed: PLAYER_SPEED,
        direction: 'down',
        isMoving: false,
        frame: 0,
        frameCounter: 0,
        spriteRow: 0,        // 0=Player, 1=Recruiter, 2=Friend, 3=Family
        gender: 'male',      // 'male' | 'female'
    },
    selectHover: -1,         // index of hovered portrait card (-1 = none)
    camera: { x: 0, y: 0 },
    keys: {},
    mobileKeys: {},
    hotspots: [],
    resumeData: null,
    isMuted: false,
    nearestHotspot: null,
    gameTime: 600,           // HHMM-style, starts at 06:00
    isDay: true,
    time: 0,
    dayNightFrameAcc: 0,
};

// ── Canvas ────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 960;
canvas.height = 640;
// Logical viewport (world-space pixels visible at ZOOM)
const LOGICAL_W = canvas.width / ZOOM;  // 480
const LOGICAL_H = canvas.height / ZOOM;  // 320
// Crisp pixel rendering
ctx.imageSmoothingEnabled = false;

// ── Hotspot Initialisation ────────────────────────────────────
function initializeHotspots() {
    gameState.hotspots = HOTSPOT_DEFS.map(def => ({
        ...def,
        x: def.tileX * TILE_SIZE,
        y: def.tileY * TILE_SIZE,
        width: def.w * TILE_SIZE,
        height: def.h * TILE_SIZE,
        type: 'building',
    }));
}

// ── Resume Data ───────────────────────────────────────────────
async function loadResumeData() {
    try {
        const res = await fetch('data/resume-data.json');
        gameState.resumeData = await res.json();
    } catch {
        gameState.resumeData = getFallbackData();
    }
    initializeHotspots();
}

function getFallbackData() {
    return {
        personal: {
            name: 'Kaveri Sharma', title: 'Computer Science Student',
            email: 'kaveri@example.com', phone: '', location: '', linkedin: '', github: ''
        },
        summary: 'Passionate developer and problem solver.',
        experience: [], education: [], projects: [],
        skills: { languages: [], frameworks: [], tools: [], concepts: [] },
        funFacts: [],
    };
}

// ── Camera ────────────────────────────────────────────────────
// Camera is in world-space. The logical viewport (480×320) is
// centred on the player and clamped to map bounds.
function updateCamera() {
    const cam = gameState.camera;
    const p = gameState.player;
    cam.x = p.x + p.width / 2 - LOGICAL_W / 2;
    cam.y = p.y + p.height / 2 - LOGICAL_H / 2;
    cam.x = Math.max(0, Math.min(cam.x, WORLD_W - LOGICAL_W));
    cam.y = Math.max(0, Math.min(cam.y, WORLD_H - LOGICAL_H));
}

// ── Day / Night helpers ───────────────────────────────────────
function isNightTime() {
    const t = gameState.gameTime;
    return t >= 1800 || t < 600;
}

function nightBlend() {
    const t = gameState.gameTime;
    if (t >= 1700 && t < 1900) return (t - 1700) / 200;
    if (t >= 500 && t < 700) return 1 - (t - 500) / 200;
    return isNightTime() ? 1 : 0;
}

// ── Day/Night Overlays ────────────────────────────────────────
function renderDayNightCycle() {
    const blend = nightBlend();
    if (blend <= 0) return;
    ctx.save();
    ctx.globalAlpha = blend * 0.65;
    ctx.fillStyle = 'rgba(10, 14, 39, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function renderDayTint() {
    const blend = 1 - nightBlend();
    if (blend <= 0) return;
    ctx.save();
    ctx.globalAlpha = blend * 0.08;
    ctx.fillStyle = 'rgba(255, 200, 100, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// ── Tile Rendering ────────────────────────────────────────────
const TILE_COLORS = {
    [T.PARK]: '#2d5a1b',
    [T.ROAD_H]: '#333344',
    [T.ROAD_V]: '#333344',
    [T.CROSS]: '#333344',
    [T.SIDE]: '#4a4a5a',
    [T.TREE]: '#1a4a1a',
    [T.BENCH]: '#5a3a1a',
    [T.UNIV]: '#8b4513',
    [T.OFFICE]: '#1a3a5a',
    [T.HOUSE]: '#8b6914',
    [T.LAB]: '#3a3a5a',
    [T.POST]: '#1a4a6a',
    [T.CAFE]: '#6a2a1a',
    [T.CITYHALL]: '#5a5a3a',
    [T.LIB]: '#3a5a3a',
    [T.BURGER]: '#6a4a1a',
};

function drawTileMap() {
    const cam = gameState.camera;
    const sheetKey = isNightTime() ? 'cityNight' : 'cityDay';
    const img = assets.images[sheetKey];

    // Cull to logical viewport (+1 tile buffer each side)
    const startCol = Math.max(0, Math.floor(cam.x / TILE_SIZE) - 1);
    const endCol = Math.min(MAP_COLS - 1, Math.ceil((cam.x + LOGICAL_W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(cam.y / TILE_SIZE) - 1);
    const endRow = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + LOGICAL_H) / TILE_SIZE) + 1);

    // Ground tiles that look better as solid fills than from the sprite sheet
    const GROUND_TILES = new Set([T.PARK, T.ROAD_H, T.ROAD_V, T.CROSS, T.SIDE]);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tileId = CITY_MAP[row][col];
            const dx = col * TILE_SIZE - cam.x;
            const dy = row * TILE_SIZE - cam.y;

            if (!GROUND_TILES.has(tileId) && img && TILE_GRID_POS[tileId] !== undefined) {
                // Building / decoration — draw from sprite sheet
                const [gc, gr] = TILE_GRID_POS[tileId];
                const sw = img.naturalWidth / 5;
                const sh = img.naturalHeight / 3;
                ctx.drawImage(img, gc * sw, gr * sh, sw, sh, dx, dy, TILE_SIZE, TILE_SIZE);
            } else {
                // Ground tile — solid fill for clarity
                ctx.fillStyle = TILE_COLORS[tileId] || '#2d5a1b';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Road centre lines (drawn in logical coords)
    ctx.save();
    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 10]);

    // Horizontal roads (rows 6 and 13)
    [6, 13].forEach(roadRow => {
        const ry = roadRow * TILE_SIZE + TILE_SIZE / 2 - cam.y;
        if (ry >= -TILE_SIZE && ry <= LOGICAL_H + TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, ry);
            ctx.lineTo(LOGICAL_W, ry);
            ctx.stroke();
        }
    });

    // Vertical road (col 14)
    const vx = 14 * TILE_SIZE + TILE_SIZE / 2 - cam.x;
    if (vx >= -TILE_SIZE && vx <= LOGICAL_W + TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.lineTo(vx, LOGICAL_H);
        ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
}

// ── Hotspot Rendering ─────────────────────────────────────────
function drawHotspots() {
    const cam = gameState.camera;
    gameState.hotspots.forEach(hs => {
        const sx = hs.x - cam.x;
        const sy = hs.y - cam.y;

        // Cull against logical viewport
        if (sx + hs.width < 0 || sx > LOGICAL_W) return;
        if (sy + hs.height < 0 || sy > LOGICAL_H) return;

        const isNearest = gameState.nearestHotspot === hs;

        ctx.save();
        if (isNearest) {
            ctx.shadowColor = hs.color;
            ctx.shadowBlur = 24;
            ctx.strokeStyle = hs.color;
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = hs.color + '88';
            ctx.lineWidth = 1.5;
        }
        ctx.strokeRect(sx, sy, hs.width, hs.height);
        ctx.restore();

        // Floating label (scaled down since we're in 2× context)
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '10px Arial';
        ctx.fillText(hs.icon, sx + hs.width / 2, sy - 7);
        ctx.font = '4px "Press Start 2P", monospace';
        ctx.fillStyle = hs.color;
        ctx.shadowColor = hs.color;
        ctx.shadowBlur = isNearest ? 6 : 0;
        ctx.fillText(hs.label, sx + hs.width / 2, sy - 1);
        ctx.restore();
    });
}

// ── Player Rendering ──────────────────────────────────────────
// Sprite sheet layout: 4 cols × 4 rows
//   Cols (direction): 0=front(down), 1=back(up), 2=left, 3=right
//   Rows (character): 0=Player, 1=Recruiter, 2=Friend, 3=Family
const DIR_COL = { down: 0, up: 1, left: 2, right: 3 };

function drawPlayer() {
    const p = gameState.player;
    const cam = gameState.camera;
    const key = p.gender === 'female' ? 'playerFemale' : 'playerMale';
    const img = assets.images[key];

    const dx = p.x - cam.x;
    const dy = p.y - cam.y;

    if (img) {
        // Each cell in the 4×4 sheet
        const cellW = img.naturalWidth / 4;
        const cellH = img.naturalHeight / 4;
        const dirCol = DIR_COL[p.direction] ?? 0;
        const srcX = dirCol * cellW;
        const srcY = p.spriteRow * cellH;
        ctx.drawImage(img, srcX, srcY, cellW, cellH, dx, dy, TILE_SIZE, TILE_SIZE);
    } else {
        // Fallback coloured block
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#ff006e';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
    }

    // Neon glow outline
    ctx.save();
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00f5ff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
    ctx.restore();
}

// ── Character Select Screen ───────────────────────────────────
// Portraits sheet: 4 cols × 2 rows
// Row 0 = Male (Player, Recruiter, Friend, Family)
// Row 1 = Female (Player, Recruiter, Friend, Family)
const CHAR_NAMES = ['PLAYER', 'RECRUITER', 'FRIEND', 'FAMILY'];

function drawCharacterSelect() {
    const img = assets.images['characterPortraits'];
    const W = canvas.width;
    const H = canvas.height;

    // Dark overlay
    ctx.fillStyle = 'rgba(5, 8, 24, 0.92)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 20;
    ctx.fillText('CHOOSE YOUR CHARACTER', W / 2, 80);
    ctx.restore();

    // Subtitle
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText('Click a portrait to begin', W / 2, 118);
    ctx.restore();

    // Gender row labels
    const genders = ['MALE', 'FEMALE'];
    const cardW = 140;
    const cardH = 170;
    const gapX = 28;
    const totalW = 4 * cardW + 3 * gapX;
    const startX = (W - totalW) / 2;
    const rowY = [155, 355];   // top-y of each gender row

    genders.forEach((gLabel, gRow) => {
        // Gender label
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = gRow === 0 ? '#00f5ff' : '#ff006e';
        ctx.fillText(gLabel, startX, rowY[gRow] - 18);
        ctx.restore();

        CHAR_NAMES.forEach((name, col) => {
            const idx = gRow * 4 + col;   // 0-7
            const cx = startX + col * (cardW + gapX);
            const cy = rowY[gRow];
            const isHovered = gameState.selectHover === idx;

            // Card background
            ctx.save();
            ctx.fillStyle = isHovered ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = isHovered
                ? (gRow === 0 ? '#00f5ff' : '#ff006e')
                : 'rgba(255,255,255,0.2)';
            ctx.lineWidth = isHovered ? 2.5 : 1;
            if (isHovered) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 16; }
            roundRect(ctx, cx, cy, cardW, cardH, 8);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Portrait image
            if (img) {
                const pw = img.naturalWidth / 4;
                const ph = img.naturalHeight / 2;
                const pad = 10;
                ctx.drawImage(img,
                    col * pw, gRow * ph, pw, ph,
                    cx + pad, cy + pad, cardW - pad * 2, cardH - 44
                );
            } else {
                // Fallback colour block
                ctx.fillStyle = gRow === 0 ? '#1a3a5a' : '#3a1a3a';
                ctx.fillRect(cx + 10, cy + 10, cardW - 20, cardH - 44);
            }

            // Character name
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '6px "Press Start 2P", monospace';
            ctx.fillStyle = isHovered
                ? (gRow === 0 ? '#00f5ff' : '#ff006e')
                : '#cccccc';
            ctx.fillText(name, cx + cardW / 2, cy + cardH - 18);
            ctx.restore();
        });
    });
}

// Helper: rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ── Collision Detection ───────────────────────────────────────
function isSolidAt(worldX, worldY) {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return true;
    return SOLID_TILES.has(CITY_MAP[row][col]);
}

function checkTileCollision(nx, ny) {
    const w = gameState.player.width - 2;
    const h = gameState.player.height - 2;
    return (
        isSolidAt(nx + 1, ny + 1) ||
        isSolidAt(nx + w, ny + 1) ||
        isSolidAt(nx + 1, ny + h) ||
        isSolidAt(nx + w, ny + h)
    );
}

// ── Player Update ─────────────────────────────────────────────
function updatePlayer() {
    const p = gameState.player;
    const keys = { ...gameState.keys, ...gameState.mobileKeys };
    let dx = 0, dy = 0;

    if (keys['w'] || keys['arrowup'] || keys['up']) { dy = -p.speed; p.direction = 'up'; }
    if (keys['s'] || keys['arrowdown'] || keys['down']) { dy = p.speed; p.direction = 'down'; }
    if (keys['a'] || keys['arrowleft'] || keys['left']) { dx = -p.speed; p.direction = 'left'; }
    if (keys['d'] || keys['arrowright'] || keys['right']) { dx = p.speed; p.direction = 'right'; }

    const moving = dx !== 0 || dy !== 0;

    const nx = Math.max(0, Math.min(p.x + dx, WORLD_W - p.width));
    const ny = Math.max(0, Math.min(p.y + dy, WORLD_H - p.height));

    if (!checkTileCollision(nx, p.y)) p.x = nx;
    if (!checkTileCollision(p.x, ny)) p.y = ny;

    p.isMoving = moving;
    if (moving) {
        p.frameCounter++;
        if (p.frameCounter > 8) { p.frame = (p.frame + 1) % 4; p.frameCounter = 0; }
    } else {
        p.frame = 0;
    }

    checkNearbyHotspots();
}

function checkNearbyHotspots() {
    const p = gameState.player;
    const px = p.x + p.width / 2;
    const py = p.y + p.height / 2;
    let nearest = null, minDist = INTERACT_DIST;

    for (const hs of gameState.hotspots) {
        const cx = hs.x + hs.width / 2;
        const cy = hs.y + hs.height / 2;
        const d = Math.hypot(cx - px, cy - py);
        if (d < minDist) { minDist = d; nearest = hs; }
    }

    gameState.nearestHotspot = nearest;
    const prompt = document.getElementById('interaction-prompt');
    if (nearest) {
        prompt.classList.remove('hidden');
        prompt.querySelector('.pixel-text').textContent = `SPACE → ${nearest.label}`;
    } else {
        prompt.classList.add('hidden');
    }
}

// ── Input Handlers ────────────────────────────────────────────
function setupInputHandlers() {
    document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) {
            e.preventDefault();
        }
        gameState.keys[key] = true;
        if ((key === ' ' || key === 'enter') && gameState.phase === 'playing') handleInteraction();
    });

    document.addEventListener('keyup', e => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    document.querySelectorAll('.dpad-btn, .action-btn').forEach(btn => {
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            const key = btn.dataset.key;
            gameState.mobileKeys[key] = true;
            if (key === 'space' && gameState.phase === 'playing') handleInteraction();
        });
        btn.addEventListener('touchend', e => {
            e.preventDefault();
            gameState.mobileKeys[btn.dataset.key] = false;
        });
    });

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    document.getElementById('mute-btn').addEventListener('click', toggleMute);

    // Day/Night toggle — jump +6 in-game hours
    const dayBtn = document.getElementById('daynight-btn');
    if (dayBtn) {
        dayBtn.addEventListener('click', () => {
            gameState.gameTime = (gameState.gameTime + 600) % 2400;
            const h = Math.floor(gameState.gameTime / 100);
            const m = gameState.gameTime % 100;
            if (m >= 60) gameState.gameTime = ((h + 1) % 24) * 100;
        });
    }

    // Character select — mouse hover + click on canvas
    canvas.addEventListener('mousemove', e => {
        if (gameState.phase !== 'select') return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        gameState.selectHover = getPortraitIndex(mx, my);
        canvas.style.cursor = gameState.selectHover >= 0 ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', e => {
        if (gameState.phase !== 'select') return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const idx = getPortraitIndex(mx, my);
        if (idx < 0) return;
        const gRow = Math.floor(idx / 4);
        const col = idx % 4;
        gameState.player.gender = gRow === 0 ? 'male' : 'female';
        gameState.player.spriteRow = col;
        gameState.phase = 'playing';
        canvas.style.cursor = 'default';
    });
}

// Returns portrait card index (0-7) or -1 if not over a card
function getPortraitIndex(mx, my) {
    const cardW = 140, cardH = 170, gapX = 28;
    const totalW = 4 * cardW + 3 * gapX;
    const startX = (canvas.width - totalW) / 2;
    const rowY = [155, 355];

    for (let gRow = 0; gRow < 2; gRow++) {
        for (let col = 0; col < 4; col++) {
            const cx = startX + col * (cardW + gapX);
            const cy = rowY[gRow];
            if (mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) {
                return gRow * 4 + col;
            }
        }
    }
    return -1;
}

// ── Interaction & Modal ───────────────────────────────────────
function handleInteraction() {
    if (gameState.nearestHotspot) openModal(gameState.nearestHotspot.id);
}

function openModal(sectionId) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    const hs = gameState.hotspots.find(h => h.id === sectionId);
    if (!hs) return;
    title.textContent = hs.label;
    content.innerHTML = generateModalContent(sectionId);
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function generateModalContent(sectionId) {
    const data = gameState.resumeData;
    let html = '';
    switch (sectionId) {
        case 'about':
            html = `<h3>${data.personal.name}</h3><p>${data.personal.title}</p><p style="margin-top:15px">${data.summary}</p>`;
            break;
        case 'experience':
            html = '<h3>Work Experience</h3>';
            data.experience.forEach(exp => {
                html += `<div style="margin-bottom:20px">
                    <p style="color:#ff006e"><strong>${exp.title}</strong></p>
                    <p>${exp.company} | ${exp.duration}</p>
                    <ul>${exp.description.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>`;
            });
            break;
        case 'projects':
            html = '<h3>Featured Projects</h3>';
            data.projects.forEach(proj => {
                html += `<div style="margin-bottom:20px">
                    <p style="color:#b967ff"><strong>${proj.name}</strong></p>
                    <p><em>${proj.tech}</em></p>
                    <p>${proj.description}</p>
                    <ul>${proj.highlights.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>`;
            });
            break;
        case 'skills':
            html = '<h3>Technical Skills</h3>';
            ['languages', 'frameworks', 'tools', 'concepts'].forEach(cat => {
                if (data.skills[cat]?.length) {
                    html += `<div style="margin-bottom:15px">
                        <p><strong>${cat.charAt(0).toUpperCase() + cat.slice(1)}:</strong></p>
                        <div>${data.skills[cat].map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
                    </div>`;
                }
            });
            break;
        case 'education':
            html = '<h3>Education</h3>';
            data.education.forEach(edu => {
                html += `<div style="margin-bottom:20px">
                    <p style="color:#ff006e"><strong>${edu.degree}</strong></p>
                    <p>${edu.institution} | ${edu.duration}</p>
                    <p>GPA: ${edu.gpa}</p>
                    <ul>${edu.highlights.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>`;
            });
            if (data.certifications?.length) {
                html += '<h3 style="margin-top:20px">Certifications</h3><ul>';
                data.certifications.forEach(c => { html += `<li>${c}</li>`; });
                html += '</ul>';
            }
            break;
        case 'contact':
            html = `<h3>Get In Touch</h3>
                <p><strong>Email:</strong> ${data.personal.email}</p>
                <p><strong>Phone:</strong> ${data.personal.phone}</p>
                <p><strong>Location:</strong> ${data.personal.location}</p>
                <p style="margin-top:15px"><strong>LinkedIn:</strong> ${data.personal.linkedin}</p>
                <p><strong>GitHub:</strong> ${data.personal.github}</p>`;
            break;
        case 'fun':
            html = '<h3>Fun Facts & Hobbies</h3><ul>';
            data.funFacts.forEach(f => { html += `<li>${f}</li>`; });
            html += '</ul>';
            break;
    }
    return html;
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    document.getElementById('mute-btn').textContent = gameState.isMuted ? '🔇' : '🔊';
}

// ── Background ────────────────────────────────────────────────
function drawBackground() {
    const blend = nightBlend();
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);

    const r0 = Math.round(26 + (10 - 26) * blend);
    const g0 = Math.round(58 + (14 - 58) * blend);
    const b0 = Math.round(110 + (39 - 110) * blend);
    const r1 = Math.round(42 + (26 - 42) * blend);
    const g1 = Math.round(90 + (31 - 90) * blend);
    const b1 = Math.round(158 + (58 - 158) * blend);

    grad.addColorStop(0, `rgb(${r0},${g0},${b0})`);
    grad.addColorStop(1, `rgb(${r1},${g1},${b1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (blend > 0.2) {
        ctx.save();
        ctx.globalAlpha = (blend - 0.2) / 0.8 * 0.75;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 80; i++) {
            const x = (i * 137 + gameState.camera.x * 0.05) % canvas.width;
            const y = (i * 211 + gameState.camera.y * 0.05) % canvas.height;
            ctx.fillRect(x, y, 1.5, 1.5);
        }
        ctx.restore();
    }
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD() {
    const hudImg = assets.images['hud'];
    if (!hudImg) return;
    const iconW = hudImg.naturalWidth / 2;
    const iconH = hudImg.naturalHeight / 2;
    const icon = gameState.isDay ? 0 : 1;
    ctx.drawImage(hudImg, icon * iconW, 0, iconW, iconH, canvas.width - 52, 8, 32, 32);
}

// ── Time Progression ──────────────────────────────────────────
const GAME_MINS_PER_FRAME = 10 / 60;

function updateGameTime() {
    gameState.dayNightFrameAcc += GAME_MINS_PER_FRAME;
    if (gameState.dayNightFrameAcc >= 1) {
        const mins = Math.floor(gameState.dayNightFrameAcc);
        gameState.dayNightFrameAcc -= mins;
        gameState.gameTime = (gameState.gameTime + mins) % 2400;
        const h = Math.floor(gameState.gameTime / 100);
        const m = gameState.gameTime % 100;
        if (m >= 60) gameState.gameTime = ((h + 1) % 24) * 100;
    }
    gameState.isDay = !isNightTime();

    const clockEl = document.getElementById('game-clock');
    if (clockEl) {
        const h = Math.floor(gameState.gameTime / 100).toString().padStart(2, '0');
        const m = (gameState.gameTime % 100).toString().padStart(2, '0');
        clockEl.textContent = `${h}:${m}`;
    }
    const btn = document.getElementById('daynight-btn');
    if (btn) btn.textContent = isNightTime() ? '🌙' : '☀️';
}

// ── Game Loop ─────────────────────────────────────────────────
function gameLoop() {
    gameState.time++;
    updateGameTime();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (gameState.phase === 'select') {
        // Character select is a full-canvas overlay — no zoom
        drawCharacterSelect();
    } else {
        updatePlayer();
        updateCamera();

        // ── Zoomed world rendering ──────────────────────────
        // All world-space draws happen inside ctx.scale(ZOOM, ZOOM).
        // This makes the logical viewport 480×320, showing ~10×7 tiles.
        ctx.save();
        ctx.scale(ZOOM, ZOOM);
        ctx.imageSmoothingEnabled = false;
        drawTileMap();
        renderDayTint();
        drawHotspots();
        drawPlayer();
        ctx.restore();
        // ────────────────────────────────────────────────────

        // Full-canvas overlays drawn AFTER restoring scale
        renderDayNightCycle();
        drawHUD();
    }

    requestAnimationFrame(gameLoop);
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
    await loadResumeData();

    try {
        await assets.loadAll({
            cityDay: 'assets/city_day.png',
            cityNight: 'assets/city_night.png',
            characterPortraits: 'assets/character_portraits.png',
            playerMale: 'assets/character_sprites_male.png',
            playerFemale: 'assets/character_sprites_female.png',
            hud: 'assets/ui_hud_elements.png',
        });
    } catch (err) {
        console.warn('Some assets failed to load, using fallback rendering:', err.message);
    }

    setupInputHandlers();

    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 800);

    gameLoop();
}

init();
