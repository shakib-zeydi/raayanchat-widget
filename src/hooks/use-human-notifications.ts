import { useCallback, useEffect, useRef, useState } from "react";

import { getEcho } from "../lib/echo";
import { getHumanNotificationsStatus } from "../services/human-notifications";

interface NotificationsSnapshot {
  sessionKey: string;
  status: HumanNotificationsStatus;
}

interface NotificationsFailure {
  sessionKey: string;
  message: string;
}

export default function useHumanNotifications(session: VisitorSession | null) {
  const visitorPublicId = session?.publicId;
  const token = session?.token;

  const sessionKey =
    visitorPublicId && token ? JSON.stringify([visitorPublicId, token]) : null;

  const [snapshot, setSnapshot] = useState<NotificationsSnapshot | null>(null);

  const [failure, setFailure] = useState<NotificationsFailure | null>(null);

  const refreshRef = useRef<(() => void) | null>(null);

  // مرجع ثابت برای مصرف‌کننده؛ منطق واقعی متعلق به effect نشست است.
  const refresh = useCallback(() => {
    refreshRef.current?.();
  }, []);

  useEffect(() => {
    if (!visitorPublicId || !token || !sessionKey) {
      return;
    }

    const currentSession: VisitorSession = {
      publicId: visitorPublicId,
      token,
    };

    const currentSessionKey = sessionKey;
    const controller = new AbortController();

    let disposed = false;
    let loading = false;
    let reloadRequested = false;
    let revision = 0;
    let scheduledTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadStatus() {
      if (disposed) return;

      if (loading) {
        reloadRequested = true;
        return;
      }

      loading = true;
      const revisionAtStart = revision;

      try {
        const status = await getHumanNotificationsStatus(
          currentSession,
          controller.signal,
        );

        if (disposed) return;

        // اگر در طول درخواست تغییر جدیدی اعلام شد،
        // این پاسخ را به عنوان آخرین وضعیت اعمال نمی‌کنیم.
        if (revisionAtStart === revision) {
          setSnapshot({
            sessionKey: currentSessionKey,
            status,
          });

          setFailure(null);
        }
      } catch (error) {
        if (disposed || controller.signal.aborted) return;

        setFailure({
          sessionKey: currentSessionKey,
          message:
            error instanceof Error
              ? error.message
              : "دریافت وضعیت پیام‌ها انجام نشد.",
        });
      } finally {
        loading = false;

        if (!disposed && reloadRequested) {
          reloadRequested = false;
          scheduleRefresh();
        }
      }
    }

    function scheduleRefresh() {
      if (disposed || scheduledTimer !== undefined) return;

      // رویدادهای نزدیک به هم به یک درخواست تبدیل شوند.
      scheduledTimer = setTimeout(() => {
        scheduledTimer = undefined;
        void loadStatus();
      }, 150);
    }

    function invalidateStatus() {
      if (disposed) return;

      revision += 1;

      if (loading) {
        reloadRequested = true;
        return;
      }

      scheduleRefresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        invalidateStatus();
      }
    }

    function handleSubscriptionError(error: unknown) {
      if (disposed) return;

      console.warn("Visitor notification subscription failed:", error);

      setFailure({
        sessionKey: currentSessionKey,
        message: "اتصال زندهٔ اعلان‌ها برقرار نشد.",
      });
    }

    refreshRef.current = invalidateStatus;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let cleanupSocket: (() => void) | undefined;

    try {
      const echo = getEcho(token);

      if (echo) {
        const channel = echo.private(`visitor.${visitorPublicId}`);

        channel.listen(".VisitorConversationStateChanged", invalidateStatus);

        // بعد از subscription و subscription مجدد،
        // وضعیت از سرور بازیابی می‌شود.
        channel.subscribed(invalidateStatus);
        channel.error(handleSubscriptionError);

        cleanupSocket = () => {
          channel.stopListening(
            ".VisitorConversationStateChanged",
            invalidateStatus,
          );

          channel.subscription.unbind(
            "pusher:subscription_succeeded",
            invalidateStatus,
          );

          channel.subscription.unbind(
            "pusher:subscription_error",
            handleSubscriptionError,
          );
        };
      } else {
        handleSubscriptionError(new Error("Echo instance is unavailable"));
      }
    } catch (error) {
      handleSubscriptionError(error);
    }

    // حتی اگر اتصال زنده مشکل داشته باشد،
    // دریافت اولیهٔ وضعیت انجام می‌شود.
    scheduleRefresh();

    return () => {
      disposed = true;
      controller.abort();

      if (scheduledTimer !== undefined) {
        clearTimeout(scheduledTimer);
      }

      refreshRef.current = null;

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      cleanupSocket?.();

      // Echo مشترک است؛ disconnect یا leaveAll نمی‌کنیم.
    };
  }, [visitorPublicId, token, sessionKey]);

  // وضعیت نشست قبلی هرگز برای نشست جدید نمایش داده نشود.
  const status = snapshot?.sessionKey === sessionKey ? snapshot.status : null;

  const error = failure?.sessionKey === sessionKey ? failure.message : "";

  return {
    unreadCount: status?.unread_count ?? 0,
    conversations: status?.conversations ?? [],
    hasLoaded: status !== null,
    error,
    refresh,
  };
}
