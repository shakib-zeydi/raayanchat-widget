import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb">;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo<"reverb"> | null = null;
let activeToken: string | null = null;

export const getEcho = (token: string) => {
  if (typeof window === "undefined") return null;

  if (echoInstance && activeToken !== token) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  if (!echoInstance) {
    activeToken = token;
    echoInstance = new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT || 8080),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/widget/broadcasting/auth`,
      auth: { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    });
  }

  return echoInstance;
};
