# Money Age — amended spec (v2)

Supersedes `money-age-spec.md` and `money-age-page-flow-spec.md` (both draft v1).
Route: `/whats-my-money-age`.

Everything in v1 that is not mentioned here stands. What follows is only what
changed, and why — each change is here because the v1 version produced a wrong
or self-defeating number, not because it read better.

---

## 1. Five changes from v1

### 1.1 The yardstick has a career, not a flat salary

**v1:** the reference saver earned *your current income* every year from 22.

That makes the reference person impossible. A 35-year-old on $120,000 was
measured against someone who earned $120,000 at 22 — so the bar rose with
seniority, and the error compounded the longer the career:

| you are | earning | v1 money age | v2 money age | v1 error |
|---|---|---|---|---|
| 26 | $60,000 | 24.5 | 24.7 | −0.2 |
| 30 | $85,000 | 27.2 | 28.0 | −0.8 |
| 35 | $120,000 | 30.7 | 32.7 | −1.9 |
| 40 | $150,000 | 34.5 | 37.9 | −3.4 |

**v2:** the reference saver's income grows at `g` and equals yours at your age.

```
yardstick_balance(t) = B · I · (1+g)^(22−A) · [(1+r)^n − (1+g)^n] / (r − g)
  n = t − 22
  A = your age, I = your income
  when r = g:  B · I · (1+g)^(22−A) · n · (1+r)^(n−1)
```

`PositionYears` becomes the `t` at which `yardstick_balance(t) = H`, found by
bisection. There is no closed form for the inverse and there does not need to
be — it is ~60 iterations of arithmetic.

**`g` needs a citation exactly as `B` does.** 0.03 real is the working value and
must not ship unsourced. It is now the second parameter that decides the shape
of the answer, so it earns the same scrutiny as the first.

### 1.2 Do not rewrite history when income changes

The career yardstick does **not** fix the raise problem. Measured:

> 32 years old, $60,000 saved, raise from $80k → $130k.
> Flat yardstick: −3.3 years. Career yardstick: −3.3 years.

Any income-relative measure does this, because the bar moves with the income.
The fix is not in the formula, it is in what you re-run:

**Store the income you saw, and let a raise affect only the years from now on.**
The bar for "what you should have held at 28" is set by what the user earned up
to 28, and a raise at 32 does not retroactively raise it.

On a first visit there is no history, so the whole path is seeded from the
current income — which is exactly the case §1.1 fixes. The two changes cover
different halves and you need both:

- career yardstick → the first number a new visitor sees
- no rewriting history → every number after that

### 1.3 `B` is calibrated, and counts what the user's rate counts

**v1:** `B = 0.06`, unsourced, with `s` excluding employer contributions.

That combination made the employer match worth **exactly zero years**:

```
0% → 5% WITH a 100% match:  29.3 → 31.8
0% → 5% with NO match:      29.3 → 31.8
```

A tool telling people free money changes nothing, on a site whose Money Plan is
built on capturing the match first. Two tools, one site, opposite advice.

**v2:** `s` counts employee **and** employer contributions, and `B` is the
matching published figure.

> Vanguard, *How America Saves 2026* (2025 plan year, ~5M participants):
> employee-only deferral **7.6%**, including employer contributions **12.1%**.

`B = 0.121`. The rule that generates it: **`B` and `s` must count the same
things.** Any pair works; a mismatched pair is a silent bug.

Result — the same person, differing only in whether the employer matches:

| | money age vs actual |
|---|---|
| 5% dollar-for-dollar match | −5.2 years |
| no match | −8.8 years |
| **gap** | **3.7 years** (was 0.0) |

**Do not tune `B` to make users look good.** v1 said "if most users land behind,
`B` is wrong, not the users." That instruction produces a horoscope, and the
published method page — the thing meant to buy credibility — is what exposes it.
`B` is sourced or it is indefensible.

### 1.4 `c` is re-tuned, because `B` and `c` are not independent

