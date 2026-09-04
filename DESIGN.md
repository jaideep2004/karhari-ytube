# DESIGN — Karhari Tube v2 (TunesToTube white-clean)

**Inspiration deep-dive:** `https://www.tunestotube.com/` — fetched live `2026-08-29` (`200 OK`, `Microsoft-IIS/10.0 PHP 8.5`, `bootstrap 5 + main.css + jquery 1.8.3 + lucide 20px`). Assessment below, then adapted white-clean system for Karhari Tube (AdSense + Core Web Vitals + Next.js 15).

---
## 0. TunesToTube Deep Assessment (source: `curl` HTML+CSS 29 Aug 2026)

**Structure**
- Full-width `bg-body-tertiary` (`#f8f9fa`) wrapper `min-height: calc(100vh - 211px)`, `container px-2 px-xl-5` centered ~1140px, single column no sidebar.
- Pre-login: logo `tunestotube_logo_2024.svg` + `yt_logo_rgb_light.svg 300px` centered → 2-col hero `col-lg-6/col-lg-6`: left `fs-1 fw-light lh-1 tracking -0.15rem` "Upload audio to [YouTube]", right 2-line value prop + official `gsi-material-button` pill (`border 1px #747775 radius 20px h40`). Post-login: jQuery file queue + accordions (SoundCloud/ID3/URL/background combine) + `encode_and_upload.php` POST + polling `checkUploads()`.

**Typography**
- `Outfit` body, `DM Sans` nav; `fw-light` tight `-0.15rem` hero / `-0.1rem` section; `fs-5_5` ~17px body, `h4` + lucide 20px.

**Color**
- `--bs-link-color-rgb 29,70,134` `#1d4686` / hover `#183a6f`; `--heading-color #9f2632`; `btn-primary #1b4a8f`, `btn-success #095c36` AAA; bg `#f8f9fa`, dark band `#212529`. No gradients, flat utilitarian. Links `rgb(29,70,134)`.

**Form**
- `form-control:focus border-color var(--bs-border-color) box-shadow none` — removes Bootstrap glow. Inputs `font-size .85em`, `filter saturate(0.9) brightness(0.9)` on btns. Feels functional not decorative.

**Iconography**
- Lucide 20×20 stroke: `zap award headset audio-waveform layout-dashboard gauge puzzle briefcase shield-check` — 9 features in 3×3 `p-5` `text-white-50`, then 15 upgrade features 3×5 grid. Monochrome thin stroke.

**Content hierarchy**
- Hero 2 sentences + single CTA, then dark band 9 benefits (`40M uploads, 1.5M users, since 2011`), then light band 15 upsell features. Footer `Terms | Privacy` + `Developed with YouTube 300px` + `google_translate`. No pricing on hero.

**Ads**
- `adsbygoogle.js?client=ca-pub-5221618874461322` async in `<head>`. Header slot `6969748554` auto responsive above hero, footer `6715370483` + `5967658073` auto, upload-only `7460325809` for unregistered during `EncodeAndUpload`. All `data-ad-format auto data-full-width-responsive true`.

**Flaws to NOT copy**
- jQuery 1.8.3 (2012), `bg-body-tertiary` makes card low-contrast, dark band `text-white-50` low contrast, no visualizer chooser, no Facebook, pill not centered mobile, ads push hero below fold, heavy jQuery + fancybox.

---
## 1. Principles (Karhari Tube adaptation)

- **Functional first:** Upload card IS hero — visible without scroll, like TTT.
- **White-clean:** page `bg-white` + card `bg-white` with `shadow-sm` on `bg-zinc-50` shell — fixes TTT grey wash, keeps single-purpose.
- **No fluff:** one `h1` (34px light) + one `p` (muted) + one card — then details below fold.
- **AdSense-safe:** ads never inside card, never on `/login /dashboard /admin`, `min-h-[280px]` CLS-safe, lazy `afterInteractive`.
- **Accessible:** keyboard dropzones, Hindi `Noto Sans Devanagari` fallback, `alt` + `aria-label`, AAA contrast `#1d4686` on white.

## 2. Design Tokens v2 (white-clean)

