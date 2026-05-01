import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Ban, Clock3, LayoutList, Pencil, Plus, Square, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { cn } from "@/lib/cn";
import { api, type AppStatus, type ManagedApp, type NewApp, type Profile } from "@/lib/api";
import { useAppStatuses } from "@/hooks/useAppStatuses";
import { AppFormModal } from "@/components/AppFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// ── Status helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status, enabled, t }: { status: AppStatus | undefined; enabled: boolean; t: TFunction }) {
  const type = status?.state.type ?? "idle";

  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-border-strong bg-elevated px-1.5 py-0.5 text-[11px] font-medium text-text-muted">
        <Ban className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
        {t("apps.status.disabled")}
      </span>
    );
  }

  if (type === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-success bg-elevated px-1.5 py-0.5 text-[11px] font-medium text-success">
        <Activity className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
        {t("apps.status.running")}
      </span>
    );
  }
  if (type === "crashed") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-warning bg-elevated px-1.5 py-0.5 text-[11px] font-medium text-warning">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
        {t("apps.status.crashed")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border-strong bg-elevated px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
      <Clock3 className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
      {t("apps.status.idle")}
    </span>
  );
}

function statusDetail(status: AppStatus | undefined): string | null {
  if (status?.state.type !== "running") return null;
  const pid = (status.state as { pid: number }).pid;
  return `PID ${pid}`;
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

function Toggle({
  checked,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={cn(
        "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors shrink-0 disabled:cursor-not-allowed",
        disabled
          ? "bg-elevated border border-border"
          : checked
            ? "bg-accent-solid hover:bg-accent-solid-hover"
            : "bg-elevated border border-accent-solid hover:bg-surface",
      )}
    >
      <span className={cn(
        "h-4 w-4 rounded-full transition-transform",
        disabled
          ? "translate-x-0 bg-text-disabled"
          : checked
            ? "translate-x-4 bg-on-accent"
            : "translate-x-0 bg-accent-solid",
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
  onToggleStopWithIracing: (stop: boolean) => void;
}

function AppCard({ app, status, onStart, onStop, onEdit, onDelete, onToggleEnabled, onToggleStopWithIracing }: AppCardProps) {
  const { t } = useTranslation();
  const running = status?.state.type === "running";
  const detail = statusDetail(status);
  const appDisabled = !app.enabled;

  return (
    <li
      data-testid="app-card"
      className={cn(
        "flex flex-col rounded-lg border bg-surface border-border-strong transition-colors",
        !app.enabled && "bg-surface-disabled border-border",
      )}
    >
      {/* Row 1: icon / name / status / actions */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className={cn(appDisabled && "opacity-55")}>
          <AppAvatar name={app.name} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <span className={cn("text-sm font-medium text-text truncate", appDisabled && "opacity-60")}>
              {app.name}
            </span>
            <div className="flex items-center gap-2 min-h-5">
              <StatusBadge status={status} enabled={app.enabled} t={t} />
              {detail && (
                <span className="text-xs text-text-muted truncate font-mono" title={detail}>
                  {detail}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {running ? (
            <button
              title={t("apps.stop")}
              onClick={onStop}
              className="flex items-center gap-1 text-sm font-semibold px-2.5 py-1.5 rounded-md bg-danger-solid text-on-danger border border-danger-solid hover:bg-danger-solid-hover transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
              {t("apps.stop")}
            </button>
          ) : (
            <button
              title={t("apps.start")}
              onClick={onStart}
              className="flex items-center gap-1 text-sm font-semibold px-2.5 py-1.5 rounded-md bg-success-solid text-on-success border border-success-solid hover:bg-success-solid-hover transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
              {t("apps.start")}
            </button>
          )}

          <button
            title={t("apps.edit")}
            onClick={onEdit}
            className="p-1.5 rounded text-text-secondary hover:text-text hover:bg-elevated transition-colors"
          >
            <Pencil className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            title={t("apps.delete")}
            onClick={onDelete}
            className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Row 2: auto-start / auto-stop toggles */}
      <div className="flex items-center justify-between px-3 pb-2.5 -mt-0.5 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{t("apps.auto_start")}</span>
          <Toggle
            checked={app.enabled}
            onChange={onToggleEnabled}
            label={t("apps.auto_start")}
          />
        </div>
        <div className={cn("flex items-center gap-2", appDisabled && "opacity-60")}>
          <span className="text-xs text-text-muted">{t("apps.auto_stop")}</span>
          <Toggle
            checked={app.stop_with_iracing}
            disabled={appDisabled}
            onChange={onToggleStopWithIracing}
            label={t("apps.auto_stop")}
          />
        </div>
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
  const [preventAutoStop, setPreventAutoStop] = useState(false);
  const statuses = useAppStatuses();

  async function loadApps() {
    const [loadedApps, profiles, activeId, autoStopVal] = await Promise.all([
      api.getApps(),
      api.getProfiles(),
      api.getActiveProfileId(),
      api.getAutoStop(),
    ]);
    setApps(loadedApps);
    setActiveProfile(profiles.find((p) => p.id === activeId) ?? null);
    setPreventAutoStop(!autoStopVal);
  }

  useEffect(() => { loadApps(); }, []);

  async function handlePreventAutoStopToggle() {
    const next = !preventAutoStop;
    setPreventAutoStop(next);
    await api.setAutoStop(!next);
  }

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

  async function handleToggleStopWithIracing(app: ManagedApp, stop_with_iracing: boolean) {
    await api.updateApp(app.id, { stop_with_iracing });
    setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, stop_with_iracing } : a));
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
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 py-1.5"
          >
            <span className="text-xs text-text-secondary">
              <span className="font-bold text-accent">{t("apps.auto_stop_label_emphasis")}</span>{" "}
              {t("apps.auto_stop_label_rest")}
            </span>
            <Toggle
              checked={preventAutoStop}
              onChange={handlePreventAutoStopToggle}
              label={t("apps.auto_stop_label")}
            />
          </div>
          <button
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md bg-accent-solid text-on-accent border border-accent-solid hover:bg-accent-solid-hover transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {t("apps.add")}
          </button>
        </div>
      </div>

      {/* App list */}
      {apps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3">
          <LayoutList className="w-8 h-8" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm">{t("apps.empty")}</p>
            <button
              onClick={() => setModal({ type: "add" })}
              className="text-sm font-semibold px-3 py-1.5 rounded-md bg-accent-solid text-on-accent border border-accent-solid hover:bg-accent-solid-hover transition-colors"
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
                onToggleStopWithIracing={(stop) => handleToggleStopWithIracing(app, stop)}
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
