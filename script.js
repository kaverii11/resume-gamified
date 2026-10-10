// ============================================================
//  PIXEL TOWN RESUME — Game Engine v6
// ============================================================
//  Sprites come pre-cut from assets/sprites/ (see tools/prep_sprites.py).
//  Resume text lives in data/resume-data.js.

// ── Constants ─────────────────────────────────────────────────
const WORLD_W = 1600;
const WORLD_H = 1180;
const WORLD_TOP = -120;          // grass/trees above y=0 so tall buildings on the top street fit
const PLAYER_SPEED = 165;        // world px / second
const CHAR_H = 46;               // on-screen character height (world px)
const FEET_R = 9;                // collision radius at the player's feet
const INTERACT_RANGE = 34;       // how close (world px) to a door / NPC to interact

// ── Resume sections (one per building / object) ───────────────
const SECTIONS = {
    about: 'ABOUT ME',
    education: 'EDUCATION',
    experience: 'EXPERIENCE',
    projects: 'PROJECTS',
    achievements: 'ACHIEVEMENTS',
    skills: 'SKILLS',
    leadership: 'LEADERSHIP',
    contact: 'CONTACT',
};

// ── Town layout ───────────────────────────────────────────────
// Streets are decorative (the whole town is walkable) but they guide the eye.
const STREETS = [
    { x: 120, y: 300, w: 1360, h: 56 },   // upper street
    { x: 120, y: 770, w: 1360, h: 56 },   // main avenue
    { x: 372, y: 1010, w: 856, h: 50 },   // park lane
    { x: 372, y: 300, w: 56, h: 760 },    // west street
    { x: 772, y: 300, w: 56, h: 760 },    // centre street
    { x: 1172, y: 300, w: 56, h: 760 },   // east street
];

const PLAZA = { x: 675, y: 495, w: 250, h: 250 };
const FOUNTAIN = { x: 800, y: 620, r: 50 };
const POND = { x: 210, y: 990, rx: 120, ry: 62 };
// Little park in the block south-east of the plaza: a path loop round a flower bed
const PARK = { x: 1000, y: 930, rx: 92, ry: 46, area: { x: 840, y: 838, w: 320, h: 168 } };
const PARK_DECOR = [
    { kind: 'bench', x: 950, y: 879 }, { kind: 'bench', x: 1050, y: 879 },
    { kind: 'lamp', x: 890, y: 896 }, { kind: 'lamp', x: 1110, y: 896 },
    { kind: 'lamp', x: 1000, y: 878 },
];

// x = centre, y = bottom edge (where the door meets the ground), w = drawn width
const BUILDINGS = [
    { id: 'education', sprite: 'bld_university', x: 240, y: 300, w: 200 },
    { id: 'experience', sprite: 'bld_office', x: 600, y: 300, w: 135 },
    { id: 'projects', sprite: 'bld_lab', x: 1000, y: 300, w: 175 },
    { id: 'leadership', sprite: 'bld_cafe', x: 1360, y: 300, w: 190 },
    { id: 'skills', sprite: 'bld_library', x: 240, y: 770, w: 175 },
    { id: 'contact', sprite: 'bld_postoffice', x: 590, y: 770, w: 160 },
    { id: 'about', sprite: 'bld_cottage', x: 1010, y: 770, w: 180 },
    { id: 'achievements', sprite: 'bld_hall', x: 1360, y: 770, w: 165 },
];

// Small interactive props
const PROPS = [
    { id: 'help', kind: 'sign', x: 758, y: 905 },
];

const PLAYER_START = { x: 800, y: 930 };

// Character sprite sheets: which pose column to use per facing direction.
// `side` is a side/three-quarter view; `sideFaces` says which way it looks,
// and we mirror it for the other direction.
const CHAR_TYPES = ['player', 'recruiter', 'friend', 'elder'];
const CHAR_NAMES = { player: 'EXPLORER', recruiter: 'RECRUITER', friend: 'FRIEND', elder: 'ELDER' };
const CHAR_POSES = {
    male_player: { down: 0, up: 0, side: 2, sideFaces: 'right' },
    male_recruiter: { down: 0, up: 3, side: 2, sideFaces: 'left' },
    male_friend: { down: 0, up: 1, side: 2, sideFaces: 'left' },
    male_elder: { down: 0, up: 3, side: 2, sideFaces: 'left' },
    female_player: { down: 0, up: 3, side: 2, sideFaces: 'left' },
    female_recruiter: { down: 0, up: 3, side: 2, sideFaces: 'left' },
    female_friend: { down: 0, up: 0, side: 2, sideFaces: 'right' },
    female_elder: { down: 0, up: 1, side: 3, sideFaces: 'right' },
};

// NPCs and what they say (only facts from the resume).
const NPC_DEFS = [
    {
        type: 'recruiter', x: 690, y: 312, dir: 'down',
        lines: [
            "I'm here about the NCRTC internship: a real-time transport analytics dashboard for PM e-Bus Sewa.",
            'The office has the details. Walk up to the door!',
        ],
    },
    {
        type: 'friend', x: 1290, y: 790, dir: 'left',
        lines: [
            'Did you hear? CityOS placed 2nd nationally at the AMD Slingshot Challenge!',
            'OptiSolve was 1 of only 5 finalist teams at Atos SRiJAN, too.',
        ],
    },
    {
        type: 'elder', x: 712, y: 790, dir: 'right',
        lines: [
            'In my day that routing job took 14 hours. CityOS does it in 12 seconds on AMD GPUs.',
            'The lab up north has all the projects.',
        ],
    },
];

// ── Game State ────────────────────────────────────────────────
const state = {
    phase: 'loading',            // loading | select | playing
    player: { x: PLAYER_START.x, y: PLAYER_START.y, dir: 'down', moving: false, walkT: 0, sex: 'female', type: 'player' },
    camera: { x: 0, y: 0 },
    keys: {},
    touchKeys: {},
    moveTarget: null,
    stuckTime: 0,
    nearest: null,
    modalOpen: false,
    inside: null,                // id of the building we're in, if any
    transitioning: false,
    visited: new Set(),
    allVisitedShown: false,
    npcs: [],
    trees: [],
    bushes: [],
    flowers: [],
    time: 0,
};

const data = window.RESUME_DATA;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

// ── Canvas ────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const view = { scale: 1, dpr: 1, w: 0, h: 0 };   // w/h = visible world size

function resize() {
    const r = canvas.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * view.dpr);
    canvas.height = Math.round(r.height * view.dpr);
    // Show roughly 880x540 world px on desktop, but never shrink sprites
    // below ~3/4 size on small phones.
    const fit = Math.min(r.width / 880, r.height / 540);
    const floor = Math.min(r.width, r.height) / 520;
    view.scale = Math.max(fit, floor);
    view.w = r.width / view.scale;
    view.h = r.height / view.scale;
}

// ── Assets ────────────────────────────────────────────────────
const images = {};

function loadImage(name) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => { images[name] = img; resolve(); };
        img.onerror = () => { console.warn('Missing sprite:', name); resolve(); };
        img.src = `assets/sprites/${name}.png`;
    });
}

function spriteList() {
    const names = [
        'plaza', 'tree_city', 'bench', 'bush', 'bush_berry', 'bush_flower',
        'flower_pink', 'flower_lilac', 'flower_peach', 'flower_cream',
        ...BUILDINGS.map(b => b.sprite),
    ];
    for (const sex of ['male', 'female']) {
        for (const type of CHAR_TYPES) {
            const p = CHAR_POSES[`${sex}_${type}`];
            for (const col of new Set([p.down, p.up, p.side])) names.push(`char_${sex}_${type}_${col}`);
        }
    }
    return names;
}

// ── Deterministic RNG (same town every visit) ─────────────────
function makeRng(seed) {
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
}

