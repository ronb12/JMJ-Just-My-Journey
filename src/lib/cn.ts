export function cn(...c: (string | undefined | false)[]) {
  return c.filter(Boolean).join(" ");
}
