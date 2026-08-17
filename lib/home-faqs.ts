import type { FaqItem } from '@/lib/tool-faqs'

/**
 * The homepage FAQ.
 *
 * In its own module rather than inside weleap-landing.tsx because that file is
 * `"use client"`, and a value exported from a client module reaches a server
 * component as an opaque client reference — `app/page.tsx` needs to iterate
 * this to build the FAQPage markup, which it cannot do across that boundary.
 *
 * Same rule as lib/tool-faqs.ts: the section renders this array flat, with all
 * answers in the served HTML whether or not a question is open, so the schema
 * describes text a visitor can actually read. Only real questions belong here.
 */
export const HOME_FAQS: readonly FaqItem[] = [
  {
    q: 'What is WeLeap?',
    a: "WeLeap is a personal finance app built around an AI financial sidekick called Ribbit. You connect your accounts and Ribbit looks at the whole picture — cash, debt, 401(k), goals — then names the single move worth making next, called a Leap. It is not a budgeting app: it does not categorise last month's spending, it tells you what to do with the next dollar. It is free during early access, and the calculators need no account at all.",
  },
  {
    q: 'What if I’m bad with money?',
    a: 'Then you’re exactly who this is for. Ribbit doesn’t grade your spending or lecture you about takeout. It looks at where you actually are and tells you the next useful thing to do.',
  },
  {
    q: 'Do you move my money for me?',
    a: 'Never without your say-so. Ribbit finds the move and shows you the math behind it — you decide whether it happens. Nothing is automatic.',
  },
  {
    q: 'Is my bank data safe?',
    a: 'We connect through Plaid with read-only access — the same infrastructure your other financial apps use. We don’t store your bank login, and we don’t sell your data to anyone.',
  },
  {
    q: 'Are you financial advisors?',
    a: 'No. WeLeap isn’t a registered investment adviser and doesn’t give personalised investment advice. We show you the math on your own numbers so you can make your own call — and we tell you when something is worth asking a professional about.',
  },
  {
    q: 'What if I’m still paying off debt?',
    a: 'Then debt is probably your best move on the board. A 22% credit card beats almost any investment return, and Ribbit will say so instead of pushing you toward a portfolio.',
  },
  {
    q: 'How long does setup take?',
    a: 'About two minutes to connect an account, and your first Leap shows up right after. There’s no long questionnaire and no budget to build.',
  },
]