// ── Geometry helpers ──────────────────────────────────────────
function buildingSize(b) {
    const img = images[b.sprite];
    const h = img ? b.w * img.height / img.width : b.w * 0.85;
    return { w: b.w, h };
}

// Solid footprint: the lower part of the sprite (so you can walk "behind" roofs).
function footprint(b) {
    const { w, h } = buildingSize(b);
    const fh = Math.min(h * 0.45, 90);
    return { x: b.x - w * 0.43, y: b.y - fh, w: w * 0.86, h: fh - 4 };
}

function onStreet(x, y, pad = 0) {
    return STREETS.some(s => x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad);
}

function inRect(x, y, r, pad = 0) {
    return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
}

function inPond(x, y, pad = 0) {
    const dx = (x - POND.x) / (POND.rx + pad), dy = (y - POND.y) / (POND.ry + pad);
    return dx * dx + dy * dy < 1;
}

// The paths you can walk on: streets, the plaza and the park loop.
function onPath(x, y) {
    if (onStreet(x, y, -3) || inRect(x, y, PLAZA, -6)) return true;
    const ex = (x - PARK.x) / PARK.rx, ey = (y - PARK.y) / PARK.ry;
    const ix = (x - PARK.x) / (PARK.rx - 17), iy = (y - PARK.y) / (PARK.ry - 15);
    if (ex * ex + ey * ey < 0.94 && ix * ix + iy * iy > 1.08) return true;
    if (inRect(x, y, { x: 826, y: PARK.y - 5, w: PARK.x - PARK.rx - 820, h: 10 })) return true;
    return inRect(x, y, { x: PARK.x - 5, y: PARK.y + PARK.ry - 8, w: 10, h: 1010 - (PARK.y + PARK.ry) + 8 });
}

function circleHitsRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// ── Scene generation ──────────────────────────────────────────
function blockedForDecor(x, y, pad) {
    if (onStreet(x, y, pad) || inRect(x, y, PLAZA, pad) || inPond(x, y, pad + 30) || inRect(x, y, PARK.area, pad)) return true;
    if (Math.hypot(x - PLAYER_START.x, y - PLAYER_START.y) < 60) return true;
    for (const b of BUILDINGS) {
        const { w, h } = buildingSize(b);
        if (inRect(x, y, { x: b.x - w / 2, y: b.y - h, w, h }, pad)) return true;
        // keep the doorstep clear
        if (inRect(x, y, { x: b.x - 40, y: b.y, w: 80, h: 40 }, pad)) return true;
    }
    for (const p of PROPS) if (Math.hypot(x - p.x, y - p.y) < 40 + pad) return true;
    for (const n of NPC_DEFS) if (Math.hypot(x - n.x, y - n.y) < 40 + pad) return true;
    return false;
}

function buildScene() {
    const rng = makeRng(7);
    const treeSprites = ['tree_city', 'tree_city', 'tree_city'];
    const tooCloseToTree = (x, y, d) => state.trees.some(t => Math.hypot(t.x - x, t.y - y) < d);

    const tryTree = (x, y, size) => {
        if (x < 10 || x > WORLD_W - 10 || y < WORLD_TOP + 40 || y > WORLD_H + 20) return;
        // check the trunk and the middle of the canopy
        if (blockedForDecor(x, y, 22) || blockedForDecor(x, y - size * 0.55, 8) || tooCloseToTree(x, y, 46)) return;
        state.trees.push({ x, y, size, sprite: treeSprites[Math.floor(rng() * 3)] });
    };

    // Forest border around the edge of town
    for (let x = 20; x < WORLD_W; x += 48 + rng() * 18) {
        tryTree(x, 70 + rng() * 30, 64 + rng() * 16);
        tryTree(x + 24, WORLD_TOP + 70 + rng() * 30, 64 + rng() * 16);
        tryTree(x + 20, WORLD_H - 10 + rng() * 20, 64 + rng() * 16);
    }
    for (let y = WORLD_TOP + 120; y < WORLD_H; y += 48 + rng() * 18) {
        tryTree(25 + rng() * 40, y, 64 + rng() * 16);
        tryTree(WORLD_W - 25 - rng() * 40, y, 64 + rng() * 16);
    }
    // A few scattered park trees
    const border = state.trees.length;
    for (let i = 0; i < 400 && state.trees.length < border + 24; i++) {
        tryTree(120 + rng() * (WORLD_W - 240), 400 + rng() * (WORLD_H - 480), 52 + rng() * 16);
    }

    // Bushes and flowers on the grass
    const bushSprites = ['bush', 'bush_berry', 'bush_flower'];
    for (let i = 0; i < 200 && state.bushes.length < 34; i++) {
        const x = 80 + rng() * (WORLD_W - 160), y = 140 + rng() * (WORLD_H - 220);
        if (blockedForDecor(x, y, 18) || tooCloseToTree(x, y, 40)) continue;
        state.bushes.push({ x, y, size: 30 + rng() * 10, sprite: bushSprites[Math.floor(rng() * 3)] });
    }
    const flowerSprites = ['flower_pink', 'flower_lilac', 'flower_peach', 'flower_cream'];
    for (let i = 0; i < 600 && state.flowers.length < 90; i++) {
        const x = 60 + rng() * (WORLD_W - 120), y = 120 + rng() * (WORLD_H - 160);
        if (blockedForDecor(x, y, 8) || tooCloseToTree(x, y, 24)) continue;
        state.flowers.push({ x, y, size: 18 + rng() * 6, sprite: flowerSprites[Math.floor(rng() * 4)] });
    }
    // Park planting: corner bushes and a ring of flowers in the centre bed
    for (const [x, y] of [[862, 868], [1138, 868], [862, 998], [1138, 998]]) {
        state.bushes.push({ x, y, size: 40, sprite: 'bush_flower' });
    }
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        state.flowers.push({ x: PARK.x + Math.cos(a) * 24, y: PARK.y + 6 + Math.sin(a) * 9, size: 20, sprite: flowerSprites[i % 4] });
    }
    state.flowers.push({ x: PARK.x, y: PARK.y + 7, size: 22, sprite: 'flower_pink' });
    // Draw back-to-front later; keep flowers sorted so overlaps look right
    state.flowers.sort((a, b) => a.y - b.y);
}

function createNpcs() {
    // Use the other characters in the cast, avoiding the one the player picked.
    state.npcs = NPC_DEFS.map((def, i) => {
        let sex = i % 2 === 0 ? 'female' : 'male';
        if (def.type === state.player.type && sex === state.player.sex) sex = sex === 'male' ? 'female' : 'male';
        return { ...def, sex, line: 0, bubble: null, bubbleUntil: 0 };
    });
}

// ── Pond (stone rim, depth bands, reeds, lilies) and its ducks ─
const PX = 2;   // the pond is drawn on a 2px grid so it reads as pixel art like the sprites

function hash2(x, y) {
    let h = (x * 374761393 + y * 668265263) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return (h ^ (h >>> 16)) / 4294967296;
}

// Signed distance in px from the (wobbly) shoreline: negative = in the water.
function pondDist(x, y) {
    const dx = (x - POND.x) / POND.rx, dy = (y - POND.y) / POND.ry;
    const ang = Math.atan2(dy, dx);
    const wob = 1 + 0.07 * Math.sin(3 * ang + 0.6) + 0.05 * Math.sin(5 * ang + 2.1) + 0.025 * Math.sin(9 * ang);
    const R = Math.hypot(POND.rx * Math.cos(ang), POND.ry * Math.sin(ang)) * wob;
    return (Math.hypot(dx, dy) / wob - 1) * R;
}

