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

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Pricing</h1>
      </header>

      <MembershipComparison />
    </main>
  );
}
