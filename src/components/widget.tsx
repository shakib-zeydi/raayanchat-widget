import { useCallback, useEffect, useState } from "react";

import useVisitorSession from "../hooks/use-visitor-session";

import AiChat from "./ai-chat";
import ChatHeader from "./chat-header";
import ChatIcon from "./chat-icon";
import { getWidgetSettings, type WidgetSettings } from "../services/widget-settings-api";
import ConversationModeSelector from "./conversation-mode-selector";
import HumanChat from "./human-chat";
import VisitorFormComponent from "./visitor-form";
import useHumanNotifications from "../hooks/use-human-notifications";

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
  return <WidgetLoader key={props.websiteId} {...props} />;
}

function WidgetLoader(props: WidgetProps) {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!props.websiteId.trim()) return;

    const controller = new AbortController();
    getWidgetSettings(props.websiteId, controller.signal)
      .then(setSettings)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load widget settings.", error);
          setLoadError(true);
        }
      });

    return () => controller.abort();
  }, [props.websiteId]);

  if (import.meta.env.DEV && loadError) {
    return <div role="alert" dir="rtl" style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      دریافت تنظیمات ویجت ناموفق بود. شناسه، وضعیت وب‌سایت، تطابق دامنه و اتصال API را بررسی کنید.
    </div>;
  }

  return settings ? <WidgetContent {...props} settings={settings} /> : null;
}

function WidgetContent({ websiteId, themeColor: fallbackColor = "#09c82c", settings }: WidgetProps & { settings: WidgetSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const themeColor = settings.theme_color || fallbackColor;
  const positionX = settings.position_x;
  const positionY = settings.position_y;
  const offset = Math.min(500, Math.max(0, settings.offset_y));
  const horizontalOffset = Math.min(500, Math.max(0, settings.offset_x ?? 20));
  const horizontalPosition = `min(${horizontalOffset}px, max(0px, calc(100vw - 3.5rem)))`;
  const panelHorizontalPosition = `min(${horizontalPosition}, max(0px, calc(100vw - 18rem)))`;
  const verticalPosition = `min(${offset}px, max(0px, calc(100vh - 11rem)))`;
  const iconUrl = settings.icon?.type === "svg"
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(settings.icon.value)}`
    : settings.icon?.type === "image" || settings.icon?.type === "video" ? settings.icon.url : null;

  const { session, isSubmitting, error, submitVisitor } = useVisitorSession({
    websiteId,
  });

  const { unreadCount, refresh: refreshHumanNotifications } =
    useHumanNotifications(session ?? null);

  const hasUnreadHumanMessage = unreadCount > 0;

  const [navigation, setNavigation] = useState<ConversationNavigation>({
    activeMode: null,
    visitedModes: [],
  });

  const handleOperatorMessage = useCallback(() => {
    refreshHumanNotifications();
  }, [refreshHumanNotifications]);

  function selectMode(mode: ConversationMode) {
    setNavigation((previous) => ({
      activeMode: mode,
      visitedModes: previous.visitedModes.includes(mode)
        ? previous.visitedModes
        : [...previous.visitedModes, mode],
    }));
  }

  function showModeSelector() {
    setNavigation((previous) => ({
      ...previous,
      activeMode: null,
    }));
  }

  function toggleChat() {
    setIsOpen((previous) => !previous);
  }

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
        style={{
          [positionX]: panelHorizontalPosition,
          [positionY]: `calc(${verticalPosition} + 4.25rem)`,
          maxHeight: `calc(100vh - ${verticalPosition} - 5rem)`,
          maxWidth: `calc(100vw - ${panelHorizontalPosition})`,
          transformOrigin: `${positionY} ${positionX}`,
        }}
        className={`fixed z-999999 flex h-125 w-90 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
            isOpen={isOpen}
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
        style={{ backgroundColor: themeColor, [positionX]: horizontalPosition, [positionY]: verticalPosition }}
        aria-label={
          isOpen
            ? "بستن پنجرهٔ چت"
            : hasUnreadHumanMessage
              ? "بازکردن چت؛ پیام جدید از اپراتور دارید"
              : "بازکردن پنجرهٔ چت"
        }
        aria-expanded={isOpen}
        aria-controls="rayan-widget-panel"
        className="fixed z-999999 flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {hasUnreadHumanMessage && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 z-10 flex size-4"
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
          className={`absolute flex size-full items-center justify-center overflow-hidden rounded-full transition-all duration-300 ${
            isOpen
              ? "scale-50 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        >
          {iconUrl && !iconFailed && settings.icon?.type === "video" ? (
            <video src={iconUrl} autoPlay muted loop playsInline className="size-full object-cover" crossOrigin="anonymous" onError={() => setIconFailed(true)} />
          ) : iconUrl && !iconFailed ? (
            <img src={iconUrl} alt="" className={settings.icon?.type === "image" ? "size-full object-cover" : "size-7 object-contain"} crossOrigin="anonymous" referrerPolicy="origin" onError={() => setIconFailed(true)} />
          ) : <ChatIcon />}
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
  isOpen: boolean;
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
