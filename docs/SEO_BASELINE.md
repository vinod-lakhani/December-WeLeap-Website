# SEO/AEO baseline — 17 August 2026

Recorded the day the work shipped, so that in 90 days there is something to compare against other than memory.

Everything in the "Measured today" tables was read from live production or the production build on 2026-08-17, not estimated.

**Ten PRs merged and deployed on 2026-08-17** (#24, #25, #26, #27, #28, #29, #30, #31, #32, #33).

---

## Read this before drawing any conclusion

**Everything changed at once.** Ten PRs in a day touching copy, schema, page speed, URLs and information architecture. If impressions rise, you cannot attribute it to the copy rather than the schema rather than the speed rather than the renames. This document records what happened; it cannot make the experiment clean, because it wasn't one.

**Search Console will look worse before it looks better.** Five routes were renamed. Ranking signals pass through the 308s, but GSC's *reporting* does not merge an old path's history with its new one. Expect old-URL impressions to decay while new-URL impressions build from zero — a visible dip for roughly two to eight weeks. That is the rename working, not breaking. Do not react to it.

**There is very little "before".** Per-page metadata only landed in PR #21/#22, shortly before this work. The site has almost no accumulated organic history, which is why renaming five URLs was cheap. It also means most of these pages have no meaningful prior baseline in GSC.

---

## Measured today

### Tool pages — server-rendered word count and FAQ coverage

Before this work, six of the seven served roughly 25 words of extractable copy around the widget. `/how-much-rent-can-i-afford` served 713.

| Route | Words | FAQ entries | Target query |
|---|---|---|---|
| `/how-much-rent-can-i-afford` | 2,141 | 7 | how much rent can i afford |
| `/what-is-my-job-offer-worth` | 2,369 | 7 | what is my job offer really worth |
| `/should-i-use-buy-now-pay-later` | 2,194 | 7 | should i use buy now pay later |
| `/what-is-saving-monthly-worth` | 2,189 | 7 | what is saving monthly worth |
| `/how-should-i-split-my-paycheck` | 1,752 | 7 | how should i split my paycheck |
| `/credit-card-payoff` | 2,544 | 7 | how long will it take to pay off my credit card |
| `/how-much-emergency-fund-do-i-need` | 2,441 | 7 | how much emergency fund do i need |

49 FAQ entries total. Every answer verified present in served HTML — several were previously behind Radix accordions that only existed after hydration, and so were invisible to most crawlers.

Every tool serves exactly one `<h1>`, restating its target query, plus `WebApplication`, `BreadcrumbList` and `FAQPage` schema, a visible breadcrumb trail matching that schema, and internal links to two or three sibling tools.

### Performance

| | Before | Today |
|---|---|---|
| Homepage First Load JS | 179 kB | **124 kB** |
| `/credit-card-payoff` First Load JS | 289 kB | **225 kB** |
| Shared JS | 87.5 kB | 87.5 kB |
| `public/` images | 37.9 MB | **13.6 MB** across 48 files |

`posthog-js` (~59 kB gzipped) was removed from the initial bundle of every page. 28 of 30 raw `<img>` converted to `next/image` with intrinsic dimensions; the Vercel optimizer is engaged.

### Crawl surface

| | State |
|---|---|
| Sitemap | 26 URLs, 12 carrying `lastmod` (the articles, with real publication dates) |
| Pages emitting `og:image` | 29 of 30 (only `_not-found`, correctly) |
| `<title>` vs `og:title` divergence | 0 routes (only `_not-found`) |
| AI crawlers | all allowed deliberately; `Bytespider` blocked |
| Apex → www | 308 (was 307) |
| `noindex` on flow-entry routes | `/join`, `/early-access`, `/early-access/videos`, `/sms-notifications` |

### Redirect map — all single-hop 308, query params preserved

```
/offer                  → /what-is-my-job-offer-worth
/allocator              → /how-should-i-split-my-paycheck
/smart-purchase-check   → /should-i-use-buy-now-pay-later
/net-worth-impact       → /what-is-saving-monthly-worth
/emergency-fund-target  → /how-much-emergency-fund-do-i-need
/rent                   → /how-much-rent-can-i-afford
/pay-now-or-later       → /should-i-use-buy-now-pay-later
/leap-impact-simulator  → /how-should-i-split-my-paycheck
```

An old slug on the apex host is a legitimate two-hop (host redirect, then path redirect). Both are permanent.

---

## What to check, and when

### At 14 days — binary. These either happened or they didn't.

- [ ] **`/about` is Indexed.** This is the cleanest single experiment here: it returned HTTP 500 on *every request* for months before 2026-08-17, and a URL that repeatedly 5xxes gets dropped. Its return to the index has one cause. GSC → Pages.
- [ ] The five renamed URLs appear under **Indexed**; the five old paths move to **Page with redirect**.
- [ ] GSC → Enhancements shows **Breadcrumbs** and **FAQ**. Neither existed on this site before — any non-zero number is new.
- [ ] Rich Results Test passes on one tool URL.

Failure here means something is technically wrong, not that the strategy is weak. Re-run the auditor against live HTML.

### At 30 days — early direction

- [ ] **Core Web Vitals** report has moved. It is CrUX field data on a 28-day rolling window, so it needs both elapsed time and real traffic; if traffic is thin it may stay "insufficient data", which is not a failure.
- [ ] Impressions exist at all on the new tool URLs. Not position — presence.
- [ ] Old-URL impressions are visibly decaying. Expected and correct.

### At 90 days — the actual outcome

- [ ] **Impressions on the seven tool routes, filtered to question-shaped queries.** This is the real measure. Those pages went from ~25 words to 1,700–2,500 and from zero to 49 FAQ entries. Compare against the target queries in the table above.
- [ ] **Branded query volume** — "weleap", "ribbit weleap", "weleap vs [competitor]". The most honest proxy available for AI-assisted discovery, which almost always terminates in someone typing the brand.
- [ ] **Average position** on the target queries. Expect long-tail movement, not head terms.
- [ ] Referral traffic from `chat.openai.com`, `perplexity.ai`, `claude.ai`, `copilot.microsoft.com` in GA4. **Treat any number as a floor, never a measurement.**

---

## What working looks like, and what it doesn't

**Working:** tool-route impressions rising on question-shaped queries, even at poor average position. Branded queries trending up. New URLs indexed and old ones showing as redirects. Occasionally finding the site cited in an AI answer for a query you targeted.

**Not working:** 90 days on, tool routes still have near-zero impressions on their target queries despite being indexed. That would mean the pages are technically fine and simply not competitive — the honest read recorded at the time was that all seven are long-tail and AEO plays, not head-term contenders, because NerdWallet, Bankrate, Zillow and the brokerages own those terms on domain authority no amount of on-page work overcomes.

**Ambiguous, and expect this:** impressions rise modestly, position stays poor, direct traffic rises with no attributable source. That is the most likely outcome and it is genuinely hard to read.

---

## What cannot be measured

**AI citations.** There is no reliable tracking. Referrer data from AI surfaces is partial at best, and the dominant path — read an answer, type the brand into a browser — arrives as direct traffic indistinguishable from any other unattributed visit. Some surfaces strip the referrer entirely; ChatGPT citations often open in-app.

Judge the AEO half of this work on leading indicators instead: server-rendered word count, schema validity, whether answers survive being lifted out of context, and the branded-query trend over a quarter. Any product claiming to measure AI citations directly is selling inference dressed as measurement.

---

## Still open on the day this was recorded

- **`weleap.app` is fully indexable** — `/robots.txt` 404s, no `X-Robots-Tag`, no meta robots, and it is linked from the marketing footer. It will compete on brand queries. Fix is `X-Robots-Tag: noindex, nofollow` at the nginx layer in that repo. **If brand queries do not improve, check this first.**
- The gtag preload competes with LCP at default priority. Emitted by `@next/third-parties`, so fixing it means replacing that integration.
- ~7.6 MB of unreferenced images remain in `public/`, plus a file with a literal newline in its name.

---

## How this was verified

Every claim above was checked against rendered HTML or the production build, not source. That distinction is load-bearing: the two most serious defects found during this work were invisible to source review — `/about` returning 500 on every request, and `/allocator` serving no `<h1>` because it sat behind a Suspense boundary whose fallback was a skeleton. A third, the payoff calculator's "avalanche" sorting by balance rather than APR, was invisible to both and only surfaced by running the calculation.

When re-auditing, audit production over HTTP.
