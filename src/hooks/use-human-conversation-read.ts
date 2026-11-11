import { useEffect, useRef } from "react";

import { markHumanConversationRead } from "../services/human-notifications";

interface UseHumanConversationReadOptions {
  session: VisitorSession;
  conversationPublicId: string | null;
  messagePublicId: string | null;
  isActive: boolean;
}

export default function useHumanConversationRead({
  session,
  conversationPublicId,
  messagePublicId,
  isActive,
}: UseHumanConversationReadOptions) {
  const acknowledgedRef = useRef(new Set<string>());

  const visitorPublicId = session.publicId;
  const token = session.token;

  useEffect(() => {
    if (!isActive || !conversationPublicId || !messagePublicId) {
      return;
    }

    const requestKey = JSON.stringify([
      visitorPublicId,
      token,
      conversationPublicId,
      messagePublicId,
    ]);

    if (acknowledgedRef.current.has(requestKey)) {
      return;
    }

    const controller = new AbortController();
    let disposed = false;

    // حضور بسیار گذرا در انتهای لیست درخواست نسازد.
    const timer = setTimeout(() => {
      if (document.visibilityState !== "visible") return;

      void markHumanConversationRead(
        {
          publicId: visitorPublicId,
          token,
        },
        conversationPublicId,
        messagePublicId,
        controller.signal,
      )
        .then(() => {
          if (!disposed) {
            acknowledgedRef.current.add(requestKey);
          }
        })
        .catch((error: unknown) => {
          if (disposed || controller.signal.aborted) return;

          // unread محلی را صفر نمی‌کنیم.
          // منبع حقیقت همچنان وضعیت سرور است.
          console.warn("Marking conversation as read failed:", error);
        });
    }, 400);

    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    visitorPublicId,
    token,
    conversationPublicId,
    messagePublicId,
    isActive,
  ]);
}
