#!/usr/bin/env python3
"""Builds the service / genre pages from index.html's nav, footer and modals.

Run from the repo root:  python3 tools/build_pages.py
Edit PRICES and the PAGES content below, then re-run.
"""
import html, json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://www.mixedbyjack.net"

# None = not decided yet (shows a dashed "price TBD" box)
PRICES = {"mix": 300, "master": 100, "bundle": 350}

SPOTIFY = {
    "zines": ("The Zines by The Zines on Spotify", "https://open.spotify.com/embed/album/1oE1qBCgJQDPARWsbunAj9?utm_source=generator", 352),
    "charity": ("Four Ever by Charity Kiss on Spotify", "https://open.spotify.com/embed/album/7y5wFGn7A2jJnb17vfEDU3?utm_source=generator", 352),
    "moshe": ("Afterglow by Moshe on Spotify", "https://open.spotify.com/embed/track/5AKsgfSMQgeQwxDvPoNpX8?utm_source=generator", 152),
}

STUDIO = {
    "zines": ("The Zines", "Indie rock"),
    "charity": ("Charity Kiss", "Indie rock"),
    "fka": ("FKA Fingers", "Industrial"),
    "moshe": ("Moshe", "Pop / electronic"),
    "jakota": ("Jakota Wass", "Country"),
}

COMMON_STEPS = [
    ("Send your tracks", "Fill out the project form and share a link to your raw multitrack WAV files (Dropbox, Google Drive, or WeTransfer). Export every track from the same starting point so everything lines up."),
    ("First mix in 7 days", "I listen through, get a feel for the song, and send you the first version of your mix within 7 days."),
    ("Revisions until you're happy", "Send me notes and I'll keep refining it. There's no cap on revisions. We keep going until it sounds the way you heard it in your head."),
    ("Get your final WAV", "Once you sign off, you get one finished WAV file per song, ready for mastering or release."),
]

COMMON_FAQ = [
    ("How long does a mix take?", "You'll get the first version of your mix within 7 days of sending your files."),
    ("How many revisions do I get?", "As many as you need. I'll keep making changes until you're happy with the mix."),
    ("What files do I need to send?", "All of your raw multitrack files as WAVs, exported from the same starting point so they line up. You can share them through Dropbox, Google Drive, or WeTransfer."),
    ("What do I get back?", "One finished WAV file for each song."),
    ("Do you work with artists outside the US?", "Yes. Everything happens online, and I've worked with artists across six continents."),
    ("Is mastering included?", "Mixing and mastering are booked separately, but they're cheaper when you bundle them together."),
]

