/* =========================================================
   MixedByJack — site scripts
   ========================================================= */

/* ---------- Form settings ----------
   Leave FORM_ENDPOINT empty to run in preview mode (the form validates and
   shows the success screen but sends nothing). Paste a form service URL here
   (e.g. a Formspree endpoint) to start receiving submissions. */
var FORM_ENDPOINT = "";
/* Both forms post to one Google Apps Script web app (see apps-script/SETUP.md).
   Paste the web app URL here once, and every submission is added to your
   Google Sheet and the sender gets a confirmation email from your business address. */
var SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbyyUq5bsQBIeilbNO9lFakhoYgDSTUCPJiuHzKZwpzLr3lyq1dp6e_J34aBnX0jG1WDMw/exec";
function sendEvent(name, params){ try { if (window.mbjTrack) window.mbjTrack(name, params); } catch (e) {} }
function postToSheets(type, formData){
  var body = new URLSearchParams();
  formData.forEach(function(v, k){ if (typeof v === "string") body.append(k, v); });
  body.append("form_type", type);
  // where this visitor came from (see analytics.js) -> extra columns in the leads sheet
  var src = window.mbjSource ? window.mbjSource() : {};
  Object.keys(src).forEach(function(k){ body.append(k, src[k]); });
  // no-cors: Apps Script can't answer cross-site reads, so success = request left the browser
  return fetch(SHEETS_ENDPOINT, { method:"POST", mode:"no-cors", body:body });
}
var MAX_UPLOAD_MB = 100; // per-file size limit shown to visitors

/* ---------- Contact form settings ----------
   CONTACT_ENDPOINT: paste a form service URL (e.g. Formspree) to have messages
   emailed to you silently. While it's empty, the form opens the visitor's own
   email app with the message filled in, addressed to CONTACT_EMAIL. */
var CONTACT_ENDPOINT = "";
var CONTACT_EMAIL = "jbarrington7407@gmail.com";

/* A player list can show only some tracks: data-tracks="Title One|Title Two" */
function pickTracks(list, el){
  var want = (el.getAttribute("data-tracks") || "").split("|").filter(Boolean);
  if (!want.length) return list;
  return want.map(function(t){ return list.filter(function(x){ return x.title === t; })[0]; }).filter(Boolean);
}

/* ---------- Before / After tracks ---------- */
var TRACKS = [
  {
    title: "Met Your Match",
    artist: "Jakota Wass — Country",
    before: "assets/audio/met-your-match-before.mp3",
    after:  "assets/audio/met-your-match-after.mp3"
  },
  {
    title: "Too Little Too Late",
    artist: "SKOE — Rock",
    before: "assets/audio/too-little-too-late-before.mp3",
    after:  "assets/audio/too-little-too-late-after.mp3"
  },
  {
    title: "Discos Dead Now Breathe",
    artist: "Honey Plant — Funk",
    before: "assets/audio/discos-dead-now-breathe-before.mp3",
    after:  "assets/audio/discos-dead-now-breathe-after.mp3"
  }
];

/* ---------- FOH board mixes (portfolio) ---------- */
var BOARD_MIXES = [
  { title: "Time Loving You", artist: "Jakota Wass", src: "assets/audio/board/jakota-wass-time-loving-you.mp3?v=3" },
  { title: "The Music Never Stopped (The Grateful Dead Cover)", artist: "The Coffis Brothers", src: "assets/audio/board/coffis-brothers-the-music-never-stopped.mp3?v=3" },
  { title: "Don't Let Your Enemies Get You to Hate Your Friends", artist: "The Novelists", src: "assets/audio/board/the-novelists-dont-let-your-enemies.mp3?v=3" },
  { title: "Don't Know Why (Norah Jones Cover)", artist: "Salty Sally", src: "assets/audio/board/salty-sally-dont-know-why.mp3?v=4" },
  { title: "Redneck Man", artist: "Jakota Wass", src: "assets/audio/board/redneck-man.mp3?v=3" }
];

/* Every player on the page registers here so only one plays at a time */
var ALL_PLAYERS = [];

