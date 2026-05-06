'use client'

import { useEffect } from 'react'
import { PageShell, Section, Container } from '@/components/layout'
import { TYPOGRAPHY } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { track } from '@/lib/analytics'

// ── Data ────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: 1,
    title: 'Create your account',
    desc: 'Sign up with your email. No credit card, no commitment — just your email and a password.',
    time: '~1 min',
  },
  {
    num: 2,
    title: 'Meet Ribbit',
    desc: "Ribbit, your AI advisor, introduces itself and walks you through what's about to happen. Think of it as meeting a financially sharp friend who knows your situation before the conversation even starts.",
    time: '~2 min',
  },
  {
    num: 3,
    title: 'Enter your income',
    desc: "Enter your annual gross salary. WeLeap estimates your monthly take-home straight away — that's the number everything else is built on.",
    time: '~1 min',
  },
  {
    num: 4,
    title: 'See your 50/30/20 plan',
    desc: "WeLeap shows you your take-home split into Needs, Wants, and Savings. You'll see exactly how much you have to work with each month — and how much is available to save.",
    time: '~2 min',
  },
  {
    num: 5,
    title: 'Allocate your savings',
    desc: "WeLeap helps you decide where your savings go: how much stays in cash, how much goes into investments, and how much flows into retirement. Each bucket gets a specific dollar amount.",
    time: '~2 min',
  },
  {
    num: 6,
    title: 'See your net worth over time',
    desc: "Before you've even connected your bank, you'll see your projected net worth grow over 40 years. Adjust the savings rate and watch the number change — this is the moment most people realise what's at stake.",
    time: '~1 min',
  },
  {
    num: 7,
    title: 'Connect your bank',
    desc: "Link your bank account securely through Plaid. WeLeap pulls in your real transactions so you can see exactly how your actual spending compares to your plan. WeLeap never stores your bank credentials.",
    time: '~3 min',
  },
  {
    num: 8,
    title: "Enter your savings details and see how you're doing",
    desc: "Tell WeLeap about your 401(k) match, emergency fund, debts, and investments. WeLeap then shows you where you stand against your plan — the gaps, the wins, and your highest-priority next moves.",
    time: '~3 min',
  },
]

const leaps = [
  {
    emoji: '💰',
    bg: 'bg-amber-50',
    title: 'Capture your full employer match',
    hook: "You're leaving $2,400/year in free money on the table",
    desc: "Your employer matches 50% of your 401(k) contributions up to 6% of salary. You're currently at 3%. WeLeap shows you exactly how much to increase your deferral.",
  },
  {
    emoji: '🚨',
    bg: 'bg-red-50',
    title: 'Attack your highest-APR debt',
    hook: 'Your Visa at 23.9% APR is costing you $180/month in interest',
    desc: 'Before investing beyond your employer match, clear this card first. A 23.9% guaranteed return beats any investment alternative right now.',
  },
  {
    emoji: '🛡️',
    bg: 'bg-green-50',
    title: 'Build your emergency fund',
    hook: "You're at 1.2 months — your target is 4 months",
    desc: "WeLeap has allocated $280/month to your emergency fund. At this rate you'll hit your 4-month target in 8 months — and you don't have to think about it again.",
  },
  {
    emoji: '📈',
    bg: 'bg-blue-50',
    title: 'Your savings rate is below target',
    hook: "At 14%, you're 6% below the 20% goal — a $340/mo gap",
    desc: 'Your last 3 months of transactions show your actual savings running low. WeLeap recommends a 4% shift from discretionary spending.',
  },
  {
    emoji: '🏥',
    bg: 'bg-purple-50',
    title: "You're HSA-eligible and not contributing",
    hook: "You're passing on a triple tax advantage worth ~$1,200/year",
    desc: 'Your high-deductible health plan makes you HSA-eligible — pre-tax in, tax-free growth, tax-free medical withdrawals.',
  },
  {
    emoji: '💼',
    bg: 'bg-amber-50',
    title: 'Your income increased last month',
    hook: 'WeLeap detected a $650/month increase in your deposits',
    desc: "Your transactions show your take-home went up. WeLeap is ready to help you update your plan so that extra money doesn't disappear into spending drift.",
  },
]

