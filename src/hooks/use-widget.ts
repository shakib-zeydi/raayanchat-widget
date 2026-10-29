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

  // خواندن اولیه از LocalStorage
  const [visitorPublicId, setVisitorPublicId] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem(visitorKey)
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
        ? localStorage.getItem(convKey)
        : null;
    } catch {
      return null;
    }
  });

  const [visitorStep, setVisitorStep] = useState<"form" | "chat">(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(visitorKey)
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ۱. فچ کردن تاریخچه پیام‌ها هنگام باز شدن مکالمه قبلی
  useEffect(() => {
    if (!visitorPublicId || !conversationPublicId) {
      return;
    }

    let isCancelled = false;

    const loadHistory = async () => {
      queueMicrotask(() => {
        if (!isCancelled) {
          setIsLoadingHistory(true);
        }
      });

      try {
        const res = await fetch(
          `${API_BASE_URL}/visitors/${encodeURIComponent(visitorPublicId)}/conversations/${encodeURIComponent(conversationPublicId)}/messages`,
          {
            credentials: "omit",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) return;

        const result = await res.json();

        const rawList: ServerMessageItem[] = Array.isArray(result.data?.data)
          ? result.data.data
          : Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : [];

        if (!isCancelled && rawList.length > 0) {
          const mappedMessages: ChatMessage[] = rawList.map((item) => ({
            id: String(item.public_id || item.id),
            sender: item.sender === "operator" ? "operator" : "visitor",
            text: item.body || "",
            created_at: item.created_at,
          }));

          setMessages([initialWelcomeMessage, ...mappedMessages]);
        }
      } catch (err) {
        console.warn("خطا در دریافت پیام‌ها:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [visitorPublicId, conversationPublicId]);

  // ۲. لیسنر سوکت (گوش دادن به پیام‌های جدید در کانال این مکالمه)
  useEffect(() => {
    if (!conversationPublicId) {
      console.log("WS: conversationPublicId is null yet");
      return;
    }

    const echo = getEcho();
    if (!echo) {
      console.warn("WS: Echo instance not found");
      return;
    }

    console.log(
      "WS: Subscribing to channel:",
      `conversation.${conversationPublicId}`,
    );
    const channel = echo.channel(`conversation.${conversationPublicId}`);

    channel.listen(".SendMessage", (payload: SocketMessagePayload) => {
      console.log("WS: Event received in widget! Payload:", payload);
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
  }, [conversationPublicId]);

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
      if (returnedVisitorId) {
        try {
          localStorage.setItem(visitorKey, returnedVisitorId);
          setVisitorPublicId(returnedVisitorId);
        } catch (e) {
          console.warn("Storage warning:", e);
        }
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
    if (!visitorPublicId || isSendingMessage) return;

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
            },
            body: JSON.stringify({ message: text }),
          },
        );

        const convData = (await response.json()) as ConversationApiResponse;

        if (response.ok && convData.data?.public_id) {
          const newConvId = convData.data.public_id;
          try {
            localStorage.setItem(convKey, newConvId);
            setConversationPublicId(newConvId);
          } catch (e) {
            console.warn(e);
          }
        }
      } else {
        // پیام‌های بعدی در مکالمه جاری
        await fetch(
          `${API_BASE_URL}/visitors/${encodeURIComponent(
            visitorPublicId,
          )}/conversations/${encodeURIComponent(conversationPublicId)}/messages`,
          {
            method: "POST",
            credentials: "omit",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ body: text }),
          },
        );
      }
    } catch (error) {
      console.error("Message send failure:", error);
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
    handleSendMessage,
  };
}
