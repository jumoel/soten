import { useState, useEffect, type ReactNode } from "react";

export function DelayedFallback({ children, ms = 150 }: { children: ReactNode; ms?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return show ? <>{children}</> : null;
}
