import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DepthProfileChart = ({ curve, parameter, parameters, unit, region }) => {
  const isMulti = (parameters && parameters.length > 1) || (curve && curve.length > 0 && curve[0].temperature !== undefined && curve[0].salinity !== undefined && (parameter === 'both' || (parameters && parameters.length > 1)));
  const [activeParam, setActiveParam] = useState(isMulti ? 'both' : (parameter || 'temperature'));
  const [showTable, setShowTable] = useState(true);

  if (!curve || curve.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
        No depth stratification data available.
      </div>
    );
  }

  // Oceanographic custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-navy-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">Depth: {data.depth} meters</p>
          <p className="text-cyan-400">
            Temperature: <span className="font-mono">{data.temperature ?? 'N/A'} °C</span>
          </p>
          <p className="text-emerald-400">
            Salinity: <span className="font-mono">{data.salinity ?? 'N/A'} PSU</span>
          </p>
          {data.dissolvedOxygen && (
            <p className="text-indigo-400">
              Dissolved Oxygen: <span className="font-mono">{data.dissolvedOxygen} µmol/kg</span>
            </p>
          )}
          <p className="text-slate-400 text-[10px]">Samples averaged: {data.samples}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Parameter Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Vertical Water Column Profile (0 to 2000m Depth)
        </span>
        <div className="flex space-x-1 bg-navy-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveParam('temperature')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeParam === 'temperature'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temperature (°C)
          </button>
          <button
            onClick={() => setActiveParam('salinity')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeParam === 'salinity'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Salinity (PSU)
          </button>
          <button
            onClick={() => setActiveParam('both')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeParam === 'both'
                ? 'bg-ocean-500/20 text-ocean-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Combined
          </button>
        </div>
      </div>

      {/* Recharts inverted depth curve container */}
      <div className="h-80 w-full bg-navy-950/60 rounded-xl p-2 border border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={curve}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            
            {/* Horizontal X Axis (Value) */}
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit={activeParam === 'salinity' ? ' PSU' : activeParam === 'both' ? '' : ' °C'}
            />

            {/* Vertical Y Axis (Depth inverted: 0 at top, 2000 at bottom) */}
            <YAxis
              type="number"
              dataKey="depth"
              reversed={true}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit=" m"
              domain={[0, 2000]}
              ticks={[0, 100, 200, 400, 600, 800, 1000, 1500, 2000]}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

            {(activeParam === 'temperature' || activeParam === 'both') && (
              <Line
                name="Temperature (°C)"
                type="monotone"
                dataKey="temperature"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4' }}
                activeDot={{ r: 6 }}
              />
            )}

            {(activeParam === 'salinity' || activeParam === 'both') && (
              <Line
                name="Salinity (PSU)"
                type="monotone"
                dataKey="salinity"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
        <span>Sea Surface (0m)</span>
        <span>Thermocline / Halocline Transition Zone</span>
        <span>Deep Abyssal Layer (2000m)</span>
      </div>

      {/* Observation Depth Data Table */}
      <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-3 mt-2">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
          <span className="font-semibold text-slate-300 font-mono">
            Water Column Depth Observation Table {region ? `(${region})` : ''}
          </span>
          <button
            onClick={() => setShowTable(!showTable)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition"
          >
            {showTable ? 'Hide Table' : 'Show Table'}
          </button>
        </div>

        {showTable && (
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-navy-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1.5 px-2">Depth (m)</th>
                  <th className="py-1.5 px-2 text-cyan-400">Temperature (°C)</th>
                  <th className="py-1.5 px-2 text-emerald-400">Salinity (PSU)</th>
                  <th className="py-1.5 px-2 text-indigo-400">Dissolved Oxygen (µmol/kg)</th>
                  <th className="py-1.5 px-2 text-slate-400">Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {curve.map((row) => (
                  <tr key={row.depth} className="hover:bg-slate-800/40 transition">
                    <td className="py-1 px-2 font-bold text-slate-200">{row.depth}m</td>
                    <td className="py-1 px-2 text-cyan-300 font-semibold">
                      {row.temperature !== null && row.temperature !== undefined ? `${row.temperature} °C` : '—'}
                    </td>
                    <td className="py-1 px-2 text-emerald-300 font-semibold">
                      {row.salinity !== null && row.salinity !== undefined ? `${row.salinity} PSU` : '—'}
                    </td>
                    <td className="py-1 px-2 text-indigo-300">
                      {row.dissolvedOxygen !== null && row.dissolvedOxygen !== undefined ? `${row.dissolvedOxygen} µmol/kg` : '—'}
                    </td>
                    <td className="py-1 px-2 text-slate-400">{row.samples || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepthProfileChart;
