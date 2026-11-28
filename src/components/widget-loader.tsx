import { useEffect, useState } from "react";
import {
  getWidgetSettings,
  type WidgetSettings,
} from "../services/widget-settings-api";
import WidgetContent from "./widget-content";

export default function WidgetLoader(props: WidgetProps) {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!props.websiteId.trim()) return;

    const controller = new AbortController();
    getWidgetSettings(props.websiteId, controller.signal)
      .then(setSettings)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load widget settings.", error);
          setLoadError(true);
        }
      });

    return () => controller.abort();
  }, [props.websiteId]);

  if (import.meta.env.DEV && loadError) {
    return (
      <div
        role="alert"
        dir="rtl"
        style={{ padding: "1rem", fontFamily: "sans-serif" }}
      >
        دریافت تنظیمات ویجت ناموفق بود. شناسه، وضعیت وب‌سایت، تطابق دامنه و
        اتصال API را بررسی کنید.
      </div>
    );
  }

  return settings ? <WidgetContent {...props} settings={settings} /> : null;
}
