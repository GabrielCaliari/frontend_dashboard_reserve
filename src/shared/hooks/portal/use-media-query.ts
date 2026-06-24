"use client";

import { useEffect, useState } from "react";

function evaluate(query: string): boolean {
  if (typeof window === "undefined") return false;
  const match = /max-width:\s*(\d+)px/.exec(query);
  if (match) {
    return window.innerWidth <= Number(match[1]);
  }
  return window.matchMedia?.(query).matches ?? false;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => evaluate(query));

  useEffect(() => {
    const update = () => setMatches(evaluate(query));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [query]);

  return matches;
}
