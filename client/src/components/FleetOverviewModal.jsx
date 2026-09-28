import React, { useState, useEffect } from 'react';
import { X, Database, Globe, Compass, Activity, ArrowRight } from 'lucide-react';
import { dataApi } from '../services/api';
import { useQuery } from '../context/QueryContext';

const FleetOverviewModal = ({ isOpen, onClose }) => {
  const { executeQuery } = useQuery();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchMeta = async () => {
        try {
          const res = await dataApi.getMetadata();
          if (res.data.success) {
            setMetadata(res.data.metadata);
          }
        } catch (err) {
          console.error('[Fleet Modal] Failed to load metadata', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMeta();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Globe className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Observational Array
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">
            ARGO Global Fleet Inventory
          </h3>
          <p className="text-xs text-slate-400">
            Real-time synchronization status and spatial profile coverage across monitored ocean basins.
          </p>
        </div>

        {/* Global Summary Stats */}
        {metadata && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-navy-950 rounded-xl p-3 border border-slate-800 space-y-0.5">
              <span className="text-xs text-slate-400">Total Profiles</span>
              <p className="text-xl font-bold text-cyan-400">
                {metadata.totalProfiles}
              </p>
              <span className="text-[10px] text-slate-400">CTD Sensor Cycles</span>
            </div>
            <div className="bg-navy-950 rounded-xl p-3 border border-slate-800 space-y-0.5">
              <span className="text-xs text-slate-400">Profiling Floats</span>
              <p className="text-xl font-bold text-emerald-400">
                {metadata.totalFloats}
              </p>
              <span className="text-[10px] text-slate-400">Autonomous WMO Units</span>
            </div>
            <div className="bg-navy-950 rounded-xl p-3 border border-slate-800 space-y-0.5">
              <span className="text-xs text-slate-400">Monitored Basins</span>
              <p className="text-xl font-bold text-indigo-400">
                {metadata.regions?.length || 0}
              </p>
              <span className="text-[10px] text-slate-400">Oceans & Marginal Seas</span>
            </div>
          </div>
        )}

        {/* Basin List */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Coverage by Ocean Basin
          </h4>
          <div className="space-y-2">
            {metadata?.regions?.map((r, i) => (
              <div
                key={i}
                className="bg-navy-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition"
              >
                <div>
                  <h5 className="text-sm font-semibold text-slate-200">
                    {r.region}
                  </h5>
                  <p className="text-xs text-slate-400">
                    <span className="text-cyan-400 font-semibold">{r.profilesCount}</span> profiles • Observed{' '}
                    {new Date(r.firstObservation).getFullYear()}–{new Date(r.lastObservation).getFullYear()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeQuery(`Show temperature profile in ${r.region}`);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-cyan-600 transition flex items-center space-x-1"
                >
                  <span>Analyze</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FleetOverviewModal;
