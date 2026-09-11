"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/squad", label: "Squad", icon: "👕" },
  { href: "/insights", label: "Insights", icon: "📊" },
  { href: "/planner", label: "Planner", icon: "🗓️" },
  { href: "/assistant", label: "AI", icon: "🤖" },
];

// Same links as the pill/tab nav, plus Pricing - which otherwise has no
// spot in either of those (they're both capped at 5 items).
const DRAWER_ITEMS = [...NAV_ITEMS, { href: "/pricing", label: "Pricing", icon: "🏷️" }];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5">
      <path d="M5 5l10 10M15 5l-10 10" />
    </svg>
  );
}

/** Site-wide navigation: a brand bar (logo + hamburger + Buy Me a Coffee)
 * on every viewport, a horizontal pill nav on desktop, a fixed bottom tab
 * bar on mobile, and a slide-out side drawer (behind the hamburger) that
 * carries the same links plus Pricing, which doesn't fit in either the
 * pills or the tab bar. */
export default function SiteNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close on Escape and lock page scroll while open. Closing on link click
  // is handled per-link below rather than by watching pathname, so the
  // drawer dismisses immediately instead of waiting for navigation.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-black tracking-tight">
            Quick<span className="text-purple-600">FPL</span>
          </Link>

          <div className="flex items-center gap-3">
            <nav aria-label="Main" className="hidden gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    isActive(pathname, item.href)
                      ? "bg-purple-600 text-white"
                      : "bg-black/5 text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <a
              href="https://www.buymeacoffee.com/Quickfpl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#FFDD00] px-3 py-1.5 text-sm font-semibold text-black shadow-sm hover:brightness-95"
            >
              ☕ <span className="hidden sm:inline">Buy me a coffee</span>
            </a>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="site-drawer"
              className="rounded-md p-1.5 text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-black/10 bg-white/95 backdrop-blur md:hidden dark:border-white/10 dark:bg-black/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-purple-600 dark:text-purple-400" : "text-black/60 dark:text-white/60"
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Side drawer */}
      <div
        id="site-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] border-l border-black/10 bg-white p-4 shadow-xl transition-transform dark:border-white/15 dark:bg-neutral-950 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-black tracking-tight">
            Quick<span className="text-purple-600">FPL</span>
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Site menu links" className="flex flex-col gap-1">
          {DRAWER_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-purple-600 text-white"
                    : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