const ribbitQs = [
  { q: '"What should I do first?"', a: 'Names your highest-priority Leap with the dollar amount and reason why.' },
  { q: '"Why Roth and not Traditional for me?"', a: 'Explains the tax math using your income and expected future rate.' },
  { q: '"What does +2% savings mean for me?"', a: 'Shows the monthly dollar change and the 40-year compounded impact.' },
  { q: '"I got a raise — what should I do with it?"', a: 'Recommends exactly how to allocate the increase across your savings stack.' },
  { q: '"Am I on track for retirement?"', a: 'Pulls your retirement balance and projects your trajectory.' },
  { q: '"Is my emergency fund target realistic?"', a: 'Shows your current balance, the gap, and your projected timeline.' },
]

const savingsStack = [
  { priority: 1, label: 'Emergency fund', where: '3–6 months of expenses in cash', why: 'Until you have this, one bad month can undo years of progress.' },
  { priority: 2, label: 'High-APR debt', where: 'Any debt over 10% APR', why: 'Paying off 22% APR debt is a 22% guaranteed return. Nothing beats it.' },
  { priority: 3, label: 'Employer match', where: '401(k) up to the full match', why: 'Free money — a 50–100% instant return. Always capture this first.' },
  { priority: 4, label: 'HSA', where: "If you're eligible", why: 'Triple tax advantage. One of the most powerful accounts most people ignore.' },
  { priority: 5, label: 'IRA', where: 'Roth or Traditional', why: 'Tax-advantaged retirement savings. WeLeap picks the right type for you.' },
  { priority: 6, label: 'More 401(k)', where: 'Beyond the match', why: 'Max out once higher-priority items are covered.' },
  { priority: 7, label: 'Brokerage', where: 'Taxable investment account', why: 'No limits, full flexibility. The overflow bucket for long-term wealth.' },
]

const glossary = [
  { term: 'Leap', def: 'A specific financial move WeLeap recommends for you, ranked by impact. Your next best money move.' },
  { term: 'Feed', def: 'Your personalized dashboard — the ranked list of Leaps, alerts, wins, and updates waiting for you.' },
  { term: 'Ribbit', def: 'Your AI advisor. Available on every screen. Knows your real numbers. Ask it anything.' },
  { term: '50/30/20', def: 'The framework WeLeap uses to split your take-home: 50% Needs, 30% Wants, 20% Savings.' },
  { term: 'Savings stack', def: 'The priority order WeLeap uses — emergency fund first, then debt, employer match, then retirement.' },
  { term: 'Emergency fund', def: 'Cash saved to cover 3–6 months of expenses. The foundation everything else sits on.' },
  { term: 'Employer match', def: 'Free money your employer adds to your 401(k) when you contribute. Almost always Leap #1.' },
  { term: '4% shift rule', def: "WeLeap never moves more than 4% of your income between categories at once. Small changes you can sustain beat big ones you abandon." },
  { term: 'Plaid', def: 'The secure service that connects WeLeap to your bank. WeLeap never stores your login credentials.' },
  { term: 'HSA', def: 'Health Savings Account. Triple tax advantage — pre-tax in, tax-free growth, tax-free medical withdrawals.' },
  { term: 'Roth IRA', def: 'Pay tax now, withdraw everything tax-free in retirement. Usually right when your current rate is lower than your future rate.' },
  { term: 'Monthly Pulse', def: 'A monthly snapshot of how your actual spending compared to your plan. Surfaces rebalance Leaps when things drift.' },
  { term: 'Win', def: 'A milestone WeLeap celebrates in your Feed — first month capturing full 401(k) match, net worth crossing $10k, etc.' },
  { term: 'Net worth', def: 'Everything you own minus everything you owe. WeLeap tracks this and shows a 40-year projection.' },
]

// ── Page ────────────────────────────────────────────────────────────────────

