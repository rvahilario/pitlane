import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export function useIRacingStatus() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const unlisten = listen<string>("iracing-status", (event) => {
      setOnline(event.payload === "online");
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return online;
}
