/**
 * How WeLeap differs from the two things a reader will assume it is.
 *
 * Lives here rather than inside a page because it is now rendered on two of
 * them. This is the site's sharpest competitive argument — it names the
 * categories, says what each does well, and states the specific structural
 * limit of each — and a second hand-maintained copy is how the strongest
 * paragraph on a site quietly becomes two paragraphs that disagree.
 *
 * The distinction itself: budgeting apps report backwards, robo-advisers
 * manage one account forwards, this does neither. Naming what a competing
 * category does WELL is what makes the limitation land as an argument rather
 * than a claim of superiority.
 */

export interface Category {
  what: string
  examples: string
  does: string
  misses: string
  /** Ours. Rendered with emphasis, and never the row a reader has to hunt for. */
  isUs?: true
}

export const CATEGORIES: readonly Category[] = [
  {
    what: 'Budgeting apps',
    examples: 'Mint-style spend trackers, envelope apps',
    does: 'Categorizes money you already spent and shows it back to you',
    misses: 'It tells you what happened, not what to do next',
  },
  {
    what: 'Robo-advisers',
    examples: 'Automated investing platforms',
    does: 'Manages an investment account for you, for a fee on assets',
    misses: 'It only sees the account it manages — not your debt, cash or 401(k)',
  },
  {
    what: 'WeLeap',
    examples: 'Ribbit, plus these free calculators',
    does: 'Reads the whole picture and names the single next move, which you approve',
    misses: 'It does not move money on its own and it does not manage investments',
    isUs: true,
  },
]
