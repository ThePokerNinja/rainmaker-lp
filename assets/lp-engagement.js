/**
 * LP first-party engagement tracker (no PII in events).
 * Batches to POST /growth/events on rm_api.
 */
(function (global) {
  const CLIENT_KEY = "rm_client_id";
  const SESSION_KEY = "rm_lp_session_id";
  const QUEUE_KEY = "rm_lp_event_queue";

  function uuid() {
    if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function clientId() {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  }

  function sessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function parseUtm() {
    const q = new URLSearchParams(global.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const out = {};
    keys.forEach((k) => {
      const v = q.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  function lpSlug() {
    const q = new URLSearchParams(global.location.search);
    return q.get("lp") || q.get("utm_campaign") || "pov-01";
  }

  function apiBase() {
    const q = new URLSearchParams(global.location.search);
    const override = q.get("api");
    if (override) return override.replace(/\/+$/, "");
    const h = global.location.hostname;
    return h === "localhost" || h === "127.0.0.1"
      ? "http://127.0.0.1:8765"
      : "https://rainmaker-api-waqs.onrender.com";
  }

  function loadQueue() {
    try {
      return JSON.parse(sessionStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveQueue(q) {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200)));
  }

  const state = {
    clientId: clientId(),
    sessionId: sessionId(),
    lpSlug: lpSlug(),
    utm: parseUtm(),
    queue: loadQueue(),
    flushing: false,
    scrollMarks: new Set(),
    formStarted: false,
    vizExplored: {},
    vizDwellMs: {},
    constellationComplete: false,
    lanesSelected: [],
  };

  function enqueue(event, detail) {
    state.queue.push({
      event,
      detail: detail || {},
      ts: Date.now() / 1000,
    });
    saveQueue(state.queue);
  }

  async function flush() {
    if (state.flushing || !state.queue.length) return;
    state.flushing = true;
    const batch = state.queue.splice(0, 50);
    saveQueue(state.queue);
    try {
      const res = await fetch(`${apiBase()}/growth/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          clientId: state.clientId,
          lpSlug: state.lpSlug,
          utm: state.utm,
          events: batch,
        }),
      });
      if (!res.ok) {
        state.queue = batch.concat(state.queue);
        saveQueue(state.queue);
      }
    } catch {
      state.queue = batch.concat(state.queue);
      saveQueue(state.queue);
    } finally {
      state.flushing = false;
    }
  }

  function track(event, detail) {
    enqueue(event, detail);
    flush();
  }

  function ensureSessionStart() {
    if (state._started) return;
    state._started = true;
    track("lp_session_start", {
      lp_slug: state.lpSlug,
      utm: state.utm,
      referrer: document.referrer || null,
    });
  }

  function trackScroll() {
    const doc = document.documentElement;
    const pct = Math.round(
      ((doc.scrollTop + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100
    );
    [25, 50, 75, 100].forEach((mark) => {
      if (pct >= mark && !state.scrollMarks.has(mark)) {
        state.scrollMarks.add(mark);
        track("lp_scroll_depth", { pct: mark });
      }
    });
  }

  function trackVizOpen(cardId, exploredCount) {
    if (!state.vizExplored[cardId]) state.vizExplored[cardId] = Date.now();
    track("lp_viz_open", { card_id: cardId, explored_count: exploredCount });
  }

  function trackVizDwell(cardId, dwellMs) {
    state.vizDwellMs[cardId] = (state.vizDwellMs[cardId] || 0) + dwellMs;
    track("lp_viz_dwell", { card_id: cardId, dwell_ms: Math.round(dwellMs) });
  }

  function trackNeighborPulse(from, to) {
    track("lp_viz_neighbor_pulse", { from, to });
  }

  function trackConstellationComplete(explored, totalDwellMs) {
    state.constellationComplete = true;
    track("lp_constellation_complete", {
      explored,
      total_dwell_ms: Math.round(totalDwellMs),
    });
  }

  function trackLaneToggle(laneId, selectedCount) {
    track("lp_lane_toggle", { lane_id: laneId, selected_count: selectedCount });
  }

  function trackFormStart() {
    if (state.formStarted) return;
    state.formStarted = true;
    track("lp_form_start", {});
  }

  function trackFormSubmit(payload) {
    track("lp_form_submit", payload);
    return flush();
  }

  function buildEngagementSnapshot(extra) {
    const explored = Object.keys(state.vizExplored);
    return {
      schema_version: 1,
      session_id: state.sessionId,
      client_id: state.clientId,
      lp_slug: state.lpSlug,
      utm: state.utm,
      viz_explored: explored,
      viz_dwell_ms: { ...state.vizDwellMs },
      constellation_complete: state.constellationComplete,
      lanes_selected: extra?.lanes_selected || state.lanesSelected,
      priority_boost: state.constellationComplete ? "constellation_complete" : null,
      linkedin_connect: extra?.linkedin_connect || false,
      form_started: state.formStarted,
      subscriptions: ["beta", "newsletter", "retargeting"],
      retargeting_eligible: true,
    };
  }

  function bindLaneTracking(gridSelector) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;
    grid.addEventListener("change", (e) => {
      const input = e.target;
      if (!input.matches('input[name="pillar"]')) return;
      const selected = [...grid.querySelectorAll('input[name="pillar"]:checked')].map((x) => x.value);
      state.lanesSelected = selected;
      trackLaneToggle(input.value, selected.length);
    });
  }

  function bindFormTracking(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return;
    form.querySelectorAll("input, textarea").forEach((el) => {
      el.addEventListener("focus", trackFormStart, { once: false });
    });
  }

  ensureSessionStart();
  setInterval(flush, 5000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  global.LP_ENGAGEMENT = {
    state,
    track,
    trackVizOpen,
    trackVizDwell,
    trackNeighborPulse,
    trackConstellationComplete,
    trackFormSubmit,
    buildEngagementSnapshot,
    bindLaneTracking,
    bindFormTracking,
    flush,
    apiBase,
    trackScroll,
  };
})(typeof window !== "undefined" ? window : globalThis);
