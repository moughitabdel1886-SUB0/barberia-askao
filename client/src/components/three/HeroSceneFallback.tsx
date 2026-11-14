import { Scissors, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

function RazorArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 150" className={className} aria-hidden="true">
      <g transform="rotate(18 45 75)">
        <rect x="36" y="70" width="18" height="62" rx="9" fill="#2447c9" />
        <rect x="22" y="12" width="46" height="62" rx="6" fill="#e9e3d6" stroke="#1b1a17" strokeWidth="3" />
        <rect x="28" y="18" width="34" height="50" rx="3" fill="#fffdf8" opacity=".55" />
        <circle cx="45" cy="70" r="6" fill="#d8d2c4" stroke="#1b1a17" strokeWidth="3" />
      </g>
    </svg>
  );
}

function CombArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 90" className={className} aria-hidden="true">
      <g transform="rotate(-14 75 45)">
        <rect x="10" y="14" width="130" height="24" rx="10" fill="#2447c9" />
        {Array.from({ length: 10 }, (_, index) => (
          <rect key={index} x={18 + index * 12} y="36" width="6" height="40" rx="3" fill="#2447c9" />
        ))}
      </g>
    </svg>
  );
}

export function HeroSceneFallback({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid h-full place-items-center", className)} aria-hidden="true">
      <div className="cloud left-[6%] top-[14%] h-12 w-36 opacity-80" />
      <div className="cloud right-[2%] top-[24%] h-16 w-44 opacity-70" />
      <div className="cloud bottom-[12%] left-[18%] h-10 w-28 opacity-60" />

      <div
        className="pole-css animate-floaty"
        style={{ "--rot": "-2deg" } as CSSProperties}
      />

      <Scissors
        className="animate-floaty absolute left-[8%] top-[18%] h-16 w-16 -rotate-[18deg] text-vermilion drop-shadow-[0_16px_18px_rgba(27,26,23,.16)] sm:h-20 sm:w-20"
        strokeWidth={1.6}
      />
      <RazorArt className="animate-floaty absolute right-[4%] top-[14%] h-28 w-20 sm:h-36 sm:w-24" />
      <CombArt className="animate-floaty absolute bottom-[12%] right-[6%] h-20 w-32 sm:h-24 sm:w-36" />

      <Sparkles className="absolute bottom-[24%] left-[2%] h-6 w-6 text-cobalt" />
      <span className="absolute right-[22%] top-[8%] h-2.5 w-2.5 rounded-full bg-vermilion" />
      <span className="absolute bottom-[32%] left-[24%] h-2 w-2 rounded-full bg-cobalt" />
      <span className="absolute left-[14%] top-[56%] h-1.5 w-1.5 rounded-full bg-ink/30" />
    </div>
  );
}
