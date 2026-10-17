/* =========================================================
   MixedByJack — analytics + lead source
   ---------------------------------------------------------
   Paste your IDs below. Any service left blank stays off.
   Tracking only runs on mixedbyjack.net, so preview links and
   local testing never show up in your reports (they log to the
   browser console instead).
   ========================================================= */
var ANALYTICS = {
  GA4_ID: "",                // Google Analytics 4, looks like "G-XXXXXXXXXX"
  GOOGLE_ADS_ID: "",         // Google Ads tag, looks like "AW-123456789"
  GOOGLE_ADS_LEAD_LABEL: "", // Google Ads conversion label for project inquiries, e.g. "AbC-D_efG-h12_34-567"
  META_PIXEL_ID: ""          // Meta Pixel ID, numbers only
};

(function(){
  var LIVE = /(^|\.)mixedbyjack\.net$/i.test(location.hostname);
  var A = ANALYTICS;

  /* ---------- Load the tags (live site only) ---------- */
  if (LIVE && (A.GA4_ID || A.GOOGLE_ADS_ID)){
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(A.GA4_ID || A.GOOGLE_ADS_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag("js", new Date());
    if (A.GA4_ID) gtag("config", A.GA4_ID);
    if (A.GOOGLE_ADS_ID) gtag("config", A.GOOGLE_ADS_ID);
  }
  if (LIVE && A.META_PIXEL_ID){
    /* Standard Meta Pixel loader */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq("init", A.META_PIXEL_ID);
    fbq("track", "PageView");
  }

  /* ---------- Site events ----------
     lead        a form was sent (form_type: intake | contact)
     form_open   a form popup was opened
     audio_play  someone pressed play on a track
     ab_compare  someone switched a Before / After player to the other version */
  window.mbjTrack = function(name, params){
    params = params || {};
    if (!LIVE){
      if (window.console) console.info("[analytics preview]", name, params);
      return;
    }
    try {
      var g = window.gtag, f = window.fbq, intake = params.form_type === "intake";
      if (name === "lead"){
        if (g && A.GA4_ID) g("event", "generate_lead", params);
        // Paid platforms only count project inquiries, so ads optimize for mix/master clients
        if (g && intake && A.GOOGLE_ADS_ID && A.GOOGLE_ADS_LEAD_LABEL)
          g("event", "conversion", { send_to: A.GOOGLE_ADS_ID + "/" + A.GOOGLE_ADS_LEAD_LABEL });
        if (f) f("track", intake ? "Lead" : "Contact");
      } else {
        if (g && A.GA4_ID) g("event", name, params);
        if (f){
          var meta = { form_open: "FormOpen", audio_play: "AudioPlay", ab_compare: "ABCompare" }[name];
          if (meta) f("trackCustom", meta, params);
        }
      }
    } catch (e) {}
  };

  /* ---------- Where did this visitor come from? ----------
     Remembers the last real source (ad, search, social, referral) for 90 days,
     so a lead who first clicks an ad and books a week later is still credited. */
  var KEY = "mbj_src", DAYS = 90;
  function store(){ try { return window.localStorage; } catch (e) { return null; } }
  function params(){
    var out = {};
    try { new URLSearchParams(location.search).forEach(function(v, k){ out[k.toLowerCase()] = v; }); } catch (e) {}
    return out;
  }
  function refHost(){
    try {
      if (!document.referrer) return "";
      var h = new URL(document.referrer).hostname.toLowerCase();
      return h === location.hostname.toLowerCase() ? "" : h.replace(/^www\./, "");
    } catch (e) { return ""; }
  }
  function nice(s){ return s.replace(/[-_+]+/g, " ").replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
  function classify(q, host){
    var src = (q.utm_source || "").toLowerCase(), med = (q.utm_medium || "").toLowerCase();
    var paid = /(cpc|ppc|paid|^ads?$|display|retarget)/.test(med);
    if (q.gclid || q.gbraid || q.wbraid || (src === "google" && paid)) return "Google Ads";
    if (/^(facebook|instagram|fb|ig|meta)$/.test(src) && paid) return "Meta Ads";
    if (src) return nice(src) + (med ? " / " + med : "");
    if (host){
      if (/(^|\.)google\./.test(host)) return "Google search";
      if (/(^|\.)bing\.com$/.test(host)) return "Bing search";
      if (/duckduckgo|yahoo\.|ecosia|search\.brave/.test(host)) return "Search (" + host + ")";
      if (/instagram\.com$/.test(host)) return "Instagram";
      if (/(facebook\.com|fb\.me|fb\.com)$/.test(host)) return "Facebook";
      if (/(youtube\.com|youtu\.be)$/.test(host)) return "YouTube";
      if (/tiktok\.com$/.test(host)) return "TikTok";
      if (/linktr\.ee$/.test(host)) return "Linktree";
      if (/(t\.co|x\.com|twitter\.com)$/.test(host)) return "X / Twitter";
      if (/reddit\.com$/.test(host)) return "Reddit";
      if (/spotify\.com$/.test(host)) return "Spotify";
      return "Website: " + host;
    }
    if (q.fbclid) return "Facebook / Instagram";
    return "";
  }

  var q = params(), host = refHost(), source = classify(q, host), saved = null, ls = store();
  try { saved = ls && JSON.parse(ls.getItem(KEY) || "null"); } catch (e) { saved = null; }
  if (saved && (Date.now() - (saved.t || 0)) > DAYS * 864e5) saved = null;

  // First page of this visit
  var landing = location.pathname;
  try {
    var ss = window.sessionStorage;
    if (ss.getItem("mbj_land")) landing = ss.getItem("mbj_land"); else ss.setItem("mbj_land", landing);
  } catch (e) {}

  if (source){
    saved = {
      source: source,
      campaign: [q.utm_campaign, q.utm_term, q.utm_content].filter(Boolean).join(" · "),
      landing: landing,
      t: Date.now()
    };
    try { ls && ls.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  /* Fields added to every form submission (columns in the leads sheet) */
  window.mbjSource = function(){
    var s = saved || { source: "Direct / unknown", campaign: "", landing: landing };
    return {
      lead_source: s.source,
      lead_campaign: (s.campaign || "").slice(0, 300),
      landing_page: s.landing || "/"
    };
  };
})();
