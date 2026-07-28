"use client";

/**
 * Lightweight SVG sparkline — no Recharts (much smaller JS for Pi 2GB).
 */
export function Sparkline({
  values,
  className,
  stroke = "#22d3ee",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  if (values.length < 2) {
    return <div className={className} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const pad = 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const area = `M ${points.split(" ")[0]} L ${points} L ${(w - pad).toFixed(2)},${(h - pad).toFixed(2)} L ${pad},${(h - pad).toFixed(2)} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
