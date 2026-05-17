/**
 * Tiny Markdown → HTML → PDF converter using local Chrome.
 *
 * Usage:  node md-to-pdf.js <input.md> <output.pdf>
 *
 * No external npm deps. The markdown parser handles only the
 * subset we actually use in the user/admin guides:
 *   - ATX headers (#, ##, ###)
 *   - bullet lists (- foo / * foo) and ordered lists (1. foo)
 *   - bold (**text**) and inline code (`text`)
 *   - fenced code blocks (```...```)
 *   - GFM tables (| h | h |)
 *   - blockquotes (> foo)
 *   - paragraphs separated by blank lines
 *
 * Anything fancier (links, images, footnotes) we don't use, so it
 * passes through as plain text. Keeps the script readable.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(text) {
  // 1. inline code first (so its * and ** don't get parsed as bold)
  text = text.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  // 2. bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 3. images: ![alt](src) — used by the bot-builder guide for embedded
  //    screenshots. Render as a block-level figure so they don't get
  //    swallowed by the surrounding paragraph flow on RTL pages.
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) =>
      `<figure class="screenshot"><img src="${src}" alt="${alt}"/>${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`,
  );
  return text;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (!buf.length) return;
    out.push(`<p>${inline(escapeHtml(buf.join(' ')))}</p>`);
    buf.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (/^```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // blank line
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // headers
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
      i++;
      continue;
    }

    // horizontal rule
    if (/^---+\s*$/.test(line)) {
      out.push('<hr/>');
      i++;
      continue;
    }

    // table: header line + separator line + body
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|\s*[-:]/.test(lines[i + 1])) {
      const headers = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        rows.push(cells);
        i++;
      }
      const head = headers.map((h) => `<th>${inline(escapeHtml(h))}</th>`).join('');
      const body = rows
        .map(
          (r) =>
            '<tr>' + r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join('') + '</tr>'
        )
        .join('');
      out.push(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${inline(escapeHtml(buf.join(' ')))}</blockquote>`);
      continue;
    }

    // unordered list
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      out.push(
        '<ul>' + items.map((x) => `<li>${inline(escapeHtml(x))}</li>`).join('') + '</ul>'
      );
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      out.push(
        '<ol>' + items.map((x) => `<li>${inline(escapeHtml(x))}</li>`).join('') + '</ol>'
      );
      continue;
    }

    // paragraph: collect consecutive non-special lines
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\|/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    flushParagraph(buf);
  }

  return out.join('\n');
}

const TEMPLATE = (title, body) => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  @page { margin: 18mm 16mm; size: A4; }
  body {
    font-family: "Tajawal", "Cairo", "Segoe UI", "Arial", sans-serif;
    font-size: 11pt;
    line-height: 1.85;
    color: #1a1a1a;
    max-width: 100%;
  }
  h1 { font-size: 22pt; color: #E8713A; border-bottom: 3px solid #E8713A; padding-bottom: 8px; margin-top: 0; }
  h2 { font-size: 17pt; color: #2C3E50; margin-top: 28px; padding-right: 12px; border-right: 4px solid #E8713A; }
  h3 { font-size: 13pt; color: #34495E; margin-top: 22px; }
  h4 { font-size: 12pt; color: #5D6D7E; }
  p  { margin: 8px 0; }
  ul, ol { padding-right: 24px; padding-left: 0; }
  li { margin: 4px 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 10.5pt;
  }
  th, td {
    border: 1px solid #d8d8d8;
    padding: 7px 10px;
    text-align: right;
  }
  th { background: #f7f3ee; font-weight: 700; color: #2C3E50; }
  tr:nth-child(even) td { background: #fafafa; }
  code {
    background: #f4f4f4;
    color: #c0392b;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 90%;
    /* unicode-bidi: plaintext lets each line of code pick its own
       direction from its first strong character. Pure-English code
       still renders left-to-right; Arabic content (template strings,
       guides) renders right-to-left without character reversal.
       The previous bidi-override forced LTR rendering and visibly
       reversed every Arabic word in the block. */
    unicode-bidi: plaintext;
    display: inline-block;
  }
  pre {
    background: #f7f3ee;
    border: 1px solid #e6dccc;
    border-radius: 8px;
    padding: 12px 14px;
    overflow: auto;
    /* No forced direction — let each line pick its own. */
    unicode-bidi: plaintext;
    margin: 10px 0;
  }
  pre code {
    background: transparent;
    color: #1a1a1a;
    padding: 0;
    display: block;
  }
  blockquote {
    border-right: 4px solid #E8713A;
    background: #fff8f3;
    padding: 10px 14px;
    margin: 12px 0;
    color: #5d4037;
    border-radius: 4px;
  }
  hr {
    border: 0;
    border-top: 1px dashed #d0d0d0;
    margin: 22px 0;
  }
  strong { color: #1a1a1a; }
  figure.screenshot {
    margin: 16px 0;
    text-align: center;
    page-break-inside: avoid;
  }
  figure.screenshot img {
    max-width: 100%;
    height: auto;
    border: 1px solid #d8d8d8;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  figure.screenshot figcaption {
    font-size: 9.5pt;
    color: #5D6D7E;
    margin-top: 6px;
    font-style: italic;
  }
</style>
</head>
<body>
${body}
</body>
</html>`;

function main() {
  const [, , inFile, outFile] = process.argv;
  if (!inFile || !outFile) {
    console.error('Usage: node md-to-pdf.js <input.md> <output.pdf>');
    process.exit(1);
  }

  const md = fs.readFileSync(inFile, 'utf8');
  const html = mdToHtml(md);
  const title = (md.match(/^#\s+(.+)$/m) || [, 'Document'])[1];
  const fullHtml = TEMPLATE(title, html);

  // Chrome's print-to-pdf wants a file:// URL.
  const tmpHtml = path.resolve(outFile.replace(/\.pdf$/i, '.html'));
  fs.writeFileSync(tmpHtml, fullHtml, 'utf8');

  const tmpUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');
  const outAbs = path.resolve(outFile);

  const cmd = `"${CHROME}" --headless=new --disable-gpu --no-margins --no-pdf-header-footer --print-to-pdf-no-header --print-to-pdf="${outAbs}" "${tmpUrl}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('PDF written to', outAbs);
  } catch (e) {
    console.error('Chrome print failed:', e.message);
    process.exit(2);
  } finally {
    // Keep the HTML next to the PDF so it's inspectable; comment out
    // the next line if you'd rather it be removed:
    // fs.unlinkSync(tmpHtml);
  }
}

main();
