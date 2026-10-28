# Internship offer tool — spec (v2)

Route: `/what-is-my-internship-offer-worth`. Tool slug: `internship`.

Supersedes the preliminary spec of 19 Oct 2026. Everything in that draft not
mentioned here stands. What follows is what changed in review, and why — each
change is here because the draft would have produced a wrong number, a broken
handoff, or a page that cannot be found.

Origin: a call with a Purdue career-center (CCO) staff member on 19 Oct, who is
also a graduating senior. Two points from it drive the page: students do not
recognise themselves in "job offer" during sophomore and junior year, and the
CCO is asked "how do I compare these offers" with nothing better than Google to
point at. The tool is built with that channel in mind — a `.edu` link on launch
day is worth more than the page without one.

---

## 1. Placement and naming

New page, not a mode of the full-time tool. Question-shaped slug, with the word
*internship* in the title, H1 and tools-grid card. Registered in `FREE_TOOLS`
so it appears on `/tools`, `/bio`, the sitemap and in `TOOL_COUNT`
automatically; added to `BIO_TOOL_ORDER` (the bio test fails otherwise).
Cross-linked both ways with the full-time offer tool and the rent tool.

**No `?campaign=1` mode.** Every campaign hero on this site has reintroduced the
same defect — a prefilled example makes the completion gate vacuous — and there
is no paid campaign behind this page. Its absence is a decision, not an
omission.

## 2. What it computes, and what it must not

Nothing from the full-time package carries over: no match, equity, bonus or
PTO value. Most interns are not plan-eligible and the fields would be noise.
The question is *what do I clear, and can I afford to live there for the term*.

### Inputs

- **Pay**, one of three shapes (hourly first — the engineering default):
  hourly rate + hours/week (default 40); monthly stipend; lump sum for the term.
- **Overtime** hours/week at 1.5× — hourly only, optional.
- **Term** in weeks. One input, prefilled 12; the label mentions co-ops
  (typically 16) rather than a separate toggle.
- **Work state** (tax) and **city / metro** (housing).
- **Housing**, one of: employer provides it / employer pays a cash stipend
  (amount) *and you pay rent* / you pay rent. A stipend does not make housing
  free; it is income, see §3.
- **Relocation or travel allowance**, one-off, optional.

Nothing is prefilled with an example figure. Hours and weeks carry their
conventional defaults; the rate does not. A result cannot exist before the
visitor types a number.

### Outputs, in this order

1. **What's left after housing** — the headline. Not total earnings.
2. Gross for the term.
3. Estimated take-home for the term and per month, *with the refund line
   directly under it* (§3.1).
4. Housing cost for the term.
5. Cash needed before the first paycheck (§3.3).
6. Annualised equivalent — last, small, labelled as a comparison aid and as
   the number recruiters use to make $45/hr sound like $93,000. Never shown as
   expected earnings.

### Compare two internships

From launch, side by side, live: the second internship's inputs on the left and
both priced on the right on a wide screen; stacked on a phone. No confirm step
— the comparison table shows a one-line placeholder until the second offer has
pay, rather than a column of dashes. Same one-DOM rule as the full-time
comparison: every input mounts once.

## 3. Accuracy — three problems, not two

### 3.1 Withholding over-collects on a short term. Show the number, not a disclaimer.

Payroll tables assume each paycheck's rate continues all year, so $25/hr for
twelve weeks is withheld as though it were $52,000 of income. The actual
liability on $12,000, alone, is roughly zero — it is under the standard
deduction. The gap is large relative to the offer and it is computable from
the same bracket, deduction and FICA functions the first-paycheck tool reads:

- **withheld** = federal and state on the *annualised* regular pay, prorated to
  the term, plus FICA on everything; a one-off allowance at the 22% federal
  supplemental rate rather than annualised.
- **owed** = federal and state on the term's gross treated as the whole year's
  income, plus FICA.
