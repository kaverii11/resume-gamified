// ============================================================
//  PIXEL CITY RESUME — Game Engine v5 (Pokémon Town)
// ============================================================

// ── Constants ─────────────────────────────────────────────────
const ZOOM = 2;       // pixel scale (chunky retro)
const WORLD_W = 2000;    // world-space px wide
const WORLD_H = 2000;    // world-space px tall
const PLAYER_SPEED = 3;
const INTERACT_DIST = 120;    // px – distance to trigger prompt

// ── Road geometry ──────────────────────────────────────────────
// Each entry is { x, y, w, h } in world-space pixels.
// Roads are walkable (gray asphalt). Grass outside is also walkable.
const ROADS = [
    // ── Main north-south spine ────────────────────────────────
    { x: 940, y: 0, w: 120, h: 920 },   // N arm (to plaza)
    { x: 940, y: 1120, w: 120, h: 880 },   // S arm (from plaza)
    // ── Main east-west spine ─────────────────────────────────
    { x: 0, y: 940, w: 920, h: 120 },   // W arm
    { x: 1120, y: 940, w: 880, h: 120 },   // E arm
    // ── NW branch (→ University) ──────────────────────────────
    { x: 272, y: 940, w: 668, h: 120 },   // horizontal segment already covered by W arm, extra width
    { x: 272, y: 272, w: 120, h: 668 },   // vertical down to W arm
    // ── NE branch (→ Skyscraper) ──────────────────────────────
    { x: 1060, y: 272, w: 668, h: 120 },   // horizontal
    { x: 1608, y: 272, w: 120, h: 668 },   // vertical
    // ── SW branch (→ Cottage) ─────────────────────────────────
    { x: 272, y: 1060, w: 668, h: 120 },
    { x: 272, y: 1060, w: 120, h: 668 },
    // ── SE branch (→ Tech Lab) ────────────────────────────────
    { x: 1060, y: 1060, w: 668, h: 120 },
    { x: 1608, y: 1060, w: 120, h: 668 },
];

// ── Town plaza (cobblestone square around fountain) ────────────
const PLAZA = { x: 880, y: 880, w: 240, h: 240 };

// ── Building / hotspot definitions ────────────────────────────
// x, y = world-space top-left corner.  w, h = size in px.
// sheetQ = quadrant of building_sprites.png (0=TL,1=TR,2=BL,3=BR).
const SCENE_BUILDINGS = [
    {
        id: 'education', label: 'EDUCATION', icon: '🎓', color: '#ff006e',
        x: 80, y: 80, w: 192, h: 192, sheetQ: 0,
    },
    {
        id: 'experience', label: 'EXPERIENCE', icon: '💼', color: '#00f5ff',
        x: 1728, y: 80, w: 192, h: 192, sheetQ: 1,
    },
    {
        id: 'about', label: 'ABOUT ME', icon: '👤', color: '#b967ff',
        x: 80, y: 1728, w: 192, h: 192, sheetQ: 2,
    },
    {
        id: 'skills', label: 'SKILLS', icon: '🛠️', color: '#ffea00',
        x: 1728, y: 1728, w: 192, h: 192, sheetQ: 3,
    },
    {
        id: 'contact', label: 'CONTACT', icon: '📧', color: '#00f5ff',
        x: 904, y: 80, w: 192, h: 192, sheetQ: 1,   // reuse skyscraper
    },
    {
        id: 'fun', label: 'FUN FACTS', icon: '⭐', color: '#ff9500',
        x: 904, y: 1728, w: 192, h: 192, sheetQ: 2,   // reuse cottage
    },
    {
        id: 'projects', label: 'PROJECTS', icon: '💻', color: '#b967ff',
        x: 1728, y: 904, w: 192, h: 192, sheetQ: 3,   // reuse lab
    },
];

// ── Nature scatter (seeded, world-space pixel centres) ───────
// Generated once at runtime in initializeScene().
let SCENE_TREES = [];   // { x, y } — collision circle r=28
let SCENE_FLOWERS = [];   // { x, y, hue }

// ── Fountain (impassable centrepiece) ─────────────────────────
const FOUNTAIN = { x: 904, y: 904, w: 192, h: 192 };

