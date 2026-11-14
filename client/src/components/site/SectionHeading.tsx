import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  titleEm,
  intro,
  align = "left",
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  titleEm?: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl", className)}>
      <p className={cn("eyebrow", align === "center" && "justify-center")}>
        {eyebrow}
        <Sparkles className="h-3.5 w-3.5 text-vermilion" aria-hidden="true" />
      </p>
      <h2 className="mt-4 font-display text-[2.45rem] font-semibold leading-[0.98] tracking-[-0.04em] text-ink sm:text-5xl lg:text-[3.6rem]">
        {title}
        {titleEm ? (
          <>
            {" "}
            <span className="font-light italic text-cobalt">{titleEm}</span>
          </>
        ) : null}
      </h2>
      {intro ? (
        <p className={cn("mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg", align === "center" && "mx-auto")}>
          {intro}
        </p>
      ) : null}
      {children}
    </div>
  );
}
