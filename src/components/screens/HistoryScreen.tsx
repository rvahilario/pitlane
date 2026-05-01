import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Badge";

interface Session {
  id: string;
  startedAt: string;
  durationSeconds: number;
  appsLaunched: string[];
}

const MOCK_SESSIONS: Session[] = [
  {
    id: "1",
    startedAt: "2025-04-18T14:32:01",
    durationSeconds: 4571,
    appsLaunched: ["SimHub", "CrewChief"],
  },
  {
    id: "2",
    startedAt: "2025-04-17T20:11:00",
    durationSeconds: 6810,
    appsLaunched: ["SimHub", "CrewChief", "VoiceAttack"],
  },
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function HistoryScreen() {
  const { t, i18n } = useTranslation();

  if (MOCK_SESSIONS.length === 0) {
    return <EmptyState icon={Clock} message={t("history.empty")} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ScreenHeader
        title={t("history.title")}
        action={
          <button className="text-xs text-text-muted hover:text-text-secondary transition-colors">
            {t("history.clear")}
          </button>
        }
      />

      <ul className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {MOCK_SESSIONS.map((s) => (
          <li key={s.id} className="px-3 py-2.5 rounded-lg bg-surface border border-border-strong">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                {formatDate(s.startedAt, i18n.language)}
              </span>
              <span className="text-xs font-mono text-text-muted">{formatDuration(s.durationSeconds)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {s.appsLaunched.map((name) => (
                <Tag key={name}>{name}</Tag>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