/* =========================================================
   Nav
   ========================================================= */
(function(){
  var nav = document.getElementById("nav");
  var toggle = nav.querySelector(".nav-toggle");
  function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
  toggle.addEventListener("click", function(){
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll(".nav-links a").forEach(function(a){
    a.addEventListener("click", function(){
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* =========================================================
   Hero video (some browsers need a nudge to autoplay)
   ========================================================= */
(function(){
  var v = document.querySelector(".hero-video");
  if (!v) return;
  var tryPlay = function(){ var p = v.play(); if (p && p.catch) p.catch(function(){}); };
  tryPlay();
  v.addEventListener("loadeddata", tryPlay, { once:true });
})();

/* =========================================================
   Reveal on scroll
   ========================================================= */
(function(){
  var els = document.querySelectorAll(".reveal, .from-left, .from-right");
  if (!("IntersectionObserver" in window)) { els.forEach(function(e){ e.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin:"0px 0px -8% 0px", threshold:0.08 });
  els.forEach(function(e){ io.observe(e); });
})();

/* Items that pop in one by one as they scroll into view (Live Sound section) */
(function(){
  var els = document.querySelectorAll(".pop");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) { els.forEach(function(e){ e.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin:"0px 0px -14% 0px", threshold:0.2 });
  els.forEach(function(e){ io.observe(e); });
})();

/* =========================================================
   About: animated sound-wave dividers (drawn, no video file)
   ========================================================= */
(function(){
  var canvases = document.querySelectorAll(".wave canvas");
  if (!canvases.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LAYERS = [
    { amp:1,   phase:0,   rgb:"192,132,252", alpha:.55, width:1.6 },
    { amp:.72, phase:2.1, rgb:"139,92,246",  alpha:.34, width:1.2 },
    { amp:.48, phase:4.3, rgb:"217,70,239",  alpha:.2,  width:1 }
  ];
  canvases.forEach(function(cv, idx){
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var w = 0, h = 0, visible = false, raf = 0, seed = idx * 7.31, start = performance.now();
    function size(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(now){
      raf = 0;
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      var vertical = h >= w, len = vertical ? h : w, cross = vertical ? w : h, mid = cross / 2;
      var steps = Math.max(80, Math.round(len / 3));
      LAYERS.forEach(function(L){
        ctx.beginPath();
        for (var i = 0; i <= steps; i++){
          var u = i / steps, pos = u * len;
          var edge = Math.sin(Math.PI * u); edge *= edge;                       // fade out at both ends
          var swell = .35 + .65 * Math.pow(.5 + .5 * Math.sin(u * 4.6 - t * .9 + seed + L.phase * .25), 2); // loudness travelling along the line
          var v = Math.sin(u * 34 + t * 2.4 + L.phase + seed) * .55
                + Math.sin(u * 83 - t * 3.6 + L.phase * 1.7) * .28
                + Math.sin(u * 11 + t * 1.1 + seed) * .17;
          var off = v * swell * edge * cross * .36 * L.amp;
          var x = vertical ? mid + off : pos, y = vertical ? pos : mid + off;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        var g = vertical ? ctx.createLinearGradient(0, 0, 0, h) : ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, "rgba(" + L.rgb + ",0)");
        g.addColorStop(.22, "rgba(" + L.rgb + "," + L.alpha + ")");
        g.addColorStop(.78, "rgba(" + L.rgb + "," + L.alpha + ")");
        g.addColorStop(1, "rgba(" + L.rgb + ",0)");
        ctx.strokeStyle = g; ctx.lineWidth = L.width; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.stroke();
      });
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    function kick(){ if (!raf) raf = requestAnimationFrame(frame); }
    size();
    window.addEventListener("resize", function(){ size(); kick(); });
    if ("IntersectionObserver" in window){
      new IntersectionObserver(function(entries){
        entries.forEach(function(en){ visible = en.isIntersecting; if (visible) kick(); });
      }).observe(cv);
    } else { visible = true; }
    kick();
  });
})();

/* =========================================================
   Before / After players
   ========================================================= */
(function(){
  var listEl = document.getElementById("players");
  if (!listEl) return;
  var BAR_COUNT = 88;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var allPlayers = ALL_PLAYERS;

  function generateBars(seed){
    var bars = [], s = seed || 1;
    for (var i = 0; i < BAR_COUNT; i++){
      s = (s * 9301 + 49297) % 233280;
      var r = s / 233280, t = i / BAR_COUNT;
      var env = Math.sin(t * Math.PI) * 0.55 + 0.45;
      bars.push(Math.max(0.08, Math.min(1, (0.22 + r * 0.78) * env)));
    }
    return bars;
  }
  function formatTime(s){
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function createPlayer(track, index){
    var card = document.createElement("div");
    card.className = "player-card loading untried reveal";
    card.setAttribute("data-active", "before");
    card.tabIndex = 0;
    var barsHtml = generateBars(index * 137 + 11).map(function(h){
      return '<div class="bar" style="height:' + (h * 100).toFixed(1) + '%"></div>';
    }).join("");
    card.innerHTML =
      '<div class="track-info"><h3></h3><p></p></div>' +
      '<div class="ab-row"><div class="ab-toggle" data-state="before"><div class="thumb"></div>' +
        '<button class="active" data-version="before">BEFORE</button>' +
        '<button data-version="after">AFTER</button></div></div>' +
      '<div class="waveform">' + barsHtml + '</div>' +
      '<div class="controls"><div class="controls-left">' +
        '<button class="play-btn" aria-label="Play">' +
          '<svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
          '<svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>' +
        '</button>' +
      '</div><span class="time">0:00 / 0:00</span></div>' +
      '<div class="error-msg">Audio failed to load.</div>';
    card.querySelector(".track-info h3").textContent = track.title;
    card.querySelector(".track-info p").textContent = track.artist;

    var audioBefore = new Audio(), audioAfter = new Audio();
    audioBefore.preload = "metadata"; audioAfter.preload = "metadata"; // full audio loads on first play
    audioBefore.src = track.before; audioAfter.src = track.after;

    var state = { playing:false, active:"before", duration:0, ready:0 };
    var audioCtx = null, gainBefore = null, gainAfter = null;
    var playBtn = card.querySelector(".play-btn");
    var timeEl = card.querySelector(".time");
    var waveform = card.querySelector(".waveform");
    var barEls = card.querySelectorAll(".bar");
    var toggle = card.querySelector(".ab-toggle");
    var toggleBtns = card.querySelectorAll(".ab-toggle button");

    function initWebAudio(){
      if (audioCtx) return;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var srcB = audioCtx.createMediaElementSource(audioBefore);
        var srcA = audioCtx.createMediaElementSource(audioAfter);
        gainBefore = audioCtx.createGain(); gainAfter = audioCtx.createGain();
        gainBefore.gain.value = state.active === "before" ? 1 : 0;
        gainAfter.gain.value  = state.active === "after" ? 1 : 0;
        srcB.connect(gainBefore); gainBefore.connect(audioCtx.destination);
        srcA.connect(gainAfter);  gainAfter.connect(audioCtx.destination);
      } catch (e) { audioCtx = null; }
    }
    function bothDur(){
      return Math.min(isFinite(audioBefore.duration) ? audioBefore.duration : 0,
                      isFinite(audioAfter.duration) ? audioAfter.duration : 0);
    }
    function onReady(){
      state.ready++;
      if (state.ready >= 2 && !card.classList.contains("error")){
        card.classList.remove("loading");
        state.duration = bothDur();
        timeEl.textContent = "0:00 / " + formatTime(state.duration);
      }
    }
    var readyEvent = "loadedmetadata";
    audioBefore.addEventListener(readyEvent, onReady, { once:true });
    audioAfter.addEventListener(readyEvent, onReady, { once:true });
    if (isIOS){ audioBefore.load(); audioAfter.load(); }
    setTimeout(function(){
      if (card.classList.contains("loading") && !card.classList.contains("error")){
        card.classList.remove("loading");
        state.duration = bothDur() || audioBefore.duration || 0;
        timeEl.textContent = "0:00 / " + formatTime(state.duration);
      }
    }, 4000);
    function onError(){ card.classList.remove("loading"); card.classList.add("error"); }
    audioBefore.addEventListener("error", onError);
    audioAfter.addEventListener("error", onError);

    var trackedPlay = false, trackedCompare = false;
    function setActive(version){
      if (version === state.active) return;
      state.active = version;
      if (!trackedCompare){ trackedCompare = true; sendEvent("ab_compare", { track: track.title }); }
      if (version === "after") card.classList.remove("untried");
      card.setAttribute("data-active", version);
      toggle.setAttribute("data-state", version);
      toggleBtns.forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-version") === version); });
      if (audioCtx && gainBefore && gainAfter){
        var now = audioCtx.currentTime;
        gainBefore.gain.cancelScheduledValues(now); gainAfter.gain.cancelScheduledValues(now);
        gainBefore.gain.setValueAtTime(version === "before" ? 1 : 0, now);
        gainAfter.gain.setValueAtTime(version === "after" ? 1 : 0, now);
      }
    }
    toggleBtns.forEach(function(btn){
      btn.addEventListener("click", function(e){ e.stopPropagation(); setActive(btn.getAttribute("data-version")); });
    });

    function play(){
      allPlayers.forEach(function(p){ if (p !== api) p.pause(); });
      initWebAudio();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
      audioAfter.currentTime = audioBefore.currentTime;
      Promise.all([audioBefore.play(), audioAfter.play()]).then(function(){
        state.playing = true; card.classList.add("playing");
        if (!trackedPlay){ trackedPlay = true; sendEvent("audio_play", { player: "before_after", track: track.title }); }
        listEl.classList.add("engaged");
        var d = bothDur(); if (d > 0) state.duration = d;
      }).catch(function(){});
    }
    function pause(){
      audioBefore.pause(); audioAfter.pause();
      state.playing = false; card.classList.remove("playing");
    }
    function togglePlay(){ state.playing ? pause() : play(); }
    playBtn.addEventListener("click", function(e){ e.stopPropagation(); togglePlay(); });

    audioBefore.addEventListener("timeupdate", function(){
      var t = audioBefore.currentTime, d = state.duration || audioBefore.duration || 0;
      timeEl.textContent = formatTime(t) + " / " + formatTime(d);
      var played = Math.floor((d > 0 ? t / d : 0) * barEls.length);
      for (var i = 0; i < barEls.length; i++) barEls[i].classList.toggle("played", i < played);
      if (Math.abs(audioBefore.currentTime - audioAfter.currentTime) > 0.08) audioAfter.currentTime = audioBefore.currentTime;
    });
    audioBefore.addEventListener("ended", function(){
      pause(); audioBefore.currentTime = 0; audioAfter.currentTime = 0;
      barEls.forEach(function(b){ b.classList.remove("played"); });
      timeEl.textContent = "0:00 / " + formatTime(state.duration);
    });

    function scrubAt(clientX){
      var rect = waveform.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      var d = state.duration || audioBefore.duration || 0;
      if (d > 0){ audioBefore.currentTime = pct * d; audioAfter.currentTime = pct * d; }
    }
    waveform.addEventListener("click", function(e){ scrubAt(e.clientX); });
    var scrubbing = false;
    waveform.addEventListener("touchstart", function(e){ e.preventDefault(); scrubbing = true; scrubAt(e.touches[0].clientX); }, { passive:false });
    waveform.addEventListener("touchmove", function(e){ if (!scrubbing) return; e.preventDefault(); scrubAt(e.touches[0].clientX); }, { passive:false });
    waveform.addEventListener("touchend", function(){ scrubbing = false; }, { passive:true });

    card.addEventListener("keydown", function(e){
      if (e.target.tagName === "BUTTON" && e.key !== " ") return;
      var k = e.key.toLowerCase();
      if (e.key === " "){ e.preventDefault(); togglePlay(); }
      else if (k === "b") setActive("before");
      else if (k === "a") setActive("after");
    });

    var api = { play:play, pause:pause };
    allPlayers.push(api);
    return card;
  }

  pickTracks(TRACKS, listEl).forEach(function(t, i){ listEl.appendChild(createPlayer(t, i)); });

  // Players are added after the reveal observer ran, so reveal them here
  if ("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold:0.08 });
    listEl.querySelectorAll(".reveal").forEach(function(c){ io.observe(c); });
  } else {
    listEl.querySelectorAll(".reveal").forEach(function(c){ c.classList.add("in"); });
  }
})();

/* =========================================================
   FOH board mix players (single track)
   ========================================================= */
(function(){
  var listEl = document.getElementById("board-players");
  if (!listEl) return;
  var BAR_COUNT = 64;

  function bars(seed){
    var out = [], s = seed || 1;
    for (var i = 0; i < BAR_COUNT; i++){
      s = (s * 9301 + 49297) % 233280;
      var r = s / 233280, t = i / BAR_COUNT;
      var env = Math.sin(t * Math.PI) * 0.4 + 0.6;
      out.push(Math.max(0.12, Math.min(1, (0.3 + r * 0.7) * env)));
    }
    return out;
  }
  function fmt(s){
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  pickTracks(BOARD_MIXES, listEl).forEach(function(track, index){
    var row = document.createElement("div");
    row.className = "board-row reveal";
    row.innerHTML =
      '<button class="play-btn" aria-label="Play">' +
        '<svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '<svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>' +
      '</button>' +
      '<div class="board-main">' +
        '<div class="board-top"><div class="board-info"><h4></h4><p></p></div><span class="time">0:00</span></div>' +
        '<div class="waveform">' + bars(index * 211 + 37).map(function(h){
          return '<div class="bar" style="height:' + (h * 100).toFixed(1) + '%"></div>';
        }).join("") + '</div>' +
      '</div>';
    row.querySelector("h4").textContent = track.title;
    row.querySelector("p").textContent = track.artist;

    var audio = new Audio();
    audio.preload = "metadata";
    audio.src = track.src;
    var playing = false;
    var timeEl = row.querySelector(".time");
    var wave = row.querySelector(".waveform");
    var barEls = row.querySelectorAll(".bar");

    audio.addEventListener("loadedmetadata", function(){ timeEl.textContent = fmt(audio.duration); });
    audio.addEventListener("error", function(){ row.classList.add("error"); timeEl.textContent = "unavailable"; });

    var trackedPlay = false;
    function started(){
      playing = true; row.classList.add("playing");
      if (!trackedPlay){ trackedPlay = true; sendEvent("audio_play", { player: "board_mix", track: track.title }); }
    }
    function play(){
      ALL_PLAYERS.forEach(function(p){ if (p !== api) p.pause(); });
      var pr = audio.play();
      if (pr && pr.then) pr.then(started).catch(function(){});
      else started();
    }
    function pause(){ audio.pause(); playing = false; row.classList.remove("playing"); }
    row.querySelector(".play-btn").addEventListener("click", function(){ playing ? pause() : play(); });

    audio.addEventListener("timeupdate", function(){
      var d = audio.duration || 0, t = audio.currentTime;
      timeEl.textContent = fmt(t) + " / " + fmt(d);
      var n = Math.floor((d > 0 ? t / d : 0) * barEls.length);
      for (var i = 0; i < barEls.length; i++) barEls[i].classList.toggle("played", i < n);
    });
    audio.addEventListener("ended", function(){
      pause(); audio.currentTime = 0;
      barEls.forEach(function(b){ b.classList.remove("played"); });
      timeEl.textContent = fmt(audio.duration);
    });

    function scrubAt(x){
      var r = wave.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (x - r.left) / r.width));
      if (audio.duration) audio.currentTime = pct * audio.duration;
    }
    wave.addEventListener("click", function(e){ scrubAt(e.clientX); });
    wave.addEventListener("touchstart", function(e){ e.preventDefault(); scrubAt(e.touches[0].clientX); }, { passive:false });
    wave.addEventListener("touchmove", function(e){ e.preventDefault(); scrubAt(e.touches[0].clientX); }, { passive:false });

    var api = { play:play, pause:pause };
    ALL_PLAYERS.push(api);
    listEl.appendChild(row);
  });

  var rows = listEl.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold:0.08 });
    rows.forEach(function(r){ io.observe(r); });
  } else { rows.forEach(function(r){ r.classList.add("in"); }); }
})();

/* =========================================================
   Intake modal + form
   ========================================================= */
(function(){
  var modal = document.getElementById("intake");
  var form = document.getElementById("intake-form");
  var submitBtn = document.getElementById("f-submit");
  var fileInput = document.getElementById("f-files");
  var fileList = document.getElementById("file-list");
  var dropzone = document.getElementById("dropzone");
  var lastFocus = null;
  var files = [];

  function openModal(e){
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.classList.remove("sent");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    sendEvent("form_open", { form_type: "intake" });
    setTimeout(function(){ document.getElementById("f-first").focus(); }, 60);
  }
  function closeModal(){
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    if (modal.classList.contains("sent")){
      setTimeout(function(){ form.reset(); files = []; renderFiles(); modal.classList.remove("sent"); }, 300);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-open-intake]").forEach(function(el){ el.addEventListener("click", openModal); });
  modal.querySelectorAll("[data-close-intake]").forEach(function(el){ el.addEventListener("click", closeModal); });
  modal.addEventListener("click", function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

  /* Files */
  function fmtSize(b){ return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function renderFiles(){
    fileList.innerHTML = "";
    files.forEach(function(f, i){
      var li = document.createElement("li");
      var name = document.createElement("span"); name.className = "fname"; name.textContent = f.name;
      var size = document.createElement("span"); size.className = "fsize";
      size.textContent = fmtSize(f.size) + (f.size > MAX_UPLOAD_MB * 1048576 ? " · too large" : "");
      var rm = document.createElement("button"); rm.type = "button"; rm.setAttribute("aria-label", "Remove " + f.name); rm.innerHTML = "&times;";
      rm.addEventListener("click", function(){ files.splice(i, 1); renderFiles(); });
      li.appendChild(name); li.appendChild(size); li.appendChild(rm);
      fileList.appendChild(li);
    });
  }
  function addFiles(list){
    Array.prototype.forEach.call(list, function(f){
      if (!files.some(function(x){ return x.name === f.name && x.size === f.size; })) files.push(f);
    });
    renderFiles();
  }
  if (fileInput && dropzone){
  fileInput.addEventListener("change", function(){ addFiles(fileInput.files); fileInput.value = ""; });
  ["dragenter","dragover"].forEach(function(ev){
    dropzone.addEventListener(ev, function(e){ e.preventDefault(); dropzone.classList.add("drag"); });
  });
  ["dragleave","drop"].forEach(function(ev){
    dropzone.addEventListener(ev, function(e){ e.preventDefault(); dropzone.classList.remove("drag"); });
  });
  dropzone.addEventListener("drop", function(e){ if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  }

  /* Validation */
  function validField(field){
    var type = field.getAttribute("data-type");
    if (type === "choice") return !!field.querySelector("input:checked");
    var input = field.querySelector(".input");
    var v = input.value.trim();
    if (!v) return false;
    if (type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return true;
  }
  form.querySelectorAll("[data-required]").forEach(function(field){
    field.addEventListener("input", function(){ if (field.classList.contains("invalid") && validField(field)) field.classList.remove("invalid"); });
    field.addEventListener("change", function(){ if (field.classList.contains("invalid") && validField(field)) field.classList.remove("invalid"); });
  });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var firstBad = null;
    form.querySelectorAll("[data-required]").forEach(function(field){
      var ok = validField(field);
      field.classList.toggle("invalid", !ok);
      if (!ok && !firstBad) firstBad = field;
    });
    if (firstBad){
      var el = firstBad.querySelector("input");
      if (el) el.focus();
      return;
    }

    var data = new FormData(form);
    var first = document.getElementById("f-first").value.trim();

    function done(){
      document.getElementById("success-name").textContent = first ? ", " + first : "";
      modal.classList.add("sent");
      sendEvent("lead", { form_type: "intake", project_type: (data.get("project_type") || ""), lead_source: window.mbjSource ? window.mbjSource().lead_source : "" });
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send My Project <span class="arrow">→</span>';
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    if (!SHEETS_ENDPOINT){
      // Preview mode: nothing is sent
      setTimeout(done, 700);
      return;
    }
    postToSheets("intake", data)
      .then(function(){ done(); })
      .catch(function(){
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send My Project <span class="arrow">→</span>';
        alert("Something went wrong sending your project. Please try again, or reach out on Instagram @mixed.by.jack.");
      });
  });
})();

/* =========================================================
   Contact modal (name, email, message)
   ========================================================= */
(function(){
  var modal = document.getElementById("contact");
  if (!modal) return;
  var form = document.getElementById("contact-form");
  var btn = document.getElementById("c-submit");
  var lastFocus = null;
  function open(e){
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.classList.remove("sent");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    sendEvent("form_open", { form_type: "contact" });
    setTimeout(function(){ document.getElementById("c-name").focus(); }, 60);
  }
  function close(){
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    if (modal.classList.contains("sent")) setTimeout(function(){ form.reset(); modal.classList.remove("sent"); }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-open-contact]").forEach(function(el){ el.addEventListener("click", open); });
  modal.querySelectorAll("[data-close-contact]").forEach(function(el){ el.addEventListener("click", close); });
  modal.addEventListener("click", function(e){ if (e.target === modal) close(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && modal.classList.contains("open")) close(); });

  function valid(field){
    var el = field.querySelector("input,textarea"); var v = el.value.trim();
    if (!v) return false;
    if (field.getAttribute("data-type") === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return true;
  }
  form.querySelectorAll("[data-required]").forEach(function(f){
    f.addEventListener("input", function(){ if (f.classList.contains("invalid") && valid(f)) f.classList.remove("invalid"); });
  });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var bad = null;
    form.querySelectorAll("[data-required]").forEach(function(f){
      var ok = valid(f); f.classList.toggle("invalid", !ok); if (!ok && !bad) bad = f;
    });
    if (bad){ bad.querySelector("input,textarea").focus(); return; }
    var name = document.getElementById("c-name").value.trim();
    var email = document.getElementById("c-email").value.trim();
    var msg = document.getElementById("c-msg").value.trim();
    function done(){
      document.getElementById("c-success-name").textContent = name ? ", " + name.split(" ")[0] : "";
      modal.classList.add("sent");
      sendEvent("lead", { form_type: "contact", lead_source: window.mbjSource ? window.mbjSource().lead_source : "" });
      btn.disabled = false; btn.innerHTML = 'Send Message <span class="arrow">→</span>';
    }
    if (!SHEETS_ENDPOINT){
      var subject = "Website message from " + name;
      var body = msg + "\n\n" + name + "\n" + email;
      window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      done();
      return;
    }
    btn.disabled = true; btn.textContent = "Sending...";
    var data = new FormData(form);
    postToSheets("contact", data)
      .then(function(){ done(); })
      .catch(function(){
        btn.disabled = false; btn.innerHTML = 'Send Message <span class="arrow">→</span>';
        alert("Something went wrong sending your message. Please try again, or reach out on Instagram @mixed.by.jack.");
      });
  });
})();

/* In-page links: lazy images and reveals can shift the layout while the page
   scrolls, so re-aim once the first scroll settles. */
document.querySelectorAll('a[href="#clients"], a[href="#board-mixes"]').forEach(function(a){
  a.addEventListener("click", function(e){
    var id = a.getAttribute("href").slice(1);
    var t = document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    history.replaceState(null, "", "#" + id);
    t.scrollIntoView({ behavior:"smooth", block:"start" });
    setTimeout(function(){ t.scrollIntoView({ behavior:"smooth", block:"start" }); }, 900);
    setTimeout(function(){ t.scrollIntoView({ behavior:"auto", block:"start" }); }, 1800);
  });
});

/* =========================================================
   Featured video (genre pages): big play button, then native controls.
   Optional Before/After: a separate "before" audio file plays in sync with
   the video, and the toggle switches which one you hear.
   ========================================================= */
document.querySelectorAll(".feature-video").forEach(function(box){
  var v = box.querySelector("video"), btn = box.querySelector(".fv-play");
  if (!v || !btn) return;
  var before = box.querySelector("audio.fv-before");
  var bar = box.parentNode.querySelector(".fv-ab");
  var toggle = bar && bar.querySelector(".ab-toggle");
  var state = "after", tracked = false, trackedCompare = false;
  var api = { pause: function(){ v.pause(); } };
  ALL_PLAYERS.push(api);   // other players pause this video when they start

  /* Both keep playing in sync; flipping just mutes one and unmutes the other.
     (Plain muting works everywhere, including iPhones on silent mode.) */
  function applyState(){
    var b = state === "before";
    if (before){ v.muted = b; before.muted = !b; }
    box.classList.toggle("before-on", b);
    if (toggle){
      toggle.setAttribute("data-state", state);
      toggle.querySelectorAll("button").forEach(function(x){
        var on = x.getAttribute("data-version") === state;
        x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }
  function sync(force){
    if (!before || before.readyState < 1) return;
    if (force || Math.abs(before.currentTime - v.currentTime) > 0.08){
      try { before.currentTime = v.currentTime; } catch (e) {}
    }
  }
  function startBefore(){
    if (!before || v.paused) return;
    before.playbackRate = v.playbackRate;
    sync(true);
    var pr = before.play(); if (pr && pr.catch) pr.catch(function(){});
  }
  function setState(next){
    if (next === state) return;
    state = next;
    if (state === "before") sync(true);
    applyState();
    box.classList.remove("untried");
    if (!trackedCompare){ trackedCompare = true; sendEvent("ab_compare", { track: box.getAttribute("data-title") || "" }); }
  }

  btn.addEventListener("click", function(){
    if (before){ before.preload = "auto"; before.load(); }
    v.setAttribute("controls", "");
    var pr = v.play(); if (pr && pr.catch) pr.catch(function(){});
  });
  v.addEventListener("play", function(){
    box.classList.add("started");
    ALL_PLAYERS.forEach(function(p){ if (p !== api) p.pause(); });
    if (before) startBefore();
    if (!tracked){ tracked = true; sendEvent("video_play", { video: box.getAttribute("data-title") || "" }); }
  });

  if (!before) return;
  v.addEventListener("pause", function(){ before.pause(); });
  v.addEventListener("ended", function(){ before.pause(); });
  v.addEventListener("waiting", function(){ before.pause(); });
  v.addEventListener("playing", startBefore);
  v.addEventListener("seeking", function(){ sync(true); });
  v.addEventListener("seeked", function(){ sync(true); });
  v.addEventListener("ratechange", function(){ before.playbackRate = v.playbackRate; });
  // Unmuting the video with its own controls while on Before means "let me hear the mix"
  v.addEventListener("volumechange", function(){
    before.volume = v.volume;
    if (state === "before" && !v.muted){ state = "after"; applyState(); }
  });
  setInterval(function(){ if (!v.paused && !before.paused) sync(false); }, 400);
  before.addEventListener("error", function(){ if (bar) bar.style.display = "none"; state = "after"; applyState(); });

  if (toggle){
    box.classList.add("untried");
    toggle.querySelectorAll("button").forEach(function(x){
      x.addEventListener("click", function(){ setState(x.getAttribute("data-version")); });
    });
  }
  // B / A keys switch while the video is playing (also works in full screen)
  document.addEventListener("keydown", function(e){
    if (!box.classList.contains("started") || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    var k = (e.key || "").toLowerCase();
    if (k === "b") setState("before"); else if (k === "a") setState("after");
  });
  applyState();
});
