import ChatIcon from "./chat-icon";
import ChatHeader from "./chat-header";
import VisitorFormComponent from "./visitor-form";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import useWidget from "../hooks/use-widget";

interface IProps {
  websiteId: string;
  themeColor?: string;
}

export default function Widget({
  websiteId,
  themeColor = "#09c82c",
}: IProps) {
  const {
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
  } = useWidget({ websiteID: websiteId });

  return (
    <div
      className="rayan-widget-root select-none text-right font-sans"
      dir="rtl"
    >
      {/* پنجره چت */}
      <div
        className={`fixed bottom-22 left-5 z-999999 flex h-125 w-90 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl origin-bottom-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-90 opacity-0"
        }`}
      >
        <ChatHeader themeColor={themeColor} onClose={() => setIsOpen(false)} />

        {visitorStep === "form" ? (
          <VisitorFormComponent
            themeColor={themeColor}
            isLoading={isSubmittingVisitor}
            errorMessage={visitorError}
            onSubmit={handleVisitorSubmit}
          />
        ) : (
          <>
            <MessageList
              messages={messages}
              themeColor={themeColor}
              isLoadingMessages={isLoadingHistory}
            />
            <MessageInput
              themeColor={themeColor}
              isSending={isSendingMessage}
              onSend={handleSendMessage}
            />
          </>
        )}
      </div>

      {/* دکمه شناور */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ backgroundColor: themeColor }}
        aria-label="پشتیبانی چت"
        className="fixed bottom-5 left-5 z-999999 flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <span
          className={`absolute transition-all duration-300 ${
            isOpen
              ? "scale-100 rotate-0 text-lg font-bold opacity-100"
              : "scale-50 -rotate-90 opacity-0"
          }`}
        >
          ✕
        </span>
        <span
          className={`absolute transition-all duration-300 ${
            isOpen
              ? "scale-50 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        >
          <ChatIcon />
        </span>
      </button>
    </div>
  );
}
