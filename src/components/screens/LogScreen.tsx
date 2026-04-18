import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

interface LogEntry {
  seq: number;
  time: string;
  type: "launch" | "stop" | "error" | "iracing_start" | "iracing_stop" | "skipped" | "info";
  app: string | null;
  msg: string;
}

const MOCK_LOG: LogEntry[] = [
  { seq: 0, time: "14:32:01", type: "iracing_start", app: null,          msg: "iRacing detectado — iniciando apps" },
  { seq: 1, time: "14:32:01", type: "launch",        app: "SimHub",      msg: "Iniciado (pid 4821)" },
  { seq: 2, time: "14:32:03", type: "launch",        app: "CrewChief",   msg: "Iniciado (pid 5102)" },
  { seq: 3, time: "14:32:05", type: "skipped",       app: "VoiceAttack", msg: "Ignorado (app desativado)" },
  { seq: 4, time: "15:48:12", type: "iracing_stop",  app: null,          msg: "iRacing fechado — parando apps" },
  { seq: 5, time: "15:48:12", type: "stop",          app: "SimHub",      msg: "Parado (pid 4821)" },
  { seq: 6, time: "15:48:13", type: "stop",          app: "CrewChief",   msg: "Parado (pid 5102)" },
];

const typeStyle: Record<LogEntry["type"], string> = {
  launch:        "text-success",
  stop:          "text-warning",
  error:         "text-danger",
  iracing_start: "text-accent",
  iracing_stop:  "text-accent/60",
  skipped:       "text-text-disabled",
  info:          "text-text-muted",
};

type LogTypeKey = "launch" | "stop" | "error" | "iracing" | "skip" | "info";

const typeToKey: Record<LogEntry["type"], LogTypeKey> = {
  launch:        "launch",
  stop:          "stop",
  error:         "error",
  iracing_start: "iracing",
  iracing_stop:  "iracing",
  skipped:       "skip",
  info:          "info",
};

export function LogScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-text">{t("log.title")}</h2>
        <button className="text-xs text-text-muted hover:text-text-secondary transition-colors">
          {t("log.clear")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs flex flex-col gap-0.5">
        {MOCK_LOG.map((entry) => (
          <div
            key={entry.seq}
            className={cn(
              "flex items-start gap-2 py-0.5 px-1 rounded",
              (entry.type === "iracing_start" || entry.type === "iracing_stop") && "bg-accent/5",
            )}
          >
            <span className="text-text-disabled shrink-0 w-16">{entry.time}</span>
            <span className={cn("shrink-0 w-14 font-semibold", typeStyle[entry.type])}>
              {t(`log.types.${typeToKey[entry.type]}`)}
            </span>
            {entry.app && (
              <span className="text-text-secondary shrink-0 max-w-28 truncate">{entry.app}</span>
            )}
            <span className="text-text-muted">{entry.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
