import { ScoreBreakdown } from "@/lib/recruiting/types";
import { cn } from "@/lib/utils";

function toneColor(score: number): string {
  if (score >= 75) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--muted-foreground)";
}

export function ScoreRing({
  score,
  size = 44,
}: {
  score: number;
  size?: number;
}) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, score) / 100) * circumference;
  const color = toneColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

const BREAKDOWN_ROWS: { key: keyof Omit<ScoreBreakdown, "total">; label: string; max: number }[] = [
  { key: "requiredSkills", label: "Required skills", max: 40 },
  { key: "relevantExperience", label: "Relevant experience", max: 25 },
  { key: "seniority", label: "Seniority", max: 15 },
  { key: "locationCompatibility", label: "Location / remote", max: 10 },
  { key: "preferredSkills", label: "Preferred skills", max: 10 },
];

export function ScoreBreakdownView({
  breakdown,
  className,
}: {
  breakdown: ScoreBreakdown;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {BREAKDOWN_ROWS.map((row) => {
        const value = breakdown[row.key];
        const pct = (value / row.max) * 100;
        return (
          <div key={row.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">
                {value.toFixed(1)} / {row.max}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
