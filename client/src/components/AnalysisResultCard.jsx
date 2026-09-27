import React, { useState } from 'react';
import {
  FileText,
  Layers,
  MapPin,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  Database,
  Info,
  CheckCircle,
  HelpCircle,
  Share2,
  BookOpen,
  ExternalLink,
  Compass,
  ShieldCheck,
  Award,
} from 'lucide-react';
import DepthProfileChart from './Visualizations/DepthProfileChart';
import TimeSeriesChart from './Visualizations/TimeSeriesChart';
import RegionalBarChart from './Visualizations/RegionalBarChart';
import ArgoMap from './Visualizations/ArgoMap';
import ModelDiagnosticsCard from './ModelDiagnosticsCard';
import { useQuery } from '../context/QueryContext';

const AnalysisResultCard = () => {
  const { result, currentQuery, executeQuery, isLoading } = useQuery();
  const [activeTab, setActiveTab] = useState(null);

  if (!result) return null;

  const {
    answer,
    keyFindings = [],
    keyPrinciples = [],
    sources = [],
    dataUsed,
    visualization,
    prediction,
    limitations,
    suggestedFollowUps = [],
    type,
    queryMode,
    observedResult,
    scientificExplanation,
  } = result;

  // Set default view based on returned visualization type
  const currentView = activeTab || visualization?.type || 'summary';

  // Export to CSV
  const handleExportCSV = () => {
    let rows = [];
    if (visualization?.curve) {
      rows.push(['Depth(m)', 'Temperature(C)', 'Salinity(PSU)', 'DissolvedOxygen(umol/kg)']);
      visualization.curve.forEach((c) => {
        rows.push([c.depth, c.temperature ?? '', c.salinity ?? '', c.dissolvedOxygen ?? '']);
      });
    } else if (visualization?.trend) {
      rows.push(['Period', 'ObservedValue', 'SampleCount']);
      visualization.trend.forEach((t) => {
        rows.push([t.period, t.observed ?? '', t.count ?? '']);
      });
    } else if (visualization?.chartData) {
      rows.push(['Region', 'MeanTemperature(C)', 'MeanSalinity(PSU)', 'Profiles', 'Floats', 'Observations']);
      visualization.chartData.forEach((row) => {
        rows.push([
          row.region,
          row.temperature ?? row.mean ?? '',
          row.salinity ?? '',
          row.profileCount ?? '',
          row.floatCount ?? '',
          row.observationCount ?? '',
        ]);
      });
    } else if (visualization?.markers) {
      rows.push(['FloatID', 'Cycle', 'Latitude', 'Longitude', 'SurfaceTemp(C)', 'Salinity(PSU)']);
      visualization.markers.forEach((m) => {
        rows.push([
          m.floatId,
          m.cycleNumber,
          m.coordinates[0],
          m.coordinates[1],
          m.temperature ?? '',
          m.salinity ?? '',
        ]);
      });
    } else {
      rows.push(['Field', 'Content']);
      rows.push(['Query', currentQuery]);
      rows.push(['Type', type]);
      rows.push(['Answer', answer]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `argo_ocean_analysis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `argo_analysis_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print PDF report
  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // VIEW MODE A: RAG KNOWLEDGE QUERY CARD (Mode 2)
  // =========================================================================
  if (type === 'knowledge' || queryMode === 'rag_knowledge') {
    return (
      <div className="w-full max-w-5xl mx-auto mt-6 space-y-6 animate-fadeIn">
        <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-100 font-mono tracking-tight">
                  ARGO Scientific Knowledge & Documentation
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">
                  Grounded Semantic Retrieval (RAG Mode)
                </span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center space-x-2 no-print">
              <button
                onClick={handleExportJSON}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Answer Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
              Scientific Explanation
            </h3>
            <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
              {answer}
            </p>
          </div>

          {/* Key Principles Section */}
          {keyPrinciples && keyPrinciples.length > 0 && (
            <div className="space-y-2.5 bg-navy-950/70 rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Core Scientific Principles</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {keyPrinciples.map((principle, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <span className="text-indigo-400 font-bold mt-0.5">•</span>
                    <span className="leading-snug">{principle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Authoritative Source Citations */}
          {sources && sources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authoritative Retrieved Documentation Sources</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {sources.map((src, idx) => (
                  <div key={idx} className="bg-navy-950/90 rounded-xl p-3 border border-slate-800 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-200 leading-snug">
                        {src.doc_title || src.title}
                      </span>
                      {src.confidence_score && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex-shrink-0">
                          {Math.round(src.confidence_score * 100)}% match
                        </span>
                      )}
                    </div>
                    {src.section_title && (
                      <p className="text-indigo-300/90 font-mono text-[11px]">
                        Section: {src.section_title}
                      </p>
                    )}
                    {src.snippet && (
                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {src.snippet}
                      </p>
                    )}
                    {src.source_file && (
                      <span className="text-slate-500 font-mono text-[10px] block">
                        File: {src.source_file}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific Disclaimer */}
          {limitations && (
            <div className="flex items-start space-x-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="italic leading-relaxed">{limitations}</p>
            </div>
          )}

        </div>

        {/* Suggested Follow-Up Topics */}
        {suggestedFollowUps.length > 0 && (
          <div className="space-y-2.5 no-print">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5 pl-1">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Related Scientific Knowledge Topics:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedFollowUps.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLoading && executeQuery(question)}
                  disabled={isLoading}
                  className="text-left px-4 py-2.5 rounded-xl bg-navy-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-300 flex items-center justify-between transition-all duration-150 disabled:opacity-50 group"
                >
                  <span className="leading-snug">{question}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW MODE B: HYBRID DATA + RAG QUERY CARD (Mode 3)
  // =========================================================================
  const isHybrid = type === 'hybrid' || queryMode === 'hybrid_data_rag';

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6 animate-fadeIn">
      
      {/* Primary Scientific Card */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isHybrid ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 font-mono tracking-tight">
                {isHybrid ? 'Hybrid Oceanographic Analysis & Physical Explanation' : 'Oceanographic Analysis Result'}
              </h2>
              {isHybrid && (
                <span className="text-[11px] text-amber-400 font-mono">
                  Mode 3: Empirical Observation + Grounded Physical RAG
                </span>
              )}
            </div>
          </div>

          {/* Export Actions Toolbar */}
          <div className="flex items-center space-x-2 no-print">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              title="Download observations as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              title="Export complete JSON"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              title="Print or save PDF report"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">PDF Report</span>
            </button>
          </div>
        </div>

        {/* 1. Answer Section */}
        <div className="space-y-2">
          <h3 className={`text-xs font-bold ${isHybrid ? 'text-amber-400' : 'text-cyan-400'} uppercase tracking-wider font-mono`}>
            {isHybrid ? 'Synthesized Empirical & Scientific Answer' : 'Answer'}
          </h3>
          <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-line">
            {answer}
          </p>
        </div>

        {/* 2. Key Findings Section */}
        {keyFindings.length > 0 && (
          <div className="space-y-2.5 bg-navy-950/70 rounded-xl p-4 border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Key Empirical & Scientific Findings</span>
            </h3>
            <ul className="space-y-2 text-sm text-slate-200">
              {keyFindings.map((finding, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span className="leading-snug">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Data Used Transparency Section */}
        {dataUsed && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>ARGO Observational Source Metadata</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-navy-950/90 rounded-lg p-2.5 border border-slate-800">
                <span className="text-slate-400">Parameter</span>
                <p className="font-semibold text-cyan-300 font-mono capitalize">
                  {dataUsed.parameter || (dataUsed.parameters && dataUsed.parameters.join(' & ')) || 'CTD Measurements'}
                </p>
              </div>
              <div className="bg-navy-950/90 rounded-lg p-2.5 border border-slate-800">
                <span className="text-slate-400">Geographic Region</span>
                <p className="font-semibold text-slate-200 truncate">
                  {dataUsed.region || dataUsed.regions || 'Global ARGO Array'}
                </p>
              </div>
              <div className="bg-navy-950/90 rounded-lg p-2.5 border border-slate-800">
                <span className="text-slate-400">Depth Layer</span>
                <p className="font-semibold text-slate-200 font-mono">
                  {dataUsed.depth || '0–2000 meters'}
                </p>
                {dataUsed.depthIsDefault && (
                  <span className="text-[10px] text-amber-400/90 block font-mono mt-0.5">
                    Surface (0m) [Default]
                  </span>
                )}
              </div>
              <div className="bg-navy-950/90 rounded-lg p-2.5 border border-slate-800">
                <span className="text-slate-400">Profiles / Floats</span>
                <p className="font-semibold text-slate-200 font-mono">
                  {dataUsed.profileCount || dataUsed.observationCount || 'N/A'} profiles ({dataUsed.floatCount !== undefined ? `${dataUsed.floatCount} ${dataUsed.floatCount === 1 ? 'float' : 'floats'}` : '1 float'})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Interactive Visualization Section */}
        {visualization && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Interactive Scientific Visualization</span>
              </h3>
            </div>

            {/* Render appropriate visualizer */}
            <div className="w-full">
              {currentView === 'depth_profile' && (
                <DepthProfileChart
                  curve={visualization.curve}
                  parameter={visualization.parameter}
                  parameters={visualization.parameters}
                  unit={visualization.unit}
                  region={visualization.region}
                />
              )}

              {(currentView === 'time_series' || currentView === 'time_series_forecast') && (
                <TimeSeriesChart
                  trend={visualization.trend}
                  historical={visualization.historical}
                  forecast={visualization.forecast}
                  parameter={visualization.parameter}
                  unit={visualization.unit}
                  depth={visualization.depth}
                  trendSummary={visualization.trendSummary}
                />
              )}

              {currentView === 'regional_bar' && (
                <RegionalBarChart
                  chartData={visualization.chartData}
                  parameter={visualization.parameter}
                  parameters={visualization.parameters}
                  unit={visualization.unit}
                />
              )}

              {currentView === 'interactive_map' && (
                <ArgoMap
                  markers={visualization.markers}
                  center={visualization.center}
                />
              )}
            </div>
          </div>
        )}

        {/* 5. Hybrid Mode: Scientific Physical Explanation Box */}
        {isHybrid && scientificExplanation && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Grounded Physical Oceanography Mechanisms (RAG Retrieval)</span>
            </h3>
            <div className="bg-navy-950/80 rounded-xl p-4 border border-amber-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
              <p>{scientificExplanation.explanation}</p>
            </div>

            {scientificExplanation.sources && scientificExplanation.sources.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                {scientificExplanation.sources.map((s, idx) => (
                  <div key={idx} className="bg-navy-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-200 block truncate">{s.doc_title || s.title}</span>
                    <span className="text-amber-400/90 font-mono block text-[10px]">{s.section_title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. ML Model Validation & Diagnostics (if prediction occurred) */}
        {prediction && <ModelDiagnosticsCard prediction={prediction} />}

        {/* 7. Limitations & Scientific Disclaimers */}
        {limitations && (
          <div className="flex items-start space-x-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="italic leading-relaxed">{limitations}</p>
          </div>
        )}

      </div>

      {/* 8. Suggested Follow-Up Questions */}
      {suggestedFollowUps.length > 0 && (
        <div className="space-y-2.5 no-print">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5 pl-1">
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suggested Contextual Follow-up Questions:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedFollowUps.map((question, idx) => (
              <button
                key={idx}
                onClick={() => !isLoading && executeQuery(question)}
                disabled={isLoading}
                className="text-left px-4 py-2.5 rounded-xl bg-navy-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 flex items-center justify-between transition-all duration-150 disabled:opacity-50 group"
              >
                <span className="leading-snug">{question}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisResultCard;
