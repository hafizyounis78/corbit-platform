"use client";

/**
 * In-product API tester for the public REST API (/api/v1).
 *
 * Solves the chicken-and-egg of "tenant generates a key but has no
 * terminal to test it with" — instead of telling them to install
 * curl/Postman/etc., we ship a tiny tester right where they made
 * the key. Three endpoints supported (matching what the public
 * controller actually exposes):
 *
 *   GET  /api/v1/contacts
 *   GET  /api/v1/conversations
 *   POST /api/v1/messages
 *
 * The key is held only in component state — never persisted to
 * localStorage or sent anywhere except the live request. Closing
 * the modal forgets it.
 *
 * If the parent passes prefilledKey (from the post-create reveal
 * modal), we drop straight into the tester with the key filled in
 * so the operator can verify their fresh key in one click.
 */

import { useState, useMemo } from "react";
import { Modal, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";

// Public API host — branded subdomain that fronts the same backend.
// Kept distinct from NEXT_PUBLIC_API_URL (the internal SPA<->Laravel
// channel) because we want tenants to see and document the clean
// `api.whatsbit.corbit.sa` URL, not the implementation-detail
// backend hostname. Env override (NEXT_PUBLIC_PUBLIC_API_URL) lets
// staging/preview environments point at a different host without
// a code change.
const API_BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL
  ?? "https://api.whatsbit.corbit.sa";

type EndpointKey = "get_contacts" | "get_conversations" | "post_message";

interface Endpoint {
  key: EndpointKey;
  method: "GET" | "POST";
  path: string;
  label_ar: string;
  label_en: string;
  desc_ar: string;
  desc_en: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    key: "get_contacts",
    method: "GET",
    path: "/api/v1/contacts",
    label_ar: "جلب جهات الاتصال",
    label_en: "List contacts",
    desc_ar: "يجلب أوّل 5 جهات اتصال (للتأكّد من المصادقة).",
    desc_en: "Fetches the first 5 contacts (verifies authentication).",
  },
  {
    key: "get_conversations",
    method: "GET",
    path: "/api/v1/conversations",
    label_ar: "جلب المحادثات المفتوحة",
    label_en: "List open conversations",
    desc_ar: "يجلب أوّل 5 محادثات بحالة open.",
    desc_en: "Fetches the first 5 conversations with status=open.",
  },
  {
    key: "post_message",
    method: "POST",
    path: "/api/v1/messages",
    label_ar: "إرسال رسالة (يرسل فعلياً!)",
    label_en: "Send a message (actually sends!)",
    desc_ar: "⚠️ يرسل رسالة واتساب حقيقيّة. استخدم رقم تختبره أنت.",
    desc_en: "⚠️ Sends a real WhatsApp message. Use a number you control.",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  prefilledKey?: string;
}

export function ApiTesterModal({ open, onClose, prefilledKey }: Props) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  const [key, setKey] = useState("");
  const [endpoint, setEndpoint] = useState<EndpointKey>("get_contacts");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("مرحبا من API");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    body: any;
    durationMs: number;
  } | null>(null);

  // When the parent toggles open with a prefilled key (right after
  // create), seed the input. Each open with a new prefilled key
  // resets the result so the operator isn't looking at stale data.
  useMemo(() => {
    if (open && prefilledKey) {
      setKey(prefilledKey);
      setResult(null);
    }
  }, [open, prefilledKey]);

  const current = ENDPOINTS.find((e) => e.key === endpoint)!;

  const fullUrl = useMemo(() => {
    let url = `${API_BASE}${current.path}`;
    if (current.method === "GET") {
      url += current.key === "get_conversations" ? "?status=open&limit=5" : "?limit=5";
    }
    return url;
  }, [current]);

  const handleClose = () => {
    // Forget the key + result on close — never lingers.
    setKey("");
    setResult(null);
    setPhone("");
    setText("مرحبا من API");
    onClose();
  };

  const run = async () => {
    if (!key.trim()) return;

    setRunning(true);
    setResult(null);

    const startedAt = performance.now();

    try {
      const headers: Record<string, string> = {
        "Authorization": "Bearer " + key.trim(),
        "Accept": "application/json",
      };

      let body: string | undefined;

      if (current.method === "POST") {
        headers["Content-Type"] = "application/json";

        if (current.key === "post_message") {
          const cleanPhone = phone.replace(/[^0-9]/g, "");
          if (cleanPhone.length < 8) {
            setResult({
              status: 0,
              body: { error: isAr ? "أدخل رقم جوال صحيح" : "Enter a valid phone number" },
              durationMs: 0,
            });
            setRunning(false);
            return;
          }
          body = JSON.stringify({ to: cleanPhone, text: text.trim() || "test" });
        }
      }

      const res = await fetch(fullUrl, {
        method: current.method,
        headers,
        body,
      });

      const ct = res.headers.get("content-type") ?? "";
      const parsed = ct.includes("application/json")
        ? await res.json()
        : { raw: await res.text() };

      setResult({
        status: res.status,
        body: parsed,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (e: any) {
      setResult({
        status: 0,
        body: { error: e?.message ?? "Network error" },
        durationMs: Math.round(performance.now() - startedAt),
      });
    } finally {
      setRunning(false);
    }
  };

  const statusColor =
    !result ? C.t2 :
    result.status === 0 ? C.err :
    result.status >= 200 && result.status < 300 ? "#10b981" :
    result.status >= 400 && result.status < 500 ? "#f59e0b" :
    C.err;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isAr ? "اختبار مفتاح API" : "API Key Tester"}
      submitLabel={running ? (isAr ? "جاري التشغيل..." : "Running...") : (isAr ? "تشغيل" : "Run")}
      onSubmit={run}
      submitLoading={running}
      submitDisabled={running || !key.trim()}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* API Key field */}
        <div>
          <label style={labelStyle(C)}>
            {isAr ? "مفتاح API" : "API Key"} <span style={{ color: C.err }}>*</span>
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk_live_corbit_..."
            style={{ ...inputStyle(C), fontFamily: "monospace", fontSize: 12 }}
          />
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
            {isAr
              ? "المفتاح يُستخدم لهذا الاختبار فقط ولا يُحفظ في المتصفّح."
              : "The key is used for this test only — nothing is stored client-side."}
          </div>
        </div>

        {/* Endpoint selector */}
        <div>
          <label style={labelStyle(C)}>{isAr ? "العمليّة" : "Endpoint"}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ENDPOINTS.map((ep) => {
              const active = ep.key === endpoint;
              return (
                <button
                  key={ep.key}
                  type="button"
                  onClick={() => { setEndpoint(ep.key); setResult(null); }}
                  style={{
                    textAlign: isAr ? "right" : "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${active ? C.pri : C.brd}`,
                    background: active ? `${C.pri}10` : C.inp,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge color={ep.method === "GET" ? "#3b82f6" : "#10b981"}>{ep.method}</Badge>
                    <strong style={{ fontSize: 13, color: C.txt }}>
                      {isAr ? ep.label_ar : ep.label_en}
                    </strong>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>
                    {isAr ? ep.desc_ar : ep.desc_en}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* POST /messages extra fields */}
        {endpoint === "post_message" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, border: `1px solid ${C.brd}`, borderRadius: 8 }}>
            <div>
              <label style={labelStyle(C)}>
                {isAr ? "رقم الجوال (بدون +)" : "Phone (without +)"} <span style={{ color: C.err }}>*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="966500000000"
                style={inputStyle(C)}
              />
            </div>
            <div>
              <label style={labelStyle(C)}>{isAr ? "نص الرسالة" : "Message text"}</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                style={{ ...inputStyle(C), resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          </div>
        )}

        {/* Request preview */}
        <div>
          <label style={labelStyle(C)}>{isAr ? "الطلب" : "Request"}</label>
          <pre style={previewStyle(C)}>
{current.method} {fullUrl}
Authorization: Bearer {key ? key.substring(0, 20) + "…" : "<key>"}
{current.method === "POST" && endpoint === "post_message"
  ? `Content-Type: application/json\n\n${JSON.stringify({ to: phone || "966...", text }, null, 2)}`
  : ""}
          </pre>
        </div>

        {/* Result */}
        {result && (
          <div>
            <label style={labelStyle(C)}>
              {isAr ? "النتيجة" : "Response"} —{" "}
              <span style={{ color: statusColor, fontWeight: 700 }}>
                {result.status === 0
                  ? (isAr ? "خطأ شبكة" : "Network error")
                  : `${result.status}`}
              </span>
              {" "}
              <span style={{ color: C.t2, fontWeight: 400, fontSize: 11 }}>
                ({result.durationMs}ms)
              </span>
            </label>
            <pre style={{ ...previewStyle(C), maxHeight: 240, overflow: "auto" }}>
{JSON.stringify(result.body, null, 2)}
            </pre>
            {result.status >= 200 && result.status < 300 && (
              <div style={{ marginTop: 6, fontSize: 11.5, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="check" size={12} />
                {isAr ? "نجح الطلب — مفتاحك يعمل صحّ." : "Success — your key works correctly."}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function labelStyle(C: any): React.CSSProperties {
  return {
    display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6,
  };
}

function inputStyle(C: any): React.CSSProperties {
  return {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
    fontSize: 13, outline: "none",
  };
}

function previewStyle(C: any): React.CSSProperties {
  return {
    margin: 0,
    padding: 12,
    borderRadius: 8,
    background: C.inp,
    border: `1px solid ${C.brd}`,
    color: C.txt,
    fontSize: 11.5,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    direction: "ltr",
    textAlign: "left",
  };
}