function drawPondGround(g) {
    const x0 = POND.x - POND.rx * 1.25, x1 = POND.x + POND.rx * 1.25;
    const y0 = POND.y - POND.ry * 1.35, y1 = POND.y + POND.ry * 1.35;
    for (let y = y0; y < y1; y += PX) {
        for (let x = x0; x < x1; x += PX) {
            const d = pondDist(x + 1, y + 1);
            if (d > 11) continue;
            let c;
            if (d > 0) {
                // rim of rounded stones, bricked in staggered rows
                const row = Math.floor((y - y0) / 6), off = row % 2 ? 4 : 0;
                const col = Math.floor((x - x0 + off) / 8);
                const lx = (x - x0 + off) % 8, ly = (y - y0) % 6;
                const tone = hash2(col, row);
                if (d > 9) c = '#5d5a4e';
                else if (lx < PX || ly < PX) c = '#77735f';
                else if (lx < 4 && ly < 4) c = '#d6d2c0';
                else c = tone < 0.33 ? '#a9a593' : tone < 0.66 ? '#bdb9a6' : '#9a9684';
            } else if (d > -4) {
                c = y < POND.y ? '#3d7aa6' : '#82cde2';      // shadow under the north rim, bright shallows south
            } else if (d > -9) c = '#6dbfdc';
            else if (d > -22) c = '#4fa6d3';
            else if (d > -40) c = '#4294c8';
            else c = '#3a86bc';
            g.fillStyle = c;
            g.fillRect(x, y, PX, PX);
        }
    }
    // soft light streaks on the water
    g.fillStyle = '#9fd8ec';
    for (const [dx, dy, w] of [[-58, -22, 16], [-40, -18, 8], [24, 8, 20], [44, 12, 8], [-8, 26, 12]]) g.fillRect(POND.x + dx, POND.y + dy, w, PX);

    // lily pads (one with a pink flower)
    const lily = (cx, cy, r, flower) => {
        for (let y = -r; y <= r; y += PX) {
            for (let x = -r; x <= r; x += PX) {
                const dd = Math.hypot(x, y * 1.4);
                if (dd > r) continue;
                if (x > 0 && Math.abs(y) < x * 0.45) continue;        // notch
                g.fillStyle = dd > r - PX ? '#2f6b2a' : (x < -r / 3 && y < 0 ? '#86c95f' : '#5aa845');
                g.fillRect(cx + x, cy + y, PX, PX);
            }
        }
        if (flower) {
            g.fillStyle = '#f6b8c8'; g.fillRect(cx - 4, cy - 4, 8, 4); g.fillRect(cx - 2, cy - 6, 4, 8);
            g.fillStyle = '#fde2ea'; g.fillRect(cx - 2, cy - 6, 2, 2);
            g.fillStyle = '#f3d27a'; g.fillRect(cx - 1, cy - 3, 2, 2);
        }
    };
    lily(POND.x - 74, POND.y + 16, 9, true);
    lily(POND.x - 58, POND.y + 26, 6, false);
    lily(POND.x + 62, POND.y + 20, 8, false);
    lily(POND.x + 28, POND.y - 30, 7, true);

    // cattails and reeds on the shore
    const reeds = (cx, cy, n) => {
        for (let i = 0; i < n; i++) {
            const x = cx + i * 5 - n * 2, h = 14 + ((i * 7) % 4) * 3, y = cy + (i % 2) * 2;
            g.fillStyle = '#3f7a2d'; g.fillRect(x, y - h, PX, h);
            g.fillStyle = '#6aa84a'; g.fillRect(x - 2, y - 6, PX, 6); g.fillRect(x + 2, y - 8, PX, 7);
            if (i % 2 === 0) { g.fillStyle = '#6b3f22'; g.fillRect(x - 1, y - h - 6, 4, 8); g.fillStyle = '#8a5530'; g.fillRect(x - 1, y - h - 6, 2, 3); }
        }
    };
    reeds(POND.x - POND.rx + 6, POND.y - 18, 5);
    reeds(POND.x + POND.rx - 14, POND.y - 30, 4);
    reeds(POND.x - 30, POND.y + POND.ry + 6, 4);
}

// Pixel maps: o outline, w body, s shade, b bill, e eye, y duckling, d duckling shade, f feet
const DUCK = [
    '.......oo...',
    '......owwo..',
    '......owebb.',
    '......owwo..',
    'oo....owwo..',
    'owo..owwwwo.',
    'owwoooowwwwo',
    'owwwwwwwwwwo',
    '.osssssssso.',
    '..oooooooo..',
];
const DUCKLING = [
    '...oo..',
    '..oyyo.',
    '..oyeb.',
    'o.oyyo.',
    'oyyyyyo',
    '.oddddo',
    '..oooo.',
];
const DUCK_COLORS = { o: '#3b3a35', w: '#fbf8ef', s: '#d8d3c2', b: '#f0a23a', e: '#222', y: '#f7dc6f', d: '#e2bf4a', f: '#e8912f' };

function drawDuck(map, x, y, flip, standing = false) {
    const w = map[0].length, h = map.length;
    const ox = Math.round(x - w * PX / 2), oy = Math.round(y - h * PX);
    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            const ch = map[r][flip ? w - 1 - c : c];
            if (ch === '.') continue;
            ctx.fillStyle = DUCK_COLORS[ch];
            ctx.fillRect(ox + c * PX, oy + r * PX, PX, PX);
        }
    }
    if (standing) {
        ctx.fillStyle = DUCK_COLORS.f;
        ctx.fillRect(ox + 4 * PX, oy + h * PX, PX * 2, PX);
        ctx.fillRect(ox + 7 * PX, oy + h * PX, PX * 2, PX);
    }
}

// A duck pottering about on the east bank, turning round now and then
function shoreDuck() {
    const t = state.time;
    const flip = Math.floor(t / 4) % 2 === 1;
    return { x: POND.x + POND.rx + 30 + Math.sin(t * 0.5) * 8, y: POND.y + 14, flip };
}

function drawPondLife() {
    if (!visible(POND.x - POND.rx - 20, POND.y - POND.ry - 30, POND.rx * 2 + 80, POND.ry * 2 + 50)) return;
    const t = state.time;
    // twinkles on the water
    ctx.fillStyle = '#e8f7ff';
    for (let i = 0; i < 6; i++) {
        const ph = (t * 0.7 + i * 0.37) % 1;
        if (ph > 0.3) continue;
        const a = i * 2.1, rr = 0.25 + (i % 3) * 0.2;
        ctx.fillRect(Math.round(POND.x + Math.cos(a) * POND.rx * rr), Math.round(POND.y + Math.sin(a) * POND.ry * rr), 6, PX);
    }
    // a mother duck and her ducklings paddling round in a loop
    const speed = 0.14;
    const at = k => {
        const a = t * speed - k;
        return {
            x: POND.x + Math.cos(a) * POND.rx * 0.55,
            y: POND.y + 6 + Math.sin(a) * POND.ry * 0.5,
            flip: Math.sin(a) > 0,    // moving left when below centre
        };
    };
    const swimmers = [{ map: DUCK, k: 0 }, { map: DUCKLING, k: 0.4 }, { map: DUCKLING, k: 0.6 }, { map: DUCKLING, k: 0.8 }];
    for (const sw of swimmers) {
        const q = at(sw.k);
        const bob = Math.round(Math.sin(t * 3 + sw.k * 9));
        // ripple behind
        ctx.fillStyle = '#9fd8ec';
        const back = q.flip ? 1 : -1, wd = sw.map === DUCK ? 12 : 7;
        ctx.fillRect(Math.round(q.x + back * (wd + 4)), Math.round(q.y - 2), 6, PX);
        ctx.fillRect(Math.round(q.x - wd - 2), Math.round(q.y), wd * 2 + 4, PX);
        drawDuck(sw.map, q.x, q.y + bob, q.flip);
    }
}

