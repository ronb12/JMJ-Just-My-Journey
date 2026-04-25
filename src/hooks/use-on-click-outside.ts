"use client";

import { useEffect, RefObject } from "react";

export function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void
) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current) return;
      if (e.target && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, [ref, onOutside]);
}
