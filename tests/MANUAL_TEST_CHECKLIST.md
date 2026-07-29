# Founder Exit Calculator manual test checklist

## Current calculation model

The calculator models one priced financing round plus a combined estimate of additional dilution through exit.

- Post-money valuation = pre-money valuation + raise amount
- Round investor ownership = raise amount / post-money valuation
- Founder ownership after this round = founder equity today × pre-money valuation / post-money valuation
- Other equity holders after this round = other ownership today × pre-money valuation / post-money valuation
- Founder equity after future dilution = founder ownership after this round × (1 − future dilution)
- Estimated founder payout at exit = founder equity after future dilution × targeted exit valuation
- Founder ownership needed after this round = founder payout target / targeted exit valuation / (1 − future dilution)

The founder, round investor, and other equity holders should always total 100% after the round.

## Known-answer tests

| Test | Equity today | Pre-money | Raise | Future dilution | Targeted exit | Payout target | Founder after round | Round investor | Other holders | Founder after dilution | Estimated payout | Needed after round |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Default | 100% | $8M | $2M | 50% | $100M | $20M | 80% | 20% | 0% | 40% | $40M | 40% |
| Existing co-owners | 60% | $4M | $1M | 0% | $100M | $20M | 48% | 20% | 32% | 48% | $48M | 20% |
| No raise | 75% | $8M | $0 | 40% | $100M | $20M | 75% | 0% | 25% | 45% | $45M | 33.33% |
| 50/50 round | 100% | $1M | $1M | 0% | $100M | $50M | 50% | 50% | 0% | 50% | $50M | 50% |
| Exact hurdle | 100% | $8M | $2M | 75% | $100M | $20M | 80% | 20% | 0% | 20% | $20M | 80% |

## Requested-change checks

0aa. Section 1 (**Your setup**) starts collapsed by default and shows a **"Tap to expand"** hint next to the chevron; tapping opens it, the hint changes to **"Tap to roll up"**, the chevron rotates, and the value-summary line hides. Tapping again re-collapses it. On a fresh device (cleared storage) it still starts collapsed.
0c. The headline reads **Founder Exit Calculator**, with the subhead **"Quick equity, dilution and exit check. Your numbers save automatically on this device."** The browser tab title is also **Founder Exit Calculator**.
0d. Install the PWA on a phone. The home-screen icon is labelled **Exit Calc** (short, not truncated); the install prompt / splash screen shows the full **Founder Exit Calculator**. Check both iOS (Safari → Add to Home Screen) and Android (Chrome → Install).
0a. The header top line reads **KV Consulting** with a **"Need help? Get in touch →"** link on the same row; clicking it opens a new email to **kremer@kremerventures.com**. On a narrow phone the link wraps cleanly rather than overflowing.
0b. The setup opens with an **Ownership today** block showing **You** (editable %) and **Everyone else** (read-only). Change You to 80 → Everyone else shows 20; set 60 → 40; clear it → You is treated as 100 and Everyone else shows 0. The two always total 100%.
2. The setup label reads **Founder payout target at exit** and includes a **$50M** shortcut.
3. The dilution label reads **Expected future dilution through exit**.
4. The percent sign is visually attached to the “Your equity today” number.
5. Section 3 is **Ownership after this round** and shows, in order:
   - Founder ownership after this round
   - Round investor ownership
   - Other equity holders after this round
6. The three ownership percentages total 100%.
7. Section 4 is **Projected outcome at exit** and shows:
   - Founder equity after future dilution
   - Estimated founder payout at exit
   - Needed after this round to hit payout target

## Edge cases

1. Clear “Your equity today.” It should intentionally continue to use 100% — blank is not an error, but out-of-range values now are (see #22).
2. Use a $49.9M targeted exit with the default deal and a $20M payout target. The payout should display **$19.96M** and say it is below target.
3. Use a $50.1M targeted exit with the default deal and a $20M payout target. The payout should display **$20.04M** and say it clears the target.
4. Use a $100M targeted exit, $120M payout target, and 50% future dilution. The needed card should say **Not possible** and explain that 240% ownership would be required.
5. Enter `1e6`, `2.5e7`, `$2.5M`, and `$2,500,000`. Each should parse correctly.
6. Enter letters or a negative amount in a money field. The field should highlight and all results should display a dash rather than a believable calculation.
7. Change each field rapidly, paste values, use every shortcut button, and confirm outputs never become stale.
8. Refresh the browser and confirm saved values return.
9. Reset setup and deal separately and confirm each reset affects only its own section.
10. Test Chrome, Edge, Safari, and a phone-sized screen.
11. Install the PWA, test it offline, reconnect, and confirm the v21 cache update appears.
21. **Payout caveat.** The payout card shows, under the verdict line, "Pro-rata share of the exit value only — before liquidation preferences, participation rights, debt, taxes and fees…". It stays visible in every state, including when inputs are invalid and the payout shows a dash.
22. **Ownership validity.** Type `150`, `-5`, `100.1` and `1e5` into "Your ownership today". Each must highlight the field, show "Enter an ownership between 0% and 100%.", dash out the results and the "Everyone else" mirror, and put "Check your ownership %" in the collapsed setup summary — never silently compute with a clamped number. Then type `60`: the error clears and results return. `0`, `100` and blank (= 100%) are all valid.
20. **Install confirmation.** Complete an install from the header button. The button is replaced by a green **✓ Installed — find Exit Calc on your home screen** panel. It must **stay put**, not fade after a few seconds. You remain in the browser tab, not the app — that is correct and unavoidable; no browser lets a page launch its installed app.
19. **Install button.** On **Android Chrome** the **Install app** pill is *always* in the header. If Chrome has offered an install, tapping it opens the native dialog and the button disappears once installed. If Chrome has not offered one — most often because the app is already installed — tapping instead expands instructions naming the ⋮ menu route and saying to check the home screen for **Exit Calc**. Verify both states: once with the app installed, once after uninstalling it. On **iOS Safari** the pill is always shown and expands Share → Add to Home Screen steps; tapping again collapses them. On **iOS Chrome/Edge/Firefox** the panel instead says to open in Safari first. Launch the installed app: the pill must **not** appear at all.
17. "Your ownership today" is laid out like the other fields: label on one line, big **%** below, "Tap to type any %" under it, then chips, then an "Everyone else" complement line. Not an inline "You 80%" row.
18. Dilution quick chips read **40 / 50 / 60 / 75 / 90** (no 25%). Dragging to 90 works; the slider still spans 0–100.
14. Drag future dilution to **100%**. The payout shows **$0**, the "needed" card reads **"Not possible"** with "Full future dilution leaves nothing at exit." — no `Infinity%` or divide-by-zero. Slider covers the full 0–100 with 50% at the midpoint.
15. Change the targeted exit or the dilution %. The **Section 4 heading** updates live to "Projected outcome at exit: $X exit and X% future dilution". Clear the exit and the assumptions drop from the heading.
16. Each editable field shows a typing hint **directly under its number** (above the chips): setup/exit/target say "Tap to type…", deal fields say "Type shortcuts like 500k, 2.5M, etc.". Raise has a **$5M** chip.
12. Use a $49.99M targeted exit with the default deal and a $20M payout target. The payout rounds to **$20M**; the verdict must agree with the displayed number (it clears at display resolution) rather than showing "$20M" while claiming it is below target.
13. Clear the targeted exit valuation. The payout card should prompt to add an exit, not assert that the target was missed.

## Automated test

From the project folder, run:

```bash
node tests/audit-founder-calc.js
```

A release candidate should finish with `Summary: 0 failure(s).`
