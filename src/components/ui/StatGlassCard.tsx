import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  trend?: "up" | "down" | "neutral";
};

export function StatGlassCard({ label, value, hint, className, trend = "neutral" }: Props) {
  return (
    <GlassCard className={cn("p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-3xl text-[#1E3A8A]">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-xs",
            trend === "up" && "text-[#14B8A6]",
            trend === "down" && "text-rose-500",
            trend === "neutral" && "text-slate-500"
          )}
        >
          {hint}
        </p>
      ) : null}
    </GlassCard>
  );
}
