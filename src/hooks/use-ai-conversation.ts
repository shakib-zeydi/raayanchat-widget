import { useEffect, useMemo, useRef, useState } from "react";

import { getAiMessages, sendAiMessage } from "../services/ai-conversation-api";

import { createWidgetStorage } from "../storage/widget-storage";

interface UseAiConversationOptions {
  websiteId: string;
  session: VisitorSession;
}

interface HistoryResult {
  requestKey: string;
  status: "ready" | "error";
  error: string;
}

export default function useAiConversation({
  websiteId,
  session,
}: UseAiConversationOptions) {
  const storage = useMemo(() => createWidgetStorage(websiteId), [websiteId]);

  const { publicId: visitorId, token } = session;

  const [conversationId, setConversationId] = useState<string | null>(() =>
    storage.readAiConversationId(visitorId),
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyResult, setHistoryResult] = useState<HistoryResult | null>(
    null,
  );

  const [historyVersion, setHistoryVersion] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const sendLockRef = useRef(false);
  const generationRef = useRef(0);

  // فقط برای بی‌اثر کردن پاسخ درخواست‌ها بعد از unmount.
  useEffect(() => {
    generationRef.current += 1;

    return () => {
      generationRef.current += 1;
    };
  }, []);

  const historyRequestKey = JSON.stringify([conversationId, historyVersion]);

  useEffect(() => {
    if (!conversationId) return;

    const controller = new AbortController();
    let disposed = false;

    async function loadHistory() {
      try {
        const result = await getAiMessages({
          session: {
            publicId: visitorId,
            token,
          },
          conversationId: conversationId!,
          limit: 30,
          signal: controller.signal,
        });

        if (disposed) return;

        // جایگزینی کامل، نه ادغام با شناسه‌های موقت.
        setMessages(result.messages);

        setHistoryResult({
          requestKey: historyRequestKey,
          status: "ready",
          error: "",
        });
      } catch (error) {
        if (disposed || controller.signal.aborted) return;

        setHistoryResult({
          requestKey: historyRequestKey,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "دریافت پیام‌ها انجام نشد.",
        });
      }
    }

    void loadHistory();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [visitorId, token, conversationId, historyRequestKey]);

  const hasCurrentHistoryResult =
    historyResult?.requestKey === historyRequestKey;

  const isLoadingHistory = Boolean(conversationId && !hasCurrentHistoryResult);

  const isHistoryReady =
    !conversationId ||
    (hasCurrentHistoryResult && historyResult?.status === "ready");

  const historyError =
    hasCurrentHistoryResult && historyResult?.status === "error"
      ? historyResult.error
      : "";

  async function sendMessage(rawText: string): Promise<boolean> {
    const text = rawText.trim();

    if (!text || sendLockRef.current || !isHistoryReady) {
      return false;
    }

    if (text.length > 4000) {
      setSendError("متن پیام نباید بیشتر از ۴۰۰۰ کاراکتر باشد.");
      return false;
    }

    sendLockRef.current = true;
    setIsSending(true);
    setSendError("");

    const generation = generationRef.current;
    const currentConversationId = conversationId;

    const visitorMessageId = `local-user-${crypto.randomUUID()}`;

    setMessages((previous) => [
      ...previous,
      {
        id: visitorMessageId,
        sender: "visitor",
        text,
      },
    ]);

    try {
      const result = await sendAiMessage({
        session: {
          publicId: visitorId,
          token,
        },
        conversationId: currentConversationId,
        message: text,
      });

      if (generation !== generationRef.current) {
        return false;
      }

      if (
        currentConversationId &&
        result.conversationId !== currentConversationId
      ) {
        throw new Error("شناسهٔ مکالمهٔ پاسخ با درخواست مطابقت ندارد.");
      }

      storage.saveAiConversationId(visitorId, result.conversationId);

      setMessages((previous) => [
        ...previous,
        {
          id: `local-assistant-${crypto.randomUUID()}`,
          sender: "assistant",
          text: result.content,
        },
      ]);

      if (!currentConversationId) {
        // شناسهٔ جدید باعث دریافت تاریخچهٔ واقعی می‌شود.
        setConversationId(result.conversationId);
      }

      return true;
    } catch (error) {
      if (generation !== generationRef.current) {
        return false;
      }

      setMessages((previous) =>
        previous.filter((message) => message.id !== visitorMessageId),
      );

      setSendError(
        error instanceof Error ? error.message : "ارسال پیام انجام نشد.",
      );

      return false;
    } finally {
      if (generation === generationRef.current) {
        sendLockRef.current = false;
        setIsSending(false);
      }
    }
  }

  function reloadHistory() {
    if (!conversationId || sendLockRef.current) {
      return;
    }

    setSendError("");
    setHistoryVersion((previous) => previous + 1);
  }

  return {
    conversationId,
    messages,
    isLoadingHistory,
    isSending,

    error: historyError || sendError,
    historyError,

    canSend: isHistoryReady && !isSending,

    sendMessage,
    reloadHistory,
  };
}
