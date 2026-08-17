# WeLeap SEO/AEO agents

Four Claude Code subagents, written against this repo specifically — Next.js 14.2.26 App Router, TypeScript, Tailwind, shadcn/ui, pnpm, Vercel, canonical host `www.weleap.ai`.

```
.claude/agents/
  seo-auditor.md     # read-only; finds and evidences problems
  seo-fixer.md       # implements technical SEO fixes
  aeo-optimizer.md   # answer-engine readiness
  tool-page-builder.md # builds one /tools page into a full ranking surface
```

## State as of PR #23

Typechecking is on and clean, ESLint is installed and runs in the build, and 27 of 31 pages have real metadata. `pnpm build` is a genuine gate — the agents treat a red build as their own fault, not a pre-existing condition.

`robots.ts`, `sitemap.ts`, and `alternates.canonical` are all live in production. JSON-LD (`components/JsonLd.tsx`) and `public/llms.txt` landed in PR #23 — the agents' job on both is now verification and extension, not creation. Two client-component pages remain metadata-blocked: `app/join/page.tsx` and `app/resources/page.tsx`.

## Sequence

1. `> use seo-auditor to audit the marketing site` — read-only. Review the findings before letting anything write.
2. `> use seo-fixer on the Critical and High findings` — it stops and asks before architecture-level changes.
3. `> use aeo-optimizer` — only after step 2.
4. Re-run `seo-auditor` to verify.

## Why the auditor has no write tools

Audit-and-fix in one agent produces fixes for problems it invented. Splitting them keeps a review gate before the diff lands.

## Standing constraints all four know about

- `pnpm build` must stay green. No agent may re-enable `ignoreBuildErrors` or `ignoreDuringBuilds`, and `react/no-unescaped-entities` stays off.
- The three analytics trackers and the UTM + PostHog `distinct_id` handoff in `lib/app-link.ts` are not to be disturbed.
- `weleap.app` is the product app and should be `noindex`, not optimized.

## Verification discipline

Metadata bugs do not show up in config. All three of the `title` defects in PR #21/#22 — the `/resources/layout.tsx` suffix strip, the three pages with `| WeLeap` baked in, the stale "Six free calculators" — were only visible in rendered HTML. Agents check `curl`'d output, not source.

## tool-page-builder

Separate from the sequence above. `/tools` is the acquisition funnel, so each tool page is its own unit of work — run this once per tool, not in bulk.

```
> use tool-page-builder on the emergency fund calculator, target query "how much emergency fund do i need"
```

It will refuse to build without a named target query, and it will tell you when a tool is a commodity that can't win against NerdWallet or Bankrate rather than building the page anyway. It also won't generate thin variant pages — that pattern is a manual-action risk, not a growth hack.

Tools are **top-level routes**, not nested under `/tools/` — `/how-much-rent-can-i-afford`, `/what-is-my-job-offer-worth`, `/how-should-i-split-my-paycheck`, and so on, with `app/tools/page.tsx` as a pure index over `FREE_TOOLS`. That is deliberate and the agent will not migrate them. Because the URLs are flat, internal linking is the only thing grouping them topically, so the agent treats it as load-bearing rather than decorative.

`/offer` → `/what-is-my-job-offer-worth` and `/allocator` → `/how-should-i-split-my-paycheck` were both renamed on the agent's own recommendation, each backed by a 308, with analytics identifiers deliberately left in place. `/smart-purchase-check` and `/net-worth-impact` are the remaining candidates.
