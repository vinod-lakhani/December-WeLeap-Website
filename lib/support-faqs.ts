/**
 * Support answers, in one place so the page and its structured data cannot
 * disagree.
 *
 * Same arrangement as lib/tool-faqs.ts: the page renders these and the
 * FAQPage JSON-LD is built from the same array, so the markup can never
 * describe a question a visitor cannot see.
 *
 * Written for the two audiences this page actually has. One is a user with a
 * broken bank connection at 11pm. The other is an App Review reviewer checking
 * that the support URL is real, that it names a way to reach a human, and that
 * account deletion is genuinely self-serve rather than an email request — the
 * last of which is what guideline 5.1.1(v) is about.
 */

import type { FaqItem } from '@/lib/tool-faqs'

/** How quickly we answer. Stated once here so the page and the FAQ agree. */
export const SUPPORT_RESPONSE_TIME = 'within 2 business days'

export const SUPPORT_EMAIL = 'support@weleap.ai'

export const SUPPORT_FAQS: readonly FaqItem[] = [
  {
    q: 'How do I close my WeLeap account?',
    a: 'Open the app, go to Profile, and under Security & Data choose "Close my account". You do not need to email us or ask permission — closing your account is something you do yourself, and it takes effect immediately. It permanently removes your profile, financial information, goals and plan history from our active systems, revokes any connections to your bank accounts so we stop receiving data from them, and ends further emails and texts. It cannot be undone. If you have lost access to the app, email support@weleap.ai from the address on your account and we will close it for you.',
  },
  {
    q: 'Can I delete my data without closing my account?',
    a: 'Yes. In the same place — Profile, under Security & Data — "Delete my data" erases the information we hold about you while leaving your account open, so you can start again from scratch without signing up a second time. "Close my account" is the option that removes the account itself. If you are not sure which you want, "Download my data" gives you a copy of everything first.',
  },
  {
    q: 'How do I get a copy of my data?',
    a: 'Go to Profile, then under Security & Data choose "Download my data". You will get a copy of the information WeLeap holds about you. You do not need to ask us for it, and you do not need to give a reason. If you are a California resident this is also how you exercise your right to know under the CCPA, described in our privacy policy.',
  },
  {
    q: 'My bank connection stopped working. How do I fix it?',
    a: 'Banks periodically require you to re-authorise the connection, usually every 90 days or after you change your password, and the connection stops updating until you do. Open the app, go to Profile, find the account under your connected accounts, and reconnect it. This is the most common thing that goes wrong and it is almost never a problem with your account. If reconnecting does not work, email support@weleap.ai with the name of the bank and we will look at it.',
  },
  {
    q: 'How do I disconnect a bank account?',
    a: 'Go to Profile and remove the connection from your connected accounts. WeLeap stops receiving data from that account immediately and the access token is revoked. You can do this for one account without affecting the others, and without closing your WeLeap account.',
  },
  {
    q: 'Can WeLeap see my bank login?',
    a: 'No. Bank connections are handled by Plaid, and your credentials are entered with Plaid rather than with us. We never see or store your bank username or password. WeLeap receives read-only information such as balances and transactions, and only for the accounts you choose to connect. We cannot move money, and there is no part of the product that tries to.',
  },
  {
    q: 'How do I stop the emails or texts?',
    a: 'For email, use the unsubscribe link at the bottom of any marketing email. For texts, reply STOP to any message from us and you will get one confirmation that you have been unsubscribed. Reply START to opt back in, or HELP for help. We may still send transactional messages needed to operate your account. Full details are on our SMS notifications page.',
  },
  {
    q: 'What does WeLeap cost?',
    a: 'WeLeap is free during early access and does not require a credit card. If that changes we will tell you before it does, and you will not be charged without agreeing to it first.',
  },
  {
    q: 'Is WeLeap financial advice?',
    a: 'No. WeLeap is not a registered investment adviser, broker-dealer, tax professional or financial planner, and nothing in the product or from our support team is personalised investment, legal or tax advice. We show you what the arithmetic says about your own numbers so you can decide what to do. For advice specific to your situation, speak to a licensed professional.',
  },
  {
    q: 'I think I have found a security problem. Who do I tell?',
    a: 'Email support@weleap.ai with "Security" in the subject line and as much detail as you can give us. We will acknowledge it and come back to you. Please do not post details publicly until we have had a chance to respond.',
  },
]
