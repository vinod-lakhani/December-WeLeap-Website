'use client';

/**
 * The 30-second product tour, as a silent looping clip.
 *
 * The video carries its own captions and has no audio track (stripped at
 * encode, 720x1280, ~1 MB), so muted autoplay loses nothing. It is still set
 * muted in the DOM, not just in JSX: React does not reflect `muted` as an
 * attribute, and iOS refuses to autoplay a video whose muted attribute is not
 * present when it tries.
 *
 * Nothing loads until it is needed. `preload="none"` with a poster means a
 * visitor who never reaches it costs one ~70 KB image, not a megabyte — on
 * /get that is most of the in-app-browser traffic, which taps the store
 * button above it.
 *
 * It plays once a quarter of it is on screen, not half. On a phone in an
 * Instagram or Facebook browser the top ~140 px of the clip sits above the
 * 560 px fold under the store button; a half-visible rule would leave it a
 * still image for exactly the visitors it was placed there for. It pauses when
 * it scrolls away, so it is not decoding in the background.
 *
 * Reduced motion: no autoplay. The poster shows with native controls, and the
 * visitor decides.
 *
 * Events: `product_video_viewed` the first time it is on screen,
 * `product_video_started` on the first play, and `product_video_progress` at
 * 25/50/75/100% of the first run through — enough to tell whether the clip is
 * watched before anyone reads the tap rate against it.
 */

import { useEffect, useRef, useState } from 'react';

import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export const PRODUCT_TOUR_SRC = '/videos/weleap-product-tour.mp4';
export const PRODUCT_TOUR_POSTER = '/videos/weleap-product-tour-poster.jpg';

/**
 * The 9-second paycheck loop: the opening of the App Store preview video, where
 * the paycheck lands and splits into needs, wants and savings. Used on /get
 * phones since 3 Nov 2026. Of Meta visitors who didn't tap, 39 of 54 had
 * the 30-second tour start and 9 watched past a quarter of it, so the
 * tour's payoff arrived after almost everyone had decided. This clip opens on
 * the payoff.
 */
export const PAYCHECK_LOOP_SRC = '/videos/weleap-paycheck-loop.mp4';
export const PAYCHECK_LOOP_POSTER = '/videos/weleap-paycheck-loop-poster.jpg';

const CLIPS = {
  tour: {
    src: PRODUCT_TOUR_SRC,
    poster: PRODUCT_TOUR_POSTER,
    width: 720,
    height: 1280,
    aspect: 'aspect-[9/16]',
    label: 'WeLeap product tour: your numbers, your paycheck split, and one money move ready to approve',
  },
  paycheck: {
    src: PAYCHECK_LOOP_SRC,
    poster: PAYCHECK_LOOP_POSTER,
    width: 520,
    height: 1126,
    aspect: 'aspect-[520/1126]',
    label: 'WeLeap splitting a paycheck into payroll savings, needs, wants and cash savings',
  },
} as const;

export type ProductClip = keyof typeof CLIPS;

const PLAY_THRESHOLD = 0.25;
const MILESTONES = [25, 50, 75, 100] as const;

export function ProductTourVideo({
  placement,
  className,
  clip = 'tour',
}: {
  /** Where it sits, sent with every event — e.g. `get_phone`, `get_desktop`. */
  placement: string;
  className?: string;
  /** Which clip: the 30-second tour, or the 9-second paycheck loop. */
  clip?: ProductClip;
}) {
  const media = CLIPS[clip];
  const ref = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const viewed = useRef(false);
  const started = useRef(false);
  const reached = useRef(new Set<number>());

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setReducedMotion(reduce);

    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!viewed.current) {
            viewed.current = true;
            track('product_video_viewed', { placement, clip });
          }
          if (!reduce) {
            // A blocked play() rejects; the poster stays, which is the right fallback.
            video.play().catch(() => {});
          }
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: PLAY_THRESHOLD },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [placement, clip]);

  const onPlay = () => {
    if (started.current) return;
    started.current = true;
    track('product_video_started', { placement, clip, autoplay: !reducedMotion });
  };

  /**
   * First pass only. A looping video never fires `ended`, and on the next pass
   * currentTime starts again from zero, so 100% is the moment playback wraps:
   * the last reading was near the end and this one is near the start.
   */
  const lastTime = useRef(0);
  const onTimeUpdate = () => {
    const video = ref.current;
    if (!video || !video.duration) return;
    const now = video.currentTime;
    if (!reached.current.has(100) && lastTime.current > video.duration * 0.9 && now < lastTime.current) {
      reached.current.add(100);
      track('product_video_progress', { placement, clip, pct: 100 });
    }
    lastTime.current = now;
    const pct = (now / video.duration) * 100;
    for (const m of MILESTONES) {
      if (m < 100 && pct >= m && !reached.current.has(m)) {
        reached.current.add(m);
        track('product_video_progress', { placement, clip, pct: m });
      }
    }
  };

  return (
    <video
      ref={ref}
      src={media.src}
      poster={media.poster}
      muted
      loop
      playsInline
      preload="none"
      controls={reducedMotion}
      onPlay={onPlay}
      onTimeUpdate={onTimeUpdate}
      aria-label={media.label}
      width={media.width}
      height={media.height}
      className={cn('block bg-[#0f2a1e] object-cover', media.aspect, className)}
    />
  );
}
