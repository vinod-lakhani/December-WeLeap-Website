'use client'

import { useState } from 'react'
import { PageShell, Section, Container } from '@/components/layout'
import { TYPOGRAPHY } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────

type Category = 'all' | 'start' | 'feature' | 'tips'

interface Video {
  id: string
  title: string
  desc: string
  category: Exclude<Category, 'all'>
  emoji: string
  duration?: string        // e.g. "4:32"
  url?: string             // embed URL — leave undefined for coming soon
  featured?: boolean
}

// ── Video data ───────────────────────────────────────────────────────────────
// To add a video:
//   1. Add an entry here with url: 'YOUR_EMBED_URL'
//   2. YouTube:  https://www.youtube.com/embed/VIDEO_ID
//      Loom:     https://www.loom.com/embed/VIDEO_ID
//      Vimeo:    https://player.vimeo.com/video/VIDEO_ID

const VIDEOS: Video[] = [
  {
    id: 'first-5-minutes',
    title: 'Your first 5 minutes with WeLeap',
    desc: "A walkthrough of what you'll see when you open the app for the first time — what to expect, what to enter, and what your Feed will show you.",
    category: 'start',
    emoji: '🚀',
    duration: undefined,
    url: undefined,        // ← paste embed URL here when ready
    featured: true,
  },
  {
    id: 'understanding-feed',
    title: 'Understanding your Feed',
    desc: 'What each card in your Feed means and how WeLeap decides what to show you first.',
    category: 'feature',
    emoji: '📊',
    url: undefined,
  },
  {
    id: 'using-ribbit',
    title: 'How to use Ribbit',
    desc: 'The right questions to ask your AI advisor — and how to get the most useful answers.',
    category: 'feature',
    emoji: '🐸',
    url: undefined,
  },
  {
    id: 'connecting-bank',
    title: 'Connecting your bank',
    desc: 'How Plaid works, what WeLeap can see, and why your real transactions make the plan better.',
    category: 'feature',
    emoji: '🏦',
    url: undefined,
  },
  {
    id: 'savings-stack',
    title: 'Your savings priority stack',
    desc: 'Why the order matters: emergency fund → debt → employer match → IRA → brokerage.',
    category: 'feature',
    emoji: '💰',
    url: undefined,
  },
  {
    id: '40-year-projection',
    title: 'Reading your 40-year projection',
    desc: 'What the chart is actually showing you — and how to use it to make real decisions today.',
    category: 'tips',
    emoji: '📈',
    url: undefined,
  },
  {
    id: 'update-plan',
    title: 'When to update your plan',
    desc: "Got a raise? Changed jobs? Here's exactly what to do in WeLeap when your situation changes.",
    category: 'tips',
    emoji: '🔄',
    url: undefined,
  },
]

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All videos',
  start: 'Getting started',
  feature: 'Features',
  tips: 'Tips & tricks',
}

const SUGGEST_CHIPS = [
  'How the 401(k) match works',
  'Roth vs Traditional IRA',
  'What to do with a raise',
  'Setting up an emergency fund',
  'Understanding my Leaps',
  'Paying off debt vs investing',
]

// ── Sub-components ───────────────────────────────────────────────────────────

