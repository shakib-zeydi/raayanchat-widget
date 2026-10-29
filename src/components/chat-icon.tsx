export default function ChatIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3C6.477 3 2 6.944 2 11.808c0 2.213.927 4.24 2.477 5.792L3.06 20.73a.75.75 0 0 0 .973.928l4.032-1.633A11.36 11.36 0 0 0 12 20.615c5.523 0 10-3.943 10-8.807C22 6.944 17.523 3 12 3zm-4 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  );
}