PAGES = [
    {
        "slug": "online-mixing",
        "title": "Online Mixing Services | Professional Song Mixing | MixedByJack",
        "desc": "Send your multitrack WAVs from anywhere and get a professional mix from Jack Barrington. First mix in 7 days and unlimited revisions. Trusted by artists on six continents.",
        "crumb": "Online Mixing",
        "h1": "Online Mixing Services",
        "lede": "Send me your tracks from anywhere in the world. I'll mix your song so it hits as hard as the moment you wrote it.",
        "bg": "assets/mixing.jpg",
        "service": ("Online mixing", "Music mixing"),
        "intro_h": "Mixing that keeps the feeling",
        "intro": [
            "Mixing live shows most nights of the week has shaped how I mix in the studio. Every show has its own energy, and so does every recording session. My job is to keep that energy intact and put the listener right in the room where your song was made.",
            "I work with artists remotely across six continents. You send your raw multitrack WAVs, I build the mix, and we go back and forth until it sounds exactly the way you heard it in your head. <strong>No revision limits.</strong>",
        ],
        "work": ["zines", "charity", "moshe"],
        "credits": ["zines", "charity", "jakota", "moshe", "fka"],
        "faq": COMMON_FAQ,
    },
    {
        "slug": "online-mastering",
        "title": "Online Mastering Services | Song & EP Mastering | MixedByJack",
        "desc": "Online mastering by Jack Barrington. Send your finished mix as a WAV and get a release-ready master back. Bundle with mixing for a lower price.",
        "crumb": "Online Mastering",
        "h1": "Online Mastering Services",
        "lede": "The last step before release. Send your finished mix and get back a master that's ready for streaming, radio, and everything in between.",
        "bg": "assets/mastering.jpg",
        "service": ("Online mastering", "Music mastering"),
        "intro_h": "Ready for every speaker",
        "intro": [
            "Mastering is about making your song translate: earbuds, car speakers, club systems, and everything else your listeners use. I treat every master with the same goal as every mix, which is keeping the feeling that made the song worth releasing.",
            "Book mastering on its own if your mix is done, or <strong>bundle it with mixing</strong> and save.",
        ],
        "steps": [
            ("Send your mix", "Fill out the project form and share your finished mix as a WAV file."),
            ("I master your song", "I prepare your master and send it back for you to check."),
            ("Revisions until you're happy", "If anything needs adjusting, tell me. There's no cap on revisions."),
            ("Get your final WAV", "You get one finished WAV file per song, ready for release."),
        ],
        "work": ["charity", "zines"],
        "credits": ["zines", "charity", "jakota", "moshe", "fka"],
        "faq": [
            ("What do I need to send?", "Your finished mix as a WAV file for each song."),
            ("How many revisions do I get?", "As many as you need until you're happy with the master."),
            ("What do I get back?", "One finished WAV file for each song."),
            ("Can you mix and master my song?", "Yes. Mixing and mastering are booked separately, and they're cheaper when you bundle them together."),
            ("Do you work with artists outside the US?", "Yes. Everything happens online, and I've worked with artists across six continents."),
        ],
    },
    {
        "slug": "rock-mixing",
        "title": "Rock Mixing Engineer Online | Rock & Alternative Mixing | MixedByJack",
        "desc": "Online rock and alternative mixing by Jack Barrington, a live sound engineer and drummer. Studio credits include The Zines, Charity Kiss, and FKA Fingers.",
        "crumb": "Rock Mixing",
        "h1": "Rock & Alternative Mixing",
        "lede": "Big drums, guitars with weight, and vocals that sit right on top. Mixed online by an engineer who spends most nights in front of a rock stage.",
        "bg": "assets/live-1.jpg",
        "service": ("Rock mixing", "Rock and alternative music mixing"),
        "intro_h": "Mixed by a drummer who mixes live",
        "intro": [
            "When I'm not mixing, I'm behind a drum set. That's where I started, and it's a big part of why I care so much about how a rock record hits. Drums need punch without losing the room, and guitars need size without burying the vocal.",
            "On the live side I've mixed monitors for <strong>Smash Mouth</strong>, run front of house for <strong>Meatbodies</strong> and <strong>Black Pontiac</strong>, and worked shows for <strong>Foreigner</strong>, <strong>Garbage</strong>, and <strong>Lynyrd Skynyrd</strong>. In the studio I've mixed indie rock, alternative, and industrial records for artists like <strong>The Zines</strong>, <strong>Charity Kiss</strong>, and <strong>FKA Fingers</strong>.",
        ],
        "work": ["zines", "charity"],
        "credits": ["zines", "charity", "fka"],
        "faq": COMMON_FAQ,
    },
    {
        "slug": "country-mixing",
        "title": "Country Mixing Engineer Online | Country Song Mixing | MixedByJack",
        "desc": "Online country mixing by Jack Barrington, primary FOH engineer for a national country act. Studio work with Jakota Wass. First mix in 7 days, unlimited revisions.",
        "crumb": "Country Mixing",
        "h1": "Country Mixing",
        "lede": "Clear, honest vocals and a band that feels like it's playing in the room with you. Mixed online by the front-of-house engineer for a national country act.",
        "bg": "assets/live-card.jpg",
        "hero_video": ("assets/country/hero-guitar.mp4", "assets/country/hero-guitar.jpg"),
        "feature": {
            "title": "Met Your Match",
            "artist": "Jakota Wass",
            "label": "Official live video",
            "note": "Live session mixed by Jack. Headphones recommended.",
            "src": "assets/country/met-your-match-live.mp4",
            "poster": "assets/country/met-your-match-poster.jpg",
        },
        "ab": {"tracks": ["Met Your Match"], "h": "Same song, raw to release",
               "lede": "The rough tracks from Met Your Match next to the final mix. Hit play, then flip between Before and After."},
        "board": {"tracks": ["Time Loving You", "Redneck Man"], "h": "Straight from the board",
                  "lede": "Two-track recordings pulled off the front-of-house console at Jakota Wass shows."},
        "service": ("Country mixing", "Country music mixing"),
        "intro_h": "Country is what I mix every week",
        "intro": [
            "I'm currently the primary front-of-house engineer for a national country act, and I've mixed front of house for <strong>Lonestar</strong> and worked shows for <strong>Josh Turner</strong>. Country lives and dies by the vocal and the story, and that's where every one of my mixes starts.",
            "In the studio I've mixed country for <strong>Jakota Wass</strong>. Send me your raw multitracks and I'll build a mix that keeps the song front and center, with as many revisions as it takes.",
        ],
        "work": [],
        "credits": ["jakota"],
        "faq": COMMON_FAQ,
    },
    {
        "slug": "indie-pop-mixing",
        "title": "Indie & Pop Mixing Online | Indie Rock, Pop & Electronic | MixedByJack",
        "desc": "Online indie, pop, and electronic mixing by Jack Barrington. Studio credits include Moshe, Charity Kiss, and The Zines. First mix in 7 days, unlimited revisions.",
        "crumb": "Indie & Pop Mixing",
        "h1": "Indie & Pop Mixing",
        "lede": "Mixes with character. Polished enough for playlists, without sanding off what makes your song yours.",
        "bg": "assets/recording.jpg",
        "service": ("Indie and pop mixing", "Indie, pop and electronic music mixing"),
        "intro_h": "Polish without losing the character",
        "intro": [
            "Indie and pop records live in the details: the texture of a synth, the space around a vocal, the moment a chorus opens up. I mix to bring those details forward while keeping the feel of the original recording.",
            "In the studio I've mixed pop and electronic for <strong>Moshe</strong> and indie rock for <strong>Charity Kiss</strong> and <strong>The Zines</strong>. Send me your multitracks and we'll go back and forth until it sounds the way you imagined it.",
        ],
        "work": ["moshe", "charity", "zines"],
        "credits": ["moshe", "charity", "zines"],
        "faq": COMMON_FAQ,
    },
]


