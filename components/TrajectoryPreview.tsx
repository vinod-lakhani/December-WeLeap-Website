'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { runTrajectory } from '@/lib/leapImpact/trajectory';
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants';

/** Optimized contribution: match cap OR 15%, whichever is higher. */
const OPTIMIZED_TARGET_PCT = 15;

const DEBOUNCE_MS = 250;
const FALLBACK_SALARY = 100_000;
const FALLBACK_CURRENT = 5;
const FALLBACK_MATCH_RATE = 100;
const FALLBACK_MATCH_CAP = 5;

function formatCurrencyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export interface TrajectoryPreviewProps {
  salary: string;
  hasMatch: boolean;
  matchRatePct: string;
  matchCapPct: string;
  current401kPct: string;
}

export function TrajectoryPreview({
  salary,
  hasMatch,
  matchRatePct,
  matchCapPct,
  current401kPct,
}: TrajectoryPreviewProps) {
  const [debouncedSalary, setDebouncedSalary] = useState(salary);
  const [debouncedMatchRate, setDebouncedMatchRate] = useState(matchRatePct);
  const [debouncedMatchCap, setDebouncedMatchCap] = useState(matchCapPct);
  const [debouncedCurrent, setDebouncedCurrent] = useState(current401kPct);
  const [debouncedHasMatch, setDebouncedHasMatch] = useState(hasMatch);

  useEffect(() => {
    const tid = setTimeout(() => {
      setDebouncedSalary(salary);
      setDebouncedMatchRate(matchRatePct);
      setDebouncedMatchCap(matchCapPct);
      setDebouncedCurrent(current401kPct);
      setDebouncedHasMatch(hasMatch);
    }, DEBOUNCE_MS);
    return () => clearTimeout(tid);
  }, [salary, matchRatePct, matchCapPct, current401kPct, hasMatch]);

  const trajectoryResult = useMemo(() => {
    const salaryNum = parseFloat(debouncedSalary);
    const gross = salaryNum > 0 ? salaryNum : FALLBACK_SALARY;
    const matchRate = parseFloat(debouncedMatchRate);
    const matchCap = parseFloat(debouncedMatchCap);
    const current = parseFloat(debouncedCurrent);
    const currentPct = !Number.isNaN(current) && current >= 0 ? current : FALLBACK_CURRENT;
    const matchRatePctNum = !Number.isNaN(matchRate) && matchRate >= 0 ? matchRate : FALLBACK_MATCH_RATE;
    const matchCapPctNum = !Number.isNaN(matchCap) && matchCap >= 0 ? matchCap : FALLBACK_MATCH_CAP;

    const optimizedPct = debouncedHasMatch
      ? Math.max(matchCapPctNum, OPTIMIZED_TARGET_PCT)
      : OPTIMIZED_TARGET_PCT;

    return runTrajectory({
      grossAnnual: gross,
      current401kPct: currentPct,
      optimized401kPct: optimizedPct,
      matchPct: matchCapPctNum,
      matchRatePct: matchRatePctNum,
      hasEmployerMatch: debouncedHasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    });
  }, [debouncedSalary, debouncedMatchRate, debouncedMatchCap, debouncedCurrent, debouncedHasMatch]);

  const chartData = useMemo(() => {
    return trajectoryResult.yearLabels.map((year, i) => ({
      year,
      Default: trajectoryResult.baselineByYear[i] ?? 0,
      Optimized: trajectoryResult.optimizedByYear[i] ?? 0,
    }));
  }, [trajectoryResult]);

  const delta5 = useMemo(() => {
    const b5 = trajectoryResult.baselineByYear[5] ?? 0;
    const o5 = trajectoryResult.optimizedByYear[5] ?? 0;
    return o5 - b5;
  }, [trajectoryResult]);

  const delta30 = trajectoryResult.delta30yr;
  const isUsingFallback = !salary.trim() || parseFloat(salary) <= 0;

  return (
    <div className="w-full mb-8">
      <p className="text-center text-sm font-medium text-gray-600 mb-3">
        Example: small change → big gap
      </p>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isUsingFallback ? 'Sample projection' : 'Live projection'}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-4 h-0.5 bg-[#9CA3AF] rounded" /> Default
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#3F6B42] font-medium">
              <span className="w-4 h-0.5 bg-[#3F6B42] rounded" /> Optimized
            </span>
          </div>
        </div>
        <div className="h-[300px] w-full px-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(v) => (v === 0 ? '0' : v % 5 === 0 ? `${v}` : '')}
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => {
                  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                  return `$${v}`;
                }}
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrencyShort(value), '']}
                labelFormatter={(label) => `Year ${label}`}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <ReferenceLine x={5} stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine x={30} stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="Default"
                stroke="#9CA3AF"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#9CA3AF', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="Optimized"
                stroke="#3F6B42"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#3F6B42', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="px-4 pb-4 pt-2 flex flex-wrap gap-6 sm:gap-10 items-baseline">
          <div>
            <span className="text-xs text-gray-500">Year 5 delta: </span>
            <span className="text-sm font-medium text-[#3F6B42]">+{formatCurrencyShort(delta5)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Year 30 delta: </span>
            <span className="text-base font-bold text-[#3F6B42]">+{formatCurrencyShort(delta30)}</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-4">
        Sample only. Your numbers will update when you enter them below.
      </p>
    </div>
  );
}
