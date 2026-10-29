import ChatIcon from "./chat-icon";

interface IProps {
  themeColor: string;
  onClose: () => void;
}

export default function ChatHeader({ themeColor, onClose }: IProps) {
  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="flex items-center justify-between p-4 text-white shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 items-center justify-center rounded-full bg-white/20 text-lg">
          <ChatIcon />
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold leading-tight">پشتیبانی آنلاین</h3>
          <p className="mt-0.5 text-xs text-white/80">پاسخگوی سوالات شما هستیم</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="بستن چت"
        className="flex size-8 items-center justify-center rounded-full bg-black/10 text-white/80 transition-colors hover:bg-black/20 hover:text-white cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
