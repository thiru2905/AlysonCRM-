import { cn } from "@/lib/utils";

const LOGO_SRC = "/images/alyson-mini.svg";

export function AlysonLogo({
  size = 28,
  showWordmark = true,
  wordmarkClassName,
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 min-w-0", className)}>
      <img
        src={LOGO_SRC}
        alt="Alyson"
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        draggable={false}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-semibold tracking-tight leading-tight truncate",
            wordmarkClassName,
          )}
        >
          Agentic CRM+
        </span>
      ) : null}
    </span>
  );
}
