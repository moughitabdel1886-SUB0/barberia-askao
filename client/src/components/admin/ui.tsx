import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const inputClass =
  "min-h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-cobalt/40 disabled:opacity-50";

export const selectClass =
  "min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-cobalt/40";

export const textareaClass =
  "w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-3 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-cobalt/40";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-paper-soft transition enabled:hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-50";

export const btnAccent =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-vermilion px-5 py-2.5 text-sm font-extrabold text-paper-soft transition enabled:hover:bg-vermilion-deep disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-paper-soft px-4 py-2.5 text-sm font-bold text-ink transition enabled:hover:border-ink disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-ink-soft transition hover:bg-paper-deep hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

export function AdminCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card-paper rounded-2xl p-4 shadow-soft sm:p-5", className)}>{children}</div>;
}

export function AdminSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">{title}</h2>
        {description ? <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">
        {label}
        {required ? <span className="ml-1 text-vermilion">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1.5 text-[0.68rem] leading-relaxed text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.58rem] font-extrabold uppercase tracking-[0.1em]",
        STATUS_STYLES[status] ?? "bg-paper-deep text-ink-soft",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper-soft/50 px-6 py-12 text-center">
      {icon ? <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-paper-deep text-ink-faint">{icon}</div> : null}
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />;
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-line bg-paper-soft text-ink-soft transition enabled:hover:border-ink enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/35 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[80] max-h-[92vh] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.5rem] border border-line bg-paper-soft p-5 shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-7",
            wide ? "max-w-3xl" : "max-w-lg",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-ink-soft">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition hover:border-ink hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