// ── Ground (pre-rendered once) ────────────────────────────────
let ground = null;

function renderGround() {
    ground = document.createElement('canvas');
    ground.width = WORLD_W;
    ground.height = WORLD_H - WORLD_TOP;
    const g = ground.getContext('2d');
    const rng = makeRng(42);

    // Grass with speckles and tufts
    g.fillStyle = '#5ca83e';
    g.translate(0, -WORLD_TOP);
    g.fillRect(0, WORLD_TOP, WORLD_W, WORLD_H - WORLD_TOP);
    for (let i = 0; i < 9000; i++) {
        g.fillStyle = rng() < 0.5 ? '#529c36' : '#68b448';
        g.fillRect(Math.floor(rng() * WORLD_W / 2) * 2, WORLD_TOP + Math.floor(rng() * (WORLD_H - WORLD_TOP) / 2) * 2, 2, 2);
    }
    g.fillStyle = '#4a8f30';
    for (let i = 0; i < 1400; i++) {
        const x = Math.floor(rng() * WORLD_W), y = WORLD_TOP + Math.floor(rng() * (WORLD_H - WORLD_TOP));
        g.fillRect(x, y, 1, 3);
        g.fillRect(x + 2, y - 1, 1, 4);
        g.fillRect(x + 4, y + 1, 1, 2);
    }

    // Streets: sandy cobblestone with darker edging
    for (const s of STREETS) {
        g.fillStyle = '#a38a5e';
        g.fillRect(s.x - 3, s.y - 3, s.w + 6, s.h + 6);
    }
    for (const s of STREETS) {
        g.fillStyle = '#dcc79b';
        g.fillRect(s.x, s.y, s.w, s.h);
        for (let y = s.y; y < s.y + s.h; y += 10) {
            const off = ((y - s.y) / 10) % 2 ? 7 : 0;
            for (let x = s.x - off; x < s.x + s.w; x += 14) {
                const cx = Math.max(x, s.x), cw = Math.min(x + 12, s.x + s.w) - cx;
                const ch = Math.min(8, s.y + s.h - y);
                if (cw <= 0 || ch <= 0) continue;
                g.fillStyle = rng() < 0.5 ? '#d7c295' : '#d3bd8e';
                g.fillRect(cx, y, cw, ch);
            }
        }
    }

    drawPondGround(g);

    // Park: sandy path loop with spurs to the centre street and park lane, soil bed in the middle
    const ring = (rx, ry, color) => {
        g.fillStyle = color;
        g.beginPath(); g.ellipse(PARK.x, PARK.y, rx, ry, 0, 0, Math.PI * 2); g.fill();
    };
    g.fillStyle = '#a38a5e';
    g.fillRect(825, PARK.y - 11, PARK.x - PARK.rx - 820, 22);
    g.fillRect(PARK.x - 11, PARK.y + PARK.ry - 6, 22, 1010 - (PARK.y + PARK.ry) + 6);
    ring(PARK.rx + 3, PARK.ry + 3, '#a38a5e');
    g.fillStyle = '#dcc79b';
    g.fillRect(828, PARK.y - 8, PARK.x - PARK.rx - 826, 16);
    g.fillRect(PARK.x - 8, PARK.y + PARK.ry - 6, 16, 1010 - (PARK.y + PARK.ry) + 6);
    ring(PARK.rx, PARK.ry, '#dcc79b');
    ring(PARK.rx - 17, PARK.ry - 15, '#a38a5e');
    ring(PARK.rx - 20, PARK.ry - 18, '#5ca83e');
    ring(40, 19, '#6b4a2b');
    ring(37, 16, '#7d5733');

    // Plaza with fountain
    if (images.plaza) {
        g.imageSmoothingEnabled = true;
        g.drawImage(images.plaza, PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h);
    } else {
        g.fillStyle = '#b8a888';
        g.fillRect(PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h);
        g.fillStyle = '#4488cc';
        g.beginPath(); g.arc(FOUNTAIN.x, FOUNTAIN.y, FOUNTAIN.r, 0, Math.PI * 2); g.fill();
    }
}

// ── Collision ─────────────────────────────────────────────────
function isBlocked(x, y) {
    const r = FEET_R;
    if (x < r + 4 || y < 110 || x > WORLD_W - r - 4 || y > WORLD_H - r - 4) return true;
    if (!onPath(x, y)) return true;
    if (Math.hypot(x - FOUNTAIN.x, y - FOUNTAIN.y) < FOUNTAIN.r + r) return true;
    if (inPond(x, y, r)) return true;
    for (const b of BUILDINGS) if (circleHitsRect(x, y, r, footprint(b))) return true;
    for (const t of state.trees) if (Math.hypot(x - t.x, y - (t.y - 4)) < 10 + r) return true;
    for (const b of state.bushes) if (Math.hypot(x - b.x, y - (b.y - 5)) < b.size * 0.35 + r) return true;
    for (const p of PROPS) if (Math.hypot(x - p.x, y - (p.y - 3)) < 8 + r) return true;
    for (const d of PARK_DECOR) {
        if (d.kind === 'bench' ? circleHitsRect(x, y, r, { x: d.x - 24, y: d.y - 12, w: 48, h: 10 })
            : Math.hypot(x - d.x, y - (d.y - 2)) < 4 + r) return true;
    }
    for (const n of state.npcs) if (Math.hypot(x - n.x, y - n.y) < 11 + r) return true;
    return false;
}

// ── Interaction targets ───────────────────────────────────────
function interactables() {
    const list = [];
    for (const b of BUILDINGS) {
        if (!b.id) continue;
        const fp = footprint(b);
        list.push({
            kind: 'building', id: b.id, ref: b,
            // distance from the player's feet to the building's front wall
            dist: (px, py) => py < fp.y + fp.h - 12 ? Infinity
                : Math.hypot(px - Math.max(fp.x + 10, Math.min(px, fp.x + fp.w - 10)), py - (fp.y + fp.h)),
        });
    }
    for (const p of PROPS) list.push({ kind: p.kind, id: p.id, ref: p, dist: (px, py) => Math.hypot(px - p.x, py - p.y) - 8 });
    for (const n of state.npcs) list.push({ kind: 'npc', id: null, ref: n, dist: (px, py) => Math.hypot(px - n.x, py - n.y) - 10 });
    return list;
}

function findNearest() {
    const p = state.player;
    let best = null, bestD = INTERACT_RANGE;
    for (const it of interactables()) {
        const d = it.dist(p.x, p.y);
        if (d < bestD) { best = it; bestD = d; }
    }
    return best;
}

function promptLabel(it) {
    const key = isTouch ? 'A' : 'SPACE';
    if (it.kind === 'npc') return `${key}: TALK`;
    if (it.kind === 'sign') return `${key}: READ SIGN`;
    return `${key}: ${SECTIONS[it.id]}`;
}

function interact(it) {
    if (!it) return;
    if (it.kind === 'npc') return talk(it.ref);
    if (it.kind === 'sign') return openHelp();
    openSection(it.id);
}

function talk(npc) {
    const p = state.player;
    // Face each other
    const dx = p.x - npc.x, dy = p.y - npc.y;
    npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    npc.bubble = npc.lines[npc.line % npc.lines.length];
    npc.line++;
    npc.bubbleUntil = state.time + 5;
}

// ── Tap-to-walk: route along the paths (BFS on a coarse grid) ──
const NAV = 8;
let nav = null;

function navOpen(c, r) {
    return c >= 0 && r >= 0 && c < nav.cols && r < nav.rows && nav.open[r * nav.cols + c] === 1;
}

