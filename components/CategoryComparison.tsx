import { CATEGORIES } from '@/lib/categories'
import { cn } from '@/lib/utils'

/**
 * The category comparison, in two shapes.
 *
 * A TABLE ON DESKTOP AND CARDS ON A PHONE, rather than one table that scrolls
 * sideways. Four columns need about 680px, and on /tools that meant a
 * horizontal scroll container — acceptable on a page someone has already
 * chosen to read, and not acceptable on the homepage, where this now sits in
 * the main conversion path and most traffic is mobile. A comparison that has
 * to be swiped to be read is a comparison most people do not read.
 *
 * The markup is duplicated between the two shapes on purpose. The alternative
 * is one DOM restyled with CSS, which for tabular data means either a table
 * that stops being a table for screen readers at small widths, or cards that
 * announce as rows. Two blocks, one `hidden` at each breakpoint, keeps both
 * semantics honest — and the content comes from one array either way.
 */
export function CategoryComparison({ className }: { className?: string }) {
  return (
    <div className={className}>
      {/* Phone: one card per category. */}
      <ul className="flex flex-col gap-4 md:hidden">
        {CATEGORIES.map((c) => (
          <li
            key={c.what}
            className={cn(
              'rounded-card border bg-white p-5',
              c.isUs ? 'border-brand-700/40 bg-brand-50/40' : 'border-hairline'
            )}
          >
            <p className={cn('text-[17px] font-extrabold text-ink', c.isUs && 'text-brand-700')}>
              {c.what}
            </p>
            <p className="mt-0.5 text-[13.5px] text-faint">{c.examples}</p>
            <dl className="mt-3 space-y-2.5">
              <div>
                <dt className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-faint">
                  What it does
                </dt>
                <dd className="mt-0.5 text-[15px] leading-relaxed text-subtle">{c.does}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-faint">
                  What it doesn&apos;t
                </dt>
                <dd className="mt-0.5 text-[15px] leading-relaxed text-subtle">{c.misses}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop: the table, which is what this data actually is. */}
      <div className="hidden overflow-x-auto rounded-card border border-hairline bg-white md:block">
        <table className="w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">
            Comparison of budgeting apps, robo-advisers and WeLeap: what each one does and what it
            does not do.
          </caption>
          <thead>
            <tr className="border-b border-hairline bg-canvas">
              <th scope="col" className="px-5 py-3.5 font-bold text-ink">Category</th>
              <th scope="col" className="px-5 py-3.5 font-bold text-ink">Examples</th>
              <th scope="col" className="px-5 py-3.5 font-bold text-ink">What it does</th>
              <th scope="col" className="px-5 py-3.5 font-bold text-ink">What it doesn&apos;t</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((c) => (
              <tr
                key={c.what}
                className={cn(
                  'border-b border-hairline last:border-b-0',
                  c.isUs && 'bg-brand-50/40'
                )}
              >
                <th
                  scope="row"
                  className={cn('px-5 py-4 align-top font-semibold text-ink', c.isUs && 'text-brand-700')}
                >
                  {c.what}
                </th>
                <td className="px-5 py-4 align-top leading-relaxed text-subtle">{c.examples}</td>
                <td className="px-5 py-4 align-top leading-relaxed text-subtle">{c.does}</td>
                <td className="px-5 py-4 align-top leading-relaxed text-subtle">{c.misses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
