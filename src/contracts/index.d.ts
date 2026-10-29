interface ChatMessage {
  id: string;
  sender: "operator" | "visitor";
  text: string;
  created_at?: string;
}

interface WidgetProps {
  websiteId: string;
  themeColor?: string;
}

interface VisitorFormData {
  first_name: string;
  last_name: string;
  email: string;
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
