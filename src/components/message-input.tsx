import { useState } from "react";

interface IProps {
  themeColor: string;
  isSending: boolean;
  onSend: (text: string) => void;
}

export default function MessageInput({
  themeColor,
  isSending,
  onSend,
}: IProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSending) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="پیام خود را بنویسید..."
          value={value}
          disabled={isSending}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!value.trim() || isSending}
          style={{ backgroundColor: themeColor }}
          className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSending ? "..." : "ارسال"}
        </button>
      </form>
    </div>
  );
}
