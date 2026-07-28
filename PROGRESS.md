# Founder Calc — progress & status

_Last updated: 2026-07-28 · Deployed commit: `a209591` on `main`_

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

## Where we left off (2026-07-28)

Two rounds of changes shipped today, all browser-verified and deployed.

**Setup screen**
- **"Your ownership today" field** — laid out like the other setup fields (label on
  one line → big editable % below → "Tap to type any %" hint → chips), with
  **Everyone else** (read-only mirror = `100% − You`) as a complement line below.
  The math already carried the other-holders slice; this just surfaces it.
- **Dilution** quick chips are **40 / 50 / 60 / 75 / 90**.
- **Collapsible setup** starts collapsed with an explicit **"Tap to expand" /
  "Tap to roll up"** hint; the value-summary hides while expanded.
- Every editable field (setup + deal) shows a typing hint **directly under its
  number** (spacing tightened so the hint hugs the number), with clear room above
  the chips, so people know they can type, not only tap chips.

**Deal**
- Raise has a **$5M** chip; money hint reads "Type shortcuts like 500k, 2.5M, etc."

**Dilution**
- Slider spans the full **0–100** (default 50). A math guard keeps **100% dilution**
  coherent: $0 payout, "Not possible", no divide-by-zero in the "needed" card.

**Results**
- Section 3 card names drop the redundant "after this round" (the section title
  keeps it); "Other equity holders" note excludes **founder AND round investors**.
- Section 4 title states the live assumptions: **"$X exit and X% future dilution"**.

**Branding**
- Header rebranded **Kremer Ventures → KV Consulting** with a
  **"Need help? Get in touch →"** `mailto:kremer@kremerventures.com` CTA.

Service-worker cache is at **v16**.

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
Release candidate must end with `Summary: 0 failure(s).` Currently **93 checks, 0
failures** (was 60 at the start of the day; added guards for the ownership mirror,
contact CTA, expand hint, dilution range, $5M chip, typing-hint placement,
section-3 wording, the 100% dilution wipeout, and the live Section-4 title).

**Manual (browser) — serve over localhost so the PWA works:**
```bash
python -m http.server 8000 --bind 127.0.0.1   # then open http://127.0.0.1:8000/index.html
```
`file://` double-click works for a quick look, but the service worker / offline
test (#11) needs an `http://localhost` origin. Full checklist in
`tests/MANUAL_TEST_CHECKLIST.md`.

**Live browser pass — verified in Chrome:** header render, Ownership-today mirror
(chips/typed/blank), typing-hint placement, dilution 0–100 + the **100% wipeout**
messaging, the **live Section-4 title**, Section-3 wording, persistence across
reload (#8), reset scoping (#9), and **PWA offline load from cache (#11)**. Parsing
+ payout-verdict edge cases (#5,6,12,13) are covered by the automated audit.

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
a209591  Founder ownership as a standard field; dilution chips 40-90  ← current
d455e95  Fix ownership rows on mobile: group each value next to its label
4584382  Tighten spacing: pull typing hint up under the number, more room above chips
167c195  Update PROGRESS.md and manual checklist for the v13 batch
6e5a424  Dilution 0-100, typing hints under numbers, section 3/4 wording, 100% guard
```

**Deploy = push to `main`.** Always bump `CACHE_VERSION` in `service-worker.js`
and re-run the audit before pushing.
