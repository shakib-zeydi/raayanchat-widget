import AiChat from "./ai-chat";
import ConversationModeSelector from "./conversation-mode-selector";
import HumanChat from "./human-chat";

interface ConversationScreensProps {
  websiteId: string;
  session: VisitorSession;
  themeColor: string;
  navigation: ConversationNavigation;
  onSelectMode: (mode: ConversationMode) => void;
  onBack: () => void;
  onOperatorMessage: (message: ChatMessage) => void;
  hasUnreadHumanMessage: boolean;
  isOpen: boolean;
}

export default function ConversationScreens({
  websiteId,
  session,
  themeColor,
  navigation,
  onSelectMode,
  onBack,
  onOperatorMessage,
  hasUnreadHumanMessage,
  isOpen,
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
            isActive={isOpen && navigation.activeMode === "human"}
          />
        </div>
      )}
    </>
  );
}
