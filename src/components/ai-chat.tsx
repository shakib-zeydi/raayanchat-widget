import useAiConversation from "../hooks/use-ai-conversation";

import MessageInput from "./message-input";
import MessageList from "./message-list";

interface AiChatProps {
  websiteId: string;
  session: VisitorSession;
  themeColor: string;
  onBack: () => void;
}

export default function AiChat(props: AiChatProps) {
  // تغییر سایت یا نشست باید state چت قبلی را کامل کنار بگذارد.
  const sessionKey = JSON.stringify([
    props.websiteId,
    props.session.publicId,
    props.session.token,
  ]);

  return <AiChatContent key={sessionKey} {...props} />;
}

function AiChatContent({
  websiteId,
  session,
  themeColor,
  onBack,
}: AiChatProps) {
  const {
    messages,
    isLoadingHistory,
    isSending,
    error,
    historyError,
    canSend,
    sendMessage,
    reloadHistory,
  } = useAiConversation({
    websiteId,
    session,
  });

  const isBusy = isSending || isLoadingHistory;

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-2.5">
        <span className="text-xs font-semibold text-gray-700">
          دستیار هوشمند
        </span>

        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="cursor-pointer text-[11px] text-gray-500 transition hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          تغییر نوع گفتگو
        </button>
      </div>

      {!isLoadingHistory && messages.length === 0 && !historyError && (
        <div className="shrink-0 bg-gray-50/60 px-4 pt-4">
          <p className="rounded-xl border border-gray-100 bg-white p-3 text-xs leading-6 text-gray-600">
            سلام! من دستیار هوشمند هستم. چطور می‌توانم کمکتان کنم؟
          </p>
        </div>
      )}

      <MessageList
        messages={messages}
        themeColor={themeColor}
        isLoadingMessages={isLoadingHistory}
      />

      {isSending && (
        <p
          role="status"
          className="shrink-0 px-4 py-2 text-[11px] text-gray-500"
        >
          دستیار در حال آماده‌کردن پاسخ است...
        </p>
      )}

      {error && (
        <div className="shrink-0 space-y-2 px-4 py-2">
          <p role="alert" className="text-xs leading-6 text-red-600">
            {error}
          </p>

          {historyError && (
            <button
              type="button"
              onClick={reloadHistory}
              disabled={isBusy}
              className="cursor-pointer text-xs font-medium text-gray-700 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              دریافت دوبارهٔ پیام‌ها
            </button>
          )}
        </div>
      )}

      <MessageInput
        themeColor={themeColor}
        isSending={isSending}
        isClosed={false}
        isDisabled={!canSend}
        onSend={sendMessage}
      />
    </>
  );
}
