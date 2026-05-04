"use client";

import React from "react";

/**
 * Tiny safe markdown renderer for Help Center copy. Avoids pulling in
 * react-markdown (~30 KB gzip) since we only need a handful of inline
 * patterns and rejecting raw HTML keeps XSS surface flat.
 *
 * Supported (inline):
 *   **bold**         → <strong>
 *   *italic*         → <em>
 *   `code`           → <code>
 *   [text](url)      → <a> (only http/https/mailto/tel allowed; opens in new tab)
 *
 * Block:
 *   blank line ── paragraph break
 *   single \n     ── soft break
 *   - line / * line at start of line → bullet list
 *
 * Anything else passes through as plain text. No raw HTML is honoured.
 */

interface Props {
  text: string;
  /** Optional inline style for the wrapping element. */
  style?: React.CSSProperties;
  className?: string;
  /** Color used for inline links + code background fallback. */
  linkColor?: string;
  codeBg?: string;
}

export function MarkdownText({ text, style, className, linkColor = "#4A9EFF", codeBg = "#0001" }: Props) {
  if (!text) return null;

  const blocks = parseBlocks(text);
  return (
    <div className={className} style={style}>
      {blocks.map((b, i) => renderBlock(b, i, { linkColor, codeBg }))}
    </div>
  );
}

// ─── Block parsing ─────────────────────────────────────────────

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] };

function parseBlocks(src: string): Block[] {
  // Normalise line endings + collapse 3+ blank lines to 2.
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let buf: string[] = [];
  let listBuf: string[] = [];

  const flushP = () => {
    if (buf.length === 0) return;
    blocks.push({ kind: "p", lines: buf });
    buf = [];
  };
  const flushList = () => {
    if (listBuf.length === 0) return;
    blocks.push({ kind: "ul", items: listBuf });
    listBuf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = /^[-*]\s+(.+)/.exec(trimmed);
    if (listMatch) {
      flushP();
      listBuf.push(listMatch[1]);
      continue;
    }
    if (trimmed === "") {
      flushList();
      flushP();
      continue;
    }
    flushList();
    buf.push(line);
  }
  flushList();
  flushP();
  return blocks;
}

function renderBlock(block: Block, key: number, ctx: { linkColor: string; codeBg: string }) {
  if (block.kind === "ul") {
    return (
      <ul key={key} style={{ margin: "0 0 10px", paddingInlineStart: 22 }}>
        {block.items.map((item, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{renderInline(item, ctx)}</li>
        ))}
      </ul>
    );
  }
  // Paragraph: join lines with <br> (soft break) — typical chat-style.
  return (
    <p key={key} style={{ margin: "0 0 10px", lineHeight: 1.85 }}>
      {block.lines.map((ln, i) => (
        <React.Fragment key={i}>
          {renderInline(ln, ctx)}
          {i < block.lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
}

// ─── Inline parsing ────────────────────────────────────────────

/**
 * Walks the text and emits an array of React nodes for each inline
 * token. We do a single-pass scan rather than a recursive parser —
 * the patterns don't nest deeply enough to need one and a flat scan
 * is far easier to keep correct.
 */
function renderInline(text: string, ctx: { linkColor: string; codeBg: string }): React.ReactNode {
  const out: React.ReactNode[] = [];
  let i = 0;
  let buf = "";

  const pushBuf = () => {
    if (buf.length > 0) {
      out.push(buf);
      buf = "";
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // [text](url)
    if (ch === "[") {
      const close = text.indexOf("]", i + 1);
      if (close > i && text[close + 1] === "(") {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd > close) {
          const label = text.slice(i + 1, close);
          const url = text.slice(close + 2, urlEnd);
          if (isSafeUrl(url)) {
            pushBuf();
            out.push(
              <a
                key={out.length}
                href={url}
                target={url.startsWith("http") ? "_blank" : undefined}
                rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{ color: ctx.linkColor, textDecoration: "underline" }}
              >
                {renderInline(label, ctx)}
              </a>
            );
            i = urlEnd + 1;
            continue;
          }
        }
      }
    }

    // **bold** — match nearest closing **
    if (ch === "*" && text[i + 1] === "*") {
      const close = text.indexOf("**", i + 2);
      if (close > i + 1) {
        pushBuf();
        out.push(
          <strong key={out.length} style={{ fontWeight: 700 }}>
            {renderInline(text.slice(i + 2, close), ctx)}
          </strong>
        );
        i = close + 2;
        continue;
      }
    }

    // *italic* — single asterisk; require non-space after the opener
    // so "use * to mark" doesn't open italic
    if (ch === "*" && text[i + 1] && text[i + 1] !== " " && text[i + 1] !== "*") {
      const close = text.indexOf("*", i + 1);
      if (close > i + 1 && text[close - 1] !== " ") {
        pushBuf();
        out.push(
          <em key={out.length} style={{ fontStyle: "italic" }}>
            {renderInline(text.slice(i + 1, close), ctx)}
          </em>
        );
        i = close + 1;
        continue;
      }
    }

    // `code`
    if (ch === "`") {
      const close = text.indexOf("`", i + 1);
      if (close > i) {
        pushBuf();
        out.push(
          <code
            key={out.length}
            style={{
              background: ctx.codeBg,
              padding: "1px 6px",
              borderRadius: 4,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.92em",
            }}
          >
            {text.slice(i + 1, close)}
          </code>
        );
        i = close + 1;
        continue;
      }
    }

    buf += ch;
    i++;
  }

  pushBuf();
  return out;
}

function isSafeUrl(url: string): boolean {
  // Allow same-origin paths, http, https, mailto, tel. Reject everything
  // else (javascript:, data:, vbscript:) to keep this XSS-safe.
  if (url.startsWith("/")) return true;
  return /^(https?:|mailto:|tel:)/.test(url);
}
