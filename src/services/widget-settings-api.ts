import { apiRequest } from "./http";

export interface WidgetSettings {
  theme_color: string | null;
  position_x: "left" | "right";
  position_y: "top" | "bottom";
  offset_x?: number;
  offset_y: number;
  icon: { type: "svg"; value: string } | { type: "image" | "video"; url: string } | null;
}

export async function getWidgetSettings(websiteId: string, signal: AbortSignal): Promise<WidgetSettings> {
  const response = await apiRequest<{ data: WidgetSettings }>(
    `/settings/${encodeURIComponent(websiteId)}`,
    { signal },
  );

  if (!response.data || !["left", "right"].includes(response.data.position_x) ||
      !["top", "bottom"].includes(response.data.position_y) ||
      (response.data.offset_x !== undefined && !Number.isFinite(response.data.offset_x)) ||
      !Number.isFinite(response.data.offset_y)) {
    throw new Error("Widget settings response is invalid.");
  }

  return response.data;
}
