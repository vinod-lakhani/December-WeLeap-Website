import { OfferTool } from '@/components/OfferTool';
import { PageShell, Section, Container } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'How much rent can I afford? | WeLeap',
  description: 'Turn your job offer into a clear rent range — before you sign anything.',
};

export default function HowMuchRentCanIAffordPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container>
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-4")}>
            Don't let rent break your first paycheck.
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-white/85 leading-relaxed max-w-2xl mx-auto")}>
            Turn your job offer into a safe rent range — and see what life actually looks like before you sign a lease.
          </p>
          <p className={cn("text-sm text-white/75 mt-3 max-w-2xl mx-auto")}>
            Most people overcommit on rent before they understand their real cash flow.
          </p>
          <p className={cn("text-sm text-white/70 mt-2")}>
            Built for early-career decisions. Estimates only.
          </p>
        </Container>
      </Section>

      {/* How it works Section */}
      <Section variant="white" className="bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className={cn(TYPOGRAPHY.h2, "text-[#111827] mb-8 md:mb-10 text-center")}>
              How it works (30 seconds)
            </h2>
            
            <div className="space-y-6 md:space-y-8">
              {/* Step 1 */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                  Step 1: Start with your job offer
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Enter your salary, city, and start date. We estimate your real take-home pay after taxes — the number that actually matters.
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                  Step 2: See what rent really does
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  We translate that take-home pay into a safe rent range, upfront cash needs, and where things may get tight once bills hit.
                </p>
              </div>

              {/* Step 3 */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                  Step 3: Get your Day 1 Playbook
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  We generate a simple, one-page plan you can save — and we email it to you so it's there when life starts moving fast.
                </p>
              </div>

              {/* Step 4 */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                  Step 4: Decide with confidence
                </h3>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  Use the playbook to sanity-check apartments and avoid overcommitting before you sign a lease.
                </p>
              </div>
            </div>

            {/* Differentiation Line */}
            <div className="mt-10 md:mt-12 pt-8 md:pt-10 border-t border-gray-200">
              <p className="text-sm md:text-base text-gray-600 text-center leading-relaxed">
                Most rent calculators stop at a number. This shows you what life actually looks like after you sign.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Calculator Section */}
      <Section variant="muted" className="bg-[#F9FAFB]">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <OfferTool />
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p>© 2024 WeLeap.</p>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </PageShell>
  );
}
