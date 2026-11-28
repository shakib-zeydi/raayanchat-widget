import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { WidgetSettings } from "../services/widget-settings-api";
import useVisitorSession from "../hooks/use-visitor-session";
import useHumanNotifications from "../hooks/use-human-notifications";
import ChatHeader from "./chat-header";
import ConversationScreens from "./conversation-screens";
import VisitorFormComponent from "./visitor-form";
import ChatIcon from "./chat-icon";

export default function WidgetContent({
  websiteId,
  themeColor: fallbackColor = "#09c82c",
  settings,
}: WidgetProps & { settings: WidgetSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const [subtitleDimensions, setSubtitleDimensions] = useState({
    width: 0,
    height: 0,
  });
  const themeColor = settings.theme_color || fallbackColor;
  const positionX = settings.position_x;
  const positionY = settings.position_y;
  const offset = Math.min(500, Math.max(0, settings.offset_y));
  const buttonWidth = Math.min(200, Math.max(32, settings.button_width ?? 56));
  const buttonHeight = Math.min(
    200,
    Math.max(32, settings.button_height ?? 56),
  );
  const visibleWidth = `min(${buttonWidth}px, 100vw)`;
  const visibleHeight = `min(${buttonHeight}px, 100vh)`;
  const horizontalOffset = Math.min(500, Math.max(0, settings.offset_x ?? 20));
  const horizontalPosition = `min(${horizontalOffset}px, max(0px, calc(100vw - ${visibleWidth})))`;
  const panelHorizontalPosition = `min(${horizontalPosition}, max(0px, calc(100vw - 18rem)))`;
  const subtitle = settings.button_subtitle?.trim() || "";
  const subtitleSize = Math.min(
    32,
    Math.max(10, settings.button_subtitle_size ?? 12),
  );
  const subtitleColor = settings.button_subtitle_color ?? "#1f2937";
  const subtitleSpace = subtitle ? subtitleDimensions.height + 4 : 0;
  const buttonCenter =
    positionX === "left"
      ? `calc(${horizontalPosition} + ${visibleWidth} / 2)`
      : `calc(100vw - ${horizontalPosition} - ${visibleWidth} / 2)`;
  const subtitleLeft = `clamp(8px, calc(${buttonCenter} - ${subtitleDimensions.width / 2}px), max(8px, calc(100vw - ${subtitleDimensions.width + 8}px)))`;
  const baseVerticalPosition = `min(${offset}px, max(0px, calc(100vh - ${visibleHeight} - ${Math.max(120, positionY === "top" ? subtitleSpace : 0)}px)))`;
  const verticalPosition =
    subtitle && positionY === "bottom"
      ? `max(min(${subtitleSpace}px, max(0px, calc(100vh - ${visibleHeight}))), ${baseVerticalPosition})`
      : baseVerticalPosition;
  const panelGap = subtitle && positionY === "top" ? subtitleSpace + 12 : 12;
  const iconUrl =
    settings.icon?.type === "svg"
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(settings.icon.value)}`
      : settings.icon?.type === "image" || settings.icon?.type === "video"
        ? settings.icon.url
        : null;

  useLayoutEffect(() => {
    const element = subtitleRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSubtitleDimensions((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [subtitle]);

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
          [positionY]: `calc(${verticalPosition} + ${visibleHeight} + ${panelGap}px)`,
          maxHeight: `max(0px, calc(100vh - ${verticalPosition} - ${visibleHeight} - ${panelGap + 12}px))`,
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
        style={{
          backgroundColor: themeColor,
          width: visibleWidth,
          height: visibleHeight,
          [positionX]: horizontalPosition,
          [positionY]: verticalPosition,
        }}
        aria-label={
          (isOpen
            ? "بستن پنجرهٔ چت"
            : hasUnreadHumanMessage
              ? "بازکردن چت؛ پیام جدید از اپراتور دارید"
              : "بازکردن پنجرهٔ چت") + (subtitle ? `؛ ${subtitle}` : "")
        }
        aria-expanded={isOpen}
        aria-controls="rayan-widget-panel"
        className="fixed z-999999 flex cursor-pointer items-center justify-center rounded-full text-white shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
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
            <video
              src={iconUrl}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
              crossOrigin="anonymous"
              onError={() => setIconFailed(true)}
            />
          ) : iconUrl && !iconFailed ? (
            <img
              src={iconUrl}
              alt=""
              className={
                settings.icon?.type === "image"
                  ? "size-full object-cover"
                  : "size-1/2 object-contain"
              }
              crossOrigin="anonymous"
              referrerPolicy="origin"
              onError={() => setIconFailed(true)}
            />
          ) : (
            <ChatIcon className="size-1/2" />
          )}
        </span>
      </button>
      {subtitle && (
        <span
          ref={subtitleRef}
          aria-hidden="true"
          dir="auto"
          style={{
            color: subtitleColor,
            fontSize: subtitleSize,
            lineHeight: `${subtitleSize * 1.25}px`,
            left: subtitleLeft,
            width: "max-content",
            maxWidth: "min(192px, max(0px, calc(100vw - 16px)))",
            maxHeight: `max(0px, calc(100vh - ${visibleHeight} - 4px))`,
            ...(positionY === "top"
              ? { top: `calc(${verticalPosition} + ${visibleHeight} + 4px)` }
              : { bottom: `calc(${verticalPosition} - ${subtitleSpace}px)` }),
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
          className="rayan-widget-subtitle fixed z-999999 overflow-y-auto text-center"
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
