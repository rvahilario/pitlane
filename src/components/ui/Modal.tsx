interface ModalProps {
  children: React.ReactNode;
  onClickOutside: () => void;
}

export function Modal({ children, onClickOutside }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClickOutside(); }}
    >
      {children}
    </div>
  );
}
