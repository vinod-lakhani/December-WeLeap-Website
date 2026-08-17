import { JsonLd } from '@/components/JsonLd'
import { articleByHref } from '@/lib/articles'
import { articleSchema } from '@/lib/structured-data'

/**
 * BlogPosting markup for a /resources article.
 *
 * Takes the route rather than the fields, so the twelve article pages cannot
 * each grow their own slightly different copy of the author, date and headline.
 * Everything comes out of lib/articles.ts, which is also what renders the cards
 * on /resources.
 */
export function ArticleJsonLd({ href }: { href: string }) {
  const article = articleByHref(href)
  if (!article) return null
  return <JsonLd data={articleSchema(article)} />
}
