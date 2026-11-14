import { cn } from "@/lib/utils";

export function Clouds({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="cloud animate-drift left-[-6%] top-[18%] h-14 w-44 opacity-80 sm:h-20 sm:w-64" />
      <div
        className="cloud animate-drift right-[-8%] top-[8%] h-12 w-36 opacity-70 sm:h-16 sm:w-52"
        style={{ animationDelay: "-6s" }}
      />
      {dense ? (
        <>
          <div
            className="cloud animate-drift bottom-[12%] left-[18%] h-10 w-32 opacity-60"
            style={{ animationDelay: "-11s" }}
          />
          <div
            className="cloud animate-drift bottom-[26%] right-[6%] h-16 w-48 opacity-55"
            style={{ animationDelay: "-3s" }}
          />
        </>
      ) : null}
    </div>
  );
}
