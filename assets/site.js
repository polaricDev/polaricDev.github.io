/* Polaric website: analytics events, download counts, the rating, and the page's live parts: the
   notch in the headline, the pinned story of what's new, the FPS slider, the meeting switches, the
   Reel and the feature recordings. */
(function () {
  "use strict";
  var VERSION = "1.2.0";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  function gtagReady() { return typeof window.gtag === "function"; }

  /* Sends a GA4 event, then calls done() once GA confirms it, or after a timeout if GA is slow or
     blocked. done() runs exactly once. */
  function sendEvent(name, params, done) {
    var called = false;
    function finish() { if (!called) { called = true; if (done) done(); } }
    if (gtagReady()) {
      var p = Object.assign({ transport_type: "beacon" }, params || {});
      if (done) { p.event_callback = finish; p.event_timeout = 1200; }
      window.gtag("event", name, p);
    }
    if (done) setTimeout(finish, 1500);
  }
  window.polaricEvent = sendEvent;

  /* Downloads: the click is reported as it happens. The release files are served as attachments, so
     the browser downloads them without leaving this page and GA4 sends the queued event. This counts
     clicks on a download button; whether the file finished downloading is not something a page can
     know (GitHub's release download counts measure that). */
  document.querySelectorAll("a[data-download]").forEach(function (a) {
    a.addEventListener("click", function () {
      var platform = a.getAttribute("data-download");
      sendEvent(platform === "macos" ? "download_macos" : "download_windows", {
        platform: platform,
        app_version: VERSION,
        file_name: a.href.split("/").pop(),
        link_url: a.href,
        button_location: a.closest("section") ? a.closest("section").id || "page" : "page"
      });
    });
  });
  document.querySelectorAll("a[data-guide]").forEach(function (a) {
    a.addEventListener("click", function () {
      sendEvent("download_guide", { language: a.getAttribute("data-guide"), file_name: a.href.split("/").pop(), link_url: a.href });
    });
  });
  document.querySelectorAll("a[data-support]").forEach(function (a) {
    a.addEventListener("click", function () {
      sendEvent("support_us_click", { link_url: a.href, button_location: a.closest("footer") ? "footer" : "support_band" });
    });
  });
  document.querySelectorAll("a[data-github]").forEach(function (a) {
    a.addEventListener("click", function () { sendEvent("view_on_github", { link_url: a.href, button_location: a.getAttribute("data-github") }); });
  });
  document.querySelectorAll("a[data-review]").forEach(function (a) {
    a.addEventListener("click", function () { sendEvent("write_review_click", { link_url: a.href }); });
  });
  document.querySelectorAll("a[data-star]").forEach(function (a) {
    a.addEventListener("click", function () { sendEvent("github_star_click", { link_url: a.href }); });
  });

  /* Download counts: the real number of times each file was downloaded, from GitHub's own release
     statistics (every release added together). Shown only once there is something to show. */
  var REPO = "polaricDev/polaricDev.github.io";
  function fmt(n) { return n.toLocaleString("en-US"); }
  function fetchJSON(url, key) {
    try {
      var c = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c && Date.now() - c.t < 5 * 60 * 1000) return Promise.resolve(c.d);
    } catch (e) {}
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} return d; });
  }
  if (window.fetch) {
    /* Replaced releases are deleted from GitHub (no going back to an old version); their downloads
       are kept in assets/downloads-base.json and added to the live counts. */
    var base = fetch("assets/downloads-base.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    Promise.all([fetchJSON("https://api.github.com/repos/" + REPO + "/releases?per_page=100", "polaric-releases-2"), base]).then(function (all) {
      var releases = all[0], b = all[1] || {};
      var n = { macos: +b.macos || 0, windows: +b.windows || 0 };
      releases.forEach(function (rel) {
        (rel.assets || []).forEach(function (as) {
          if (/\.dmg$/i.test(as.name)) n.macos += as.download_count;
          else if (/\.exe$/i.test(as.name)) n.windows += as.download_count;
        });
      });
      n.total = n.macos + n.windows;
      if (!n.total) return;
      var label = function (k) { return n[k] === 1 ? "download" : "downloads"; };
      ["total", "macos", "windows"].forEach(function (k) {
        document.querySelectorAll('[data-count="' + k + '"]').forEach(function (el) { el.textContent = fmt(n[k]); });
        document.querySelectorAll('[data-count-label="' + k + '"]').forEach(function (el) { el.textContent = label(k); });
      });
      document.querySelectorAll(".tally, .count").forEach(function (el) { el.hidden = false; });
    }).catch(function () {});
    fetchJSON("https://api.github.com/repos/" + REPO, "polaric-repo").then(function (repo) {
      var el = document.querySelector(".star-count");
      if (el && repo.stargazers_count > 0) { el.textContent = " · " + fmt(repo.stargazers_count) + (repo.stargazers_count === 1 ? " star" : " stars"); el.hidden = false; }
    }).catch(function () {});
  }

  /* Rating: one to five stars, sent once per browser to GA4 (rating, and value so the average can be
     read as event value ÷ event count). The visitor's choice is remembered on this device. */
  (function () {
    var group = document.querySelector(".stars");
    var status = document.getElementById("rate-status");
    if (!group) return;
    var stars = Array.prototype.slice.call(group.querySelectorAll("button"));
    var KEY = "polaric-rating";
    var saved = 0;
    try { saved = parseInt(localStorage.getItem(KEY) || "0", 10) || 0; } catch (e) {}
    group.hidden = false; status.hidden = false;
    function light(n) { stars.forEach(function (b, i) { b.classList.toggle("lit", i < n); }); }
    function lock(n) {
      stars.forEach(function (b, i) { b.setAttribute("aria-checked", i === n - 1 ? "true" : "false"); b.tabIndex = i === n - 1 ? 0 : -1; });
      group.setAttribute("aria-disabled", "true");
      light(n);
      status.textContent = "Thank you! You rated Polaric " + n + " out of 5. Tell us why in a review.";
    }
    if (saved >= 1 && saved <= 5) { lock(saved); return; }
    stars.forEach(function (b, i) {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener("mouseenter", function () { light(i + 1); });
      b.addEventListener("focus", function () { light(i + 1); });
      b.addEventListener("keydown", function (e) {
        var k = e.key, t = null;
        if (k === "ArrowRight" || k === "ArrowUp") t = stars[Math.min(i + 1, 4)];
        if (k === "ArrowLeft" || k === "ArrowDown") t = stars[Math.max(i - 1, 0)];
        if (t) { e.preventDefault(); t.focus(); }
      });
      b.addEventListener("click", function () {
        if (group.getAttribute("aria-disabled") === "true") return;
        var n = i + 1;
        try { localStorage.setItem(KEY, String(n)); } catch (e) {}
        sendEvent("rate_polaric", { rating: n, value: n, app_version: VERSION });
        lock(n);
      });
    });
    group.addEventListener("mouseleave", function () { if (group.getAttribute("aria-disabled") !== "true") light(0); });
  })();

  /* The visitor's own platform first in the hero. */
  (function () {
    if (!/Windows/i.test(navigator.userAgent || "")) return;
    var actions = document.querySelector(".hero-actions");
    if (!actions) return;
    var mac = actions.querySelector('[data-download="macos"]');
    var win = actions.querySelector('[data-download="windows"]');
    win.classList.replace("btn-quiet", "btn-primary");
    mac.classList.replace("btn-primary", "btn-quiet");
    actions.insertBefore(win, mac);
  })();

  /* The notch in the headline plays the new states, one after another. */
  (function () {
    var imgs = Array.prototype.slice.call(document.querySelectorAll(".reel img"));
    var caption = document.querySelector("[data-hero-caption]");
    var CAPTIONS = ["Game Awareness: 144 FPS, an excited mascot · Windows", "Meeting Awareness: camera and mic live · Windows", "The idle clock, with company · Windows", "Game Awareness: 18 FPS, a worried mascot · Windows"];
    if (!imgs.length) return;
    var i = 0;
    imgs[0].classList.add("on");
    if (reduced) return;
    setInterval(function () {
      if (document.hidden) return;
      var prev = imgs[i];
      i = (i + 1) % imgs.length;
      prev.classList.remove("on"); prev.classList.add("off");
      imgs[i].classList.remove("off"); imgs[i].classList.add("on");
      setTimeout(function () { prev.classList.remove("off"); }, 900);
      if (caption) caption.textContent = CAPTIONS[i];
    }, 2800);
  })();

  /* What's new: the stage on the left shows the chapter in view. */
  (function () {
    var chapters = document.querySelectorAll("[data-chapter]");
    var note = document.querySelector("[data-stage-note]");
    if (!("IntersectionObserver" in window)) return;
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var name = en.target.getAttribute("data-chapter");
        document.querySelectorAll("[data-stage]").forEach(function (img) { img.classList.toggle("on", img.getAttribute("data-stage") === name); });
        if (note) note.textContent = en.target.getAttribute("data-note") || "";
        if (!seen[name]) { seen[name] = true; sendEvent("whats_new_view", { feature: name, app_version: VERSION }); }
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach(function (c) { io.observe(c); });
  })();

  /* The idle clock on the stage shows the visitor's own time, as the notch would. */
  (function () {
    var el = document.querySelector("[data-clock-big]");
    if (!el) return;
    function tick() { el.textContent = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
    tick();
    setInterval(tick, 15000);
  })();

  /* The live thing: drag the frame rate, see the real notch and the mascot's face for it. */
  (function () {
    var range = document.getElementById("fps-range");
    var img = document.querySelector("[data-fps-img]");
    var out = document.querySelector("[data-fps-out]");
    var stage = document.querySelector('[data-stage="game"]');
    if (!range || !img) return;
    var FACES = [[120, "excited", "Excited"], [90, "happy", "Happy"], [60, "normal", "Normal"], [40, "concerned", "Concerned"], [25, "worried", "Worried"], [0, "sad", "Sad"]];
    var shown = "normal", told = false;
    FACES.forEach(function (f) { var p = new Image(); p.src = "assets/img/v12/win-game-" + f[1] + ".webp"; });
    function update() {
      var fps = +range.value, face = FACES[FACES.length - 1];
      for (var k = 0; k < FACES.length; k++) if (fps >= FACES[k][0]) { face = FACES[k]; break; }
      out.textContent = fps + " FPS · " + face[2];
      var big = document.querySelector("[data-fps-big]");
      if (big) big.textContent = fps;
      range.setAttribute("aria-valuetext", fps + " frames per second, mascot " + face[2].toLowerCase());
      if (face[1] !== shown) {
        shown = face[1];
        var src = "assets/img/v12/win-game-" + shown + ".webp";
        img.src = src;
        img.alt = "The Windows notch showing a game with the mascot's " + face[2].toLowerCase() + " face";
        if (stage) stage.src = src;
      }
    }
    range.addEventListener("input", function () {
      update();
      if (!told) { told = true; sendEvent("fps_slider_use", { app_version: VERSION }); }
    });
    update();
  })();

  /* Meeting switches: camera and microphone, each on or off, on the real notch. */
  (function () {
    var img = document.querySelector("[data-meet-img]");
    var switches = document.querySelectorAll(".switch[data-device]");
    var stage = document.querySelector('[data-stage="meeting"]');
    if (!img || !switches.length) return;
    var state = { cam: true, mic: true };
    ["on-on", "off-on", "on-off", "off-off"].forEach(function (n) { var p = new Image(); p.src = "assets/img/v12/win-meet-" + n + ".webp"; });
    switches.forEach(function (s) {
      s.addEventListener("click", function () {
        var d = s.getAttribute("data-device");
        state[d] = !state[d];
        s.setAttribute("aria-checked", state[d] ? "true" : "false");
        var name = (state.cam ? "on" : "off") + "-" + (state.mic ? "on" : "off");
        var cam = document.querySelector("[data-cam-big]"), mic = document.querySelector("[data-mic-big]");
        if (cam) { cam.textContent = "Cam " + (state.cam ? "ON" : "OFF"); cam.classList.toggle("on", state.cam); }
        if (mic) { mic.textContent = "Mic " + (state.mic ? "ON" : "OFF"); mic.classList.toggle("on", state.mic); }
        var src = "assets/img/v12/win-meet-" + name + ".webp";
        img.src = src;
        img.alt = "The notch showing Cam " + (state.cam ? "ON" : "OFF") + " and Mic " + (state.mic ? "ON" : "OFF");
        if (stage) stage.src = src;
      });
    });
  })();

  /* Videos play only while on screen (and never by themselves with less motion). */
  var onScreen = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting && !reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (!en.isIntersecting) v.pause();
    });
  }, { rootMargin: "100px 0px" }) : null;

  /* The Reel: muted while it plays by itself; one button turns the sound on. */
  (function () {
    var video = document.querySelector("[data-reel]");
    var btn = document.querySelector("[data-play-reel]");
    if (!video) return;
    if (onScreen) onScreen.observe(video);
    if (btn) btn.addEventListener("click", function () {
      var on = video.muted;
      video.muted = !on;
      if (on) { video.currentTime = 0; video.controls = true; var p = video.play(); if (p && p.catch) p.catch(function () {}); sendEvent("reel_play_sound", { app_version: VERSION }); }
      btn.textContent = on ? "Mute" : "Play with sound";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  })();

  /* Everything else: pointing at a row (or choosing it) plays that feature's real recording. */
  (function () {
    var video = document.querySelector("[data-feature-video]");
    var caption = document.querySelector("[data-feature-caption]");
    var rows = document.querySelectorAll(".feature-list button[data-clip]");
    if (!video) return;
    if (onScreen) onScreen.observe(video);
    var current = "lyrics", timer = null;
    function show(btn) {
      var name = btn.getAttribute("data-clip");
      rows.forEach(function (r) { r.setAttribute("aria-pressed", r === btn ? "true" : "false"); });
      if (name === current) return;
      current = name;
      var label = btn.querySelector(".f-name").textContent;
      video.classList.add("swap");
      clearTimeout(timer);
      timer = setTimeout(function () {
        video.src = "assets/clips/" + name + ".mp4";
        video.poster = "assets/clips/" + name + ".jpg";
        video.setAttribute("aria-label", "Polaric recording: " + label);
        if (!reduced) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        caption.textContent = label;
        video.classList.remove("swap");
      }, reduced ? 0 : 160);
    }
    rows.forEach(function (r) {
      r.addEventListener("click", function () { show(r); sendEvent("feature_clip_select", { feature: r.getAttribute("data-clip") }); });
      r.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) show(r); });
      r.addEventListener("focus", function () { show(r); });
    });
  })();

  /* Entrances: in every section the heading, then its text, then its picture. */
  (function () {
    if (reduced || !("IntersectionObserver" in window)) return;
    var groups = document.querySelectorAll(".new-head, .chapter, .watch, .features, .steps, .get, .close, .support, .foot");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    groups.forEach(function (g) {
      var parts = g.querySelectorAll(":scope > h2, :scope > h3, :scope > p, :scope > ul, :scope > ol, :scope > div, :scope > figure, :scope > img, .watch-copy > *, .watch-frame, .platform, .seg, .support-copy > *, .rate, .foot-mail, .foot-row");
      Array.prototype.forEach.call(parts, function (el, i) {
        if (el.hasAttribute("data-reveal")) return;
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--i", Math.min(i, 6));
        io.observe(el);
      });
    });
  })();
})();
