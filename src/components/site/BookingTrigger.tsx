"use client";

import type { ReactNode } from "react";

export default function BookingTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <button
      className={className}
      onClick={() => window.dispatchEvent(new Event("rekin:open-booking"))}
      type="button"
    >
      {children}
    </button>
  );
}