```
Page:      bg #ffffff (shell #fafafa / zinc-50 behind card gives lift)
Card:      bg #ffffff border #e4e4e7 (zinc-200) shadow-sm
Text:      #18181b (zinc-900) / muted #71717a (zinc-500)
Link:      #1d4686 (TTT blue) hover #183a6f
Primary:   #1d4686 (TTT btn-primary #1b4a8f) hover #183a6f  text #fff
Success:   #095c36 hover #074228
Error:     #dc2626
Ad Slot:   bg #f4f4f5 min-h 280px label 10px uppercase tracking 0.08em zinc-400
Radius:    card 16px (rounded-2xl), inputs 10px, pills 999px
Font:      Outfit 400/500/600 + DM Sans 500 (nav) — same as TTT
           hero 34px fw300 tracking -0.03em / body 16px / muted 14px / label 12px uppercase
Max-width: card 720px, page 1100px, text 640px, container px-4 sm:px-6 xl:px-8
Header:    64px white border-b zinc-200 sticky top-0 z-40
```

## 3. Layout — Homepage `/` (white-clean)

```
[Header 64px white border-b]
 left:  KARHARI TUBE wordmark Outfit 500 16px + tagline 11px muted "Audio → Video"
 right: nav 14px [How it works] [FAQ] [Contact] | [Sign in w Google pill 40px] [Sign in w Facebook]
        authed: [Dashboard] [Admin if allowed] avatar 32px border

[Hero  48px py, centered, bg-white]
 h1 34px fw-light tracking -0.03em: Turn any MP3 or WAV into a YouTube or Facebook video — in 10 seconds.
 p  15px muted zinc-500: Upload audio + thumbnail → pick Bars or Circular → choose channel/page → we publish.
        (same 2-sentence simplicity as TTT hero)

[MAIN CARD 720px centered, bg-white border zinc-200 rounded-2xl shadow-sm p-6 sm:p-8]
 ┌──────────────────────────────────────────────────────────┐
 │ ① Audio     [  Drop MP3 / WAV / FLAC  or  Browse  ]     │  dashed border-2 zinc-200 rounded-xl
 │           └─ pill "my-song.mp3 • 3:42 • 8.2 MB  [×]"    │
 │ ② Thumbnail [  Drop JPG / PNG / WEBP  or  Browse ]      │  preview 640px pad white border
 │           [ ] Generate from title (gradient fallback)    │
 │ ③ Title   [______________________] Artist [________]    │  inputs h-10 border zinc-200 focus:border-zinc-300
 │ ④ Visualizer  (•) Bars  ( ) Circular   Color: [Cyan ▾]  │  radios + swatches, live canvas 120×68 thumb
 │ ⑤ Upload to  [☑ YouTube  ▾ Channel: My Channel (thumb)] │  checkboxes, pickers disabled until linked
 │              [☐ Facebook ▾ Page: Karhari Music ]        │  "Connect Facebook to enable →" link if not linked
 │ ⑥ Description (optional) [_________________________]     │
 │    Visibility [Public ▾]  Schedule [ datetime picker ]   │
 │ ───────────────────────────────────────────────────────  │
 │ [ Create & Upload Video ]  (full-width h-12 bg #1d4686 text-white rounded-xl) │
 │ On click → progress bar: Downloading 18% ████░░░░ Generating 55% Uploading 82% 4.2/10 MB │
 │ Done → [▶ youtu.be/abc] [copy]  [▶ facebook.com/... ]   │  per-destination cards
 └──────────────────────────────────────────────────────────┘
 When NOT authed: same card, step ⑤ disabled + CTA row below card:
 [ Continue with Google ] [ Continue with Facebook ]  (TTT gsi-material-button pill 40px border #747775)

[AD SLOT A: 720px centered, min-h-[280px], bg-zinc-50 border-dashed label "Advertisement"]
 — only public, lazy afterInteractive, data-ad-format auto

[How it works: 3 cols, icons lucide 20px, 20 words each, bg-white border-t]
 01 Upload → 02 Pick visualizer → 03 Publish

[Features: 6 tiles 2×3, icon + title + 1 line, bg-zinc-50]
 No watermark | HD 1080p | No re-encoding | Scheduled publish | WAV/FLAC | Bars & Circular

[FAQ: accordion 5 items, max-w 720px]

[Footer: white border-t, 4 cols 14px, or dark #0a0a16 alternative — v2 uses white]
 col1 Product: How it works, Features
 col2 Support: FAQ, Contact
 col3 Legal: Privacy, Terms, About
 col4 © 2026 Karhari Tube — tube.karharimedia.com — ads.txt  |  Developed with YouTube | Privacy | Terms

Mobile: single column, card full-width mx-4, pickers stack, CTA full-width, ad 320×100.
```

