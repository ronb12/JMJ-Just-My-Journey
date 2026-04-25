"use client";

import { SessionProvider as NSession } from "next-auth/react";
import { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NSession>{children}</NSession>;
}
