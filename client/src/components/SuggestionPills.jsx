import React, { useState } from 'react';
import { Compass, TrendingUp, Layers, MapPin, GitCompare, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { useQuery } from '../context/QueryContext';

const SUGGESTIONS = [
  // Mode 1: Data Analysis (The exact test queries)
  {
    category: 'data',
    icon: Compass,
    label: 'Test 1: Bay of Bengal Temp',
    query: 'What is the average temperature of the ocean in the Bay of Bengal?',
    badge: 'Mode 1: Data',
  },
  {
    category: 'data',
    icon: Layers,
    label: 'Test 2: Temp & Salinity Profile',
    query: 'Show the temperature and salinity profile at different depths in the Indian Ocean.',
    badge: 'Mode 1: Profile',
  },
  {
    category: 'data',
    icon: TrendingUp,
    label: 'Test 3: 2024 Indian Ocean Temp',
    query: 'What was the average sea temperature in the Indian Ocean during 2024?',
    badge: 'Mode 1: Year Filter',
  },
  {
    category: 'data',
    icon: GitCompare,
    label: 'Test 4: Bengal vs Arabian Sea',
    query: 'Compare the temperature and salinity between the Bay of Bengal and the Arabian Sea.',
    badge: 'Mode 1: Comparison',
  },
  {
    category: 'data',
    icon: TrendingUp,
    label: 'Test 5: 500m 5-Year Trend',
    query: 'Show the trend of ocean temperature at 500 meters depth over the last 5 years.',
    badge: 'Mode 1: Trend',
  },

  // Mode 2: RAG Knowledge Queries
  {
    category: 'knowledge',
    icon: BookOpen,
    label: 'What is an ARGO float?',
    query: 'What is an ARGO float?',
    badge: 'Mode 2: RAG',
  },
  {
    category: 'knowledge',
    icon: BookOpen,
    label: 'How does float work?',
    query: 'How does an ARGO float work?',
    badge: 'Mode 2: Mechanics',
  },
  {
    category: 'knowledge',
    icon: BookOpen,
    label: 'What is GDAC & Data System?',
    query: 'What is the ARGO Data System and GDAC?',
    badge: 'Mode 2: Data System',
  },
  {
    category: 'knowledge',
    icon: BookOpen,
    label: 'Quality Control Procedures',
    query: 'What are ARGO quality-control procedures?',
    badge: 'Mode 2: QC Protocol',
  },

  // Mode 3: Hybrid Data + RAG Queries
  {
    category: 'hybrid',
    icon: HelpCircle,
    label: 'Why is 500m colder than surface?',
    query: 'The temperature at 500m is 2.34°C. Why is it lower than the surface temperature?',
    badge: 'Mode 3: Hybrid',
  },
  {
    category: 'hybrid',
    icon: HelpCircle,
    label: 'Why is Arabian Sea saltier?',
    query: 'Compare salinity between the Arabian Sea and Bay of Bengal, and explain why the Arabian Sea is saltier.',
    badge: 'Mode 3: Hybrid',
  },
];

const SuggestionPills = () => {
  const { executeQuery, isLoading } = useQuery();
  const [filter, setFilter] = useState('all');

  const displayedSuggestions = filter === 'all' 
    ? SUGGESTIONS 
    : SUGGESTIONS.filter((s) => s.category === filter);

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 space-y-2">
      {/* Category Filter Tabs */}
      <div className="flex items-center space-x-1.5 text-xs text-slate-400 pl-1">
        <span className="font-mono text-[11px] uppercase text-slate-500 mr-1">Filter:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-md transition ${filter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'hover:text-slate-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('data')}
          className={`px-2.5 py-1 rounded-md transition ${filter === 'data' ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/60' : 'hover:text-slate-200'}`}
        >
          ARGO Data (Mode 1)
        </button>
        <button
          onClick={() => setFilter('knowledge')}
          className={`px-2.5 py-1 rounded-md transition ${filter === 'knowledge' ? 'bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/60' : 'hover:text-slate-200'}`}
        >
          RAG Knowledge (Mode 2)
        </button>
        <button
          onClick={() => setFilter('hybrid')}
          className={`px-2.5 py-1 rounded-md transition ${filter === 'hybrid' ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800/60' : 'hover:text-slate-200'}`}
        >
          Hybrid Data + RAG (Mode 3)
        </button>
      </div>

      {/* Suggestion Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {displayedSuggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => !isLoading && executeQuery(item.query)}
              disabled={isLoading}
              className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 disabled:opacity-50 ${
                item.category === 'knowledge'
                  ? 'bg-navy-900/80 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border-slate-800 hover:border-indigo-500/40'
                  : item.category === 'hybrid'
                  ? 'bg-navy-900/80 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border-slate-800 hover:border-amber-500/40'
                  : 'bg-navy-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-300 border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${item.category === 'knowledge' ? 'text-indigo-400' : item.category === 'hybrid' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionPills;
