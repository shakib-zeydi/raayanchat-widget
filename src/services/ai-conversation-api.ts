import { apiRequest } from "./http";

interface AiReplyResponse {
  data: {
    conversation_id: string;
    message: {
      role: "assistant";
      content: string;
    };
  };
}

interface AiHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface AiHistoryResponse {
  data: {
    conversation_id: string;
    messages: AiHistoryMessage[];
    pagination: {
      has_more: boolean;
      next_before_id: string | null;
    };
  };
}

interface SendMessageOptions {
  session: VisitorSession;
  conversationId?: string | null;
  message: string;
  signal?: AbortSignal;
}

interface GetMessagesOptions {
  session: VisitorSession;
  conversationId: string;
  beforeId?: string;
  limit?: number;
  signal?: AbortSignal;
}

function visitorPath(publicId: string): string {
  return `/visitors/${encodeURIComponent(publicId)}/ai/conversations`;
}

export async function sendAiMessage({
  session,
  conversationId,
  message,
  signal,
}: SendMessageOptions) {
  const basePath = visitorPath(session.publicId);

  const path = conversationId
    ? `${basePath}/${encodeURIComponent(conversationId)}/messages`
    : basePath;

  const result = await apiRequest<AiReplyResponse>(path, {
    method: "POST",
    token: session.token,
    body: { message },
    signal,
  });

  if (
    !result.data?.conversation_id ||
    result.data.message?.role !== "assistant" ||
    typeof result.data.message.content !== "string"
  ) {
    throw new Error("پاسخ دستیار هوشمند معتبر نیست.");
  }

  return {
    conversationId: result.data.conversation_id,
    content: result.data.message.content,
  };
}

export async function getAiMessages({
  session,
  conversationId,
  beforeId,
  limit = 30,
  signal,
}: GetMessagesOptions) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (beforeId) {
    params.set("before_id", beforeId);
  }

  const path =
    `${visitorPath(session.publicId)}` +
    `/${encodeURIComponent(conversationId)}/messages?${params}`;

  const result = await apiRequest<AiHistoryResponse>(path, {
    token: session.token,
    signal,
  });

  if (
    result.data?.conversation_id !== conversationId ||
    !Array.isArray(result.data.messages) ||
    typeof result.data.pagination?.has_more !== "boolean" ||
    !(
      result.data.pagination.next_before_id === null ||
      typeof result.data.pagination.next_before_id === "string"
    )
  ) {
    throw new Error("پاسخ تاریخچهٔ مکالمه معتبر نیست.");
  }

  const messages: ChatMessage[] = result.data.messages.map((message) => {
    if (
      typeof message.id !== "string" ||
      typeof message.content !== "string" ||
      !["user", "assistant"].includes(message.role)
    ) {
      throw new Error("ساختار پیام تاریخچه معتبر نیست.");
    }

    return {
      id: message.id,
      sender: message.role === "user" ? "visitor" : "assistant",
      text: message.content,
      created_at: message.created_at,
    };
  });

  return {
    messages,
    hasMore: result.data.pagination.has_more,
    nextBeforeId: result.data.pagination.next_before_id,
  };
}