function buildNav() {
    const cols = Math.ceil(WORLD_W / NAV), rows = Math.ceil(WORLD_H / NAV);
    nav = { cols, rows, open: new Uint8Array(cols * rows) };
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) nav.open[r * cols + c] = isBlocked(c * NAV + NAV / 2, r * NAV + NAV / 2) ? 0 : 1;
    }
}

// Is the straight line between two points clear? (for trimming the route)
function navClear(a, b) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
    for (let i = 1; i <= n; i++) {
        const x = a.x + (b.x - a.x) * i / n, y = a.y + (b.y - a.y) * i / n;
        if (!navOpen(Math.floor(x / NAV), Math.floor(y / NAV))) return false;
    }
    return true;
}

function findRoute(fx, fy, tx, ty) {
    if (!nav) buildNav();
    const { cols } = nav;
    // Goal: the open cell nearest to where they tapped (e.g. tapping grass walks to the path edge)
    const gc = Math.floor(tx / NAV), gr = Math.floor(ty / NAV);
    let goal = -1, best = Infinity;
    for (let r = gr - 30; r <= gr + 30; r++) {
        for (let c = gc - 30; c <= gc + 30; c++) {
            const d = (c - gc) ** 2 + (r - gr) ** 2;
            if (d < best && navOpen(c, r)) { best = d; goal = r * cols + c; }
        }
    }
    if (goal < 0) return null;
    const start = Math.floor(fy / NAV) * cols + Math.floor(fx / NAV);
    const prev = new Int32Array(nav.cols * nav.rows).fill(-1);
    prev[start] = start;
    const queue = [start];
    for (let qi = 0; qi < queue.length && prev[goal] < 0; qi++) {
        const cur = queue[qi], c = cur % cols, r = (cur - c) / cols;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const nc = c + dc, nr = r + dr, ni = nr * cols + nc;
            if (!navOpen(nc, nr) || prev[ni] >= 0) continue;
            if (dc && dr && !(navOpen(c + dc, r) && navOpen(c, r + dr))) continue;
            prev[ni] = cur;
            queue.push(ni);
        }
    }
    if (prev[goal] < 0) return null;
    const cells = [];
    for (let i = goal; i !== start; i = prev[i]) cells.push({ x: (i % cols) * NAV + NAV / 2, y: Math.floor(i / cols) * NAV + NAV / 2 });
    cells.reverse();
    if (best === 0 && !isBlocked(tx, ty)) cells[cells.length - 1] = { x: tx, y: ty };
    // Keep only the corners: skip ahead to the furthest point we can see
    const route = [];
    let from = { x: fx, y: fy };
    for (let i = 0; i < cells.length;) {
        let j = cells.length - 1;
        while (j > i && !navClear(from, cells[j])) j--;
        route.push(cells[j]);
        from = cells[j];
        i = j + 1;
    }
    return route.length ? route : [{ x: fx, y: fy }];
}

function walkTo(x, y, then = null) {
    const p = state.player;
    const path = findRoute(p.x, p.y, x, y);
    if (!path) return;
    const end = path[path.length - 1];
    state.moveTarget = { x: end.x, y: end.y, path, then };
    state.stuckTime = 0;
}

// ── Player update ─────────────────────────────────────────────
function updatePlayer(dt) {
    const p = state.player;
    const k = { ...state.keys, ...state.touchKeys };
    let vx = 0, vy = 0;
    if (k.w || k.arrowup || k.up) vy -= 1;
    if (k.s || k.arrowdown || k.down) vy += 1;
    if (k.a || k.arrowleft || k.left) vx -= 1;
    if (k.d || k.arrowright || k.right) vx += 1;

    if (vx || vy) {
        state.moveTarget = null;
    } else if (state.moveTarget) {
        const route = state.moveTarget.path;
        if (route.length > 1 && Math.hypot(route[0].x - p.x, route[0].y - p.y) < 6) route.shift();
        const dx = route[0].x - p.x, dy = route[0].y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 4 && route.length === 1) {
            const then = state.moveTarget.then;
            state.moveTarget = null;
            if (then && then.dist(p.x, p.y) < INTERACT_RANGE + 6) interact(then);
        } else if (d >= 1) { vx = dx / d; vy = dy / d; }
    }

    const len = Math.hypot(vx, vy);
    p.moving = len > 0;
    if (p.moving) {
        vx /= len; vy /= len;
        if (Math.abs(vx) > Math.abs(vy) + 0.01) p.dir = vx > 0 ? 'right' : 'left';
        else p.dir = vy > 0 ? 'down' : 'up';

        const step = PLAYER_SPEED * dt;
        const ox = p.x, oy = p.y;
        if (!isBlocked(p.x + vx * step, p.y)) p.x += vx * step;
        if (!isBlocked(p.x, p.y + vy * step)) p.y += vy * step;
        p.walkT += dt;

        // Give up on a tap-to-walk target if we're stuck against something
        if (state.moveTarget) {
            const moved = Math.hypot(p.x - ox, p.y - oy);
            state.stuckTime = moved < step * 0.2 ? state.stuckTime + dt : 0;
            if (state.stuckTime > 0.25) {
                const then = state.moveTarget.then;
                state.moveTarget = null;
                state.stuckTime = 0;
                if (then && then.dist(p.x, p.y) < INTERACT_RANGE + 20) interact(then);
            }
        }
    } else {
        p.walkT = 0;
    }

    const nearest = findNearest();
    if (nearest?.ref !== state.nearest?.ref) {
        state.nearest = nearest;
        const prompt = document.getElementById('interaction-prompt');
        if (nearest) {
            prompt.querySelector('.pixel-text').textContent = promptLabel(nearest);
            prompt.classList.remove('hidden');
        } else {
            prompt.classList.add('hidden');
        }
    }
}

function updateCamera(dt) {
    const p = state.player, cam = state.camera;
    const clampAxis = (target, viewSize, worldSize) =>
        viewSize >= worldSize ? (worldSize - viewSize) / 2 : Math.max(0, Math.min(target, worldSize - viewSize));
    const tx = clampAxis(p.x - view.w / 2, view.w, WORLD_W);
    // On the top street, look up a little so the tall buildings' roofs and signs show
    const lookUp = Math.min(110, Math.max(0, 520 - p.y) * 0.5);
    const ty = WORLD_TOP + clampAxis(p.y - CHAR_H / 2 - view.h / 2 - lookUp - WORLD_TOP, view.h, WORLD_H - WORLD_TOP);
    const a = dt ? 1 - Math.pow(0.0005, dt) : 1;   // frame-rate independent smoothing
    cam.x += (tx - cam.x) * a;
    cam.y += (ty - cam.y) * a;
}

// ── Rendering ─────────────────────────────────────────────────
function drawSprite(name, cx, baseY, w, flip = false, h = null) {
    const img = images[name];
    if (!img) return;
    const dh = h ?? w * img.height / img.width;
    const dw = h ? h * img.width / img.height : w;
    if (flip) {
        ctx.save();
        ctx.translate(cx, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -dw / 2, baseY - dh, dw, dh);
        ctx.restore();
    } else {
        ctx.drawImage(img, cx - dw / 2, baseY - dh, dw, dh);
    }
}

