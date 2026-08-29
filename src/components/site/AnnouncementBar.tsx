import { useEffect, useState } from "react";

const messages = [
  "Pay for the higher-priced frame or lens — get the other FREE",
  "Computer & Blue Light Glasses starting at ₹600",
  "100% Authentic Products — Guaranteed",
  "Flat ₹99 delivery across India — fast & tracked",
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-foreground text-background text-[11px] sm:text-[13px] tracking-wide">
      {/* Desktop: static centered message */}
      <div className="hidden sm:flex mx-auto h-9 max-w-7xl items-center justify-center px-4">
        <span key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-500 text-center">
          {messages[i]}
        </span>
      </div>
      {/* Mobile: smooth scrolling marquee */}
      <div className="sm:hidden relative h-8 overflow-hidden">
        <div className="absolute inset-0 flex items-center whitespace-nowrap animate-marquee">
          {[...messages, ...messages].map((m, idx) => (
            <span key={idx} className="mx-8 inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-background/40" />
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
