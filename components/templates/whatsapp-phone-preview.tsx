"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

interface TemplateButton {
  type?: string;
  text: string;
  /** "url" | "phone" | "quick_reply" — controls the icon hint. */
  kind?: string;
  url?: string;
  phone?: string;
}

interface Props {
  /** Optional header text — used for TEXT-format headers only. */
  header?: string | null;
  /**
   * Header format. When "image" / "video" / "document", we render the
   * actual media (or a typed placeholder) at the top of the bubble
   * instead of a text header. Defaults to "text" for backwards
   * compatibility with callers that only set `header`.
   */
  headerFormat?: "none" | "text" | "image" | "video" | "document" | null;
  /**
   * Public/signed URL for the media header. When omitted but
   * headerFormat is set to image/video/document, we still render a
   * typed placeholder so the operator knows which slot they're in.
   */
  headerMediaUrl?: string | null;
  /** Body with {{1}}, {{2}} placeholders. We render them as filled chips
   *  (e.g. {{1}} → "[الاسم]") so the operator sees how the template
   *  looks once variables resolve. */
  body: string;
  /** Optional footer line — small grey text under the body. */
  footer?: string | null;
  /** Up to 3 buttons. WhatsApp renders them stacked under the bubble. */
  buttons?: TemplateButton[];
  /** Sender name shown at the top of the phone — defaults to a generic
   *  business label when not passed. */
  senderName?: string;
  /** Direction. We default to RTL for Arabic templates but the operator
   *  can override (Meta supports both). */
  rtl?: boolean;
  /** Compact mode shrinks the phone for an inline edit-side-by-side layout. */
  compact?: boolean;
}

/**
 * Side-by-side preview of how a template will render in WhatsApp. The
 * design intentionally mirrors the real WhatsApp visual — green accent,
 * tail bubble, double-tick read receipt, sample variable placeholders —
 * so an operator catches "this looks bad" before submitting to Meta.
 *
 * Variable placeholders ({{1}}, {{2}}) are visualised as filled chips
 * so the operator sees the template's flow even before they pick what
 * each variable maps to. This is the same trick Twilio's template
 * studio uses — saves a "what does this actually look like?" dry-run.
 */
