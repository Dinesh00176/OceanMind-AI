import React from 'react';
import { Cpu, CheckCircle2, ShieldAlert, HelpCircle } from 'lucide-react';

const ModelDiagnosticsCard = ({ prediction }) => {
  if (!prediction) return null;

  // Case 1: Prediction Refusal (Guardrail enforced)
  if (prediction.refusal) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-200">
              Prediction Guardrail Triggered: Scientific Refusal
            </h4>
            <p className="text-xs text-amber-300/90 leading-relaxed">
              {prediction.message}
            </p>
          </div>
        </div>
        <div className="bg-navy-950/80 rounded-xl p-3 border border-amber-900/30 flex items-center justify-between text-xs text-slate-300">
          <span>
            Observations Available:{' '}
            <strong className="text-amber-400 font-bold">
              {prediction.sample_count || 0}
            </strong>
          </span>
          <span>
            Required Minimum:{' '}
            <strong className="text-slate-100 font-bold">
              {prediction.required_count || 20}
            </strong>
          </span>
          <span className="text-xs text-slate-400 font-medium">Status: Insufficient Data</span>
        </div>
      </div>
    );
  }

  // Case 2: Validated Forecast with Metrics
  const { model_name, metrics = {}, diagnostics = [], disclaimer } = prediction;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-navy-950/80 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Machine Learning Model Validation & Diagnostics
            </h4>
            <p className="text-xs text-cyan-400 font-medium">
              Architecture: {model_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Generalization Verified</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-navy-900/80 rounded-xl p-3 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400">Test R² Score</span>
          <p className="text-base font-bold text-cyan-400">
            {metrics.r2_score ?? 'N/A'}
          </p>
          <span className="text-[10px] text-slate-400">Explained Variance</span>
        </div>

        <div className="bg-navy-900/80 rounded-xl p-3 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400">Root Mean Sq Error</span>
          <p className="text-base font-bold text-emerald-400">
            {metrics.rmse ?? 'N/A'} <span className="text-xs font-normal text-slate-400">°C</span>
          </p>
          <span className="text-[10px] text-slate-400">Holdout Validation</span>
        </div>

        <div className="bg-navy-900/80 rounded-xl p-3 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400">Mean Absolute Error</span>
          <p className="text-base font-bold text-indigo-400">
            {metrics.mae ?? 'N/A'} <span className="text-xs font-normal text-slate-400">°C</span>
          </p>
          <span className="text-[10px] text-slate-400">Residual Dispersion</span>
        </div>

        <div className="bg-navy-900/80 rounded-xl p-3 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400">Temporal Split</span>
          <p className="text-sm font-semibold text-slate-200">
            {metrics.train_sample_count} / {metrics.test_sample_count}
          </p>
          <span className="text-[10px] text-slate-400">Train / Test Samples</span>
        </div>
      </div>

      {/* Diagnostics List */}
      {diagnostics.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Integrity Checks:
          </span>
          <div className="space-y-1">
            {diagnostics.map((diag, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{diag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Disclaimer */}
      {disclaimer && (
        <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
          <p className="leading-relaxed">{disclaimer}</p>
        </div>
      )}
    </div>
  );
};

export default ModelDiagnosticsCard;
