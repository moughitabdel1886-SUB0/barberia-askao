import { Scissors } from "lucide-react";

export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <div className="flex items-center gap-6 px-3" aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-6 whitespace-nowrap">
          <span className="font-display text-lg font-medium italic tracking-tight text-ink sm:text-2xl">{item}</span>
          <Scissors
            className={index % 2 === 0 ? "h-4 w-4 -rotate-12 text-vermilion" : "h-4 w-4 rotate-12 text-cobalt"}
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-paper-deep">
      <div className="stripe-rule" aria-hidden="true" />
      <div className="marquee py-4 sm:py-5">
        <div className="marquee-track">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <div className="stripe-rule" aria-hidden="true" />
    </div>
  );
}
