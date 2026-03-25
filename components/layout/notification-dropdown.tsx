"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { useNotifications } from "@/lib/api/hooks";
import api from "@/lib/api/client";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { colors: C } = useTheme();
  const { t, rtl } = useLocale();
  const router = useRouter();
  const { data: notifData, isLoading, mutate } = useNotifications();

  const mockNotifications = [
    { id: "mock-1", title: t("lowBal"), message: t("lowBalM"), icon: "wallet", color: C.warn, time: "5m", action_url: "/billing" },
    { id: "mock-2", title: t("newMsg"), message: t("newMsgB"), icon: "msg", color: C.info, time: "12m", action_url: "/inbox" },
    { id: "mock-3", title: t("campDone"), message: t("campDoneM"), icon: "rocket", color: C.ok, time: "1h", action_url: "/campaigns" },
  ];

  const apiNotifications = Array.isArray(notifData) ? notifData : notifData?.data ?? [];
  const notifications = apiNotifications.length > 0
    ? apiNotifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message || n.body,
        icon: n.icon || "bell",
        color: n.color || C.info,
        time: n.time || n.created_at_human || "",
        action_url: n.action_url || "/",
        is_read: n.is_read ?? false,
      }))
    : mockNotifications;

  const handleNotificationClick = async (notification: any) => {
    if (notification.id && !String(notification.id).startsWith("mock-")) {
      try {
        await api.post(`/notifications/${notification.id}/read`);
        mutate();
      } catch {
        // Silently fail - navigation still happens
      }
    }
    router.push(notification.action_url);
    onClose();
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      mutate();
    } catch {
      // Silently fail
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        ...(rtl ? { left: 0 } : { right: 0 }),
        width: 320,
        background: C.card,
        borderRadius: 14,
        border: "1px solid " + C.brd,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid " + C.brd,
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{t("notif")}</span>
        <button
          onClick={handleMarkAllRead}
          style={{
            background: "none",
            border: "none",
            color: C.pri,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 6,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.pri + "15"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
        >
          {rtl ? "قراءة الكل" : "Mark all read"}
        </button>
      </div>
      {isLoading ? (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            fontSize: 12,
            color: C.t3,
          }}
        >
          Loading...
        </div>
      ) : (
        notifications.map((n: any, i: number) => (
          <div
            key={n.id || i}
            onClick={() => handleNotificationClick(n)}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid " + C.brdL,
              display: "flex",
              gap: 10,
              cursor: "pointer",
              transition: "background 0.15s",
              opacity: n.is_read ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.inp; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: n.color + "15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: n.color,
              }}
            >
              <Icon name={n.icon} size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>
                {n.message}
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>
              {n.time}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
