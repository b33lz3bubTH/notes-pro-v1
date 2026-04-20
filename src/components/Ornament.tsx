export const Ornament = ({ className = "" }: { className?: string }) => (
  <div className={`ornament ${className}`}>
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" className="text-gold-deep">
      <path
        d="M20 2 C 14 2, 10 6, 10 10 C 10 14, 14 18, 20 18 C 26 18, 30 14, 30 10 C 30 6, 26 2, 20 2 Z M20 6 L22 10 L20 14 L18 10 Z"
        fill="currentColor"
      />
      <circle cx="4" cy="10" r="1.5" fill="currentColor" />
      <circle cx="36" cy="10" r="1.5" fill="currentColor" />
    </svg>
  </div>
);

export const FleurDeLis = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-1 2-3 3-3 5 0 1 .5 2 1 2.5-2 0-4 1-4 3 0 1.5 1 2.5 2 3-1 .5-2 1.5-2 3 0 2 2 3 4 3-.5.5-1 1.5-1 2.5 0 1.5 1 2 3 2s3-.5 3-2c0-1-.5-2-1-2.5 2 0 4-1 4-3 0-1.5-1-2.5-2-3 1-.5 2-1.5 2-3 0-2-2-3-4-3 .5-.5 1-1.5 1-2.5 0-2-2-3-3-5z" />
    <rect x="6" y="13" width="12" height="1.5" />
  </svg>
);

export const CornerFlourish = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const pos = {
    tl: "top-2 left-2",
    tr: "top-2 right-2",
    bl: "bottom-2 left-2",
    br: "bottom-2 right-2",
  }[position];
  return (
    <svg
      className={`absolute ${pos} pointer-events-none text-gold-deep`}
      width="36"
      height="36"
      viewBox="0 0 36 36"
      style={{ transform: `rotate(${rot}deg)` }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M2 14 Q2 2 14 2" />
      <path d="M2 8 Q2 6 6 6 L10 6" />
      <path d="M8 2 Q6 2 6 6 L6 10" />
      <circle cx="6" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
};