export function WhatsAppPhonePreview({
  header,
  headerFormat,
  headerMediaUrl,
  body,
  footer,
  buttons = [],
  senderName = "WhatsBit Business",
  rtl,
  compact = false,
}: Props) {
  const { colors: C, isDark } = useTheme();
  const { isAr } = useLocale();
  const direction = rtl ?? isAr;

  // Render template body with variable placeholders highlighted. Each
  // {{n}} becomes a styled span — readable but visually distinct so the
  // operator can spot exactly where data will land.
  const renderBody = (text: string) => {
    const parts = text.split(/(\{\{\d+\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/^\{\{(\d+)\}\}$/);
      if (match) {
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "0 6px",
              margin: "0 2px",
              borderRadius: 4,
              background: "rgba(37, 211, 102, 0.18)",
              color: "#075E54",
              fontFamily: "monospace",
              fontSize: "0.9em",
              fontWeight: 600,
            }}
          >
            {direction ? `[المتغيّر ${match[1]}]` : `[var ${match[1]}]`}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const phoneWidth = compact ? 280 : 320;
  const phoneBg = isDark ? "#0B141A" : "#E5DDD5";
  const headerBg = isDark ? "#1F2C34" : "#075E54";
  const bubbleBg = isDark ? "#005C4B" : "#DCF8C6";
  const bubbleText = isDark ? "#E9EDEF" : "#111";
  const metaText = isDark ? "#8696A0" : "#667781";

  return (
    <div
      style={{
        width: phoneWidth,
        margin: "0 auto",
        fontFamily: FONT_FAMILY,
      }}
      dir={direction ? "rtl" : "ltr"}
    >
      <div
        style={{
          fontSize: 11,
          color: C.t3,
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: 0.3,
        }}
      >
        {direction ? "معاينة واتساب" : "WhatsApp Preview"}
      </div>

      <div
        style={{
          background: phoneBg,
          borderRadius: 24,
          padding: 12,
          paddingTop: 0,
          border: `8px solid ${isDark ? "#222" : "#1F2C34"}`,
          minHeight: 380,
          position: "relative",
          // Subtle tiled pattern under the chat — WhatsApp's signature
          // "doodle" background is too noisy here, so we use a barely
          // visible repeating dot.
          backgroundImage: `radial-gradient(${isDark ? "#1A2C34" : "#D6CFC4"} 1px, transparent 1px)`,
          backgroundSize: "12px 12px",
        }}
      >
        {/* Status bar / business header */}
        <div
          style={{
            background: headerBg,
            margin: "0 -12px 12px",
            padding: "10px 14px",
            borderRadius: "16px 16px 0 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#075E54",
            }}
          >
            {senderName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {senderName}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
              {direction ? "متصل" : "online"}
            </div>
          </div>
        </div>

        {/* Message bubble */}
        <div
          style={{
            background: bubbleBg,
            borderRadius: direction ? "12px 0 12px 12px" : "0 12px 12px 12px",
            padding: "8px 10px 6px",
            maxWidth: "92%",
            marginBottom: 6,
            position: "relative",
            boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
          }}
        >
          {/*
            Header rendering. Three modes:
              1. Media (image/video/document) with a URL → render the
                 actual file in a 110px-high preview tile. Image uses
                 object-fit:cover so any aspect ratio looks reasonable.
              2. Media format set but URL missing → typed placeholder
                 (camera icon, etc.) so the operator sees the slot.
              3. Text header → green tinted band with the text.
          */}
          {(headerFormat === "image" || headerFormat === "video" || headerFormat === "document") && (
            <div
              style={{
                width: "100%",
                height: 110,
                borderRadius: 6,
                background: isDark ? "#1a2a30" : "#C8E6C9",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDark ? "#4a8a6a" : "#2E7D32",
                fontSize: 11,
                fontWeight: 600,
                gap: 6,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {headerMediaUrl && headerFormat === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerMediaUrl}
                  alt="header"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  // Fallback to typed placeholder when the URL fails
                  // (private bucket, expired signed URL, broken host).
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              {headerMediaUrl && headerFormat === "video" && (
                <video
                  src={headerMediaUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  playsInline
                />
              )}
              {headerMediaUrl && headerFormat === "document" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 28 }}>📄</span>
                  <a
                    href={headerMediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: isDark ? "#9DC0B3" : "#075E54", fontSize: 10, textDecoration: "underline" }}
                  >
                    {direction ? "افتح المستند" : "Open document"}
                  </a>
                </div>
              )}
              {!headerMediaUrl && (
                <>
                  <span style={{ fontSize: 22 }}>
                    {headerFormat === "image" ? "🖼" : headerFormat === "video" ? "🎬" : "📄"}
                  </span>
                  <span>
                    {headerFormat === "image"
                      ? (direction ? "صورة" : "Image")
                      : headerFormat === "video"
                      ? (direction ? "فيديو" : "Video")
                      : (direction ? "مستند" : "Document")}
                  </span>
                </>
              )}
            </div>
          )}
          {(headerFormat === "text" || (!headerFormat && header)) && header && (
            <div
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                background: isDark ? "#1a2a30" : "#C8E6C9",
                marginBottom: 8,
                color: isDark ? "#cfe8d8" : "#0E4A2E",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {header}
            </div>
          )}

          {/* Body */}
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.55,
              color: bubbleText,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {renderBody(body || "")}
          </div>

          {/* Footer — small grey line under body */}
          {footer && (
            <div
              style={{
                fontSize: 11,
                color: metaText,
                marginTop: 6,
              }}
            >
              {footer}
            </div>
          )}

          {/* Time + double-tick — same as a real WA message */}
          <div
            style={{
              fontSize: 9.5,
              color: metaText,
              textAlign: direction ? "left" : "right",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: direction ? "flex-start" : "flex-end",
              gap: 3,
            }}
          >
            <span>10:00</span>
            <span style={{ color: "#53BDEB", fontSize: 12 }}>✓✓</span>
          </div>
        </div>

        {/* Buttons stacked under the bubble */}
        {buttons.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxWidth: "92%",
            }}
          >
            {buttons.slice(0, 3).map((btn, i) => (
              <div
                key={i}
                style={{
                  background: isDark ? "#1F2C34" : "#FFF",
                  borderRadius: 8,
                  padding: "8px 12px",
                  textAlign: "center",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isDark ? "#53BDEB" : "#0077B6",
                  border: `1px solid ${isDark ? "#2A3942" : "#E0E0E0"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 11 }}>
                  {btn.kind === "url" ? "↗" : btn.kind === "phone" ? "☎" : "💬"}
                </span>
                {btn.text}
              </div>
            ))}
          </div>
        )}

        {/* Empty-body hint when the operator is starting fresh */}
        {!body && !header && (
          <div
            style={{
              padding: "30px 16px",
              textAlign: "center",
              fontSize: 12,
              color: C.t3,
              lineHeight: 1.6,
            }}
          >
            {direction
              ? "ابدأ بكتابة جسم الرسالة في الشكل الأيسر لرؤية المعاينة هنا"
              : "Start typing the body to see the preview here"}
          </div>
        )}
      </div>
    </div>
  );
}
