/* Polaric website: analytics events, the live notch in the hero, the video, clips that play when seen. */
(function () {
  "use strict";
  var VERSION = "1.1.0";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
     the browser downloads them without leaving this page and GA4 sends the queued event (it batches
     events for a few seconds). This counts clicks on a download button; whether the file finished
     downloading is not something a page can know (GitHub's release download counts measure that). */
  document.querySelectorAll("a[data-download]").forEach(function (a) {
    a.addEventListener("click", function () {
      var platform = a.getAttribute("data-download");
      sendEvent(platform === "macos" ? "download_macos" : "download_windows", {
        platform: platform,
        app_version: VERSION,
        file_name: a.href.split("/").pop(),
        link_url: a.href,
        button_location: a.closest("section") ? a.closest("section").id : "page"
      });
    });
  });

  document.querySelectorAll("a[data-guide]").forEach(function (a) {
    a.addEventListener("click", function () {
      sendEvent("download_guide", { language: a.getAttribute("data-guide"), file_name: a.href.split("/").pop(), link_url: a.href });
    });
  });

  /* Support opens in a new tab, so this page stays and the beacon has time to leave. */
  document.querySelectorAll("a[data-support]").forEach(function (a) {
    a.addEventListener("click", function () {
      sendEvent("support_us_click", { link_url: a.href, button_location: a.closest("footer") ? "footer" : "support_band" });
    });
  });

  /* Outbound links that open in a new tab: GitHub, YouTube, the promo video file, the review page. */
  document.querySelectorAll("a[data-github]").forEach(function (a) {
    a.addEventListener("click", function () { sendEvent("view_on_github", { link_url: a.href, button_location: a.getAttribute("data-github") }); });
  });
  document.querySelectorAll("a[data-youtube]").forEach(function (a) {
    a.addEventListener("click", function () { sendEvent("youtube_link_click", { link_url: a.href, video_id: "n1G_pY94t-M" }); });
  });
  document.querySelectorAll("a[data-video-download]").forEach(function (a) {
    a.addEventListener("click", function () { sendEvent("download_video", { file_name: a.href.split("/").pop(), link_url: a.href }); });
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
    fetchJSON("https://api.github.com/repos/" + REPO + "/releases?per_page=100", "polaric-releases").then(function (releases) {
      var n = { macos: 0, windows: 0 };
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
      document.querySelectorAll(".tally, .hero-count, .get-count").forEach(function (el) { el.hidden = false; });
    }).catch(function () {});
    fetchJSON("https://api.github.com/repos/" + REPO, "polaric-repo").then(function (repo) {
      var el = document.querySelector(".star-count");
      if (el && repo.stargazers_count > 0) { el.textContent = "★ " + fmt(repo.stargazers_count); el.hidden = false; }
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

  /* Put the visitor's own platform first in the hero. */
  (function () {
    var ua = navigator.userAgent || "";
    var isWin = /Windows/i.test(ua);
    var actions = document.querySelector(".hero-actions");
    if (!actions || !isWin) return;
    var mac = actions.querySelector('[data-download="macos"]');
    var win = actions.querySelector('[data-download="windows"]');
    win.classList.replace("btn-quiet", "btn-primary");
    mac.classList.replace("btn-primary", "btn-quiet");
    actions.insertBefore(win, mac);
  })();

  /* The live notch: pick a moment and the giant notch plays the real recording of it. */
  var CAPTIONS = {
    "lyrics": "Synced lyrics under the notch, line by line.",
    "email": "An email notice: who wrote, and the subject.",
    "meeting": "A minute before the meeting, with Join.",
    "open-music": "The Music page: artwork, controls and the song's progress.",
    "share": "ShareZone sending three files to a phone.",
    "timer": "A focus session ends: Snooze or OK."
  };
  var clip = document.getElementById("hero-clip");
  var caption = document.getElementById("clip-caption");
  var radios = Array.prototype.slice.call(document.querySelectorAll(".dock [role=radio]"));
  /* Until the visitor picks one, the dock moves on by itself when each recording ends. */
  var auto = !reduced;
  var current = radios[0];
  if (clip) clip.loop = !auto;
  function choose(btn, focus) {
    var name = btn.getAttribute("data-clip");
    current = btn;
    radios.forEach(function (r) { var on = r === btn; r.setAttribute("aria-checked", on ? "true" : "false"); r.tabIndex = on ? 0 : -1; r.style.setProperty("--p", 0); });
    if (focus) btn.focus();
    if (!clip) return;
    clip.classList.add("swap");
    setTimeout(function () {
      clip.src = "assets/clips/hero-" + name + ".mp4";
      clip.poster = "assets/clips/hero-" + name + ".jpg";
      clip.setAttribute("aria-label", "Polaric: " + CAPTIONS[name]);
      var p = clip.play(); if (p && p.catch) p.catch(function () {});
      caption.textContent = CAPTIONS[name];
      clip.classList.remove("swap");
    }, reduced ? 0 : 200);
  }
  function pick(btn, focus) {
    if (auto) { auto = false; if (clip) clip.loop = true; }
    choose(btn, focus);
    sendEvent("notch_preview_select", { moment: btn.getAttribute("data-clip") });
  }
  if (clip) {
    clip.addEventListener("ended", function () {
      if (auto) choose(radios[(radios.indexOf(current) + 1) % radios.length], false);
    });
    (function tick() {
      if (clip.duration && current) current.style.setProperty("--p", Math.min(1, clip.currentTime / clip.duration));
      requestAnimationFrame(tick);
    })();
  }
  radios.forEach(function (r, i) {
    r.tabIndex = r.getAttribute("aria-checked") === "true" ? 0 : -1;
    r.addEventListener("click", function () { pick(r, false); });
    r.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight" || k === "ArrowDown") n = radios[(i + 1) % radios.length];
      if (k === "ArrowLeft" || k === "ArrowUp") n = radios[(i - 1 + radios.length) % radios.length];
      if (n) { e.preventDefault(); pick(n, true); }
    });
  });
  /* The notch's glow turns like the app's; it holds still for reduced motion. */
  var shape = document.querySelector(".notch-shape");
  if (reduced && shape && shape.pauseAnimations) shape.pauseAnimations();

  /* The video loads only when asked, then reports when it really starts playing. */
  var VIDEO_ID = "n1G_pY94t-M";
  var played = false;
  var playBtn = document.getElementById("video-play");
  if (playBtn) playBtn.addEventListener("click", function () {
    var frame = document.getElementById("video-frame");
    var holder = document.createElement("div");
    holder.id = "yt-player";
    frame.innerHTML = "";
    frame.appendChild(holder);
    function build() {
      new window.YT.Player("yt-player", {
        videoId: VIDEO_ID,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: function (ev) { ev.target.playVideo(); },
          onStateChange: function (ev) {
            if (ev.data === window.YT.PlayerState.PLAYING && !played) {
              played = true;
              sendEvent("youtube_video_play", { video_id: VIDEO_ID, video_title: "Polaric Notch introduction", video_provider: "youtube" });
            }
          }
        }
      });
    }
    if (window.YT && window.YT.Player) { build(); return; }
    window.onYouTubeIframeAPIReady = build;
    var s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = function () { window.location.href = "https://youtu.be/" + VIDEO_ID; };
    document.head.appendChild(s);
  });

  /* Features: reported once, when the section is really on screen. */
  var features = document.getElementById("features");
  if (features && "IntersectionObserver" in window) {
    var seen = false;
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen) { seen = true; sendEvent("feature_section_view", { section: "features" }); obs.disconnect(); }
      });
    }, { threshold: 0.15 }).observe(features);
  }

  /* Clips play only while on screen. */
  var clips = document.querySelectorAll("video.clip");
  if ("IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { if (!reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else v.pause();
      });
    }, { rootMargin: "200px 0px" });
    clips.forEach(function (v) { vo.observe(v); });
  }
  if (reduced && clip) clip.pause();

  /* Entrances: heading, then text, then picture, as each section arrives. */
  if (!reduced && window.innerWidth > 760 && "IntersectionObserver" in window) {
    var groups = document.querySelectorAll(".video, .features-head, .feature, .more, .platforms, .download, .feedback, .foot");
    groups.forEach(function (g) {
      var parts = g.querySelectorAll("h2, h3, p, .dots, .stage, .video-frame, .platform, .get, .guide-links, .mail, .foot-mark, .btn-big");
      parts.forEach(function (el, i) { el.classList.add("reveal"); el.style.transitionDelay = Math.min(i, 6) * 70 + "ms"; });
    });
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { ro.observe(el); });
  }
})();
