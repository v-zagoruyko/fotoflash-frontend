"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Native <dialog> modal: focus trap, Escape and the backdrop come from the browser.
 * Controlled from outside through `open` / `onClose`.
 */
export function Modal({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** accessible name of the dialog */
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // the browser would focus the close button; a form field is what the person came for
      dialog.querySelector<HTMLElement>("input:not([disabled]), textarea")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      // a click on the backdrop lands on the dialog element itself, not on its content
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-md overflow-visible rounded-card border border-line bg-surface p-0 text-fg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-5">
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-pill text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {open && children}
      </div>
    </dialog>
  );
}
