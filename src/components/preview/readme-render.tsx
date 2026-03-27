"use client";

/**
 * Simple markdown-to-HTML renderer for previewing GitHub profile READMEs.
 *
 * Handles the subset of GitHub-flavored markdown produced by `composeReadme`:
 * headings, bold, italic, inline code, images, links, bullet lists, tables,
 * and horizontal rules. This is intentionally minimal -- not a full markdown
 * parser.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadmeRenderProps {
  markdown: string;
}

// ---------------------------------------------------------------------------
// Inline parsing
// ---------------------------------------------------------------------------

/**
 * Convert inline markdown syntax to HTML within a single line of text.
 * Order matters: images before links (images use `![` prefix).
 */
function parseInline(text: string): string {
  let result = text;

  // Images: ![alt](url)
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img alt="$1" src="$2" class="my-2 max-w-full rounded" />',
  );

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-emerald-400 underline hover:text-emerald-300" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Bold: **text**
  result = result.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-slate-50">$1</strong>',
  );

  // Italic: *text*
  result = result.replace(
    /\*([^*]+)\*/g,
    '<em class="italic text-slate-200">$1</em>',
  );

  // Inline code: `code`
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-emerald-300">$1</code>',
  );

  return result;
}

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

interface Block {
  type: "heading" | "paragraph" | "list" | "table" | "hr" | "image";
  level?: number; // heading level
  content: string; // raw content or rendered HTML
  items?: string[]; // list items
  rows?: string[][]; // table rows (first row = header)
}

/**
 * Parse a markdown string into an array of blocks. Each block represents
 * a semantic unit (heading, paragraph, list, table, hr).
 */
function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Horizontal rule: --- or *** or ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // Heading: # to ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }

    // Table: starts with | and next line is separator
    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\|[\s\-:|]+\|$/.test(lines[i + 1].trim())
    ) {
      const rows: string[][] = [];
      // Header row
      rows.push(parseTableRow(line));
      // Skip separator row
      i += 2;
      // Data rows
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", content: "", rows });
      continue;
    }

    // Bullet list: lines starting with - or *
    if (/^[-*]\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", content: "", items });
      continue;
    }

    // Standalone image line: ![alt](url) with nothing else
    if (/^!\[([^\]]*)\]\(([^)]+)\)\s*$/.test(line.trim())) {
      blocks.push({ type: "image", content: line.trim() });
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    {
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].match(/^#{1,6}\s/) &&
        !lines[i].trim().startsWith("|") &&
        !/^[-*]\s+/.test(lines[i].trim()) &&
        !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        blocks.push({ type: "paragraph", content: paraLines.join("\n") });
      }
    }
  }

  return blocks;
}

/**
 * Split a markdown table row into cell values.
 */
function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell !== "");
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderBlock(block: Block, index: number): string {
  switch (block.type) {
    case "hr":
      return `<hr class="my-6 border-slate-700" />`;

    case "heading": {
      const tag = `h${block.level}`;
      const sizeClasses: Record<number, string> = {
        1: "text-3xl font-bold mt-8 mb-4 text-slate-50",
        2: "text-2xl font-semibold mt-6 mb-3 text-slate-50",
        3: "text-xl font-semibold mt-4 mb-2 text-slate-100",
        4: "text-lg font-medium mt-3 mb-2 text-slate-200",
        5: "text-base font-medium mt-2 mb-1 text-slate-200",
        6: "text-sm font-medium mt-2 mb-1 text-slate-300",
      };
      const classes = sizeClasses[block.level ?? 1] ?? sizeClasses[1];
      return `<${tag} class="${classes}">${parseInline(block.content)}</${tag}>`;
    }

    case "paragraph":
      return `<p class="mb-4 leading-relaxed text-slate-300">${parseInline(block.content)}</p>`;

    case "image":
      return parseInline(block.content);

    case "list":
      return `<ul class="mb-4 list-disc space-y-1 pl-6 text-slate-300">${
        (block.items ?? [])
          .map((item) => `<li>${parseInline(item)}</li>`)
          .join("")
      }</ul>`;

    case "table": {
      const rows = block.rows ?? [];
      if (rows.length === 0) return "";
      const header = rows[0];
      const body = rows.slice(1);
      return `<div class="mb-4 overflow-x-auto"><table class="w-full border-collapse text-sm text-slate-300">
        <thead><tr class="border-b border-slate-700">${
          header
            .map(
              (cell) =>
                `<th class="px-3 py-2 text-left font-semibold text-slate-200">${parseInline(cell)}</th>`,
            )
            .join("")
        }</tr></thead>
        <tbody>${body
          .map(
            (row) =>
              `<tr class="border-b border-slate-800">${row
                .map(
                  (cell) =>
                    `<td class="px-3 py-2">${parseInline(cell)}</td>`,
                )
                .join("")}</tr>`,
          )
          .join("")}</tbody></table></div>`;
    }

    default:
      return "";
  }
}

function markdownToHtml(markdown: string): string {
  const blocks = parseBlocks(markdown);
  return blocks.map((block, i) => renderBlock(block, i)).join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReadmeRender({ markdown }: ReadmeRenderProps) {
  const html = markdownToHtml(markdown);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .readme-preview h1 { animation: fadeInUp 0.6s ease-out; }
        .readme-preview h2 { animation: fadeInUp 0.5s ease-out; }
        .readme-preview h3 { animation: fadeIn 0.4s ease-out; }
        .readme-preview img {
          animation: scaleIn 0.7s ease-out;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .readme-preview img:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 30px rgba(52, 211, 153, 0.15);
        }
        .readme-preview table {
          animation: fadeIn 0.6s ease-out;
        }
        .readme-preview table tr {
          animation: slideInLeft 0.4s ease-out;
          animation-fill-mode: both;
        }
        .readme-preview table tr:nth-child(1) { animation-delay: 0.1s; }
        .readme-preview table tr:nth-child(2) { animation-delay: 0.15s; }
        .readme-preview table tr:nth-child(3) { animation-delay: 0.2s; }
        .readme-preview table tr:nth-child(4) { animation-delay: 0.25s; }
        .readme-preview table tr:nth-child(5) { animation-delay: 0.3s; }
        .readme-preview table tr:nth-child(6) { animation-delay: 0.35s; }
        .readme-preview table tr:nth-child(7) { animation-delay: 0.4s; }
        .readme-preview ul li {
          animation: fadeIn 0.4s ease-out;
          animation-fill-mode: both;
        }
        .readme-preview ul li:nth-child(1) { animation-delay: 0.1s; }
        .readme-preview ul li:nth-child(2) { animation-delay: 0.2s; }
        .readme-preview ul li:nth-child(3) { animation-delay: 0.3s; }
        .readme-preview ul li:nth-child(4) { animation-delay: 0.4s; }
        .readme-preview p { animation: fadeIn 0.5s ease-out; }
      `}</style>
      <div
        className="readme-preview rounded-lg bg-slate-900 p-6 md:p-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
