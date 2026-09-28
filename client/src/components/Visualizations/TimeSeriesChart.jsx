import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TimeSeriesChart = ({
  trend,
  historical,
  forecast,
  parameter,
  unit,
  depth,
  trendSummary,
}) => {
  // Combine historical and forecast data if this is a prediction view
  const isForecast = Array.isArray(forecast) && forecast.length > 0;

  let chartData = [];
  if (isForecast) {
    const hist = (historical || []).map((h) => ({
      period: h.period,
      observed: h.observed,
      predicted: null,
      confidence_upper: null,
      confidence_lower: null,
      type: 'observed',
    }));

    // Bridge the last historical point with the first forecast point
    if (hist.length > 0 && forecast.length > 0) {
      const lastHist = hist[hist.length - 1];
      chartData = [
        ...hist.slice(0, -1),
        {
          ...lastHist,
          predicted: lastHist.observed,
        },
        ...forecast.map((f) => ({
          period: f.period,
          observed: null,
          predicted: f.predicted,
          confidence_upper: f.confidence_upper,
          confidence_lower: f.confidence_lower,
          uncertainty_margin: f.uncertainty_margin,
          type: 'predicted',
        })),
      ];
    } else {
      chartData = [...hist, ...forecast];
    }
  } else if (Array.isArray(trend)) {
    chartData = trend.map((t) => ({
      period: t.period,
      observed: t.observed,
      count: t.count,
      type: 'observed',
    }));
  }

  if (chartData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
        No temporal observations available for this depth and region.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-navy-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">Month: {label}</p>
          {item.observed !== null && item.observed !== undefined && (
            <p className="text-cyan-400 font-medium">
              Observed {parameter}: <span className="font-bold">{item.observed} {unit}</span>
            </p>
          )}
          {item.predicted !== null && item.predicted !== undefined && (
            <>
              <p className="text-amber-400 font-medium">
                Forecasted {parameter}: <span className="font-bold">{item.predicted} {unit}</span>
              </p>
              {item.uncertainty_margin && (
                <p className="text-slate-400 text-[10px]">
                  95% Confidence Band: ±{item.uncertainty_margin} {unit}
                </p>
              )}
            </>
          )}
          <div className="pt-1 mt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
            <span
              className={`px-2 py-0.5 rounded font-medium ${
                item.type === 'observed'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {item.type === 'observed' ? 'Real Observed Data' : 'Validated ML Forecast'}
            </span>
            {item.count && <span className="text-slate-400">{item.count} profiles</span>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          Time-Series Evolution {depth !== undefined && depth !== null ? `@ ${depth}m Depth` : ''}
        </span>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Observed ARGO History</span>
          </span>
          {isForecast && (
            <span className="flex items-center space-x-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 border-dashed" />
              <span>Projected 12-Month Trend</span>
            </span>
          )}
        </div>
      </div>

      <div className="h-80 w-full bg-navy-950/60 rounded-xl p-2 border border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="period"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={25}
            />
            <YAxis
              type="number"
              domain={['auto', 'auto']}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit={` ${unit}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

            {/* Observed historical line */}
            <Line
              name={`Observed ${parameter} (${unit})`}
              type="monotone"
              dataKey="observed"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#06b6d4' }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />

            {/* Forecast predicted line */}
            {isForecast && (
              <Line
                name={`Forecasted ${parameter} (${unit})`}
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Deterministic Trend Summary Analytics */}
      {trendSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-navy-950/80 border border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-xs block">Start ({trendSummary.start_period})</span>
            <span className="text-slate-100 font-bold text-sm mt-0.5 block">
              {trendSummary.start_value ?? 'N/A'} {unit}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-xs block">End ({trendSummary.end_period})</span>
            <span className="text-slate-100 font-bold text-sm mt-0.5 block">
              {trendSummary.end_value ?? 'N/A'} {unit}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-xs block">Net Change</span>
            <span
              className={`font-bold text-sm mt-0.5 block ${
                trendSummary.change > 0
                  ? 'text-amber-400'
                  : trendSummary.change < 0
                  ? 'text-cyan-400'
                  : 'text-slate-200'
              }`}
            >
              {trendSummary.change !== null && trendSummary.change !== undefined
                ? `${trendSummary.change >= 0 ? '+' : ''}${trendSummary.change} ${unit}`
                : 'N/A'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-xs block">Trend Direction</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-semibold ${
                trendSummary.trend_direction === 'Increasing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : trendSummary.trend_direction === 'Decreasing'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {trendSummary.trend_direction || 'Relatively Stable'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSeriesChart;
