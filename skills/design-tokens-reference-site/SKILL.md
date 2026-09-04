---
name: design-tokens-reference-site
category: design
description: Capture reference-site UI tokens (e.g. tunestotube.com) and map to clean-white Karhari Tube v2 tokens, with AdSense-safe slots and CLS-safe patterns. Includes JSX ternary bracket fixes, fetch json() anti-pattern, and full env+credential flow.
---#

# DESIGN TOKENS — From Reference Site Assessment

**Trigger:** `Use when mapping a reference site's design tokens to a new project, keeping functional-first minimalism and AdSense compliance.`

**One-line behavior:** Capture live HTML+CSS from a reference UI (e.g. tunestotube.com), extract color/typography/layout tokens, map them to a clean-white system with CLS-safe ad slots and Core Web Vitals.

---

## 0. Reference-Site Deep Assessment (source: `curl` fetch, 2026-08-29)

**URL:** `https://www.tunestotube.com/` — `200 OK`, `Microsoft-IIS/10.0`, `PHP 8.5`, Bootstrap 5 + `main.css` + jQuery 1.8.3 + lucide 20px icons.

**Layout**
- Full-width `bg-body-tertiary` (`#f8f9fa`) wrapper `min-height: calc(100vh - 211px)`, `container px-2 px-xl-5` centered ~1140px, single column.
- Pre-login: logo centered + 2-col hero `col-lg-6/col-lg-6`: left `fs-1 fw-light lh-1 tracking -0.15rem` "Upload audio to [YouTube]", right value prop + `gsi-material-button` pill (`border 1px #747775 radius 20px h40`).
- Post-login: jQuery file queue + accordions (SoundCloud/ID3/URL/background combine) + `encode_and_upload.php` POST + polling `checkUploads()`.

**Typography**
- `Outfit` body, `DM Sans` nav; `fw-light` tight `-0.15rem` hero / `-0.1rem` section; `fs-5_5` ~17px body, `h4` + lucide 20px.

**Color**
- `--bs-link-color-rgb 29,70,134` `#1d4686` / hover `#183a6f`; `btn-primary #1b4a8f`, `btn-success #095c36`; bg `#f8f9fa`, dark band `#212529`. No gradients.

**Form**
- `form-control:focus border-color var(--bs-border-color) box-shadow none` — removes Bootstrap glow. Inputs `font-size .85em`, `filter saturate(0.9) brightness(0.9)` on btns.

**Iconography**
- Lucide 20×20 stroke: `zap award headset audio-waveform layout-dashboard gauge puzzle briefcase shield-check` — 9 features 3×3 grid `text-white-50`, then 15 upgrade features 3×5 grid.

**Content hierarchy**
- Hero 2 sentences + single CTA, then dark band 9 benefits, then light band 15 upsell. Footer `Terms | Privacy` + `Developed with YouTube 300px` + `google_translate`.

**Ads**
- `adsbygoogle.js?client=ca-pub-5221618874461322` async in `<head>`. Header slot `6969748554` auto responsive above hero. Footer `6715370483` / `5967658073` auto. Upload-only `7460325809` for unregistered during upload. All `data-ad-format auto data-full-width-responsive true`.

**Flaws to NOT copy**
- jQuery 1.8.3 (2012), grey `bg-body-tertiary` washes out card, dark band `text-white-50` low contrast, no visualizer chooser, no Facebook, pill not centered mobile, ads push hero below fold, heavy jQuery + fancybox.

---

## 1. White-Clean Design Tokens (Karhari Tube v2)

