'use client';

/**
 * The end-of-tool call to action, shared by every free tool.
 *
 * Two targets, one action: a primary button and the whole "what's waiting in
 * the app" tile. The tile already shows what you get, so clicking it to get it
 * is the natural gesture, and it's a far bigger target than the button alone.
 * It's a real <button> so it stays keyboard-reachable.
 *
 * Every target fires `tool_cta_clicked` with a `tool` and a `placement`. That
 * happens in here rather than at each call site because the tools that were
 * still on the old waitlist dialog fired no funnel event at all — centralising
 * it means a tool can't be added to the site and silently stay out of the
 * funnel.
 *
 * Navigation defaults to `appLink()`, which carries first-touch UTMs and the
 * PostHog distinct_id across to weleap.app so the same human isn't counted
 * twice. Tools with their own destination (the Leap simulator's allocator
 * prefill) pass `buildHref` instead. Either way the href is built at click
 * time, so attribution and prefill are current rather than render-stale.
 */

import { Button } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { appLink } from '@/lib/app-link';

/** Where the click came from — lets us see which target does the work. */
export type CtaPlacement = 'button' | 'preview_tile';

export interface AppCtaProps {
  /** Analytics slug for this tool, e.g. 'credit_card_payoff'. */
  tool: string;
  /** Prefill params carried into the app. Empty/undefined values are dropped. */
  prefill?: Record<string, string | number | undefined | null>;
  /** Overrides the default appLink() destination. Called at click time. */
  buildHref?: () => string;
  /**
   * Takes over navigation entirely. For tools whose CTA does more than build a
   * URL — the Leap simulator validates input and can refuse to continue. The
   * funnel event still fires here first, so the tool can't opt out of it.
   */
  onActivate?: (placement: CtaPlacement) => void;
  /** Small eyebrow above the headline. */
  eyebrow?: string;
  headline: string;
  /** One line on why the next step follows from what they just saw. */
  body?: string;
  buttonLabel?: string;
  /** What's actually waiting on the other side — concrete, not features. */
  bullets: string[];
  image?: { src: string; alt: string; width: number; height: number };
  footnote?: string;
}

export function AppCta({
  tool,
  prefill,
  buildHref,
  onActivate,
  eyebrow,
  headline,
  body,
  buttonLabel = 'Get my first Leap →',
  bullets,
  image,
  footnote = 'Free · 2 minutes · No credit card.',
}: AppCtaProps) {
  const go = (placement: CtaPlacement) => {
    track('tool_cta_clicked', { tool, placement });
    if (onActivate) {
      onActivate(placement);
      return;
    }
    if (buildHref) {
      window.location.href = buildHref();
      return;
    }
    const extra: Record<string, string> = {};
    Object.entries(prefill ?? {}).forEach(([key, value]) => {
      if (value != null && value !== '') extra[key] = String(value);
    });
    window.location.href = appLink('', extra);
  };

  return (
    <div className="rounded-2xl border-2 border-[#3F6B42] bg-white p-6 md:p-8">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">
          {eyebrow}
        </p>
      )}
      <h3 className="text-xl font-bold text-[#111827]">{headline}</h3>
      {body && <p className="mt-2 text-base text-gray-600">{body}</p>}

      <Button
        onClick={() => go('button')}
        className="mt-5 w-full rounded-xl bg-[#386641] py-4 text-base font-bold text-white transition-all hover:bg-[#2d5a26]"
      >
        {buttonLabel}
      </Button>
      {footnote && <p className="mt-2 text-center text-xs text-gray-500">{footnote}</p>}

      <button
        type="button"
        onClick={() => go('preview_tile')}
        aria-label="Create your free account and get your first Leap"
        className="group mt-5 block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:-translate-y-[2px] hover:border-[#386641] hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#386641]"
      >
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          What&apos;s waiting in the app
        </p>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            className="mb-3 block h-auto w-full rounded-lg border border-gray-200"
          />
        )}
        <div className="space-y-1.5">
          {bullets.map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="mt-[3px] shrink-0 text-[#386641]">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs font-bold text-[#386641] group-hover:underline">
          Get all of this free →
        </p>
      </button>
    </div>
  );
}
