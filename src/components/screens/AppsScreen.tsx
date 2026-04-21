import { useEffect, useState } from "react";
import { AlertTriangle, Circle, LayoutList, Pencil, Plus, Square, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { cn } from "@/lib/cn";
import { api, type AppStatus, type ManagedApp, type NewApp, type Profile } from "@/lib/api";
import { useAppStatuses } from "@/hooks/useAppStatuses";
import { AppFormModal } from "@/components/AppFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ── Status helpers ────────────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: AppStatus | undefined }) {
  const type = status?.state.type ?? "idle";

  if (type === "running") {
    return (
      <Circle className="w-2 h-2 fill-success text-success shrink-0" aria-label="Running" />
    );
  }
  if (type === "crashed") {
    return (
      <AlertTriangle className="w-3 h-3 text-warning shrink-0" aria-label="Crashed" />
    );
  }
  return (
    <Circle className="w-2 h-2 text-text-disabled shrink-0" aria-label="Idle" />
  );
}

function statusLabel(status: AppStatus | undefined, t: TFunction): string {
  const type = status?.state.type ?? "idle";
  if (type === "running") {
    const pid = (status!.state as { pid: number }).pid;
    return `${t("apps.status.running")} · PID ${pid}`;
  }
  if (type === "crashed") return t("apps.status.crashed");
  return t("apps.status.idle");
}

// ── App letter-avatar ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-accent/20 text-accent",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
  "bg-danger/20 text-danger",
];

function AppAvatar({ name }: { name: string }) {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 select-none", AVATAR_COLORS[idx])}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-8 h-4 rounded-full transition-colors shrink-0",
        checked ? "bg-accent/40" : "bg-elevated border border-border-strong",
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-3 h-3 rounded-full transition-all",
        checked ? "left-[18px] bg-accent" : "left-0.5 bg-text-disabled",
      )} />
    </button>
  );
}

// ── App card ──────────────────────────────────────────────────────────────────

interface AppCardProps {
  app: ManagedApp;
  status: AppStatus | undefined;
  onStart: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: (enabled: boolean) => void;
}

function AppCard({ app, status, onStart, onStop, onEdit, onDelete, onToggleEnabled }: AppCardProps) {
  const { t } = useTranslation();
  const running = status?.state.type === "running";

  return (
    <li
      data-testid="app-card"
      className={cn(
        "flex flex-col rounded-lg border bg-surface border-border-strong transition-opacity",
        !app.enabled && "opacity-50",
      )}
    >
      {/* Row 1: icon / name / status / actions */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <AppAvatar name={app.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <StatusIndicator status={status} />
            <span className="text-sm font-medium text-text truncate">{app.name}</span>
          </div>
          <p className="text-xs text-text-disabled truncate font-mono mt-0.5" title={statusLabel(status, t)}>
            {statusLabel(status, t)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {running ? (
            <button
              title={t("apps.stop")}
              onClick={onStop}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded text-warning/80 hover:text-warning hover:bg-warning/10 transition-colors border border-transparent hover:border-warning/20"
            >
              <Square className="w-3 h-3" />
              {t("apps.stop")}
            </button>
          ) : (
            <button
              title={t("apps.start")}
              onClick={onStart}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded text-text-muted hover:text-text hover:bg-elevated transition-colors border border-transparent hover:border-border-strong"
            >
              <Play className="w-3 h-3" />
              {t("apps.start")}
            </button>
          )}

          <button
            title={t("apps.edit")}
            onClick={onEdit}
            className="p-1.5 rounded text-text-muted hover:text-text hover:bg-elevated transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            title={t("apps.delete")}
            onClick={onDelete}
            className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: auto-start toggle */}
      <div className="flex items-center justify-between px-3 pb-2.5 -mt-0.5">
        <span className="text-xs text-text-muted">{t("apps.auto_start")}</span>
        <Toggle
          checked={app.enabled}
          onChange={onToggleEnabled}
          label={t("apps.auto_start")}
        />
      </div>
    </li>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "add" }
  | { type: "edit"; app: ManagedApp }
  | null;

export function AppsScreen() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedApp | null>(null);
  const statuses = useAppStatuses();

  async function loadApps() {
    const [loadedApps, profiles, activeId] = await Promise.all([
      api.getApps(),
      api.getProfiles(),
      api.getActiveProfileId(),
    ]);
    setApps(loadedApps);
    setActiveProfile(profiles.find((p) => p.id === activeId) ?? null);
  }

  useEffect(() => { loadApps(); }, []);

  async function handleFormSubmit(data: NewApp) {
    if (modal?.type === "add") {
      await api.addApp(data);
    } else if (modal?.type === "edit") {
      await api.updateApp(modal.app.id, data);
    }
    await loadApps();
    // modal closes itself after showing brief success state
  }

  async function handleDelete(app: ManagedApp) {
    await api.deleteApp(app.id);
    setConfirmDelete(null);
    loadApps();
  }

  async function handleToggleEnabled(app: ManagedApp, enabled: boolean) {
    await api.updateApp(app.id, { enabled });
    setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, enabled } : a));
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">{t("apps.title")}</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {t("apps.profile_label", { name: activeProfile?.name ?? "…" })}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("apps.add")}
        </button>
      </div>

      {/* App list */}
      {apps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-disabled gap-3">
          <LayoutList className="w-8 h-8" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm">{t("apps.empty")}</p>
            <button
              onClick={() => setModal({ type: "add" })}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors"
            >
              {t("apps.add_first")}
            </button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {apps.map((app) => {
            const status = statuses.find((s) => s.app_id === app.id);
            return (
              <AppCard
                key={app.id}
                app={app}
                status={status}
                onStart={() => api.forceLaunchApp(app.id)}
                onStop={() => api.forceKillApp(app.id)}
                onEdit={() => setModal({ type: "edit", app })}
                onDelete={() => setConfirmDelete(app)}
                onToggleEnabled={(enabled) => handleToggleEnabled(app, enabled)}
              />
            );
          })}
        </ul>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <AppFormModal
          mode={modal.type}
          initial={modal.type === "edit" ? modal.app : undefined}
          onClose={() => setModal(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={t("apps.delete_confirm_title")}
          message={t("apps.delete_confirm_message", { name: confirmDelete.name })}
          confirmLabel={t("apps.delete_confirm")}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
