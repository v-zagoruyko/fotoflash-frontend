import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Native input with label, hint and error. Use `type`/`inputMode`/`autoComplete` for mobile keyboards. */
export function Field({ label, hint, error, id, className, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const noteId = `${inputId}-note`;
  const note = error ?? hint;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="type-body-sm text-muted">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={cn(
          "h-control w-full rounded-field border bg-surface px-4 text-base text-fg outline-none",
          "transition-colors placeholder:text-muted focus-visible:border-accent",
          error ? "border-danger" : "border-line hover:border-muted",
          className,
        )}
        {...props}
      />
      {note && (
        <p id={noteId} className={cn("type-caption", error ? "text-danger" : "text-muted")}>
          {note}
        </p>
      )}
    </div>
  );
}