function shadow(x, y, rx, ry, alpha = 0.22) {
    ctx.fillStyle = `rgba(20, 40, 10, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawCharacter(c, walking) {
    const pose = CHAR_POSES[`${c.sex}_${c.type}`];
    let col = pose.down, flip = false;
    if (c.dir === 'up') col = pose.up;
    if (c.dir === 'left' || c.dir === 'right') {
        col = pose.side;
        flip = c.dir !== pose.sideFaces;
    }
    const name = `char_${c.sex}_${c.type}_${col}`;
    shadow(c.x, c.y, 13, 4.5);

    ctx.save();
    ctx.translate(c.x, c.y);
    if (walking) {
        const t = c.walkT * 11;
        ctx.translate(0, -Math.abs(Math.sin(t)) * 3);
        ctx.rotate(Math.sin(t) * 0.07);
    } else {
        // gentle idle breathing
        ctx.scale(1, 1 + Math.sin(state.time * 2.4 + c.x) * 0.012);
    }
    if (images[name]) drawSprite(name, 0, 0, null, flip, CHAR_H);
    else { ctx.fillStyle = '#d35400'; ctx.fillRect(-10, -CHAR_H, 20, CHAR_H); }
    ctx.restore();
}

function drawBench(d) {
    shadow(d.x, d.y - 1, 26, 4);
    drawSprite('bench', d.x, d.y, 54);
}

function drawLamp(d) {
    const x = Math.round(d.x), y = Math.round(d.y);
    shadow(x, y, 7, 3);
    ctx.fillStyle = 'rgba(255, 228, 140, 0.22)';
    ctx.beginPath(); ctx.arc(x, y - 47, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f2a28'; ctx.fillRect(x - 5, y - 5, 10, 5);             // base
    ctx.fillStyle = '#2f3d3a'; ctx.fillRect(x - 2, y - 42, 4, 38);            // post
    ctx.fillStyle = '#5b7570'; ctx.fillRect(x - 1, y - 42, 1, 38);
    ctx.fillStyle = '#1f2a28'; ctx.fillRect(x - 6, y - 44, 12, 3);            // lantern
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x - 4, y - 52, 8, 8);
    ctx.fillStyle = '#fff8dc'; ctx.fillRect(x - 3, y - 51, 3, 4);
    ctx.fillStyle = '#1f2a28';
    ctx.fillRect(x - 5, y - 53, 1, 10); ctx.fillRect(x + 4, y - 53, 1, 10); ctx.fillRect(x - 1, y - 52, 2, 8);
    ctx.fillRect(x - 6, y - 56, 12, 3); ctx.fillRect(x - 2, y - 59, 4, 3);
}

function drawSignpost(p) {
    const x = Math.round(p.x), y = Math.round(p.y);
    shadow(x, y, 12, 4);
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 2, y - 22, 4, 22);
    ctx.fillStyle = '#4a2e12'; ctx.fillRect(x - 17, y - 38, 34, 19);
    ctx.fillStyle = '#b07a3f'; ctx.fillRect(x - 16, y - 37, 32, 17);
    ctx.fillStyle = '#4a2e12';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y - 28);
}

function drawLabel(text, cx, y, active, visited) {
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = visited ? `${text} ✓` : text;
    const w = ctx.measureText(label).width + 14;
    const bob = active ? Math.sin(state.time * 6) * 2 - 2 : 0;
    const top = y + bob;
    ctx.fillStyle = active ? '#d35400' : '#6d4621';
    ctx.fillRect(cx - w / 2 - 2, top - 2, w + 4, 19);
    ctx.fillStyle = active ? '#fff3e0' : '#fffcf5';
    ctx.fillRect(cx - w / 2, top, w, 15);
    ctx.fillStyle = active ? '#d35400' : '#4a3c31';
    ctx.fillText(label, cx, top + 8);
    if (active) {
        ctx.beginPath();
        ctx.moveTo(cx - 5, top + 19); ctx.lineTo(cx + 5, top + 19); ctx.lineTo(cx, top + 25);
        ctx.fill();
    }
}

function wrapText(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
        else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

function drawBubble(npc) {
    ctx.font = '13px VT323, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const lines = wrapText(npc.bubble, 150);
    const lh = 12, pad = 6;
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2;
    const h = lines.length * lh + pad * 2 - 2;
    let x = npc.x - w / 2;
    x = Math.max(state.camera.x + 4, Math.min(x, state.camera.x + view.w - w - 4));
    const y = npc.y - CHAR_H - h - 12;
    ctx.fillStyle = '#4a3c31';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#fffcf5';
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(npc.x - 5, y + h); ctx.lineTo(npc.x + 5, y + h); ctx.lineTo(npc.x, y + h + 7);
    ctx.fill();
    ctx.fillStyle = '#4a3c31';
    lines.forEach((l, i) => ctx.fillText(l, x + pad, y + pad + i * lh - 1));
}

function visible(x, y, w, h) {
    const c = state.camera;
    return x + w > c.x && x < c.x + view.w && y + h > c.y && y < c.y + view.h;
}

function render() {
    const s = view.scale * view.dpr;
    const cam = state.camera;
    // Snap the camera to whole device pixels to avoid shimmering
    const camX = Math.round(cam.x * s) / s, camY = Math.round(cam.y * s) / s;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3f7f2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s);

    ctx.imageSmoothingEnabled = false;
    if (ground) ctx.drawImage(ground, 0, WORLD_TOP);
    drawPondLife();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fountain spray (subtle animated sparkle over the basin)
    ctx.fillStyle = 'rgba(220, 245, 255, 0.85)';
    for (let i = 0; i < 10; i++) {
        const a = state.time * 1.7 + i * 0.63;
        const r = 14 + (i % 3) * 8;
        ctx.fillRect(FOUNTAIN.x + Math.cos(a) * r, FOUNTAIN.y - 4 + Math.sin(a) * r * 0.6, 2, 2);
    }

    // Flowers (flat, no sorting needed)
    for (const f of state.flowers) {
        if (!visible(f.x - 10, f.y - 20, 20, 20)) continue;
        drawSprite(f.sprite, f.x, f.y, f.size);
    }

    // Y-sorted entities
    const ents = [];
    for (const b of BUILDINGS) {
        const { w, h } = buildingSize(b);
        if (visible(b.x - w / 2, b.y - h, w, h + 10)) ents.push({ y: b.y, draw: () => drawSprite(b.sprite, b.x, b.y, b.w) });
    }
    for (const t of state.trees) {
        if (visible(t.x - t.size / 2, t.y - t.size * 1.2, t.size, t.size * 1.2)) {
            ents.push({ y: t.y, draw: () => { shadow(t.x, t.y - 2, t.size * 0.28, 6); drawSprite(t.sprite, t.x, t.y, t.size); } });
        }
    }
    for (const b of state.bushes) {
        if (visible(b.x - 25, b.y - 30, 50, 30)) ents.push({ y: b.y, draw: () => { shadow(b.x, b.y - 2, b.size * 0.45, 4); drawSprite(b.sprite, b.x, b.y, b.size); } });
    }
    for (const p of PROPS) ents.push({ y: p.y, draw: () => drawSignpost(p) });
    const sd = shoreDuck();
    if (visible(sd.x - 20, sd.y - 30, 40, 34)) ents.push({ y: sd.y, draw: () => drawDuck(DUCK, sd.x, sd.y, sd.flip, true) });
    for (const d of PARK_DECOR) {
        if (visible(d.x - 30, d.y - 60, 60, 64)) ents.push({ y: d.y, draw: () => (d.kind === 'bench' ? drawBench(d) : drawLamp(d)) });
    }
    for (const n of state.npcs) ents.push({ y: n.y, draw: () => drawCharacter(n, false) });
    const p = state.player;
    ents.push({ y: p.y, draw: () => drawCharacter(p, p.moving) });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw();

    // Tap-to-walk marker
    if (state.moveTarget) {
        const t = state.moveTarget;
        ctx.strokeStyle = 'rgba(255, 252, 245, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, 9 + Math.sin(state.time * 8) * 2, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Labels above everything
    const near = state.nearest;
    for (const b of BUILDINGS) {
        if (!b.id) continue;
        const { h } = buildingSize(b);
        // keep the sign on screen (below the HUD) when the roof is cut off
        const top = Math.min(Math.max(b.y - h - 22, state.camera.y + 56 / view.scale), b.y - 40);
        drawLabel(SECTIONS[b.id], b.x, top, near?.ref === b, state.visited.has(b.id));
    }
    for (const n of state.npcs) {
        if (n.bubble && state.time < n.bubbleUntil) drawBubble(n);
        else if (near?.ref === n) {
            ctx.fillStyle = '#d35400';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('…', n.x, n.y - CHAR_H - 8 + Math.sin(state.time * 6) * 2);
        }
    }
}

// ── Main loop ─────────────────────────────────────────────────
let lastTs = 0;
function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000 || 0, 0.05);
    lastTs = ts;
    state.time += dt;
    if (state.phase === 'playing') {
        if (state.inside) {
            renderInterior();
        } else {
            if (!state.modalOpen) updatePlayer(dt);
            updateCamera(dt);
            render();
        }
    }
    requestAnimationFrame(loop);
}

// ── Modal content ─────────────────────────────────────────────
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function link(url, text) {
    return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text ?? url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`;
}

