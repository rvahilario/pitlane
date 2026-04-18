import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { EVENT_IRACING_STATUS, STATUS_ONLINE } from "@/lib/events";

export function useIRacingStatus() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const unlisten = listen<string>(EVENT_IRACING_STATUS, (event) => {
      setOnline(event.payload === STATUS_ONLINE);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return online;
}
