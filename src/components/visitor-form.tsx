import { useState } from "react";

interface IProps {
  themeColor: string;
  isLoading: boolean;
  errorMessage: string;
  onSubmit: (data: VisitorFormData) => void;
}

const emptyForm: VisitorFormData = {
  first_name: "",
  last_name: "",
  email: "",
};

export default function VisitorFormComponent({
  themeColor,
  isLoading,
  errorMessage,
  onSubmit,
}: IProps) {
  const [form, setForm] = useState<VisitorFormData>(emptyForm);

  const updateField = (field: keyof VisitorFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-gray-50/70 p-4">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 text-center">
          <div
            style={{
              backgroundColor: `${themeColor}15`,
              color: themeColor,
            }}
            className="mx-auto mb-2.5 flex size-11 items-center justify-center rounded-full text-xl"
          >
            👋
          </div>
          <h4 className="text-xs font-bold text-gray-800">
            شروع گفتگو با پشتیبانی
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
            تکمیل اطلاعات اختیاری است ولی به ما در پیگیری بهتر کمک می‌کند.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-2.5"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              placeholder="نام"
              autoComplete="given-name"
              className="w-full rounded-lg border border-gray-200 bg-gray-50/40 px-3 py-2 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              placeholder="نام خانوادگی"
              autoComplete="family-name"
              className="w-full rounded-lg border border-gray-200 bg-gray-50/40 px-3 py-2 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
          </div>

          <div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="ایمیل شما (اختیاری)"
              autoComplete="email"
              dir="ltr"
              className="w-full rounded-lg border border-gray-200 bg-gray-50/40 px-3 py-2 text-left text-xs text-gray-800 outline-none transition placeholder:text-right placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-center text-[11px] leading-5 text-rose-600">
              {errorMessage}
            </p>
          )}

          <div className="pt-1.5 space-y-1.5">
            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: themeColor }}
              className="w-full rounded-lg py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? "در حال ثبت..." : "ورود به گفت‌وگو"}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSubmit(emptyForm)}
              className="w-full rounded-lg py-1.5 text-center text-[11px] font-medium text-gray-400 transition hover:text-gray-600 hover:bg-gray-100/60 disabled:cursor-not-allowed cursor-pointer"
            >
              ارسال پیام به عنوان ناشناس (بعداً)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