## 4. Wireframe — ASCII

```
+--------------------------------------------------+
| KARHARI TUBE   How it works  FAQ  [Sign in w Google] |
+--------------------------------------------------+
|       Turn any MP3 into a YouTube video              |
|    Upload → Visualizer → Channel/Page → Done         |
| +--------------------------------------------+     |
| | Audio: [ Drop here ]  song.mp3 3:42         |     |
| | Thumb: [ Drop here ]  cover.jpg             |     |
| | Title: [My Song]  Artist: [Karhari]         |     |
| | Visual: (•)Bars ( )Circular  Color [cyan]   |     |
| | To: [☑ YouTube ▾ My Channel]                |     |
| |     [☐ Facebook Connect →]                  |     |
| |        [ Create & Upload Video ]            |     |
| +--------------------------------------------+     |
| [      Advertisement  720x280               ]     |
|  01 Upload  02 Visualizer  03 Publish            |
|  No watermark | HD | Scheduled | WAV/FLAC ...    |
+--------------------------------------------------+
| Privacy  Terms  Contact  About  © Karhari        |
+--------------------------------------------------+
```

## 5. Component Inventory

- `Header` 64px white sticky border-b, Geist/Outfit wordmark
- `UploadCard` (audio dropzone, artwork dropzone, title/artist, visualizer radios, color select, destination checkboxes, progress) — THE hero
- `ChannelPicker` (`/api/auth/youtube/channels` → thumb+name radio)
- `PagePicker` (`/api/auth/facebook/pages` → page thumb+name radio)
- `ProgressBar` (phase downloading/generating/uploading + pct + bytes)
- `JobCard` / `JobLive` (history row + polling detail)
- `AdSlot` (public-only, `min-h-[280px]`, lazy)
- `FAQAccordion` (5 items), `VisitTracker` (analytics)

## 6. States

- Empty → dashed `border-zinc-200` muted
- Uploading R2 → spinner + "Uploading to storage…"
- Ready → filename pill with ×
- Error → red `border-red-200 bg-red-50` + message + Retry
- Not authed → pickers disabled + "Connect →" link
- Generating → canvas preview + `Generating 55%`

## 7. AdSense Slots (placements, never inside card)

- Slot A: after main card, `ins.adsbygoogle auto` 336×280 or responsive, `min-h-[280px]`
- Slot B: footer banner 728×90 desktop / 320×100 mobile
- Both `display:block; min-height:280px` avoid CLS, `next/script afterInteractive`, `public/ads.txt` `google.com, pub-XXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`

## 8. Accessibility & i18n

- Dropzones wrap `<input type=file>` keyboard accessible
- Hindi titles via `hindiFontSpec()` → `Noto Sans Devanagari` fallback (same as parent `circularVisualizer`)
- `alt` on images, `aria-label` on pickers, `color-contrast` AAA `#1d4686` on white
- `prefers-reduced-motion` disables canvas animation preview

## 9. Change log v1 → v2

- Page bg `#fafaf8` → `#ffffff` (shell `#fafafa` behind card)
- Card border `#e8e8e3` → `#e4e4e7` + `shadow-sm` (pop on white)
- Accent `#111827 black` → `#1d4686` TTT blue (proven CTA)
- Typography: declared Outfit+DM Sans explicitly (was Inter)
- Added TTT teardown §0 with live source, flaws list, ad slot IDs
- Added mobile thumb targets + reduced-motion
