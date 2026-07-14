import { cn } from "@/lib/utils";

export function EntityAvatar({
  name,
  src,
  size = 44,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover border border-border", className)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "rounded-full grid place-items-center shrink-0",
        "bg-accent text-foreground text-mono text-xs font-medium",
        "border border-border",
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
