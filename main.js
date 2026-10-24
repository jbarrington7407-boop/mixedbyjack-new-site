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
   About: dividers drawn like the logo (rounded bars and a dot), with bar
   lengths following the real levels of the Met Your Match mix as it scrolls
   ========================================================= */
(function(){
  var canvases = document.querySelectorAll(".wave canvas");
  if (!canvases.length) return;
  var LEVELS = "000000000000012122221221212221222221122222221222111221222666566668777777785777677867777778677766677665666865776567555555586777777878887777777766777666776677766665855566658566655586667667785777767687788878777778888887778886777767666777787787777878777757676876787778888878888878788887788887877866788888787776788777776776777678888878888887788887778788878887778788888786877878867788777687888888788887887877688878788788777777777777777777667679887776788778877887788866877775589788887698778888978888888777778795787787877888789776888787887877987778787966788888888877787787777988888879888888887888777877887888888888888878888987888877867777769788878886888788977787778878877897778778977788879888877687777877987888788888888778788877787778876978888889788888898888888878778769777777797888888887888877877777779777887787777777776776678666666686777666866687778677766677666667777778777867687668677666686666666867665777676765487548855977777778787878787778866976887778888876588776887677778878988886678788787797887876878888889888877788888877988777768777887788788765887888778978887688778888898888878888777889788677788888888977788887778887788777888888887788988888888778877788767777877787778787866798878787887788889777887787777778988888888887777779788887877777787967787888778887798777787877888878877877888556877798888877876777779887887798888888988888878677888797887888888888889888888887788888876887888878887888777788888787788878887888867887798888887877786669878988888888887887878877877777779888888887788878988887888778777697777777977888889888887788778888988878878888788778776777687778777877677768777787786777877877777689777687778777668797757776877786779776777586787767977777677677788798787877878887779777677777777777887778878877777788777877887887787877787769887776798877878877777779777677687777778876778778878776888777887887788777787887777777666877787876988888888888888777778668877877879778888888888888888888888888887889778888798888777988776789987887698888887987788768677777798888887898787877978888778776787696887788878888789778777888777878887787788877788798888888787877778988798888788888788788887877777769888888887887877988887888888777797777777888888888888888879777888897779897878888878678687687777777977778779787888788888887887779888888888788788888787777776877777779676687687778888977887777766686768777777787878886877777658778786696787777868697639764887698878787877877667777777777666666666655555555554444444433233322323222111100000000000000000000000000000000000000000000000000000000000000000000";   // 12 values per second, 0-9
  var RATE = 12, N = LEVELS.length, LOGO = "#8B5CF6";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // logo pattern: short bar, long bar, short bar, dot
  var PATTERN = [34/54, 1, 34/54, "dot"];
  function level(t){ var i = Math.floor(t * RATE) % N; if (i < 0) i += N; return (+LEVELS.charAt(i)) / 9; }
  function pill(ctx, x, y, w, h){
    var r = Math.min(h, w) / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }
  canvases.forEach(function(cv, idx){
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    var w = 0, h = 0, visible = false, raf = 0, start = performance.now() - idx * 41000;
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
      var vertical = h >= w, len = vertical ? h : w, cross = vertical ? w : h;
      var thick = 6, pitch = 14, speed = 16, maxLen = Math.min(cross * .82, 76);
      var shift = (t * speed) % (pitch * PATTERN.length);
      ctx.fillStyle = LOGO;
      for (var p = -pitch * PATTERN.length; p < len + pitch; p += pitch){
        var pos = p + shift;                                   // moves toward the bottom / right
        var row = Math.round((p + pitch * PATTERN.length) / pitch) % PATTERN.length;
        var u = pos / len; if (u < 0 || u > 1) continue;
        var fade = Math.min(1, u / .16, (1 - u) / .16);       // soft ends
        ctx.globalAlpha = Math.max(0, fade);
        var kind = PATTERN[(PATTERN.length - row) % PATTERN.length];
        var c = cross / 2;
        if (kind === "dot"){
          ctx.beginPath();
          if (vertical) ctx.arc(c, pos, thick * .95, 0, Math.PI * 2); else ctx.arc(pos, c, thick * .95, 0, Math.PI * 2);
          ctx.fill();
        } else {
          var lv = level(t - pos / speed);
          var L = Math.max(thick * 1.6, maxLen * kind * (.3 + .7 * lv));
          if (vertical) pill(ctx, c - L/2, pos - thick/2, L, thick); else pill(ctx, pos - thick/2, c - L/2, thick, L);
        }
      }
      ctx.globalAlpha = 1;
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
   Optional Before/After: the raw ("before") track plays in sync with the
   video and the toggle switches which one you hear.
   - Desktop: a second <audio> element, flipped with mute.
   - iPhone/iPad: Safari won't play two media elements with sound at once,
     so the raw track is decoded and played through Web Audio instead.
   ========================================================= */
document.querySelectorAll(".feature-video").forEach(function(box){
  var v = box.querySelector("video"), btn = box.querySelector(".fv-play");
  if (!v || !btn) return;
  var beforeEl = box.querySelector("audio.fv-before");
  var bar = box.parentNode.querySelector(".fv-ab");
  var toggle = bar && bar.querySelector(".ab-toggle");
  var state = "after", tracked = false, trackedCompare = false;
  var api = { pause: function(){ v.pause(); } };
  ALL_PLAYERS.push(api);   // other players pause this video when they start

  var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var AC = window.AudioContext || window.webkitAudioContext;

  /* ---------- Backend A: <audio> element (desktop, Android) ---------- */
  function ElementTrack(el){
    var self = this;
    el.muted = true;
    this.unlock = function(){
      el.preload = "auto";
      if (el.paused){ try { el.currentTime = v.currentTime; } catch (e) {} var p = el.play(); if (p && p.catch) p.catch(function(){}); }
    };
    this.start = function(){
      if (v.paused) return;
      el.playbackRate = v.playbackRate;
      try { el.currentTime = v.currentTime; } catch (e) {}
      var p = el.play(); if (p && p.catch) p.catch(function(){});
    };
    this.stop = function(){ el.pause(); };
    this.seek = function(){ if (el.readyState >= 1){ try { el.currentTime = v.currentTime; } catch (e) {} } };
    this.rate = function(){ el.playbackRate = v.playbackRate; };
    this.audible = function(on){ el.muted = !on; };
    this.drift = function(){
      if (v.paused || el.paused || el.readyState < 1) return;
      if (Math.abs(el.currentTime - v.currentTime) > 0.08) self.seek();
    };
    this.volume = function(){ el.volume = v.volume; };
    el.addEventListener("error", function(){ self.onfail && self.onfail(); });
  }

  /* ---------- Backend B: Web Audio (iPhone / iPad) ---------- */
  function WebAudioTrack(url){
    var self = this, ctx = null, gain = null, buf = null, src = null;
    var loading = false, t0 = 0, pos0 = 0, rate = 1, on = false;
    function load(){
      if (buf || loading || !ctx) return;
      loading = true;
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true); xhr.responseType = "arraybuffer";
      xhr.onload = function(){
        if (xhr.status >= 400){ loading = false; self.onfail && self.onfail(); return; }
        ctx.decodeAudioData(xhr.response, function(b){
          buf = b; loading = false; box.classList.remove("before-loading");
          if (!v.paused) self.start();
        }, function(){ loading = false; self.onfail && self.onfail(); });
      };
      xhr.onerror = function(){ loading = false; self.onfail && self.onfail(); };
      xhr.send();
    }
    this.unlock = function(){
      if (!AC) return;
      if (!ctx){
        try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
        ctx = new AC();
        gain = ctx.createGain(); gain.gain.value = on ? 1 : 0; gain.connect(ctx.destination);
        var s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, 22050); s.connect(ctx.destination); s.start(0);
      }
      if (ctx.state === "suspended") ctx.resume();
      load();
    };
    function stopSrc(){ if (src){ try { src.stop(0); } catch (e) {} try { src.disconnect(); } catch (e) {} src = null; } }
    this.start = function(){
      stopSrc();
      if (!buf || !ctx || v.paused) return;
      if (ctx.state === "suspended") ctx.resume();
      var off = Math.max(0, Math.min(v.currentTime, buf.duration - 0.05));
      src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
      src.connect(gain); src.start(0, off);
      t0 = ctx.currentTime; pos0 = off;
    };
    this.stop = stopSrc;
    this.seek = function(){ if (!v.paused) self.start(); };
    this.rate = function(){ rate = v.playbackRate || 1; if (!v.paused) self.start(); };
    this.audible = function(want){
      on = want;
      if (want && !buf){ box.classList.add("before-loading"); self.unlock(); }
      if (gain) gain.gain.setTargetAtTime(want ? (v.volume || 1) : 0, ctx.currentTime, 0.012);
    };
    this.drift = function(){
      if (!src || v.paused) return;
      var p = pos0 + (ctx.currentTime - t0) * rate;
      if (Math.abs(p - v.currentTime) > 0.06) self.start();
    };
    this.volume = function(){ if (gain && on) gain.gain.value = v.volume; };
  }

  var track = null;
  if (beforeEl){
    track = (IOS && AC) ? new WebAudioTrack(beforeEl.getAttribute("src")) : new ElementTrack(beforeEl);
    track.onfail = function(){ if (bar) bar.style.display = "none"; state = "after"; applyState(); track = null; };
  }

  function applyState(){
    var b = state === "before";
    if (track){ v.muted = b; track.audible(b); }
    box.classList.toggle("before-on", b);
    if (toggle){
      toggle.setAttribute("data-state", state);
      toggle.querySelectorAll("button").forEach(function(x){
        var on = x.getAttribute("data-version") === state;
        x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }
  function setState(next){
    if (next === state) return;
    state = next;
    if (track){ track.unlock(); if (!v.paused) track.start(); }
    applyState();
    box.classList.remove("untried");
    if (!trackedCompare){ trackedCompare = true; sendEvent("ab_compare", { track: box.getAttribute("data-title") || "" }); }
  }

  btn.addEventListener("click", function(){
    v.setAttribute("controls", "");
    var pr = v.play(); if (pr && pr.catch) pr.catch(function(){});
    if (track) track.unlock();      // must happen inside the tap on phones
  });
  v.addEventListener("play", function(){
    box.classList.add("started");
    ALL_PLAYERS.forEach(function(p){ if (p !== api) p.pause(); });
    if (track) track.start();
    if (!tracked){ tracked = true; sendEvent("video_play", { video: box.getAttribute("data-title") || "" }); }
  });

  if (!track) return;
  v.addEventListener("playing", function(){ track && track.start(); });
  v.addEventListener("pause", function(){ track && track.stop(); });
  v.addEventListener("ended", function(){ track && track.stop(); });
  v.addEventListener("waiting", function(){ track && track.stop(); });
  v.addEventListener("seeked", function(){ track && track.seek(); });
  v.addEventListener("ratechange", function(){ track && track.rate(); });
  // Unmuting the video with its own controls while on Before means "let me hear the mix"
  v.addEventListener("volumechange", function(){
    if (!track) return;
    track.volume();
    if (state === "before" && !v.muted){ state = "after"; applyState(); }
  });
  setInterval(function(){ track && track.drift(); }, 400);

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
