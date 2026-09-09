"use client";

// TODO: replace with a real membership check once the Buy Me a Coffee
// webhook integration is wired up (verify the visitor's email against
// active Pep/Fergie members). Locked for everyone until then.
function useMembership(): boolean {
  return false;
}

export default function PremiumGate({
  tier = "Pep",
  children,
}: {
  tier?: string;
  children: React.ReactNode;
}) {
  const unlocked = useMembership();

  if (unlocked) return <>{children}</>;

  return (
    <div className="rounded-lg border border-dashed border-black/15 bg-black/[.02] p-6 text-center dark:border-white/20 dark:bg-white/[.03]">
      <p className="font-semibold">🔒 {tier} members only</p>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Unlock this with a Pep or Fergie membership.
      </p>
      <a
        href="https://www.buymeacoffee.com/Quickfpl"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#FFDD00] px-3 py-1.5 text-sm font-semibold text-black shadow-sm hover:brightness-95"
      >
        ☕ Become a member
      </a>
    </div>
  );
}
