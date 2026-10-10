"use client";

import * as React from "react";
import { Clock } from "lucide-react";

export function BookingHoldCountdown({ expiresAt }: { expiresAt: string | Date }) {
  const [timeLeft, setTimeLeft] = React.useState<number>(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const seconds = Math.max(0, Math.floor(diff / 1000));
      setTimeLeft(seconds);
      if (seconds <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isExpired = timeLeft <= 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-white/95 px-4 py-2.5 shadow-md shadow-orange-500/10">
      <Clock className={`size-5 ${isExpired ? "text-red-500" : "animate-pulse text-orange-600"}`} />
      <div>
        <div className="text-[10px] tracking-wider text-neutral-500 font-bold uppercase">
          {isExpired ? "Hold Window Elapsed" : "Hold Expires In"}
        </div>
        <div className={`font-mono text-xl font-black ${isExpired ? "text-red-500" : "text-orange-600"}`}>
          {isExpired ? "Expired" : formatted}
        </div>
      </div>
    </div>
  );
}
