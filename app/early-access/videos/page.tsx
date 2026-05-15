'use client'

import { useState, useEffect } from 'react'
import { PageShell, Section, Container } from '@/components/layout'
import { TYPOGRAPHY } from '@/lib/layout-constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { track } from '@/lib/analytics'

// ── Types ────────────────────────────────────────────────────────────────────

type Category = 'all' | 'start' | 'feature' | 'tips'

interface Video {
  id: string
  title: string
  desc: string
  category: Exclude<Category, 'all'>
  emoji: string
  duration?: string
  url?: string        // direct .mp4 URL or embed URL — undefined = coming soon
  seriesNum?: number  // if part of the Watch First series
}

// ── Video data ───────────────────────────────────────────────────────────────
// To add a video: set url to the Vercel Blob .mp4 URL or a YouTube/Loom embed URL
// Blob:     https://so1q55lslwryyqwt.public.blob.vercel-storage.com/videos/YOUR_FILE.mp4
// YouTube:  https://www.youtube.com/embed/VIDEO_ID
// Loom:     https://www.loom.com/embed/VIDEO_ID

const SERIES: Video[] = [
  {
    id: 'onboarding',
    seriesNum: 1,
    title: 'What does onboarding look like?',
    desc: 'A walkthrough of your first experience in WeLeap — what to expect, what to enter, and what happens at the end.',
    category: 'start',
    emoji: '🚀',
    url: 'https://so1q55lslwryyqwt.public.blob.vercel-storage.com/videos/onboarding.mp4',
  },
  {
    id: 'set-my-plan',
    seriesNum: 2,
    title: 'How to set my plan',
    desc: 'How WeLeap builds your 50/30/20 split, allocates your savings, and shows you your net worth over time.',
    category: 'start',
    emoji: '📋',
    url: 'https://so1q55lslwryyqwt.public.blob.vercel-storage.com/videos/set-my-plan.mp4',
  },
  {
    id: 'navigate-app',
    seriesNum: 3,
    title: 'How to navigate the application',
    desc: 'A tour of the app — your Feed, Ribbit, Leaps, and how to find what you need.',
    category: 'start',
    emoji: '🗺️',
    url: 'https://so1q55lslwryyqwt.public.blob.vercel-storage.com/videos/navigate-app.mp4',
  },
]

