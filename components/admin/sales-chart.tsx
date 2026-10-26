"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPhp } from "@/lib/money";

type DailyPoint = {
  date: string;
  label: string;
  revenueCentavos: number;
  orderCount: number;
};

const compactPeso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function SalesChart({ data }: { data: DailyPoint[] }) {
  const totalRevenue = data.reduce((sum, point) => sum + point.revenueCentavos, 0);
  const totalOrders = data.reduce((sum, point) => sum + point.orderCount, 0);
  const bestDay = data.reduce<DailyPoint | null>(
    (best, point) => (!best || point.revenueCentavos > best.revenueCentavos ? point : best),
    null,
  );

  return (
    <div>
      <div className="h-[280px] w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="admin-sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4ff4d" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#c4ff4d" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#a4a2b5", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "#a4a2b5", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value: number) => compactPeso.format(value / 100)}
            />
            <Tooltip
              cursor={{ stroke: "rgba(196,255,77,.35)", strokeWidth: 1 }}
              contentStyle={{
                background: "#11111b",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 12,
                color: "#f6f4ff",
                fontSize: 12,
              }}
              labelStyle={{ color: "#a4a2b5", marginBottom: 4 }}
              formatter={(value) => [formatPhp(Number(value ?? 0)), "Sales"]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="revenueCentavos"
              name="Sales"
              stroke="#c4ff4d"
              strokeWidth={2}
              fill="url(#admin-sales-fill)"
              activeDot={{ r: 4, fill: "#c4ff4d", stroke: "#07070b" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs leading-5 text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Last 30 days:</span>{" "}
          {formatPhp(totalRevenue)} across {totalOrders} paid {totalOrders === 1 ? "order" : "orders"}.
          {totalRevenue > 0 && bestDay ? (
            <>
              {" "}
              Best day: {bestDay.label} with {formatPhp(bestDay.revenueCentavos)}.
            </>
          ) : (
            " No paid sales have been recorded in this period yet."
          )}
        </p>
      </div>
    </div>
  );
}
