const URL_REGEX =
  /https?:\/\/[^\s<>"')\]},]+[^\s<>"')\]},.:;!?]/gi;

/**
 * Extract the first http/https URL from text.
 */
export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

type MessageSegment = { text: string; isUrl: boolean };

/**
 * Split message text into plain text and URL segments for rendering.
 */
export function parseMessageWithLinks(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  const regex = new RegExp(URL_REGEX.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isUrl: false });
    }
    segments.push({ text: match[0], isUrl: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isUrl: false });
  }

  return segments;
}
