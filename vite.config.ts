import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // جلوگیری از ارور process is not defined در مرورگر هنگام لود تک‌اسکریپت
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "RayanChatWidget",
      fileName: () => "widget.js",
      formats: ["iife"], // به صورت اسکریپت خوداجرا برای مرورگر
    },
    rollupOptions: {
      // در ویجت‌های مستقل، React باید داخل خود باندل اینکلود شود تا سایت کاربر نیازی به React نداشته باشد
      external: [],
    },
  },
});
