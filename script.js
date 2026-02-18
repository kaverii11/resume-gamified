// ============================================================
//  PIXEL CITY RESUME — Game Engine v2 (Sprite + TileMap)
// ============================================================

// ── Constants ────────────────────────────────────────────────
const TILE_SIZE = 32;
const MAP_COLS = 40;
const MAP_ROWS = 25;
const WORLD_W = MAP_COLS * TILE_SIZE;   // 1280
const WORLD_H = MAP_ROWS * TILE_SIZE;   // 800
const PLAYER_SPEED = 3;
const INTERACT_DIST = 80;  // px in world-space

// Tile IDs
const T = {
    ROAD_H: 0,
    ROAD_V: 1,
    CROSS: 2,
    SIDE: 3,   // sidewalk
    PARK: 4,
    BLD_N1: 5,   // night building 1
    BLD_N2: 6,
    BLD_N3: 7,
    BLD_D1: 8,   // day building 1
    BLD_D2: 9,
    BLD_D3: 10,
    TREE: 11,
    BENCH: 12,
};

// Tileset source rectangles (col, row) in the sprite sheet
// city_tileset.png layout (each tile ~32×32 or scaled):
//   Row 0: 3 night skyscrapers (wide, multi-tile tall)
//   Row 1: 3 day skyscrapers
//   Row 2: road-H, road-V, intersection, sidewalk
//   Row 3: park/grass, tree, bench
// We'll draw each tile as a 32×32 slice from the sheet.
// The sheet is 640×640 (approx). We map tile IDs to src coords:
const TILE_SRC = {
    // [srcX, srcY, srcW, srcH] in the tileset image (px)
    [T.ROAD_H]: [0, 384, 160, 96],   // horizontal road strip
    [T.ROAD_V]: [160, 384, 96, 96],   // vertical road strip
    [T.CROSS]: [256, 384, 128, 96],   // intersection
    [T.SIDE]: [384, 384, 160, 96],   // sidewalk
    [T.PARK]: [0, 480, 160, 96],   // park/grass
    [T.BLD_N1]: [0, 0, 192, 192],   // night skyscraper 1
    [T.BLD_N2]: [192, 0, 192, 192],   // night skyscraper 2
    [T.BLD_N3]: [384, 0, 192, 192],   // night skyscraper 3
    [T.BLD_D1]: [0, 192, 128, 192],   // day skyscraper 1
    [T.BLD_D2]: [128, 192, 128, 192],   // day skyscraper 2
    [T.BLD_D3]: [256, 192, 128, 192],   // day skyscraper 3
    [T.TREE]: [0, 480, 96, 128],   // tree
    [T.BENCH]: [96, 480, 96, 64],   // bench
};

