interface ConversationModeSelectorProps {
  themeColor: string;
  onSelect: (mode: ConversationMode) => void;
}

export default function ConversationModeSelector({
  themeColor,
  onSelect,
}: ConversationModeSelectorProps) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 overflow-y-auto bg-gray-50/70 p-4">
      <div className="mb-2 text-center">
        <h3 className="text-sm font-bold text-gray-800">
          چطور می‌توانیم کمکتان کنیم؟
        </h3>

        <p className="mt-2 text-xs leading-6 text-gray-500">
          روش گفت‌وگو را انتخاب کنید.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onSelect("ai")}
        className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-right transition hover:border-gray-400"
      >
        <span style={{ color: themeColor }} className="block text-sm font-bold">
          دستیار هوشمند
        </span>

        <span className="mt-2 block text-xs leading-6 text-gray-500">
          پاسخ‌گویی به پرسش‌های شما با هوش مصنوعی
        </span>
      </button>

      <button
        type="button"
        onClick={() => onSelect("human")}
        className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 text-right transition hover:border-gray-400"
      >
        <span style={{ color: themeColor }} className="block text-sm font-bold">
          گفت‌وگو با اپراتور
        </span>

        <span className="mt-2 block text-xs leading-6 text-gray-500">
          ارسال پیام برای تیم پشتیبانی
        </span>
      </button>
    </div>
  );
}
