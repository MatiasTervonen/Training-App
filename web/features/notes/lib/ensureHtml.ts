/**
 * Ensures content is HTML. If it's legacy markdown (plain text),
 * converts basic formatting to HTML so it renders correctly.
 */
export function ensureHtml(content: string): string {
  if (!content) return "";

  // Already HTML — return as-is
  if (content.trimStart().startsWith("<")) return content;

  // Legacy markdown/plain text — convert to HTML
  let html = content;

  // Inline formatting
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // Headings (must be before paragraph wrapping)
  html = html.replace(/^#{6}\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#{5}\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr>");

  // Wrap remaining text blocks in <p> tags
  return html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that are already HTML elements
      if (trimmed.startsWith("<h") || trimmed.startsWith("<hr")) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}
