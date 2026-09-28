import React from 'react';
import {
  Waves,
  Globe,
  Thermometer,
  ArrowDownToLine,
  CloudDownload,
  Activity,
} from 'lucide-react';

const RightPanel = ({ onOpenFleet }) => {
  return (
    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col space-y-4 select-none">
      {/* Card 1: ARGO at a Glance */}
      <div className="bg-[#071329]/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-2 text-white">
          <Waves className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            ARGO at a Glance
          </h2>
        </div>

        {/* 4 Metric Rows */}
        <div className="space-y-3.5 pt-1">
          {/* 1. Global Ocean Coverage */}
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex-shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">
                Global Ocean Coverage
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ~ 3,900 floats (active)
              </p>
            </div>
          </div>

          {/* 2. Measurements */}
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 flex-shrink-0 mt-0.5">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">
                Measurements
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Temperature • Salinity • Pressure
              </p>
            </div>
          </div>

          {/* 3. Depth Range */}
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-800/60 text-blue-400 flex-shrink-0 mt-0.5">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">
                Depth Range
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                0 – 2,000 meters
              </p>
            </div>
          </div>

          {/* 4. Data Access */}
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-800/60 text-teal-400 flex-shrink-0 mt-0.5">
              <CloudDownload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-100">
                Data Access
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GDAC • NetCDF • Open Data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Live Ocean View */}
      <div className="bg-[#071329]/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-3">
        {/* Header */}
        <div className="flex items-center space-x-2 text-white">
          <Waves className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Live Ocean View
          </h2>
        </div>

        {/* Global Distribution Map Image */}
        <div
          onClick={onOpenFleet}
          className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner group cursor-pointer"
          title="Click to view interactive ARGO fleet map"
        >
          <img
            src="/live_ocean_view.jpg"
            alt="Global ARGO Float Distribution Map"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors" />
        </div>

        {/* Caption & Status */}
        <div className="pt-1">
          <p className="text-xs font-medium text-slate-200">
            Global ARGO Float Distribution
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-300">Active Floats</span>
            </div>
            <span className="text-xs font-bold text-white">~ 3,900</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
