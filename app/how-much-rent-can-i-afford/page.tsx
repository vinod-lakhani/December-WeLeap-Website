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
