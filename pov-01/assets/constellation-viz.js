/**
 * Constellation drawer micro-viz � shared by LP drawer and magazine PDF renders.
 * API: SCS_CONSTELLATION_VIZ.draw(type, ctx, w, h, timeMs)
 */
(function (global) {
  const GOLD = "#E0B57E";
  const GOLD_HI = "#F6D6B8";
  const CYAN = "#47D1FF";
  const INK = "rgba(236,230,219,.75)";

  const drawers = {
    "cost-stack"(ctx, w, h, t) {
      const tiers = [0.06, 0.1, 0.16, 0.3];
      const labels = ["Light", "Balanced", "Deep", "Staffed"];
      const colors = [CYAN, GOLD, GOLD_HI, "rgba(236,230,219,.22)"];
      const gap = w / (tiers.length + 1);
      tiers.forEach((v, i) => {
        const bh = (v / 0.32) * h * 0.58;
        const x = gap * (i + 1) - gap * 0.22;
        const y = h * 0.74 - bh;
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x, y, gap * 0.44, bh);
        ctx.globalAlpha = 0.75;
        ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = INK;
        ctx.textAlign = "center";
        ctx.fillText(labels[i], x + gap * 0.22, h * 0.84);
      });
      ctx.globalAlpha = 1;
    },
    "latency-waterfall"(ctx, w, h, t) {
      const stages = [
        { label: "STT", ms: 150, col: CYAN },
        { label: "EOU", ms: 350, col: GOLD },
        { label: "LLM", ms: 200, col: CYAN },
        { label: "TTS", ms: 200, col: GOLD_HI },
      ];
      let x = w * 0.06;
      const maxMs = 900;
      stages.forEach((s, i) => {
        const bw = (s.ms / maxMs) * w * 0.82;
        const pulse = 0.88 + 0.12 * Math.sin(t * 0.002 + i);
        ctx.fillStyle = s.col;
        ctx.globalAlpha = pulse;
        ctx.fillRect(x, h * 0.38, bw, h * 0.3);
        ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = INK;
        ctx.textAlign = "center";
        ctx.fillText(s.label, x + bw / 2, h * 0.76);
        ctx.fillText(`${s.ms}ms`, x + bw / 2, h * 0.22);
        x += bw + 8;
      });
      ctx.strokeStyle = GOLD_HI;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * 0.16);
      ctx.lineTo(w * 0.94, h * 0.16);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = GOLD_HI;
      ctx.textAlign = "right";
      ctx.fillText("800ms gate", w * 0.94, h * 0.1);
      ctx.globalAlpha = 1;
    },
    "pillar-orbit"(ctx, w, h, t) {
      const cx = w / 2;
      const cy = h / 2;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.0004;
        const r = Math.min(w, h) * 0.36;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r * 0.85;
        ctx.strokeStyle = i % 2 ? CYAN : GOLD;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, 6.28);
        ctx.fill();
      }
      ctx.fillStyle = GOLD_HI;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, 6.28);
      ctx.fill();
    },
    "cascade-wave"(ctx, w, h, t) {
      const mid = h * 0.5;
      [GOLD_HI, CYAN].forEach((col, ph) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = mid + Math.sin(x * 0.032 + t * 0.003 + ph) * h * 0.24;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
      ["Listen", "Think", "Reply"].forEach((lb, i) => {
        const x = ((i + 0.5) / 3) * w;
        ctx.fillStyle = INK;
        ctx.font = '400 10px Jost, system-ui, sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(lb, x, h * 0.84);
      });
      ctx.globalAlpha = 1;
    },
    "tier-heat"(ctx, w, h, t) {
      const cols = 14;
      const rows = 7;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const wave = Math.exp(-Math.pow((nx - 0.35 - Math.sin(t * 0.001) * 0.1) / 0.18, 2));
          if (wave < 0.12) continue;
          ctx.fillStyle = wave > 0.55 ? GOLD_HI : CYAN;
          ctx.globalAlpha = wave * 0.88;
          ctx.beginPath();
          ctx.arc((c + 0.5) * (w / cols), (r + 0.5) * (h / rows), 2.8, 0, 6.28);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
    "agent-portal"(ctx, w, h, t) {
      const cx = w / 2;
      const cy = h * 0.44;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002);
      [
        [38, GOLD, 0.28 + pulse * 0.18],
        [26, CYAN, 0.5],
        [15, GOLD_HI, 0.85],
      ].forEach(([rad, col, a]) => {
        ctx.strokeStyle = col;
        ctx.globalAlpha = a;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, 6.28);
        ctx.stroke();
      });
      ctx.fillStyle = INK;
      ctx.globalAlpha = 1;
      ctx.font = '500 12px Jost, system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Samuel", cx, h * 0.8);
    },
  };

  function draw(type, ctx, w, h, timeMs) {
    const fn = drawers[type];
    if (!fn) return;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    fn(ctx, w, h, timeMs ?? 0);
    ctx.restore();
  }

  global.SCS_CONSTELLATION_VIZ = { drawers, draw };
})(typeof window !== "undefined" ? window : globalThis);
