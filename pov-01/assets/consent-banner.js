/**
 * LP analytics consent banner - GA4 Consent Mode + ledger POST.
 * Approved copy 2026-08-08 (ui-approval-minimal).
 */
(function (global) {
  const STORAGE_KEY = "rm_analytics_consent_v1";
  const GA_ID = "G-N5C5G8CRVX";

  function apiBase() {
    const q = new URLSearchParams(global.location.search);
    const override = q.get("api");
    if (override) return override.replace(/\/+$/, "");
    const h = global.location.hostname;
    return h === "localhost" || h === "127.0.0.1"
      ? "http://127.0.0.1:8765"
      : "https://rainmaker-api-waqs.onrender.com";
  }

  function getChoice() {
    try {
      return global.localStorage.getItem(STORAGE_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function setChoice(v) {
    try {
      global.localStorage.setItem(STORAGE_KEY, v);
    } catch (_) {}
  }

  function clientId() {
    try {
      let id = global.localStorage.getItem("rm_client_id");
      if (!id) {
        id =
          global.crypto && global.crypto.randomUUID
            ? global.crypto.randomUUID()
            : "c_" + Date.now();
        global.localStorage.setItem("rm_client_id", id);
      }
      return id;
    } catch (_) {
      return null;
    }
  }

  function loadGa4() {
    if (global._rmGaLoaded) return;
    global._rmGaLoaded = true;
    global.dataLayer = global.dataLayer || [];
    function gtag() {
      global.dataLayer.push(arguments);
    }
    global.gtag = gtag;
    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      wait_for_update: 500,
    });
    const s = global.document.createElement("script");
    s.async = true;
    s.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(GA_ID);
    global.document.head.appendChild(s);
    gtag("js", new Date());
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("config", GA_ID, { anonymize_ip: true, send_page_view: true });
  }

  async function recordConsent(state) {
    const base = apiBase();
    if (!base) return;
    try {
      await fetch(base + "/growth/consent/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "analytics",
          state: state,
          surface: "web",
          surfaceVariant: "web",
          clientId: clientId(),
        }),
        keepalive: true,
      });
    } catch (_) {
      /* non-blocking */
    }
  }

  function injectStyles() {
    if (global.document.getElementById("rm-consent-banner-styles")) return;
    const style = global.document.createElement("style");
    style.id = "rm-consent-banner-styles";
    style.textContent =
      "#rm-consent-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;" +
      "background:rgba(18,17,15,.96);border-top:1px solid #2a2722;padding:12px 16px;" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:12px;font:14px/1.4 Jost,system-ui,sans-serif;" +
      "color:rgba(236,230,219,.9)}#rm-consent-banner p{margin:0;flex:1 1 220px}" +
      "#rm-consent-banner a{color:#FFB347}#rm-consent-banner .rm-consent-actions{display:flex;gap:8px}" +
      "#rm-consent-banner button{border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font:inherit}" +
      "#rm-consent-banner .rm-decline{background:transparent;color:#8a8377}" +
      "#rm-consent-banner .rm-accept{background:#FFB347;color:#12110f;font-weight:600}";
    global.document.head.appendChild(style);
  }

  function showBanner(onResolved) {
    injectStyles();
    if (global.document.getElementById("rm-consent-banner")) return;
    const bar = global.document.createElement("div");
    bar.id = "rm-consent-banner";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Analytics consent");
    bar.innerHTML =
      "<p>We use first-party analytics to see how this page is used. " +
      '<a href="https://michaelstewman.com/privacy" target="_blank" rel="noopener">Privacy policy</a></p>' +
      '<div class="rm-consent-actions">' +
      '<button type="button" class="rm-decline">Decline</button>' +
      '<button type="button" class="rm-accept">Accept</button></div>';
    bar.querySelector(".rm-decline").addEventListener("click", () => {
      setChoice("declined");
      recordConsent("declined");
      bar.remove();
      onResolved(false);
    });
    bar.querySelector(".rm-accept").addEventListener("click", () => {
      setChoice("granted");
      recordConsent("granted");
      loadGa4();
      bar.remove();
      onResolved(true);
    });
    global.document.body.appendChild(bar);
  }

  function startEngagementIfReady() {
    /* lp-engagement.js boots via RM_CONSENT.init */
  }

  function init(onAnalyticsReady) {
    // First-party LP events boot independently; this init gates GA4 only.
    const choice = getChoice();
    if (choice === "granted") {
      loadGa4();
      if (onAnalyticsReady) onAnalyticsReady(true);
      return;
    }
    if (choice === "declined") {
      if (onAnalyticsReady) onAnalyticsReady(false);
      return;
    }
    showBanner((granted) => {
      if (onAnalyticsReady) onAnalyticsReady(granted);
    });
  }

  global.RM_CONSENT = {
    init,
    analyticsGranted: () => getChoice() === "granted",
    startEngagementIfReady,
  };
})(typeof window !== "undefined" ? window : globalThis);