// ── TileMap (40 cols × 25 rows) ──────────────────────────────
// 0=road-H, 1=road-V, 2=cross, 3=sidewalk, 4=park
// 5-7=night buildings, 8-10=day buildings, 11=tree, 12=bench
const TILE_MAP = [
    //   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39
    [3, 3, 5, 5, 5, 3, 3, 6, 6, 6, 3, 3, 7, 7, 1, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 11, 4, 4, 11, 3, 3, 3, 3], // 0
    [3, 3, 5, 5, 5, 3, 3, 6, 6, 6, 3, 3, 7, 7, 1, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 11, 4, 4, 11, 3, 3, 3, 3], // 1
    [3, 3, 5, 5, 5, 3, 3, 6, 6, 6, 3, 3, 7, 7, 1, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 2
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 3
    [3, 3, 6, 6, 6, 3, 3, 7, 7, 7, 3, 3, 5, 5, 1, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 4
    [3, 3, 6, 6, 6, 3, 3, 7, 7, 7, 3, 3, 5, 5, 1, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 5
    [3, 3, 6, 6, 6, 3, 3, 7, 7, 7, 3, 3, 5, 5, 1, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 11, 4, 4, 11, 3, 3, 3, 3], // 6
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 7
    [3, 3, 7, 7, 7, 3, 3, 5, 5, 5, 3, 3, 6, 6, 1, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 8
    [3, 3, 7, 7, 7, 3, 3, 5, 5, 5, 3, 3, 6, 6, 1, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 9
    [3, 3, 7, 7, 7, 3, 3, 5, 5, 5, 3, 3, 6, 6, 1, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 12, 3, 3, 12, 3, 3, 3, 3], // 10
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 11
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 12 (H road)
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 13
    [3, 3, 5, 5, 5, 3, 3, 6, 6, 6, 3, 3, 7, 7, 1, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 14
    [3, 3, 5, 5, 5, 3, 3, 6, 6, 6, 3, 3, 7, 7, 1, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 15
    [3, 3, 5, 5, 5, 3, 3, 6, 6, 6, 3, 3, 7, 7, 1, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 11, 4, 4, 11, 3, 3, 3, 3], // 16
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 17
    [3, 3, 6, 6, 6, 3, 3, 7, 7, 7, 3, 3, 5, 5, 1, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 18
    [3, 3, 6, 6, 6, 3, 3, 7, 7, 7, 3, 3, 5, 5, 1, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 19
    [3, 3, 6, 6, 6, 3, 3, 7, 7, 7, 3, 3, 5, 5, 1, 3, 3, 9, 9, 9, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 12, 3, 3, 12, 3, 3, 3, 3], // 20
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 21
    [3, 3, 7, 7, 7, 3, 3, 5, 5, 5, 3, 3, 6, 6, 1, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 22
    [3, 3, 7, 7, 7, 3, 3, 5, 5, 5, 3, 3, 6, 6, 1, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 4, 4, 4, 4, 3, 3, 3, 3], // 23
    [3, 3, 7, 7, 7, 3, 3, 5, 5, 5, 3, 3, 6, 6, 1, 3, 3, 10, 10, 10, 3, 3, 8, 8, 8, 3, 3, 9, 9, 9, 3, 3, 11, 4, 4, 11, 3, 3, 3, 3], // 24
];

// Solid tiles (player cannot walk through)
const SOLID_TILES = new Set([T.BLD_N1, T.BLD_N2, T.BLD_N3, T.BLD_D1, T.BLD_D2, T.BLD_D3, T.TREE, T.BENCH]);

// ── Hotspot Definitions (tile-coord anchored) ─────────────────
const HOTSPOT_DEFS = [
    { id: 'about', tileX: 2, tileY: 0, w: 3, h: 3, label: 'ABOUT ME', icon: '👤', color: '#ff006e' },
    { id: 'experience', tileX: 7, tileY: 0, w: 3, h: 3, label: 'EXPERIENCE', icon: '💼', color: '#00f5ff' },
    { id: 'projects', tileX: 12, tileY: 0, w: 2, h: 3, label: 'PROJECTS', icon: '💻', color: '#b967ff' },
    { id: 'skills', tileX: 2, tileY: 14, w: 3, h: 3, label: 'SKILLS', icon: '🛠️', color: '#ffea00' },
    { id: 'education', tileX: 27, tileY: 14, w: 3, h: 3, label: 'EDUCATION', icon: '🎓', color: '#ff006e' },
    { id: 'contact', tileX: 15, tileY: 18, w: 3, h: 3, label: 'CONTACT', icon: '📧', color: '#00f5ff' },
    { id: 'fun', tileX: 22, tileY: 14, w: 3, h: 3, label: 'FUN FACTS', icon: '⭐', color: '#ffea00' },
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
    player: {
        x: 15 * TILE_SIZE,   // start near the vertical road
        y: 13 * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        speed: PLAYER_SPEED,
        direction: 'down',
        isMoving: false,
        frame: 0,
        frameCounter: 0,
        gender: 'male',      // 'male' | 'female'
    },
    camera: { x: 0, y: 0 },
    keys: {},
    mobileKeys: {},
    hotspots: [],
    resumeData: null,
    isMuted: false,
    nearestHotspot: null,
    isDay: false,            // day/night toggle
    time: 0,                 // frame counter for animations
};

// Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 800;

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
        personal: { name: 'Kaveri Sharma', title: 'Computer Science Student', email: 'kaveri@example.com', phone: '', location: '', linkedin: '', github: '' },
        summary: 'Passionate developer and problem solver.',
        experience: [],
        education: [],
        projects: [],
        skills: { languages: [], frameworks: [], tools: [], concepts: [] },
        funFacts: [],
    };
}

// ── Camera ────────────────────────────────────────────────────
function updateCamera() {
    const cam = gameState.camera;
    const p = gameState.player;
    cam.x = p.x + p.width / 2 - canvas.width / 2;
    cam.y = p.y + p.height / 2 - canvas.height / 2;
    cam.x = Math.max(0, Math.min(cam.x, WORLD_W - canvas.width));
    cam.y = Math.max(0, Math.min(cam.y, WORLD_H - canvas.height));
}

// ── Tile Rendering ────────────────────────────────────────────
// Fallback solid-colour palette when tileset image isn't loaded
const TILE_COLORS = {
    [T.ROAD_H]: '#1a1a2e', [T.ROAD_V]: '#1a1a2e', [T.CROSS]: '#1a1a2e',
    [T.SIDE]: '#2a2a3e',
    [T.PARK]: '#1a3a1a',
    [T.BLD_N1]: '#0d1b2a', [T.BLD_N2]: '#0d1b2a', [T.BLD_N3]: '#0d1b2a',
    [T.BLD_D1]: '#1c2b3a', [T.BLD_D2]: '#1c2b3a', [T.BLD_D3]: '#1c2b3a',
    [T.TREE]: '#1a4a1a', [T.BENCH]: '#3a2a1a',
};

function drawTileMap() {
    const cam = gameState.camera;
    const img = assets.images['tileset'];

    // Visible tile range
    const startCol = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const endCol = Math.min(MAP_COLS - 1, Math.ceil((cam.x + canvas.width) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(cam.y / TILE_SIZE));
    const endRow = Math.min(MAP_ROWS - 1, Math.ceil((cam.y + canvas.height) / TILE_SIZE));

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const tileId = TILE_MAP[row][col];
            const dx = col * TILE_SIZE - cam.x;
            const dy = row * TILE_SIZE - cam.y;

            if (img) {
                // Draw from tileset — use a simple grid mapping
                // The tileset image has tiles arranged in a visual grid.
                // We use a proportional slice approach: divide the image into
                // a 6-col × 5-row grid and pick the right cell.
                const tileCol = tileId % 6;
                const tileRow = Math.floor(tileId / 6);
                const sw = img.naturalWidth / 6;
                const sh = img.naturalHeight / 5;
                ctx.drawImage(img,
                    tileCol * sw, tileRow * sh, sw, sh,
                    dx, dy, TILE_SIZE, TILE_SIZE
                );
            } else {
                // Fallback solid colour
                ctx.fillStyle = TILE_COLORS[tileId] || '#111';
                ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Road centre lines (drawn on top of road tiles)
    ctx.save();
    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);

    // Horizontal road (row 12)
    const roadHY = 12 * TILE_SIZE + TILE_SIZE / 2 - cam.y;
    if (roadHY >= 0 && roadHY <= canvas.height) {
        ctx.beginPath();
        ctx.moveTo(0, roadHY);
        ctx.lineTo(canvas.width, roadHY);
        ctx.stroke();
    }

    // Vertical road (col 14)
    const roadVX = 14 * TILE_SIZE + TILE_SIZE / 2 - cam.x;
    if (roadVX >= 0 && roadVX <= canvas.width) {
        ctx.beginPath();
        ctx.moveTo(roadVX, 0);
        ctx.lineTo(roadVX, canvas.height);
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

        // Skip if off-screen
        if (sx + hs.width < 0 || sx > canvas.width) return;
        if (sy + hs.height < 0 || sy > canvas.height) return;

        const isNearest = gameState.nearestHotspot === hs;

        // Glow outline when player is near
        if (isNearest) {
            ctx.save();
            ctx.shadowColor = hs.color;
            ctx.shadowBlur = 24;
            ctx.strokeStyle = hs.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx, sy, hs.width, hs.height);
            ctx.restore();
        } else {
            // Subtle always-on border
            ctx.save();
            ctx.strokeStyle = hs.color + '88';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(sx, sy, hs.width, hs.height);
            ctx.restore();
        }

        // Floating label above the tile
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Icon
        ctx.font = '20px Arial';
        ctx.fillText(hs.icon, sx + hs.width / 2, sy - 14);

        // Label
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = hs.color;
        ctx.shadowColor = hs.color;
        ctx.shadowBlur = isNearest ? 8 : 0;
        ctx.fillText(hs.label, sx + hs.width / 2, sy - 2);
        ctx.restore();
    });
}

// ── Player Sprite Rendering ───────────────────────────────────
// Sprite sheet layout (character_sprites_male/female.png):
//   4 rows × 4 cols, each frame 32×32
//   Row 0 = Player, Row 1 = Recruiter, Row 2 = Friend, Row 3 = Family
//   Col 0 = South, Col 1 = North, Col 2 = West, Col 3 = East
const DIR_COL = { down: 0, up: 1, left: 2, right: 3 };
const PLAYER_ROW = 0;  // Player is always row 0

function drawPlayer() {
    const p = gameState.player;
    const cam = gameState.camera;
    const key = p.gender === 'female' ? 'playerFemale' : 'playerMale';
    const img = assets.images[key];

    const dx = p.x - cam.x;
    const dy = p.y - cam.y;

    if (img) {
        const frameCol = p.isMoving ? p.frame : 0;
        const srcX = frameCol * 32;
        const srcY = PLAYER_ROW * 32;
        ctx.drawImage(img, srcX, srcY, 32, 32, dx, dy, TILE_SIZE, TILE_SIZE);
    } else {
        // Fallback rectangle
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#ff006e';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
    }

    // Neon shadow glow
    ctx.save();
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#00f5ff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx, dy, TILE_SIZE, TILE_SIZE);
    ctx.restore();
}

// ── Collision Detection ───────────────────────────────────────
function isSolidAt(worldX, worldY) {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return true;
    return SOLID_TILES.has(TILE_MAP[row][col]);
}

function checkTileCollision(nx, ny) {
    const w = gameState.player.width - 2;
    const h = gameState.player.height - 2;
    // Check all four corners
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

    // Axis-separated collision
    const nx = Math.max(0, Math.min(p.x + dx, WORLD_W - p.width));
    const ny = Math.max(0, Math.min(p.y + dy, WORLD_H - p.height));

    if (!checkTileCollision(nx, p.y)) p.x = nx;
    if (!checkTileCollision(p.x, ny)) p.y = ny;

    // Animation
    p.isMoving = moving;
    if (moving) {
        p.frameCounter++;
        if (p.frameCounter > 8) {
            p.frame = (p.frame + 1) % 4;
            p.frameCounter = 0;
        }
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

// ── Input ─────────────────────────────────────────────────────
function setupInputHandlers() {
    document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(key)) {
            e.preventDefault();
        }
        gameState.keys[key] = true;
        if (key === ' ' || key === 'enter') handleInteraction();
    });

    document.addEventListener('keyup', e => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    document.querySelectorAll('.dpad-btn, .action-btn').forEach(btn => {
        btn.addEventListener('touchstart', e => {
            e.preventDefault();
            const key = btn.dataset.key;
            gameState.mobileKeys[key] = true;
            if (key === 'space') handleInteraction();
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

    // Gender toggle
    const genderBtn = document.getElementById('gender-btn');
    if (genderBtn) {
        genderBtn.addEventListener('click', () => {
            gameState.player.gender = gameState.player.gender === 'male' ? 'female' : 'male';
            genderBtn.textContent = gameState.player.gender === 'male' ? '♂' : '♀';
        });
    }

    // Day/Night toggle
    const dayBtn = document.getElementById('daynight-btn');
    if (dayBtn) {
        dayBtn.addEventListener('click', () => {
            gameState.isDay = !gameState.isDay;
            dayBtn.textContent = gameState.isDay ? '☀️' : '🌙';
        });
    }
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
                if (data.skills[cat] && data.skills[cat].length) {
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

// ── Background (sky + stars) ──────────────────────────────────
function drawBackground() {
    const isDay = gameState.isDay;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isDay) {
        grad.addColorStop(0, '#1a3a6e');
        grad.addColorStop(1, '#2a5a9e');
    } else {
        grad.addColorStop(0, '#0a0e27');
        grad.addColorStop(1, '#1a1f3a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isDay) {
        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 80; i++) {
            const x = (i * 137 + gameState.camera.x * 0.05) % canvas.width;
            const y = (i * 211 + gameState.camera.y * 0.05) % canvas.height;
            ctx.fillRect(x, y, 1.5, 1.5);
        }
    }
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD() {
    const hudImg = assets.images['hud'];
    if (!hudImg) return;

    // Sun icon (top-left of hud sheet, ~half width)
    const iconW = hudImg.naturalWidth / 2;
    const iconH = hudImg.naturalHeight / 2;
    const icon = gameState.isDay ? 0 : 1;  // 0=sun, 1=moon
    ctx.drawImage(hudImg, icon * iconW, 0, iconW, iconH, canvas.width - 52, 8, 32, 32);
}

// ── Game Loop ─────────────────────────────────────────────────
function gameLoop() {
    gameState.time++;
    updatePlayer();
    updateCamera();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawTileMap();
    drawHotspots();
    drawPlayer();
    drawHUD();

    requestAnimationFrame(gameLoop);
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
    await loadResumeData();

    // Load all assets (gracefully continue even if some fail)
    try {
        await assets.loadAll({
            tileset: 'assets/city_tileset.png',
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
