const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredBaseUrl) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

const API_BASE_URL = `${configuredBaseUrl.replace(/\/+$/, "")}/widget`;

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  signal?: AbortSignal;
}

function getErrorMessage(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return null;
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", token, body, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "omit",
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload) || "ارتباط با سرور انجام نشد.",
      response.status,
      payload,
    );
  }

  if (payload === null) {
    throw new ApiError("پاسخ سرور معتبر نیست.", response.status, payload);
  }

  return payload as T;
}
