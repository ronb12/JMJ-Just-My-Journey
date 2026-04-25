import { cn } from "@/lib/cn";

type Props = {
  from: "me" | "them";
  name: string;
  body: string;
  at: string | Date;
};

export function MessageBubble({ from, name, body, at }: Props) {
  const atText = (() => {
    if (at instanceof Date) return at.toLocaleString();
    const d = new Date(at);
    return Number.isNaN(d.getTime()) ? String(at) : d.toLocaleString();
  })();
  return (
    <div
      className={cn("flex w-full", from === "me" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[90%] rounded-3xl border px-4 py-3 text-sm shadow-sm backdrop-blur",
          from === "me"
            ? "border-sky-200/60 bg-[#2563EB]/90 text-white"
            : "border-sky-200/50 bg-white/85 text-slate-800 dark:border-white/10 dark:bg-slate-800/90 dark:text-slate-100"
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={cn(
              "text-[10px] uppercase tracking-wide",
              from === "me" ? "text-white/80" : "text-slate-500 dark:text-slate-400"
            )}
          >
            {name}
          </p>
          <p className={cn("text-[10px]", from === "me" ? "text-white/70" : "text-slate-400 dark:text-slate-500")}>
            {atText}
          </p>
        </div>
        <p className="mt-1 whitespace-pre-wrap leading-relaxed">{body}</p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            from === "me" ? "text-white/70" : "text-slate-400"
          )}
        >
          {/* keep row height stable for short messages */}
        </p>
      </div>
    </div>
  );
}
