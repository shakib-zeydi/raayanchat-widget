import { useEffect, useState } from "react";
import { getEcho } from "../lib/echo";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + "/widget";

const initialWelcomeMessage: ChatMessage = {
  id: "welcome-msg",
  sender: "operator",
  text: "سلام! وقت بخیر. چطور می‌توانیم کمکتان کنیم؟",
};

export default function useWidget({ websiteID }: { websiteID: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // کلیدهای ذخیره‌سازی محلی برای هر سایت
  const visitorKey = `visitor_${websiteID}`;
  const convKey = `visitor_conv_${websiteID}`;
  const tokenKey = `visitor_token_${websiteID}`;
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(tokenKey); } catch { return null; }
  });
  const [messageError, setMessageError] = useState("");

  // خواندن اولیه از LocalStorage
  const [visitorPublicId, setVisitorPublicId] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined"
        ? (localStorage.getItem(tokenKey) ? localStorage.getItem(visitorKey) : null)
        : null;
    } catch {
      return null;
    }
  });

  const [conversationPublicId, setConversationPublicId] = useState<
    string | null
  >(() => {
    try {
      return typeof window !== "undefined"
        ? (localStorage.getItem(tokenKey) ? localStorage.getItem(convKey) : null)
        : null;
    } catch {
      return null;
    }
  });

  const [visitorStep, setVisitorStep] = useState<"form" | "chat">(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(tokenKey) && localStorage.getItem(visitorKey)
        ? "chat"
        : "form";
    } catch {
      return "form";
    }
  });

  const [isSubmittingVisitor, setIsSubmittingVisitor] = useState(false);
  const [visitorError, setVisitorError] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    initialWelcomeMessage,
  ]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(conversationPublicId));

  // ۱. فچ کردن تاریخچه پیام‌ها هنگام باز شدن مکالمه قبلی
  useEffect(() => {
    if (!visitorPublicId || !conversationPublicId || !token) {
      return;
    }

    let isCancelled = false;

    const loadHistory = async () => {
      try {
        let page = 1;
        let lastPage = 1;
        const rawList: ServerMessageItem[] = [];
        do {
        const res = await fetch(
          `${API_BASE_URL}/visitors/${encodeURIComponent(visitorPublicId)}/conversations/${encodeURIComponent(conversationPublicId)}/messages?per_page=100&page=${page}`,
          {
            credentials: "omit",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) throw new Error("خطا در دریافت پیام‌ها");

        const result = await res.json();

        if (Array.isArray(result.data?.data)) rawList.push(...result.data.data);
        lastPage = result.data?.meta?.last_page || 1;
        page++;
        } while (page <= lastPage && !isCancelled);

        if (!isCancelled && rawList.length > 0) {
          const mappedMessages: ChatMessage[] = rawList.map((item) => ({
            id: String(item.public_id || item.id),
            sender: item.sender === "operator" ? "operator" : "visitor",
            text: item.body || "",
            created_at: item.created_at,
          }));

          setMessages((previous) => {
            const ids = new Set(mappedMessages.map((message) => message.id));
            return [initialWelcomeMessage, ...mappedMessages, ...previous.filter((message) => message.id !== initialWelcomeMessage.id && !ids.has(message.id) && !message.id.startsWith("temp-"))];
          });
        }
      } catch (err) {
        console.warn("خطا در دریافت پیام‌ها:", err);
        if (!isCancelled) setMessageError("دریافت پیام‌ها انجام نشد.");
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();
    const timer = window.setInterval(() => void loadHistory(), 15000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [visitorPublicId, conversationPublicId, token]);

  // ۲. لیسنر سوکت (گوش دادن به پیام‌های جدید در کانال این مکالمه)
  useEffect(() => {
    if (!conversationPublicId || !token) {
      console.log("WS: conversationPublicId is null yet");
      return;
    }

    const echo = getEcho(token);

    if (!echo) {
      console.warn("WS: Echo instance not found");
      return;
    }

    const channel = echo.private(`conversation.${conversationPublicId}`);

    channel.listen(".SendMessage", (payload: SocketMessagePayload) => {
      const incomingMessage = payload.message;
      if (!incomingMessage) return;

      const incomingId = String(
        incomingMessage.public_id || incomingMessage.id,
      );

      setMessages((prev) => {
        // ۱. اگر پیام با همین ID دقیقاً در لیست وجود دارد، رد شو
        const existsById = prev.some((msg) => msg.id === incomingId);
        if (existsById) return prev;

        // ۲. اگر پیام از سمت ویزیتور است و یک پیام موقت (temp) با همین متن داریم، پیام موقت را آپدیت کن
        if (incomingMessage.sender === "visitor") {
          const tempIndex = prev.findIndex(
            (msg) =>
              msg.id.startsWith("temp-") && msg.text === incomingMessage.body,
          );

          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = {
              id: incomingId,
              sender: "visitor",
              text: incomingMessage.body,
              created_at: incomingMessage.created_at,
            };
            return updated;
          }
        }

        // ۳. پیام جدید (به خصوص پیام‌های اپراتور) را به انتهای لیست اضافه کن
        const newChatMsg: ChatMessage = {
          id: incomingId,
          sender: incomingMessage.sender,
          text: incomingMessage.body,
          created_at: incomingMessage.created_at,
        };

        return [...prev, newChatMsg];
      });
    });

    return () => {
      channel.stopListening(".SendMessage");
      echo.leave(`conversation.${conversationPublicId}`);
    };
  }, [conversationPublicId, token]);

  // ۳. ثبت بازدیدکننده (فرم ورود)
  const handleVisitorSubmit = async (formData: VisitorFormData) => {
    if (isSubmittingVisitor) return;

    if (!websiteID?.trim()) {
      setVisitorError("شناسه وب‌سایت معتبر نیست.");
      return;
    }

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

      const responseData = (await response
        .json()
        .catch(() => null)) as VisitorApiResponse | null;

      if (!response.ok || !responseData) {
        throw new Error(responseData?.message || "خطا در برقراری ارتباط");
      }

      const returnedVisitorId = responseData.data?.public_id;
      const returnedToken = responseData.data?.token;
      if (returnedVisitorId && typeof returnedToken === "string") {
        try {
          localStorage.setItem(visitorKey, returnedVisitorId);
          localStorage.setItem(tokenKey, returnedToken);
          localStorage.removeItem(convKey);
        } catch (e) {
          console.warn("Storage warning:", e);
        }
        setVisitorPublicId(returnedVisitorId);
        setToken(returnedToken);
        setConversationPublicId(null);
      } else {
        throw new Error("پاسخ سرور معتبر نیست.");
      }

      setVisitorStep("chat");
    } catch (err) {
      setVisitorError(
        err instanceof Error ? err.message : "خطا در ارسال اطلاعات",
      );
    } finally {
      setIsSubmittingVisitor(false);
    }
  };

  // ۴. ارسال پیام
  const handleSendMessage = async (text: string) => {
    if (!visitorPublicId || !token || isSendingMessage) return false;
    setMessageError("");

    // ثبت پیام خود ویزیتور به صورت خوش‌بینانه (Optimistic)
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempMessageId,
      sender: "visitor",
      text,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSendingMessage(true);

    try {
      if (!conversationPublicId) {
        // پیام اول: ایجاد مکالمه
        const response = await fetch(
          `${API_BASE_URL}/visitors/${encodeURIComponent(visitorPublicId)}/conversations`,
          {
            method: "POST",
            credentials: "omit",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: text }),
          },
        );

        const convData = (await response.json()) as ConversationApiResponse;

        if (response.ok && convData.data?.public_id) {
          const newConvId = convData.data.public_id;
          try {
            localStorage.setItem(convKey, newConvId);
          } catch (e) {
            console.warn(e);
          }
          setConversationPublicId(newConvId);
        } else {
          throw new Error(convData.message || "ارسال پیام انجام نشد.");
        }
      } else {
        // پیام‌های بعدی در مکالمه جاری
        const response = await fetch(
          `${API_BASE_URL}/visitors/${encodeURIComponent(
            visitorPublicId,
          )}/conversations/${encodeURIComponent(conversationPublicId)}/messages`,
          {
            method: "POST",
            credentials: "omit",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ body: text }),
          },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.data) throw new Error(result?.message || "ارسال پیام انجام نشد.");
        const item = result.data as ServerMessageItem;
        const id = String(item.public_id || item.id);
        setMessages((prev) => {
          const withoutTemp = prev.filter((message) => message.id !== tempMessageId);
          return withoutTemp.some((message) => message.id === id) ? withoutTemp : [...withoutTemp, { id, sender: "visitor", text: item.body || text, created_at: item.created_at }];
        });
      }
      return true;
    } catch (error) {
      console.error("Message send failure:", error);
      setMessages((prev) => prev.filter((message) => message.id !== tempMessageId));
      setMessageError(error instanceof Error ? error.message : "ارسال پیام انجام نشد.");
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

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
  };
}
