import React, { useState } from 'react';
import {
  Search,
  Loader2,
  ArrowRight,
  X,
  Compass,
  Database,
  BookOpen,
  Waves,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '../context/QueryContext';

const MODES = [
  {
    id: 'auto',
    name: 'Auto Route',
    shortName: 'Auto',
    icon: Compass,
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80',
    description: 'Intelligent multi-mode routing',
    placeholder: "Ask any ARGO ocean question (e.g. 'Average temp in Bay of Bengal', 'How does an ARGO float work?', 'the temp at ocean')...",
  },
  {
    id: 'data',
    name: 'Mode 1: Observational Data (NLP)',
    shortName: '1. Observational Data',
    icon: Database,
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-600',
    description: 'Direct CTD measurements & statistics',
    placeholder: "Ask for ARGO observational data (e.g. 'Average temp in Bay of Bengal', 'Salinity profile in Indian Ocean', 'the temp at ocean')...",
  },
  {
    id: 'rag',
    name: 'Mode 2: Knowledge Base (RAG)',
    shortName: '2. Scientific RAG',
    icon: BookOpen,
    color: 'text-indigo-400',
    activeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-600',
    description: 'Grounded official documentation & sensors',
    placeholder: "Ask an ARGO documentation question (e.g. 'What is an ARGO float?', 'How does the float move?', 'What is GDAC?')...",
  },
  {
    id: 'hybrid',
    name: 'Mode 3: Hybrid (Data + Physics)',
    shortName: '3. Hybrid Engine',
    icon: Waves,
    color: 'text-amber-400',
    activeBg: 'bg-amber-950/80 text-amber-300 border-amber-600',
    description: 'Calculated data + physical mechanism',
    placeholder: "Ask an ocean physical dynamics question (e.g. 'Why is 500m colder than surface?', 'Why is Arabian Sea saltier?')...",
  },
];

const QueryInput = () => {
  const {
    currentQuery,
    setCurrentQuery,
    executeQuery,
    isLoading,
    contextMemory,
    resetAnalysis,
    selectedMode,
    setSelectedMode,
  } = useQuery();
  const [localInput, setLocalInput] = useState(currentQuery || '');

  // Synchronize local input if query changed externally (e.g. from pill click)
  React.useEffect(() => {
    setLocalInput(currentQuery);
  }, [currentQuery]);

  const activeModeObj = MODES.find((m) => m.id === selectedMode) || MODES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    executeQuery(localInput.trim(), selectedMode);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Explicit Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs uppercase font-semibold text-slate-400 mr-1.5 flex items-center space-x-1">
            <span>Select Mode:</span>
          </span>
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                  isSelected
                    ? mode.activeBg
                    : 'bg-navy-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border-slate-800'
                }`}
                title={mode.description}
              >
                <Icon className={`w-3.5 h-3.5 ${mode.color}`} />
                <span>{mode.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Active Mode Notice */}
        <div className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Active:</span>
          <span className="text-slate-200 font-medium">{activeModeObj.name}</span>
        </div>
      </div>

      {/* Main Input Field Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl bg-navy-900/95 border border-slate-700/80 shadow-2xl focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all duration-150">
          {/* Leading Search Icon */}
          <div className="pl-4 pr-2 text-slate-400">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            ) : (
              <Search className="w-5 h-5 text-cyan-400" />
            )}
          </div>

          {/* Main Input Field */}
          <input
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={activeModeObj.placeholder}
            disabled={isLoading}
            className="w-full py-4 bg-transparent text-slate-100 placeholder-slate-400 text-sm sm:text-base focus:outline-none disabled:opacity-50"
          />

          {/* Clear button if input exists */}
          {localInput && !isLoading && (
            <button
              type="button"
              onClick={() => setLocalInput('')}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Submit Action Button */}
          <div className="pr-3 pl-2 flex items-center space-x-2">
            <button
              type="submit"
              disabled={!localInput.trim() || isLoading}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-500/40 shadow-sm transition-all"
            >
              <span>{isLoading ? 'Processing...' : 'Search'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-turn Context Memory Badge */}
        {contextMemory && (
          <div className="mt-2.5 flex items-center justify-between text-xs px-2 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-400">Active Context:</span>
              <span className="text-cyan-300 font-medium">
                {contextMemory.activeContext
                  ? contextMemory.activeContext
                  : contextMemory.intent === 'knowledge' || contextMemory.mode === 2
                  ? 'Global / ARGO Knowledge'
                  : `${contextMemory.region || 'Global'}${
                      contextMemory.depth !== null && contextMemory.depth !== undefined
                        ? ` @ ${contextMemory.depth}m`
                        : ''
                    }${contextMemory.parameter ? ` • ${contextMemory.parameter}` : ''}`}
              </span>
            </div>
            <button
              type="button"
              onClick={resetAnalysis}
              className="text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition"
            >
              Reset Context
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default QueryInput;
