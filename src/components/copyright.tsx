interface IProps {
  themeColor: string;
}

export default function Copyright({ themeColor }: IProps) {
  return (
    <div dir="rtl" className="my-3 flex items-center justify-center gap-2.5">
      <span aria-hidden="true" className="h-px w-6 bg-gray-200" />

      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-gray-500">
        <span>قدرت گرفته از </span>

        <a
          href="https://raayanchat.ir"
          target="_blank"
          rel="noopener noreferrer"
          style={{ "--brand-color": themeColor } as React.CSSProperties}
          className="inline-flex items-center gap-1 rounded-sm font-semibold text-gray-700 hover:text-(--brand-color) hover:underline hover:underline-offset-2 focus-visible:outline focus-visible:outline-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-3.5 shrink-0"
          >
            <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
          </svg>
          رایان‌چت
        </a>
      </span>

      <span aria-hidden="true" className="h-px w-6 bg-gray-200" />
    </div>
  );
}
