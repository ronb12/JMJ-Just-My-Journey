import { cn } from "@/lib/cn";

export function GradientBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      <div className="bg-gradient-hero absolute inset-0" />
      <div className="float-blob-1 absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-[#60A5FA]/20 blur-3xl" />
      <div className="float-blob-2 absolute right-[-20%] top-1/4 h-[380px] w-[380px] rounded-full bg-[#14B8A6]/15 blur-3xl" />
      <div className="float-blob-3 absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[#2563EB]/20 blur-3xl" />
    </div>
  );
}