const VIDEOS: Video[] = [
  {
    id: 'understanding-feed',
    title: 'Understanding your Feed',
    desc: 'What each card in your Feed means and how WeLeap decides what to show you first.',
    category: 'feature',
    emoji: '📊',
  },
  {
    id: 'using-ribbit',
    title: 'How to use Ribbit',
    desc: 'The right questions to ask your AI advisor — and how to get the most useful answers.',
    category: 'feature',
    emoji: '🐸',
  },
  {
    id: 'connecting-bank',
    title: 'Connecting your bank',
    desc: 'How Plaid works, what WeLeap can see, and why your real transactions make the plan better.',
    category: 'feature',
    emoji: '🏦',
  },
  {
    id: 'savings-stack',
    title: 'Your savings priority stack',
    desc: 'Why the order matters: emergency fund → debt → employer match → IRA → brokerage.',
    category: 'feature',
    emoji: '💰',
  },
  {
    id: '40-year-projection',
    title: 'Reading your 40-year projection',
    desc: 'What the chart is actually showing you — and how to use it to make real decisions today.',
    category: 'tips',
    emoji: '📈',
  },
  {
    id: 'update-plan',
    title: 'When to update your plan',
    desc: "Got a raise? Changed jobs? Here's exactly what to do in WeLeap when your situation changes.",
    category: 'tips',
    emoji: '🔄',
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
  const isBlobMp4 = video.url?.includes('.mp4')

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1f3d24] rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl">
        <div className="relative aspect-video bg-black">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Close video"
          >
            ✕
          </button>
          {video.url ? (
            isBlobMp4 ? (
              <video
                src={video.url}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <iframe
                src={video.url}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black to-[#386641]">
              <span className="text-5xl">{video.emoji}</span>
              <p className="text-white/60 text-sm">This video is being recorded — check back soon.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 flex items-start gap-3">
          {video.seriesNum && (
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {video.seriesNum}
            </span>
          )}
          <div>
            <h3 className="text-white font-semibold text-base">{video.title}</h3>
            <p className="text-white/55 text-sm mt-1">{video.desc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SeriesCard({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-gray-200 bg-white overflow-hidden text-left hover:shadow-lg hover:-translate-y-0.5 transition-all w-full"
    >
      <div className="relative aspect-video bg-[#386641]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#386641] to-[#1f3d24] flex items-center justify-center">
          <span className="text-5xl opacity-20">{video.emoji}</span>
        </div>
        {/* Series number badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white text-[#386641] font-bold text-sm flex items-center justify-center shadow-md">
          {video.seriesNum}
        </div>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/95 shadow-xl flex items-center justify-center">
            <svg className="w-6 h-6 fill-[#386641] ml-1" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{video.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{video.desc}</p>
      </div>
    </button>
  )
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden opacity-60">
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [selectedChips, setSelectedChips] = useState<string[]>([])
  const [customSuggestion, setCustomSuggestion] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    track('early_access_videos_page_viewed', {}, true)
  }, [])

  const filteredVideos = activeCategory === 'all'
    ? VIDEOS
    : VIDEOS.filter(v => v.category === activeCategory)

  const showSeries = activeCategory === 'all' || activeCategory === 'start'

  function toggleChip(chip: string) {
    const isRemoving = selectedChips.includes(chip)
    track('early_access_video_suggestion_chip_toggled', { chip, selected: !isRemoving })
    setSelectedChips(prev =>
      isRemoving ? prev.filter(c => c !== chip) : [...prev, chip]
    )
  }

  function handleSuggest() {
    const combined = [...selectedChips, customSuggestion.trim()].filter(Boolean).join(' | ')
    if (!combined) return
    track('early_access_video_suggestion_submitted', {
      chips_count: selectedChips.length,
      has_custom: Boolean(customSuggestion.trim()),
    })
    const subject = encodeURIComponent('WeLeap Video Suggestion')
    const body = encodeURIComponent(`Video topic suggestion:\n\n${combined}`)
    window.location.href = `mailto:feedback@weleap.ai?subject=${subject}&body=${body}`
    setSubmitted(true)
    setSelectedChips([])
    setCustomSuggestion('')
  }

  function openVideo(video: Video) {
    setActiveVideo(video)
    track('early_access_video_opened', { video_id: video.id, video_title: video.title, is_live: Boolean(video.url) })
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
            Short videos that show you exactly what's happening inside WeLeap — and why it matters for your money.
          </p>
        </Container>
      </Section>

      {/* Filter bar */}
      <div className="bg-[#386641] sticky top-16 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-6 flex gap-1 overflow-x-auto">
          <Link
            href="/early-access"
            onClick={() => track('early_access_videos_back_to_guide_clicked')}
            className="py-3.5 px-4 text-sm font-semibold text-white/60 hover:text-white whitespace-nowrap border-b-2 border-transparent transition-colors mr-2"
          >
            ← Guide
          </Link>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); track('early_access_video_filter_changed', { category: cat }) }}
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

          {/* Watch first series */}
          {showSeries && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
                <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">Watch first</p>
              </div>
              <p className="text-sm text-gray-500 mb-6 ml-11">Watch these three in order to get up to speed quickly.</p>
              <div className="grid sm:grid-cols-3 gap-5">
                {SERIES.map(video => (
                  <SeriesCard key={video.id} video={video} onClick={() => openVideo(video)} />
                ))}
              </div>
            </div>
          )}

          {/* Coming soon grid */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#386641] rounded-full" />
              <p className="text-sm font-bold tracking-widest uppercase text-[#386641]">
                {activeCategory === 'all' ? 'More coming soon' : CATEGORY_LABELS[activeCategory]}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredVideos.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => openVideo(video)} />
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
