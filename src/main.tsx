import { createRoot } from "react-dom/client";
import Widget from "./components/widget";
import widgetCss from "./assets/css/index.css?inline";

function injectFontToHead() {
  const FONT_ID = "rayan-chat-font";
  if (document.getElementById(FONT_ID)) return;

  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  // یا لینک CDN وزیرمتن یا آدرس vazirmatn.css روی هاست خودتان:
  link.href =
    "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css";
  document.head.appendChild(link);
}

function initWidget() {
  // جلوگیری از ایجاد چندباره ویجت
  if (document.getElementById("rayan-chat-container")) return;

  // ۱. فونت به هد صفحه اصلی تزریق شود
  injectFontToHead();

  // پیدا کردن اسکریپتی که خود کاربر گذاشته تا تنظیمات را بخوانیم
  const currentScript =
    document.currentScript || document.querySelector("script[data-website-id]");

  const websiteId = currentScript?.getAttribute("data-website-id") || "01m616eq1q83weekt4eeecc4p2";
  const themeColor =
    currentScript?.getAttribute("data-theme-color") || "#09c82c";

  // ۱. ساخت کانتینر در انتهای صفحه کاربر
  const container = document.createElement("div");
  container.id = "rayan-chat-container";
  document.body.appendChild(container);

  // ۲. ساخت Shadow DOM برای محافظت از استایل‌ها
  const shadowRoot = container.attachShadow({ mode: "open" });

  // ۳. تزریق استایل‌های ویجت به درون Shadow Root
  const styleTag = document.createElement("style");
  styleTag.textContent = widgetCss;
  shadowRoot.appendChild(styleTag);

  // ۴. جایگاهی برای رندر ریکت داخل Shadow DOM
  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  // ۵. مونت کردن ریکت
  const root = createRoot(mountPoint);
  root.render(<Widget websiteId={websiteId} themeColor={themeColor} />);
}

// اجرا بعد از لود کامل صفحه یا بلافاصله
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidget);
} else {
  initWidget();
}
