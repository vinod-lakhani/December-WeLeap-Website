import Link from "next/link"
import { ArrowLeft } from 'lucide-react'
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SMS Notifications | WeLeap',
  description: 'How WeLeap text-message notifications work, how you opt in, and how to stop them at any time.',
}

export default function SmsNotificationsPage() {
  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center" isHero>
        <Container maxWidth="narrow">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3">SMS / Messaging Policy</p>
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-3 md:mb-4")}>WeLeap SMS Notifications</h1>
          <p className={cn(TYPOGRAPHY.body, "text-white/75 max-w-xl mx-auto")}>
            How WeLeap text-message notifications work, how you opt in, and how to stop them at any time.
          </p>
        </Container>
      </Section>

      <Section variant="white">
        <Container maxWidth="narrow">
          <Link href="/" className={cn("inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 md:mb-8", TYPOGRAPHY.subtext)}>
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            Back to Home
          </Link>

          <article className="prose prose-lg max-w-none">
            <div className="space-y-6 md:space-y-8 text-gray-700 leading-relaxed">

              {/* What this program is */}
              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>What this program is</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  WeLeap is a personal finance app for young adults. We send recurring SMS notifications to registered WeLeap users who have opted in. Each message delivers one of the following for that specific user:
                </p>
                <ul className={cn("list-disc pl-5 md:pl-6 space-y-2", TYPOGRAPHY.subtext, "text-gray-700")}>
                  <li>Your top recommended financial action for the week (a "Leap"), for example moving money to savings or capturing an employer 401(k) match.</li>
                  <li>A time-sensitive reminder, for example an upcoming bill due date or a subscription renewal.</li>
                  <li>A prompt to view your weekly money summary.</li>
                </ul>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Message frequency varies and is about 1 to 3 messages per week. Message and data rates may apply.
                </p>
              </section>

              {/* How you opt in */}
              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>How you opt in</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  You opt in during WeLeap account onboarding. On the notifications step, you enter your mobile number and check a consent box (unchecked by default). The box reads:
                </p>
                <div className="border-l-4 border-[#386641] bg-green-50 rounded-r-xl px-5 py-4 text-sm text-gray-700 italic">
                  "I agree to receive recurring automated SMS notifications from WeLeap about my weekly financial summary, recommended actions (Leaps), and reminders. Msg frequency varies (about 1 to 3 per week). Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of using WeLeap."
                </div>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  SMS consent is collected on its own. It is not bundled with acceptance of our Terms or Privacy Policy, and it is not required to use WeLeap.
                </p>
              </section>

              {/* The opt-in screen — phone mockup */}
              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>The opt-in screen</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-500 text-center")}>
                  The notifications step shown to users during WeLeap onboarding:
                </p>

                {/* Phone mockup */}
                <div className="flex justify-center my-6">
                  <div className="w-[300px] bg-white rounded-[32px] border-[8px] border-[#1A3320] px-5 py-6 shadow-2xl">
                    {/* Notch */}
                    <div className="w-24 h-1.5 bg-[#C2DEC6] rounded-full mx-auto mb-5" />
                    {/* Step label */}
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-[#4A8A54] mb-1">Onboarding · Notifications</p>
                    <h3 className="text-lg font-bold text-[#1A3320] mb-1">Stay on top of your money</h3>
                    <p className="text-xs text-gray-500 mb-5">Get your weekly Leap, reminders, and money check-in by text.</p>
                    {/* Phone field */}
                    <label className="text-[11px] font-semibold text-[#1A3320] block mb-1.5">Mobile number</label>
                    <div className="border border-[#C2DEC6] rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-[#EDF4EE] mb-5">
                      (555) 000-0000
                    </div>
                    {/* Consent row */}
                    <div className="flex gap-2.5 items-start mb-5">
                      <div className="w-5 h-5 min-w-[20px] border-2 border-[#386641] rounded-md mt-0.5 bg-white" />
                      <p className="text-[11px] leading-relaxed text-gray-700">
                        I agree to receive recurring automated SMS notifications from WeLeap about my weekly financial summary, recommended actions (Leaps), and reminders. Msg frequency varies (about 1 to 3 per week). Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of using WeLeap. See{' '}
                        <Link href="/terms-of-service" className="text-[#386641] underline">Terms</Link> and{' '}
                        <Link href="/privacy-policy" className="text-[#386641] underline">Privacy Policy</Link>.
                      </p>
                    </div>
                    {/* Button */}
                    <div className="bg-[#386641] text-white text-center font-semibold text-sm py-3 rounded-xl mb-3">
                      Continue
                    </div>
                    <p className="text-center text-xs text-gray-400">Skip for now</p>
                  </div>
                </div>
              </section>

              {/* Keywords */}
              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Keywords and replies</h2>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {[
                        {
                          label: 'Opt out',
                          content: <>Reply <code className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono">STOP</code> (also STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT) to stop all messages. You will receive one confirmation that you have been unsubscribed.</>
                        },
                        {
                          label: 'Help',
                          content: <>Reply <code className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono">HELP</code> (or INFO) for help. You can also reach us at <a href="mailto:support@weleap.ai" className="text-[#386641] hover:underline">support@weleap.ai</a>.</>
                        },
                        {
                          label: 'Resubscribe',
                          content: <>Reply <code className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono">START</code> (or YES, UNSTOP) to opt back in after stopping.</>
                        },
                      ].map(({ label, content }) => (
                        <tr key={label}>
                          <td className="px-4 py-3 font-semibold text-gray-900 w-32 align-top">{label}</td>
                          <td className="px-4 py-3 text-gray-600">{content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Privacy */}
              <section className="space-y-3 md:space-y-4">
                <h2 className={cn(TYPOGRAPHY.h3, "text-gray-900 mt-6 md:mt-8 mb-3 md:mb-4")}>Privacy</h2>
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700")}>
                  Mobile phone numbers and SMS consent collected for WeLeap notifications are never sold or shared with third parties or affiliates for marketing purposes. Full details are in our{' '}
                  <Link href="/privacy-policy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
                </p>
              </section>

              {/* Further reading card */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
                <p className={cn(TYPOGRAPHY.subtext, "text-gray-700 m-0")}>
                  Read more:{' '}
                  <Link href="/privacy-policy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                  {' '}&nbsp;|&nbsp;{' '}
                  <Link href="/terms-of-service" className="text-primary-600 hover:underline">Terms of Service</Link>
                </p>
              </div>

            </div>
          </article>
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
  )
}