`B` sits in the denominator of the rate credit, so honest calibration silently
halves the slider — the page's entire hook:

| | slider travel, 0% → 25% |
|---|---|
| v1 (`B`=6%, `c`=3) | 12.5 years |
| calibrated, `c` unchanged | **6.2 years** |
| calibrated, `c` = 8.9 | 18.4 years |

**`c` = 8.9.** This is safe to tune for feel: at `s = B` the credit is zero for
any `c`, so the property that makes the number interpretable — saving the
reference rate puts you at your own age — is preserved regardless.

Tune `B` for honesty. Tune `c` for feel. They do not fight.

### 1.5 The result leads with catch-up, not with relief

With a sourced `B`, most of the target audience lands behind:

| user | v1 (`B`=6%) | v2 (`B`=12.1%) |
|---|---|---|
| 24, $55k, $3k saved, 3% | −3 | −6 |
| 28, $70k, $12k, 6% | −3 | −5 |
| 32, $95k, $45k, 10% | −1 | −4 |
| 35, $120k, $90k, 12% | 0 | −2 |

v1 treated behind-ness as damage to be floored and hidden. That is backwards,
because the slider swing is **larger** for a behind user and it crosses zero:

> 28, $55k, $5k saved. At 3%: −6 years. Drag to 15%: 0. Drag to 20%: +2.

"You are 6 years behind, here is how to close it" is a game with a win
condition. "You are 7 years ahead" is a pat on the head with nowhere to go.

Consequently:

- **Lead with the delta, not the age.** `+7 years` / `−6 years` is unambiguous;
  `31` is not. Every comparable metric (fitness age, lung age) runs
  lower-is-better, so a bare inverted age reads as bad news to anyone who has
  not used the tool — including every recipient of a share.
- **Delete the "floor the bad news at 5 years behind" rule.** Show the real
  number and put the closing move next to it.
- The share card carries the **delta**, never the bare age.

---

## 2. Parameters

| Param | v1 | v2 | Status |
|---|---|---|---|
| `r` real return | 0.05 | 0.05 | unchanged |
| `B` reference rate | 0.06 guessed | **0.121** | Vanguard 2026, total incl. employer |
| `c` years per 100% of `B` | 3.0 | **8.9** | tuned to preserve slider range |
| `g` real income growth | — | **0.03** | **NEEDS A CITATION BEFORE LAUNCH** |
| start age | 22 | 22 | unchanged |

---

## 3. Peer comparison

v1 forbade peer comparison at launch pending SCF data. Refined:

**Ship the rate comparison now.** Vanguard's 7.6% / 12.1% is one current,
sourced, citable number and it is the input users most want compared.

**Defer the balance comparison.** SCF's most recent wave is 2022 (2025 expected
late 2026); it is household-level, its published buckets start at "under 35" —
useless for 24 vs 32 — and the microdata ships as five multiply-imputed
implicates needing replicate weights.

**And note what §1.3 buys for free:** once `B` is sourced, "on track" *means*
"saving what the average plan participant saves." The money age becomes the peer
comparison, with no distributional data required.

---

## 4. What did not change

The good parts of v1, restated so they are not lost in the edit:

- Four taps and a slider. **Provisional number after Q3** — the single best
  sequencing decision in the original and the correct answer to a short
  attention span.
- The live slider. The one input nobody can self-report, turned into play.
- Log-spaced position bands.
- Publishing the method in full, below the fold.
- Honesty on null deltas: a move that does not change the age says so.
- No internal vocabulary. No "autopilot". No invented peer line.

---

## 5. Open questions

1. **`g` has no source.** Blocks launch on the same terms `B` did.
2. **A raise still lowers the number**, even with §1.2, for a user whose *first*
   visit is post-raise. Decide whether copy handles it or whether it is accepted.
3. **12.1% is a participant average**, so the bar is "people already saving in a
   workplace plan." That is a defensible and aspirational peer group, but it is
   not "everyone" — decide whether the page says so out loud.
