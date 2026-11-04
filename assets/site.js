/* Polaric website, 1.3.2: analytics events, download counts, the notch fixed at the top that plays each
   chapter's moment, the Privacy Mode demo, the customize board, the video, the rating. */
(function () {
  "use strict";
  var VERSION = "1.3.2";
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

  /* Downloads: the click is reported as it happens (GitHub's own release counts measure finished downloads). */
  document.querySelectorAll("a[data-download]").forEach(function (a) {
    a.addEventListener("click", function () {
      var platform = a.getAttribute("data-download");
      sendEvent(platform === "macos" ? "download_macos" : "download_windows", {
        platform: platform,
        app_version: VERSION,
        file_name: a.href.split("/").pop(),
        link_url: a.href,
        button_location: a.closest("section") ? a.closest("section").id || a.closest("section").className.split(" ").pop() : "page"
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

  /* Download counts: every release's downloads added together, plus the downloads of releases that were
     replaced (assets/downloads-base.json). When GitHub's API can't be reached (60 calls an hour per
     visitor), the snapshot taken at the last release stands in, so the count never drops to nothing. */
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
    var base = fetch("assets/downloads-base.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    var live = fetchJSON("https://api.github.com/repos/" + REPO + "/releases?per_page=100", "polaric-releases-2").catch(function () { return null; });
    Promise.all([live, base]).then(function (all) {
      var b = all[1] || {};
      var releases = all[0] || [{ assets: [{ name: "x.dmg", download_count: +(b.snapshot && b.snapshot.macos) || 0 }, { name: "x.exe", download_count: +(b.snapshot && b.snapshot.windows) || 0 }] }];
      var n = { macos: +b.macos || 0, windows: +b.windows || 0 };
      releases.forEach(function (rel) {
        (rel.assets || []).forEach(function (as) {
          if (/\.dmg$/i.test(as.name)) n.macos += as.download_count;
          else if (/\.exe$/i.test(as.name)) n.windows += as.download_count;
        });
      });
      n.total = n.macos + n.windows;
      if (!n.total) return;
      ["total", "macos", "windows"].forEach(function (k) {
        document.querySelectorAll('[data-count="' + k + '"]').forEach(function (el) { el.textContent = fmt(n[k]); });
        document.querySelectorAll('[data-count-label="' + k + '"]').forEach(function (el) { el.textContent = n[k] === 1 ? "download" : "downloads"; });
      });
      document.querySelectorAll(".tally").forEach(function (el) { el.hidden = false; });
    }).catch(function () {});
    fetchJSON("https://api.github.com/repos/" + REPO, "polaric-repo").then(function (repo) {
      var el = document.querySelector(".star-count");
      if (el && repo.stargazers_count > 0) { el.textContent = " · " + fmt(repo.stargazers_count) + (repo.stargazers_count === 1 ? " star" : " stars"); el.hidden = false; }
    }).catch(function () {});
  }

  /* Rating: one to five stars, sent once per browser to GA4. The choice is remembered on this device. */
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

  /* The visitor's own platform first. */
  (function () {
    if (!/Windows/i.test(navigator.userAgent || "")) return;
    document.querySelectorAll(".hero-actions, .dl-actions").forEach(function (box) {
      var mac = box.querySelector('[data-download="macos"]'), win = box.querySelector('[data-download="windows"]');
      win.classList.replace("btn-line", "btn-ink"); mac.classList.replace("btn-ink", "btn-line");
      box.insertBefore(win, mac);
    });
  })();

  /* The notch at the top: each chapter plays its own moments; pressing it shows the next one. */
  var SAY = {
    wave: "The mascot waves hello.", music: "Now playing: What If? by Valtazar.", lyric: "Synced lyrics under the notch.", lyric2: "Synced lyrics under the notch.",
    whatsapp: "New message received from Alex.", email: "Email received, with its subject.", meeting: "Meeting in 1 minute, with Join.", "mic-cam": "Mic on, camera off during a call.",
    "ai-task": "Claude Code: task completed.", "ai-free": "Your AI limit is available again.", download: "Download complete.", airpods: "AirPods Pro connected, with battery.",
    network: "Network Unstable: some apps may respond slowly.", camera: "Camera in use.", todo: "A to-do reminder.", volume: "Volume at 62.",
    "privacy-page": "Privacy & Network: what uses your camera and microphone.", gold: "The Gold theme.", calendar: "Today's meetings.", clock: "The idle clock on Windows.",
    rest: "The mascot rests.", "game-excited": "A game at 144 FPS, the mascot cheering.", battery: "Battery level.", wifi: "Wi-Fi connected."
  };
  var MOMENTS = {
    hero: ["wave", "music", "lyric", "whatsapp", "network", "airpods"],
    music: ["music", "lyric", "lyric2"], whatsapp: ["whatsapp", "email", "airpods", "download"], "privacy-page": ["camera", "mic-cam"],
    gold: ["lyric2", "music", "wave"], wave: ["wave", "rest"], lyric: ["lyric2", "meeting", "ai-task", "game-excited"], calendar: ["todo", "timer"],
    clock: ["clock", "clock-aura", "game-excited"], download: ["download", "wifi"], "ai-free": ["ai-free", "battery"], todo: ["todo"], rest: ["rest", "wave"]
  };
  var notch = document.getElementById("live-notch"), na = document.getElementById("notch-a"), nb = document.getElementById("notch-b"), say = document.getElementById("notch-say");
  var front = na, back = nb, shown = "wave", chapter = "hero", step = 0, timer = null, pinned = false;
  /* The pictures are drawn at twice the size: shown at their real size, never wider than the screen. */
  function size(img) { if (img.naturalWidth) img.style.width = Math.min(img.naturalWidth / 2, window.innerWidth * 0.94) + "px"; }
  function show(name, announce) {
    if (!notch || name === shown) return;
    shown = name;
    back.src = "assets/img/notch/" + name + ".webp";
    var swap = function () { size(back); back.classList.remove("out"); front.classList.add("out"); var t = front; front = back; back = t; };
    if (back.complete) swap(); else back.onload = swap;
    if (announce && say) say.textContent = SAY[name] || "";
  }
  function play() {
    clearInterval(timer);
    if (reduced || pinned) return;
    timer = setInterval(function () {
      var list = MOMENTS[chapter] || [chapter];
      if (list.length < 2) return;
      step = (step + 1) % list.length; show(list[step]);
    }, 3200);
  }
  if (notch) {
    nb.classList.add("out");
    [na, nb].forEach(function (i) { if (i.complete) size(i); else i.addEventListener("load", function () { size(i); }); });
    window.addEventListener("resize", function () { size(front); });
    notch.addEventListener("click", function () {
      var list = MOMENTS[chapter] || [chapter];
      step = (step + 1) % list.length; show(list[step], true);
      pinned = false; play();
      sendEvent("notch_preview_select", { moment: list[step] });
    });
    // preload what the hero cycles through
    (MOMENTS.hero).forEach(function (n) { var i = new Image(); i.src = "assets/img/notch/" + n + ".webp"; });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var next = en.target.getAttribute("data-notch");
          if (pinned && next === chapter) return; // a picked tile stays until the visitor moves on
          chapter = next; step = 0; pinned = false;
          show((MOMENTS[chapter] || [chapter])[0]); play();
        });
      }, { rootMargin: "-48% 0px -50% 0px" });
      document.querySelectorAll("[data-notch]").forEach(function (s) { io.observe(s); });
    }
    play();
    /* Folds to a strip while a heading or the menu would sit under it (Polaric's Browser-Aware Mode does the same over browser tabs). */
    var heads = Array.prototype.slice.call(document.querySelectorAll("h1, h2, .bar nav, .bar .mark"));
    var ticking = false;
    function tuck() {
      ticking = false;
      var r = front.getBoundingClientRect(), hit = false;
      var bottom = front.offsetHeight; // the unfolded height: folding must not change the answer
      r = { left: r.left, right: r.right, bottom: bottom, height: bottom };
      if (r.height) for (var i = 0; i < heads.length && !hit; i++) {
        var h = heads[i].getBoundingClientRect();
        hit = h.top < r.bottom + 6 && h.bottom > 0 && h.left < r.right && h.right > r.left;
      }
      notch.classList.toggle("tuck", hit || moving);
    }
    /* On a phone the notch covers the text you're reading: it tucks away while you scroll and comes back when you stop. */
    var moving = false, still = null;
    window.addEventListener("scroll", function () {
      if (window.innerWidth <= 860) {
        moving = true; clearTimeout(still);
        still = setTimeout(function () { moving = false; tuck(); }, 900);
      }
      tuck();
    }, { passive: true });
    window.addEventListener("resize", tuck);
    setTimeout(tuck, 400);
  }

  /* Notification tiles: the notch at the top plays the one you pick. */
  document.querySelectorAll(".tile[data-show]").forEach(function (t) {
    t.setAttribute("aria-pressed", "false");
    t.addEventListener("click", function () {
      document.querySelectorAll(".tile[data-show]").forEach(function (o) { o.setAttribute("aria-pressed", o === t ? "true" : "false"); });
      pinned = true; clearInterval(timer); chapter = t.closest("[data-notch]").getAttribute("data-notch");
      show(t.getAttribute("data-show"), true);
      sendEvent("notch_preview_select", { moment: t.getAttribute("data-show") });
    });
  });

  /* Privacy Mode demo: the log keeps running under the glass; unlock with ⌥⇧U or the corner pattern. */
  (function () {
    var log = document.getElementById("pm-log"), cover = document.getElementById("pm-cover"), quads = document.getElementById("pm-quads");
    var toggle = document.getElementById("pm-toggle"), key = document.getElementById("pm-key"), words = document.getElementById("pm-words");
    var input = document.getElementById("pm-text"), status = document.getElementById("pm-status");
    if (!log) return;
    var files = ["auth", "theme", "settings", "router", "notch", "api", "store", "ui"], kinds = ["index", "view", "model"], n = 0, lines = [];
    function tick() {
      var f = files[n % 8] + "/" + kinds[n % 3] + ".ts";
      lines.push('<span class="n">[' + String(n).padStart(4, "0") + ']</span> compiling <span class="f">src/' + f + '</span> <span class="ok">ok</span>');
      if (lines.length > 14) lines.shift();
      log.innerHTML = lines.join("\n"); n++;
    }
    for (var i = 0; i < 12; i++) tick();
    setInterval(tick, reduced ? 2000 : 420);
    var PATTERN = ["tr", "tl", "tr", "bl"], got = 0, on = false;
    function render() {
      var t = (input.value || "").replace(/\s+/g, " ").trim();
      if (!t) { words.innerHTML = ""; return; }
      var i = t.lastIndexOf(" ");
      var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
      words.innerHTML = i < 0 ? "<b>" + esc(t) + "</b>" : esc(t.slice(0, i + 1)) + "<b>" + esc(t.slice(i + 1)) + "</b>";
    }
    function set(v, how) {
      on = v; got = 0;
      cover.hidden = false; quads.hidden = !v;
      requestAnimationFrame(function () { cover.classList.toggle("on", v); });
      if (!v) setTimeout(function () { if (!on) cover.hidden = true; }, 400);
      toggle.setAttribute("aria-pressed", v ? "true" : "false");
      key.textContent = v ? "⌥⇧U" : "⌥⇧L";
      status.textContent = v ? "Covered. The build keeps compiling underneath. Unlock: tap top right, top left, top right, bottom left, or press ⌥⇧U."
                             : how === "pattern" ? "Unlocked with the secret pattern." : "Press the button or ⌥⇧L to cover the screen again.";
      if (v) sendEvent("privacy_demo", { action: "on" });
    }
    render();
    input.addEventListener("input", render);
    toggle.addEventListener("click", function () { set(!on); });
    quads.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit");
        var q = b.getAttribute("data-q");
        if (PATTERN[got] === q) got++; else got = PATTERN[0] === q ? 1 : 0;
        if (got === PATTERN.length) { set(false, "pattern"); sendEvent("privacy_demo", { action: "pattern" }); }
      });
    });
    document.addEventListener("keydown", function (e) {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      if (e.code === "KeyL") { e.preventDefault(); set(true); }
      if (e.code === "KeyU") { e.preventDefault(); set(false); }
    });
  })();

  /* Customize board */
  (function () {
    var sw = document.querySelectorAll(".swatches [role=radio]");
    sw.forEach(function (b) {
      b.addEventListener("click", function () {
        sw.forEach(function (o) { o.setAttribute("aria-checked", o === b ? "true" : "false"); });
        document.documentElement.style.setProperty("--glow", getComputedStyle(b).getPropertyValue("--c"));
      });
    });
    var pill = document.getElementById("island-pill"), x = document.getElementById("island-x"), y = document.getElementById("island-y");
    function place() {
      if (!pill) return;
      var dx = +x.value, dy = +y.value;
      pill.classList.toggle("float", dy > 12 || Math.abs(dx) > 8);
      pill.style.transform = "translate(" + (dx * 1.1) + "%, " + (dy * 3) + "%)";
    }
    if (x) { x.addEventListener("input", place); y.addEventListener("input", place); place(); }
    document.querySelectorAll(".sw[role=switch]").forEach(function (s) {
      s.addEventListener("click", function () { s.setAttribute("aria-checked", s.getAttribute("aria-checked") === "true" ? "false" : "true"); });
    });
    var fonts = [["Bricolage Grotesque", 800, "92%"], ["Montserrat", 700, "100%"], ["Poppins", 600, "100%"], ["Inter", 600, "100%"], ["IBM Plex Sans", 600, "100%"], ["Lato", 700, "100%"], ["Open Sans", 600, "100%"]];
    var fi = 0, sample = document.getElementById("type-sample"), fname = document.getElementById("type-name");
    if (sample) sample.addEventListener("click", function () {
      fi = (fi + 1) % fonts.length;
      var f = fonts[fi];
      sample.style.fontFamily = '"' + f[0] + '", "Bricolage Grotesque", system-ui, sans-serif';
      sample.style.fontWeight = f[1];
      fname.textContent = f[0];
    });
    var greet = document.getElementById("greet"), langs = document.querySelectorAll(".seg [role=radio]");
    langs.forEach(function (b) {
      b.addEventListener("click", function () {
        langs.forEach(function (o) { o.setAttribute("aria-checked", o === b ? "true" : "false"); });
        greet.textContent = b.getAttribute("data-lang") === "id" ? "Notch kamu, hidup." : "Your notch, alive.";
      });
    });
  })();

  /* The video (hosted with the site) loads only when asked, then reports when it really starts playing. */
  var played = false;
  var playBtn = document.getElementById("video-play");
  if (playBtn) playBtn.addEventListener("click", function () {
    var frame = document.getElementById("video-frame");
    sendEvent("video_open", { video_title: "A day with Polaric (1.3.2)" });
    var v = document.createElement("video");
    v.src = "assets/clips/polaric-promo-en.mp4";
    v.controls = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute("poster", "assets/img/video-poster.jpg");
    v.style.width = "100%"; v.style.height = "100%"; v.style.display = "block";
    v.addEventListener("playing", function () {
      if (played) return;
      played = true;
      sendEvent("video_play", { video_title: "A day with Polaric (1.3.2)", video_provider: "site" });
    });
    frame.innerHTML = "";
    frame.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  });

  /* The film's preview loop plays only while it's on screen. */
  var loop = document.querySelector(".film-loop");
  if (loop && !reduced && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { var p = loop.play(); if (p && p.catch) p.catch(function () {}); } else loop.pause(); });
    }, { rootMargin: "120px 0px" }).observe(loop);
  }

  /* Features seen: reported once. */
  var features = document.getElementById("notifications");
  if (features && "IntersectionObserver" in window) {
    var seen = false;
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen) { seen = true; sendEvent("feature_section_view", { section: "notifications" }); obs.disconnect(); }
      });
    }, { threshold: 0.3 }).observe(features);
  }

  /* Entrances: heading, then text, then pictures, as each chapter arrives. */
  if (!reduced && "IntersectionObserver" in window) {
    document.querySelectorAll("main > section, .foot").forEach(function (s) {
      var parts = s.querySelectorAll("h1 span, h2, .ch-head p, .hero-foot > *, .film-head p, .film-frame, .tile, .privacy-copy > *, .privacy-demo, .b-head, .b-tile, .crew-wall figure, .day-field, .list-cols dl, .plat figure, .dl-figure > *, .dl-steps, .rate-body, .support-copy, .blocks span, .rate > div:first-child p");
      parts.forEach(function (el, i) { el.classList.add("reveal"); el.style.setProperty("--d", Math.min(i, 8) * 75 + "ms"); });
    });
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { ro.observe(el); });
    /* A jump (a link, the End key) skips the observer: anything already scrolled past shows at once. */
    var sweep = function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); });
    };
    window.addEventListener("scroll", function () { requestAnimationFrame(sweep); }, { passive: true });
    window.addEventListener("resize", sweep);
  }
})();
