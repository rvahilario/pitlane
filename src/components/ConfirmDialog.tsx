import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-surface border border-border-strong rounded-xl w-full max-w-sm p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded text-text-muted hover:text-text transition-colors"
            aria-label={t("common.cancel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-xs px-3 py-1.5 rounded-md border border-border-strong text-text-muted hover:text-text transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
