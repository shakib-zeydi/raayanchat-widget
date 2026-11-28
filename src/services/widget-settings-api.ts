import { apiRequest } from "./http";

export interface WidgetSettings {
  theme_color: string | null;
  position_x: "left" | "right";
  position_y: "top" | "bottom";
  offset_x?: number;
  offset_y: number;
  button_width?: number;
  button_height?: number;
  button_subtitle?: string | null;
  button_subtitle_size?: number;
  button_subtitle_color?: string;
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
      (response.data.button_width !== undefined && !Number.isFinite(response.data.button_width)) ||
      (response.data.button_height !== undefined && !Number.isFinite(response.data.button_height)) ||
      (response.data.button_subtitle != null && typeof response.data.button_subtitle !== "string") ||
      (response.data.button_subtitle_size !== undefined && !Number.isFinite(response.data.button_subtitle_size)) ||
      (response.data.button_subtitle_color !== undefined && (typeof response.data.button_subtitle_color !== "string" || !/^#[0-9a-f]{6}$/i.test(response.data.button_subtitle_color))) ||
      !Number.isFinite(response.data.offset_y)) {
    throw new Error("Widget settings response is invalid.");
  }

  return response.data;
}
