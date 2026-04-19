import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";
import { EVENT_IRACING_STATUS, STATUS_ONLINE } from "@/lib/events";

export function useIRacingStatus() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    // Query current state on mount — avoids missing an event fired before the listener was ready
    api.getIRacingStatus().then(setOnline).catch(() => {});

    const unlisten = listen<string>(EVENT_IRACING_STATUS, (event) => {
      setOnline(event.payload === STATUS_ONLINE);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return online;
}
