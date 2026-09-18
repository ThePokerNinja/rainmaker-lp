/**
 * SCS Platform Magazine � Issue 01
 * Travel-editorial layout (bold stacked type, section tags, multi-column, inset frames)
 * LP palette: indigo field, champagne gold, neon cyan, ink.
 */
(function (global) {
  const W = 1080;
  const H = 1350;
  const GOLD = "#E0B57E";
  const GOLD_HI = "#F6D6B8";
  const GOLD_LO = "#A8865A";
  const NEON_GOLD = "#FFB347";
  const CYAN = "#47D1FF";
  const INK = "#ECE6DB";
  const INK_MUTED = "rgba(236,230,219,.55)";
  const INK_FAINT = "rgba(236,230,219,.38)";
  const INDIGO = "#0A0428";
  const MID = "#05001A";
  const DEEP = "#02000B";
  const PANEL = "rgba(255,255,255,.05)";
  const M = 56;
  const G = 20;

  const CARD_LANES = {
    bar: ["growth", "automation"],
    aura: ["voice"],
    wave: ["voice", "content"],
    radial: ["design"],
    grid: ["automation", "trading"],
    sam: ["voice", "sales"],
  };

  const DEFAULT_FACTS = {
    issue: 1,
    subtitle: "Your platform read",
    published: "June 2026",
    disclaimer: "Private session artifact � Planning estimates � Not investment advice",
    hook: "You stress-tested six signals�not a slide deck. This is what they add up to.",
    building: "",
    plates: {},
    headlineStackByLane: { default: ["your", "platform", "read"] },
    thesisByPrimaryLane: { default: "" },
    laneCta: {},
  };

  const PLATE_FALLBACKS = {
    cover: ["/artifacts/pov-brand-01/board/4x5/f1.png", "./assets/magazine-f1.png"],
    editorial: ["/artifacts/pov-brand-01/board/4x5/f2.png", "./assets/magazine-f2.png"],
    payoff: ["/artifacts/pov-brand-01/board/4x5/f4.png", "./assets/magazine-f4.png"],
  };

  async function ensureFonts() {
    if (!document.fonts) return;
    await Promise.all([
      document.fonts.load('700 120px Jost'),
      document.fonts.load('600 72px Jost'),
      document.fonts.load('400 24px Jost'),
      document.fonts.load('400 16px Jost'),
      document.fonts.load('500 11px "IBM Plex Mono"'),
    ]);
    await document.fonts.ready;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`image: ${url}`));
      img.src = url;
    });
  }

  async function loadPlate(kind, facts) {
    const candidates = [facts.plates?.[kind], ...(PLATE_FALLBACKS[kind] || [])].filter(Boolean);
    for (const u of [...new Set(candidates)]) {
      try {
        return await loadImage(u);
      } catch {
        /* next */
      }
    }
    return null;
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
    if (!text || ctx.measureText(text).width <= maxW) return text || "";
    let out = text;
    while (out.length > 1 && ctx.measureText(`${out}\u2026`).width > maxW) out = out.slice(0, -1);
    return `${out}\u2026`;
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
      } else line = test;
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (words.join(" ").length > lines.join(" ").length && lines.length) {
      lines[lines.length - 1] = truncate(ctx, lines[lines.length - 1], maxW);
    }
    return lines;
  }

  function drawAtmosphere(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#120830");
    g.addColorStop(0.35, MID);
    g.addColorStop(1, DEEP);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.75, H * 0.08, 0, W * 0.5, H * 0.2, W);
    glow.addColorStop(0, "rgba(71,209,255,.12)");
    glow.addColorStop(0.5, "rgba(40,18,74,.25)");
    glow.addColorStop(1, "rgba(5,0,26,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const x = ((i * 6271) % 997) / 997 * W;
      const y = ((i * 7919) % 997) / 997 * H * 0.65;
      ctx.fillStyle = i % 9 === 0 ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.18)";
      ctx.beginPath();
      ctx.arc(x, y, i % 5 === 0 ? 1.2 : 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSectionTag(ctx, text, x, y, w, align) {
    ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
    const tw = ctx.measureText(text).width + 28;
    const tx = align === "right" ? x + w - tw : x;
    ctx.fillStyle = INDIGO;
    ctx.fillRect(tx, y, tw, 32);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, y + 0.5, tw - 1, 31);
    ctx.fillStyle = GOLD_HI;
    ctx.textAlign = "left";
    ctx.fillText(text, tx + 14, y + 21);
  }

  function drawStackedHeadline(ctx, lines, x, y, sizes, weights, colors) {
    let cy = y;
    lines.forEach((ln, i) => {
      const sz = sizes[i] || sizes[sizes.length - 1];
      const wt = weights[i] || 700;
      ctx.font = `${wt} ${sz}px Jost, system-ui, sans-serif`;
      ctx.fillStyle = colors[i] || INK;
      ctx.textAlign = "left";
      ctx.fillText(ln, x, cy);
      cy += sz * 0.92;
    });
    return cy;
  }

  function drawInsetFrame(ctx, x, y, w, h, r, borderW) {
    ctx.fillStyle = PANEL;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = "rgba(236,230,219,.85)";
    ctx.lineWidth = borderW || 2;
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1);
    ctx.stroke();
  }

  function drawImageCover(ctx, img, x, y, w, h) {
    const sc = Math.max(w / img.width, h / img.height);
    const dw = img.width * sc;
    const dh = img.height * sc;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function drawViz(type, ctx, x, y, w, h, t) {
    const fn = global.SCS_CONSTELLATION_VIZ?.draw;
    if (!fn) return;
    ctx.save();
    ctx.translate(x, y);
    fn(type, ctx, w, h, t ?? 1200);
    ctx.restore();
  }

  function drawPageNum(ctx, n, total) {
    ctx.fillStyle = INK_FAINT;
    ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = "right";
    ctx.fillText(`${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, W - M, H - 28);
    ctx.textAlign = "left";
  }

  function drawColumns(ctx, paragraphs, x, y, colW, cols, gap, lineH, maxLinesPerCol) {
    const allLines = [];
    ctx.font = '400 16px Jost, system-ui, sans-serif';
    paragraphs.forEach((p) => {
      wrapLines(ctx, p, colW, maxLinesPerCol).forEach((ln) => allLines.push(ln));
      allLines.push("");
    });
    let col = 0;
    let cy = y;
    allLines.forEach((ln) => {
      if (ln === "" && cy === y) return;
      if (cy > y + maxLinesPerCol * lineH) {
        col++;
        cy = y;
      }
      if (col >= cols) return;
      ctx.fillStyle = INK_MUTED;
      ctx.fillText(ln, x + col * (colW + gap), cy);
      cy += lineH;
    });
    return y + maxLinesPerCol * lineH;
  }

  function buildThesis(facts, laneIds) {
    const m = facts.thesisByPrimaryLane || {};
    return (laneIds[0] && m[laneIds[0]]) || m.default || "";
  }

  function buildHeadlineStack(facts, laneIds) {
    const m = facts.headlineStackByLane || {};
    return (laneIds[0] && m[laneIds[0]]) || m.default || ["your", "platform", "read"];
  }

  function pickPrimaryCard(laneIds, exploredIds) {
    for (const lane of laneIds) {
      const m = exploredIds.find((id) => CARD_LANES[id]?.includes(lane));
      if (m) return m;
    }
    return exploredIds[0] || "aura";
  }

  function orderedExplored(exploredIds, cardOrder) {
    const set = new Set(exploredIds);
    const o = cardOrder.filter((id) => set.has(id));
    exploredIds.forEach((id) => {
      if (!o.includes(id)) o.push(id);
    });
    return o;
  }

  /** Page 1 � Cover: travel-mag bold stacked type on atmospheric field */
  async function renderCoverPage(opts) {
    const { facts, exploredIds, cards, cardOrder, logoUrl, laneIds, laneLabels } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");

    const plate = await loadPlate("cover", facts);
    if (plate) {
      drawImageCover(ctx, plate, 0, 0, W, H);
      ctx.fillStyle = "rgba(5,0,26,.42)";
      ctx.fillRect(0, 0, W, H);
    } else drawAtmosphere(ctx);

    drawSectionTag(ctx, "ISSUE 01", W - M - 200, M, 200, "right");
    drawSectionTag(ctx, "PLATFORM READ", M, M, 220, "left");

    ctx.fillStyle = INK_FAINT;
    ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(`VOL ${facts.issue || 1}  �  ${facts.published || ""}`, M, M + 52);
    ctx.fillText("SANTA CRUZ STUDIOS", M, M + 68);

    const stack = buildHeadlineStack(facts, laneIds);
    drawStackedHeadline(
      ctx,
      stack,
      M,
      H * 0.38,
      [52, 108, 108],
      [400, 700, 700],
      [INK_MUTED, INK, GOLD_HI],
    );

    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 20px Jost, system-ui, sans-serif';
    wrapLines(ctx, facts.hook || "", W * 0.55, 3).forEach((ln, i) => {
      ctx.fillText(ln, M, H * 0.72 + i * 28);
    });

    const primaryId = pickPrimaryCard(laneIds, exploredIds);
    const primary = cards[primaryId] || {};
    const insetX = W - M - 340;
    const insetY = H * 0.58;
    drawInsetFrame(ctx, insetX, insetY, 340, 260, 4, 2);
    ctx.save();
    roundRect(ctx, insetX + 8, insetY + 8, 324, 180, 2);
    ctx.clip();
    ctx.fillStyle = DEEP;
    ctx.fillRect(insetX + 8, insetY + 8, 324, 180);
    drawViz(primary.vizType || "latency-waterfall", ctx, insetX + 16, insetY + 16, 308, 164);
    ctx.restore();
    ctx.fillStyle = GOLD_HI;
    ctx.font = '700 28px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(primary.heroMetric || "", insetX + 16, insetY + 218);
    ctx.fillStyle = INK;
    ctx.font = '600 14px Jost, system-ui, sans-serif';
    ctx.fillText((primary.title || primaryId).toUpperCase(), insetX + 16, insetY + 244);

    if (logoUrl) {
      try {
        const logo = await loadImage(logoUrl);
        const lw = Math.min(100, logo.width);
        ctx.drawImage(logo, W - M - lw, H - M - 48, lw, (logo.height / logo.width) * lw);
      } catch {
        /* optional */
      }
    }

    const ids = orderedExplored(exploredIds, cardOrder).slice(0, 6);
    if (ids.length) {
      ctx.fillStyle = INK_FAINT;
      ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText("SIX SIGNALS", M, H - M - 16);
      let sx = M;
      ids.forEach((id, i) => {
        const t = (cards[id] || {}).title || id;
        ctx.fillStyle = i % 2 ? CYAN : GOLD;
        ctx.font = '600 12px Jost, system-ui, sans-serif';
        ctx.fillText(t.toUpperCase(), sx, H - M + 4);
        sx += ctx.measureText(t.toUpperCase()).width + 18;
      });
    }

    if (laneIds.length) {
      ctx.textAlign = "right";
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 14px Jost, system-ui, sans-serif';
      ctx.fillText(
        laneIds.map((id) => laneLabels[id] || id).join("  �  "),
        W - M,
        H - M + 4,
      );
      ctx.textAlign = "left";
    }

    drawPageNum(ctx, 1, 4);
    return cv;
  }

  /** Page 2 � Feature spread: stacked headline + pull quote + 3-col + inset viz */
  async function renderFeaturePage(opts) {
    const { facts, exploredIds, cards, cardOrder, laneIds, laneLabels } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawAtmosphere(ctx);

    const primaryId = pickPrimaryCard(laneIds, exploredIds);
    const primary = cards[primaryId] || {};
    const stack = buildHeadlineStack(facts, laneIds);
    const laneLine = laneIds.map((id) => (laneLabels[id] || id).toUpperCase()).join("  �  ");

    drawSectionTag(ctx, "THE INSIGHT", M, M, 180, "left");
    drawSectionTag(ctx, laneLine.slice(0, 28), W - M - 320, M, 320, "right");

    drawStackedHeadline(ctx, stack, M, M + 72, [44, 88, 88], [400, 700, 700], [INK_MUTED, INK, GOLD_HI]);

    ctx.fillStyle = CYAN;
    ctx.font = 'italic 400 26px Jost, system-ui, sans-serif';
    const pull = primary.insight || buildThesis(facts, laneIds);
    wrapLines(ctx, pull, W - M * 2 - 380, 4).forEach((ln, i) => {
      ctx.fillText(ln, M, M + 340 + i * 34);
    });

    const colY = M + 480;
    const colW = (W - M * 2 - G * 2) / 3;
    const paras = [facts.hook || "", buildThesis(facts, laneIds), facts.building || ""];
    drawColumns(ctx, paras, M, colY, colW, 3, G, 24, 8);

    const ix = W - M - 360;
    const iy = M + 72;
    drawInsetFrame(ctx, ix, iy, 360, 280, 4, 2);
    ctx.save();
    roundRect(ctx, ix + 10, iy + 10, 340, 200, 2);
    ctx.clip();
    ctx.fillStyle = DEEP;
    ctx.fillRect(ix + 10, iy + 10, 340, 200);
    drawViz(primary.vizType || "latency-waterfall", ctx, ix + 18, iy + 18, 324, 184);
    ctx.restore();
    ctx.fillStyle = GOLD_HI;
    ctx.font = '700 36px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(primary.heroMetric || "", ix + 16, iy + 248);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 13px Jost, system-ui, sans-serif';
    ctx.fillText(primary.subtitle || "", ix + 16, iy + 268);

    const editorial = await loadPlate("editorial", facts);
    const ex = M;
    const ey = H - M - 320;
    drawInsetFrame(ctx, ex, ey, 480, 320, 4, 2);
    if (editorial) {
      ctx.save();
      roundRect(ctx, ex + 8, ey + 8, 464, 304, 2);
      ctx.clip();
      drawImageCover(ctx, editorial, ex + 8, ey + 8, 464, 304);
      ctx.restore();
    }

    const payoff = await loadPlate("payoff", facts);
    if (payoff) {
      drawInsetFrame(ctx, ex + 500, ey, W - M - ex - 500, 320, 4, 2);
      ctx.save();
      const px = ex + 508;
      roundRect(ctx, px, ey + 8, W - M - px - 8, 304, 2);
      ctx.clip();
      drawImageCover(ctx, payoff, px, ey + 8, W - M - px - 8, 304);
      ctx.restore();
    }

    drawPageNum(ctx, 2, 4);
    return cv;
  }

  /** Page 3 � Six signals grid (explore /01 style) */
  async function renderSignalsPage(opts) {
    const { facts, exploredIds, cards, cardOrder } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawAtmosphere(ctx);

    ctx.fillStyle = INK_FAINT;
    ctx.font = '700 140px Jost, system-ui, sans-serif';
    ctx.fillText("/01", M, M + 120);
    ctx.fillStyle = INK;
    ctx.font = '700 52px Jost, system-ui, sans-serif';
    ctx.fillText("SIX", M + 200, M + 72);
    ctx.fillText("SIGNALS", M + 200, M + 132);
    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 18px Jost, system-ui, sans-serif';
    ctx.fillText("What your session proved", M + 200, M + 162);

    const ids = orderedExplored(exploredIds, cardOrder).slice(0, 6);
    const cols = 3;
    const rows = 2;
    const gridTop = M + 200;
    const gridH = H - gridTop - M - 40;
    const cellW = (W - M * 2 - G * (cols - 1)) / cols;
    const cellH = (gridH - G) / rows;

    ids.forEach((id, i) => {
      const card = cards[id] || {};
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = M + col * (cellW + G);
      const cy = gridTop + row * (cellH + G);

      ctx.fillStyle = "rgba(8,4,24,.72)";
      roundRect(ctx, cx, cy, cellW, cellH, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(224,181,126,.18)";
      ctx.lineWidth = 1;
      roundRect(ctx, cx + 0.5, cy + 0.5, cellW - 1, cellH - 1, 8);
      ctx.stroke();

      ctx.strokeStyle = "rgba(236,230,219,.25)";
      ctx.strokeRect(cx + 14, cy + 14, 28, 22);
      ctx.fillStyle = INK_FAINT;
      ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText(card.num || String(i + 1).padStart(2, "0"), cx + 22, cy + 29);

      const vh = cellH * 0.48;
      ctx.save();
      roundRect(ctx, cx + 12, cy + 44, cellW - 24, vh, 4);
      ctx.clip();
      ctx.fillStyle = DEEP;
      ctx.fillRect(cx + 12, cy + 44, cellW - 24, vh);
      drawViz(card.vizType || "cost-stack", ctx, cx + 16, cy + 48, cellW - 32, vh - 8, 800 + i * 200);
      ctx.restore();

      const divY = cy + 44 + vh + 16;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 20, divY);
      ctx.lineTo(cx + cellW - 20, divY);
      ctx.stroke();
      ctx.fillStyle = GOLD_HI;
      ctx.beginPath();
      ctx.arc(cx + cellW / 2, divY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = GOLD_HI;
      ctx.font = '700 22px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText(card.heroMetric || "", cx + 16, divY + 32);
      ctx.fillStyle = INK;
      ctx.font = '700 18px Jost, system-ui, sans-serif';
      ctx.fillText((card.title || id).toUpperCase(), cx + 16, divY + 56);
      ctx.fillStyle = INK_MUTED;
      ctx.font = '500 11px Jost, system-ui, sans-serif';
      ctx.fillText(truncate(ctx, (card.subtitle || "").toUpperCase(), cellW - 32), cx + 16, divY + 76);
    });

    drawPageNum(ctx, 3, 4);
    return cv;
  }

  /** Page 4 � Masthead / early access */
  async function renderAccessPage(opts) {
    const { facts, laneIds, laneLabels, siteUrl } = opts;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    drawAtmosphere(ctx);

    ctx.fillStyle = INK_FAINT;
    ctx.font = '700 140px Jost, system-ui, sans-serif';
    ctx.fillText("/02", M, M + 120);

    drawStackedHeadline(
      ctx,
      ["early", "access"],
      M + 180,
      M + 40,
      [48, 112],
      [400, 700],
      [INK_MUTED, GOLD_HI],
    );

    ctx.fillStyle = INK_MUTED;
    ctx.font = '400 18px Jost, system-ui, sans-serif';
    ctx.fillText("Your priority lanes from this session", M + 180, M + 200);

    const laneMap = facts.laneCta || {};
    const cols = Math.min(laneIds.length, 4);
    const colW = (W - M * 2 - G * (cols - 1)) / Math.max(cols, 1);
    laneIds.slice(0, 4).forEach((id, i) => {
      const x = M + i * (colW + G);
      const y = M + 240;
      ctx.fillStyle = CYAN;
      ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText((laneLabels[id] || id).toUpperCase(), x, y);
      ctx.fillStyle = INK_MUTED;
      ctx.font = '400 15px Jost, system-ui, sans-serif';
      wrapLines(ctx, laneMap[id] || "", colW, 6).forEach((ln, j) => {
        ctx.fillText(ln, x, y + 28 + j * 22);
      });
    });

    ctx.strokeStyle = "rgba(224,181,126,.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, H * 0.55);
    ctx.lineTo(W - M, H * 0.55);
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = '700 64px Jost, system-ui, sans-serif';
    ctx.fillText("CONTINUE", M, H * 0.62);
    ctx.fillStyle = GOLD_HI;
    ctx.fillText("TO EARLY ACCESS", M, H * 0.62 + 68);

    ctx.fillStyle = NEON_GOLD;
    ctx.font = '600 22px "IBM Plex Mono", ui-monospace, monospace';
    const url = String(siteUrl || "earlyaccess.michaelstewman.com").replace(/^https?:\/\//, "");
    ctx.fillText(url, M, H * 0.62 + 120);

    ctx.fillStyle = INK_FAINT;
    ctx.font = '400 14px Jost, system-ui, sans-serif';
    wrapLines(ctx, facts.disclaimer || "", W - M * 2, 2).forEach((ln, i) => {
      ctx.fillText(ln, M, H - M - 20 + i * 20);
    });

    drawPageNum(ctx, 4, 4);
    return cv;
  }

  async function canvasToJpegBytes(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("jpeg encode failed"));
          blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)));
        },
        "image/jpeg",
        quality ?? 0.94,
      );
    });
  }

  async function canvasesToPdfBlob(canvases) {
    const PDFLib = global.PDFLib;
    if (!PDFLib?.PDFDocument) throw new Error("PDFLib not loaded");
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (const cv of canvases) {
      const jpegBytes = await canvasToJpegBytes(cv);
      const img = await pdfDoc.embedJpg(jpegBytes);
      const page = pdfDoc.addPage([cv.width, cv.height]);
      page.drawImage(img, { x: 0, y: 0, width: cv.width, height: cv.height });
    }
    return new Blob([await pdfDoc.save()], { type: "application/pdf" });
  }

  async function renderPlatformMagazine(opts) {
    await ensureFonts();
    const facts = { ...DEFAULT_FACTS, ...(opts.facts || {}) };
    const exploredIds = opts.exploredIds || [];
    const cardOrder = opts.cardOrder || [];
    const cards = opts.cards || {};
    const laneIds = opts.laneIds || [];
    const laneLabels = opts.laneLabels || {};
    const base = {
      facts,
      exploredIds,
      cardOrder,
      cards,
      laneIds,
      laneLabels,
      logoUrl: opts.logoUrl,
      siteUrl: opts.siteUrl,
    };

    const pages = [
      await renderCoverPage(base),
      await renderFeaturePage(base),
      await renderSignalsPage(base),
      await renderAccessPage(base),
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
    for (const u of [url, "./assets/magazine-issue-01-facts.json", "../../assets/magazine-issue-01-facts.json"].filter(Boolean)) {
      try {
        const res = await fetch(u);
        if (res.ok) return { ...DEFAULT_FACTS, ...(await res.json()) };
      } catch {
        /* next */
      }
    }
    return { ...DEFAULT_FACTS };
  }

  function downloadPdfBlob(blob, filename) {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "scs-platform-magazine-issue-01.pdf";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function downloadPlatformMagazine(result, filename) {
    if (result?.pdfBlob) downloadPdfBlob(result.pdfBlob, filename);
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
