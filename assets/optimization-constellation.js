/**
 * LP optimization constellation: drawer payoff, graph coupling, 6/6 easter egg.
 */
(function (global) {
  const GOLD = "#FFB347";
  const CYAN = "#47D1FF";
  const CARD_ORDER = ["bar", "aura", "radial", "wave", "grid", "sam"];
  const RING_EDGES = [
    ["bar", "aura"],
    ["aura", "radial"],
    ["radial", "wave"],
    ["wave", "grid"],
    ["grid", "sam"],
    ["sam", "bar"],
  ];
  const CROSS_EDGES = [
    ["aura", "wave"],
    ["radial", "sam"],
    ["bar", "grid"],
  ];
  const ALL_EDGES = RING_EDGES.concat(CROSS_EDGES);

  function edgeKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function rowsHtml(rows, valueKey) {
    return rows
      .map(
        (r) =>
          `<tr><td>${esc(r.tier || r.label)}</td><td>${esc(r[valueKey] || r.value)}</td>${
            r.note ? `<td class="opt-drawer__note-col">${esc(r.note)}</td>` : ""
          }</tr>`
      )
      .join("");
  }

  const DRAWER_VIZ = {
    "cost-stack"(ctx, w, h, t) {
      const tiers = [0.06, 0.1, 0.16, 0.3];
      const labels = ["Budget", "Balanced", "Premium", "S2S"];
      const colors = [CYAN, GOLD, GOLD, "rgba(236,230,219,.25)"];
      const gap = w / (tiers.length + 1);
      tiers.forEach((v, i) => {
        const bh = (v / 0.32) * h * 0.55;
        const x = gap * (i + 1) - gap * 0.22;
        const y = h * 0.72 - bh;
        ctx.fillStyle = colors[i];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, gap * 0.44, bh);
        ctx.globalAlpha = 0.7;
        ctx.font = "9px ui-monospace,monospace";
        ctx.fillStyle = "rgba(236,230,219,.7)";
        ctx.textAlign = "center";
        ctx.fillText(labels[i], x + gap * 0.22, h * 0.82);
      });
      ctx.globalAlpha = 1;
    },
    "latency-waterfall"(ctx, w, h, t) {
      const stages = [
        { label: "STT", ms: 150, col: CYAN },
        { label: "EOU", ms: 350, col: GOLD },
        { label: "LLM", ms: 200, col: CYAN },
        { label: "TTS", ms: 200, col: GOLD },
      ];
      let x = w * 0.08;
      const maxMs = 900;
      stages.forEach((s, i) => {
        const bw = (s.ms / maxMs) * w * 0.78;
        const pulse = 0.85 + 0.15 * Math.sin(t * 0.002 + i);
        ctx.fillStyle = s.col;
        ctx.globalAlpha = pulse;
        ctx.fillRect(x, h * 0.35, bw, h * 0.28);
        ctx.font = "9px ui-monospace,monospace";
        ctx.fillStyle = "rgba(236,230,219,.75)";
        ctx.textAlign = "center";
        ctx.fillText(s.label, x + bw / 2, h * 0.72);
        ctx.fillText(`${s.ms}ms`, x + bw / 2, h * 0.24);
        x += bw + 6;
      });
      ctx.strokeStyle = GOLD;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.18);
      ctx.lineTo(w * 0.92, h * 0.18);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "10px ui-monospace,monospace";
      ctx.fillStyle = GOLD;
      ctx.textAlign = "right";
      ctx.fillText("800ms gate", w * 0.92, h * 0.12);
      ctx.globalAlpha = 1;
    },
    "pillar-orbit"(ctx, w, h, t) {
      const cx = w / 2;
      const cy = h / 2;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.0004;
        const r = Math.min(w, h) * 0.34;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r * 0.85;
        ctx.strokeStyle = i % 2 ? CYAN : GOLD;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, 6.28);
        ctx.fill();
      }
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, 6.28);
      ctx.fill();
    },
    "cascade-wave"(ctx, w, h, t) {
      const mid = h * 0.5;
      [GOLD, CYAN].forEach((col, ph) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = mid + Math.sin(x * 0.035 + t * 0.003 + ph) * h * 0.22;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
      const labels = ["STT", "Brain", "TTS"];
      labels.forEach((lb, i) => {
        const x = ((i + 0.5) / 3) * w;
        ctx.fillStyle = "rgba(236,230,219,.6)";
        ctx.font = "9px Jost,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(lb, x, h * 0.82);
      });
      ctx.globalAlpha = 1;
    },
    "tier-heat"(ctx, w, h, t) {
      const cols = 12;
      const rows = 6;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const wave = Math.exp(-Math.pow((nx - 0.35 - Math.sin(t * 0.001) * 0.1) / 0.2, 2));
          if (wave < 0.1) continue;
          ctx.fillStyle = wave > 0.5 ? GOLD : CYAN;
          ctx.globalAlpha = wave * 0.85;
          ctx.beginPath();
          ctx.arc((c + 0.5) * (w / cols), (r + 0.5) * (h / rows), 2.5, 0, 6.28);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
    "agent-portal"(ctx, w, h, t) {
      const cx = w / 2;
      const cy = h * 0.42;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002);
      [[36, GOLD, 0.35 + pulse * 0.2], [24, CYAN, 0.55], [14, GOLD, 0.8]].forEach(([rad, col, a]) => {
        ctx.strokeStyle = col;
        ctx.globalAlpha = a;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, 6.28);
        ctx.stroke();
      });
      ctx.fillStyle = "rgba(236,230,219,.85)";
      ctx.globalAlpha = 1;
      ctx.font = "500 11px Jost,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Samuel", cx, h * 0.78);
    },
  };

  async function loadContent(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`content ${res.status}`);
    return res.json();
  }

  function init(options) {
    const deck = document.querySelector(options.deckSelector || ".viz-deck");
    if (!deck) return null;

    const engagement = options.engagement || global.LP_ENGAGEMENT;
    const reducedMotion = options.reducedMotion || false;
    const contentUrl =
      options.contentUrl || "../../assets/optimization-payoff-content.json";

    const explored = {};
    const edgeEnergy = {};
    const cardGlow = {};
    let content = null;
    let openCardId = null;
    let openSince = 0;
    let drawerVizRaf = null;
    let constellationComplete = false;
    let finishPlayed = false;
    let easterEggUnlocked = false;
    let deckPaused = false;
    let finishOverlay = null;

    ALL_EDGES.forEach(([a, b]) => {
      edgeEnergy[edgeKey(a, b)] = 0;
    });

    deck.style.position = "relative";

    const progress = document.createElement("p");
    progress.className = "viz-progress";
    progress.setAttribute("aria-live", "polite");
    progress.textContent = "0/6 explored";
    deck.parentElement.insertBefore(progress, deck.nextSibling);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "viz-constellation-svg");
    svg.setAttribute("aria-hidden", "true");
    deck.appendChild(svg);

    const edgeLines = {};
    ALL_EDGES.forEach(([a, b]) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "viz-constellation-edge");
      line.dataset.edge = edgeKey(a, b);
      svg.appendChild(line);
      edgeLines[edgeKey(a, b)] = line;
    });

    const cardEls = {};
    CARD_ORDER.forEach((id) => {
      const el = deck.querySelector(`[data-card-id="${id}"]`);
      if (el) cardEls[id] = el;
    });

    const backdrop = document.createElement("div");
    backdrop.className = "opt-drawer-backdrop";
    backdrop.hidden = true;
    backdrop.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    backdrop.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    document.body.appendChild(backdrop);

    const drawer = document.createElement("aside");
    drawer.className = "opt-drawer";
    drawer.hidden = true;
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.innerHTML = `
      <div class="opt-drawer__scroll" tabindex="-1">
        <button type="button" class="opt-drawer__close" aria-label="Close">&times;</button>
        <p class="opt-drawer__num"></p>
        <h3 class="opt-drawer__title"></h3>
        <p class="opt-drawer__sub"></p>
        <div class="opt-drawer__hero">
          <span class="opt-drawer__metric"></span>
          <span class="opt-drawer__metric-label"></span>
        </div>
        <div class="opt-drawer__viz-wrap"><canvas class="opt-drawer__viz"></canvas></div>
        <h4 class="opt-drawer__section"></h4>
        <table class="opt-drawer__table opt-drawer__bench"></table>
        <h4 class="opt-drawer__section opt-drawer__section--val"></h4>
        <table class="opt-drawer__table opt-drawer__val"></table>
        <p class="opt-drawer__insight"></p>
        <ul class="opt-drawer__footnotes"></ul>
        <div class="opt-drawer__endpad" aria-hidden="true"></div>
      </div>`;
    document.body.appendChild(drawer);

    const scrollEl = drawer.querySelector(".opt-drawer__scroll");
    scrollEl.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
      },
      { passive: true }
    );
    scrollEl.addEventListener(
      "touchmove",
      (e) => {
        e.stopPropagation();
      },
      { passive: true }
    );

    let drawerClosing = false;
    const DRAWER_MS = reducedMotion ? 0 : 500;

    function refreshDrawerContentAnim() {
      scrollEl.classList.remove("opt-drawer__scroll--swap");
      void scrollEl.offsetWidth;
      scrollEl.classList.add("opt-drawer__scroll--swap");
    }

    function showDrawerShell() {
      backdrop.hidden = false;
      drawer.hidden = false;
      backdrop.classList.remove("opt-drawer-backdrop--out");
      drawer.classList.remove("opt-drawer--out");
      if (reducedMotion) {
        backdrop.classList.add("opt-drawer-backdrop--in");
        drawer.classList.add("opt-drawer--in");
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          backdrop.classList.add("opt-drawer-backdrop--in");
          drawer.classList.add("opt-drawer--in");
        });
      });
    }

    function hideDrawerShell(onDone) {
      const finish = () => {
        drawerClosing = false;
        backdrop.classList.remove("opt-drawer-backdrop--in", "opt-drawer-backdrop--out");
        drawer.classList.remove("opt-drawer--in", "opt-drawer--out");
        drawer.hidden = true;
        backdrop.hidden = true;
        if (onDone) onDone();
      };
      if (reducedMotion || drawer.hidden) {
        finish();
        return;
      }
      drawerClosing = true;
      backdrop.classList.remove("opt-drawer-backdrop--in");
      drawer.classList.remove("opt-drawer--in");
      backdrop.classList.add("opt-drawer-backdrop--out");
      drawer.classList.add("opt-drawer--out");
      let done = false;
      const complete = () => {
        if (done) return;
        done = true;
        finish();
      };
      drawer.addEventListener(
        "transitionend",
        (e) => {
          if (e.target === drawer && e.propertyName === "transform") complete();
        },
        { once: true }
      );
      window.setTimeout(complete, DRAWER_MS + 40);
    }

    function ensureFinishOverlay() {
      if (finishOverlay) return finishOverlay;
      finishOverlay = document.createElement("div");
      finishOverlay.className = "viz-finish-overlay";
      finishOverlay.hidden = true;
      finishOverlay.setAttribute("aria-hidden", "true");
      finishOverlay.innerHTML = `
        <div class="viz-finish-stage">
          <div class="viz-finish-core" aria-hidden="true"></div>
          <button type="button" class="viz-finish-unlock"></button>
          <p class="viz-finish-hint"></p>
        </div>`;
      document.body.appendChild(finishOverlay);
      finishOverlay.querySelector(".viz-finish-unlock").addEventListener("click", unlockEasterEgg);
      return finishOverlay;
    }

    function finishTargetPos(index, cx, cy, radius, shardW, shardH) {
      const angle = -Math.PI / 2 + (index * Math.PI) / 3;
      return {
        tx: cx + Math.cos(angle) * radius - shardW / 2,
        ty: cy + Math.sin(angle) * radius - shardH / 2,
      };
    }

    function playFinishSequence() {
      if (!content || !finishPlayed) return;
      if (easterEggUnlocked) return;

      const overlay = ensureFinishOverlay();
      const finish = content.constellationFinish || {};
      const unlockBtn = overlay.querySelector(".viz-finish-unlock");
      const hintEl = overlay.querySelector(".viz-finish-hint");
      const core = overlay.querySelector(".viz-finish-core");
      unlockBtn.textContent = finish.unlockLabel || "unlock_constellation";
      hintEl.textContent = finish.unlockHint || "";
      unlockBtn.classList.remove("viz-finish-unlock--in");
      hintEl.classList.remove("viz-finish-hint--in");
      core.classList.remove("viz-finish-core--in");

      overlay.querySelectorAll(".viz-finish-shard").forEach((n) => n.remove());

      deck.classList.add("viz-deck--finishing", "viz-deck--complete");
      ALL_EDGES.forEach(([a, b]) => {
        edgeEnergy[edgeKey(a, b)] = 1;
      });
      layoutEdges();

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const radius = Math.min(148, Math.min(window.innerWidth, window.innerHeight) * 0.17);
      const shardW = Math.min(148, window.innerWidth * 0.22);

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => overlay.classList.add("viz-finish-overlay--in"));

      if (options.onDrawerOpen) options.onDrawerOpen();

      const shards = CARD_ORDER.map((id, i) => {
        const card = content.cards[id];
        const el = cardEls[id];
        const rect = el ? el.getBoundingClientRect() : { left: cx, top: cy, width: 0, height: 0 };
        const shard = document.createElement("div");
        shard.className = "viz-finish-shard";
        shard.dataset.cardId = id;
        shard.innerHTML = `
          <p class="viz-finish-shard__num">${esc(card?.num || "")}</p>
          <p class="viz-finish-shard__title">${esc(card?.title || id)}</p>
          <p class="viz-finish-shard__metric">${esc(card?.heroMetric || "")}</p>`;
        const fx = rect.left + rect.width / 2 - shardW / 2;
        const fy = rect.top + rect.height / 2 - 28;
        shard.style.width = `${shardW}px`;
        shard.style.setProperty("--fx", `${fx}px`);
        shard.style.setProperty("--fy", `${fy}px`);
        const { tx, ty } = finishTargetPos(i, cx, cy, radius, shardW, 56);
        shard.style.setProperty("--tx", `${tx}px`);
        shard.style.setProperty("--ty", `${ty}px`);
        overlay.appendChild(shard);
        return shard;
      });

      const mergeDelay = reducedMotion ? 0 : 80;
      const mergeStagger = reducedMotion ? 0 : 70;

      shards.forEach((shard, i) => {
        window.setTimeout(() => {
          shard.classList.add("viz-finish-shard--merge");
        }, mergeDelay + i * mergeStagger);
      });

      const coreDelay = reducedMotion ? 120 : mergeDelay + shards.length * mergeStagger + 520;
      const fadeDelay = reducedMotion ? 80 : coreDelay - 280;
      window.setTimeout(() => {
        shards.forEach((shard) => shard.classList.add("viz-finish-shard--fade"));
      }, Math.max(fadeDelay, mergeDelay + 200));

      window.setTimeout(() => {
        core.classList.add("viz-finish-core--in");
        unlockBtn.classList.add("viz-finish-unlock--in");
        if (hintEl.textContent) hintEl.classList.add("viz-finish-hint--in");
        unlockBtn.focus();
      }, coreDelay);

      if (engagement) {
        engagement.track("lp_constellation_finish_shown", { explored: CARD_ORDER.filter((id) => explored[id]) });
      }
    }

    function hideFinishOverlay() {
      if (!finishOverlay) return;
      finishOverlay.classList.remove("viz-finish-overlay--in");
      finishOverlay.setAttribute("aria-hidden", "true");
      window.setTimeout(() => {
        finishOverlay.hidden = true;
        finishOverlay.querySelectorAll(".viz-finish-shard").forEach((n) => n.remove());
        deck.classList.remove("viz-deck--finishing");
        if (options.onDrawerClose) options.onDrawerClose();
      }, 420);
    }

    function computeBoostLanes() {
      if (!content) return [];
      const lanes = new Set();
      Object.keys(explored).forEach((cardId) => {
        const mapped = content.laneMap[cardId];
        if (mapped) mapped.forEach((l) => lanes.add(l));
      });
      if (explored.radial && engagement) {
        const dwell = engagement.state.vizDwellMs || {};
        const ranked = Object.entries(content.laneMap)
          .filter(([cid]) => cid !== "radial")
          .flatMap(([, ls]) => ls)
          .sort((a, b) => (dwell[b] || 0) - (dwell[a] || 0));
        ranked.slice(0, 2).forEach((l) => lanes.add(l));
      }
      return [...lanes];
    }

    let magazineResult = null;

    async function buildMagazineArtifact() {
      if (!global.SCS_PLATFORM_MAGAZINE || !content) return null;
      const reveal = content.constellationReveal || {};
      let facts = global.SCS_PLATFORM_MAGAZINE.DEFAULT_FACTS;
      const factsUrl = reveal.factsUrl || options.factsUrl || "../../assets/magazine-issue-01-facts.json";
      try {
        facts = await global.SCS_PLATFORM_MAGAZINE.loadFacts(factsUrl);
      } catch {
        /* default facts */
      }
      magazineResult = await global.SCS_PLATFORM_MAGAZINE.renderPlatformMagazine({
        facts,
        exploredIds: CARD_ORDER.filter((id) => explored[id]),
        cardOrder: CARD_ORDER,
        cards: content.cards,
        laneIds: computeBoostLanes(),
        laneLabels: content.laneLabels || {},
        logoUrl: options.artifactLogoUrl || "../../artifacts/bumper-scs/logo.png",
        siteUrl: options.artifactSiteUrl || "earlyaccess.michaelstewman.com",
      });
      return magazineResult;
    }

    function scrollToReveal() {
      const dataviz = document.getElementById("dataviz");
      if (dataviz) {
        dataviz.classList.add("dataviz--unlock-flash");
        window.setTimeout(() => dataviz.classList.remove("dataviz--unlock-flash"), 1200);
      }
      if (!revealEl) return;
      window.setTimeout(() => {
        if (options.scrollToEl) {
          options.scrollToEl(revealEl);
        } else {
          const y = revealEl.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: reducedMotion ? "auto" : "smooth" });
        }
      }, 480);
    }

    function unlockEasterEgg() {
      if (easterEggUnlocked) return;
      easterEggUnlocked = true;
      constellationComplete = true;

      hideFinishOverlay();
      revealConstellationInsight();
      applyFormBoost();

      let totalDwell = 0;
      if (engagement) {
        Object.values(engagement.state.vizDwellMs || {}).forEach((v) => {
          totalDwell += v;
        });
        engagement.trackConstellationComplete(
          CARD_ORDER.filter((id) => explored[id]),
          totalDwell
        );
        engagement.state.constellationComplete = true;
      }

      if (options.onConstellationComplete) options.onConstellationComplete(explored);

      scrollToReveal();
    }

    function revealConstellationInsight() {
      if (!revealEl || !content) return;
      const r = content.constellationReveal || {};
      const filename = r.downloadFilename || "scs-platform-magazine-issue-01.pdf";
      revealEl.hidden = false;
      revealEl.className = "viz-constellation-reveal viz-constellation-reveal--reward";
      revealEl.innerHTML = `
        <div class="viz-stack-map-reward">
          <p class="section-label">${esc(r.label || "Unlocked")}</p>
          <p class="viz-magazine-kicker">Issue 01 · AI Design in Enterprise</p>
          <h2 class="section-title">${esc(r.title || "SCS Platform Magazine")}</h2>
          <p class="body-copy">${esc(r.body || "")}</p>
          <div class="viz-stack-map-preview-wrap" aria-hidden="true">
            <canvas class="viz-stack-map-preview" width="${global.SCS_PLATFORM_MAGAZINE ? global.SCS_PLATFORM_MAGAZINE.W : 1080}" height="${global.SCS_PLATFORM_MAGAZINE ? global.SCS_PLATFORM_MAGAZINE.H : 1350}"></canvas>
          </div>
          <div class="viz-stack-map-actions">
            <button type="button" class="viz-stack-map-download" data-magazine-download>${esc(r.ctaDownload || "Download Issue 01 (PDF)")}</button>
            <p class="viz-stack-map-lanes">${esc(r.laneDisclosure || "Interest lanes below are pre-matched from your exploration")}</p>
            <button type="button" class="viz-stack-map-form" data-stack-form>${esc(r.ctaForm || "Continue to early access")} \u2192</button>
          </div>
          <p class="viz-note">${esc(r.footnote || "")}</p>
        </div>`;

      const preview = revealEl.querySelector(".viz-stack-map-preview");
      const downloadBtn = revealEl.querySelector("[data-magazine-download]");
      const formBtn = revealEl.querySelector("[data-stack-form]");

      downloadBtn.addEventListener("click", () => {
        const run = (result) => {
          if (result && global.SCS_PLATFORM_MAGAZINE) {
            global.SCS_PLATFORM_MAGAZINE.downloadPlatformMagazine(result, filename);
          }
        };
        if (magazineResult) run(magazineResult);
        else buildMagazineArtifact().then(run);
      });

      formBtn.addEventListener("click", () => {
        const formSection = document.getElementById("early-access");
        if (formSection && options.scrollToEl) options.scrollToEl(formSection);
        else formSection?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });

      buildMagazineArtifact()
        .then((result) => {
          const cv = result?.coverCanvas;
          if (!cv || !preview) return;
          const pctx = preview.getContext("2d");
          pctx.clearRect(0, 0, preview.width, preview.height);
          pctx.drawImage(cv, 0, 0);
          preview.closest(".viz-stack-map-preview-wrap")?.classList.add("viz-stack-map-preview-wrap--ready");
        })
        .catch(() => {});

      if (!reducedMotion) revealEl.classList.add("viz-constellation-reveal--in");
    }

    let revealEl = document.getElementById("viz-constellation-reveal");
    if (!revealEl && options.revealMount) {
      revealEl = document.createElement("section");
      revealEl.id = "viz-constellation-reveal";
      revealEl.className = "viz-constellation-reveal";
      revealEl.hidden = true;
      options.revealMount.insertAdjacentElement("afterend", revealEl);
    }

    function exploredCount() {
      return Object.keys(explored).length;
    }

    function updateProgress() {
      const n = exploredCount();
      progress.textContent = `${n}/6 explored`;
      progress.classList.toggle("viz-progress--active", n >= 3);
    }

    function getCardCenter(id) {
      const el = cardEls[id];
      if (!el) return null;
      const dr = deck.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - dr.left, y: r.top + r.height / 2 - dr.top };
    }

    function layoutEdges() {
      const dr = deck.getBoundingClientRect();
      svg.setAttribute("width", dr.width);
      svg.setAttribute("height", dr.height);
      ALL_EDGES.forEach(([a, b]) => {
        const ca = getCardCenter(a);
        const cb = getCardCenter(b);
        const line = edgeLines[edgeKey(a, b)];
        if (!ca || !cb || !line) return;
        line.setAttribute("x1", ca.x);
        line.setAttribute("y1", ca.y);
        line.setAttribute("x2", cb.x);
        line.setAttribute("y2", cb.y);
        const e = edgeEnergy[edgeKey(a, b)] || 0;
        const both = explored[a] && explored[b];
        const alpha = Math.min(0.85, e * 0.6 + (both ? 0.25 : 0));
        line.style.opacity = String(alpha);
        line.classList.toggle("viz-constellation-edge--lit", alpha > 0.15);
      });
    }

    function pulseNeighbors(cardId) {
      const neighbors = new Set();
      ALL_EDGES.forEach(([a, b]) => {
        if (a === cardId) neighbors.add(b);
        if (b === cardId) neighbors.add(a);
      });
      neighbors.forEach((nid) => {
        cardGlow[nid] = 1;
        if (engagement) engagement.trackNeighborPulse(cardId, nid);
      });
      ALL_EDGES.forEach(([a, b]) => {
        if (a === cardId || b === cardId) {
          const k = edgeKey(a, b);
          edgeEnergy[k] = Math.min(1, (edgeEnergy[k] || 0) + 0.35);
        }
      });
      if (!reducedMotion) {
        window.setTimeout(layoutEdges, 16);
      } else {
        layoutEdges();
      }
    }

    function decayFrame() {
      let active = false;
      Object.keys(edgeEnergy).forEach((k) => {
        if (edgeEnergy[k] > 0.01) {
          edgeEnergy[k] *= 0.96;
          active = true;
        } else {
          edgeEnergy[k] = 0;
        }
      });
      Object.keys(cardGlow).forEach((k) => {
        if (cardGlow[k] > 0.01) {
          cardGlow[k] *= 0.94;
          active = true;
          const el = cardEls[k];
          if (el) el.style.setProperty("--viz-glow", String(cardGlow[k]));
        }
      });
      layoutEdges();
      if (active && !reducedMotion) requestAnimationFrame(decayFrame);
    }

    function renderDrawer(cardId) {
      if (!content || !content.cards[cardId]) return;
      const c = content.cards[cardId];
      drawer.querySelector(".opt-drawer__num").textContent = c.num;
      drawer.querySelector(".opt-drawer__title").textContent = c.title;
      drawer.querySelector(".opt-drawer__sub").textContent = c.subtitle;
      drawer.querySelector(".opt-drawer__metric").textContent = c.heroMetric;
      drawer.querySelector(".opt-drawer__metric-label").textContent = c.heroLabel;
      drawer.querySelector(".opt-drawer__section").textContent = c.benchmarkTitle;
      drawer.querySelector(".opt-drawer__section--val").textContent = c.validationTitle;
      drawer.querySelector(".opt-drawer__insight").textContent = c.insight;

      const hasNotes = c.benchmarkRows.some((r) => r.note);
      drawer.querySelector(".opt-drawer__bench").innerHTML =
        `<thead><tr><th>Tier</th><th>Value</th>${hasNotes ? "<th>Note</th>" : ""}</tr></thead><tbody>` +
        rowsHtml(c.benchmarkRows, "value") +
        "</tbody>";

      const valHasNotes = c.validationRows.some((r) => r.note);
      drawer.querySelector(".opt-drawer__val").innerHTML =
        `<thead><tr><th>Item</th><th>Detail</th>${valHasNotes ? "<th>Note</th>" : ""}</tr></thead><tbody>` +
        rowsHtml(c.validationRows, "value") +
        "</tbody>";

      const fn = drawer.querySelector(".opt-drawer__footnotes");
      fn.innerHTML = c.footnotes.map((f) => `<li>${esc(f)}</li>`).join("");

      drawer.dataset.cardId = cardId;
      drawer.dataset.vizType = c.vizType;
    }

    function fitDrawerViz() {
      const cv = drawer.querySelector(".opt-drawer__viz");
      const wrap = cv.parentElement;
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w: r.width, h: r.height, cv };
    }

    function drawerVizLoop(ts) {
      const type = drawer.dataset.vizType;
      const fn = DRAWER_VIZ[type];
      if (!fn || drawer.hidden) return;
      const { ctx, w, h } = fitDrawerViz();
      ctx.clearRect(0, 0, w, h);
      fn(ctx, w, h, ts);
      drawerVizRaf = requestAnimationFrame(drawerVizLoop);
    }

    function openDrawer(cardId) {
      if (finishOverlay && !finishOverlay.hidden) return;
      if (drawerClosing) return;
      if (!content) return;
      if (openCardId && openCardId !== cardId && engagement) {
        engagement.trackVizDwell(openCardId, performance.now() - openSince);
      }
      const wasOpen = openCardId != null && !drawer.hidden;
      openCardId = cardId;
      openSince = performance.now();
      const firstExplore = !explored[cardId];
      explored[cardId] = explored[cardId] || Date.now();
      cardEls[cardId]?.classList.add("viz-card--explored");
      if (firstExplore) {
        pulseNeighbors(cardId);
        if (!reducedMotion) requestAnimationFrame(decayFrame);
      }
      if (engagement) engagement.trackVizOpen(cardId, exploredCount());
      renderDrawer(cardId);
      scrollEl.scrollTop = 0;
      if (drawer.hidden) {
        showDrawerShell();
      } else if (wasOpen) {
        refreshDrawerContentAnim();
      }
      document.body.classList.add("opt-drawer-open");
      document.documentElement.classList.add("opt-drawer-open");
      if (options.onDrawerOpen) options.onDrawerOpen();
      if (options.onDeckPause) options.onDeckPause(true);
      drawer.querySelector(".opt-drawer__close").focus();
      if (!reducedMotion) {
        cancelAnimationFrame(drawerVizRaf);
        drawerVizRaf = requestAnimationFrame(drawerVizLoop);
      } else {
        const type = content.cards[cardId].vizType;
        const fn = DRAWER_VIZ[type];
        if (fn) {
          const { ctx, w, h } = fitDrawerViz();
          fn(ctx, w, h, 0);
        }
      }
      updateProgress();
      if (allSixExplored() && !finishPlayed) {
        progress.textContent = "6/6 explored";
        progress.classList.add("viz-progress--active");
      }
    }

    function allSixExplored() {
      return exploredCount() >= 6;
    }

    function closeDrawer() {
      if (drawer.hidden || drawerClosing) return;
      const closingId = openCardId;
      if (openCardId && engagement) {
        engagement.trackVizDwell(openCardId, performance.now() - openSince);
      }
      openCardId = null;
      document.body.classList.remove("opt-drawer-open");
      document.documentElement.classList.remove("opt-drawer-open");
      if (options.onDrawerClose) options.onDrawerClose();
      if (options.onDeckPause) options.onDeckPause(false);
      cancelAnimationFrame(drawerVizRaf);

      hideDrawerShell(() => {
        if (closingId && allSixExplored() && !finishPlayed && !easterEggUnlocked) {
          finishPlayed = true;
          window.setTimeout(() => playFinishSequence(), reducedMotion ? 60 : 180);
        }
      });
    }

    function applyFormBoost() {
      if (!content || !options.laneGrid) return;
      const lanes = computeBoostLanes();
      let changed = 0;
      lanes.forEach((laneId) => {
        const input = options.laneGrid.querySelector(`input[value="${laneId}"]`);
        if (input && !input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          changed++;
        }
      });
      if (options.onFormBoost) options.onFormBoost(lanes, changed);
    }

    CARD_ORDER.forEach((id) => {
      const el = cardEls[id];
      if (!el) return;
      el.addEventListener("click", (e) => {
        if (e.target.closest(".opt-drawer")) return;
        openDrawer(id);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDrawer(id);
        }
      });
    });

    let drawerPointerStart = null;
    scrollEl.addEventListener(
      "pointerdown",
      (e) => {
        drawerPointerStart = { x: e.clientX, y: e.clientY };
      },
      { passive: true }
    );

    drawer.querySelector(".opt-drawer__close").addEventListener("click", closeDrawer);
    drawer.addEventListener("click", (e) => {
      if (drawer.hidden || drawerClosing) return;
      if (e.target.closest(".opt-drawer__close")) return;
      if (drawerPointerStart) {
        const dx = Math.abs(e.clientX - drawerPointerStart.x);
        const dy = Math.abs(e.clientY - drawerPointerStart.y);
        if (dx > 10 || dy > 10) {
          drawerPointerStart = null;
          return;
        }
      }
      drawerPointerStart = null;
      closeDrawer();
    });
    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && finishOverlay && !finishOverlay.hidden) return;
      if (e.key === "Escape" && !drawer.hidden) closeDrawer();
    });

    window.addEventListener(
      "resize",
      () => {
        layoutEdges();
      },
      { passive: true }
    );

    loadContent(contentUrl)
      .then((data) => {
        content = data;
      })
      .catch(() => {
        content = { cards: {}, laneMap: {}, formBoostToast: "", constellationReveal: {} };
      });

    layoutEdges();

    return {
      explored,
      openDrawer,
      closeDrawer,
      isComplete: () => constellationComplete,
      isEasterEggUnlocked: () => easterEggUnlocked,
      getSnapshot: () => ({
        explored: Object.keys(explored),
        constellation_complete: constellationComplete,
      }),
    };
  }

  global.SCS_OPTIMIZATION = { init, CARD_ORDER };
})(typeof window !== "undefined" ? window : globalThis);
