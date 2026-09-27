import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const RegionalBarChart = ({ chartData, parameter, parameters, unit }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
        No regional comparison data available.
      </div>
    );
  }

  const isMulti = (parameters && parameters.length > 1) || 
    (chartData.length > 0 && chartData[0].temperature !== undefined && chartData[0].salinity !== undefined);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-slate-200 text-sm">{data.region}</p>
          <div className="space-y-1">
            {data.temperature !== undefined && (
              <p className="text-cyan-400">
                Temperature: <span className="font-mono font-bold">{data.temperature} °C</span>
              </p>
            )}
            {data.salinity !== undefined && (
              <p className="text-emerald-400">
                Salinity: <span className="font-mono font-bold">{data.salinity} PSU</span>
              </p>
            )}
            {data.mean !== undefined && !isMulti && (
              <p className="text-cyan-400">
                Mean {parameter}: <span className="font-mono font-bold">{data.mean} {unit}</span>
              </p>
            )}
            {data.min !== undefined && data.max !== undefined && (
              <p className="text-slate-300">
                Range: <span className="font-mono">{data.min} to {data.max} {unit}</span>
              </p>
            )}
            <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
              Profiles: {data.profileCount || data.count || 0} | Floats: {data.floatCount || 1}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-300 font-mono">
          Cross-Basin Comparison {isMulti ? '(Temperature & Salinity)' : `(${parameter})`}
        </span>
        <span className="font-mono text-cyan-400">
          {isMulti ? 'Units: °C & PSU' : `Unit: ${unit}`}
        </span>
      </div>

      <div className="h-80 w-full bg-navy-950/60 rounded-xl p-2 border border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="region" stroke="#64748b" fontSize={12} tickLine={false} />
            
            {isMulti ? (
              <>
                <YAxis
                  yAxisId="left"
                  stroke="#0ea5e9"
                  fontSize={11}
                  tickLine={false}
                  unit=" °C"
                  domain={['auto', 'auto']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  unit=" PSU"
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  name="Mean Temperature (°C)"
                  dataKey="temperature"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
                <Bar
                  yAxisId="right"
                  name="Mean Salinity (PSU)"
                  dataKey="salinity"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </>
            ) : (
              <>
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  unit={` ${unit}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  name={`Mean ${parameter} (${unit})`}
                  dataKey={chartData[0]?.mean !== undefined ? 'mean' : (parameter || 'temperature')}
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
                {chartData[0]?.max !== undefined && (
                  <Bar
                    name={`Max Observed (${unit})`}
                    dataKey="max"
                    fill="#06b6d4"
                    opacity={0.4}
                    radius={[6, 6, 0, 0]}
                    barSize={20}
                  />
                )}
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Regional Comparison Structured Table */}
      <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-3 mt-2">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-300 font-semibold font-mono">
          <span>Comparative Ocean Basin Metrics</span>
          <span className="text-[11px] text-slate-400">Basins Compared: {chartData.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80">
                <th className="py-1.5 px-2">Basin</th>
                {isMulti ? (
                  <>
                    <th className="py-1.5 px-2 text-cyan-400">Mean Temp (°C)</th>
                    <th className="py-1.5 px-2 text-emerald-400">Mean Salinity (PSU)</th>
                  </>
                ) : (
                  <>
                    <th className="py-1.5 px-2 text-cyan-400">Mean {parameter} ({unit})</th>
                    <th className="py-1.5 px-2 text-slate-300">Min / Max</th>
                  </>
                )}
                <th className="py-1.5 px-2 text-slate-300">Profiles</th>
                <th className="py-1.5 px-2 text-slate-300">Floats</th>
                <th className="py-1.5 px-2 text-slate-400">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {chartData.map((row) => (
                <tr key={row.region} className="hover:bg-slate-800/40 transition">
                  <td className="py-1.5 px-2 font-bold text-slate-200">{row.region}</td>
                  {isMulti ? (
                    <>
                      <td className="py-1.5 px-2 text-cyan-300 font-semibold">
                        {row.temperature !== undefined && row.temperature !== null ? `${row.temperature} °C` : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-emerald-300 font-semibold">
                        {row.salinity !== undefined && row.salinity !== null ? `${row.salinity} PSU` : '—'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-1.5 px-2 text-cyan-300 font-semibold">
                        {row.mean ?? row[parameter] ?? '—'} {unit}
                      </td>
                      <td className="py-1.5 px-2 text-slate-300">
                        {row.min !== undefined && row.max !== undefined ? `${row.min} to ${row.max}` : '—'}
                      </td>
                    </>
                  )}
                  <td className="py-1.5 px-2 text-slate-300">{row.profileCount || row.count || 0}</td>
                  <td className="py-1.5 px-2 text-slate-300 font-semibold text-cyan-300">
                    {row.floatCount ? `${row.floatCount} ${row.floatCount === 1 ? 'float' : 'floats'}` : '1 float'}
                  </td>
                  <td className="py-1.5 px-2 text-slate-400">{row.observationCount || row.count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegionalBarChart;