def esc(s):
    return html.escape(s, quote=True)


def plain(s):
    return re.sub(r"<[^>]+>", "", s)


def section(src, start_marker, end_marker):
    a = src.index(start_marker)
    b = src.index(end_marker, a)
    return src[a:b]


def money(v):
    return f'<span class="price">${v}<small>/ song</small></span>' if v else '<span class="price tbd">Price TBD</span>'


def build():
    index = (ROOT / "index.html").read_text()
    head_links = section(index, '<link rel="icon"', '</head>')
    head_links = head_links[: head_links.index('<script type="application/ld+json">')] if '<script type="application/ld+json">' in head_links else head_links
    head_links = head_links.replace('href="assets/', 'href="/assets/').replace('href="styles.css', 'href="/styles.css')
    nav = section(index, '<!-- ================= NAV', '<main id="top">')
    footer = section(index, '<footer class="footer">', '<!-- ================= INTAKE MODAL')
    modals = section(index, '<!-- ================= INTAKE MODAL', '<script src="main.js')
    script = re.search(r'<script src="main\.js[^"]*"></script>', index).group(0).replace('src="main.js', 'src="/main.js')

    def fix_links(s):
        s = s.replace('href="#top"', 'href="/"')
        s = re.sub(r'href="#([a-z][\w-]*)"', r'href="/#\1"', s)
        return s.replace('src="assets/', 'src="/assets/')

    nav, footer = fix_links(nav), fix_links(footer)
    modals = modals.replace('src="assets/', 'src="/assets/')

    links = [(p["slug"], p["crumb"]) for p in PAGES]
    footer_links = '<nav class="footer-links" aria-label="Services">' + "".join(
        f'<a href="/{s}">{esc(t)}</a>' for s, t in links) + "</nav>"
    if 'class="footer-links"' not in footer:   # the homepage footer may already carry them
        footer = footer.replace("  </div>\n</footer>", "    " + footer_links + "\n  </div>\n</footer>")

    for p in PAGES:
        url = f"{SITE}/{p['slug']}"
        steps = p.get("steps", COMMON_STEPS)
        ld = {
            "@context": "https://schema.org",
            "@graph": [
                {"@type": "Service", "@id": url + "#service", "name": p["service"][0], "serviceType": p["service"][1],
                 "url": url, "areaServed": {"@type": "Place", "name": "Worldwide"},
                 "provider": {"@type": "ProfessionalService", "@id": SITE + "/#business", "name": "MixedByJack", "url": SITE + "/"},
                 "description": p["desc"]},
                {"@type": "BreadcrumbList", "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": p["crumb"], "item": url}]},
                {"@type": "FAQPage", "mainEntity": [
                    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in p["faq"]]},
            ],
        }
        offers = []
        if p["slug"] != "online-mastering" and PRICES["mix"]:
            offers.append({"@type": "Offer", "price": str(PRICES["mix"]), "priceCurrency": "USD", "description": "Mixing, per song"})
        if p["slug"] == "online-mastering" and PRICES["master"]:
            offers.append({"@type": "Offer", "price": str(PRICES["master"]), "priceCurrency": "USD", "description": "Mastering, per song"})
        if PRICES["bundle"]:
            offers.append({"@type": "Offer", "price": str(PRICES["bundle"]), "priceCurrency": "USD", "description": "Mixing and mastering bundle, per song"})
        if offers:
            ld["@graph"][0]["offers"] = offers

        embeds = "".join(
            f'<iframe title="{esc(SPOTIFY[k][0])}" src="{SPOTIFY[k][1]}" height="{SPOTIFY[k][2]}" '
            f'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>'
            for k in p["work"])
        credits = "".join(f"<li><span>{esc(STUDIO[k][0])}</span><span>{esc(STUDIO[k][1])}</span></li>" for k in p["credits"])
        work_right = f'<div class="embeds">{embeds}</div>' if embeds else (
            '<div class="prose"><p>Want to hear more? The homepage has more before and after comparisons, live board mixes, and the full client list.</p>'
            '<p><a class="btn btn-ghost" href="/#portfolio">See the Portfolio <span class="arrow">→</span></a></p></div>')
        steps_html = "".join(f"<li><h3>{esc(t)}</h3><p>{esc(d)}</p></li>" for t, d in steps)
        faq_html = "".join(f"<details><summary>{esc(q)}</summary><p>{a}</p></details>" for q, a in p["faq"])
        others = "".join(f'<a href="/{s}">{esc(t)}</a>' for s, t in links if s != p["slug"])

        if p["slug"] == "online-mastering":
            price_rows = [("Mastering", "Per song, one finished WAV", PRICES["master"]),
                          ("Mixing + Mastering", "Bundle price, per song", PRICES["bundle"]),
                          ("Mixing only", "Per song, unlimited revisions", PRICES["mix"])]
        else:
            price_rows = [("Mixing", "Per song, unlimited revisions", PRICES["mix"]),
                          ("Mixing + Mastering", "Bundle price, per song", PRICES["bundle"]),
                          ("Mastering only", "Per song, one finished WAV", PRICES["master"])]
        prices_html = "".join(
            f'<div class="price-row"><div><h3>{esc(n)}</h3><p>{esc(d)}</p></div>{money(v)}</div>' for n, d, v in price_rows)

        if p.get("hero_video"):
            vsrc, vposter = p["hero_video"]
            hero_media = (f'<div class="bg-media" aria-hidden="true"><video autoplay muted loop playsinline preload="auto" '
                          f'poster="/{vposter}"><source src="/{vsrc}" type="video/mp4"></video></div>')
        else:
            hero_media = f'<div class="bg-media" aria-hidden="true"><img src="/{p["bg"]}" alt=""></div>'

        feature_html = ""
        if p.get("feature"):
            f = p["feature"]
            feature_html = f"""<section class="section feature" id="featured">
  <div class="page-body">
    <header class="feature-head reveal">
      <p class="eyebrow">{esc(f['label'])}</p>
      <h2>{esc(f['title'])} <span>{esc(f['artist'])}</span></h2>
    </header>
    <div class="feature-video reveal" data-title="{esc(f['artist'] + ' - ' + f['title'])}">
      <video preload="none" playsinline poster="/{f['poster']}"><source src="/{f['src']}" type="video/mp4"></video>
      <button class="fv-play" type="button" aria-label="Play {esc(f['title'])} by {esc(f['artist'])}">
        <span class="fv-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg></span>
        <span class="fv-label">Watch the live session</span>
      </button>
    </div>
    <p class="feature-note reveal">{esc(f['note'])}</p>
  </div>
</section>
"""

        ab_html = ""
        if p.get("ab"):
            a = p["ab"]
            ab_html = f"""<section class="section genre-listen">
  <div class="wrap">
    <header class="section-head reveal">
      <h2 class="h2">{esc(a['h'])}</h2>
      <p class="lede">{esc(a['lede'])}</p>
    </header>
    <div class="players" id="players" data-tracks="{esc('|'.join(a['tracks']))}"></div>
  </div>
</section>
"""
        board_html = ""
        if p.get("board"):
            b = p["board"]
            board_html = f"""<section class="section genre-board">
  <div class="board-mixes" id="board-mixes">
    <header class="board-head reveal">
      <h3 class="clients-title">{esc(b['h'])}</h3>
      <p>{esc(b["lede"])}</p>
    </header>
    <div class="board-list" id="board-players" data-tracks="{esc('|'.join(b['tracks']))}"></div>
  </div>
</section>
"""

        page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(p['title'])}</title>
