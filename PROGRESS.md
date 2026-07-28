# Founder Calc — progress & status

_Last updated: 2026-07-28 · Deployed commit: `0b7509c` on `main`_

A single-page equity/dilution calculator (PWA) for investor conversations.
Static site, no build step, deployed to Netlify from `main` (push = deploy).

---

## ⚠️ Which folder is canonical

There are two similarly named folders on disk:

| Path | Status |
|---|---|
| `C:\Claude Workspace\startupequitycalc_updated\startupequitycalc\` | **CURRENT** — this git repo, deploys to Netlify |
| `C:\Claude Workspace\startupequitycalc\` | **STALE** — older copy, do not use |

Always work in the `_updated\startupequitycalc\` folder (note the nesting).

---

## Where we left off (2026-07-28 session)

Three changes shipped, all browser-verified and deployed:

1. **"Ownership today" block (setup screen)** — starting equity is now shown as
   two parts that always total 100%: **You** (editable %) and **Everyone else**
   (read-only mirror = `100% − You`). The math already carried this slice; it was
   just made visible. Quick chips (100/80/60/50) sit directly under "You" so it's
   clear they set the founder share.
2. **KV Consulting rebrand + contact CTA** — header eyebrow changed
   "Kremer Ventures" → **KV Consulting**, with a **"Need help? Get in touch →"**
   `mailto:kremer@kremerventures.com` link on the same line.
3. **Expand/collapse affordance** — the collapsible "Your setup" section (collapsed
   by default) now shows an explicit **"Tap to expand"** hint that flips to
   **"Tap to roll up"** when open; the value-summary hides while expanded.

Service-worker cache bumped **v11 → v12** so the update isn't served stale.

---

## Project layout

```
index.html            The whole app (HTML + inline CSS + inline JS)
service-worker.js      PWA offline cache (bump CACHE_VERSION on every deploy)
manifest.json          PWA manifest
netlify.toml           Static publish + no-long-cache headers for html/sw/manifest
icons/                 PWA icons
tests/
  audit-founder-calc.js       Dependency-free automated audit (Node)
  MANUAL_TEST_CHECKLIST.md    Human browser checklist
  TEST_RESULTS.txt            Last automated run output
```

The core math lives in `calculateFounderCalc()` in `index.html`. Key identity the
tests enforce: founder + round investor + other holders always = 100% after a round.

---

## Testing

**Automated (run before every deploy):**
```bash
node tests/audit-founder-calc.js
```
Release candidate must end with `Summary: 0 failure(s).` Currently **76 checks, 0
failures** (was 60 before this session; added guards for the ownership mirror,
contact CTA, and expand hint).

**Manual (browser) — serve over localhost so the PWA works:**
```bash
python -m http.server 8000 --bind 127.0.0.1   # then open http://127.0.0.1:8000/index.html
```
`file://` double-click works for a quick look, but the service worker / offline
test (#11) needs an `http://localhost` origin. Full checklist in
`tests/MANUAL_TEST_CHECKLIST.md`.

**Live browser pass this session — verified:** header render, Ownership-today
mirror (chips/typed/blank), persistence across reload (#8), reset scoping (#9),
and **PWA offline load from the v12 cache (#11)**. Parsing + payout-verdict edge
cases (#5,6,12,13) are covered by the automated audit.

---

## Open items / next steps

- [ ] **Cross-browser (#10):** verified in Chrome; still confirm **Safari** and a
      real phone-sized screen (needs a non-Windows device).
- [ ] Optional: spot-check **Edge**.
- [ ] Consider whether "Need help? Get in touch →" wording is final (alt:
      "Reach out if you need help").

---

## Recent history

```
0b7509c  Add ownership-today split, KV Consulting contact CTA, and setup expand hint  ← current
175f942  Fix payout rounding so verdict never contradicts displayed figure
855e06a  Reorganize ownership and exit results
9c554ee  Remove ask-% field and exit-sensitivity line, tighten payout copy
6bccc56  Move collapsible setup to top, expand quick-chip options, fix % spacing
```

**Deploy = push to `main`.** Always bump `CACHE_VERSION` in `service-worker.js`
and re-run the audit before pushing.
