import { useState } from "react";

import useHumanConversation from "../hooks/use-human-conversation";
import useHumanConversationRead from "../hooks/use-human-conversation-read";

import MessageInput from "./message-input";
import MessageList from "./message-list";

interface HumanChatProps {
  websiteId: string;
  session: VisitorSession;
  themeColor: string;
  onBack: () => void;
  onOperatorMessage?: (message: ChatMessage) => void;
  isActive: boolean;
}

export default function HumanChat(props: HumanChatProps) {
  const sessionKey = JSON.stringify([
    props.websiteId,
    props.session.publicId,
    props.session.token,
  ]);

  return <HumanChatContent key={sessionKey} {...props} />;
}

function HumanChatContent({
  websiteId,
  session,
  themeColor,
  onBack,
  onOperatorMessage,
  isActive,
}: HumanChatProps) {
  const [readCandidate, setReadCandidate] = useState<string | null>(null);

  const {
    conversationPublicId,
    messages,
    isLoadingHistory,
    isSendingMessage,
    messageError,
    handleSendMessage,
    isConversationClosed,
  } = useHumanConversation({
    websiteId,
    session,
    onOperatorMessage,
  });

  useHumanConversationRead({
    session,
    conversationPublicId,
    messagePublicId: readCandidate,
    isActive: isActive && !isLoadingHistory,
  });

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-2.5">
        <span className="text-xs font-semibold text-gray-700">
          گفت‌وگو با اپراتور
        </span>

        <button
          type="button"
          onClick={onBack}
          disabled={isSendingMessage || isLoadingHistory}
          className="cursor-pointer text-[11px] text-gray-500 transition hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          تغییر نوع گفتگو
        </button>
      </div>

      <MessageList
        messages={messages}
        themeColor={themeColor}
        isLoadingMessages={isLoadingHistory}
        isActive={isActive}
        onReadCandidate={setReadCandidate}
      />

      {messageError && (
        <p
          role="alert"
          className="shrink-0 px-4 py-2 text-xs leading-6 text-red-600"
        >
          {messageError}
        </p>
      )}

      <MessageInput
        themeColor={themeColor}
        isSending={isSendingMessage}
        isClosed={isConversationClosed}
        isDisabled={isLoadingHistory}
        onSend={handleSendMessage}
      />
    </>
  );
}
