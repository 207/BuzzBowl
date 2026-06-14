import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

/**
 * Re-bind session and request fresh game state on mount, after reconnect,
 * or when returning to the tab. Uses `reconnect` (not `connect`) to avoid
 * duplicating the mount resync when the socket was already connected.
 */
export function useSocketResync(enabled: boolean, resync: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const s = getSocket();
    let pendingConnectResync = false;

    const runResync = () => {
      if (!s.connected) {
        pendingConnectResync = true;
        s.connect();
        return;
      }
      resync();
    };

    runResync();

    const onConnect = () => {
      if (!pendingConnectResync) return;
      pendingConnectResync = false;
      resync();
    };

    const onReconnect = () => {
      pendingConnectResync = false;
      resync();
    };

    s.on("connect", onConnect);
    s.io.on("reconnect", onReconnect);

    const onVisible = () => {
      if (document.visibilityState === "visible") runResync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      s.off("connect", onConnect);
      s.io.off("reconnect", onReconnect);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, resync]);
}
