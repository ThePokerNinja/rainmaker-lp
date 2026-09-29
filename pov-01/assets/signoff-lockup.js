/**
 * SCS signoff lockup � shared canvas renderer (POV ad + bumper-scs + LP).
 * Transparent background; logo + signature reveal + chime sparkles + URL.
 * Timing/constants match bumper-scs/index.html and pov-brand-01 signoff.
 *
 * Layout variants (opts.variant):
 *   standard   � bumper / POV default (logo + signature stack)
 *   stackTight � alternate lockup; signature sits closer to logo (LP hero)
 */
(function (global) {
  const GOLD_HI = "#F6D6B8";
  const GOLD = "#E0B57E";
  const GOLD_LO = "#A8865A";
  const SIGNATURE_SFX_T = 0;
  const CHIME_OFFSETS_S = [0.6, 0.85, 1.1, 1.35];
  const CHIME_X_FRAC = [0.16, 0.5, 0.84, 0.84];
  const URL_T = 1.0;
  const HOLD_T = 2.15;

  /** Canonical layout presets � single source for cross-surface lockups. */
  const LOCKUP_LAYOUTS = {
    standard: { markCy: 0.415, sigCy: 0.455, urlCy: 0.492, urlSize: 28, stackDy: 100 },
    stackTight: { markCy: 0.415, sigCy: 0.452, urlCy: 0.482, urlSize: 28, stackDy: 72 },
  };

  function resolveLockupLayout(opts) {
    const key = opts.variant || opts.layout || "standard";
    const preset = LOCKUP_LAYOUTS[key] || LOCKUP_LAYOUTS.standard;
    return {
      in: 0,
      url: opts.url != null ? opts.url : "michaelstewman.com",
      ...preset,
    };
  }

  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const smooth = (x) => {
    x = clamp01(x);
    return x * x * (3 - 2 * x);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => smooth((t - a) / (b - a));

  function chimeTimes() {
    return CHIME_OFFSETS_S.map((o) => SIGNATURE_SFX_T + o);
  }
  function signoffStackDy(S, layout) {
    return layout.stackDy * S;
  }
  function signatureRevealStart(layout) {
    return Math.max(layout.in + 0.08, (chimeTimes()[0] || 0.6) - 0.22);
  }
  function fitNativeSize(img, maxW, maxH) {
    if (!img || !img.width) return { w: maxW, h: maxH };
    const k = Math.min(1, maxW / img.width, maxH / img.height);
    return { w: img.width * k, h: img.height * k };
  }

  function initScsSignoffLockup(canvas, opts) {
    opts = opts || {};
    const layout = resolveLockupLayout(opts);
    const cv = canvas;
    const ctx = cv.getContext("2d");
    let W = 1080;
    let H = 1350;
    let S = 1;
    cv.width = W;
    cv.height = H;
    S = Math.min(W, H) / 1080;

    const markImg = new Image();
    const sigImg = new Image();
    let ready = false;
    let raf = 0;
    let sfx = null;
    let spirit = null;
    let spiritTimer = 0;

    function spiritStartS() {
      return opts.spiritStartS != null ? opts.spiritStartS : 1.55;
    }

    function spiritDurationS() {
      return opts.spiritDurationS != null ? opts.spiritDurationS : 3.35;
    }

    function totalDuration() {
      if (!opts.spiritSrc || opts.reducedMotion) return HOLD_T;
      return Math.max(HOLD_T, spiritStartS() + spiritDurationS());
    }

    function waitForAudio(el) {
      return new Promise((resolve) => {
        const done = () => resolve();
        el.addEventListener("canplaythrough", done, { once: true });
        el.addEventListener("error", done, { once: true });
        setTimeout(done, 4000);
        el.load();
      });
    }

    function fontsReady() {
      const done = () => {
        ready = true;
        if (opts.reducedMotion) render(HOLD_T);
        else boot();
      };
      if (opts.showUrl === false) {
        done();
        return;
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts
          .load("300 28px Jost")
          .then(() => document.fonts.ready)
          .then(done);
      } else {
        done();
      }
    }
    function onAssetLoad() {
      if (markImg.complete && sigImg.complete && markImg.naturalWidth && sigImg.naturalWidth) fontsReady();
    }
    markImg.onload = onAssetLoad;
    sigImg.onload = onAssetLoad;
    markImg.src = opts.logoSrc || "logo.png";
    sigImg.src = opts.sigSrc || "signature.png";

    function signatureLayout(t, allowEarly) {
      if (!sigImg.complete || !sigImg.naturalWidth) return null;
      const sigIn = signatureRevealStart(layout);
      const sigDur = 0.6;
      const p = seg(t, sigIn, sigIn + sigDur);
      if (!allowEarly && p <= 0.01) return null;
      const cx = W / 2;
      const cy = H * layout.sigCy + signoffStackDy(S, layout);
      const wantW = Math.min(W * 0.62, 420 * S);
      const { w: sigW, h: sigH } = fitNativeSize(sigImg, wantW, wantW * 0.22);
      return { cx, cy, sigW, sigH, p, left: cx - sigW / 2, right: cx + sigW / 2 };
    }

    function textLine(str, cx, y, size, track, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const maxW = W * 0.86;
      let sz = size;
      let tr = track;
      let total = 0;
      let ws = [];
      for (let pass = 0; pass < 6; pass++) {
        ctx.font = `300 ${sz}px Jost, system-ui, sans-serif`;
        const chars = [...str];
        total = 0;
        ws = chars.map((c) => {
          const w = ctx.measureText(c).width + tr;
          total += w;
          return w;
        });
        if (total <= maxW) break;
        const k = maxW / total;
        sz *= k;
        tr *= k;
      }
      ctx.textBaseline = "middle";
      const chars = [...str];
      let x = cx - total / 2;
      const grad = ctx.createLinearGradient(x, 0, x + total, 0);
      grad.addColorStop(0, GOLD_LO);
      grad.addColorStop(0.5, GOLD_HI);
      grad.addColorStop(1, GOLD);
      ctx.fillStyle = grad;
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], x, y);
        x += ws[i];
      }
      ctx.restore();
    }

    function drawSparkle(x, y, burst, a, R) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(255,248,232,${0.95 * burst * a})`);
      g.addColorStop(0.35, `rgba(224,181,126,${0.5 * burst * a})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,240,215,${0.65 * burst * a})`;
      ctx.lineWidth = 1.6 * S;
      const len = 24 * S * burst;
      ctx.beginPath();
      ctx.moveTo(x - len, y);
      ctx.lineTo(x + len, y);
      ctx.moveTo(x, y - len);
      ctx.lineTo(x, y + len);
      ctx.stroke();
      ctx.restore();
    }

    function drawChimeSparkles(t) {
      const sig = signatureLayout(t, true);
      if (!sig) return;
      const signA = seg(t, layout.in, layout.in + 0.4);
      if (signA <= 0.01) return;
      chimeTimes().forEach((ct, i) => {
        const dt = t - ct;
        if (dt < 0 || dt > 0.75) return;
        const burst = 1 - smooth(Math.min(1, dt / 0.68));
        const x = lerp(sig.left, sig.right, CHIME_X_FRAC[i] || 0.5);
        const y = sig.cy + (i - 1) * 3 * S;
        drawSparkle(x, y, burst, signA * Math.max(sig.p, seg(t, ct - 0.08, ct + 0.05)), (16 + i * 6) * S * burst);
      });
    }

    function drawSignature(t, baseA) {
      const lay = signatureLayout(t, false);
      if (!lay) return;
      ctx.save();
      ctx.globalAlpha = baseA * lay.p;
      ctx.beginPath();
      ctx.rect(lay.cx - lay.sigW / 2, lay.cy - lay.sigH / 2, lay.sigW * lay.p, lay.sigH);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(sigImg, lay.cx - lay.sigW / 2, lay.cy - lay.sigH / 2, lay.sigW, lay.sigH);
      ctx.restore();
    }

    function drawSignoff(t) {
      const a = seg(t, layout.in, layout.in + 0.4);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      const cx = W / 2;
      const cy = H * layout.markCy;
      const { w: mw, h: mh } = fitNativeSize(markImg, 210 * S, 210 * S);
      if (markImg.naturalWidth) ctx.drawImage(markImg, cx - mw / 2, cy - mh / 2, mw, mh);
      drawSignature(t, 1);
      if (opts.showUrl !== false && layout.url) {
        textLine(layout.url, cx, H * layout.urlCy + signoffStackDy(S, layout), layout.urlSize * S, 5 * S, seg(t, URL_T, URL_T + 0.35));
      }
      ctx.restore();
    }

    function render(t) {
      const drawT = Math.max(0, Math.min(HOLD_T, t));
      ctx.clearRect(0, 0, W, H);
      drawSignoff(drawT);
      drawChimeSparkles(drawT);
    }

    let animStart = null;
    let sfxPlayed = false;
    let unlockBound = false;
    let animStarted = false;
    let launched = false;
    let replayBound = false;
    let audioReady = Promise.resolve();

    function initAudio() {
      if (opts.reducedMotion) return;
      const waits = [];
      if (opts.sfxSrc && !sfx) {
        sfx = new Audio(opts.sfxSrc);
        sfx.preload = "auto";
        sfx.volume = opts.sfxVolume != null ? opts.sfxVolume : 0.55;
        waits.push(waitForAudio(sfx));
      }
      if (opts.spiritSrc && !spirit) {
        spirit = new Audio(opts.spiritSrc);
        spirit.preload = "auto";
        spirit.volume = opts.spiritVolume != null ? opts.spiritVolume : 0.82;
        waits.push(waitForAudio(spirit));
      }
      if (waits.length) audioReady = Promise.all(waits).then(() => {});
    }
    initAudio();

    function renderPoster() {
      ctx.clearRect(0, 0, W, H);
      if (!markImg.naturalWidth) return;
      const cx = W / 2;
      const cy = H * layout.markCy;
      const { w: mw, h: mh } = fitNativeSize(markImg, 210 * S, 210 * S);
      ctx.drawImage(markImg, cx - mw / 2, cy - mh / 2, mw, mh);
    }

    function teardownUnlock() {
      window.removeEventListener("pointerdown", onUnlock, true);
      window.removeEventListener("keydown", onUnlock, true);
      window.removeEventListener("touchstart", onUnlock, true);
    }

    function signoffHost() {
      return cv.parentElement;
    }

    function clearSpiritTimer() {
      if (spiritTimer) {
        clearTimeout(spiritTimer);
        spiritTimer = 0;
      }
    }

    function stopSpirit() {
      clearSpiritTimer();
      if (!spirit) return;
      try {
        spirit.pause();
        spirit.currentTime = 0;
      } catch (_) {}
    }

    function tryPlaySpiritSync() {
      if (!opts.spiritSrc || opts.reducedMotion || !spirit) return false;
      try {
        spirit.currentTime = 0;
        const p = spirit.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
        return true;
      } catch (_) {
        return false;
      }
    }

    function scheduleSpiritPlay() {
      clearSpiritTimer();
      if (!opts.spiritSrc || opts.reducedMotion || !spirit) return;
      const delayMs = Math.max(0, spiritStartS() * 1000);
      if (delayMs === 0) {
        tryPlaySpiritSync();
        return;
      }
      spiritTimer = setTimeout(() => tryPlaySpiritSync(), delayMs);
    }

    function tryPlaySync() {
      if (opts.reducedMotion) return false;
      let ok = false;
      if (opts.sfxSrc && sfx) {
        try {
          sfx.currentTime = 0;
          const p = sfx.play();
          sfxPlayed = true;
          if (p && typeof p.catch === "function") p.catch(() => {});
          ok = true;
        } catch (_) {}
      }
      scheduleSpiritPlay();
      return ok || !!opts.spiritSrc;
    }

    function playSfxAsync() {
      if (!opts.sfxSrc || opts.reducedMotion) return Promise.resolve(true);
      return audioReady.then(() => {
        try {
          if (!sfx) {
            sfx = new Audio(opts.sfxSrc);
            sfx.preload = "auto";
            sfx.volume = opts.sfxVolume != null ? opts.sfxVolume : 0.55;
          } else {
            sfx.currentTime = 0;
          }
          return sfx
            .play()
            .then(() => {
              sfxPlayed = true;
              return true;
            })
            .catch(() => {
              try {
                sfx.pause();
                sfx.currentTime = 0;
              } catch (_) {}
              return false;
            });
        } catch (_) {
          return false;
        }
      });
    }

    function startAnim() {
      if (animStarted) return;
      animStarted = true;
      if (raf) cancelAnimationFrame(raf);
      animStart = null;
      const endT = totalDuration();
      function loop(ts) {
        if (animStart === null) animStart = ts;
        const t = Math.min((ts - animStart) / 1000, endT);
        render(t);
        if (t < endT) raf = requestAnimationFrame(loop);
        else if (opts.onComplete) opts.onComplete();
      }
      raf = requestAnimationFrame(loop);
    }

    function onSignoffReplay() {
      if (!launched || opts.reducedMotion) return;
      replayHero();
    }

    function setupReplayListener() {
      if (replayBound || opts.replayOnClick === false) return;
      const host = signoffHost();
      if (!host) return;
      replayBound = true;
      host.addEventListener("pointerdown", onSignoffReplay, { passive: true });
    }

    function teardownReplay() {
      const host = signoffHost();
      if (host) host.removeEventListener("pointerdown", onSignoffReplay);
      replayBound = false;
    }

    function replayHero() {
      if (!ready || opts.reducedMotion) return;
      if (raf) cancelAnimationFrame(raf);
      if (sfx) {
        try {
          sfx.pause();
          sfx.currentTime = 0;
        } catch (_) {}
      }
      stopSpirit();
      animStarted = false;
      animStart = null;
      tryPlaySync();
      startAnim();
    }

    function launchHero(extra) {
      extra = extra || {};
      if (launched || !ready) return;
      launched = true;
      teardownUnlock();
      if (opts.reducedMotion) {
        render(HOLD_T);
        if (opts.onComplete) opts.onComplete();
        return;
      }
      if (extra.signatureAlreadyPlaying) scheduleSpiritPlay();
      else tryPlaySync();
      startAnim();
      requestAnimationFrame(() => setupReplayListener());
    }

    function onUnlock(e) {
      if (launched) return;
      launchHero();
    }

    function setupUnlockListeners() {
      if (unlockBound) return;
      unlockBound = true;
      window.addEventListener("pointerdown", onUnlock, { capture: true, passive: true });
      window.addEventListener("keydown", onUnlock, { capture: true });
      window.addEventListener("touchstart", onUnlock, { capture: true, passive: true });
    }

    function boot() {
      if (!ready) {
        setTimeout(boot, 60);
        return;
      }
      setupUnlockListeners();
      playSfxAsync().then((ok) => {
        if (ok) launchHero({ signatureAlreadyPlaying: true });
        else renderPoster();
      });
    }

    return {
      unlock: launchHero,
      replay: replayHero,
      destroy() {
        teardownUnlock();
        teardownReplay();
        clearSpiritTimer();
        if (raf) cancelAnimationFrame(raf);
        if (sfx) {
          sfx.pause();
          sfx = null;
        }
        if (spirit) {
          spirit.pause();
          spirit = null;
        }
      },
    };
  }

  /** Left-aligned horizontal write-in (same clip technique as hero signoff). */
  function initSignatureWriteIn(host, opts) {
    opts = opts || {};
    if (!host) return { play() {}, destroy() {} };

    const canvas = document.createElement("canvas");
    canvas.className = opts.className || "sig-draw-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const sigImg = new Image();
    let raf = 0;
    let ready = false;
    let playing = false;
    let pendingPlay = null;
    const dur = opts.duration != null ? opts.duration : 1.15;

    function layout() {
      const cssCap = Math.min(opts.maxWidth || 260, window.innerWidth * 0.48);
      const { w: sigW, h: sigH } = fitNativeSize(sigImg, cssCap, cssCap * 0.5);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(sigW * dpr);
      canvas.height = Math.round(sigH * dpr);
      canvas.style.width = `${sigW}px`;
      canvas.style.height = `${sigH}px`;
      return { sigW, sigH, dpr };
    }

    function draw(p) {
      if (!ready || !sigImg.naturalWidth) return;
      const ctx = canvas.getContext("2d");
      const { sigW, sigH, dpr } = layout();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, sigW, sigH);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, sigW * clamp01(p), sigH);
      ctx.clip();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = smooth(clamp01(p));
      ctx.drawImage(sigImg, 0, 0, sigW, sigH);
      ctx.restore();
    }

    sigImg.onload = () => {
      ready = true;
      draw(0);
      if (pendingPlay != null) {
        const instant = pendingPlay;
        pendingPlay = null;
        play(instant);
      } else if (opts.autoplay) play(true);
    };
    sigImg.src = opts.sigSrc || "signature.png";

    function play(instant) {
      if (!ready) {
        pendingPlay = !!instant;
        return;
      }
      if (playing) return;
      if (instant || opts.reducedMotion) {
        draw(1);
        if (opts.onComplete) opts.onComplete();
        return;
      }
      playing = true;
      let start = null;
      function loop(ts) {
        if (start === null) start = ts;
        const t = Math.min((ts - start) / 1000, dur);
        draw(t / dur);
        if (t < dur) raf = requestAnimationFrame(loop);
        else {
          playing = false;
          if (opts.onComplete) opts.onComplete();
        }
      }
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }

    return {
      play,
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  }

  global.SCS_LOCKUP_LAYOUTS = LOCKUP_LAYOUTS;
  global.initScsSignoffLockup = initScsSignoffLockup;
  global.initSignatureWriteIn = initSignatureWriteIn;
})(typeof window !== "undefined" ? window : globalThis);