export default function EarlyAccessPage() {
  useEffect(() => {
    track('early_access_guide_page_viewed', {}, true)
  }, [])

  return (
    <PageShell>

      {/* Hero */}
      <Section variant="brand" isHero className="text-center">
        <Container maxWidth="narrow">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3">
            Early Adopter Guide
          </p>
          <h1 className={cn(TYPOGRAPHY.h1, 'text-white mb-4')}>
            Your money, finally working for you.
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-white/75 mb-8 max-w-xl mx-auto')}>
            Everything you need to get the most out of WeLeap — and help us make it better.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://dev.weleap.app"
              onClick={() => track('early_access_open_app_clicked', { source: 'hero' })}
              className="inline-block bg-white text-[#386641] font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
            >
              Open the app →
            </a>
            <Link
              href="#getting-started"
              className="inline-block bg-white/10 border border-white/25 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
            >
              Read the guide
            </Link>
          </div>
        </Container>
      </Section>

      {/* Early adopter banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <span className="text-xl flex-shrink-0">👋</span>
          <p className="text-sm text-amber-900">
            <strong>You're one of our first users.</strong> The product is growing around you — some features are still in development. The core financial engine behind your Leaps and Ribbit's advice is grounded in real planning principles. If something feels off, confusing, or missing,{' '}
            <Link href="#feedback" className="underline font-semibold">tell us</Link>.
            You're helping shape something that will eventually help millions of people.
          </p>
        </div>
      </div>

      {/* Nav pills */}
      <div className="bg-[#386641] sticky top-16 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {[
            ['#what-is-weleap', 'What is WeLeap'],
            ['#getting-started', 'Setup'],
            ['#plaid', 'Bank Connect'],
            ['#leaps', 'Leaps'],
            ['#ribbit', 'Ribbit'],
            ['#framework', 'How It Works'],
            ['#glossary', 'Glossary'],
            ['/early-access/videos', '🎬 Videos'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => track('early_access_nav_clicked', { section: label })}
              className="py-3.5 px-4 text-base font-semibold text-white/70 hover:text-white whitespace-nowrap border-b-2 border-transparent hover:border-white/60 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* What is WeLeap */}
      <Section id="what-is-weleap">
        <Container maxWidth="narrow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">The Basics</p>
          </div>
          <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-4')}>WeLeap isn't a budgeting app.</h2>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8 max-w-2xl')}>
            Most financial tools show you where your money went. WeLeap tells you what to do next — with your exact numbers, not generic advice.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mb-8">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🏦 What other apps do</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {['Track past spending', 'Show charts and categories', 'Tell you to "save more"', 'Generic advice for everyone'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-gray-400">✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[#386641]/20 bg-green-50 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🚀 What WeLeap does</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {['Tells you your next best money move', 'Uses your real bank transactions', 'Gives specific dollar amounts', 'Explains the reasoning, in plain English'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-[#386641] font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-[#386641] bg-green-50 rounded-r-xl px-5 py-4 text-sm text-gray-700 italic">
            <strong className="not-italic text-gray-900">The core idea: </strong>
            WeLeap looks at your income, spending, debts, and goals — and gives you a ranked list of specific financial moves called{' '}
            <strong>Leaps</strong>. Your AI advisor, <strong>Ribbit</strong>, explains everything in plain language using your real numbers.
          </div>
        </Container>
      </Section>

      {/* Setup steps */}
      <Section variant="muted" id="getting-started">
        <Container maxWidth="narrow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">Setup</p>
          </div>
          <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-4')}>Your first 15 minutes.</h2>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8')}>
            Here's exactly what happens when you get started at{' '}
            <a href="https://dev.weleap.app" className="text-[#386641] font-semibold hover:underline">dev.weleap.app</a>.
          </p>

          <div className="space-y-0 mb-8">
            {steps.map((step, i) => (
              <div key={step.num} className={cn('flex gap-5 py-5', i < steps.length - 1 && 'border-b border-gray-200')}>
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#386641] text-white flex items-center justify-center font-mono text-sm font-medium mt-0.5">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                  {step.time && (
                    <span className="inline-block mt-2 text-xs font-semibold text-[#386641] bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                      {step.time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Known issues callout */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
            <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              ⚠️ Early access heads-up
            </h4>
            <ul className="space-y-2 text-sm text-amber-900">
              <li className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">→</span>If your bank isn't available in Plaid, you can still use WeLeap — enter your details manually during setup.</li>
              <li className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">→</span>Some transactions may be miscategorised. Ribbit will still give accurate advice based on your overall plan.</li>
              <li className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">→</span>If you see a number that looks wrong, use the Ribbit button on that screen to flag it.</li>
            </ul>
          </div>
        </Container>
      </Section>

      {/* Plaid callout */}
      <Section id="plaid" variant="brand" className="bg-gradient-to-br from-[#1f3d24] to-[#386641]">
        <Container maxWidth="narrow">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-0.5 bg-white/40 rounded-full" />
                <p className="text-sm font-bold tracking-widest uppercase text-white/60">Bank Connection</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                Connect your bank.<br />Watch your money make sense.
              </h2>
              <p className="text-white/75 text-base leading-relaxed mb-6">
                Once you link through Plaid, WeLeap stops guessing and starts knowing. It sees exactly where your money is going — subscriptions you forgot about, spending patterns, the real gaps. Ribbit uses that live data to surface Leaps built around your actual life, not estimates.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                  <span className="text-lg mt-0.5">🔍</span>
                  <div>
                    <p className="text-white font-semibold text-sm">See the full picture</p>
                    <p className="text-white/60 text-xs mt-0.5">Real transactions, real patterns — not what you think you spend.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                  <span className="text-lg mt-0.5">⚡</span>
                  <div>
                    <p className="text-white font-semibold text-sm">Live Leaps from Ribbit</p>
                    <p className="text-white/60 text-xs mt-0.5">Your advisor reacts to what's actually happening in your accounts.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-6 space-y-3">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">What Ribbit sees after you connect</p>
              {[
                { icon: '🏠', label: 'Rent hitting $2,100/mo — 43% of take-home' },
                { icon: '☕', label: '$340 on dining last month — up 22%' },
                { icon: '📱', label: '7 active subscriptions totalling $94/mo' },
                { icon: '💳', label: 'Visa balance unchanged for 3 months' },
                { icon: '📉', label: 'Savings rate at 11% — 9% below target' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                  <span>{icon}</span>
                  <p className="text-white/80 text-sm">{label}</p>
                </div>
              ))}
              <p className="text-white/35 text-xs pt-1 text-center italic">These are examples — Ribbit will show you your actual numbers.</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Leaps */}
      <Section id="leaps">
        <Container maxWidth="narrow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">The Core Feature</p>
          </div>
          <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-4')}>Your Leaps.</h2>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8 max-w-2xl')}>
            A Leap is a specific financial move, built for your exact situation, ranked by how much it'll improve your position. Your Feed shows you the highest-impact moves first.
          </p>

          <div className="space-y-4 mb-8">
            {leaps.map((leap) => (
              <div key={leap.title} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0', leap.bg)}>
                  {leap.emoji}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-0.5">{leap.title}</h4>
                  <p className="text-sm font-medium text-[#386641] mb-1.5">{leap.hook}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{leap.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-l-4 border-[#386641] bg-green-50 rounded-r-xl px-5 py-4 text-sm text-gray-700 italic">
            Every Leap includes a clear explanation, the specific dollar amount, and a direct action you can take right now.{' '}
            <strong className="not-italic">No vague advice. No homework. Just: here's what to do, here's why, here's how much.</strong>
          </div>
        </Container>
      </Section>

      {/* Ribbit */}
      <Section variant="muted" id="ribbit">
        <Container maxWidth="narrow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">Your AI Advisor</p>
          </div>
          <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-4')}>Meet Ribbit.</h2>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8 max-w-2xl')}>
            Ribbit is available on every screen. It knows your complete financial picture and explains everything in plain language — your numbers, not textbook examples.
          </p>

          <div className="rounded-2xl bg-[#386641] p-8 md:p-10 mb-4">
            <h3 className="font-bold text-white text-xl mb-2">Ask Ribbit anything.</h3>
            <p className="text-white/65 italic text-sm mb-7">
              "Think of Ribbit as a financially sharp friend who happens to know everything about your money — and never makes you feel bad about it."
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ribbitQs.map(({ q, a }) => (
                <div key={q} className="rounded-xl bg-white/10 border border-white/15 p-4">
                  <p className="text-white font-medium text-sm mb-1">{q}</p>
                  <p className="text-white/55 text-xs leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Ribbit is available as a persistent button on every screen — tap it mid-Leap, mid-review, anytime.
          </p>
        </Container>
      </Section>

      {/* Framework */}
      <Section id="framework">
        <Container maxWidth="narrow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">The Framework</p>
          </div>
          <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-4')}>How WeLeap organises your money.</h2>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-10 max-w-2xl')}>
            Two simple frameworks cover every dollar you earn. WeLeap applies them automatically.
          </p>

          {/* 50/30/20 */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">The 50/30/20 split</h3>
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="text-left px-4 py-3">Bucket</th>
                  <th className="text-left px-4 py-3">Target</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">What goes here</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: 'Needs', pct: '50%', desc: 'Rent, utilities, groceries, insurance, minimum debt payments' },
                  { label: 'Wants', pct: '30%', desc: 'Dining out, subscriptions, entertainment, travel' },
                  { label: 'Savings', pct: '20%', desc: 'Emergency fund, retirement, debt paydown, investments' },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{row.label}</td>
                    <td className="px-4 py-3 text-gray-600">{row.pct}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Savings stack */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">The savings priority stack</h3>
          <p className="text-sm text-gray-600 mb-4">Once your savings dollar is set aside, WeLeap figures out where it goes. The order matters enormously.</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Where</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Why this order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {savingsStack.map(row => (
                  <tr key={row.priority}>
                    <td className="px-4 py-3 whitespace-nowrap w-44">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#386641] text-white text-xs font-bold mr-2 flex-shrink-0">{row.priority}</span>
                      <span className="font-semibold text-gray-900">{row.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.where}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-l-4 border-[#386641] bg-green-50 rounded-r-xl px-5 py-4 text-sm text-gray-700 italic">
            <strong className="not-italic text-gray-900">You don't have to figure this out.</strong>{' '}
            WeLeap applies this stack automatically. Your Leaps are the output — the framework is running in the background.
          </div>
        </Container>
      </Section>

      {/* Glossary */}
      <Section variant="muted" id="glossary">
        <Container maxWidth="narrow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">Reference</p>
          </div>
          <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-4')}>Words you'll see in WeLeap.</h2>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8')}>Plain English definitions for every WeLeap term.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {glossary.map(({ term, def }) => (
              <div key={term} className="rounded-xl bg-white border border-gray-200 p-5">
                <p className="font-mono text-sm font-medium text-[#386641] mb-1.5">{term}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{def}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Feedback */}
      <Section id="feedback">
        <Container maxWidth="narrow">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-amber-50 p-8 md:p-12 text-center">
            <h2 className={cn(TYPOGRAPHY.h2, 'text-gray-900 mb-3')}>Your feedback shapes this product.</h2>
            <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8 max-w-lg mx-auto')}>
              If something is confusing, wrong, or missing — we want to hear it. Every piece of feedback directly influences what we build next.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <a
                href="mailto:feedback@weleap.ai?subject=WeLeap Early Access Feedback"
                onClick={() => track('early_access_email_feedback_clicked')}
                className="inline-block bg-[#386641] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#2d5235] transition-colors"
              >
                📧 Email us directly
              </a>
              <Link
                href="/early-access/videos"
                onClick={() => track('early_access_videos_link_clicked', { source: 'feedback' })}
                className="inline-block bg-white border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg hover:border-[#386641] hover:text-[#386641] transition-colors"
              >
                🎬 Watch video guides
              </Link>
              <a
                href="https://dev.weleap.app"
                onClick={() => track('early_access_open_app_clicked', { source: 'feedback' })}
                className="inline-block bg-white border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg hover:border-[#386641] hover:text-[#386641] transition-colors"
              >
                ↗ Open the app
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Or tap the <strong>Ribbit</strong> button inside the app and type <strong>"feedback:"</strong> followed by your note — we read every one.
            </p>
          </div>
        </Container>
      </Section>

    </PageShell>
  )
}