<meta name="description" content="{esc(p['desc'])}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MixedByJack">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(p['h1'])} | MixedByJack">
<meta property="og:description" content="{esc(p['desc'])}">
<meta property="og:image" content="{SITE}/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#060409">
{head_links.strip()}
<script type="application/ld+json">
{json.dumps(ld, indent=2)}
</script>
</head>
<body>

{nav.strip()}

<main id="top">

<section class="page-hero{' tall' if p.get('hero_video') else ''}" aria-label="Intro">
  {hero_media}
  <div class="bg-shade" aria-hidden="true"></div>
  <div class="page-hero-inner">
    <p class="crumbs"><a href="/">MixedByJack</a> &nbsp;/&nbsp; {esc(p['crumb'])}</p>
    <h1>{esc(p['h1'])}</h1>
    <p class="lede">{esc(p['lede'])}</p>
    <div class="hero-ctas">
      <a href="#" class="btn btn-lg" data-open-intake>Start Your Project <span class="arrow">→</span></a>
      <a href="#pricing" class="btn btn-lg btn-ghost">See Pricing</a>
    </div>
  </div>
</section>

{feature_html}
<section class="section">
  <div class="page-body split">
    <h2 class="reveal">{esc(p['intro_h'])}</h2>
    <div class="prose reveal">{''.join(f'<p>{x}</p>' for x in p['intro'])}</div>
  </div>
