import { cn } from "@/lib/cn";

type Props = React.PropsWithChildren<
  {
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>
>;

export function GlassCard({ className, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-3xl border border-white/40 bg-white/50 p-6 shadow-lg shadow-sky-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40",
        className
      )}
    >
      {children}
    </div>
  );
}
