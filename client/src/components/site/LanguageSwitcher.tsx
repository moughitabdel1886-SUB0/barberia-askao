import { LOCALE_LABELS, LOCALES } from "@shared/i18n";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`${t.common.language}: ${LOCALE_LABELS[locale].name}`}
          className={cn(
            "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-paper-soft/70 px-3 text-xs font-extrabold tracking-[0.08em] text-ink transition hover:border-ink",
            className,
          )}
        >
          <Globe2 className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
          {compact ? LOCALE_LABELS[locale].short : LOCALE_LABELS[locale].name}
          <ChevronDown className="h-3 w-3 text-ink-faint" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[60] min-w-44 rounded-2xl border border-line bg-paper-soft p-1.5 shadow-lift"
        >
          <DropdownMenu.Label className="px-3 py-2 text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-ink-faint">
            {t.common.language}
          </DropdownMenu.Label>
          {LOCALES.map(value => (
            <DropdownMenu.Item
              key={value}
              onSelect={() => setLocale(value)}
              className="flex min-h-10 cursor-pointer items-center justify-between rounded-xl px-3 text-sm font-semibold text-ink outline-none data-[highlighted]:bg-paper-deep"
            >
              <span className="flex items-center gap-2">
                <span className="w-6 text-[0.62rem] font-extrabold tracking-wider text-ink-faint">
                  {LOCALE_LABELS[value].short}
                </span>
                {LOCALE_LABELS[value].name}
              </span>
              {value === locale ? <Check className="h-4 w-4 text-vermilion" aria-hidden="true" /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
