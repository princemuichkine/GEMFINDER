"use client";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Stroke color; defaults to a positive/teal tone. */
  color?: string;
  strokeWidth?: number;
}

/**
 * Minimal dependency-free SVG sparkline. Renders a trend line for a series of
 * numbers (e.g. a repo's star history). Flat/empty series render a baseline.
 */
export default function Sparkline({
  values,
  width = 96,
  height = 28,
  color = "#2dd4bf",
  strokeWidth = 1.5,
}: SparklineProps) {
  const clean = values.filter((v) => Number.isFinite(v));

  if (clean.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={1}
        />
      </svg>
    );
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const pad = strokeWidth;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = clean.map((v, i) => {
    const x = pad + (i / (clean.length - 1)) * innerW;
    // invert y so higher values are toward the top
    const y = pad + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `${path} L${points[points.length - 1][0].toFixed(1)},${height - pad} ` +
    `L${points[0][0].toFixed(1)},${height - pad} Z`;

  const rising = clean[clean.length - 1] >= clean[0];
  const lineColor = rising ? color : "#f87171";

  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={areaPath} fill={lineColor} fillOpacity={0.12} stroke="none" />
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
