import type { Metadata } from "next";
import MembershipComparison from "@/components/MembershipComparison";

const TITLE = "Membership Pricing | QuickFPL";
const DESCRIPTION = "Compare Moyes, Pep and Fergie membership tiers and unlock QuickFPL's premium tools.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const STEPS = [
  { icon: "☕", title: "Pick a tier", body: "Moyes, Pep or Fergie, on Buy Me a Coffee - a one-off platform, not us billing you directly." },
  { icon: "✉️", title: "Use the same email", body: "Enter it below and we check it against your Buy Me a Coffee membership, live." },
  { icon: "🔓", title: "Unlock instantly", body: "Every gated tool on the site checks that email from then on - no separate login to remember." },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes - memberships are managed entirely through Buy Me a Coffee, so you cancel there whenever you like. No lock-in, no contact required.",
  },
  {
    q: "What happens if I upgrade or downgrade?",
    a: "Whichever tier is active on Buy Me a Coffee for your email is what unlocks here - change it there and it's reflected next time you unlock.",
  },
  {
    q: "Do I need an account?",
    a: "No password, no signup form - just the email your Buy Me a Coffee membership is under. That's the whole mechanism.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Three tiers, no contracts. Pay through Buy Me a Coffee, unlock with the same email.
        </p>
      </header>

      <MembershipComparison />

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="icon-badge">{step.icon}</span>
                <span className="text-xs font-bold text-black/40 dark:text-white/40">STEP {i + 1}</span>
              </div>
              <p className="mt-3 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
          Questions
        </h2>
        <div className="card divide-y divide-black/10 dark:divide-white/10">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                {faq.q}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 flex-shrink-0 text-black/40 transition-transform group-open:rotate-180 dark:text-white/40"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
