import { FaExclamationTriangle } from "react-icons/fa";
import Button from "./Button";

const DangerConfirmModal = ({
  isOpen,
  title = "Delete room?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete room",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="cc-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[6px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="cc-modal-panel w-full max-w-md rounded-2xl border border-rose-500/25 bg-gradient-to-b from-[#2a1a1a] to-[#1f1414] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="danger-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-200">
            <FaExclamationTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 id="danger-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-rose-100/80">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="!text-xs">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            className="!text-xs"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DangerConfirmModal;
