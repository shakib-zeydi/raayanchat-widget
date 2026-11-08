import { useState, type ComponentProps } from "react";

interface IProps {
  themeColor: string;
  isSending: boolean;
  isClosed: boolean;
  onSend: (text: string) => Promise<boolean>;
}

export default function MessageInput({
  themeColor,
  isSending,
  isClosed,
  onSend,
}: IProps) {
  const [value, setValue] = useState("");

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> =
    async (event) => {
      event.preventDefault();

      const text = value.trim();

      if (!text || isSending || isClosed) return;

      if (await onSend(text)) {
        setValue("");
      }
    };

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white p-3">
      {isClosed ? (
        <div
          role="status"
          className="rounded-xl bg-gray-50 px-4 py-3 text-center"
        >
          <p className="text-xs font-semibold text-gray-700">
            این گفتگو پایان یافته است
          </p>

          <p className="mt-1 text-[11px] leading-6 text-gray-500">
            امکان ارسال پیام جدید در این گفتگو وجود ندارد.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            name="body"
            aria-label="متن پیام"
            placeholder="پیام خود را بنویسید..."
            value={value}
            disabled={isSending}
            onChange={(event) => setValue(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!value.trim() || isSending}
            style={{ backgroundColor: themeColor }}
            className="shrink-0 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSending ? "..." : "ارسال"}
          </button>
        </form>
      )}
    </div>
  );
}
