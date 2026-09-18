/**
 * SCS platform lane micro-viz — reusable neon canvas glyphs for interest lanes,
 * dashboards, and Studio Review. Each id maps to a domain-specific animation
 * (not the hero "What we're optimizing for" deck).
 *
 * API: SCS_LANE_VIZ.draw(id, timeMs, canvas)
 *      SCS_LANE_VIZ.overlayProcess|Confirm|Confirmed(id, ctx, w, h, timeMs, elapsedMs)
 */
(function (global) {
  "use strict";

  const GOLD = "#FFB347";
  const CYAN = "#47D1FF";
  const PHI = (1 + Math.sqrt(5)) / 2;

  function glow(ctx, color, blur) {
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
  }
  function clearGlow(ctx) {
    ctx.shadowBlur = 0;
  }

  function fit(cv) {
    const r = cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const w = Math.max(r.width, 1);
    const h = Math.max(r.height, 1);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) {
      cv.width = pw;
      cv.height = ph;
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  /** Voice — phonon ring: radial voice energy + expanding ripples from mic core */
  function phononRing(t, cv) {
    const { ctx, w, h } = fit(cv);
    const cx = w * 0.5;
    const my = h * 0.78;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.0035);

    for (let r = 0; r < 3; r++) {
      const phase = (t * 0.002 + r * 0.9) % 3;
      const rad = 8 + phase * 22;
      ctx.globalAlpha = (1 - phase / 3) * 0.45;
      glow(ctx, CYAN, 10);
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, my - 6, rad, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }

    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI;
      const band = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0045 + i * 0.55));
      const len = band * h * 0.38;
      const col = i % 3 === 0 ? GOLD : CYAN;
      glow(ctx, col, 6);
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.35 + band * 0.55;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, my - 8);
      ctx.lineTo(cx + Math.cos(a) * len, my - 8 + Math.sin(a) * len * 0.15);
      ctx.stroke();
    }

    clearGlow(ctx);
    ctx.globalAlpha = 1;
    glow(ctx, GOLD, 12);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(cx, my - 10, 4.5, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(cx - 3.5, my - 4, 7, 9, 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5 + pulse * 0.3;
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.arc(cx, my - 10, 1.8, 0, 6.28);
    ctx.fill();
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Trading — fair-value tape: scrolling micro-candles + cyan FV rail */
  function fairValueTape(t, cv) {
    const { ctx, w, h } = fit(cv);
    const fvY = h * 0.48;
    const scroll = (t * 0.035) % 14;

    glow(ctx, CYAN, 8);
    ctx.strokeStyle = CYAN;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, fvY);
    ctx.lineTo(w, fvY + Math.sin(t * 0.001) * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const cw = 9;
    const gap = 5;
    const count = Math.ceil(w / (cw + gap)) + 2;
    for (let i = -1; i < count; i++) {
      const x = i * (cw + gap) - scroll;
      const seed = i * 17.31;
      const o = h * 0.52 + Math.sin(seed) * h * 0.08;
      const c = h * 0.38 + Math.cos(seed * 1.3) * h * 0.06;
      const bull = Math.sin(seed + t * 0.0008) > 0;
      const col = bull ? GOLD : CYAN;
      const top = Math.min(o, c);
      const bot = Math.max(o, c);
      glow(ctx, col, 6);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + cw / 2, top);
      ctx.lineTo(x + cw / 2, bot);
      ctx.stroke();
      ctx.globalAlpha = bull ? 0.85 : 0.35;
      ctx.fillRect(x, top, cw, Math.max(2, bot - top));
    }

    const crossX = ((t * 0.02) % 1) * w;
    if (Math.abs(Math.sin(t * 0.002)) > 0.92) {
      glow(ctx, GOLD, 14);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(crossX, fvY, 2.5, 0, 6.28);
      ctx.fill();
    }
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Scheduling — orbit calendar: day arc + sliding appointment beads */
  function orbitCalendar(t, cv) {
    const { ctx, w, h } = fit(cv);
    const cx = w * 0.5;
    const cy = h * 0.72;
    const R = Math.min(w, h) * 0.42;

    glow(ctx, GOLD, 6);
    ctx.strokeStyle = "rgba(255,179,71,0.35)";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI, 0);
    ctx.stroke();

    const slots = 6;
    for (let i = 0; i < slots; i++) {
      const a = Math.PI + (i / (slots - 1)) * Math.PI;
      const px = cx + Math.cos(a) * R;
      const py = cy + Math.sin(a) * R;
      const hot = i === Math.floor((t * 0.0012) % slots);
      const col = hot ? CYAN : GOLD;
      glow(ctx, col, hot ? 12 : 4);
      ctx.fillStyle = col;
      ctx.globalAlpha = hot ? 1 : 0.45;
      ctx.beginPath();
      ctx.arc(px, py, hot ? 3.5 : 2, 0, 6.28);
      ctx.fill();
    }

    const orbitT = (t * 0.0018) % 1;
    const oa = Math.PI + orbitT * Math.PI;
    const ox = cx + Math.cos(oa) * R;
    const oy = cy + Math.sin(oa) * R;
    glow(ctx, CYAN, 14);
    ctx.strokeStyle = CYAN;
    ctx.fillStyle = CYAN;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, 6.28);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, 6.28);
    ctx.fill();

    ctx.fillStyle = "rgba(236,230,219,0.45)";
    ctx.font = "500 7px ui-monospace,monospace";
    ctx.textAlign = "center";
    ctx.fillText("NOW", cx, cy + 4);
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Design — golden layout: phi spiral + snapping brand frames */
  function goldenLayout(t, cv) {
    const { ctx, w, h } = fit(cv);
    const cx = w * 0.38;
    const cy = h * 0.55;
    const cycle = (t * 0.00045) % 1;

    ctx.strokeStyle = "rgba(255,179,71,0.2)";
    ctx.lineWidth = 0.5;
    const gs = 10;
    for (let x = 0; x < w; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    glow(ctx, GOLD, 8);
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let ang = t * 0.002;
    for (let i = 0; i < 48; i++) {
      const r = 2 * Math.pow(PHI, ang / 1.35);
      const x = cx + Math.cos(ang) * r * 0.22;
      const y = cy + Math.sin(ang) * r * 0.22;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      ang += 0.28;
    }
    ctx.stroke();

    const frames = [
      { x: 0.58, y: 0.22, ww: 0.28, hh: 0.38 },
      { x: 0.62, y: 0.52, ww: 0.22, hh: 0.28 },
      { x: 0.48, y: 0.58, ww: 0.18, hh: 0.22 },
    ];
    frames.forEach((f, i) => {
      const snap = Math.sin(t * 0.002 + i * 2) * 0.5 + 0.5;
      const fx = (f.x + snap * 0.04) * w;
      const fy = (f.y + snap * 0.03) * h;
      const fw = f.ww * w;
      const fh = f.hh * h;
      const active = i === Math.floor(cycle * frames.length);
      const col = active ? CYAN : GOLD;
      glow(ctx, col, active ? 10 : 5);
      ctx.strokeStyle = col;
      ctx.globalAlpha = active ? 0.9 : 0.4;
      ctx.lineWidth = active ? 1.6 : 1;
      ctx.strokeRect(fx, fy, fw, fh);
      if (active) {
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(fx, fy, fw, fh);
        ctx.globalAlpha = 0.9;
        ctx.fillRect(fx, fy, 3, 3);
        ctx.fillRect(fx + fw - 3, fy, 3, 3);
      }
    });
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Sales — pipeline flow: staged funnel + lead particles */
  function pipelineFlow(t, cv) {
    const { ctx, w, h } = fit(cv);
    const stages = [
      { y: 0.12, w: 0.88 },
      { y: 0.38, w: 0.62 },
      { y: 0.64, w: 0.38 },
    ];
    stages.forEach((s, i) => {
      const y = s.y * h;
      const sw = s.w * w;
      const x = (w - sw) / 2;
      const col = i === 0 ? GOLD : i === 1 ? "rgba(255,179,71,0.7)" : CYAN;
      glow(ctx, i === 2 ? CYAN : GOLD, 6);
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.55 - i * 0.08;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sw, y);
      ctx.lineTo(x + sw * 0.85, y + h * 0.18);
      ctx.lineTo(x + sw * 0.15, y + h * 0.18);
      ctx.closePath();
      ctx.stroke();
    });

    for (let p = 0; p < 10; p++) {
      const prog = ((t * 0.00035 + p * 0.11) % 1);
      const stage = Math.min(2, Math.floor(prog * 3));
      const local = (prog * 3) % 1;
      const sw = stages[stage].w * w;
      const x = w / 2 + (Math.sin(p * 4.7 + t * 0.002) * sw * 0.18 * (1 - local));
      const y = (stages[stage].y + local * 0.22) * h;
      glow(ctx, p % 2 ? CYAN : GOLD, 8);
      ctx.fillStyle = p % 2 ? CYAN : GOLD;
      ctx.globalAlpha = 0.35 + (1 - prog) * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, 6.28);
      ctx.fill();
    }
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Content — story reel: sequential frame illuminate + playhead sweep */
  function storyReel(t, cv) {
    const { ctx, w, h } = fit(cv);
    const n = 5;
    const gap = 3;
    const fw = (w - gap * (n - 1)) / n;
    const active = Math.floor((t * 0.0011) % n);
    const sweep = ((t * 0.0011) % 1);

    for (let i = 0; i < n; i++) {
      const x = i * (fw + gap);
      const on = i === active;
      const past = i < active;
      glow(ctx, on ? CYAN : GOLD, on ? 10 : 3);
      ctx.strokeStyle = on ? CYAN : GOLD;
      ctx.globalAlpha = on ? 0.95 : past ? 0.35 : 0.2;
      ctx.lineWidth = on ? 1.5 : 1;
      ctx.strokeRect(x, h * 0.15, fw, h * 0.7);
      if (on) {
        ctx.fillStyle = CYAN;
        ctx.globalAlpha = 0.06 + sweep * 0.08;
        ctx.fillRect(x, h * 0.15, fw, h * 0.7);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x + 2, h * 0.2, fw - 4, h * 0.08);
        ctx.fillRect(x + 2, h * 0.32, fw - 4, h * 0.04);
      }
    }

    const px = active * (fw + gap) + sweep * fw;
    glow(ctx, GOLD, 10);
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(px, h * 0.12, 1.5, h * 0.76);
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Automation — graph pulse: tool nodes + traveling execution token */
  function graphPulse(t, cv) {
    const { ctx, w, h } = fit(cv);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.32;
    const nodes = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      nodes.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.85 });
    }

    const edgeCount = 5;
    const hop = Math.floor((t * 0.0016) % edgeCount);
    const hopT = (t * 0.0016) % 1;

    for (let i = 0; i < edgeCount; i++) {
      const a = nodes[i];
      const b = nodes[(i + 1) % edgeCount];
      const lit = i === hop;
      glow(ctx, lit ? CYAN : GOLD, lit ? 8 : 3);
      ctx.strokeStyle = lit ? CYAN : "rgba(255,179,71,0.25)";
      ctx.globalAlpha = lit ? 0.85 : 0.35;
      ctx.lineWidth = lit ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (lit) {
        const tx = a.x + (b.x - a.x) * hopT;
        const ty = a.y + (b.y - a.y) * hopT;
        ctx.fillStyle = CYAN;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(tx, ty, 2.5, 0, 6.28);
        ctx.fill();
      }
    }

    nodes.forEach((n, i) => {
      const hub = i === hop;
      glow(ctx, hub ? CYAN : GOLD, hub ? 12 : 5);
      ctx.fillStyle = hub ? CYAN : GOLD;
      ctx.globalAlpha = hub ? 1 : 0.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, hub ? 3.5 : 2.5, 0, 6.28);
      ctx.fill();
    });

    glow(ctx, GOLD, 10);
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.4 + Math.sin(t * 0.004) * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 6.28);
    ctx.fill();
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  /** Growth — attribution fan: source paths converging on conversion node */
  function attributionFan(t, cv) {
    const { ctx, w, h } = fit(cv);
    const tx = w * 0.82;
    const ty = h * 0.5;
    const sources = 4;
    const paths = [];

    for (let i = 0; i < sources; i++) {
      const sy = h * (0.18 + (i / (sources - 1)) * 0.64);
      const sx = w * 0.08;
      const cpx = w * (0.35 + Math.sin(i * 1.7) * 0.08);
      const cpy = h * (0.5 + (i - 1.5) * 0.12);
      paths.push({ sx, sy, cpx, cpy, tx, ty, i });
    }

    paths.forEach((p) => {
      glow(ctx, GOLD, 4);
      ctx.strokeStyle = "rgba(255,179,71,0.22)";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy);
      ctx.quadraticCurveTo(p.cpx, p.cpy, p.tx, p.ty);
      ctx.stroke();

      const prog = ((t * 0.00055 + p.i * 0.22) % 1);
      const u = 1 - prog;
      const px = u * u * p.sx + 2 * u * prog * p.cpx + prog * prog * p.tx;
      const py = u * u * p.sy + 2 * u * prog * p.cpy + prog * prog * p.ty;
      glow(ctx, CYAN, 8);
      ctx.fillStyle = CYAN;
      ctx.globalAlpha = 0.4 + prog * 0.55;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, 6.28);
      ctx.fill();

      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 2, 0, 6.28);
      ctx.fill();
    });

    glow(ctx, CYAN, 14);
    ctx.fillStyle = CYAN;
    ctx.globalAlpha = 0.25 + Math.sin(t * 0.005) * 0.15;
    ctx.beginPath();
    ctx.arc(tx, ty, 10, 0, 6.28);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, 6.28);
    ctx.fill();
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  const DRAW = {
    voice: phononRing,
    trading: fairValueTape,
    scheduling: orbitCalendar,
    design: goldenLayout,
    sales: pipelineFlow,
    content: storyReel,
    automation: graphPulse,
    growth: attributionFan,
  };

  const LABELS = {
    voice: "phonon-ring",
    trading: "fair-value-tape",
    scheduling: "orbit-calendar",
    design: "golden-layout",
    sales: "pipeline-flow",
    content: "story-reel",
    automation: "graph-pulse",
    growth: "attribution-fan",
  };

  function overlayProcess(id, ctx, w, h, t, elapsed) {
    const p = Math.min(1, elapsed / 520);
    const cx = w / 2;
    const cy = h / 2;

    if (id === "voice") {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.004;
        const r = 6 + p * 20;
        glow(ctx, CYAN, 6);
        ctx.fillStyle = CYAN;
        ctx.globalAlpha = (1 - p) * 0.5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, 1.2, 0, 6.28);
        ctx.fill();
      }
    } else if (id === "trading") {
      glow(ctx, GOLD, 10);
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = p * 0.7;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * (1 - p), h * 0.48);
      ctx.lineTo(w * 0.5, h * 0.48);
      ctx.stroke();
    } else if (id === "automation") {
      for (let i = 0; i < 3; i++) {
        glow(ctx, CYAN, 8);
        ctx.strokeStyle = CYAN;
        ctx.globalAlpha = 0.3 + p * 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + i * 10 + p * 6, 0, 6.28);
        ctx.stroke();
      }
    } else {
      const sy = h * (0.1 + ((t * 0.0004 + elapsed * 0.001) % 0.75));
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      glow(ctx, CYAN, 10);
      ctx.fillStyle = "rgba(71,209,255,0.18)";
      ctx.fillRect(0, sy, w, 2);
      ctx.restore();
    }

    glow(ctx, GOLD, 8);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.28, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  function overlayConfirm(ctx, w, h, t, elapsed) {
    const p = Math.min(1, elapsed / 380);
    const cx = w / 2;
    const cy = h / 2;
    glow(ctx, GOLD, 12 + p * 8);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 1 - p * 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + p * 20, 0, 6.28);
    ctx.stroke();
    if (p > 0.3) {
      const a = Math.min(1, (p - 0.3) / 0.5);
      glow(ctx, CYAN, 10);
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.globalAlpha = a;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 1);
      ctx.lineTo(cx - 1, cy + 5);
      ctx.lineTo(cx + 7, cy - 6);
      ctx.stroke();
    }
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  function overlayConfirmed(ctx, w, h, t) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);
    glow(ctx, CYAN, 6 + pulse * 6);
    ctx.fillStyle = CYAN;
    ctx.globalAlpha = 0.28 + pulse * 0.22;
    ctx.beginPath();
    ctx.arc(w - 9, 9, 2 + pulse * 0.8, 0, 6.28);
    ctx.fill();
    clearGlow(ctx);
    ctx.globalAlpha = 1;
  }

  global.SCS_LANE_VIZ = {
    ids: Object.keys(DRAW),
    labels: LABELS,
    draw(id, t, cv) {
      const fn = DRAW[id] || DRAW.voice;
      fn(t, cv);
    },
    overlayProcess,
    overlayConfirm,
    overlayConfirmed,
  };
})(typeof window !== "undefined" ? window : globalThis);
