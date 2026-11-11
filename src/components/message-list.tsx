import { useEffect, useRef } from "react";

import ChatIcon from "./chat-icon";

interface IProps {
  messages: ChatMessage[];
  themeColor: string;
  isLoadingMessages?: boolean;

  // برای استفاده‌های فعلی، مثل AI، سازگار باقی می‌ماند.
  isActive?: boolean;

  onReadCandidate?: (messagePublicId: string | null) => void;
}

export default function MessageList({
  messages,
  themeColor,
  isLoadingMessages = false,
  isActive = true,
  onReadCandidate,
}: IProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const shouldFollowBottomRef = useRef(true);

  // فقط وقتی کاربر نزدیک انتهای گفتگو بوده،
  // با اضافه‌شدن پیام او را به انتها می‌بریم.
  useEffect(() => {
    if (!isActive || !shouldFollowBottomRef.current) return;

    const container = containerRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isActive, isLoadingMessages]);

  useEffect(() => {
    if (!onReadCandidate) return;

    onReadCandidate(null);

    if (!isActive || isLoadingMessages) return;

    const container = containerRef.current;
    const bottom = bottomRef.current;

    if (!container || !bottom) return;

    // پیام خوشامد و پیام‌های فاقد public_id قابل ثبت نیستند.
    let lastOperatorPublicId: string | null = null;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];

      if (message.sender === "operator" && message.publicId) {
        lastOperatorPublicId = message.publicId;
        break;
      }
    }

    if (!lastOperatorPublicId) return;

    let isBottomVisible = false;

    function publishCandidate() {
      const canRead = isBottomVisible && document.visibilityState === "visible";

      onReadCandidate?.(canRead ? lastOperatorPublicId : null);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        isBottomVisible = Boolean(
          entry?.isIntersecting && entry.intersectionRatio >= 0.99,
        );

        publishCandidate();
      },
      {
        root: container,
        threshold: [0, 0.99, 1],
      },
    );

    observer.observe(bottom);

    document.addEventListener("visibilitychange", publishCandidate);

    return () => {
      observer.disconnect();

      document.removeEventListener("visibilitychange", publishCandidate);

      onReadCandidate?.(null);
    };
  }, [messages, isActive, isLoadingMessages, onReadCandidate]);

  function handleScroll() {
    const container = containerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldFollowBottomRef.current = distanceFromBottom < 64;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50/60 p-4 text-xs"
    >
      {isLoadingMessages && (
        <div className="py-2 text-center text-[11px] text-gray-400">
          در حال بارگذاری پیام‌ها...
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.sender === "visitor";

        return (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${
              isUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {!isUser && (
              <div
                style={{ backgroundColor: themeColor }}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] text-white"
              >
                <ChatIcon />
              </div>
            )}

            <div
              style={isUser ? { backgroundColor: themeColor } : undefined}
              className={`max-w-[75%] whitespace-pre-wrap wrap-break-word rounded-2xl px-3.5 py-2.5 leading-6 ${
                isUser
                  ? "rounded-bl-xs text-white"
                  : "rounded-br-xs border border-gray-100 bg-white text-gray-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} className="h-px" aria-hidden="true" />
    </div>
  );
}
