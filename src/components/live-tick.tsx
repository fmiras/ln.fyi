"use client";

import { useEffect, useState } from "react";

export function LiveTick() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, "0");
      const m = String(d.getUTCMinutes()).padStart(2, "0");
      const s = String(d.getUTCSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-amber" />
      <span className="mono-xs text-paper-dim tabular hidden sm:inline">
        {time || "—— : —— UTC"}
      </span>
      <span className="mono-xs text-paper-dim tabular sm:hidden">
        LIVE
      </span>
    </div>
  );
}