| Token | Reference (TTT) | Karhari Tube v2 |
|---|---|---|
| `bg` | `#f8f9fa` (`bg-body-tertiary`) | `#ffffff` (page), `#fafafa` (shell behind card) |
| `card` | `#e8e8e3` (implicit) | `#ffffff` border `#e4e4e7` (`zinc-200`) `shadow-sm` |
| `text` | `#111827` (rarely) | `#18181b` (`zinc-900`) |
| `muted` | `#6b7280` (`zinc-500`) | `#71717a` (`zinc-500`) |
| `accent/primary` | `#1d4686` (`--bs-link-color-rgb`) | `#1d4686` (TTT blue, proven CTA) |
| `accent-hover` | `#183a6f` | `#183a6f` |
| `success` | `#095c36` | `#095c36` |
| `error` | `#dc2626` | `#dc2626` |
| `ad-bg` | `#f3f4f5` | `#f3f4f5` (AdSlot placeholder) |
| `radius` | inputs `8px`, pills `999px` | card `16px` (`rounded-2xl`), inputs `10px`, pills `999px` |
| `font-sans` | `Outfit` + `DM Sans` | `Outfit` 400/500/600 + `DM Sans` 500 (nav) |
| `font-display` | — | `DM Sans` 500 for headings |
| `hero-h1` | `34px fw-light tracking -0.15rem` | `34px font-light tracking -0.03em leading-none` (Outfit) |
| `body` | `fs-5_5 ~17px` | `16px` base, `14px` muted, `12px` label |
| `max-width` | `container 1140px` | card `720px`, page `1100px`, text `640px` |
| `header` | `60px` (implicit) | `64px` white `border-b` sticky |
| `ad-slot` | `336×280 auto` (header/footer) | `336×280` `min-h-[280px]` below card, `afterInteractive`, CLS-safe |
| `footer` | `#0a0a16` dark, text-zinc-300 | `#0a0a16` dark (v2) or `bg-white` (keeps both options) |

**Design principles (v2 adaptation)**
- **Functional first:** Upload card IS hero — visible without scroll, like TTT.
- **White-clean:** Page `bg-white` + card `bg-white` with `shadow-sm` on `bg-zinc-50` shell — fixes TTT grey wash, keeps single-purpose.
- **No fluff:** One `h1` (34px light) + one `p` (muted) + one card — then details below fold.
- **AdSense-safe:** Ads never inside card, never on `/login /dashboard /admin`, `min-h-[280px]` CLS-safe, lazy `afterInteractive`.
- **Accessible:** Keyboard dropzones, Hindi `Noto Sans Devanagari` fallback, `alt` + `aria-label`, AAA contrast `#1d4686` on white.

---

## 2. Component Overhaul Checklist (what this skill covers)

| Component | Key Changes (v1 → v2) |
|---|---|
| `globals.css` | Add design tokens (`--background`, `--foreground`, `--muted`, `--border`, `--primary`, `--primary-hover`), `*:focus-visible` keep border, remove Bootstrap focus glow, `body bg-white` |
| `layout.tsx` | Use `Outfit` + `DM_Sans` from `next/font/google`, `bg-white` body, swap `geist` for Outfit/DM tokens |
| `Header.tsx` | Keep 64px white sticky border-b, KT wordmark, nav links, authed/Sign-in pills — no code change needed if tokens already set |
| `AdSlot.tsx` | Change `bg-[#f3f4f6]` → `bg-zinc-50` + `border border-zinc-200`, label `text-zinc-400` → `text-zinc-500`, keep `min-h-[280px]` |
| `Footer.tsx` | Change `bg-[#0a0a16]` → keep (was already dark), text-zinc-300, ads.txt link, 4-col grid matches DESIGN.md |
| `page.tsx` | Hero 34px `fw-light tracking -0.03em` + muted `p`, 720px centered card, How it works 3-cols, Features 2×3 `bg-zinc-50 border`, AdSlot below card, FAQ accordion |
| `UploadCard.tsx` | TTT-style `bg-black py-3 text-sm font-semibold text-white rounded-full` CTA pills, color swatches, visualizer canvas with `requestAnimationFrame`, destinations disabled-until-linked, progress bar `bg-zinc-800` instead of `bg-black`, all dropzones `bg-zinc-50 border-zinc-300` |

---

## 3. JSX Inline Ternary Bracket Fix Patterns (TS error avoidance)

**Problem:** TypeScript `TS1005: ',' expected` when inline `{condition ? (...) : JSX.children.map(...)}` inside JSX — the `}` after `.map(...)` closes the ternary early, leaving dangling `}`.

**Fix:** Always wrap the ternary's JSX children in an additional `(...)` group so the `}` closes the paren, not the ternary:

```jsx
{channels.length === 0 ? (
  <option>{channelsLoading ? "Loading…" : "No channels"}</option>
) : (
  channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)
)}
```

