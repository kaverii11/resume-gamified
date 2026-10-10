// ============================================================
//  BUILDING INTERIORS — hand-drawn pixel rooms (320x180 canvas)
// ============================================================
//  Each room is drawn in code every frame so it can animate (fire, screens,
//  steam...). The most interesting part of each room sits in the left ~55%,
//  because on desktop the resume panel covers the right side.

(() => {
    const W = 320, H = 180, FY = 112;   // FY = where the back wall meets the floor
    let g = null;                       // 2D context of the room canvas
    let t = 0;                          // time in seconds

    // ── Drawing helpers ───────────────────────────────────────
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

    function rngOf(seed) {
        return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    }

    // Stable pseudo-random 0..1 for an integer key (for blinking lights etc.)
    const hash = n => (((Math.imul(n | 0, 2654435761) >>> 0) % 1000) / 1000);

    function glow(x, y, r, rgb, a) {
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${rgb},${a})`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = gr;
        g.fillRect(x - r, y - r, r * 2, r * 2);
        g.globalCompositeOperation = 'source-over';
    }

    function text(s, x, y, c, align = 'left') {
        g.font = '8px "Press Start 2P", monospace';
        g.fillStyle = c;
        g.textAlign = align;
        g.textBaseline = 'top';
        g.fillText(s, Math.round(x), Math.round(y));
    }

    function line(x1, y1, x2, y2, c, w = 1) {
        g.strokeStyle = c;
        g.lineWidth = w;
        g.beginPath();
        g.moveTo(x1 + 0.5, y1 + 0.5);
        g.lineTo(x2 + 0.5, y2 + 0.5);
        g.stroke();
    }

    function circle(x, y, r, c) {
        g.fillStyle = c;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
    }

    function poly(points, c) {
        g.fillStyle = c;
        g.beginPath();
        points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath();
        g.fill();
    }

    function planks(y0, light, dark, seam, h = 8) {
        for (let y = y0, row = 0; y < H; y += h, row++) {
            R(0, y, W, h, row % 2 ? light : dark);
            R(0, y + h - 1, W, 1, seam);
            const off = (row * 29) % 52;
            for (let x = -off; x < W; x += 52) R(x, y, 1, h - 1, seam);
        }
    }

    function books(x, y, w, h, rng, palette) {
        let cx = x;
        while (cx < x + w - 2) {
            const bw = 2 + Math.floor(rng() * 3);
            if (cx + bw > x + w) break;
            if (rng() < 0.07) { cx += 3; continue; }
            const bh = h - Math.floor(rng() * 4);
            const c = palette[Math.floor(rng() * palette.length)];
            R(cx, y + h - bh, bw, bh, c);
            R(cx, y + h - bh + 2, bw, 1, 'rgba(255,255,255,0.22)');
            R(cx + bw - 1, y + h - bh, 1, bh, 'rgba(0,0,0,0.25)');
            cx += bw;
        }
    }

    function bookshelf(x, y, w, h, rows, wood, back, rng, palette) {
        R(x, y, w, h, back);
        R(x, y, w, 3, wood);
        R(x, y, 3, h, wood);
        R(x + w - 3, y, 3, h, wood);
        const rh = (h - 3) / rows;
        for (let i = 0; i < rows; i++) {
            const top = Math.round(y + 3 + i * rh);
            const bottom = Math.round(y + 3 + (i + 1) * rh);
            books(x + 4, top + 1, w - 8, bottom - top - 4, rng, palette);
            R(x, bottom - 3, w, 3, wood);
            R(x, bottom - 1, w, 1, 'rgba(0,0,0,0.3)');
        }
    }

    function steam(x, y, phase = 0) {
        for (let i = 0; i < 3; i++) {
            const k = ((t * 0.8 + i / 3 + phase) % 1);
            const sx = x + Math.sin(k * 6 + i) * 2;
            const sy = y - k * 14;
            g.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`;
            g.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        }
    }

    function flame(x, y, w, h, i) {
        const f = h * (0.75 + 0.25 * Math.sin(t * 11 + i * 1.9) + 0.12 * Math.sin(t * 23 + i));
        poly([[x, y], [x + w / 2 + Math.sin(t * 7 + i) * 1.5, y - f], [x + w, y]], '#ff7b1c');
        poly([[x + w * 0.2, y], [x + w / 2 + Math.sin(t * 9 + i) * 1, y - f * 0.65], [x + w * 0.8, y]], '#ffc23a');
        poly([[x + w * 0.35, y], [x + w / 2, y - f * 0.3], [x + w * 0.65, y]], '#fff2a8');
    }

    function candle(x, y) {
        R(x, y, 3, 7, '#f3ead2');
        R(x + 2, y, 1, 7, '#d8ccb0');
        const fl = 2 + Math.sin(t * 12 + x) * 0.6;
        R(x + 1, y - 1 - fl, 1, fl, '#ffc23a');
        glow(x + 1.5, y - 2, 10, '255,190,90', 0.35);
    }

    function plant(x, y, big = false) {
        const s = big ? 1.5 : 1;
        R(x - 5 * s, y - 9 * s, 10 * s, 9 * s, '#b5653a');
        R(x - 6 * s, y - 10 * s, 12 * s, 2 * s, '#c8794a');
        const sway = Math.sin(t * 1.5 + x) * 0.8;
        for (const [dx, dy, r] of [[-5, -16, 5], [5, -17, 5], [0, -22, 6], [-8, -22, 4], [7, -24, 4]]) {
            circle(x + (dx + sway) * s, y + dy * s, r * s, '#3f8f3a');
            circle(x + (dx + sway - 1) * s, y + (dy - 1) * s, r * s * 0.55, '#5bb14d');
        }
    }

    function motes(x0, y0, w, h, n, rgb) {
        for (let i = 0; i < n; i++) {
            const k = (t * 0.05 + hash(i * 7 + 1)) % 1;
            const x = x0 + hash(i * 13 + 5) * w + Math.sin(t * 0.7 + i) * 4;
            const y = y0 + h - k * h;
            g.fillStyle = `rgba(${rgb},${0.6 * Math.sin(k * Math.PI)})`;
            g.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
    }

    function vignette(a = 0.45) {
        const gr = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 200);
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        gr.addColorStop(1, `rgba(0,0,0,${a})`);
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
    }

    function chair(x, y, seat, back) {           // simple wooden chair, seen from the front
        R(x, y - 14, 12, 3, back);
        R(x + 1, y - 11, 2, 7, back);
        R(x + 9, y - 11, 2, 7, back);
        R(x - 1, y - 4, 14, 3, seat);
        R(x, y - 1, 2, 9, back);
        R(x + 10, y - 1, 2, 9, back);
    }

    // ── 🧪 Tech lab (Projects) ────────────────────────────────
    function lab() {
        // Walls: dark panels with rivets
        R(0, 0, W, FY, '#0e1430');
        for (let x = 0; x < W; x += 32) R(x, 0, 1, FY, '#1a2448');
        R(0, 40, W, 1, '#1a2448');
        R(0, 78, W, 1, '#1a2448');
        for (let x = 3; x < W; x += 32) for (const y of [6, 44, 82]) { R(x, y, 1, 1, '#2d3b6c'); R(x + 26, y, 1, 1, '#2d3b6c'); }
        // Ceiling neon strip
        R(0, 0, W, 3, '#070b1c');
        R(0, 3, W, 1, '#29e6ff');
        g.globalCompositeOperation = 'lighter';
        const cg = g.createLinearGradient(0, 4, 0, 26);
        cg.addColorStop(0, 'rgba(41,230,255,0.22)');
        cg.addColorStop(1, 'rgba(41,230,255,0)');
        g.fillStyle = cg;
        g.fillRect(0, 4, W, 22);
        g.globalCompositeOperation = 'source-over';

        // Floor: metal tiles with a travelling light pulse
        R(0, FY, W, H - FY, '#11172b');
        for (let y = FY + 9; y < H; y += 10) R(0, y, W, 1, '#1b2442');
        for (let x = 0; x < W; x += 24) R(x, FY, 1, H - FY, '#1b2442');
        R(0, FY, W, 2, '#29e6ff');
        for (let i = 0; i < 2; i++) {
            const px = ((t * 90 + i * 170) % (W + 60)) - 30;
            R(px, FY + 29 + i * 20, 18, 1, '#29e6ff');
            glow(px + 9, FY + 29 + i * 20, 10, '41,230,255', 0.25);
        }

        // HERO: big wall screen showing CityOS routing
        R(12, 10, 150, 86, '#2a3354');
        R(14, 12, 146, 82, '#050b1a');
        text('CITYOS', 18, 15, '#29e6ff');
        text('4064X', 116, 15, '#ff4fd8');
        // street grid
        const mx = 18, my = 28, mw = 92, mh = 62;
        for (let x = mx; x <= mx + mw; x += 9) R(x, my, 1, mh, '#10302a');
        for (let y = my; y <= my + mh; y += 8) R(mx, y, mw, 1, '#10302a');
        // facilities and an animated optimal route
        const route = [[22, 84], [40, 84], [40, 60], [67, 60], [67, 44], [94, 44], [94, 32], [106, 32]];
        const seg = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
        const total = seg.reduce((a, b) => a + b, 0);
        let left = ((t * 30) % (total + 30));
        for (let i = 0; i < seg.length; i++) {
            const [ax, ay] = route[i], [bx, by] = route[i + 1];
            const k = Math.max(0, Math.min(1, left / seg[i]));
            if (k > 0) line(ax, ay, ax + (bx - ax) * k, ay + (by - ay) * k, '#3dff8a', 1);
            left -= seg[i];
        }
        for (const [x, y] of [[22, 84], [58, 70], [85, 52], [106, 32], [31, 40]]) {
            R(x - 1, y - 1, 3, 3, '#ffb02e');
        }
        // GPU vs CPU bars
        for (let i = 0; i < 5; i++) {
            const h = 10 + 30 * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.1));
            R(118 + i * 8, 88 - h, 5, h, i % 2 ? '#29e6ff' : '#ff4fd8');
        }
        R(116, 88, 42, 1, '#2d3b6c');
        glow(86, 52, 80, '41,230,255', 0.07);

        // Holographic globe on a pedestal
        R(186, 92, 24, 20, '#232c4d');
        R(184, 90, 28, 3, '#3a4878');
        R(186, 92, 24, 1, '#29e6ff');
        glow(198, 66, 26, '41,230,255', 0.3);
        g.strokeStyle = 'rgba(120,240,255,0.85)';
        g.lineWidth = 1;
        g.beginPath(); g.arc(198, 66, 16, 0, Math.PI * 2); g.stroke();
        for (let i = 0; i < 3; i++) {
            const rx = Math.abs(Math.cos(t * 1.2 + i * Math.PI / 3)) * 16;
            g.beginPath(); g.ellipse(198, 66, Math.max(rx, 0.5), 16, 0, 0, Math.PI * 2); g.stroke();
        }
        g.beginPath(); g.ellipse(198, 66, 16, 5, 0, 0, Math.PI * 2); g.stroke();
        for (let i = 0; i < 6; i++) {
            const k = (t * 0.6 + i / 6) % 1;
            R(188 + hash(i) * 20, 88 - k * 22, 1, 1, `rgba(120,240,255,${1 - k})`);
        }

        // Server racks with blinking LEDs
        for (const rx of [240, 278]) {
            R(rx, 18, 34, 94, '#1b2238');
            R(rx + 2, 20, 30, 90, '#0b1022');
            for (let s = 0; s < 11; s++) {
                const sy = 22 + s * 8;
                R(rx + 4, sy, 26, 6, '#1f2843');
                R(rx + 16, sy + 2, 12, 2, '#141b33');
                for (let l = 0; l < 3; l++) {
                    const on = hash(Math.floor(t * 5) * 31 + s * 7 + l * 3 + rx) > 0.35;
                    R(rx + 6 + l * 3, sy + 2, 2, 2, on ? (l === 2 ? '#ffb02e' : '#3dff8a') : '#0f2a1c');
                }
            }
        }

        // Desk + workstation with scrolling code
        R(96, 118, 116, 5, '#2c3658');
        R(96, 123, 116, 2, '#1b2238');
        R(100, 125, 4, 26, '#1b2238');
        R(204, 125, 4, 26, '#1b2238');
        R(132, 94, 46, 26, '#2a3354');
        R(134, 96, 42, 20, '#050b1a');
        R(152, 116, 6, 2, '#2a3354');
        const colors = ['#29e6ff', '#ff4fd8', '#3dff8a', '#ffb02e', '#9aa8d8'];
        const scroll = Math.floor(t * 4);
        for (let i = 0; i < 6; i++) {
            const n = i + scroll;
            R(136 + (hash(n * 3) * 3 | 0) * 3, 98 + i * 3, 6 + hash(n * 5) * 26, 1, colors[n % colors.length]);
        }
        glow(155, 106, 30, '41,230,255', 0.15);
        R(140, 119, 30, 2, '#3a4878');   // keyboard
        // Chair (back view)
        R(146, 128, 20, 18, '#1f2843');
        R(148, 130, 16, 14, '#2a3560');
        R(155, 146, 2, 8, '#1b2238');
        R(148, 154, 16, 2, '#1b2238');

        // Floor cables
        g.strokeStyle = '#1f2a4a';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(255, 112); g.bezierCurveTo(240, 150, 200, 140, 180, 160); g.stroke();
        g.beginPath(); g.moveTo(290, 112); g.bezierCurveTo(290, 160, 250, 170, 220, 180); g.stroke();

        vignette(0.5);
    }

    // ── 💼 Glass office (Experience) ──────────────────────────
    function office() {
        // Wall and ceiling light panels
        R(0, 0, W, FY, '#e6ebf0');
        R(0, 0, W, 6, '#f7f9fb');
        for (let x = 20; x < W; x += 80) { R(x, 6, 40, 2, '#ffffff'); glow(x + 20, 8, 30, '255,255,255', 0.25); }

        // Floor-to-ceiling window with a city skyline (right side)
        const wx = 166;
        const sky = g.createLinearGradient(0, 12, 0, 92);
        sky.addColorStop(0, '#7cc8f2');
        sky.addColorStop(1, '#d8f0ff');
        g.fillStyle = sky;
        g.fillRect(wx, 12, W - wx, 80);
        circle(290, 28, 7, '#fff6c8');
        glow(290, 28, 20, '255,246,200', 0.4);
        const sk = rngOf(5);
        for (let x = wx; x < W; x += 9 + Math.floor(sk() * 6)) {
            const h = 18 + sk() * 40, w = 8 + sk() * 10;
            R(x, 92 - h, w, h, sk() < 0.5 ? '#9fb4c8' : '#88a0b8');
            for (let wy = 92 - h + 3; wy < 88; wy += 5) for (let xx = x + 2; xx < x + w - 2; xx += 3) R(xx, wy, 1, 2, '#c8d8e8');
        }
        // A metro train gliding across
        const tx = ((t * 40) % (W - wx + 70)) + wx - 50;
        R(tx, 82, 46, 6, '#e8eef4');
        R(tx, 84, 46, 2, '#d0021b');
        for (let i = 0; i < 5; i++) R(tx + 3 + i * 9, 82, 5, 2, '#4a6a8a');
        R(wx, 88, W - wx, 2, '#6f8296');
        for (let x = wx; x < W; x += 38) R(x, 12, 2, 80, '#9aa7b4');
        R(wx, 12, W - wx, 2, '#9aa7b4');
        R(wx - 2, 92, W - wx + 2, 3, '#b9c3cd');

        // HERO: live transport analytics dashboard
        R(12, 12, 148, 84, '#222c38');
        R(14, 14, 144, 80, '#0f1d2b');
        text('E-BUS LIVE', 18, 17, '#7fe3ff');
        // route map with buses
        const routes = [
            { c: '#29e6ff', pts: [[20, 40], [50, 40], [50, 60], [96, 60]] },
            { c: '#ff6fb5', pts: [[24, 86], [24, 70], [70, 70], [70, 34], [96, 34]] },
            { c: '#ffd23a', pts: [[36, 30], [36, 50], [86, 50], [86, 86]] },
        ];
        routes.forEach((r, ri) => {
            for (let i = 1; i < r.pts.length; i++) line(r.pts[i - 1][0], r.pts[i - 1][1], r.pts[i][0], r.pts[i][1], r.c);
            const seg = r.pts.slice(1).map((p, i) => Math.hypot(p[0] - r.pts[i][0], p[1] - r.pts[i][1]));
            const total = seg.reduce((a, b) => a + b, 0);
            for (let b = 0; b < 2; b++) {
                let d = (t * 14 + b * total / 2 + ri * 20) % total;
                let i = 0;
                while (d > seg[i]) { d -= seg[i]; i++; }
                const [ax, ay] = r.pts[i], [bx, by] = r.pts[i + 1];
                const k = d / seg[i];
                R(ax + (bx - ax) * k - 1, ay + (by - ay) * k - 1, 3, 3, '#ffffff');
            }
        });
        // KPI tiles
        for (let i = 0; i < 3; i++) {
            const y = 30 + i * 21;
            R(104, y, 50, 17, '#16293b');
            R(107, y + 3, 16, 2, '#5d7a94');
            const v = 0.55 + 0.4 * Math.sin(t * 0.9 + i * 2);
            R(107, y + 9, 44 * v, 4, ['#29e6ff', '#ff6fb5', '#3dff8a'][i]);
        }
        glow(86, 54, 80, '127,227,255', 0.06);

        // Floor: polished with a reflection of the screen
        R(0, FY, W, H - FY, '#cfd6de');
        for (let y = FY + 12; y < H; y += 12) R(0, y, W, 1, '#c2cad3');
        R(14, FY + 2, 144, 10, 'rgba(15,29,43,0.12)');
        R(0, FY, W, 2, '#aab4bf');

        // Desk with laptop and coffee
        R(24, 116, 120, 4, '#f4f6f8');
        R(24, 120, 120, 2, '#b9c3cd');
        R(28, 122, 3, 30, '#8996a4');
        R(137, 122, 3, 30, '#8996a4');
        R(60, 104, 30, 12, '#3a4552');
        R(62, 106, 26, 9, '#7fe3ff');
        for (let i = 0; i < 3; i++) R(64, 108 + i * 2, 8 + 12 * (0.5 + 0.5 * Math.sin(t * 2 + i)), 1, '#16293b');
        R(56, 115, 38, 2, '#5b6773');
        R(110, 109, 6, 7, '#ffffff');
        R(116, 111, 2, 3, '#ffffff');
        steam(112, 107);
        // Office chair
        R(68, 126, 26, 16, '#2e3a46');
        R(70, 128, 22, 12, '#3f4d5c');
        R(80, 142, 2, 8, '#5b6773');
        R(72, 150, 18, 2, '#5b6773');

        plant(158, 150, true);
        // Glass meeting table on the right
        R(200, 128, 100, 4, 'rgba(160,210,240,0.7)');
        R(206, 132, 2, 20, '#8996a4');
        R(292, 132, 2, 20, '#8996a4');
        vignette(0.25);
    }

    // ── 🎓 University (Education) ──────────────────────────────
    function university() {
        // Plaster wall, crown moulding, wood wainscoting
        R(0, 0, W, FY, '#e8d5ac');
        for (let x = 0; x < W; x += 6) R(x, 0, 1, 74, 'rgba(160,120,60,0.06)');
        R(0, 4, W, 4, '#6b3e1f');
        R(0, 8, W, 1, '#8a5a2b');
        R(0, 74, W, FY - 74, '#6b3e1f');
        R(0, 74, W, 2, '#8a5a2b');
        for (let x = 6; x < W; x += 34) { R(x, 80, 26, 26, '#5a3418'); R(x + 1, 81, 24, 24, '#633a1c'); }

        // Sunlit arched windows (right)
        for (const wx of [198, 262]) {
            R(wx - 3, 14, 46, 56, '#5a3418');
            const gl = g.createLinearGradient(0, 14, 0, 66);
            gl.addColorStop(0, '#fff3c4');
            gl.addColorStop(1, '#ffd98a');
            g.fillStyle = gl;
            g.beginPath();
            g.moveTo(wx, 66); g.lineTo(wx, 34); g.arc(wx + 20, 34, 20, Math.PI, 0); g.lineTo(wx + 40, 66); g.closePath();
            g.fill();
            R(wx + 19, 14, 2, 52, '#5a3418');
            R(wx, 40, 40, 2, '#5a3418');
            R(wx - 4, 66, 48, 3, '#8a5a2b');
            // light beam onto the floor
            poly([[wx, 66], [wx + 40, 66], [wx - 10, 150], [wx - 60, 150]], 'rgba(255,225,150,0.13)');
        }
        motes(140, 60, 120, 90, 26, '255,240,200');

        // HERO: chalkboard
        R(14, 14, 152, 60, '#4a2a12');
        R(17, 17, 146, 54, '#2e4a3b');
        for (let i = 0; i < 6; i++) R(20 + hash(i) * 120, 20 + hash(i + 9) * 46, 22, 6, 'rgba(255,255,255,0.04)');
        const chalk = '#eef0e4';
        text('DSA', 22, 22, chalk);
        // a little binary tree
        const nodes = [[40, 40], [28, 54], [52, 54], [22, 66], [34, 66]];
        line(40, 40, 28, 54, chalk); line(40, 40, 52, 54, chalk); line(28, 54, 22, 66, chalk); line(28, 54, 34, 66, chalk);
        nodes.forEach(([x, y]) => { circle(x, y, 3, chalk); circle(x, y, 2, '#2e4a3b'); });
        text('O(nlogn)', 70, 22, chalk);
        text('Y=WX+B', 70, 38, '#ffe28a');
        text('SELECT *', 70, 54, '#a8e0ff');
        // chalk being written: blinking underline
        if (Math.floor(t * 2) % 2) R(134, 62, 8, 1, chalk);
        R(14, 74, 152, 3, '#8a5a2b');
        R(30, 72, 6, 2, '#ffffff'); R(44, 72, 5, 2, '#ffe28a'); R(140, 72, 10, 3, '#3b2a1a');

        // Pendulum clock between board and windows
        R(170, 16, 18, 52, '#5a3418');
        R(172, 18, 14, 48, '#3b2414');
        circle(179, 27, 6, '#f3ead2');
        line(179, 27, 179, 23, '#2a1a0e');
        line(179, 27, 182, 28, '#2a1a0e');
        const a = Math.sin(t * 3.2) * 0.35;
        line(179, 36, 179 + Math.sin(a) * 20, 36 + Math.cos(a) * 20, '#c9a227');
        circle(179 + Math.sin(a) * 20, 36 + Math.cos(a) * 20, 3, '#e3c04a');

        // Wooden floor
        planks(FY, '#8b5a2b', '#7f5126', '#5e3b1b');
        R(0, FY, W, 2, '#4a2a12');

        // Teacher's desk with books, apple and a graduation cap
        R(16, 104, 104, 6, '#7a4520');
        R(16, 110, 104, 26, '#5a3418');
        R(22, 114, 40, 8, '#6b3e1f'); R(74, 114, 40, 8, '#6b3e1f');
        R(40, 117, 4, 2, '#c9a227'); R(92, 117, 4, 2, '#c9a227');
        R(26, 92, 22, 4, '#8b2c2c'); R(27, 96, 20, 4, '#2c4f8b'); R(25, 100, 24, 4, '#3d6b35');
        circle(60, 101, 3, '#c0392b'); R(60, 96, 1, 2, '#3d6b35');
        // mortarboard with swinging tassel
        poly([[72, 96], [90, 92], [108, 96], [90, 100]], '#1a1a1a');
        R(82, 98, 16, 6, '#222222');
        const ta = Math.sin(t * 2) * 1.5;
        line(90, 96, 104 + ta, 99, '#e3c04a');
        R(103 + ta, 99, 2, 5, '#e3c04a');

        // Front row of student desks
        for (const dx of [140, 210, 280]) {
            R(dx, 140, 50, 5, '#8a5a2b');
            R(dx, 145, 50, 3, '#5a3418');
            R(dx + 3, 148, 3, 30, '#5a3418');
            R(dx + 44, 148, 3, 30, '#5a3418');
            R(dx + 12, 135, 14, 5, '#f3ead2');
            R(dx + 19, 135, 1, 5, '#c9b88f');
        }
        vignette(0.35);
    }

    // ── 🏡 Cottage (About) ────────────────────────────────────
    function cottage() {
        // Striped wallpaper, beams, wainscot
        R(0, 0, W, FY, '#c4825a');
        for (let x = 0; x < W; x += 10) R(x, 0, 4, 88, '#b97650');
        R(0, 0, W, 6, '#5a3418');
        for (const x of [0, 160, 314]) R(x, 0, 6, FY, '#5a3418');
        R(0, 88, W, FY - 88, '#7a4a26');
        R(0, 88, W, 2, '#8f5a30');

        // Night window with curtains (right)
        R(212, 18, 64, 52, '#5a3418');
        R(215, 21, 58, 46, '#1b2550');
        for (let i = 0; i < 14; i++) {
            const tw = hash(i + Math.floor(t * 1.5 + i)) > 0.2;
            if (tw) R(217 + hash(i * 3) * 54, 23 + hash(i * 5) * 40, 1, 1, '#ffffff');
        }
        circle(258, 32, 6, '#fff6c8');
        circle(261, 30, 5, '#1b2550');
        R(243, 21, 2, 46, '#5a3418');
        R(215, 43, 58, 2, '#5a3418');
        R(206, 14, 14, 62, '#a83232'); R(268, 14, 14, 62, '#a83232');
        R(208, 14, 2, 62, '#8a2626'); R(276, 14, 2, 62, '#8a2626');
        R(204, 12, 80, 3, '#3b2414');
        R(210, 70, 68, 3, '#8f5a30');
        plant(234, 70);

        // HERO: stone fireplace with a crackling fire
        R(34, 32, 108, 80, '#8c8172');
        for (let y = 34, row = 0; y < 110; y += 7, row++) {
            for (let x = 34 + (row % 2 ? 6 : 0); x < 140; x += 12) {
                R(x + 1, y + 1, 10, 5, hash(x * 3 + y) > 0.5 ? '#9c9080' : '#a49886');
            }
        }
        R(28, 28, 120, 6, '#5a3418');
        R(28, 34, 120, 2, '#3b2414');
        R(56, 60, 64, 52, '#2a1a12');
        R(58, 62, 60, 50, '#140c08');
        glow(88, 100, 70, '255,140,50', 0.35 + Math.sin(t * 9) * 0.04);
        R(64, 104, 48, 5, '#5a3418');
        R(70, 100, 36, 4, '#6b3e1f');
        for (let i = 0; i < 7; i++) flame(64 + i * 6, 104, 8, 18 + (i % 3) * 4, i);
        for (let i = 0; i < 4; i++) {
            const k = (t * 0.9 + i / 4) % 1;
            R(70 + hash(i) * 36 + Math.sin(t * 3 + i) * 3, 100 - k * 34, 1, 1, `rgba(255,200,90,${1 - k})`);
        }
        // mantel: candles, framed photo, little plant
        candle(38, 21);
        candle(136, 21);
        R(78, 12, 20, 16, '#c9a227');
        R(80, 14, 16, 12, '#f3ead2');
        circle(88, 19, 3, '#c4825a');
        R(84, 22, 8, 4, '#7a9ec4');
        plant(120, 28);

        // Floor, rug and a sleeping cat
        planks(FY, '#8b5a2b', '#80522a', '#5e3b1b');
        g.fillStyle = '#9b2d2d';
        g.beginPath(); g.ellipse(100, 146, 82, 18, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#e3c04a'; g.lineWidth = 2;
        g.beginPath(); g.ellipse(100, 146, 74, 14, 0, 0, Math.PI * 2); g.stroke();
        glow(88, 130, 90, '255,140,50', 0.12);
        // cat
        g.fillStyle = '#e08a3a';
        g.beginPath(); g.ellipse(112, 140, 13, 6, 0, 0, Math.PI * 2); g.fill();
        circle(100, 137, 5, '#e08a3a');
        poly([[96, 134], [97, 129], [100, 133]], '#e08a3a');
        poly([[101, 133], [104, 129], [104, 134]], '#e08a3a');
        R(98, 137, 2, 1, '#5a3418'); R(102, 137, 2, 1, '#5a3418');
        for (let i = 0; i < 3; i++) R(108 + i * 5, 135, 2, 4, '#c26f25');
        const tail = Math.sin(t * 2) * 3;
        g.strokeStyle = '#e08a3a'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(124, 141); g.quadraticCurveTo(132, 136 + tail, 128, 130 + tail); g.stroke();
        // breathing "z"
        const z = (t * 0.6) % 1;
        g.font = '8px "Press Start 2P", monospace';
        g.fillStyle = `rgba(255,255,255,${0.8 * (1 - z)})`;
        g.fillText('z', 104 + z * 6, 126 - z * 12);

        // Armchair
        R(150, 82, 46, 30, '#c9932e');
        R(152, 84, 42, 24, '#d9a542');
        R(144, 96, 12, 30, '#b57f22');
        R(190, 96, 12, 30, '#b57f22');
        R(154, 108, 38, 14, '#d9a542');
        R(154, 120, 38, 6, '#b57f22');
        R(148, 126, 4, 6, '#5a3418'); R(194, 126, 4, 6, '#5a3418');
        R(160, 92, 14, 12, '#7a9ec4');  // cushion

        // Side table with a mug of tea, bookshelf, floor lamp
        R(206, 106, 22, 3, '#6b3e1f');
        R(215, 109, 4, 22, '#5a3418');
        R(213, 99, 7, 7, '#f3ead2');
        R(220, 101, 2, 3, '#f3ead2');
        steam(216, 97);
        bookshelf(240, 74, 44, 50, 2, '#6b3e1f', '#3b2414', rngOf(3), ['#8b2c2c', '#2c4f8b', '#3d6b35', '#c9a227', '#7a4a8b']);
        R(298, 40, 2, 86, '#3b2414');
        poly([[290, 40], [308, 40], [304, 28], [294, 28]], '#f3d28a');
        glow(299, 42, 40, '255,210,130', 0.35);
        R(292, 124, 14, 3, '#3b2414');
        vignette(0.45);
    }

    // ── 📚 Library (Skills) ───────────────────────────────────
    function library() {
        R(0, 0, W, FY, '#3b2414');
        const rng = rngOf(21);
        const pal = ['#8b2c2c', '#2c4f8b', '#3d6b35', '#c9a227', '#7a4a8b', '#a0522d', '#1f6f6f', '#d9cfb0'];

        // Arched window (centre) with warm afternoon light
        R(122, 8, 76, 66, '#5a3418');
        const gl = g.createLinearGradient(0, 10, 0, 72);
        gl.addColorStop(0, '#ffe9b0');
        gl.addColorStop(1, '#f6c46b');
        g.fillStyle = gl;
        g.beginPath();
        g.moveTo(126, 72); g.lineTo(126, 40); g.arc(160, 40, 34, Math.PI, 0); g.lineTo(194, 72); g.closePath();
        g.fill();
        for (const x of [148, 170]) R(x, 8, 2, 64, '#5a3418');
        R(126, 44, 68, 2, '#5a3418');
        R(118, 72, 84, 4, '#8a5a2b');
        poly([[126, 72], [194, 72], [230, 160], [110, 160]], 'rgba(255,220,140,0.12)');

        // Tall bookshelves on both sides
        bookshelf(4, 6, 112, 106, 5, '#6b3e1f', '#24150b', rng, pal);
        bookshelf(204, 6, 112, 106, 5, '#6b3e1f', '#24150b', rng, pal);
        // Rolling ladder
        R(84, 4, 2, 120, '#a0703a');
        R(98, 4, 2, 120, '#a0703a');
        for (let y = 12; y < 120; y += 10) R(84, y, 16, 2, '#a0703a');
        R(80, 4, 24, 2, '#c9a227');

        // Floor: parquet with a rich rug
        R(0, FY, W, H - FY, '#5a3418');
        for (let y = FY; y < H; y += 6) {
            for (let x = ((y / 6) % 2) * 6; x < W; x += 12) R(x, y, 6, 6, '#4f2d15');
        }
        R(0, FY, W, 2, '#24150b');
        R(70, 128, 180, 46, '#7d1f1f');
        R(74, 132, 172, 38, '#9b2d2d');
        g.strokeStyle = '#c9a227'; g.lineWidth = 1;
        g.strokeRect(78.5, 135.5, 163, 31);
        for (let x = 92; x < 236; x += 16) R(x, 150, 4, 2, '#c9a227');

        // HERO: reading table with banker's lamp, open book, globe
        R(60, 104, 118, 5, '#7a4520');
        R(60, 109, 118, 4, '#5a3418');
        R(64, 113, 4, 30, '#5a3418');
        R(170, 113, 4, 30, '#5a3418');
        // banker's lamp
        R(76, 100, 12, 4, '#c9a227');
        R(81, 88, 2, 12, '#c9a227');
        poly([[72, 90], [92, 90], [88, 84], [76, 84]], '#1f7a4a');
        R(74, 90, 16, 1, '#2fa865');
        glow(82, 96, 46, '255,220,140', 0.4);
        // open book with a page turning now and then
        R(104, 98, 34, 6, '#f3ead2');
        R(120, 98, 2, 6, '#c9b88f');
        for (let i = 0; i < 2; i++) R(107 + i * 17, 100, 11, 1, '#b8a888');
        const turn = (t % 6) / 6;
        if (turn < 0.15) {
            const k = turn / 0.15;
            poly([[121, 104], [121, 98], [121 + 16 * Math.cos(k * Math.PI), 98 - 6 * Math.sin(k * Math.PI)], [121 + 16 * Math.cos(k * Math.PI), 104 - 2 * Math.sin(k * Math.PI)]], '#fffaf0');
        }
        // stack of books + globe
        R(144, 96, 20, 4, '#2c4f8b'); R(146, 92, 18, 4, '#8b2c2c'); R(145, 88, 16, 4, '#3d6b35');
        circle(166, 82, 7, '#3d7fb8');
        R(162, 79, 5, 3, '#3d6b35'); R(167, 84, 4, 2, '#3d6b35');
        R(165, 89, 2, 9, '#c9a227'); R(161, 98, 10, 2, '#c9a227');
        motes(110, 40, 120, 110, 34, '255,235,190');
        vignette(0.5);
    }

    // ── 🏆 Trophy room (Achievements) ─────────────────────────
    function trophies() {
        // Damask wallpaper, gold moulding, dark wainscot
        R(0, 0, W, FY, '#6b1f2a');
        for (let y = 14, row = 0; y < 84; y += 12, row++) {
            for (let x = (row % 2) * 8; x < W; x += 16) {
                R(x + 3, y, 2, 2, '#7d2a35'); R(x + 1, y + 2, 6, 2, '#7d2a35'); R(x + 3, y + 4, 2, 2, '#7d2a35');
            }
        }
        R(0, 6, W, 3, '#c9a227');
        R(0, 84, W, FY - 84, '#3b1d12');
        R(0, 84, W, 2, '#c9a227');

        // Floor and red carpet leading to the pedestal
        planks(FY, '#4a2a17', '#432614', '#2e180c');
        R(0, FY, W, 2, '#24120a');
        poly([[74, FY], [106, FY], [128, H], [52, H]], '#a51e2a');
        poly([[78, FY], [102, FY], [122, H], [58, H]], '#c0262f');

        // Spotlight on the trophy
        poly([[80, 0], [100, 0], [134, 112], [46, 112]], 'rgba(255,240,190,0.10)');
        g.fillStyle = 'rgba(255,240,190,0.15)';
        g.beginPath(); g.ellipse(90, 112, 40, 6, 0, 0, Math.PI * 2); g.fill();

        // HERO: marble pedestal with a big silver (2nd place) trophy
        R(68, 80, 44, 34, '#d9d4cc');
        R(70, 82, 40, 30, '#e8e4dc');
        R(64, 76, 52, 5, '#c9c3b8');
        R(64, 112, 52, 4, '#c9c3b8');
        R(78, 90, 24, 10, '#c9a227');
        text('2ND', 90, 91, '#3b1d12', 'center');
        // cup
        R(80, 70, 20, 6, '#8e959e');
        R(86, 58, 8, 12, '#b9c0c9');
        g.fillStyle = '#c9ced6';
        g.beginPath(); g.moveTo(74, 30); g.lineTo(106, 30); g.quadraticCurveTo(104, 56, 90, 58); g.quadraticCurveTo(76, 56, 74, 30); g.fill();
        R(74, 28, 32, 3, '#e6eaef');
        R(78, 33, 3, 16, '#f4f6f8');
        g.strokeStyle = '#b9c0c9'; g.lineWidth = 3;
        g.beginPath(); g.arc(73, 40, 7, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
        g.beginPath(); g.arc(107, 40, 7, Math.PI * 1.5, Math.PI * 0.5); g.stroke();
        glow(90, 44, 40, '255,255,255', 0.18);
        // sparkles
        for (let i = 0; i < 5; i++) {
            const k = (t * 0.7 + i / 5) % 1;
            const s = Math.sin(k * Math.PI);
            const x = 70 + hash(i * 11 + Math.floor(t * 0.7 + i / 5)) * 40, y = 24 + hash(i * 17 + Math.floor(t * 0.7 + i / 5)) * 40;
            g.fillStyle = `rgba(255,255,255,${s})`;
            g.fillRect(x, y - 2, 1, 5);
            g.fillRect(x - 2, y, 5, 1);
        }

        // Shelf of smaller trophies and medals (left)
        R(6, 40, 52, 4, '#5a3418');
        R(6, 70, 52, 4, '#5a3418');
        for (const [x, c] of [[12, '#c9a227'], [28, '#cd7f32'], [44, '#c9a227']]) {
            R(x, 36, 8, 4, '#3b2414'); R(x + 3, 30, 2, 6, c); R(x, 22, 8, 8, c); R(x + 1, 23, 2, 5, 'rgba(255,255,255,0.4)');
        }
        for (const [x, c] of [[14, '#c9a227'], [32, '#b9c0c9'], [48, '#cd7f32']]) {
            poly([[x - 3, 50], [x + 3, 50], [x + 1, 60], [x - 1, 60]], '#2c4f8b');
            circle(x, 64, 4, c);
        }

        // Framed certificates
        for (const [x, y] of [[126, 18], [126, 50]]) {
            R(x, y, 40, 28, '#c9a227');
            R(x + 2, y + 2, 36, 24, '#f8f1dc');
            for (let i = 0; i < 3; i++) R(x + 6, y + 6 + i * 5, 28 - i * 6, 1, '#b8a888');
            circle(x + 31, y + 20, 3, '#c0262f');
        }
        // A rosette ribbon
        circle(186, 30, 7, '#2c4f8b'); circle(186, 30, 4, '#c9a227');
        poly([[182, 36], [186, 36], [184, 50]], '#2c4f8b');
        poly([[187, 36], [191, 36], [190, 50]], '#2c4f8b');

        // Display cabinet (right)
        R(226, 30, 84, 82, '#3b2414');
        R(230, 34, 76, 74, 'rgba(180,220,240,0.18)');
        for (let i = 0; i < 3; i++) {
            R(230, 56 + i * 24, 76, 2, '#5a3418');
            for (let j = 0; j < 3; j++) {
                const c = ['#c9a227', '#b9c0c9', '#cd7f32'][(i + j) % 3];
                R(240 + j * 22, 46 + i * 24, 8, 10, c);
                R(242 + j * 22, 47 + i * 24, 2, 7, 'rgba(255,255,255,0.4)');
            }
        }
        vignette(0.55);
    }

    // ── ☕ Café (Leadership) ──────────────────────────────────
    function cafe() {
        // Exposed brick above, cream panelling below
        R(0, 0, W, 80, '#7c3a22');
        for (let y = 0, row = 0; y < 80; y += 6, row++) {
            for (let x = (row % 2) * -6; x < W; x += 12) {
                R(x + 1, y + 1, 10, 4, hash(x * 7 + y * 3) > 0.5 ? '#a0522d' : '#94492a');
            }
        }
        R(0, 80, W, FY - 80, '#efe1c6');
        for (let x = 0; x < W; x += 10) R(x, 80, 1, FY - 80, '#dccdb0');
        R(0, 80, W, 2, '#6b3e1f');

        // Fairy lights across the top
        g.strokeStyle = '#3b2414'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, 6);
        for (let x = 0; x <= W; x += 40) g.quadraticCurveTo(x + 20, 16, x + 40, 6);
        g.stroke();
        for (let x = 6; x < W; x += 10) {
            const k = ((x % 40) / 40);
            const y = 6 + Math.sin(k * Math.PI) * 5 + 1;
            const on = Math.sin(t * 3 + x * 0.7) > -0.4;
            R(x, y, 2, 2, on ? '#ffd27a' : '#8a6a3a');
            if (on) glow(x + 1, y + 1, 5, '255,200,110', 0.35);
        }

        // HERO: workshop board
        R(14, 20, 108, 62, '#6b3e1f');
        R(17, 23, 102, 56, '#2b2b2b');
        text('AI', 22, 27, '#ffd27a');
        text('WORKSHOP', 22, 37, '#f3ead2');
        text('100+', 22, 66, '#7fe3ff');
        // tiny neural net doodle that "fires"
        const layers = [[86, [36, 50, 64]], [100, [42, 58]], [112, [50]]];
        for (let l = 0; l < layers.length - 1; l++) {
            for (const y1 of layers[l][1]) for (const y2 of layers[l + 1][1]) line(layers[l][0], y1, layers[l + 1][0], y2, 'rgba(243,234,210,0.35)');
        }
        layers.forEach(([x, ys], l) => ys.forEach((y, i) => {
            const lit = Math.floor(t * 2) % 3 === l;
            circle(x, y, 3, lit ? '#ffd27a' : '#f3ead2');
        }));
        R(66, 70, 46, 1, '#f3ead2');
        R(66, 74, 30, 1, '#f3ead2');

        // Pendant lamps
        for (const x of [146, 210, 274]) {
            R(x, 0, 1, 26, '#3b2414');
            poly([[x - 8, 34], [x + 9, 34], [x + 5, 26], [x - 4, 26]], '#1f4f3f');
            R(x - 2, 34, 5, 2, '#ffe9b0');
            glow(x, 38, 34, '255,210,130', 0.3);
        }

        // Floor: terracotta tiles
        for (let y = FY; y < H; y += 10) {
            for (let x = 0; x < W; x += 10) R(x, y, 10, 10, ((x + y) / 10) % 2 ? '#c87e5a' : '#b86e4c');
        }
        R(0, FY, W, 2, '#6b3e1f');

        // Counter with espresso machine and pastry case (right)
        R(184, 82, 136, 4, '#3b2414');
        R(184, 86, 136, 40, '#6b3e1f');
        for (let x = 188; x < W; x += 16) R(x, 90, 12, 32, '#7a4a26');
        R(232, 56, 36, 26, '#c9ced6');
        R(234, 58, 32, 6, '#c0262f');
        R(240, 70, 4, 6, '#5b6773'); R(256, 70, 4, 6, '#5b6773');
        R(239, 77, 6, 5, '#f3ead2'); R(255, 77, 6, 5, '#f3ead2');
        steam(242, 64, 0); steam(258, 64, 0.5);
        R(280, 62, 34, 20, 'rgba(200,230,240,0.5)');
        R(280, 62, 34, 1, '#ffffff');
        for (let i = 0; i < 3; i++) { circle(287 + i * 10, 76, 3, '#d9963e'); circle(287 + i * 10, 68, 3, '#8b4a2a'); }
        R(198, 74, 6, 8, '#f3ead2'); R(208, 76, 6, 6, '#f3ead2');

        // Round tables with steaming mugs
        for (const [x, y] of [[46, 132], [130, 146]]) {
            chair(x - 30, y + 10, '#8a5a2b', '#5a3418');
            chair(x + 18, y + 10, '#8a5a2b', '#5a3418');
            g.fillStyle = '#5a3418';
            g.beginPath(); g.ellipse(x, y, 22, 5, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#7a4a26';
            g.beginPath(); g.ellipse(x, y - 1, 22, 5, 0, 0, Math.PI * 2); g.fill();
            R(x - 1, y + 4, 3, 22, '#3b2414');
            R(x - 8, y + 24, 17, 2, '#3b2414');
            R(x - 10, y - 8, 6, 6, '#f3ead2');
            R(x + 4, y - 7, 6, 5, '#f3ead2');
            steam(x - 8, y - 9, x * 0.01);
        }
        plant(170, 112, true);
        vignette(0.4);
    }

    const ROOMS = {
        projects: { name: 'The Tech Lab', draw: lab, bg: '#0b1024' },
        experience: { name: 'The Glass Office', draw: office, bg: '#b9c3cd' },
        education: { name: 'The University', draw: university, bg: '#4a2a12' },
        about: { name: 'My Cottage', draw: cottage, bg: '#3b2414' },
        skills: { name: 'The Library', draw: library, bg: '#24150b' },
        achievements: { name: 'The Trophy Room', draw: trophies, bg: '#24120a' },
        leadership: { name: 'The Café', draw: cafe, bg: '#6b3e1f' },
    };

    window.Interiors = {
        WIDTH: W,
        HEIGHT: H,
        has: id => id in ROOMS,
        name: id => ROOMS[id]?.name ?? '',
        background: id => ROOMS[id]?.bg ?? '#000',
        draw(ctx, id, time) {
            const room = ROOMS[id];
            if (!room) return;
            g = ctx;
            t = time;
            g.save();
            g.imageSmoothingEnabled = false;
            g.clearRect(0, 0, W, H);
            room.draw();
            g.restore();
        },
    };
})();