</section>

{ab_html}{board_html}
<section class="section" id="process">
  <div class="page-body split">
    <h2 class="reveal">How it works</h2>
    <ol class="steps reveal">{steps_html}</ol>
  </div>
</section>

<section class="section" id="work">
  <div class="page-body split">
    <div class="reveal">
      <h2>Studio credits</h2>
      <ul class="credits" style="margin-top:24px">{credits}</ul>
    </div>
    <div class="reveal">{work_right}</div>
  </div>
</section>

<section class="section" id="pricing">
  <div class="page-body split">
    <h2 class="reveal">Pricing</h2>
    <div class="reveal">
      <div class="prices">{prices_html}</div>
      <p class="price-note">Every booking includes unlimited revisions. Working on an EP or album? Mention it in the form and I'll put together a project quote.</p>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="page-body split">
    <h2 class="reveal">Questions</h2>
    <div class="faq reveal">{faq_html}</div>
  </div>
</section>

<section class="section">
  <div class="page-cta reveal">
    <h2 class="h2">Ready to Hear Your Song <span class="accent">at Its Best?</span></h2>
    <p class="lede">Tell me about your project and I'll get back to you within 24 hours.</p>
    <a href="#" class="btn btn-lg" data-open-intake>Start Your Project <span class="arrow">→</span></a>
    <div class="more-links" style="justify-content:center;margin-top:48px">{others}</div>
  </div>
</section>

</main>

{footer.strip()}

{modals.strip()}

{script}
</body>
</html>
"""
        (ROOT / f"{p['slug']}.html").write_text(page)
        print("wrote", p["slug"] + ".html")

    # sitemap
    urls = [SITE + "/"] + [f"{SITE}/{s}" for s, _ in links]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sm += "".join(f"  <url>\n    <loc>{u}</loc>\n  </url>\n" for u in urls) + "</urlset>\n"
    (ROOT / "sitemap.xml").write_text(sm)
    print("wrote sitemap.xml")


if __name__ == "__main__":
    build()
