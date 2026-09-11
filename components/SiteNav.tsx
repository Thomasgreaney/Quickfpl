"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/squad", label: "Squad", icon: "👕" },
  { href: "/insights", label: "Insights", icon: "📊" },
  { href: "/planner", label: "Planner", icon: "🗓️" },
  { href: "/assistant", label: "AI", icon: "🤖" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Site-wide navigation: a brand bar (logo + Buy Me a Coffee) on every
 * viewport, a horizontal pill nav on desktop, and a fixed bottom tab bar
 * on mobile. Keeps the same minimal styling as the old single-page nav. */
export default function SiteNav() {
  const pathname = usePathname();

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
    </>
  );
}
