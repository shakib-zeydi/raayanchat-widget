import { useEffect, useRef } from "react";
import ChatIcon from "./chat-icon";

interface IProps {
  messages: ChatMessage[];
  themeColor: string;
  isLoadingMessages?: boolean;
}

export default function MessageList({
  messages,
  themeColor,
  isLoadingMessages,
}: IProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // اسکرول خودکار به انتهای پیام‌ها
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 p-4 text-xs">
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
            {!isUser && ( // اگر اپراتور بود آواتار نمایش داده شود
              <div
                style={{ backgroundColor: themeColor }}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[10px]"
              >
                <ChatIcon />
              </div>
            )}

            <div
              style={isUser ? { backgroundColor: themeColor } : undefined}
              className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ... ${
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
      <div ref={bottomRef} />
    </div>
  );
}
