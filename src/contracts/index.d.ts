interface WidgetProps {
  websiteId: string;
  themeColor?: string;
}

interface VisitorFormData {
  first_name: string;
  last_name: string;
  email: string;
}

interface VisitorSession {
  publicId: string;
  token: string;
}

type ConversationMode = "ai" | "human";

interface ChatMessage {
  id: string;
  publicId?: string;
  sender: "visitor" | "operator" | "assistant";
  text: string;
  created_at?: string;
}

interface VisitorApiResponse {
  status: string;
  message: string;
  data: {
    public_id: string;
    [key: string]: unknown;
  };
}

interface ConversationApiResponse {
  status: string;
  message: string;
  data: {
    id: number;
    public_id: string;
    title: string;
    [key: string]: unknown;
  };
}

interface ServerMessageItem {
  id: number | string;
  public_id?: string;
  body?: string;
  message?: string;
  content?: string;
  sender?: string;
  created_at: string;
}

interface SocketMessagePayload {
  message: {
    id: number | string;
    public_id: string;
    body: string;
    sender: "visitor" | "operator";
    created_at?: string;
  };
}

interface HumanConversationStatus {
  public_id: string;
  status: string;
  unread_count: number;
  last_message_at: string | null;
}

interface HumanNotificationsStatus {
  unread_count: number;
  conversations: HumanConversationStatus[];
}
