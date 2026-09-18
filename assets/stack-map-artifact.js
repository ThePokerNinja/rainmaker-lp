/**
 * Personalized "Stack Map" PNG for constellation unlock (1080�1350).
 */
(function (global) {
  const W = 1080;
  const H = 1350;
  const GOLD = "#FFB347";
  const CYAN = "#47D1FF";
  const INK = "#ECE6DB";
  const INK_MUTED = "rgba(236,230,219,.55)";
  const BG = "#02000B";

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`logo load failed: ${url}`));
      img.src = url;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function truncate(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let out = text;
    while (out.length > 1 && ctx.measureText(`${out}�`).width > maxW) out = out.slice(0, -1);
    return `${out}�`;
  }

  function formatDate() {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  /**
   * @param {object} opts
   * @param {string[]} opts.exploredIds
   * @param {string[]} opts.cardOrder
   * @param {object} opts.cards
   * @param {string[]} opts.laneIds
   * @param {object} opts.laneLabels
   * @param {string} opts.logoUrl
   * @param {string} opts.siteUrl
   * @param {string} opts.title
   */
  async function renderStackMapArtifact(opts) {
    const {
      exploredIds = [],
      cardOrder = [],
      cards = {},
      laneIds = [],
      laneLabels = {},
      logoUrl,
      siteUrl = "earlyaccess.michaelstewman.com",
      title = "Your stack map",
    } = opts;

    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0a0618");
    grad.addColorStop(0.45, BG);
    grad.addColorStop(1, "#010008");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,179,71,.22)";
    ctx.lineWidth = 2;
    roundRect(ctx, 36, 36, W - 72, H - 72, 24);
    ctx.stroke();

    let y = 88;

    if (logoUrl) {
      try {
        const logo = await loadImage(logoUrl);
        const maxLogoW = 220;
        const maxLogoH = 72;
        const scale = Math.min(1, maxLogoW / logo.width, maxLogoH / logo.height);
        const lw = logo.width * scale;
        const lh = logo.height * scale;
        ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
        y += lh + 36;
      } catch {
        y += 8;
      }
    }

    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = '600 52px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(title, W / 2, y);
    y += 36;

    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(formatDate(), W / 2, y);
    y += 56;

    ctx.textAlign = "left";
    ctx.fillStyle = GOLD;
    ctx.font = '600 14px "Consolas", "Segoe UI Mono", monospace';
    ctx.fillText("SIX SIGNALS EXPLORED", 80, y);
    y += 28;

    const rowH = 88;
    const ids = cardOrder.filter((id) => exploredIds.includes(id));
    ids.forEach((id, i) => {
      const card = cards[id] || {};
      const ry = y + i * rowH;

      ctx.fillStyle = i % 2 === 0 ? "rgba(255,179,71,.06)" : "rgba(71,209,255,.04)";
      roundRect(ctx, 72, ry - 28, W - 144, rowH - 12, 12);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,.28)";
      ctx.font = '500 18px "Consolas", monospace';
      ctx.fillText(card.num || String(i + 1).padStart(2, "0"), 96, ry + 8);

      ctx.fillStyle = INK;
      ctx.font = '600 26px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, card.title || id, 360), 148, ry + 4);

      ctx.textAlign = "right";
      ctx.fillStyle = GOLD;
      ctx.font = '600 24px "Consolas", monospace';
      ctx.fillText(truncate(ctx, card.heroMetric || "", 280), W - 96, ry + 8);
      ctx.textAlign = "left";
    });

    y += ids.length * rowH + 24;

    ctx.fillStyle = CYAN;
    ctx.font = '600 14px "Consolas", "Segoe UI Mono", monospace';
    ctx.fillText("PRIORITY LANES FOR YOUR COHORT", 80, y);
    y += 36;

    const laneNames = laneIds.map((id) => laneLabels[id] || id);
    if (laneNames.length) {
      ctx.font = '500 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = INK;
      const laneLine = laneNames.join("  �  ");
      ctx.fillText(truncate(ctx, laneLine, W - 160), 80, y);
    } else {
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillText("Explore the form below to choose lanes manually.", 80, y);
    }
    y += 72;

    ctx.strokeStyle = "rgba(255,179,71,.18)";
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(W - 80, y);
    ctx.stroke();
    y += 40;

    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = '500 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Continue to early access", W / 2, y);
    y += 34;

    ctx.fillStyle = GOLD;
    ctx.font = '600 24px "Consolas", monospace';
    ctx.fillText(siteUrl.replace(/^https?:\/\//, ""), W / 2, y);
    y += 48;

    ctx.fillStyle = "rgba(236,230,219,.38)";
    ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Private session artifact � not a contract or quote", W / 2, H - 72);

    return cv;
  }

  function downloadStackMap(canvas, filename) {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename || "santa-cruz-studios-stack-map.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  global.SCS_STACK_MAP = {
    W,
    H,
    renderStackMapArtifact,
    downloadStackMap,
  };
})(typeof window !== "undefined" ? window : globalThis);
