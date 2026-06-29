/**
 * SCS Platform Magazine  Issue 01 PDF (10801350  5 pages).
 * Dynamic personalization from constellation exploration + magazine-issue-01-facts.json.
 */
(function (global) {
  const W = 1080;
  const H = 1350;
  const GOLD = "#E0B57E";
  const GOLD_HI = "#F6D6B8";
  const CYAN = "#47D1FF";
  const INK = "#ECE6DB";
  const INK_MUTED = "rgba(236,230,219,.58)";
  const BG = "#05001A";
  const BG_DEEP = "#02000B";

  const DEFAULT_FACTS = {
    issue: 1,
    title: "SCS Platform Magazine",
    subtitle: "AI Design in Enterprise",
    published: "June 2026",
    disclaimer: "Planning research  Not investment advice  Estimates only",
    competitors: [],
    temperatureHeadline: "Crowded at the tool layer. Open at the orchestrated platform layer.",
    marketOpportunity: { headline: "", ranges: [], wedge: "" },
    craft: { principles: [], proTips: [] },
  };

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`image load failed: ${url}`));
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
    if (!text) return "";
    if (ctx.measureText(text).width <= maxW) return text;
    let out = text;
    while (out.length > 1 && ctx.measureText(`${out}`).width > maxW) out = out.slice(0, -1);
    return `${out}`;
  }

  function wrapLines(ctx, text, maxW, maxLines) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
        if (lines.length >= maxLines - 1) break;
      } else {
        line = test;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (words.length && lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
      lines[maxLines - 1] = truncate(ctx, lines[maxLines - 1], maxW);
    }
    return lines;
  }

  function drawStarfield(ctx, seed) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W * 0.72, H * 0.12, 0, W * 0.5, H * 0.35, W * 0.85);
    grad.addColorStop(0, "rgba(255,179,71,.12)");
    grad.addColorStop(0.45, "rgba(13,4,30,.55)");
    grad.addColorStop(1, BG_DEEP);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 140; i++) {
      const x = ((seed + i * 7919) % 1000) / 1000 * W;
      const y = ((seed + i * 6271) % 1000) / 1000 * H;
      const r = 0.6 + ((i * 3) % 7) * 0.35;
      ctx.fillStyle = i % 5 === 0 ? "rgba(71,209,255,.55)" : "rgba(255,240,220,.45)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let b = 0; b < 6; b++) {
      const bx = W * (0.15 + b * 0.14);
      const by = H * (0.2 + (b % 3) * 0.22);
      const br = 80 + b * 28;
      const bokeh = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      bokeh.addColorStop(0, "rgba(120,80,180,.18)");
      bokeh.addColorStop(1, "rgba(5,0,26,0)");
      ctx.fillStyle = bokeh;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawGoldFrame(ctx) {
    ctx.strokeStyle = "rgba(224,181,126,.28)";
    ctx.lineWidth = 2;
    roundRect(ctx, 28, 28, W - 56, H - 56, 20);
    ctx.stroke();
    ctx.strokeStyle = "rgba(224,181,126,.1)";
    roundRect(ctx, 40, 40, W - 80, H - 80, 16);
    ctx.stroke();
  }

  function drawSeigaiha(ctx, yBase) {
    ctx.strokeStyle = "rgba(224,181,126,.14)";
    ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 14; col++) {
        const cx = col * 78 + 40;
        const cy = yBase + row * 36;
        for (let a = 0; a < 3; a++) {
          ctx.beginPath();
          ctx.arc(cx, cy, 12 + a * 10, Math.PI, 0);
          ctx.stroke();
        }
      }
    }
  }

  function drawFullBleedPlate(ctx, hue) {
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, "rgba(5,0,26,0)");
    g.addColorStop(0.35, `rgba(${hue},0.35)`);
    g.addColorStop(1, `rgba(${hue},0.72)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.42, W, H * 0.58);
    ctx.fillStyle = "rgba(255,255,255,.04)";
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(60 + i * 82, H * 0.48 + (i % 3) * 40, 64, 120 + (i % 4) * 30);
    }
  }

  function heatColor(heat) {
    if (heat === "hot") return GOLD_HI;
    if (heat === "warm") return GOLD;
    return CYAN;
  }

  function exploredGlyphStrip(ctx, exploredIds, cards, y) {
    const ids = exploredIds.slice(0, 6);
    const gap = 12;
    const chipW = Math.min(140, (W - 160 - gap * (ids.length - 1)) / Math.max(ids.length, 1));
    let x = 80;
    ids.forEach((id, i) => {
      const card = cards[id] || {};
      ctx.fillStyle = i % 2 ? "rgba(71,209,255,.12)" : "rgba(255,179,71,.14)";
      roundRect(ctx, x, y, chipW, 36, 8);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(truncate(ctx, card.title || id, chipW - 16), x + chipW / 2, y + 24);
      x += chipW + gap;
    });
    ctx.textAlign = "left";
  }

  async function renderCoverPage(opts) {
    const { facts, exploredIds, cards, logoUrl, laneIds, laneLabels } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawStarfield(ctx, 42);
    drawFullBleedPlate(ctx, "40,20,80");
    drawGoldFrame(ctx);
    drawSeigaiha(ctx, H - 180);

    if (logoUrl) {
      try {
        const logo = await loadImage(logoUrl);
        const lw = Math.min(200, logo.width);
        const lh = (logo.height / logo.width) * lw;
        ctx.drawImage(logo, (W - lw) / 2, 72, lw, lh);
      } catch {
        /* optional */
      }
    }

    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    ctx.font = '500 14px "Consolas", monospace';
    ctx.fillText("SCS PLATFORM MAGAZINE", W / 2, 200);
    ctx.font = '300 52px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText(`Issue ${String(facts.issue || 1).padStart(2, "0")}`, W / 2, 280);
    ctx.font = '400 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = GOLD_HI;
    wrapLines(ctx, facts.subtitle || "AI Design in Enterprise", W - 160, 2).forEach((ln, i) => {
      ctx.fillText(ln, W / 2, 360 + i * 44);
    });
    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(facts.published || "", W / 2, 480);

    if (exploredIds.length) {
      ctx.fillStyle = CYAN;
      ctx.font = '600 12px "Consolas", monospace';
      ctx.fillText("YOUR SESSION SIGNALS", W / 2, 560);
      exploredGlyphStrip(ctx, exploredIds, cards, 580);
    }

    if (laneIds.length) {
      const names = laneIds.map((id) => laneLabels[id] || id).join("  ");
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, names, W - 120), W / 2, 680);
    }

    ctx.fillStyle = "rgba(236,230,219,.35)";
    ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(facts.disclaimer || "", W / 2, H - 64);
    ctx.textAlign = "left";
    return cv;
  }

  function renderTemperaturePage(opts) {
    const { facts, exploredIds, laneLabels, laneIds } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawStarfield(ctx, 88);
    drawFullBleedPlate(ctx, "30,60,120");
    drawGoldFrame(ctx);

    ctx.fillStyle = CYAN;
    ctx.font = '600 13px "Consolas", monospace';
    ctx.fillText("02  TEMPERATURE CHECK", 72, 88);
    ctx.fillStyle = INK;
    ctx.font = '600 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Competitive landscape", 72, 140);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 22px "Segoe UI", system-ui, sans-serif';
    wrapLines(ctx, facts.temperatureHeadline || "", W - 144, 2).forEach((ln, i) => {
      ctx.fillText(ln, 72, 190 + i * 30);
    });

    const comps = facts.competitors || [];
    let y = 280;
    comps.slice(0, 4).forEach((c, i) => {
      ctx.fillStyle = i % 2 ? "rgba(71,209,255,.06)" : "rgba(255,179,71,.08)";
      roundRect(ctx, 56, y, W - 112, 118, 14);
      ctx.fill();
      ctx.fillStyle = heatColor(c.heat);
      ctx.font = '600 11px "Consolas", monospace';
      ctx.fillText((c.heat || "warm").toUpperCase(), 80, y + 28);
      ctx.fillStyle = INK;
      ctx.font = '600 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, c.category || "", 420), 80, y + 58);
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, c.players || "", W - 160), 80, y + 88);
      ctx.textAlign = "right";
      ctx.fillStyle = GOLD;
      ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
      wrapLines(ctx, c.gap || "", 280, 2).forEach((ln, j) => {
        ctx.fillText(ln, W - 72, y + 52 + j * 22);
      });
      ctx.textAlign = "left";
      y += 132;
    });

    const laneHint =
      laneIds.length && exploredIds.length
        ? `You explored ${exploredIds.length} signals  priority: ${laneIds.map((id) => laneLabels[id] || id).join(", ")}`
        : "";
    if (laneHint) {
      ctx.fillStyle = "rgba(71,209,255,.15)";
      roundRect(ctx, 56, H - 200, W - 112, 72, 12);
      ctx.fill();
      ctx.fillStyle = CYAN;
      ctx.font = '500 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, laneHint, W - 140), 80, H - 158);
    }

    ctx.fillStyle = "rgba(236,230,219,.32)";
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(facts.disclaimer || "", 72, H - 56);
    return cv;
  }

  function renderOpportunityPage(opts) {
    const { facts, laneIds, laneLabels } = opts;
    const mo = facts.marketOpportunity || {};
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawStarfield(ctx, 120);
    drawFullBleedPlate(ctx, "80,40,40");
    drawGoldFrame(ctx);

    ctx.fillStyle = GOLD;
    ctx.font = '600 13px "Consolas", monospace';
    ctx.fillText("03  MARKET OPPORTUNITY", 72, 88);
    ctx.fillStyle = INK;
    ctx.font = '600 40px "Segoe UI", system-ui, sans-serif';
    wrapLines(ctx, mo.headline || "AI-led design in enterprise", W - 144, 2).forEach((ln, i) => {
      ctx.fillText(ln, 72, 140 + i * 46);
    });

    const ranges = mo.ranges || [];
    let y = 280;
    ranges.forEach((r, i) => {
      const barW = 200 + i * 80;
      ctx.fillStyle = "rgba(255,179,71,.1)";
      roundRect(ctx, 72, y, W - 144, 100, 12);
      ctx.fill();
      ctx.fillStyle = GOLD_HI;
      ctx.font = '600 48px "Consolas", monospace';
      ctx.fillText(r.value || "", 96, y + 52);
      ctx.fillStyle = INK;
      ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(r.label || "", 96, y + 82);
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 17px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = "right";
      ctx.fillText(truncate(ctx, r.note || "", 360), W - 96, y + 52);
      ctx.textAlign = "left";
      y += 120;
    });

    ctx.fillStyle = "rgba(71,209,255,.12)";
    roundRect(ctx, 56, y + 24, W - 112, 120, 14);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '500 22px "Segoe UI", system-ui, sans-serif';
    wrapLines(ctx, mo.wedge || "", W - 140, 3).forEach((ln, i) => {
      ctx.fillText(ln, 80, y + 68 + i * 28);
    });

    if (laneIds.length) {
      ctx.fillStyle = CYAN;
      ctx.font = '600 12px "Consolas", monospace';
      ctx.fillText("YOUR COHORT PRIORITY BOOST", 72, H - 180);
      ctx.fillStyle = INK;
      ctx.font = '500 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(
        truncate(ctx, laneIds.map((id) => laneLabels[id] || id).join("    "), W - 144),
        72,
        H - 148,
      );
    }

    ctx.fillStyle = "rgba(236,230,219,.32)";
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(facts.disclaimer || "", 72, H - 56);
    return cv;
  }

  function renderCraftPage(opts) {
    const { facts, exploredDesign } = opts;
    const craft = facts.craft || {};
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawStarfield(ctx, 200);
    drawFullBleedPlate(ctx, "50,90,50");
    drawGoldFrame(ctx);

    ctx.fillStyle = GOLD;
    ctx.font = '600 13px "Consolas", monospace';
    ctx.fillText("04  VIBE CODE CRAFT", 72, 88);
    ctx.fillStyle = INK;
    ctx.font = '600 44px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Principles & pro tips", 72, 140);
    if (exploredDesign) {
      ctx.fillStyle = CYAN;
      ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillText("Highlighted  you opened Design signals", 72, 178);
    }

    let y = 220;
    (craft.principles || []).slice(0, 2).forEach((p) => {
      ctx.fillStyle = "rgba(255,179,71,.08)";
      roundRect(ctx, 56, y, W - 112, 88, 10);
      ctx.fill();
      ctx.fillStyle = GOLD_HI;
      ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, p.title || "", W - 120), 80, y + 32);
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 17px "Segoe UI", system-ui, sans-serif';
      wrapLines(ctx, p.body || "", W - 140, 2).forEach((ln, i) => {
        ctx.fillText(ln, 80, y + 58 + i * 22);
      });
      y += 100;
    });

    (craft.proTips || []).slice(0, 3).forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "rgba(71,209,255,.1)" : "rgba(255,255,255,.04)";
      roundRect(ctx, 56, y, W - 112, 72, 10);
      ctx.fill();
      ctx.fillStyle = CYAN;
      ctx.font = '600 11px "Consolas", monospace';
      ctx.fillText(`PRO TIP ${i + 1}`, 80, y + 24);
      ctx.fillStyle = INK;
      ctx.font = '600 19px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, p.title || "", W - 120), 80, y + 48);
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, p.body || "", W - 140), 80, y + 68);
      y += 84;
    });

    drawSeigaiha(ctx, H - 120);
    ctx.fillStyle = "rgba(236,230,219,.32)";
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("From SCS platform harness  dogfooded patterns", 72, H - 56);
    return cv;
  }

  function renderYourReadPage(opts) {
    const {
      exploredIds,
      cardOrder,
      cards,
      laneIds,
      laneLabels,
      siteUrl,
      facts,
    } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawStarfield(ctx, 300);
    drawGoldFrame(ctx);

    ctx.fillStyle = CYAN;
    ctx.font = '600 13px "Consolas", monospace';
    ctx.fillText("05  YOUR READ", 72, 88);
    ctx.fillStyle = INK;
    ctx.font = '600 44px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Session summary", 72, 140);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Private artifact  no email stored on this PDF", 72, 178);

    ctx.fillStyle = GOLD;
    ctx.font = '600 12px "Consolas", monospace';
    ctx.fillText("SIX SIGNALS EXPLORED", 72, 230);
    const ids = cardOrder.filter((id) => exploredIds.includes(id));
    let y = 258;
    const rowH = 72;
    ids.forEach((id, i) => {
      const card = cards[id] || {};
      ctx.fillStyle = i % 2 ? "rgba(71,209,255,.06)" : "rgba(255,179,71,.08)";
      roundRect(ctx, 56, y, W - 112, rowH - 8, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.font = '500 16px "Consolas", monospace';
      ctx.fillText(card.num || String(i + 1).padStart(2, "0"), 80, y + 38);
      ctx.fillStyle = INK;
      ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, card.title || id, 280), 128, y + 28);
      ctx.textAlign = "right";
      ctx.fillStyle = GOLD;
      ctx.font = '600 20px "Consolas", monospace';
      ctx.fillText(truncate(ctx, card.heroMetric || "", 240), W - 80, y + 38);
      ctx.textAlign = "left";
      y += rowH;
    });

    y += 16;
    ctx.fillStyle = CYAN;
    ctx.font = '600 12px "Consolas", monospace';
    ctx.fillText("PRIORITY LANES FOR YOUR COHORT", 72, y);
    y += 32;
    const laneNames = laneIds.map((id) => laneLabels[id] || id);
    if (laneNames.length) {
      ctx.fillStyle = INK;
      ctx.font = '500 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(truncate(ctx, laneNames.join("    "), W - 144), 72, y);
    } else {
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillText("Choose lanes on the early-access form below.", 72, y);
    }

    y += 56;
    ctx.strokeStyle = "rgba(255,179,71,.2)";
    ctx.beginPath();
    ctx.moveTo(72, y);
    ctx.lineTo(W - 72, y);
    ctx.stroke();
    y += 40;
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = '500 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillText("Continue to early access", W / 2, y);
    ctx.fillStyle = GOLD;
    ctx.font = '600 22px "Consolas", monospace';
    ctx.fillText(String(siteUrl || "earlyaccess.michaelstewman.com").replace(/^https?:\/\//, ""), W / 2, y + 36);
    ctx.fillStyle = "rgba(236,230,219,.35)";
    ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(facts.disclaimer || "", W / 2, H - 56);
    ctx.textAlign = "left";
    return cv;
  }

  async function canvasToJpegBytes(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("jpeg encode failed"));
            return;
          }
          blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)));
        },
        "image/jpeg",
        quality ?? 0.92,
      );
    });
  }

  async function canvasesToPdfBlob(canvases) {
    const PDFLib = global.PDFLib;
    if (!PDFLib || !PDFLib.PDFDocument) {
      throw new Error("PDFLib not loaded  include pdf-lib.min.js before platform-magazine-artifact.js");
    }
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (const cv of canvases) {
      const jpegBytes = await canvasToJpegBytes(cv);
      const img = await pdfDoc.embedJpg(jpegBytes);
      const page = pdfDoc.addPage([cv.width, cv.height]);
      page.drawImage(img, { x: 0, y: 0, width: cv.width, height: cv.height });
    }
    const bytes = await pdfDoc.save();
    return new Blob([bytes], { type: "application/pdf" });
  }

  /**
   * @param {object} opts
   * @param {object} [opts.facts]
   * @param {string[]} opts.exploredIds
   * @param {string[]} opts.cardOrder
   * @param {object} opts.cards
   * @param {string[]} opts.laneIds
   * @param {object} opts.laneLabels
   * @param {string} [opts.logoUrl]
   * @param {string} [opts.siteUrl]
   */
  async function renderPlatformMagazine(opts) {
    const facts = { ...DEFAULT_FACTS, ...(opts.facts || {}) };
    const exploredIds = opts.exploredIds || [];
    const cardOrder = opts.cardOrder || [];
    const cards = opts.cards || {};
    const laneIds = opts.laneIds || [];
    const laneLabels = opts.laneLabels || {};
    const exploredDesign =
      exploredIds.includes("radial") ||
      laneIds.includes("design") ||
      exploredIds.some((id) => id === "grid");

    const pages = [
      await renderCoverPage({ facts, exploredIds, cards, logoUrl: opts.logoUrl, laneIds, laneLabels }),
      renderTemperaturePage({ facts, exploredIds, laneIds, laneLabels }),
      renderOpportunityPage({ facts, laneIds, laneLabels }),
      renderCraftPage({ facts, exploredDesign }),
      renderYourReadPage({
        exploredIds,
        cardOrder,
        cards,
        laneIds,
        laneLabels,
        siteUrl: opts.siteUrl,
        facts,
      }),
    ];

    let pdfBlob = null;
    try {
      pdfBlob = await canvasesToPdfBlob(pages);
    } catch {
      pdfBlob = null;
    }

    return { canvases: pages, coverCanvas: pages[0], pdfBlob };
  }

  async function loadFacts(url) {
    const candidates = [
      url,
      "./assets/magazine-issue-01-facts.json",
      "../../assets/magazine-issue-01-facts.json",
    ].filter(Boolean);
    const seen = new Set();
    for (const u of candidates) {
      if (seen.has(u)) continue;
      seen.add(u);
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        const data = await res.json();
        return { ...DEFAULT_FACTS, ...data };
      } catch {
        /* try next */
      }
    }
    return { ...DEFAULT_FACTS };
  }

  function downloadPdfBlob(blob, filename) {
    if (!blob) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename || "scs-platform-magazine-issue-01.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCoverPng(canvas, filename) {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename || "scs-platform-magazine-cover.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function downloadPlatformMagazine(result, filename) {
    if (result?.pdfBlob) {
      downloadPdfBlob(result.pdfBlob, filename);
      return;
    }
    if (result?.coverCanvas) {
      downloadCoverPng(result.coverCanvas, (filename || "").replace(/\.pdf$/i, "-cover.png"));
    }
  }

  global.SCS_PLATFORM_MAGAZINE = {
    W,
    H,
    DEFAULT_FACTS,
    loadFacts,
    renderPlatformMagazine,
    downloadPlatformMagazine,
    downloadPdfBlob,
  };
})(typeof window !== "undefined" ? window : globalThis);
