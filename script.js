// ============================================================
//  PIXEL CITY RESUME — Game Engine v4 (Fantasy RPG Map)
// ============================================================

// ── Constants ────────────────────────────────────────────────
const TILE_SIZE = 48;   // world-space px per tile
const ZOOM = 2;    // pixel scale — chunky retro look
const MAP_COLS = 50;
const MAP_ROWS = 40;
const WORLD_W = MAP_COLS * TILE_SIZE;  // 2400
const WORLD_H = MAP_ROWS * TILE_SIZE;  // 1920
const PLAYER_SPEED = 3;
const INTERACT_DIST = 100; // px in world-space

// ── Tile IDs ─────────────────────────────────────────────────
const T = {
    PARK: 0,  // lush grass (default)
    PATH: 1,  // dirt winding path
    TREE: 2,  // solid tree (impassable)
    FLOWER: 3,  // decorative flower (passable)
    WATER: 4,  // lake / pond (impassable)
    BENCH: 5,  // bench (impassable)
    // Building marker — footprint is impassable, sprite drawn separately
    BLDG: 6,
};

// ── Tile solid set ────────────────────────────────────────────
const SOLID_TILES = new Set([T.TREE, T.WATER, T.BENCH, T.BLDG]);

// ── Tile solid colours (fallback + ground fills) ─────────────
const TILE_COLOR = {
    [T.PARK]: '#3a7a2a',  // vibrant green grass
    [T.PATH]: '#b8945a',  // sandy dirt path
    [T.TREE]: '#1e5c1e',  // dark tree canopy
    [T.FLOWER]: '#3a7a2a',  // same grass base
    [T.WATER]: '#2a6ab5',  // lake blue
    [T.BENCH]: '#5a3a1a',  // bench brown
    [T.BLDG]: '#2a2a3a',  // placeholder (buildings drawn separately)
};

// ── CITY_MAP (50 cols × 40 rows) ─────────────────────────────
// P=grass  D=dirt-path  T=tree  F=flower  W=water  B=building-footprint
// 80% nature / 20% building.
// Buildings are NOT drawn from this array — they are large sprites rendered
// separately by drawBuildings(). The BLDG tile only marks impassable ground.
const P = T.PARK, D = T.PATH, TR = T.TREE, FL = T.FLOWER, W = T.WATER, B = T.BLDG, BN = T.BENCH;

