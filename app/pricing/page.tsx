import type { Metadata } from "next";
import GoAdFree from "@/components/GoAdFree";

const TITLE = "Pricing | QuickFPL";
const DESCRIPTION = "Every QuickFPL tool is free. Pay once to remove ads site-wide.";

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
  { icon: "💰", title: "Pay once", body: "One plain price, on Buy Me a Coffee - a one-off platform, not us billing you directly." },
  { icon: "✉️", title: "Use the same email", body: "Enter it below and we check it against your payment, live." },
  { icon: "🔓", title: "Ad-free instantly", body: "Every ad slot on the site checks that email from then on - no separate login to remember." },
];

const FAQS = [
  {
    q: "What do I actually get for paying?",
    a: "Nothing functional - every tool on QuickFPL is free for everyone already. Paying just removes the ads.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes - payment is managed entirely through Buy Me a Coffee, so you cancel there whenever you like. No lock-in, no contact required.",
  },
  {
    q: "Do I need an account?",
    a: "No password, no signup form - just the email your payment is under. That's the whole mechanism.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
          Every tool on QuickFPL is free, ads pay for the rest. One price removes them.
        </p>
      </header>

      <GoAdFree />

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