const list = items => `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;

function sectionHtml(id) {
    const d = data;
    switch (id) {
        case 'about':
            return `<p class="entry-title">${esc(d.personal.name)}</p>
                <p class="meta">${esc(d.personal.title)} · ${esc(d.personal.location)}</p>
                <p>${esc(d.summary)}</p>
                <p>${link(d.personal.portfolio, 'Portfolio')} · ${link(d.personal.github, 'GitHub')} · ${link(d.personal.linkedin, 'LinkedIn')}</p>`;
        case 'education':
            return d.education.map(e => `<div class="entry">
                <p class="entry-title">${esc(e.degree)}</p>
                <p class="meta">${esc(e.institution)} · ${esc(e.duration)}</p>
                ${list(e.highlights)}</div>`).join('');
        case 'experience':
            return d.experience.map(e => `<div class="entry">
                <p class="entry-title">${esc(e.title)}</p>
                <p class="meta">${esc(e.company)}<br>${esc(e.duration)}</p>
                ${list(e.description)}
                ${e.tech ? `<p class="meta">Tech: ${esc(e.tech)}</p>` : ''}</div>`).join('');
        case 'projects':
            return d.projects.map(p => `<div class="entry">
                <p class="entry-title">${esc(p.name)}</p>
                <p class="meta">${esc(p.tech)}${p.link ? ` · ${link(p.link, 'code')}` : ''}</p>
                ${list(p.highlights)}</div>`).join('');
        case 'achievements':
            return d.achievements.map(a => `<div class="entry">
                <p class="entry-title">🏆 ${esc(a.title)}</p>
                <p class="meta">${esc(a.date)}</p>
                <p>${esc(a.detail)}</p></div>`).join('');
        case 'skills':
            return Object.entries(d.skills).map(([group, items]) => `<div class="skill-group">
                <p class="meta">${esc(group)}</p>
                <div>${items.map(s => `<span class="skill-tag">${esc(s)}</span>`).join('')}</div></div>`).join('');
        case 'leadership':
            return d.leadership.map(l => `<div class="entry">
                <p class="entry-title">${esc(l.role)}</p>
                <p class="meta">${esc(l.org)} · ${esc(l.duration)}</p>
                <p>${esc(l.detail)}</p></div>`).join('');
        case 'contact':
            return `<p>Thanks for stopping by! The quickest way to reach me:</p>
                <ul>
                    <li>Email: <a href="mailto:${esc(d.personal.email)}">${esc(d.personal.email)}</a></li>
                    <li>LinkedIn: ${link(d.personal.linkedin)}</li>
                    <li>GitHub: ${link(d.personal.github)}</li>
                    <li>Portfolio: ${link(d.personal.portfolio)}</li>
                    <li>Based in ${esc(d.personal.location)}</li>
                </ul>`;
    }
    return '';
}

let lastFocus = null;
function showModal(title, html, interior = false) {
    if (!state.modalOpen) lastFocus = document.activeElement;
    state.modalOpen = true;
    state.keys = {};
    state.touchKeys = {};
    state.moveTarget = null;
    document.querySelectorAll('.pressed').forEach(el => el.classList.remove('pressed'));
    document.getElementById('modal-title').textContent = title;
    const body = document.getElementById('modal-content');
    body.innerHTML = html;
    body.scrollTop = 0;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.toggle('interior', interior);
    overlay.classList.remove('hidden');
    document.getElementById('modal-close').setAttribute('aria-label', interior ? 'Leave building' : 'Close');
    document.getElementById('modal-close').focus();
}

function closeModal() {
    if (!state.modalOpen || state.transitioning) return;
    if (state.inside) return exitBuilding();
    state.modalOpen = false;
    document.getElementById('modal-overlay').classList.add('hidden');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    checkAllVisited();
}

function openSection(id) {
    state.visited.add(id);
    updateVisited();
    if (window.Interiors?.has(id)) return enterBuilding(id);
    showModal(SECTIONS[id], sectionHtml(id));
}

// ── Building interiors ────────────────────────────────────────
const roomCanvas = document.createElement('canvas');
const roomCtx = roomCanvas.getContext('2d');

// Fade to black, swap scenes, fade back in.
function fadeThrough(midway) {
    const fade = document.getElementById('fade');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.transitioning = true;
    fade.classList.add('on');
    setTimeout(() => {
        midway();
        fade.classList.remove('on');
        state.transitioning = false;
    }, reduce ? 0 : 230);
}

function enterBuilding(id) {
    if (state.transitioning) return;
    state.keys = {};
    state.touchKeys = {};
    state.moveTarget = null;
    fadeThrough(() => {
        state.inside = id;
        document.getElementById('game-container').classList.add('inside');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('interaction-prompt').classList.add('hidden');
        document.getElementById('toast').classList.add('hidden');
        const html = `<p class="room-name">📍 ${esc(Interiors.name(id))}</p>${sectionHtml(id)}
            <button class="pixel-btn exit-btn" data-exit>🚪 BACK TO TOWN</button>`;
        showModal(SECTIONS[id], html, true);
    });
}

function exitBuilding() {
    const id = state.inside;
    fadeThrough(() => {
        state.inside = null;
        state.modalOpen = false;
        document.getElementById('game-container').classList.remove('inside');
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        // Step out of the front door
        const b = BUILDINGS.find(b => b.id === id);
        if (b) Object.assign(state.player, { x: b.x, y: b.y + 18, dir: 'down' });
        state.nearest = null;
        updateCamera(0);
        if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
        checkAllVisited();
    });
}

function renderInterior() {
    const rw = Interiors.WIDTH, rh = Interiors.HEIGHT;
    if (roomCanvas.width !== rw) { roomCanvas.width = rw; roomCanvas.height = rh; }
    Interiors.draw(roomCtx, state.inside, state.time);

    const cw = canvas.width, ch = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = Interiors.background(state.inside);
    ctx.fillRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;
    if (cw / ch < 1.1) {
        // Portrait: show the whole room across the top, panel sits below it
        const s = cw / rw;
        ctx.drawImage(roomCanvas, 0, 0, rw * s, rh * s);
    } else {
        // Landscape: fill the screen, panel docks on the right
        const s = Math.max(cw / rw, ch / rh);
        ctx.drawImage(roomCanvas, (cw - rw * s) / 2, (ch - rh * s) / 2, rw * s, rh * s);
    }
}

function openQuickView() {
    const order = ['about', 'experience', 'projects', 'achievements', 'skills', 'education', 'leadership', 'contact'];
    const html = order.map(id => `<h3>${esc(SECTIONS[id])}</h3>${sectionHtml(id)}`).join('');
    showModal('KAVERI SHARMA · RESUME', html);
}

function openHelp() {
    const where = {
        about: 'the cottage (by the fountain)', education: 'the university (north-west)',
        experience: 'the glass office', projects: 'the tech lab', skills: 'the library',
        achievements: 'the town hall (east, on the main avenue)', leadership: 'the café (north-east)', contact: 'the post office',
    };
    const controls = isTouch
        ? `<li>Use the pad, or tap anywhere to walk there</li><li>Tap a building to open it, or press <span class="kbd">A</span> next to it</li>`
        : `<li><span class="kbd">WASD</span> / <span class="kbd">← ↑ → ↓</span> to walk, or click to walk somewhere</li>
           <li><span class="kbd">SPACE</span> / <span class="kbd">ENTER</span> next to a building to go in (or just click it)</li>
           <li><span class="kbd">ESC</span> closes a window · <span class="kbd">Q</span> quick view</li>`;
    const sections = Object.keys(SECTIONS).map(id =>
        `<li><a href="#" data-open="${id}">${esc(SECTIONS[id])}</a>: ${esc(where[id])}</li>`).join('');
    showModal('HOW TO PLAY', `<p>Welcome to my town! Every building holds part of my resume. Talk to the locals, too.</p>
        <h3>CONTROLS</h3><ul>${controls}</ul>
        <h3>WHERE THINGS ARE</h3><ul>${sections}</ul>
        <p>In a hurry? <a href="#" data-open="quick">Read the whole resume on one page →</a></p>`);
}

// ── HUD ───────────────────────────────────────────────────────
function updateVisited() {
    const total = Object.keys(SECTIONS).length;
    const el = document.getElementById('visited');
    el.querySelector('.pixel-text').textContent = `${state.visited.size}/${total} VISITED`;
    el.classList.toggle('done', state.visited.size === total);
}

function checkAllVisited() {
    if (state.allVisitedShown || state.visited.size < Object.keys(SECTIONS).length) return;
    state.allVisitedShown = true;
    toast("🎉 You've explored the whole town. Thanks for visiting!", 5000);
}

let toastTimer = null;
function toast(msg, ms = 4000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

// ── Input ─────────────────────────────────────────────────────
const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

function screenToWorld(e) {
    const r = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - r.left) / view.scale + state.camera.x,
        y: (e.clientY - r.top) / view.scale + state.camera.y,
    };
}

// What did the player click on? Buildings and props open directly.
function hitTest(wx, wy) {
    for (const n of state.npcs) {
        if (Math.abs(wx - n.x) < 14 && wy < n.y + 4 && wy > n.y - CHAR_H) {
            return interactables().find(it => it.ref === n);
        }
    }
    for (const p of PROPS) {
        if (Math.abs(wx - p.x) < 18 && wy < p.y + 6 && wy > p.y - 44) return interactables().find(it => it.ref === p);
    }
    for (const b of BUILDINGS) {
        if (!b.id) continue;
        const { w, h } = buildingSize(b);
        const labelTop = b.y - h - 26;
        if (wx > b.x - w / 2 && wx < b.x + w / 2 && wy > labelTop && wy < b.y) {
            return interactables().find(it => it.ref === b);
        }
    }
    return null;
}

function setupInput() {
    document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        if (state.modalOpen) {
            if (key === 'escape') { e.preventDefault(); closeModal(); }
            return;
        }
        if (state.phase !== 'playing' || e.metaKey || e.ctrlKey || e.altKey) return;
        if (MOVE_KEYS.includes(key) || key === ' ' || key === 'enter') e.preventDefault();
        if (MOVE_KEYS.includes(key)) state.keys[key] = true;
        if ((key === ' ' || key === 'enter') && !e.repeat) interact(state.nearest);
        if (key === 'q' && !e.repeat) openQuickView();
        if ((key === '?' || key === 'h') && !e.repeat) openHelp();
    });
    document.addEventListener('keyup', e => { state.keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { state.keys = {}; state.touchKeys = {}; });

    // Click / tap on the world
    canvas.addEventListener('pointerdown', e => {
        if (state.phase !== 'playing' || state.modalOpen) return;
        const { x, y } = screenToWorld(e);
        const hit = hitTest(x, y);
        if (hit) {
            // Close enough? interact now. Otherwise just open it (buildings) or walk over (NPCs).
            if (hit.dist(state.player.x, state.player.y) < INTERACT_RANGE || hit.kind !== 'npc') return interact(hit);
            return walkTo(hit.ref.x, hit.ref.y + 22, hit);
        }
        walkTo(x, y);
    });

    // On-screen pad (pointer events so it works with touch and mouse)
    document.querySelectorAll('.dpad-btn, .action-btn').forEach(btn => {
        const key = btn.dataset.key;
        const up = () => { state.touchKeys[key] = false; btn.classList.remove('pressed'); };
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
            btn.setPointerCapture?.(e.pointerId);
            btn.classList.add('pressed');
            if (key === 'space') { if (!state.modalOpen) interact(state.nearest); }
            else state.touchKeys[key] = true;
        });
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('lostpointercapture', up);
        btn.addEventListener('contextmenu', e => e.preventDefault());
    });

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', e => {
        // Clicking the room itself shouldn't kick you out of a building
        if (e.target.id === 'modal-overlay' && !state.inside) closeModal();
    });
    // Links inside the help window that jump to a section
    document.getElementById('modal-content').addEventListener('click', e => {
        if (e.target.closest('[data-exit]')) return closeModal();
        const a = e.target.closest('[data-open]');
        if (!a) return;
        e.preventDefault();
        const id = a.dataset.open;
        if (id === 'quick') return openQuickView();
        if (window.Interiors?.has(id)) {
            // Leave the help window first, then walk in
            state.modalOpen = false;
            document.getElementById('modal-overlay').classList.add('hidden');
        }
        openSection(id);
    });
    document.getElementById('quick-btn').addEventListener('click', openQuickView);
    document.getElementById('help-btn').addEventListener('click', openHelp);
    window.addEventListener('resize', resize);
}

// ── Character select ──────────────────────────────────────────
function buildSelectScreen() {
    const grid = document.getElementById('char-grid');
    for (const sex of ['female', 'male']) {
        for (const type of CHAR_TYPES) {
            const btn = document.createElement('button');
            btn.className = 'char-card';
            btn.innerHTML = `<img src="assets/sprites/portrait_${sex}_${type}.png" alt="">${CHAR_NAMES[type]}`;
            btn.setAttribute('aria-label', `Play as the ${sex} ${CHAR_NAMES[type].toLowerCase()}`);
            btn.addEventListener('click', () => startGame(sex, type));
            grid.appendChild(btn);
        }
    }
    document.getElementById('skip-btn').addEventListener('click', () => {
        startGame('female', 'player');
        openQuickView();
    });
}

function startGame(sex, type) {
    Object.assign(state.player, { sex, type, x: PLAYER_START.x, y: PLAYER_START.y, dir: 'up' });
    createNpcs();
    document.getElementById('select-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    state.phase = 'playing';
    resize();
    updateCamera(0);
    updateVisited();
    toast(isTouch
        ? 'Use the pad or tap to walk. Tap a building to step inside!'
        : 'Walk with WASD / arrows (or click). Press SPACE at a door, or just click a building!', 6000);
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
    if (!data) {
        document.querySelector('#loading-screen .pixel-text').textContent = 'COULD NOT LOAD RESUME DATA';
        return;
    }
    const fontsReady = document.fonts
        ? Promise.race([
            Promise.all([document.fonts.load('10px "Press Start 2P"'), document.fonts.load('16px VT323')]),
            new Promise(r => setTimeout(r, 2500)),
        ])
        : Promise.resolve();
    await Promise.all([Promise.all(spriteList().map(loadImage)), fontsReady]);

    buildScene();
    renderGround();
    setupInput();
    buildSelectScreen();
    resize();

    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('select-screen').classList.remove('hidden');
    state.phase = 'select';
    requestAnimationFrame(loop);
}

init();
