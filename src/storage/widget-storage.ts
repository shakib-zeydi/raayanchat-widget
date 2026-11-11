function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // نشست فعلی می‌تواند در حافظه ادامه پیدا کند،
    // حتی اگر ذخیره‌سازی مرورگر در دسترس نباشد.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // نبود دسترسی به storage نباید ویجت را متوقف کند.
  }
}

export function createWidgetStorage(websiteId: string) {
  // کلیدهای فعلی برای سازگاری با نشست‌های قبلی حفظ شده‌اند.
  const visitorKey = `visitor_${websiteId}`;
  const tokenKey = `visitor_token_${websiteId}`;
  const humanConversationKey = `visitor_conv_${websiteId}`;

  // مکالمهٔ AI علاوه بر سایت، به Visitor هم وابسته است.
  function aiConversationKey(visitorId: string): string {
    return (
      `visitor_ai_conv_${encodeURIComponent(websiteId)}` +
      `_${encodeURIComponent(visitorId)}`
    );
  }

  return {
    readSession(): VisitorSession | null {
      const publicId = read(visitorKey);
      const token = read(tokenKey);

      if (!publicId || !token) {
        return null;
      }

      return { publicId, token };
    },

    saveSession(session: VisitorSession): void {
      const previousVisitorId = read(visitorKey);

      // شناسهٔ مکالمهٔ انسانی Visitor قبلی نباید منتقل شود.
      if (previousVisitorId !== session.publicId) {
        remove(humanConversationKey);
      }

      write(visitorKey, session.publicId);
      write(tokenKey, session.token);
    },

    clearSession(): void {
      const visitorId = read(visitorKey);

      remove(visitorKey);
      remove(tokenKey);
      remove(humanConversationKey);

      if (visitorId) {
        remove(aiConversationKey(visitorId));
      }
    },

    readHumanConversationId(): string | null {
      return read(humanConversationKey);
    },

    saveHumanConversationId(conversationId: string): void {
      write(humanConversationKey, conversationId);
    },

    clearHumanConversationId(): void {
      remove(humanConversationKey);
    },

    readAiConversationId(visitorId: string): string | null {
      return read(aiConversationKey(visitorId));
    },

    saveAiConversationId(visitorId: string, conversationId: string): void {
      write(aiConversationKey(visitorId), conversationId);
    },

    clearAiConversationId(visitorId: string): void {
      remove(aiConversationKey(visitorId));
    },
  };
}
