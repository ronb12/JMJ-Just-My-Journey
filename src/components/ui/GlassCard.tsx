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
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-sky-900/5 dark:border-white/10 dark:bg-slate-900",
        className
      )}
    >
      {children}
    </div>
  );
}