**Anti-pattern (causes TS1005):**
```jsx
{channels.length === 0 ? (
  <option>{channelsLoading ? "Loading…" : "No channels"}</option>
) : channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>}  ← bad
```

**Same fix applies to:** `pages.map(...)`, any inline ternary returning `.map()`, `.filter()`, or array literals inside JSX.

---

## 4. `await res.json()` vs `await res.json()()` (fetch anti-pattern)

**Problem:** `const data = await res.json()` vs `const data = await res.json()()` — the latter adds an extra `()` calling a Promise, causing `TS2349: This expression is not callable` / `Type 'Promise<any>' has no call signatures`.

**Fix:** `await res.json()` — `json()` is already a method on `Response` that returns `Promise<any>`. No extra parentheses needed.

**Example (UploadCard.tsx lines 103, 125):**
```jsx
const res = await fetch("/api/upload/audio", { method: "POST", body: fd });
const data = await res.json();   // correct
// NOT: const data = await res.json()()  ← would error
```

---

## 5. AdSense Slot IDs (from TunesToTube live crawl)

| Slot position | `data-ad-slot` | Notes |
|---|---|---|
| Header (above hero) | `6969748554` | auto responsive, visible immediately |
| Footer (bottom) | `6715370483` / `5967658073` | two auto slots |
| Upload flow (unregistered) | `7460325809` | shows during `EncodeAndUpload` |
| **Karhari Tube** | `public/ads.txt` → `google.com, pub-XXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` | replace `pub-XXXXXXXXXXXX` after AdSense approval |

**Placement rules (CLS-safe, always)**
- Ads never inside upload card or auth routes.
- `min-h-[280px]` on slot container avoids CLS.
- Load via `next/script` `afterInteractive`.
- Public routes only: `/`, `/how-it-works`, `/faq`, `/privacy`, `/terms`, `/contact`.

---

## 6. Full Env + Credential Flow (already in .env.example)

**Vars (all required unless noted):**
- `MONGODB_URI` — Atlas `mongodb+srv://...`
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` local, `https://domain.com` prod
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — GCP Console, scopes `youtube.upload + youtube.readonly + youtube + userinfo.email profile`
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` — Meta Developers, permissions `pages_show_list,pages_read_engagement,pages_manage_posts`, submit App Review for `pages_manage_posts` to work cross-user
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_DOMAIN` / `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` — Cloudflare Dashboard
- `TOKEN_ENCRYPTION_KEY` — `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `ADMIN_EMAILS` — comma-separated, e.g. `you@example.com`
- `ENABLE_LOCAL_FFMPEG` — `true` locally, `false` on Vercel (throws immediately, needs Render Docker)
- `NEXT_PUBLIC_SITE_URL` — `https://yourdomain.com`

**Full flow:**
1. `cp .env.example .env.local`
2. Fill all vars above
3. `npm run dev` → `http://localhost:3000`
4. Sign in Google → upload MP3/WAV + thumbnail → visualizer + channel/page → `Create Video (P3) → Jobs` → poll → done/failed per destination
5. Connect Facebook in Settings → dual upload via `jobProcessor` `Promise.allSettled`-style sequential

---

## 7. Holographic Gate Verification (post-overhaul)

**After any design/TS/component change, always run:**
```bash
npm run typecheck    # tsc --noEmit → 0 errors
npm run build        # next build (Turbopack) → 23 routes, no warnings
npm test             # echo tests ok → tails 20 lines
```

**Gate allow_override: false** — all 3 must pass before marking phase complete.

---

## 8. Change Log v1 → v2

- Added §0 deep teardown of `tunestotube.com` live-fetched today (HTML+CSS via `curl`) — structure, `Outfit+DM Sans`, `#1d4686` blue, `gsi-material-button` pill, `adsbygoogle` slot IDs, and 7 flaws to NOT copy.
- Page `bg #fafaf8` → `#ffffff` (shell `#fafafa` behind card) + card `#fff border #e4e4e7 shadow-sm` (pop on white).
- Accent `#111827` black → `#1d4686` TTT blue (proven CTA).
- Typography: declared Outfit+DM Sans explicitly (was Inter).
- Added TTT teardown §0 with live source, flaws list, ad slot IDs.
- Added mobile thumb targets + `prefers-reduced-motion` disables canvas animation preview.