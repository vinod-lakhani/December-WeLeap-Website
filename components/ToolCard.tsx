'use client'

/**
 * One free-tool card. Rendered by /tools.
 *
 * Exists as its own client component for two reasons. /tools is a server
 * component that exports `metadata`, so it can't carry an onClick itself —
 * and the markup was duplicated across both surfaces, which is how the two
 * had already drifted apart on background and heading level.
 *
 * Every card fires `tool_card_clicked` with the tool's slug and the surface it
 * was clicked from. Before this, nothing was tracked here at all: we couldn't
 * see which of the six cards pulled, and had no baseline to judge a copy change
 * against. `slug` matches the `tool` value the tool's own AppCta sends, so
 * card click -> tool CTA -> app is one joinable funnel.
 */

import Image from 'next/image'
import Link from 'next/link'
import { track } from '@/lib/analytics'
import type { FreeTool } from '@/lib/tools'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  tool: FreeTool
  /** Which page the card was clicked from — the second half of the funnel key. */
  surface: 'homepage' | 'tools_page'
  /** Cards sit on white on /tools and on the cream canvas on the homepage. */
  background?: 'white' | 'canvas'
  /**
   * The tool name is an h2 on /tools (the hero owns the h1) and an h3 on the
   * homepage (the section head owns the h2). Kept as a prop so the shared
   * markup doesn't flatten the heading outline on either page.
   */
  headingLevel?: 'h2' | 'h3'
}

export function ToolCard({
  tool,
  surface,
  background = 'white',
  headingLevel = 'h2',
}: ToolCardProps) {
  const Heading = headingLevel

  return (
    <Link
      href={tool.href}
      onClick={() => track('tool_card_clicked', { tool: tool.slug, surface })}
      className={cn(
        'group flex h-full flex-col rounded-card border border-hairline p-5 shadow-card transition hover:-translate-y-[3px] hover:border-lime hover:shadow-lift sm:p-7',
        background === 'canvas' ? 'bg-canvas' : 'bg-white'
      )}
    >
      {/* Icon above the title from `sm` up, beside it below.
          One column of nine cards was 8.2 screens on a 375px phone, with only
          two cards visible at a time and the last one 3.8 screens down — and
          124px of each 297px card was a decorative icon, its margin and the
          padding, not text. Pulling the icon onto the title's line and easing
          the padding takes roughly 80px off every card without dropping a word
          of the blurb. The stacked layout above `sm` is unchanged: the 3x3 grid
          has the room, and the taller card is the better-looking one. */}
      <div className="mb-2 flex items-center gap-3 sm:mb-0 sm:block">
        <Image
          src={tool.icon}
          alt=""
          width={48}
          height={48}
          className="h-9 w-9 shrink-0 object-contain sm:mb-5 sm:h-12 sm:w-12"
        />
        <Heading className="text-[18.5px] font-extrabold tracking-[-0.018em] text-ink sm:mb-2">
          {tool.name}
        </Heading>
      </div>
      <p className="mb-2 text-[15.5px] font-semibold leading-snug text-brand-700 sm:mb-3">
        &ldquo;{tool.question}&rdquo;
      </p>
      <p className="mb-4 flex-1 text-[14.5px] leading-relaxed text-subtle sm:mb-5">{tool.blurb}</p>
      <span className="text-[13.5px] font-bold text-brand-700 group-hover:underline">
        {tool.cta}
      </span>
    </Link>
  )
}
