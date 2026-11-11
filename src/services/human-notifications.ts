import { apiRequest } from "./http";

interface HumanNotificationsResponse {
  data: HumanNotificationsStatus;
}

interface MarkHumanConversationReadResponse {
  data: {
    conversation_public_id: string;
    unread_count: number;
  };
}

export async function getHumanNotificationsStatus(
  session: VisitorSession,
  signal?: AbortSignal,
): Promise<HumanNotificationsStatus> {
  const response = await apiRequest<HumanNotificationsResponse>(
    `/visitors/${encodeURIComponent(session.publicId)}/conversations/status`,
    {
      token: session.token,
      signal,
    },
  );

  return response.data;
}

export async function markHumanConversationRead(
  session: VisitorSession,
  conversationPublicId: string,
  messagePublicId: string,
  signal?: AbortSignal,
) {
  const response = await apiRequest<MarkHumanConversationReadResponse>(
    `/visitors/${encodeURIComponent(session.publicId)}` +
      `/conversations/${encodeURIComponent(conversationPublicId)}/read`,
    {
      method: "PATCH",
      token: session.token,
      signal,
      body: {
        last_read_message_public_id: messagePublicId,
      },
    },
  );

  return response.data;
}