// (Old tile system removed — replaced by SCENE-based rendering)

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
        x: 1000 - 16,  // start at town centre
        y: 1150,       // just south of fountain (on road)
        width: 32,
        height: 32,
        speed: PLAYER_SPEED,
        direction: 'down',
        isMoving: false,
        frame: 0,
        frameCounter: 0,
        spriteRow: 0,
        gender: 'male',
    },
    selectHover: -1,
    camera: { x: 0, y: 0 },
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
function initializeScene() {
    // Build hotspots from SCENE_BUILDINGS (world-space coords already set)
    gameState.hotspots = SCENE_BUILDINGS.map(def => ({
        ...def,
        width: def.w,
        height: def.h,
        type: 'building',
    }));

    // Seed deterministic pseudo-random trees + flowers in "green zones"
    const rng = (n) => { let x = Math.sin(n + 1) * 73856; return x - Math.floor(x); };
    SCENE_TREES = [];
    SCENE_FLOWERS = [];
    const DANGER_MARGIN = 80; // keep nature away from buildings
    const ROAD_W = 120;

    function inGreenZone(x, y) {
        // Must be inside world
        if (x < 20 || y < 20 || x > WORLD_W - 20 || y > WORLD_H - 20) return false;
        // Not in plaza
        if (x > PLAZA.x - 30 && x < PLAZA.x + PLAZA.w + 30 &&
            y > PLAZA.y - 30 && y < PLAZA.y + PLAZA.h + 30) return false;
        // Not in fountain
        if (x > FOUNTAIN.x - 20 && x < FOUNTAIN.x + FOUNTAIN.w + 20 &&
            y > FOUNTAIN.y - 20 && y < FOUNTAIN.y + FOUNTAIN.h + 20) return false;
        // Not inside a building (+margin)
        for (const b of SCENE_BUILDINGS) {
            if (x > b.x - DANGER_MARGIN && x < b.x + b.w + DANGER_MARGIN &&
                y > b.y - DANGER_MARGIN && y < b.y + b.h + DANGER_MARGIN) return false;
        }
        // Not on a road
        for (const r of ROADS) {
            if (x > r.x - 20 && x < r.x + r.w + 20 &&
                y > r.y - 20 && y < r.y + r.h + 20) return false;
        }
        return true;
    }

    // Place 60 trees
    for (let i = 0; i < 60; i++) {
        let attempts = 0;
        while (attempts++ < 50) {
            const tx = Math.floor(rng(i * 3) * (WORLD_W - 80)) + 40;
            const ty = Math.floor(rng(i * 3 + 1) * (WORLD_H - 80)) + 40;
            if (inGreenZone(tx, ty)) {
                const sz = 44 + Math.floor(rng(i * 3 + 2) * 20);
                SCENE_TREES.push({ x: tx, y: ty, size: sz });
                break;
            }
        }
    }

    // Place 40 flowers
    for (let i = 0; i < 40; i++) {
        let attempts = 0;
        while (attempts++ < 50) {
            const fx = Math.floor(rng(i * 5 + 200) * (WORLD_W - 60)) + 30;
            const fy = Math.floor(rng(i * 5 + 201) * (WORLD_H - 60)) + 30;
            if (inGreenZone(fx, fy)) {
                SCENE_FLOWERS.push({ x: fx, y: fy, hue: Math.floor(rng(i * 5 + 202) * 360) });
                break;
            }
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
    initializeScene();
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

// ── Layer 0: Grass background ─────────────────────────────────
function drawGrass() {
    const cam = gameState.camera;
    // Base grass fill (whole logical viewport)
    ctx.fillStyle = '#4a9a30';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Subtle darker vertical grass-stripe texture for depth
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    const stripeW = 8;
    const startS = Math.floor(cam.x / stripeW) * stripeW - cam.x;
    for (let sx = startS; sx < LOGICAL_W; sx += stripeW * 2) {
        ctx.fillRect(sx, 0, stripeW, LOGICAL_H);
    }
}

// ── Layer 1: Roads ────────────────────────────────────────────
function drawRoads() {
    const cam = gameState.camera;
    for (const r of ROADS) {
        const dx = r.x - cam.x, dy = r.y - cam.y;
        // Asphalt base
        ctx.fillStyle = '#6e6e6e';
        ctx.fillRect(dx, dy, r.w, r.h);
        // Dark border lines (1px each side)
        ctx.fillStyle = '#4a4a4a';
        if (r.w > r.h) { // horizontal road — borders on top+bottom
            ctx.fillRect(dx, dy, r.w, 3);
            ctx.fillRect(dx, dy + r.h - 3, r.w, 3);
            // Dashed centre line
            ctx.fillStyle = '#d4c84a';
            const dashLen = 14, gap = 10;
            const startX = Math.floor((cam.x - r.x) / (dashLen + gap)) * (dashLen + gap) + r.x;
            for (let x = startX; x < r.x + r.w; x += dashLen + gap) {
                const lx = x - cam.x;
                if (lx + dashLen < 0 || lx > LOGICAL_W) continue;
                ctx.fillRect(lx, dy + r.h / 2 - 1, dashLen, 2);
            }
        } else { // vertical road — borders on left+right
            ctx.fillRect(dx, dy, 3, r.h);
            ctx.fillRect(dx + r.w - 3, dy, 3, r.h);
            ctx.fillStyle = '#d4c84a';
            const dashLen = 14, gap = 10;
            const startY = Math.floor((cam.y - r.y) / (dashLen + gap)) * (dashLen + gap) + r.y;
            for (let y = startY; y < r.y + r.h; y += dashLen + gap) {
                const ly = y - cam.y;
                if (ly + dashLen < 0 || ly > LOGICAL_H) continue;
                ctx.fillRect(dx + r.w / 2 - 1, ly, 2, dashLen);
            }
        }
    }
}

// ── Layer 2: Town square plaza + fountain ─────────────────────
function drawTownSquare() {
    const cam = gameState.camera;
    const px = PLAZA.x - cam.x, py = PLAZA.y - cam.y;
    const fx = FOUNTAIN.x - cam.x, fy = FOUNTAIN.y - cam.y;

    // Cobblestone plaza fill
    const TILE = 16;
    for (let row = 0; row < Math.ceil(PLAZA.h / TILE); row++) {
        for (let col = 0; col < Math.ceil(PLAZA.w / TILE); col++) {
            const shade = (row + col) % 2 === 0 ? '#c8b878' : '#b8a868';
            ctx.fillStyle = shade;
            ctx.fillRect(px + col * TILE, py + row * TILE, TILE, TILE);
        }
    }
    ctx.strokeStyle = '#a09050';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(px, py, PLAZA.w, PLAZA.h);

    // Fountain sprite (or fallback blue circle)
    const fountainImg = assets.images['fountain'];
    if (fountainImg) {
        ctx.drawImage(fountainImg, fx, fy, FOUNTAIN.w, FOUNTAIN.h);
    } else {
        ctx.fillStyle = '#4488cc';
        ctx.beginPath();
        ctx.arc(fx + FOUNTAIN.w / 2, fy + FOUNTAIN.h / 2,
            FOUNTAIN.w / 2 - 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// ── Layer 3a: Nature decorations (trees + flowers) ────────────
function drawDecorations() {
    const cam = gameState.camera;
    const natImg = assets.images['natureSheet'];
    // Nature sheet proportions: left 2/3 = tree (approximately)
    const treeW = natImg ? natImg.naturalWidth * 0.65 : 64;
    const treeH = natImg ? natImg.naturalHeight : 64;
    const flowX = natImg ? natImg.naturalWidth * 0.65 : 0;
    const flowW = natImg ? natImg.naturalWidth * 0.35 : 32;
    const flowH = natImg ? natImg.naturalHeight * 0.5 : 32;

    // Flowers (no collision, drawn under trees)
    for (const f of SCENE_FLOWERS) {
        const sx = f.x - cam.x, sy = f.y - cam.y;
        if (sx < -32 || sx > LOGICAL_W + 32 || sy < -32 || sy > LOGICAL_H + 32) continue;
        if (natImg) {
            ctx.drawImage(natImg, flowX, 0, flowW, flowH, sx - 10, sy - 10, 20, 20);
        } else {
            ctx.fillStyle = `hsl(${f.hue},90%,60%)`;
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Trees (sorted front-to-back already by initializeScene seed order)
    for (const t of SCENE_TREES) {
        const sx = t.x - cam.x, sy = t.y - cam.y;
        if (sx < -64 || sx > LOGICAL_W + 64 || sy < -64 || sy > LOGICAL_H + 64) continue;
        const size = t.size || 52;
        if (natImg) {
            ctx.drawImage(natImg, 0, 0, treeW, treeH, sx - size / 2, sy - size * 0.7, size, size);
        } else {
            ctx.fillStyle = '#2a7a1a';
            ctx.beginPath();
            ctx.arc(sx, sy - 8, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ── Layer 3b: Buildings (drawn in Y-sort with player) ─────────
// Call drawEntitiesSorted() from the game loop instead of calling
// drawBuildings() and drawPlayer() separately.
function drawEntitiesSorted() {
    const cam = gameState.camera;
    const bldSheet = assets.images['buildingSheet'];
    // sheet is 2×2, each cell = half the image
    const cellW = bldSheet ? bldSheet.naturalWidth / 2 : 192;
    const cellH = bldSheet ? bldSheet.naturalHeight / 2 : 192;

    // Build list: buildings + player, each tagged with a sortY = bottom edge
    const entities = [];

    // Add buildings
    for (const b of gameState.hotspots) {
        entities.push({ type: 'building', data: b, sortY: b.y + b.height });
    }
    // Add player
    const p = gameState.player;
    entities.push({ type: 'player', data: p, sortY: p.y + p.height });

    // Sort ascending by bottom edge (painter's algorithm)
    entities.sort((a, b) => a.sortY - b.sortY);

    for (const e of entities) {
        if (e.type === 'player') {
            _drawPlayer();
        } else {
            const hs = e.data;
            const sx = hs.x - cam.x;
            const sy = hs.y - cam.y;
            if (sx + hs.width < 0 || sx > LOGICAL_W) continue;
            if (sy + hs.height < 0 || sy > LOGICAL_H) continue;

            const isNearest = gameState.nearestHotspot === hs;

            // Draw building sprite from sheet quadrant
            if (bldSheet) {
                const qCol = hs.sheetQ % 2;
                const qRow = Math.floor(hs.sheetQ / 2);
                const srcX = qCol * cellW;
                const srcY = qRow * cellH;
                const scale = isNearest ? 1.05 : 1.0;
                const dw = hs.width * scale;
                const dh = hs.height * scale;
                const offX = (dw - hs.width) / 2;
                const offY = (dh - hs.height) / 2;
                ctx.save();
                if (isNearest) { ctx.shadowColor = hs.color; ctx.shadowBlur = 24; }
                ctx.drawImage(bldSheet, srcX, srcY, cellW, cellH,
                    sx - offX, sy - offY, dw, dh);
                ctx.restore();
            } else {
                // Fallback rectangle
                ctx.fillStyle = hs.color + '55';
                ctx.strokeStyle = hs.color;
                ctx.lineWidth = 2;
                ctx.fillRect(sx, sy, hs.width, hs.height);
                ctx.strokeRect(sx, sy, hs.width, hs.height);
            }

            // Neon outline
            ctx.save();
            ctx.strokeStyle = isNearest ? hs.color : hs.color + '77';
            ctx.lineWidth = isNearest ? 2 : 1;
            if (isNearest) { ctx.shadowColor = hs.color; ctx.shadowBlur = 14; }
            ctx.strokeRect(sx, sy, hs.width, hs.height);
            ctx.restore();

            // Floating label
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.font = '12px monospace';
            ctx.fillText(hs.icon, sx + hs.width / 2, sy - 8);
            ctx.font = 'bold 6px monospace';
            ctx.fillStyle = isNearest ? hs.color : '#ffffffcc';
            if (isNearest) { ctx.shadowColor = hs.color; ctx.shadowBlur = 8; }
            ctx.fillText(hs.label, sx + hs.width / 2, sy - 1);
            ctx.restore();
        }
    }
}
// ── Player Rendering (called from drawEntitiesSorted) ─────────
// Sprite sheet layout: 4 cols × 4 rows
//   Cols (direction): 0=front(down), 1=back(up), 2=left, 3=right
//   Rows (character): 0=Player, 1=Recruiter, 2=Friend, 3=Family
const DIR_COL = { down: 0, up: 1, left: 2, right: 3 };

function _drawPlayer() {
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
        ctx.drawImage(img, srcX, srcY, cellW, cellH, dx, dy, p.width, p.height);
    } else {
        // Fallback coloured block
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(dx, dy, p.width, p.height);
        ctx.strokeStyle = '#ff006e';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx, dy, p.width, p.height);
    }

    // Neon glow outline
    ctx.save();
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00f5ff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(dx, dy, p.width, p.height);
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
    // World boundary
    if (worldX < 0 || worldY < 0 || worldX >= WORLD_W || worldY >= WORLD_H) return true;
    // Buildings
    for (const b of SCENE_BUILDINGS) {
        if (worldX >= b.x && worldX <= b.x + b.w &&
            worldY >= b.y && worldY <= b.y + b.h) return true;
    }
    // Fountain
    if (worldX >= FOUNTAIN.x && worldX <= FOUNTAIN.x + FOUNTAIN.w &&
        worldY >= FOUNTAIN.y && worldY <= FOUNTAIN.y + FOUNTAIN.h) return true;
    // Trees (circle collision, r=24)
    for (const t of SCENE_TREES) {
        const dx = worldX - t.x, dy = worldY - t.y;
        if (dx * dx + dy * dy < 24 * 24) return true;
    }
    return false;
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
        drawGrass();
        drawRoads();
        drawTownSquare();
        drawDecorations();
        renderDayTint();
        drawEntitiesSorted();
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
            buildingSheet: 'assets/building_sprites.png',
            fountain: 'assets/fountain_plaza.png',
            natureSheet: 'assets/nature_sprites.png',
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
