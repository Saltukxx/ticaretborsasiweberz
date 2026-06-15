import { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatChartDate } from "../lib/formatLocalDate";
import type { PriceHistoryPoint } from "../lib/publicApi";
import "./PriceHistoryChart.css";

type ChartRow = {
  date: string;
  label: string;
  avg: number;
  low: number;
  high: number;
};

function toChartRows(points: PriceHistoryPoint[]): ChartRow[] {
  return points
    .filter((p) => p.entry_date && p.avg_price != null)
    .map((p) => ({
      date: p.entry_date!,
      label: formatChartDate(p.entry_date!),
      avg: p.avg_price!,
      low: p.low_price ?? p.avg_price!,
      high: p.high_price ?? p.avg_price!,
    }));
}

function formatAxisValue(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}

function formatPriceValue(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PriceTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartRow }>;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="price-history-chart__tooltip" role="status">
      <span className="mono">{formatChartDate(row.date)}</span>
      <strong>
        Ort: {formatPriceValue(row.avg)}
        {unit ? ` ${unit}` : ""}
      </strong>
      <span className="mono">
        {formatPriceValue(row.low)} – {formatPriceValue(row.high)}
      </span>
    </div>
  );
}

export default function PriceHistoryChart({
  data,
  loading,
  error,
  unit,
}: {
  data: PriceHistoryPoint[];
  loading?: boolean;
  error?: boolean;
  unit?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const rows = useMemo(() => toChartRows(data), [data]);

  const yDomain = useMemo((): [number, number] => {
    if (!rows.length) return [0, 1];
    const min = Math.min(...rows.map((r) => r.low));
    const max = Math.max(...rows.map((r) => r.high));
    const pad = (max - min) * 0.1 || Math.max(max * 0.05, 1);
    return [Math.max(0, min - pad), max + pad];
  }, [rows]);

  if (loading) {
    return (
      <div className="price-history-chart price-history-chart--loading" aria-busy="true">
        <p className="mono">Grafik yükleniyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-history-chart price-history-chart--empty">
        <p className="mono">Grafik verisi yüklenemedi. Lütfen sayfayı yenileyin.</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="price-history-chart price-history-chart--empty">
        <p className="mono">Bu dönem için fiyat geçmişi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="price-history-chart">
      <ResponsiveContainer
        width="100%"
        height={220}
        minWidth={0}
        initialDimension={{ width: 560, height: 220 }}
      >
        <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(47, 165, 90, 0.28)" />
              <stop offset="100%" stopColor="rgba(47, 165, 90, 0.02)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ className: "price-history-chart__axis-tick" }}
            minTickGap={40}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={formatAxisValue}
            tick={{ className: "price-history-chart__axis-tick" }}
          />
          <Tooltip
            content={(props) => <PriceTooltip {...props} unit={unit} />}
            cursor={{ stroke: "rgba(37, 138, 74, 0.35)", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="var(--c-green-600)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 2.5, fill: "var(--c-green-600)", strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "var(--c-green-600)", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="low"
            stroke="rgba(37, 138, 74, 0.4)"
            strokeWidth={1}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="high"
            stroke="rgba(37, 138, 74, 0.4)"
            strokeWidth={1}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {unit ? <p className="price-history-chart__unit mono">{unit}</p> : null}
    </div>
  );
}