- **refund** = withheld − owed, floored at zero.

The page shows take-home as *what lands during the term* (gross − withheld),
with one line under it: *"Payroll will hold back about $X. Roughly $Y of that
comes back when you file. FICA doesn't."* The one honest caveat — assuming no
other income this year — is stated; for a student it is usually true.

### 3.2 Cash stipends and allowances are wages.

A housing stipend paid in cash is taxable income. So is a relocation allowance
(since 2018). Both go through the same tax as pay, and the page says so.
Employer-*provided* housing is treated as not costing the intern anything; the
caveat notes it is often a taxable fringe too, which this does not model.

### 3.3 Housing: label, don't adjust.

There is no data source for summer sublets, so a short-term multiplier would be
an invented number — the thing the Claims Policy exists to stop. "You pay" is
prefilled from the ZORI metro median once a city is chosen, labelled *market
rate for a year lease; summer sublets and furnished short-term places vary
either way*, and the field accepts whatever the intern actually knows.

**Cash before the first paycheck.** Deposit plus first month's rent is due
before any pay lands, typically two to three weeks in. One line, as a rule of
thumb (deposit ≈ one month), because this is the hardest version of "can I
afford it" and the draft did not mention it.

Illustrative figures only, and only where the tool itself shows them.

## 4. The page, not just the calculator

Tool pages here are the calculator plus a server-rendered explanation, a FAQ
of at least seven entries in `lib/tool-faqs.ts` (the FAQPage schema and the DOM
read the same array), JSON-LD, breadcrumb, related tools, an OG image route,
and the `checkMetadata` build gate: title and `og:title` byte-identical, exactly
one `<h1>`, FAQ coverage. The draft covered the calculator only.

## 5. Instrumentation and handoff

Identical rules to the 18 Oct spec. Slug `internship`, version `internship_v1`.

- `tool_viewed` via `ToolPageView`; `tool_engaged` on the first change;
  `tool_result_shown` once a result exists.
- `tool_completed` once per session via `claimToolCompletion('internship')`
  when there is enough to answer: pay > 0 **and** at least one of term
  (changed from default), work state, or city. The touched set records
  *changes*, not focus — the rent fix found focus counted.
- `tool_cta_clicked` with `tool: 'internship'` and placement, from `AppCta`.
  The handoff parameter is **`src`**, not `source` — the app reads `src` and
  stores it as `initial_tool_source`. `AppCta` sets it, along with `ph_did`,
  UTMs and click IDs, so the tool cannot ship without it.
- Primary CTA directly under the headline result, nothing between.
- Google Ads: nothing to wire. Conversions key on event name in
  `lib/google-ads.ts`, so `tool_completed` and `tool_cta_clicked` from this
  tool fire the existing actions. The new campaign is Ads-account work.

## 5a. Added 28 Oct 2026 — 401(k) match

v1 assumed interns are not plan-eligible. The Purdue tester's internship had a
match, so the tool now asks: a collapsed *Does it offer a 401(k) match?* block
with match rate, cap and contribution. The contribution follows the cap until
the visitor types their own — the cap is the answer to "how much should I put
in" for nearly everyone.

- The deferral is pre-tax for federal and state, **not** for FICA, and comes
  out of take-home. The match applies to wages only, never a stipend or an
  allowance.
- One summer of contribution plus match is compounded at 7% for 40 years, the
  same rate every other WeLeap page uses, and labelled a planning figure.
- **Vesting and eligibility are stated, not assumed.** Many plans vest the match
  over years and some make new hires wait; an intern leaving in August can
  forfeit it. The card says so in every state.
- `has_401k` on `tool_completed`; `internship_401k_opened` when the block is
  opened.

## 6. Out of scope for v1

International cities (the tax and rent data are US-sourced), income-driven
anything, per-state brackets (the flat rate is the site-wide estimate and is
labelled), and the home-state credit for a nonresident intern.
