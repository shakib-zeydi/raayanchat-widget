import { useMemo, useRef, useState } from "react";

import { registerVisitor } from "../services/visitor-api";
import { createWidgetStorage } from "../storage/widget-storage";

interface UseVisitorSessionOptions {
  websiteId: string;
}

export default function useVisitorSession({
  websiteId,
}: UseVisitorSessionOptions) {
  const storage = useMemo(() => createWidgetStorage(websiteId), [websiteId]);

  const [session, setSession] = useState<VisitorSession | null>(() =>
    storage.readSession(),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitLockRef = useRef(false);

  async function submitVisitor(form: VisitorFormData): Promise<boolean> {
    if (submitLockRef.current) {
      return false;
    }

    if (!websiteId.trim()) {
      setError("شناسه وب‌سایت معتبر نیست.");
      return false;
    }

    submitLockRef.current = true;

    setIsSubmitting(true);
    setError("");

    try {
      const nextSession = await registerVisitor({
        websiteId,
        form,
      });

      storage.saveSession(nextSession);
      setSession(nextSession);

      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "ثبت اطلاعات انجام نشد.",
      );

      return false;
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  return {
    session,
    isSubmitting,
    error,
    submitVisitor,
  };
}
