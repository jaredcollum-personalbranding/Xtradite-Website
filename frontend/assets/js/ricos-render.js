/**
 * Minimal Ricos rich-content renderer — covers the node types Xtradite's blog posts
 * actually use (PARAGRAPH, HEADING, BULLETED_LIST/ORDERED_LIST, BLOCKQUOTE). Falls back
 * to contentText (split on "\n") if richContent is missing or a node type isn't handled.
 * Reference: https://dev.wix.com/docs/ricos/api-reference/ricos-document
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderTextNodes(nodes = []) {
  return nodes
    .map((n) => {
      if (n.type === "TEXT") {
        let text = escapeHtml(n.textData?.text ?? "");
        const decorations = n.textData?.decorations ?? [];
        for (const d of decorations) {
          if (d.type === "BOLD") text = `<strong>${text}</strong>`;
          if (d.type === "ITALIC") text = `<em>${text}</em>`;
        }
        return text;
      }
      return "";
    })
    .join("");
}

export function renderRicos(richContent) {
  if (!richContent?.nodes?.length) return "";
  const html = [];
  for (const node of richContent.nodes) {
    switch (node.type) {
      case "PARAGRAPH":
        html.push(`<p>${renderTextNodes(node.nodes)}</p>`);
        break;
      case "HEADING": {
        const level = Math.min(Math.max(node.headingData?.level ?? 2, 2), 4);
        html.push(`<h${level}>${renderTextNodes(node.nodes)}</h${level}>`);
        break;
      }
      case "BULLETED_LIST":
        html.push(`<ul>${(node.nodes ?? []).map((li) => `<li>${renderTextNodes(li.nodes?.[0]?.nodes ?? li.nodes)}</li>`).join("")}</ul>`);
        break;
      case "ORDERED_LIST":
        html.push(`<ol>${(node.nodes ?? []).map((li) => `<li>${renderTextNodes(li.nodes?.[0]?.nodes ?? li.nodes)}</li>`).join("")}</ol>`);
        break;
      case "BLOCKQUOTE":
        html.push(`<blockquote>${renderTextNodes(node.nodes?.[0]?.nodes ?? node.nodes)}</blockquote>`);
        break;
      default:
        break; // unhandled node types are skipped, not fabricated
    }
  }
  return html.join("\n");
}

/** Fallback for when richContent is absent: plain text split into paragraphs. */
export function renderPlainText(contentText) {
  if (!contentText) return "";
  return contentText
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}
