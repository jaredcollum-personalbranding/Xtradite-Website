/**
 * Ricos and structured plain-text renderer.
 *
 * Existing Wix/Ricos posts continue to use their rich-content nodes. Newer
 * Supabase-authored posts can use a deliberately small Markdown subset in
 * content_text: headings, paragraphs, emphasis, links, lists, blockquotes,
 * horizontal rules and tables.
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHref(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (/^(https?:\/\/|\/|#|mailto:)/i.test(url)) return url;
  return "";
}

function renderInline(value) {
  let text = escapeHtml(value);

  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^\*])\*([^*]+)\*/g, "$1<em>$2</em>");

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, rawUrl) => {
    const href = safeHref(rawUrl.replace(/&amp;/g, "&"));
    if (!href) return label;
    const external = /^https?:\/\//i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });

  return text;
}

function renderTextNodes(nodes = []) {
  return nodes
    .map((n) => {
      if (n.type !== "TEXT") return "";
      let text = escapeHtml(n.textData?.text ?? "");
      const decorations = n.textData?.decorations ?? [];

      for (const d of decorations) {
        if (d.type === "BOLD") text = `<strong>${text}</strong>`;
        if (d.type === "ITALIC") text = `<em>${text}</em>`;
        if (d.type === "LINK") {
          const href = safeHref(d.linkData?.link?.url || d.linkData?.url);
          if (href) {
            const external = /^https?:\/\//i.test(href);
            text = `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
          }
        }
      }
      return text;
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
        break;
    }
  }

  return html.join("\n");
}

function ensureStructuredContentStyles() {
  if (document.querySelector('link[data-insight-structured-content]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/assets/css/insight-structured-content.css";
  link.dataset.insightStructuredContent = "true";
  document.head.appendChild(link);
}

function isTableDivider(line) {
  const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

/** Render a safe, intentionally limited Markdown subset from content_text. */
export function renderPlainText(contentText) {
  if (!contentText) return "";
  ensureStructuredContentStyles();

  const lines = String(contentText).replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line === "---") {
      html.push("<hr>");
      index += 1;
      continue;
    }

    if (/^#{2,4}\s+/.test(line)) {
      const match = line.match(/^(#{2,4})\s+(.+)$/);
      const level = match[1].length;
      html.push(`<h${level}>${renderInline(match[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quote.push(lines[index].trim().slice(2));
        index += 1;
      }
      html.push(`<blockquote>${quote.map(renderInline).join("<br>")}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headers = tableCells(line);
      const rows = [];
      index += 2;

      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }

      html.push(`
        <div class="post-table-wrap" role="region" aria-label="Scrollable article table" tabindex="0">
          <table class="post-table">
            <thead><tr>${headers.map((cell) => `<th scope="col">${renderInline(cell)}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] || "")}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </div>`);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{2,4}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith("> ") &&
      lines[index].trim() !== "---" &&
      !(lines[index].includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1]))
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return html.join("\n");
}
