export interface ParsedPreview {
  teaser: string;
  fullWriteup: string;
}

const FULL_MARKER = /\n?FULL:\s*/i;
const TEASER_MARKER = /^TEASER:\s*/im;

/** Splits the model's raw response (expected to contain a "TEASER:" then
 * "FULL:" section) into the two pieces. Falls back to treating the whole
 * response as the full write-up (deriving a short teaser from its first
 * paragraph) if the model didn't follow the format exactly - this runs
 * unattended in CI, so it must never throw on a slightly-off response. */
export function parsePreviewResponse(raw: string): ParsedPreview {
  const fullMatch = raw.match(FULL_MARKER);
  if (!fullMatch || fullMatch.index === undefined) {
    const fullWriteup = raw.trim();
    const firstParagraph = fullWriteup.split(/\n\s*\n/)[0] ?? fullWriteup;
    return { teaser: firstParagraph.trim(), fullWriteup };
  }

  const teaserPart = raw.slice(0, fullMatch.index).replace(TEASER_MARKER, "").trim();
  const fullPart = raw.slice(fullMatch.index + fullMatch[0].length).trim();
  const teaser = teaserPart || fullPart.split(/\n\s*\n/)[0]?.trim() || fullPart;

  return { teaser, fullWriteup: fullPart };
}
