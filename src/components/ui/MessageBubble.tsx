import { cn } from "@/lib/cn";

type Props = {
  from: "me" | "them";
  name: string;
  body: string;
  at: string;
};

export function MessageBubble({ from, name, body, at }: Props) {
  return (
    <div
      className={cn("flex w-full", from === "me" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-3xl border px-4 py-2 text-sm shadow-sm backdrop-blur",
          from === "me"
            ? "border-sky-200/60 bg-[#2563EB]/90 text-white"
            : "border-white/50 bg-white/60 text-slate-800"
        )}
      >
        <p className="text-[10px] uppercase tracking-wide text-white/80">{name}</p>
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            from === "me" ? "text-white/70" : "text-slate-400"
          )}
        >
          {at}
        </p>
      </div>
    </div>
  );
}
