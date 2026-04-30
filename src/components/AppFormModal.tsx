import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { type ManagedApp, type NewApp } from "@/lib/api";

interface AppFormModalProps {
  mode: "add" | "edit";
  initial?: ManagedApp;
  onClose: () => void;
  onSubmit: (data: NewApp) => Promise<void>;
}

interface FormState {
  name: string;
  exe_path: string;
  enabled: boolean;
  startup_delay_secs: number;
  args: string;
  working_dir: string;
  restart_on_crash: boolean;
  max_restart_attempts: number;
  track_process_name: string;
  force_kill_on_stop: boolean;
  kill_process_tree: boolean;
  stop_with_iracing: boolean;
}

function initForm(initial?: ManagedApp): FormState {
  return {
    name:                 initial?.name                 ?? "",
    exe_path:             initial?.exe_path             ?? "",
    enabled:              initial?.enabled              ?? true,
    startup_delay_secs:   initial?.startup_delay_secs   ?? 0,
    args:                 initial?.args                 ?? "",
    working_dir:          initial?.working_dir          ?? "",
    restart_on_crash:     initial?.restart_on_crash     ?? false,
    max_restart_attempts: initial?.max_restart_attempts ?? 3,
    track_process_name:   initial?.track_process_name   ?? "",
    force_kill_on_stop:   initial?.force_kill_on_stop   ?? false,
    kill_process_tree:    initial?.kill_process_tree    ?? false,
    stop_with_iracing:    initial?.stop_with_iracing    ?? true,
  };
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-disabled">
        {title}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function Field({ label, hint, id, children }: { label: string; hint?: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs text-text-disabled">{hint}</p>}
    </div>
  );
}

function TextInput({
  id, value, onChange, placeholder, mono = false,
}: {
  id?: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "text-sm bg-elevated border border-border-strong rounded-md px-3 py-1.5 text-text",
        "outline-none focus:border-accent placeholder:text-text-disabled transition-colors",
        mono && "font-mono text-xs",
      )}
    />
  );
}

function NumberInput({
  value, onChange, min = 0, step = 1,
}: {
  value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      step={step}
      className="w-28 text-sm bg-elevated border border-border-strong rounded-md px-3 py-1.5 text-text outline-none focus:border-accent transition-colors"
    />
  );
}

function CheckRow({
  label, hint, checked, onChange,
}: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div
        className={cn(
          "mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          checked
            ? "bg-accent/20 border-accent"
            : "bg-elevated border-border-strong group-hover:border-accent/50",
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        {checked && (
          <svg className="w-3 h-3 text-accent" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm text-text leading-tight">{label}</p>
        {hint && <p className="text-xs text-text-disabled mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

export function AppFormModal({ mode, initial, onClose, onSubmit }: AppFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initForm(initial));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name:                 form.name,
        exe_path:             form.exe_path,
        enabled:              form.enabled,
        startup_delay_secs:   form.startup_delay_secs,
        args:                 form.args,
        working_dir:          form.working_dir,
        restart_on_crash:     form.restart_on_crash,
        max_restart_attempts: form.max_restart_attempts,
        track_process_name:   form.track_process_name,
        force_kill_on_stop:   form.force_kill_on_stop,
        kill_process_tree:    form.kill_process_tree,
        stop_with_iracing:    form.stop_with_iracing,
      });
      setSaved(true);
      setTimeout(onClose, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border-strong rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-text">
            {mode === "add" ? t("apps.form.title_add") : t("apps.form.title_edit")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text transition-colors"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="flex flex-col gap-4 p-5 overflow-y-auto">

            {/* ── Basic ── */}
            <SectionDivider title={t("apps.form.section_basic")} />

            <Field label={t("apps.form.name")} id="app-form-name">
              <TextInput id="app-form-name" value={form.name} onChange={(v) => patch("name", v)} />
            </Field>

            <Field label={t("apps.form.exe_path")} id="app-form-exe">
              <TextInput id="app-form-exe" value={form.exe_path} onChange={(v) => patch("exe_path", v)} mono />
            </Field>

            <CheckRow
              label={t("apps.form.enabled")}
              checked={form.enabled}
              onChange={(v) => patch("enabled", v)}
            />

            <CheckRow
              label={t("apps.auto_stop")}
              checked={form.stop_with_iracing}
              onChange={(v) => patch("stop_with_iracing", v)}
            />

            {/* ── Startup ── */}
            <SectionDivider title={t("apps.form.section_startup")} />

            <Field label={t("apps.form.startup_delay")}>
              <NumberInput value={form.startup_delay_secs} onChange={(v) => patch("startup_delay_secs", v)} step={0.5} />
            </Field>

            <Field label={t("apps.form.args")}>
              <TextInput value={form.args} onChange={(v) => patch("args", v)} mono />
            </Field>

            <Field label={t("apps.form.working_dir")}>
              <TextInput value={form.working_dir} onChange={(v) => patch("working_dir", v)} mono />
            </Field>

            {/* ── Crash ── */}
            <SectionDivider title={t("apps.form.section_crash")} />

            <CheckRow
              label={t("apps.form.restart_on_crash")}
              checked={form.restart_on_crash}
              onChange={(v) => patch("restart_on_crash", v)}
            />

            {form.restart_on_crash && (
              <Field label={t("apps.form.max_retries")}>
                <NumberInput
                  value={form.max_restart_attempts}
                  onChange={(v) => patch("max_restart_attempts", v)}
                  min={1}
                />
              </Field>
            )}

            {/* ── Advanced (collapsible) ── */}
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs text-text-disabled hover:text-text-muted transition-colors self-start"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", advancedOpen && "rotate-180")} />
              {t("apps.form.section_advanced")}
            </button>

            {advancedOpen && (
              <div className="flex flex-col gap-4 pl-3 border-l border-border">
                <Field label={t("apps.form.track_process_name")} hint={t("apps.form.track_process_name_hint")}>
                  <TextInput value={form.track_process_name} onChange={(v) => patch("track_process_name", v)} mono />
                </Field>

                <CheckRow
                  label={t("apps.form.force_kill")}
                  hint={t("apps.form.force_kill_hint")}
                  checked={form.force_kill_on_stop}
                  onChange={(v) => patch("force_kill_on_stop", v)}
                />

                <CheckRow
                  label={t("apps.form.kill_tree")}
                  hint={t("apps.form.kill_tree_hint")}
                  checked={form.kill_process_tree}
                  onChange={(v) => patch("kill_process_tree", v)}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 px-5 py-4 border-t border-border shrink-0">
            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || saved}
                className="text-xs px-3 py-1.5 rounded-md border border-border-strong text-text-muted hover:text-text transition-colors disabled:opacity-50"
              >
                {t("apps.form.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving || saved || !form.name.trim() || !form.exe_path.trim()}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50",
                  saved
                    ? "bg-success/15 text-success border-success/30"
                    : "bg-accent/15 hover:bg-accent/25 text-accent border-accent/30",
                )}
              >
                {saved ? (
                  <><Check className="w-3 h-3" />{t("apps.form.saved")}</>
                ) : saving ? "…" : t("apps.form.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
