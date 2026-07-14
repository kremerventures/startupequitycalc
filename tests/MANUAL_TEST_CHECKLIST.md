# Founder Calc manual test checklist

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

1. The setup label reads **Targeted exit valuation** and includes a **$25M** shortcut.
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

1. Clear “Your equity today.” It should intentionally continue to use 100%.
2. Use a $49.9M targeted exit with the default deal and a $20M payout target. The payout should display **$19.96M** and say it is below target.
3. Use a $50.1M targeted exit with the default deal and a $20M payout target. The payout should display **$20.04M** and say it clears the target.
4. Use a $100M targeted exit, $120M payout target, and 50% future dilution. The needed card should say **Not possible** and explain that 240% ownership would be required.
5. Enter `1e6`, `2.5e7`, `$2.5M`, and `$2,500,000`. Each should parse correctly.
6. Enter letters or a negative amount in a money field. The field should highlight and all results should display a dash rather than a believable calculation.
7. Change each field rapidly, paste values, use every shortcut button, and confirm outputs never become stale.
8. Refresh the browser and confirm saved values return.
9. Reset setup and deal separately and confirm each reset affects only its own section.
10. Test Chrome, Edge, Safari, and a phone-sized screen.
11. Install the PWA, test it offline, reconnect, and confirm the v11 cache update appears.
12. Use a $49.99M targeted exit with the default deal and a $20M payout target. The payout rounds to **$20M**; the verdict must agree with the displayed number (it clears at display resolution) rather than showing "$20M" while claiming it is below target.
13. Clear the targeted exit valuation. The payout card should prompt to add an exit, not assert that the target was missed.

## Automated test

From the project folder, run:

```bash
node tests/audit-founder-calc.js
```

A release candidate should finish with `Summary: 0 failure(s).`
