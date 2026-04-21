import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { api, type LogEntry } from "@/lib/api";
import { EVENT_LOG_ENTRY } from "@/lib/events";

const MAX_DISPLAY = 200;

export function useLog(): LogEntry[] {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    api.getLog().then((existing) => {
      if (!cancelled) setEntries(existing.slice(-MAX_DISPLAY));
    }).catch(() => {});

    const unlistenPromise = listen<LogEntry>(EVENT_LOG_ENTRY, (event) => {
      setEntries((prev) => {
        const next = [...prev, event.payload];
        return next.length > MAX_DISPLAY ? next.slice(-MAX_DISPLAY) : next;
      });
    });

    return () => {
      cancelled = true;
      unlistenPromise.then((f) => f());
    };
  }, []);

  return entries;
}
