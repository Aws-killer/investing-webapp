"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// --- Internal Components ---

const ChartTooltip = ({ active, payload, label, formatter, isPercentageMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border px-3 py-2 rounded-md shadow-2xl min-w-[120px]">
        <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="font-mono font-bold text-sm tracking-tight mb-0.5" style={{ color: entry.color }}>
            {entry.name && <span className="text-xs text-muted-foreground mr-2">{entry.name}:</span>}
            {isPercentageMode ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%` : formatter(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialChart = ({
  data = [],
  currentValue = 0,
  title = "Value",
  formatter = (val) => val,
  isLoading = false,
  className,
  datasets = [],
  // New props for internal controls
  timeRange,
  onTimeRangeChange,
  children // To render the Compare button or other overlays
}) => {
  const isMultiChart = datasets.length > 0;
  
  const processedDatasets = useMemo(() => {
    if (!isMultiChart) return [];
    return datasets.map(({ data: dataArray, name, color }) => {
      if (!Array.isArray(dataArray) || dataArray.length === 0) return { data: [], name, color, startValue: 0 };
      const startValue = dataArray[0].value;
      const percentageData = dataArray.map(item => ({
        date: item.date,
        value: startValue === 0 ? 0 : ((item.value - startValue) / startValue) * 100
      }));
      return { data: percentageData, name, color, startValue };
    });
  }, [datasets, isMultiChart]);

  const validData = useMemo(() => {
    if (isMultiChart) {
      const dateMap = new Map();
      processedDatasets.forEach(({ data: dataArray, name }) => {
        if (!Array.isArray(dataArray)) return;
        dataArray.forEach(item => {
          if (item && item.date && typeof item.value === 'number') {
            if (!dateMap.has(item.date)) dateMap.set(item.date, { date: item.date });
            dateMap.get(item.date)[name] = item.value;
          }
        });
      });
      return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } else {
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && typeof item.value === 'number');
    }
  }, [data, processedDatasets, isMultiChart]);

  const { startValue, dataMax, dataMin } = useMemo(() => {
    if (validData.length === 0) return { startValue: 0, dataMax: 0, dataMin: 0 };
    if (isMultiChart) {
      const allValues = [];
      processedDatasets.forEach(({ name }) => {
        validData.forEach(item => { if (item[name] !== undefined) allValues.push(item[name]); });
      });
      return { startValue: 0, dataMax: Math.max(...allValues, 0), dataMin: Math.min(...allValues, 0) };
    } else {
      const values = validData.map((i) => i.value);
      return { startValue: validData[0].value, dataMax: Math.max(...values), dataMin: Math.min(...values) };
    }
  }, [validData, processedDatasets, isMultiChart]);

  const gradientOffset = useMemo(() => {
    if (dataMax <= dataMin) return 0.5;
    if (startValue >= dataMax) return 0;
    if (startValue <= dataMin) return 1;
    return (dataMax - startValue) / (dataMax - dataMin);
  }, [dataMax, dataMin, startValue]);

  const colorUp = "#22d3ee";
  const colorDown = "#f87171";
  const multiChartColors = ["#22d3ee", "#a78bfa", "#fb923c", "#4ade80", "#f472b6"];

  if (isLoading) {
    return (
      <div className={cn("w-full h-full p-6", className)}>
        <Skeleton className="h-full w-full bg-zinc-800/20 rounded-lg" />
      </div>
    );
  }

  if (!validData || validData.length === 0) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center relative bg-[#0a0a0a]", className)}>
        <span className="text-zinc-600 text-sm font-medium">No Data Available</span>
      </div>
    );
  }

  const percentageFormatter = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

  return (
    <div className={cn("relative w-full h-full bg-transparent overflow-hidden", className)}>
      
      {/* --- Controls Overlay (Top Left) --- */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {onTimeRangeChange && (
          <div className="flex bg-[#121212]/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-0.5">
            {['1D', '1W', '1M', '6M', '1Y', 'MAX'].map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                  timeRange === range
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        )}
        {children}
      </div>

      {/* --- Prev Close Line --- */}
      {!isMultiChart && (
        <div className="absolute right-4 top-4 z-20 pointer-events-none">
           <div className="px-3 py-1 rounded-full border border-zinc-800 bg-[#121212]/60 backdrop-blur-md text-[10px] font-medium text-zinc-500">
             Prev close: {formatter(startValue)}
           </div>
        </div>
      )}

      {/* --- Chart --- */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={validData} margin={{ top: 50, right: 0, left: -20, bottom: 0 }}>
          <defs>
            {!isMultiChart && (
              <>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor={colorUp} stopOpacity={1} />
                  <stop offset={gradientOffset} stopColor={colorDown} stopOpacity={1} />
                </linearGradient>
                <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorUp} stopOpacity={0.2} />
                  <stop offset={gradientOffset} stopColor={colorUp} stopOpacity={0} />
                  <stop offset={gradientOffset} stopColor={colorDown} stopOpacity={0} />
                  <stop offset="100%" stopColor={colorDown} stopOpacity={0.2} />
                </linearGradient>
              </>
            )}
            {isMultiChart && processedDatasets.map(({ name, color }, idx) => (
              <linearGradient key={name} id={`fill-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color || multiChartColors[idx]} stopOpacity={0.1} />
                <stop offset="100%" stopColor={color || multiChartColors[idx]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <YAxis
            domain={["auto", "auto"]}
            orientation="right"
            tick={{ fontSize: 10, fill: "#52525b" }}
            axisLine={false}
            tickLine={false}
            tickCount={6}
            tickFormatter={isMultiChart ? percentageFormatter : (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
          />
          <XAxis dataKey="date" hide />
          <Tooltip content={<ChartTooltip formatter={formatter} isPercentageMode={isMultiChart} />} cursor={{ stroke: "#52525b", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <ReferenceLine y={isMultiChart ? 0 : startValue} stroke="#52525b" strokeDasharray="4 4" strokeWidth={1} opacity={0.3} />

          {isMultiChart ? (
            processedDatasets.map(({ name, color }, idx) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={color || multiChartColors[idx]}
                fill={`url(#fill-${name})`}
                strokeWidth={2}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color || multiChartColors[idx] }}
              />
            ))
          ) : (
            <Area
              type="monotone"
              dataKey="value"
              stroke="url(#splitColor)"
              fill="url(#splitFill)"
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#fff" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};