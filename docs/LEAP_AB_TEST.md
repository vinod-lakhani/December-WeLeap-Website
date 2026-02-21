# Leap Impact A/B Test — Wedge Redesign

## Goal

Increase calc starts (39% → 50–60%) by reducing friction at the hero/CTA step.

## Variants

| Variant | Experience |
|---------|------------|
| **A (control)** | Full form visible on load. User fills salary, state, match, 401k %, then clicks "Show my best move". |
| **B (wedge)** | Hero only → CTA "Find my top move" → Step 1: salary only → Step 2: state, match, 401k % → "Show my best move". |

## Assignment

- 50/50 split
- Persisted in `sessionStorage` (`leap_impact_ab_variant`) for session consistency
- Assigned client-side on first render (avoids hydration mismatch)

## Events (all include `variant: 'A' | 'B'`)

| Event | When |
|-------|------|
| `leap_impact_viewed` | Page load |
| `landing_cta_click_show_next_move` | A: when user clicks "Show my best move". B: when user clicks "Find my top move" (first step). |
| `leap_impact_calculated` | User runs the 401(k) impact calculation |
| `results_viewed` | User sees results |
| `leap_impact_feedback_submitted` | User submits feedback |
| `full_stack_expand_clicked`, `leap_stack_unlock_clicked`, `leap_redirect_to_allocator` | User goes to allocator |

## Filtering in Vercel Analytics

Filter by custom event param `variant` = `A` or `B` to compare:

- **Primary metric:** `leap_impact_calculated` / `leap_impact_viewed` per variant
- **Secondary:** `results_viewed` / `leap_impact_viewed` (downstream quality)

## Run duration

- Minimum 7 days
- 14 days recommended for ~80–100 users per variant

## Files

- `lib/leapAbTest.ts` — `useLeapVariant()` hook
- `app/leap-impact-simulator/page.tsx` — passes variant to tool
- `components/LeapImpactTool.tsx` — renders A or B flow
- `components/ToolFeedbackQuestionnaire.tsx` — `extraTrackParams` for variant