/* prettier-ignore */
const CITY_MAP = [
// col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49
/* r0*/[P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/* r1*/[P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, TR, P, P],
/* r2*/[P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/* r3*/[P, P, B, B, B, P, P, P, P, P, P, P, P, D, D, D, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/* r4*/[P, TR, B, B, B, P, P, P, P, P, P, P, D, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P],
/* r5*/[P, P, B, B, B, P, P, P, P, P, P, P, D, P, P, P, P, D, P, P, W, W, W, P, P, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/* r6*/[P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, D, P, P, W, W, W, W, P, P, P, P, P, P, P, B, B, B, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P],
/* r7*/[P, P, P, P, P, P, FL, P, P, P, P, P, D, P, P, P, P, D, P, P, W, W, W, W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/* r8*/[P, P, P, TR, P, P, P, P, P, P, P, P, D, P, P, P, P, D, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P],
/* r9*/[P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P],
/*r10*/[P, P, P, P, P, FL, P, P, P, P, P, D, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r11*/[P, P, TR, P, P, P, P, P, P, P, D, P, P, P, P, P, P, D, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P],
/*r12*/[P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r13*/[P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, W, W, W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P],
/*r14*/[P, P, TR, P, P, P, P, P, D, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, W, W, W, W, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r15*/[P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, W, W, W, W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r16*/[P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, D, D, D, D, D, D, D, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P],
/*r17*/[P, P, P, P, TR, P, P, D, P, P, P, P, FL, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r18*/[P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P],
/*r19*/[P, P, TR, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, B, B, B, P, P, P, TR, P, P, P],
/*r20*/[P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P],
/*r21*/[P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r22*/[P, P, P, P, P, P, B, B, B, D, D, D, D, D, D, D, D, D, D, D, D, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r23*/[P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P],
/*r24*/[P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, W, W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r25*/[P, P, P, P, P, TR, P, P, P, P, P, P, P, FL, P, P, P, P, P, P, P, D, P, P, P, W, W, W, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P],
/*r26*/[P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r27*/[P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P],
/*r28*/[P, P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P, P, D, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r29*/[P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, P, P, P, P],
/*r30*/[P, P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r31*/[P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, FL, P, P, P],
/*r32*/[P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P],
/*r33*/[P, P, TR, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r34*/[P, P, P, P, P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, TR, P, P],
/*r35*/[P, P, P, P, P, P, B, B, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, TR, P, P, P, P, P, P, B, B, B, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r36*/[P, P, P, P, P, P, B, B, P, FL, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r37*/[P, P, P, TR, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, FL, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r38*/[P, P, P, P, P, P, P, P, P, P, D, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
/*r39*/[P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P],
];

// ── Hotspot / Building Definitions ───────────────────────────
// tileX/Y = top-left tile of the building footprint.
// tileW/H = footprint size in tiles (drawn as one large sprite).
// sheetCol/Row = which cell of city_day.png (5-col × 3-row sheet) to use.
const HOTSPOT_DEFS = [
    {
        id: 'education', tileX: 2, tileY: 3, tileW: 3, tileH: 3,
        sheetCol: 0, sheetRow: 0, label: 'EDUCATION', icon: '🎓', color: '#ff006e'
    },
    {
        id: 'experience', tileX: 31, tileY: 4, tileW: 3, tileH: 3,
        sheetCol: 1, sheetRow: 0, label: 'EXPERIENCE', icon: '💼', color: '#00f5ff'
    },
    {
        id: 'about', tileX: 6, tileY: 20, tileW: 3, tileH: 3,
        sheetCol: 2, sheetRow: 0, label: 'ABOUT ME', icon: '👤', color: '#b967ff'
    },
    {
        id: 'skills', tileX: 40, tileY: 18, tileW: 3, tileH: 3,
        sheetCol: 3, sheetRow: 0, label: 'SKILLS', icon: '🛠️', color: '#ffea00'
    },
    {
        id: 'contact', tileX: 6, tileY: 35, tileW: 2, tileH: 2,
        sheetCol: 4, sheetRow: 0, label: 'CONTACT', icon: '📧', color: '#00f5ff'
    },
    {
        id: 'fun', tileX: 33, tileY: 33, tileW: 3, tileH: 3,
        sheetCol: 1, sheetRow: 1, label: 'FUN FACTS', icon: '⭐', color: '#ff9500'
    },
    {
        id: 'projects', tileX: 33, tileY: 33, tileW: 3, tileH: 3,
        sheetCol: 2, sheetRow: 1, label: 'PROJECTS', icon: '💻', color: '#b967ff'
    },
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
    phase: 'select',
    player: {
        x: 17 * TILE_SIZE,   // near centre of winding path
        y: 22 * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        speed: PLAYER_SPEED,
        direction: 'down',
        isMoving: false,
        frame: 0,
        frameCounter: 0,
        spriteRow: 0,
        gender: 'male',
    },
    selectHover: -1,
    camera: { x: 0, y: 0, tx: 0, ty: 0 },  // tx/ty = lerp targets
    keys: {},
    mobileKeys: {},
    hotspots: [],
    resumeData: null,
    isMuted: false,
    nearestHotspot: null,
    gameTime: 600,
    isDay: true,
    time: 0,
    dayNightFrameAcc: 0,
    decorations: [],    // pre-scattered flowers/rocks
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

// ── Hotspot / Building Initialisation ────────────────────────
function initializeHotspots() {
    gameState.hotspots = HOTSPOT_DEFS.map(def => ({
        ...def,
        x: def.tileX * TILE_SIZE,
        y: def.tileY * TILE_SIZE,
        width: def.tileW * TILE_SIZE,
        height: def.tileH * TILE_SIZE,
        type: 'building',
    }));

    // Stamp BLDG tiles into CITY_MAP for each building footprint
    for (const def of HOTSPOT_DEFS) {
        for (let dy = 0; dy < def.tileH; dy++) {
            for (let dx = 0; dx < def.tileW; dx++) {
                const row = def.tileY + dy;
                const col = def.tileX + dx;
                if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
                    CITY_MAP[row][col] = T.BLDG;
                }
            }
        }
    }

    // Scatter decorations (seeded pseudo-random flowers + rocks)
    gameState.decorations = [];
    const seed = (n) => { let x = Math.sin(n) * 43758; return x - Math.floor(x); };
    let si = 0;
    for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
            if (CITY_MAP[row][col] === T.PARK && seed(si++) > 0.92) {
                gameState.decorations.push({
                    x: col * TILE_SIZE + TILE_SIZE * 0.1,
                    y: row * TILE_SIZE + TILE_SIZE * 0.1,
                    type: seed(si++) > 0.5 ? 'flower' : 'shrub',
                    hue: Math.floor(seed(si++) * 360),
                });
            } else { si++; }
        }
    }
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

// ── Camera (smooth lerp follow) ────────────────────────────────
function updateCamera() {
    const cam = gameState.camera;
    const p = gameState.player;
    // Ideal camera position centres the player in the logical viewport
    const tx = p.x + p.width / 2 - LOGICAL_W / 2;
    const ty = p.y + p.height / 2 - LOGICAL_H / 2;
    // Lerp for smooth glide (0.15 = responsive but not instant)
    cam.x += (tx - cam.x) * 0.15;
    cam.y += (ty - cam.y) * 0.15;
    // Clamp to world bounds
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

// ── Tile Rendering ──────────────────────────────────────────────
function drawTileMap() {
    const cam = gameState.camera;
    const sheetKey = isNightTime() ? 'cityNight' : 'cityDay';
    const img = assets.images[sheetKey];

    // Viewport culling with 1-tile buffer
    const startCol = Math.max(0, Math.floor(cam.x / TILE_SIZE) - 1);
    const endCol = Math.min(MAP_COLS - 1, Math.ceil((cam.x + LOGICAL_W) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(cam.y / TILE_SIZE) - 1);
    const endRow = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + LOGICAL_H) / TILE_SIZE) + 1);

    // Sheet cell size (5 cols × 3 rows)
    const sw = img ? img.naturalWidth / 5 : 0;
    const sh = img ? img.naturalHeight / 3 : 0;
    // Tree sprite is at sheet [col2, row2]
    const treeSrcX = 2 * sw;
    const treeSrcY = 2 * sh;

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tileId = CITY_MAP[row][col];
            const dx = col * TILE_SIZE - cam.x;
            const dy = row * TILE_SIZE - cam.y;

            if (tileId === T.BLDG) {
                // Building footprint — grass base so it blends at edges
                ctx.fillStyle = '#3a7a2a';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

            } else if (tileId === T.TREE && img) {
                // Grass base first, then tree canopy from sprite sheet
                ctx.fillStyle = '#3a7a2a';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                ctx.drawImage(img, treeSrcX, treeSrcY, sw, sh, dx, dy, TILE_SIZE, TILE_SIZE);

            } else if (tileId === T.PATH) {
                // Dirt path — tan fill with darker edge
                ctx.fillStyle = '#c8a05a';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#a07840';
                ctx.fillRect(dx, dy, TILE_SIZE, 2);
                ctx.fillRect(dx, dy + TILE_SIZE - 2, TILE_SIZE, 2);

            } else if (tileId === T.WATER) {
                // Water — animated blue shimmer
                const t = Date.now() / 1200;
                const shimmer = Math.sin(t + col * 0.5 + row * 0.7) * 0.07;
                ctx.fillStyle = `rgba(42,${106 + Math.floor(shimmer * 40)},181,1)`;
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
                // Highlight lines
                ctx.fillStyle = 'rgba(160,210,255,0.25)';
                ctx.fillRect(dx + 4, dy + 8, TILE_SIZE - 8, 3);
                ctx.fillRect(dx + 10, dy + 18, TILE_SIZE - 16, 3);

            } else if (tileId === T.FLOWER) {
                // Same as grass — tiny dot drawn in drawDecorations
                ctx.fillStyle = '#3d8030';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

            } else {
                // Default: solid grass fill (PARK + BENCH + anything unknown)
                ctx.fillStyle = TILE_COLOR[tileId] || '#3a7a2a';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// ── Decoration Rendering (flowers / shrubs scattered on grass) ──
function drawDecorations() {
    const cam = gameState.camera;
    for (const d of gameState.decorations) {
        const sx = d.x - cam.x;
        const sy = d.y - cam.y;
        if (sx < -TILE_SIZE || sx > LOGICAL_W + TILE_SIZE) continue;
        if (sy < -TILE_SIZE || sy > LOGICAL_H + TILE_SIZE) continue;

        if (d.type === 'flower') {
            // Small colourful flower dot
            ctx.fillStyle = `hsl(${d.hue},90%,60%)`;
            ctx.beginPath();
            ctx.arc(sx + TILE_SIZE * 0.5, sy + TILE_SIZE * 0.7, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffffbb';
            ctx.beginPath();
            ctx.arc(sx + TILE_SIZE * 0.5, sy + TILE_SIZE * 0.7, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Small shrub bump
            ctx.fillStyle = '#2a6020';
            ctx.beginPath();
            ctx.ellipse(sx + TILE_SIZE * 0.5, sy + TILE_SIZE * 0.6, 9, 7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ── Building Rendering ─────────────────────────────────────────────
// Each building is ONE large sprite cropped from the sheet,
// drawn to cover its full tileW × tileH tile footprint.
function drawBuildings() {
    const cam = gameState.camera;
    const sheetKey = isNightTime() ? 'cityNight' : 'cityDay';
    const img = assets.images[sheetKey];

    gameState.hotspots.forEach(hs => {
        const sx = hs.x - cam.x;
        const sy = hs.y - cam.y;

        // Cull: completely off-screen
        if (sx + hs.width < 0 || sx > LOGICAL_W) return;
        if (sy + hs.height < 0 || sy > LOGICAL_H) return;

        const isNearest = gameState.nearestHotspot === hs;

        // Draw the building sprite scaled to cover full footprint
        if (img) {
            const sw = img.naturalWidth / 5;
            const sh = img.naturalHeight / 3;
            const srcX = hs.sheetCol * sw;
            const srcY = hs.sheetRow * sh;
            // Slight pulse scale when player is nearby
            const scale = isNearest ? 1.04 : 1.0;
            const w = hs.width * scale;
            const h = hs.height * scale;
            const offX = (w - hs.width) / 2;
            const offY = (h - hs.height) / 2;
            ctx.save();
            if (isNearest) {
                ctx.shadowColor = hs.color;
                ctx.shadowBlur = 20;
            }
            ctx.drawImage(img, srcX, srcY, sw, sh, sx - offX, sy - offY, w, h);
            ctx.restore();
        } else {
            // Fallback coloured rectangle
            ctx.fillStyle = hs.color + '44';
            ctx.fillRect(sx, sy, hs.width, hs.height);
        }

        // Neon outline
        ctx.save();
        ctx.strokeStyle = isNearest ? hs.color : hs.color + '66';
        ctx.lineWidth = isNearest ? 2.5 : 1.2;
        if (isNearest) {
            ctx.shadowColor = hs.color;
            ctx.shadowBlur = 16;
        }
        ctx.strokeRect(sx, sy, hs.width, hs.height);
        ctx.restore();

        // Floating label above building
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '11px monospace';
        ctx.fillText(hs.icon, sx + hs.width / 2, sy - 8);
        ctx.font = '5px "Press Start 2P", monospace';
        ctx.fillStyle = hs.color;
        ctx.shadowColor = hs.color;
        ctx.shadowBlur = isNearest ? 8 : 2;
        ctx.fillText(hs.label, sx + hs.width / 2, sy - 2);
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
        // Distance to nearest edge of building rect (not centre-to-centre)
        const clampX = Math.max(hs.x, Math.min(px, hs.x + hs.width));
        const clampY = Math.max(hs.y, Math.min(py, hs.y + hs.height));
        const d = Math.hypot(clampX - px, clampY - py);
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

        // ── Zoomed world rendering ───────────────────────────────────
        // World-space draws in logical 480×320 px, scaled 2× to canvas.
        ctx.save();
        ctx.scale(ZOOM, ZOOM);
        ctx.imageSmoothingEnabled = false;
        drawTileMap();
        drawDecorations();
        renderDayTint();
        drawBuildings();
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
