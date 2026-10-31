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
  var radios = Array.prototype.slice.call(document.querySelectorAll(".moment-list [role=radio]"));
  function choose(btn, focus) {
    var name = btn.getAttribute("data-clip");
    radios.forEach(function (r) { var on = r === btn; r.setAttribute("aria-checked", on ? "true" : "false"); r.tabIndex = on ? 0 : -1; });
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
  radios.forEach(function (r, i) {
    r.tabIndex = r.getAttribute("aria-checked") === "true" ? 0 : -1;
    r.addEventListener("click", function () { choose(r, false); });
    r.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight" || k === "ArrowDown") n = radios[(i + 1) % radios.length];
      if (k === "ArrowLeft" || k === "ArrowUp") n = radios[(i - 1 + radios.length) % radios.length];
      if (n) { e.preventDefault(); choose(n, true); }
    });
  });

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
