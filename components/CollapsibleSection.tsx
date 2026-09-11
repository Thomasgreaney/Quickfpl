/** A section that collapses to just its header. Uses native <details> so
 * it needs no client JS, works with keyboard/screen readers for free, and
 * the header stays visible (and reachable via the nav's #anchor links)
 * whether it's open or not. */
export default function CollapsibleSection({
  id,
  icon,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  description?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      className="group mb-6 scroll-mt-16 border-t border-black/10 pt-6 dark:border-white/10"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden="true">{icon}</span>
          {title}
        </h2>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5 flex-shrink-0 text-black/40 transition-transform group-open:rotate-180 dark:text-white/40"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      {description && <p className="mb-3 mt-2 text-sm text-black/60 dark:text-white/60">{description}</p>}
      <div className={description ? "" : "mt-3"}>{children}</div>
    </details>
  );
}
