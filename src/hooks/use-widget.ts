import { useEffect, useRef, useState } from "react";
import { getEcho } from "../lib/echo";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/widget`;

const initialWelcomeMessage: ChatMessage = {
  id: "welcome-msg",
  sender: "operator",
  text: "سلام! وقت بخیر. چطور می‌توانیم کمکتان کنیم؟",
};

interface ConversationState {
  public_id: string;
  status: string;
  closed_at: string | null;
}

interface ApiMessage {
  id?: number | string;
  public_id?: string;
  sender: "operator" | "visitor";
  body: string;
  created_at?: string;
}

interface ApiResponse {
  message?: string;
  code?: string;

  // قرارداد وضعیت گفتگو، توضیح پایین کد
  conversation?: ConversationState;

  data?: {
    public_id?: string;
    token?: string;
    status?: string;
    closed_at?: string | null;

    // پاسخ ارسال پیام
    id?: number | string;
    sender?: "operator" | "visitor";
    body?: string;
    created_at?: string;

    // پاسخ تاریخچه
    data?: ApiMessage[];
    meta?: {
      last_page?: number;
    };
  };
}

interface MessageEvent {
  message?: ApiMessage;
}

interface ConversationUpdatedEvent {
  conversation: ConversationState;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isClosed(conversation: ConversationState | null): boolean {
  return Boolean(
    conversation &&
    (conversation.closed_at ||
      conversation.status === "closed" ||
      conversation.status === "rejected"),
  );
}

function mapMessage(item: ApiMessage): ChatMessage | null {
  const id = item.public_id ?? item.id;

  if (id === undefined || id === null) return null;

  return {
    id: String(id),
    sender: item.sender,
    text: item.body ?? "",
    created_at: item.created_at,
  };
}

export default function useWidget({ websiteID }: { websiteID: string }) {
  const visitorKey = `visitor_${websiteID}`;
  const convKey = `visitor_conv_${websiteID}`;
  const tokenKey = `visitor_token_${websiteID}`;

  const [isOpen, setIsOpen] = useState(false);

  const [token, setToken] = useState<string | null>(() =>
    readStorage(tokenKey),
  );

  const [visitorPublicId, setVisitorPublicId] = useState<string | null>(() =>
    readStorage(tokenKey) ? readStorage(visitorKey) : null,
  );

  const [conversationPublicId, setConversationPublicId] = useState<
    string | null
  >(() => (readStorage(tokenKey) ? readStorage(convKey) : null));

  const [visitorStep, setVisitorStep] = useState<"form" | "chat">(() =>
    readStorage(tokenKey) && readStorage(visitorKey) ? "chat" : "form",
  );

  const [conversation, setConversation] = useState<ConversationState | null>(
    null,
  );

  const conversationRef = useRef<ConversationState | null>(null);
  const sendLockRef = useRef(false);
  const visitorLockRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    initialWelcomeMessage,
  ]);

  const [isSubmittingVisitor, setIsSubmittingVisitor] = useState(false);
  const [visitorError, setVisitorError] = useState("");

  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");

  const [historyPending, setIsLoadingHistory] = useState(
    Boolean(visitorPublicId && conversationPublicId && token),
  );

  const canLoadHistory = Boolean(
    visitorPublicId && conversationPublicId && token,
  );

  const isLoadingHistory = canLoadHistory && historyPending;

  function applyConversation(next: ConversationState) {
    conversationRef.current = next;
    setConversation(next);
  }

  function markConversationClosed(publicId: string) {
    const current = conversationRef.current;

    applyConversation({
      public_id: publicId,
      status: "closed",
      closed_at: current?.public_id === publicId ? current.closed_at : null,
    });
  }

  function authHeaders(currentToken: string): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",

      // باید با middleware احراز هویت ویجت هماهنگ باشد.
      Authorization: `Bearer ${currentToken}`,
    };
  }

  // تاریخچه و اتصال Reverb در یک effect:
  // بدون polling، با همگام‌سازی پس از subscription/reconnect.
  useEffect(() => {
    if (!visitorPublicId || !conversationPublicId || !token) {
      return;
    }

    let disposed = false;
    let loading = false;
    let reloadRequested = false;
    let stateRevision = 0;

    const controller = new AbortController();

    const currentVisitorId = visitorPublicId;
    const currentConversationId = conversationPublicId;
    const currentToken = token;

    function updateConversation(next?: ConversationState) {
      if (disposed || !next || next.public_id !== currentConversationId) {
        return;
      }

      conversationRef.current = next;
      setConversation(next);
    }

    async function loadHistory() {
      if (disposed) return;

      if (loading) {
        reloadRequested = true;
        return;
      }

      loading = true;
      const revisionAtStart = stateRevision;

      try {
        let page = 1;
        let lastPage = 1;
        const collected: ApiMessage[] = [];

        do {
          const response = await fetch(
            `${API_BASE_URL}/visitors/${encodeURIComponent(currentVisitorId)}` +
              `/conversations/${encodeURIComponent(currentConversationId)}` +
              `/messages?per_page=100&page=${page}`,
            {
              credentials: "omit",
              headers: authHeaders(currentToken),
              signal: controller.signal,
            },
          );

          const result = (await response
            .json()
            .catch(() => null)) as ApiResponse | null;

          if (!response.ok || !result) {
            throw new Error(result?.message || "دریافت پیام‌ها انجام نشد.");
          }

          // رویداد جدیدتر با پاسخ قدیمی تاریخچه بازنویسی نشود.
          if (stateRevision === revisionAtStart) {
            updateConversation(result.conversation);
          }

          if (Array.isArray(result.data?.data)) {
            collected.push(...result.data.data);
          }

          lastPage = result.data?.meta?.last_page ?? 1;
          page += 1;
        } while (page <= lastPage && !disposed);

        if (disposed) return;

        // انتظار: API صفحات را از قدیمی به جدید برگرداند.
        const mapped = collected
          .map(mapMessage)
          .filter((message): message is ChatMessage => message !== null);

        setMessages((previous) => {
          const byId = new Map<string, ChatMessage>();

          for (const message of mapped) {
            byId.set(message.id, message);
          }

          // پیام‌هایی که هم‌زمان از سوکت یا ارسال آمده‌اند حفظ شوند.
          for (const message of previous) {
            if (message.id !== initialWelcomeMessage.id) {
              byId.set(message.id, message);
            }
          }

          return [initialWelcomeMessage, ...byId.values()];
        });
      } catch (error) {
        if (disposed || controller.signal.aborted) return;

        console.warn("History loading failed:", error);

        setMessageError(
          error instanceof Error ? error.message : "دریافت پیام‌ها انجام نشد.",
        );
      } finally {
        loading = false;

        if (!disposed) {
          setIsLoadingHistory(false);

          if (reloadRequested) {
            reloadRequested = false;
            void loadHistory();
          }
        }
      }
    }

    function handleMessage(payload: MessageEvent) {
      if (disposed || !payload.message) return;

      const mapped = mapMessage(payload.message);

      if (!mapped) return;

      setMessages((previous) =>
        previous.some((message) => message.id === mapped.id)
          ? previous
          : [...previous, mapped],
      );
    }

    function handleConversationUpdated(payload: ConversationUpdatedEvent) {
      if (
        disposed ||
        payload.conversation?.public_id !== currentConversationId
      ) {
        return;
      }

      stateRevision += 1;
      updateConversation(payload.conversation);
    }

    function handleSubscribed() {
      void loadHistory();
    }

    function handleSubscriptionError(error: unknown) {
      if (disposed) return;

      console.warn("Widget subscription failed:", error);

      setMessageError("اتصال زنده برقرار نشد. لطفاً دوباره تلاش کنید.");
    }

    void loadHistory();

    let cleanupSocket: (() => void) | undefined;

    try {
      const echo = getEcho(currentToken);

      if (echo) {
        const channel = echo.private(`conversation.${currentConversationId}`);

        channel.listen(".SendMessage", handleMessage);

        // این رویداد باید در بک‌اند اضافه شود.
        channel.listen(".ConversationUpdated", handleConversationUpdated);

        channel.subscribed(handleSubscribed);
        channel.error(handleSubscriptionError);

        cleanupSocket = () => {
          channel.stopListening(".SendMessage", handleMessage);

          channel.stopListening(
            ".ConversationUpdated",
            handleConversationUpdated,
          );

          channel.subscription.unbind(
            "pusher:subscription_succeeded",
            handleSubscribed,
          );

          channel.subscription.unbind(
            "pusher:subscription_error",
            handleSubscriptionError,
          );

          // اتصال مشترک Echo را disconnect نمی‌کنیم.
        };
      } else {
        handleSubscriptionError(new Error("Echo instance is unavailable"));
      }
    } catch (error) {
      handleSubscriptionError(error);
    }

    return () => {
      disposed = true;
      controller.abort();
      cleanupSocket?.();
    };
  }, [visitorPublicId, conversationPublicId, token]);

  // ثبت بازدیدکننده
  async function handleVisitorSubmit(formData: VisitorFormData) {
    if (visitorLockRef.current) return;

    if (!websiteID.trim()) {
      setVisitorError("شناسه وب‌سایت معتبر نیست.");
      return;
    }

    visitorLockRef.current = true;
    setIsSubmittingVisitor(true);
    setVisitorError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/visitors/${encodeURIComponent(websiteID)}`,
        {
          method: "POST",
          credentials: "omit",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
          }),
        },
      );

      const result = (await response
        .json()
        .catch(() => null)) as ApiResponse | null;

      const returnedVisitorId = result?.data?.public_id;
      const returnedToken = result?.data?.token;

      if (!response.ok || !returnedVisitorId || !returnedToken) {
        throw new Error(result?.message || "ثبت اطلاعات انجام نشد.");
      }

      try {
        localStorage.setItem(visitorKey, returnedVisitorId);
        localStorage.setItem(tokenKey, returnedToken);
        localStorage.removeItem(convKey);
      } catch (error) {
        console.warn("Storage warning:", error);
      }

      setVisitorPublicId(returnedVisitorId);
      setToken(returnedToken);
      setConversationPublicId(null);

      conversationRef.current = null;
      setConversation(null);

      setMessages([initialWelcomeMessage]);
      setMessageError("");
      setVisitorStep("chat");
    } catch (error) {
      setVisitorError(
        error instanceof Error ? error.message : "خطا در ارسال اطلاعات",
      );
    } finally {
      visitorLockRef.current = false;
      setIsSubmittingVisitor(false);
    }
  }

  // ارسال پیام
  async function handleSendMessage(rawText: string): Promise<boolean> {
    const text = rawText.trim();

    if (!text || !visitorPublicId || !token || sendLockRef.current) {
      return false;
    }

    if (isClosed(conversationRef.current)) {
      setMessageError("این گفتگو بسته شده است.");
      return false;
    }

    // تا دریافت وضعیت مکالمه قبلی، ارسال انجام نشود.
    if (conversationPublicId && isLoadingHistory) {
      setMessageError("لطفاً تا دریافت اطلاعات گفتگو صبر کنید.");
      return false;
    }

    sendLockRef.current = true;
    setIsSendingMessage(true);
    setMessageError("");

    const tempId = `temp-${crypto.randomUUID()}`;
    const currentConversationId = conversationPublicId;

    setMessages((previous) => [
      ...previous,
      {
        id: tempId,
        sender: "visitor",
        text,
      },
    ]);

    try {
      const url = currentConversationId
        ? `${API_BASE_URL}/visitors/${encodeURIComponent(visitorPublicId)}` +
          `/conversations/${encodeURIComponent(currentConversationId)}/messages`
        : `${API_BASE_URL}/visitors/${encodeURIComponent(visitorPublicId)}` +
          `/conversations`;

      const response = await fetch(url, {
        method: "POST",
        credentials: "omit",
        headers: authHeaders(token),
        body: JSON.stringify(
          currentConversationId ? { body: text } : { message: text },
        ),
      });

      const result = (await response
        .json()
        .catch(() => null)) as ApiResponse | null;

      if (
        result?.conversation &&
        result.conversation.public_id === currentConversationId
      ) {
        applyConversation(result.conversation);
      }

      if (!response.ok || !result?.data) {
        const errorMessage = result?.message?.trim() ?? "";

        const conversationWasClosed =
          result?.code === "conversation_closed" ||
          errorMessage === "این گفتگو بسته شده است." ||
          errorMessage === "این گفتگو بسته شده است";

        if (currentConversationId && conversationWasClosed) {
          markConversationClosed(currentConversationId);
        }

        throw new Error(errorMessage || "ارسال پیام انجام نشد.");
      }

      if (!currentConversationId) {
        const newId = result.data.public_id;

        if (!newId) {
          throw new Error("پاسخ ایجاد گفتگو معتبر نیست.");
        }

        if (result.conversation?.public_id === newId) {
          applyConversation(result.conversation);
        } else if (typeof result.data.status === "string") {
          applyConversation({
            public_id: newId,
            status: result.data.status,
            closed_at: result.data.closed_at ?? null,
          });
        }

        try {
          localStorage.setItem(convKey, newId);
        } catch (error) {
          console.warn("Storage warning:", error);
        }

        // تاریخچهٔ گفتگوی جدید پیام اول را از سرور دریافت می‌کند.
        setMessages((previous) =>
          previous.filter((message) => message.id !== tempId),
        );

        setIsLoadingHistory(true);
        setConversationPublicId(newId);
      } else {
        const item = result.data;

        const mapped = mapMessage({
          id: item.id,
          public_id: item.public_id,
          sender: "visitor",
          body: item.body ?? text,
          created_at: item.created_at,
        });

        if (!mapped) {
          throw new Error("پاسخ پیام معتبر نیست.");
        }

        setMessages((previous) => {
          const withoutTemp = previous.filter(
            (message) => message.id !== tempId,
          );

          return withoutTemp.some((message) => message.id === mapped.id)
            ? withoutTemp
            : [...withoutTemp, mapped];
        });
      }

      return true;
    } catch (error) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== tempId),
      );

      setMessageError(
        error instanceof Error ? error.message : "ارسال پیام انجام نشد.",
      );

      return false;
    } finally {
      sendLockRef.current = false;
      setIsSendingMessage(false);
    }
  }

  return {
    isOpen,
    setIsOpen,
    visitorStep,
    isSubmittingVisitor,
    visitorError,
    handleVisitorSubmit,
    messages,
    isLoadingHistory,
    isSendingMessage,
    messageError,
    handleSendMessage,
    isConversationClosed: isClosed(conversation),
  };
}
