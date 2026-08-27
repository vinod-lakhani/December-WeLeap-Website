import { track } from '@/lib/analytics'

/**
 * Fires when a tool puts a Leap in front of someone.
 *
 * `tool_completed` says an answer rendered. This says what that answer
 * recommended and what it was worth — the two things needed to ask whether a
 * bigger number gets accepted more often than a smaller one, which
 * `tool_completed` alone cannot answer.
 *
 * Called beside each tool's `tool_completed` rather than from a hook with its
 * own condition. Every tool already decided what "the answer is on screen"
 * means for it — a settled slider, a summary step, a resolved tax lookup — and
 * restating those seven conditions somewhere else is how two events that should
 * always agree quietly stop agreeing.
 *
 * `engine: 'site'` is not decoration and must never be dropped. The app fires
 * an event with this exact name from its own recommendation engine
 * (client/webui/src/app/analytics.ts). Without the discriminator the two blend
 * into one series that reads as a single funnel and is really two products
 * measuring different things: a site Leap computed from a handful of typed
 * inputs, and an app Leap computed from linked accounts.
 */
export function trackLeapShown(input: {
  /** FREE_TOOLS slug, matching what tool_completed sends. */
  tool: string
  /** What this tool is recommending, e.g. 'rent_reduction', 'employer_match'. */
  leapType: string
  /**
   * The monthly dollar figure the Leap frees or directs.
   *
   * Omitted where a tool's answer is a decision rather than an amount — the
   * purchase check returns a verdict, and the money plan returns an ordering
   * whose first step is a contribution percentage. Sending a fabricated dollar
   * value for those would make the field unusable for the five where it is
   * real.
   */
  leapValueUsd?: number
}) {
  const { tool, leapType, leapValueUsd } = input
  track('leap_shown', {
    tool,
    leap_type: leapType,
    engine: 'site',
    ...(typeof leapValueUsd === 'number' && Number.isFinite(leapValueUsd)
      ? { leap_value_usd: Math.round(leapValueUsd) }
      : {}),
  })
}
