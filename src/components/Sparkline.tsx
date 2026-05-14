interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  animate?: boolean;
}

export default function Sparkline({
  data,
  width = 200,
  height = 60,
  color = "var(--c-green-600)",
  fillColor = "rgba(47, 165, 90, 0.16)",
  strokeWidth = 1.6,
  animate = true,
}: Props) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area =
    `M0,${height} ` +
    points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(" ") +
    ` L${width},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillColor} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`} opacity="0.9" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? {
                strokeDasharray: 600,
                strokeDashoffset: 600,
                animation: "drawLine 1.6s var(--ease-out) forwards",
              }
            : undefined
        }
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}
