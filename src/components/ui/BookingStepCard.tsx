import { cn } from "@/lib/cn";
import { GlassCard } from "./GlassCard";

type Props = {
  step: number;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  active?: boolean;
  done?: boolean;
};

export function BookingStepCard({
  step,
  title,
  description,
  children,
  className,
  active,
  done,
}: Props) {
  return (
    <GlassCard
      className={cn(
        "border border-white/50 transition-shadow",
        active && "ring-2 ring-[#60A5FA]/50 shadow-xl",
        done && "bg-white/70",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold",
            done
              ? "bg-[#14B8A6] text-white"
              : active
                ? "bg-[#2563EB] text-white"
                : "bg-sky-100 text-sky-800"
          )}
        >
          {step}
        </span>
        <h3 className="font-serif text-lg text-[#1E3A8A]">{title}</h3>
      </div>
      {description ? <p className="mb-4 text-sm text-slate-600">{description}</p> : null}
      {children}
    </GlassCard>
  );
}
