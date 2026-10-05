import React from "react";

export function BrandLogo({ className = "h-7 w-7", withRing = true }: { className?: string; withRing?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="header-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E5AB" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#AA7C11" />
          <stop offset="100%" stopColor="#E5C158" />
        </linearGradient>
        <linearGradient id="header-gold-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#FFF3C4" />
          <stop offset="100%" stopColor="#C59B27" />
        </linearGradient>
        <radialGradient id="header-bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1A1813" />
          <stop offset="85%" stopColor="#0B0B09" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
      </defs>

      {/* Circular Base */}
      <circle cx="60" cy="60" r="58" fill="url(#header-bg-grad)" />

      {/* Rings */}
      {withRing && (
        <>
          <circle cx="60" cy="60" r="54" fill="none" stroke="url(#header-gold-grad)" strokeWidth="2.5" />
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#header-gold-grad)" strokeWidth="0.8" opacity="0.6" />
        </>
      )}

      {/* Monogram LM */}
      <g transform="translate(60, 60)">
        {/* Letter L (Left) */}
        <path
          d="M -30 -26 
             L -21 -26
             C -21 -26, -21 -18, -21 -14
             L -21 17
             C -21 21, -21 21, -16 21
             L -6 21
             L -6 27
             L -32 27
             L -32 21
             C -27 21, -27 21, -27 17
             L -27 -20
             C -27 -24, -27 -24, -30 -26
             Z"
          fill="url(#header-gold-glow)"
        />

        {/* Letter M (Right & Interlocking) */}
        <path
          d="M -12 -26
             L -2 -26
             C -2 -24, -2 -24, -2 -20
             L -2 8
             L 11 -26
             L 19 -26
             L 32 8
             L 32 -20
             C 32 -24, 32 -24, 29 -26
             L 39 -26
             L 39 -20
             C 36 -20, 36 -20, 36 -16
             L 36 21
             C 36 25, 36 25, 39 27
             L 28 27
             L 28 21
             C 31 21, 31 21, 31 17
             L 31 -3
             L 16 27
             L 13 27
             L -2 -3
             L -2 17
             C -2 21, -2 21, 1 21
             L 1 27
             L -12 27
             L -12 21
             C -9 21, -9 21, -9 17
             L -9 -20
             C -9 -24, -9 -24, -12 -26
             Z"
          fill="url(#header-gold-grad)"
        />
      </g>
    </svg>
  );
}
