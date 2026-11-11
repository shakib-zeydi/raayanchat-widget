import { useCallback, useState } from "react";

import useVisitorSession from "../hooks/use-visitor-session";

import AiChat from "./ai-chat";
import ChatHeader from "./chat-header";
import ChatIcon from "./chat-icon";
import ConversationModeSelector from "./conversation-mode-selector";
import HumanChat from "./human-chat";
import VisitorFormComponent from "./visitor-form";

interface WidgetProps {
  websiteId: string;
  themeColor?: string;
}

interface ConversationNavigation {
  activeMode: ConversationMode | null;
  visitedModes: ConversationMode[];
}

export default function Widget(props: WidgetProps) {
  // با تغییر سایت، نشست و تمام stateهای سایت قبلی کنار گذاشته شوند.
  return <WidgetContent key={props.websiteId} {...props} />;
}

function WidgetContent({ websiteId, themeColor = "#09c82c" }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [hasUnreadHumanMessage, setHasUnreadHumanMessage] = useState(false);

  const [navigation, setNavigation] = useState<ConversationNavigation>({
    activeMode: null,
    visitedModes: [],
  });

  const handleOperatorMessage = useCallback(() => {
    const isHumanChatVisible = isOpen && navigation.activeMode === "human";

    if (!isHumanChatVisible) {
      setHasUnreadHumanMessage(true);
    }
  }, [isOpen, navigation.activeMode]);

  function selectMode(mode: ConversationMode) {
    setNavigation((previous) => ({
      activeMode: mode,
      visitedModes: previous.visitedModes.includes(mode)
        ? previous.visitedModes
        : [...previous.visitedModes, mode],
    }));

    if (mode === "human") {
      setHasUnreadHumanMessage(false);
    }
  }

  function showModeSelector() {
    setNavigation((previous) => ({
      ...previous,
      activeMode: null,
    }));
  }

  function toggleChat() {
    const nextIsOpen = !isOpen;

    setIsOpen(nextIsOpen);

    if (nextIsOpen && navigation.activeMode === "human") {
      setHasUnreadHumanMessage(false);
    }
  }

  const { session, isSubmitting, error, submitVisitor } = useVisitorSession({
    websiteId,
  });

  return (
    <div
      className="rayan-widget-root select-none text-right font-sans"
      dir="rtl"
    >
      <div
        id="rayan-widget-panel"
        role="region"
        aria-label="گفت‌وگو با پشتیبانی"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed bottom-22 left-5 z-999999 flex h-125 w-90 max-w-[calc(100vw-2.5rem)] origin-bottom-left flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-90 opacity-0"
        }`}
      >
        <ChatHeader themeColor={themeColor} onClose={() => setIsOpen(false)} />

        {session ? (
          <ConversationScreens
            key={JSON.stringify([websiteId, session.publicId, session.token])}
            websiteId={websiteId}
            session={session}
            themeColor={themeColor}
            navigation={navigation}
            onSelectMode={selectMode}
            onBack={showModeSelector}
            onOperatorMessage={handleOperatorMessage}
            hasUnreadHumanMessage={hasUnreadHumanMessage}
          />
        ) : (
          <VisitorFormComponent
            themeColor={themeColor}
            isLoading={isSubmitting}
            errorMessage={error}
            onSubmit={submitVisitor}
          />
        )}
      </div>

      <button
        type="button"
        onClick={toggleChat}
        style={{ backgroundColor: themeColor }}
        aria-label={
          isOpen
            ? "بستن پنجرهٔ چت"
            : hasUnreadHumanMessage
              ? "بازکردن چت؛ پیام جدید از اپراتور دارید"
              : "بازکردن پنجرهٔ چت"
        }
        aria-expanded={isOpen}
        aria-controls="rayan-widget-panel"
        className="fixed bottom-5 left-5 z-999999 flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {hasUnreadHumanMessage && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex size-4"
          >
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />

            <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-red-500" />
          </span>
        )}

        <span
          aria-hidden="true"
          className={`absolute transition-all duration-300 ${
            isOpen
              ? "scale-100 rotate-0 text-lg font-bold opacity-100"
              : "scale-50 -rotate-90 opacity-0"
          }`}
        >
          ✕
        </span>

        <span
          aria-hidden="true"
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

interface ConversationScreensProps {
  websiteId: string;
  session: VisitorSession;
  themeColor: string;
  navigation: ConversationNavigation;
  onSelectMode: (mode: ConversationMode) => void;
  onBack: () => void;
  onOperatorMessage: (message: ChatMessage) => void;
  hasUnreadHumanMessage: boolean;
}

function ConversationScreens({
  websiteId,
  session,
  themeColor,
  navigation,
  onSelectMode,
  onBack,
  onOperatorMessage,
  hasUnreadHumanMessage,
}: ConversationScreensProps) {
  const hasVisitedAi = navigation.visitedModes.includes("ai");
  const hasVisitedHuman = navigation.visitedModes.includes("human");

  return (
    <>
      {hasUnreadHumanMessage && navigation.activeMode !== "human" && (
        <button
          type="button"
          onClick={() => onSelectMode("human")}
          className="shrink-0 cursor-pointer border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-right text-xs leading-6 text-amber-800"
        >
          پیام جدید از اپراتور دارید؛ برای مشاهده کلیک کنید.
        </button>
      )}

      {navigation.activeMode === null && (
        <ConversationModeSelector
          themeColor={themeColor}
          onSelect={onSelectMode}
        />
      )}

      {hasVisitedAi && (
        <div
          className={
            navigation.activeMode === "ai"
              ? "flex min-h-0 flex-1 flex-col"
              : "hidden"
          }
        >
          <AiChat
            websiteId={websiteId}
            session={session}
            themeColor={themeColor}
            onBack={onBack}
          />
        </div>
      )}

      {hasVisitedHuman && (
        <div
          className={
            navigation.activeMode === "human"
              ? "flex min-h-0 flex-1 flex-col"
              : "hidden"
          }
        >
          <HumanChat
            websiteId={websiteId}
            session={session}
            themeColor={themeColor}
            onBack={onBack}
            onOperatorMessage={onOperatorMessage}
          />
        </div>
      )}
    </>
  );
}