function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#386641] rounded-2xl overflow-hidden w-full max-w-3xl">
        <div className="relative aspect-video bg-black">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Close video"
          >
            ✕
          </button>
          {video.url ? (
            <iframe
              src={video.url}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black to-[#386641]">
              <span className="text-5xl">{video.emoji}</span>
              <p className="text-white/60 text-sm">This video is being recorded — check back soon.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4">
          <h3 className="text-white font-semibold text-base">{video.title}</h3>
          <p className="text-white/55 text-sm mt-1">{video.desc}</p>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  const isLive = Boolean(video.url)

  if (!isLive) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden opacity-65">
        <div className="aspect-video bg-gray-50 border-b border-gray-100 flex flex-col items-center justify-center gap-3">
          <span className="text-3xl opacity-40">{video.emoji}</span>
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
            Coming soon
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-400 text-sm mb-1">{video.title}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">{video.desc}</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden text-left hover:shadow-lg hover:-translate-y-0.5 transition-all w-full"
    >
      <div className="relative aspect-video bg-[#386641]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#386641] to-[#2d5235]">
          <span className="text-4xl opacity-50">{video.emoji}</span>
        </div>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/95 shadow-xl flex items-center justify-center">
            <svg className="w-6 h-6 fill-[#386641] ml-1" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-xs font-mono px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
        <span className={cn(
          'absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full',
          video.category === 'start' && 'bg-amber-400 text-amber-900',
          video.category === 'feature' && 'bg-white/20 text-white border border-white/30',
          video.category === 'tips' && 'bg-[#386641]/80 text-white',
        )}>
          {CATEGORY_LABELS[video.category]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{video.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{video.desc}</p>
      </div>
    </button>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [selectedChips, setSelectedChips] = useState<string[]>([])
  const [customSuggestion, setCustomSuggestion] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const featured = VIDEOS.find(v => v.featured)
  const gridVideos = VIDEOS.filter(v => !v.featured)

  const filteredGrid = activeCategory === 'all'
    ? gridVideos
    : gridVideos.filter(v => v.category === activeCategory)

  const showFeatured = featured && (activeCategory === 'all' || activeCategory === featured.category)

  function toggleChip(chip: string) {
    setSelectedChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    )
  }

  function handleSuggest() {
    const combined = [...selectedChips, customSuggestion.trim()].filter(Boolean).join(' | ')
    if (!combined) return
    const subject = encodeURIComponent('WeLeap Video Suggestion')
    const body = encodeURIComponent(`Video topic suggestion:\n\n${combined}`)
    window.location.href = `mailto:feedback@weleap.ai?subject=${subject}&body=${body}`
    setSubmitted(true)
    setSelectedChips([])
    setCustomSuggestion('')
  }

  return (
    <PageShell>
      {/* Hero */}
      <Section variant="brand" isHero className="text-center">
        <Container maxWidth="narrow">
          <p className="text-sm font-bold tracking-widest uppercase text-white/60 mb-3">
            Video Guides
          </p>
          <h1 className={cn(TYPOGRAPHY.h1, 'text-white mb-4')}>
            See WeLeap in action.
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-white/70 max-w-md mx-auto')}>
            Short, user-focused videos that show you exactly what's happening inside WeLeap — and why it matters for your money.
          </p>
        </Container>
      </Section>

      {/* Filter bar */}
      <div className="bg-[#386641] sticky top-16 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-6 flex gap-1 overflow-x-auto">
          <Link
            href="/early-access"
            className="py-3.5 px-4 text-sm font-semibold text-white/60 hover:text-white whitespace-nowrap border-b-2 border-transparent transition-colors mr-2"
          >
            ← Guide
          </Link>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'py-3.5 px-4 text-base font-semibold whitespace-nowrap border-b-2 transition-colors',
                activeCategory === cat
                  ? 'text-white border-white'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/40'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <Section>
        <Container maxWidth="narrow">

          {/* Featured */}
          {showFeatured && featured && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
                <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">Start here</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden grid md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto bg-[#386641]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#386641] to-[#1f3d24]">
                    <span className="text-6xl opacity-30">{featured.emoji}</span>
                  </div>
                  {featured.url ? (
                    <button
                      onClick={() => setActiveVideo(featured)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center">
                        <svg className="w-7 h-7 fill-[#386641] ml-1" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center">
                        <svg className="w-7 h-7 fill-white/60 ml-1" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="text-xs text-white/40 tracking-widest uppercase font-medium">Coming soon</span>
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#386641] mb-2">★ Watch first</p>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{featured.title}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">{featured.desc}</p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                      🎬 Getting started
                    </span>
                    {featured.duration && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                        ⏱ {featured.duration}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
              <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">
                {activeCategory === 'all' ? 'All videos' : CATEGORY_LABELS[activeCategory]}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredGrid.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => setActiveVideo(video)}
                />
              ))}
            </div>
          </div>

          {/* Suggest a video */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-amber-50 p-8 text-center">
            <h3 className={cn(TYPOGRAPHY.h3, 'text-gray-900 mb-2')}>What do you want to see?</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Tell us what would have been helpful to watch when you got started. Your suggestions go directly to us.
            </p>

            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {SUGGEST_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    selectedChips.includes(chip)
                      ? 'bg-[#386641] text-white border-[#386641]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#386641] hover:text-[#386641]'
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={customSuggestion}
                onChange={e => setCustomSuggestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSuggest()}
                placeholder="Something else? Type it here…"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#386641] bg-white"
              />
              <button
                onClick={handleSuggest}
                className="px-5 py-2.5 bg-[#386641] text-white text-sm font-semibold rounded-lg hover:bg-[#2d5235] transition-colors whitespace-nowrap"
              >
                Send →
              </button>
            </div>

            {submitted && (
              <p className="mt-3 text-sm text-[#386641] font-medium">
                ✓ Got it — thank you! We'll prioritise this.
              </p>
            )}
          </div>

        </Container>
      </Section>

      {/* Modal */}
      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

    </PageShell>
  )
}
