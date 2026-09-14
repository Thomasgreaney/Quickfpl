/** Splits on **double-asterisk** spans and renders them as highlights -
 * shared by the gameweek preview and wrap-up write-ups, both of which ask
 * the model to wrap the handful of things worth a reader's attention (a
 * player, a team, a standout stat) in these. Any stray or unmatched
 * asterisks just pass through as plain text. */
function withHighlights(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    if (!match) return part;
    return (
      <mark
        key={i}
        className="rounded bg-purple-100 px-1 font-semibold text-purple-900 dark:bg-purple-900/50 dark:text-purple-200"
      >
        {match[1]}
      </mark>
    );
  });
}

export default function HighlightedParagraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="mb-3 text-black/80 last:mb-0 dark:text-white/80">
            {withHighlights(p)}
          </p>
        ))}
    </>
  );
}
