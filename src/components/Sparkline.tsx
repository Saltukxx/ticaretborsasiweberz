import { useId, useMemo } from "react";
import { Area, AreaChart } from "recharts";

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
  const gradientId = useId().replace(/:/g, "");
  const chartData = useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data],
  );

  if (!data.length) return null;

  return (
    <div className="sparkline" style={{ width, height }} aria-hidden>
      {/* Sabit boyut bilindiğinden ResponsiveContainer gereksiz; ResizeObserver
          maliyetini ve ilk render'daki -1 boyut uyarısını önler. */}
      <AreaChart
        width={width}
        height={height}
        data={chartData}
        margin={{ top: 4, right: 2, left: 2, bottom: 4 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          fill={`url(#${gradientId})`}
          dot={data.length === 1 ? { r: 2.5, fill: color, strokeWidth: 0 } : false}
          activeDot={false}
          isAnimationActive={animate}
        />
      </AreaChart>
    </div>
  );
}
