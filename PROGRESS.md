# Founder Exit Calculator — progress & status

_Last updated: 2026-07-28 · Deployed commit: `3e1ab49` on `main`_

A single-page equity/dilution calculator (PWA) for investor conversations.
Static site, no build step, deployed to Netlify from `main` (push = deploy).

**Live:** https://startupequitycalc.netlify.app · Netlify project
`startupequitycalc`, auto-deploying from the `main` branch of
`github.com/kremerventures/startupequitycalc`. The local folder is **not**
`netlify link`ed — deploys happen through the GitHub integration, not the CLI.

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

Four rounds of changes shipped today, all browser-verified and deployed.

**Install button (v18)**

Users could reach the site on a phone but not install it. Nothing was broken —
the app already met every Chrome installability rule (HTTPS, valid manifest,
192/512/maskable icons, `start_url` in scope, an active service worker with a
fetch handler). The gap was purely that people did not know how to install it,
and that **iOS never shows an install prompt at all**.

The header now has an **Install app** button that branches by platform:

| Platform | Behaviour |
|---|---|
| Chrome (Android/desktop) | Button is **always visible**. With a real offer it calls `prompt()`; without one it explains the browser-menu route and that an already-installed app hides the option |
| iOS **Safari** | No event exists, so the button expands step-by-step **Share → Add to Home Screen** instructions |
| iOS Chrome/Firefox/Edge | Says to open in Safari first — these browsers *cannot* install a PWA, they only bookmark |
| Already installed | Button never appears (`display-mode: standalone` / `navigator.standalone`), and `appinstalled` retracts it mid-session |

iPadOS 13+ reports itself as `MacIntel`, so iOS detection also checks
`maxTouchPoints` — covered by a test.

**v19 follow-up — the button must never be gated on `beforeinstallprompt`.**
v18 only revealed the button when Chrome fired that event. Chrome withholds it
whenever the app is **already installed**, so the button vanished in precisely
the case where the user most needed an explanation — reported from the field as
"I cleared the cache and still don't see the install option". Clearing cache or
site data does **not** uninstall a PWA. The button is now always visible and
falls back to instructions; a real offer, if it arrives, replaces them.

**Note on the missing manifest `id`:** app identity defaults to `start_url`,
which has not changed. So the earlier rename *updated* the existing installed
app rather than offering a new one, and Android can take up to a day to relabel
a WebAPK icon. Deleting and reinstalling shows changes immediately.

**Rename (shipped in `3e1ab49`)**

The naming is deliberately split into two names. Keep them in sync with this table:

| Where | Name |
|---|---|
| Tab title, `<h1>`, mailto subject, manifest `name` (install prompt / splash) | **Founder Exit Calculator** |
| Phone home-screen icon — manifest `short_name` + `apple-mobile-web-app-title` | **Exit Calc** |

- Long name everywhere it has room; **"Exit Calc"** under the icon, because
  home-screen labels truncate at roughly 12 characters.
- Subhead now reads **"Quick equity, dilution and exit check. Your numbers save
  automatically on this device."** Manifest `description` matches it.
- `localStorage` key stays **`founder-calc-v1`** on purpose, so the rename does
  not wipe anyone's saved inputs. The service-worker cache keeps the
  `founder-calc-` prefix for the same reason (neither is user-facing).

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

Service-worker cache is at **v19**.

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
Release candidate must end with `Summary: 0 failure(s).` Currently **139 checks, 0
failures**. The DOM mock now seeds each element's classes from the markup and
supports `classList.add/remove` plus element `click()`, and `buildEnv()` can
fake a user agent / `matchMedia`, so the install helper is tested as Android
Chrome, iOS Safari, iOS Chrome, iPadOS-as-Mac, and already-installed. Earlier
tally was **106 checks** (was 60 at the start of the day; added guards for the ownership mirror,
contact CTA, expand hint, dilution range, $5M chip, typing-hint placement,
section-3 wording, the 100% dilution wipeout, the live Section-4 title, and the
marketing-name / icon-name split plus the subhead across `index.html` **and**
`manifest.json` — the audit now parses the manifest too).

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

- [ ] **Icon label on a real phone (#0d):** confirm the home-screen icon reads
      **Exit Calc** without truncation on iOS and Android, and that the install
      prompt shows the full **Founder Exit Calculator**. Cannot be checked from
      Windows or by the audit.
- [ ] **Cross-browser (#10):** verified in Chrome; still confirm **Safari** and a
      real phone-sized screen (needs a non-Windows device).
- [ ] Optional: spot-check **Edge**.
- [ ] Consider whether "Need help? Get in touch →" wording is final (alt:
      "Reach out if you need help").

---

## Recent history

```
3e1ab49  Rename to Founder Exit Calculator; new subhead  ← current, deployed
b7b802f  Update notes for the v16 ownership-field + dilution-chip changes
a209591  Founder ownership as a standard field; dilution chips 40-90
56f29e1  Update notes for the v15 ownership-row layout fix
d455e95  Fix ownership rows on mobile: group each value next to its label
4584382  Tighten spacing: pull typing hint up under the number, more room above chips
```

**Deploy = push to `main`.** Always bump `CACHE_VERSION` in `service-worker.js`
and re-run the audit before pushing.
