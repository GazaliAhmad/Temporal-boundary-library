function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rewriteHref(href) {
  if (href.endsWith(".md")) {
    return `${href.slice(0, -3)}.html`;
  }

  return href;
}

function renderInline(text) {
  const parts = text.split(/(`[^`]*`)/g);

  return parts
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }

      return escapeHtml(part)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
          return `<a href="${escapeHtml(rewriteHref(href))}">${escapeHtml(label)}</a>`;
        })
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    })
    .join("");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      index += 1;
      const content = [];

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        content.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({ type: "code", content: content.join("\n") });
      continue;
    }

    if (trimmed.startsWith("|") && /^\|\s*[-:| ]+\|?$/.test(lines[index + 1]?.trim() ?? "")) {
      const header = splitTableRow(lines[index]);
      index += 2;
      const rows = [];

      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: "table", header, rows });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (/^- /.test(trimmed) || /^\* /.test(trimmed)) {
      const items = [];

      while (index < lines.length) {
        const listLine = lines[index].trim();

        if (/^- /.test(listLine) || /^\* /.test(listLine)) {
          items.push(listLine.slice(2).trim());
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];

      while (index < lines.length) {
        const listLine = lines[index].trim();
        const match = listLine.match(/^\d+\.\s+(.*)$/);

        if (match) {
          items.push(match[1].trim());
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph = [];

    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();

      if (
        !currentTrimmed ||
        currentTrimmed === "---" ||
        currentTrimmed.startsWith("```") ||
        /^(#{1,6})\s+/.test(currentTrimmed) ||
        (/^- /.test(currentTrimmed) || /^\* /.test(currentTrimmed)) ||
        /^\d+\.\s+/.test(currentTrimmed) ||
        (currentTrimmed.startsWith("|") &&
          /^\|\s*[-:| ]+\|?$/.test(lines[index + 1]?.trim() ?? ""))
      ) {
        break;
      }

      paragraph.push(currentTrimmed);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function renderBlocks(blocks) {
  const toc = [];
  const rendered = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      const id = slugify(block.text);

      if (block.level >= 2 && block.level <= 4) {
        toc.push({ id, level: block.level, text: block.text });
      }

      rendered.push(
        `<h${block.level} id="${id}">${renderInline(block.text)}</h${block.level}>`,
      );
      continue;
    }

    if (block.type === "paragraph") {
      rendered.push(`<p>${renderInline(block.text)}</p>`);
      continue;
    }

    if (block.type === "ul") {
      rendered.push(
        `<ul>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`,
      );
      continue;
    }

    if (block.type === "ol") {
      rendered.push(
        `<ol>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`,
      );
      continue;
    }

    if (block.type === "code") {
      rendered.push(`<pre><code>${escapeHtml(block.content)}</code></pre>`);
      continue;
    }

    if (block.type === "table") {
      rendered.push(
        `<table><thead><tr>${block.header
          .map((cell) => `<th>${renderInline(cell)}</th>`)
          .join("")}</tr></thead><tbody>${block.rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table>`,
      );
      continue;
    }

    if (block.type === "rule") {
      rendered.push("<hr>");
    }
  }

  return { html: rendered.join(""), toc };
}

async function renderGuide() {
  const { source, eyebrow = "Guide", home, usage, api, demo, current } = document.body.dataset;

  if (!source) {
    return;
  }

  const response = await fetch(source);
  const markdown = await response.text();
  const blocks = parseMarkdown(markdown);

  let heroTitle = current || "Guide";
  let heroLede = "";
  let startIndex = 0;

  if (blocks[0]?.type === "heading" && blocks[0].level === 1) {
    heroTitle = blocks[0].text;
    startIndex = 1;
  }

  if (blocks[startIndex]?.type === "paragraph") {
    heroLede = blocks[startIndex].text;
    startIndex += 1;
  }

  document.title = `${heroTitle} | day-boundary`;
  document.getElementById("doc-eyebrow").textContent = eyebrow;
  document.getElementById("doc-title").innerHTML = renderInline(heroTitle);
  document.getElementById("doc-lede").innerHTML = renderInline(heroLede);

  const actions = [];

  if (home) {
    actions.push(`<a class="action-link" href="${home}">Guides Hub</a>`);
  }

  if (usage) {
    actions.push(`<a class="action-link" href="${usage}">Usage Guide</a>`);
  }

  if (api) {
    actions.push(`<a class="action-link" href="${api}">API Guide</a>`);
  }

  if (demo) {
    actions.push(`<a class="action-link" href="${demo}">Operational Day Demo</a>`);
  }

  document.getElementById("doc-actions").innerHTML = actions.join("");

  const { html, toc } = renderBlocks(blocks.slice(startIndex));
  document.getElementById("doc-content").innerHTML = html;

  const tocPanel = document.getElementById("toc-panel");

  if (toc.length === 0) {
    tocPanel?.remove();
    document.getElementById("doc-grid")?.classList.remove("doc-grid");
    return;
  }

  document.getElementById("toc-links").innerHTML = toc
    .map(
      (item) =>
        `<a class="toc-link" data-depth="${item.level}" href="#${item.id}">${renderInline(item.text)}</a>`,
    )
    .join("");
}

renderGuide();
