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
  BookOpen,
  Compass,
  ArrowRight,
  Waves,
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
  // VIEW MODE 1: CLARIFICATION NEEDED (e.g. user asks "the temp at ocean")
  // =========================================================================
  if (type === 'clarification_needed' || result.is_ambiguous || result.isAmbiguous) {
    const clarificationText =
      answer ||
      result.clarification_message ||
      'Which ocean basin or depth layer would you like to investigate?';

    const oceanBasins = [
      {
        name: 'Bay of Bengal',
        query: 'What is the average temperature of the ocean in the Bay of Bengal?',
        desc: 'Northern Indian Ocean basin characterized by monsoonal freshwater runoff',
      },
      {
        name: 'Arabian Sea',
        query: 'What is the average temperature in the Arabian Sea?',
        desc: 'Western basin with intense solar evaporation and high salinity',
      },
      {
        name: 'Indian Ocean (General)',
        query: 'What is the average temperature in the Indian Ocean?',
        desc: 'Broad regional average across tropical and equatorial ARGO arrays',
      },
      {
        name: 'Pacific Ocean',
        query: 'What is the temperature in the Pacific Ocean?',
        desc: 'Vast ocean basin spanning equatorial warm pool to polar waters',
      },
      {
        name: 'Atlantic Ocean',
        query: 'What is the temperature in the Atlantic Ocean?',
        desc: 'Major basin driving the global thermohaline conveyor belt',
      },
    ];

    const depthLayers = [
      {
        depth: 'Surface (0 meters)',
        query: 'What is the surface temperature in the Indian Ocean?',
        desc: 'Directly in contact with solar heating and atmosphere',
      },
      {
        depth: '500 meters Depth',
        query: 'What is the ocean temperature at 500 meters in the Indian Ocean?',
        desc: 'Below the main thermocline where solar light cannot penetrate',
      },
      {
        depth: '1000 meters Depth',
        query: 'What is the ocean temperature at 1000 meters in the Indian Ocean?',
        desc: 'Deep intermediate water layer with near-uniform cold temperatures',
      },
      {
        depth: 'Full Vertical Profile (0–2000m)',
        query: 'Show the temperature and salinity profile at different depths in the Indian Ocean.',
        desc: 'Continuous CTD profile from the sea surface down to 2,000 meters',
      },
    ];

    return (
      <div className="w-full max-w-4xl mx-auto mt-6 space-y-6 animate-fadeIn">
        <div className="bg-navy-900/95 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex items-start space-x-3.5 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-xs font-medium mb-1">
                <span>Location Needed</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Which ocean basin would you like to explore?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {clarificationText}
              </p>
            </div>
          </div>

          {/* Quick Basin Selectors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select an Ocean Basin to View Exact ARGO Data:
              </h3>
              <span className="text-xs text-slate-400">Click to analyze instantly</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {oceanBasins.map((basin, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLoading && executeQuery(basin.query)}
                  disabled={isLoading}
                  className="text-left p-3.5 rounded-xl bg-navy-950 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition duration-150 group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{basin.name}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 pl-4 leading-normal">
                    {basin.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Depth Layer Options */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Or Choose a Specific Depth Layer:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {depthLayers.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLoading && executeQuery(d.query)}
                  disabled={isLoading}
                  className="text-left p-3 rounded-xl bg-navy-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs transition duration-150 flex items-center justify-between group disabled:opacity-50"
                >
                  <div>
                    <span className="font-medium text-slate-200 group-hover:text-indigo-300 block">
                      {d.depth}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {d.desc}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: OUT OF SCOPE / UNRELATED QUESTION
  // =========================================================================
  if (type === 'unrelated') {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6 space-y-6 animate-fadeIn">
        <div className="bg-navy-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex items-start space-x-3.5 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Info className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-medium mb-1">
                <span>Not Related • Out of Scope</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                This question is not related to ARGO oceanography
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {answer ||
                  'I am an ARGO Oceanographic Data Assistant specialized in ocean temperature, salinity, vertical depth profiles, autonomous float operations, and marine physical dynamics.'}
              </p>
            </div>
          </div>

          {/* Educational overview of what this assistant does */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-cyan-300 text-sm flex items-center space-x-1.5">
                <Compass className="w-4 h-4" />
                <span>Observational Data & Measurements</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                Query measurements collected by the international ARGO float array:
              </p>
              <ul className="space-y-1 text-slate-400">
                <li>• Water temperature and salinity from 0 to 2,000m</li>
                <li>• Basin comparisons (Bay of Bengal vs Arabian Sea)</li>
                <li>• Multi-year trends and time-series forecasting</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
              <span className="font-semibold text-indigo-300 text-sm flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Ocean Science & Float Mechanics</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                Learn about physical oceanography and how robotic floats operate:
              </p>
              <ul className="space-y-1 text-slate-400">
                <li>• Hydraulic buoyancy engines and the 10-day profiling cycle</li>
                <li>• Why 500m water is colder than the sunlit surface layer</li>
                <li>• ARGO 19 automated real-time quality control tests</li>
              </ul>
            </div>
          </div>

          {/* Clickable Starter Questions */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Try asking an oceanographic question:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedFollowUps && suggestedFollowUps.length > 0 ? (
                suggestedFollowUps.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => !isLoading && executeQuery(question)}
                    disabled={isLoading}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 flex items-center justify-between transition disabled:opacity-50 group"
                  >
                    <span className="leading-snug">{question}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => !isLoading && executeQuery('What is an ARGO float?')}
                    disabled={isLoading}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 flex items-center justify-between transition"
                  >
                    <span>What is an ARGO float?</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => !isLoading && executeQuery('What is the average temperature in the Bay of Bengal?')}
                    disabled={isLoading}
                    className="text-left px-3.5 py-2.5 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 flex items-center justify-between transition"
                  >
                    <span>What is the average temperature in the Bay of Bengal?</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 3: RAG KNOWLEDGE QUERY CARD
  // =========================================================================
  if (type === 'knowledge' || queryMode === 'rag_knowledge') {
    return (
      <div className="w-full max-w-5xl mx-auto mt-6 space-y-6 animate-fadeIn">
        <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                  ARGO Scientific Knowledge (Mode 2: RAG)
                </h2>
                <span className="text-xs text-indigo-300">
                  Authoritative Documentation & Sensor Reference Literature
                </span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center space-x-2 no-print">
              <button
                onClick={handleExportJSON}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Print Report</span>
              </button>
            </div>
          </div>

          {/* Answer Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Scientific Explanation
            </h3>
            <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed">
              {answer}
            </p>
          </div>

          {/* Key Principles Section */}
          {keyPrinciples && keyPrinciples.length > 0 && (
            <div className="space-y-2.5 bg-navy-950/70 rounded-xl p-4 border border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
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
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Authoritative Retrieved Documentation Sources</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="bg-navy-950/90 rounded-xl p-3 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-200 leading-snug">
                        {src.doc_title || src.title}
                      </span>
                      {src.confidence_score && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex-shrink-0">
                          {Math.round(src.confidence_score * 100)}% match
                        </span>
                      )}
                    </div>
                    {src.section_title && (
                      <p className="text-indigo-300 text-xs">
                        Section: {src.section_title}
                      </p>
                    )}
                    {src.snippet && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {src.snippet}
                      </p>
                    )}
                    {src.source_file && (
                      <span className="text-slate-400 text-[11px] block">
                        Source Document: {src.source_file}
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
              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed">{limitations}</p>
            </div>
          )}
        </div>

        {/* Suggested Follow-Up Topics */}
        {suggestedFollowUps.length > 0 && (
          <div className="space-y-2.5 no-print">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 pl-1">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Related Scientific Knowledge Topics:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedFollowUps.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => !isLoading && executeQuery(question)}
                  disabled={isLoading}
                  className="text-left px-4 py-2.5 rounded-xl bg-navy-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-300 flex items-center justify-between transition duration-150 disabled:opacity-50 group"
                >
                  <span className="leading-snug">{question}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 4: DATA ANALYSIS & HYBRID PHYSICAL QUERY CARD
  // =========================================================================
  const isHybrid = type === 'hybrid' || queryMode === 'hybrid_data_rag';

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 space-y-6 animate-fadeIn">
      {/* Primary Scientific Card */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-3 h-3 rounded-full ${isHybrid ? 'bg-amber-400' : 'bg-cyan-400'}`}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                {isHybrid
                  ? 'Mode 3: Observation & Physical Oceanography (Hybrid)'
                  : 'Mode 1: ARGO Observational Data Analysis (NLP)'}
              </h2>
              <span
                className={`text-xs ${isHybrid ? 'text-amber-300' : 'text-cyan-300'}`}
              >
                {isHybrid
                  ? 'Empirical Measurements + Grounded Scientific Theory'
                  : 'Accurate Deterministic CTD Profiling Measurements'}
              </span>
            </div>
          </div>

          {/* Export Actions Toolbar */}
          <div className="flex items-center space-x-2 no-print">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              title="Download observations as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              title="Export complete JSON"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition"
              title="Print or save PDF report"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>
        </div>

        {/* 1. Answer Section */}
        <div className="space-y-2">
          <h3
            className={`text-xs font-bold ${
              isHybrid ? 'text-amber-400' : 'text-cyan-400'
            } uppercase tracking-wider`}
          >
            {isHybrid ? 'Synthesized Observation & Scientific Answer' : 'Calculated Answer'}
          </h3>
          <p className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-line">
            {answer}
          </p>
        </div>

        {/* 2. Key Findings Section */}
        {keyFindings.length > 0 && (
          <div className="space-y-2.5 bg-navy-950/70 rounded-xl p-4 border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Key Observational Findings</span>
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
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Observational Source Parameters</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-navy-950/90 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-400">Parameter</span>
                <p className="font-semibold text-cyan-300 text-sm mt-0.5 capitalize">
                  {dataUsed.parameter ||
                    (dataUsed.parameters && dataUsed.parameters.join(' & ')) ||
                    'CTD Measurements'}
                </p>
              </div>
              <div className="bg-navy-950/90 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-400">Geographic Region</span>
                <p className="font-semibold text-slate-200 text-sm mt-0.5 truncate">
                  {dataUsed.region || dataUsed.regions || 'Global ARGO Array'}
                </p>
              </div>
              <div className="bg-navy-950/90 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-400">Depth Layer</span>
                <p className="font-semibold text-slate-200 text-sm mt-0.5">
                  {dataUsed.depth || '0–2,000 meters'}
                </p>
                {dataUsed.depthIsDefault && (
                  <span className="text-[11px] text-amber-300 block mt-0.5">
                    Surface (0m) [Default]
                  </span>
                )}
              </div>
              <div className="bg-navy-950/90 rounded-xl p-3 border border-slate-800">
                <span className="text-slate-400">Profiles / Floats</span>
                <p className="font-semibold text-slate-200 text-sm mt-0.5">
                  {dataUsed.profileCount || dataUsed.observationCount || 'N/A'} profiles (
                  {dataUsed.floatCount !== undefined
                    ? `${dataUsed.floatCount} ${dataUsed.floatCount === 1 ? 'float' : 'floats'}`
                    : '1 float'}
                  )
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Interactive Visualization Section */}
        {visualization && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
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
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Physical Oceanography Mechanisms & Scientific Context</span>
            </h3>
            <div className="bg-navy-950/80 rounded-xl p-4 border border-amber-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
              <p>{scientificExplanation.explanation}</p>
            </div>

            {scientificExplanation.sources && scientificExplanation.sources.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {scientificExplanation.sources.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-navy-950/60 p-2.5 rounded-lg border border-slate-800"
                  >
                    <span className="font-semibold text-slate-200 block truncate">
                      {s.doc_title || s.title}
                    </span>
                    <span className="text-amber-300 block text-[11px]">
                      {s.section_title}
                    </span>
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
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">{limitations}</p>
          </div>
        )}
      </div>

      {/* 8. Suggested Follow-Up Questions */}
      {suggestedFollowUps.length > 0 && (
        <div className="space-y-2.5 no-print">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 pl-1">
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suggested Contextual Follow-up Questions:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedFollowUps.map((question, idx) => (
              <button
                key={idx}
                onClick={() => !isLoading && executeQuery(question)}
                disabled={isLoading}
                className="text-left px-4 py-2.5 rounded-xl bg-navy-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 flex items-center justify-between transition duration-150 disabled:opacity-50 group"
              >
                <span className="leading-snug">{question}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transform group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResultCard;
