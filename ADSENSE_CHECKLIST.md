# AdSense Checklist — Karhari Tube

Use before applying at https://www.google.com/adsense/

## Must-Haves (rejection if missing)
- [ ] Custom domain + HTTPS (not vercel.app subdomain for final review)
- [ ] `public/ads.txt` with `google.com, pub-XXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
- [ ] Privacy Policy `/privacy` — what data collected (OAuth email, audio files, cookies), R2 retention, YouTube/FB token use
- [ ] Terms of Service `/terms`
- [ ] Contact page `/contact` — email + address (e.g. Karhari Media, ...), form or mailto
- [ ] About page `/about` — who you are, why site exists
- [ ] Footer links to all 4 on every page
- [ ] Cookie consent banner (EU/GDPR) — before loading adsbygoogle.js if targeting EU

## Content (thin-content rejection)
- [ ] ≥1000 words original content across `/` + `/how-it-works` + `/faq` (+ `/features`)
- [ ] No lorem ipsum, no copied TunesToTube text
- [ ] At least one video demo / screenshot of visualizer output
- [ ] Site not "under construction" — no empty sections

## Placement (policy violation if wrong)
- [ ] Ads only on public routes: `/`, `/how-it-works`, `/faq`, `/features`, success page `/dashboard/jobs/:id?done=1`
- [ ] No ads on `/login`, `/dashboard/*`, `/admin/*`, `/api/*`
- [ ] No sticky overlay covering content, no interstitial before `Create & Upload`
- [ ] Each `AdSlot` has `min-height: 280px` (no layout shift) + labeled "Advertisement"
- [ ] Load `adsbygoogle.js` via `next/script strategy="afterInteractive"` + `crossOrigin="anonymous"`

## Technical
- [ ] `sitemap.xml` + `robots.txt` allow crawl
- [ ] OG tags + title/description per page
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1 (test via PageSpeed Insights)
- [ ] No broken links, no 404 on nav items

## After Submit
- Wait 2-4 weeks, don't resubmit. Check AdSense dashboard for "Needs attention" reasons.
