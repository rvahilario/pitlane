import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal onClickOutside={onCancel}>
      <div className="bg-surface border border-border-strong rounded-xl w-full max-w-sm p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <Button variant="icon" onClick={onCancel} aria-label={t("common.cancel")}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-text-secondary mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
