import React from 'react';
import {
  Compass,
  TrendingUp,
  Layers,
  GitCompare,
  BookOpen,
  HelpCircle,
  GraduationCap,
  Microscope,
  Waves,
} from 'lucide-react';
import { useQuery } from '../context/QueryContext';

const SUGGESTIONS = [
  // 1. Student Fundamentals & Educational Topics (Mode 2: RAG Knowledge)
  {
    category: 'students',
    mode: 'rag',
    icon: GraduationCap,
    label: 'What is an ARGO float?',
    query: 'What is an ARGO float?',
    badge: 'Mode 2: RAG',
  },
  {
    category: 'students',
    mode: 'rag',
    icon: BookOpen,
    label: 'How does the float move & profile?',
    query: 'How does an ARGO float work?',
    badge: 'Mode 2: Mechanics',
  },
  {
    category: 'students',
    mode: 'rag',
    icon: HelpCircle,
    label: 'Why measure salinity & CTD?',
    query: 'Why does ARGO measure salinity?',
    badge: 'Mode 2: Sensors',
  },
  {
    category: 'students',
    mode: 'rag',
    icon: BookOpen,
    label: 'ARGO Quality Control (QC)',
    query: 'What are ARGO quality-control procedures?',
    badge: 'Mode 2: QC Protocol',
  },

  // 2. Oceanographic Data & Observational Measurements (Mode 1: NLP Data)
  {
    category: 'data',
    mode: 'data',
    icon: Compass,
    label: 'Bay of Bengal Sea Temperature',
    query: 'What is the average temperature of the ocean in the Bay of Bengal?',
    badge: 'Mode 1: Surface Data',
  },
  {
    category: 'data',
    mode: 'data',
    icon: Layers,
    label: 'Vertical Depth Profile (0–2000m)',
    query: 'Show the temperature and salinity profile at different depths in the Indian Ocean.',
    badge: 'Mode 1: CTD Profile',
  },
  {
    category: 'data',
    mode: 'data',
    icon: TrendingUp,
    label: '2024 Indian Ocean Temperature',
    query: 'What was the average sea temperature in the Indian Ocean during 2024?',
    badge: 'Mode 1: Year Filter',
  },
  {
    category: 'data',
    mode: 'data',
    icon: GitCompare,
    label: 'Compare Bengal vs Arabian Sea',
    query: 'Compare the temperature and salinity between the Bay of Bengal and the Arabian Sea.',
    badge: 'Mode 1: Comparison',
  },
  {
    category: 'data',
    mode: 'data',
    icon: TrendingUp,
    label: '500m Depth 5-Year Trend',
    query: 'Show the trend of ocean temperature at 500 meters depth over the last 5 years.',
    badge: 'Mode 1: Deep Trend',
  },

  // 3. Physical Oceanography & Scientific Mechanisms (Mode 3: Hybrid)
  {
    category: 'physics',
    mode: 'hybrid',
    icon: Waves,
    label: 'Why is 500m colder than surface?',
    query: 'The temperature at 500m is 2.34°C. Why is it lower than the surface temperature?',
    badge: 'Mode 3: Thermocline',
  },
  {
    category: 'physics',
    mode: 'hybrid',
    icon: Waves,
    label: 'Why is Arabian Sea saltier?',
    query: 'Compare salinity between the Arabian Sea and Bay of Bengal, and explain why the Arabian Sea is saltier.',
    badge: 'Mode 3: Salinity Dynamics',
  },

  // 4. Generalized Query (Clarification Showcase)
  {
    category: 'clarification',
    mode: 'data',
    icon: HelpCircle,
    label: 'Generalized: "the temp at ocean"',
    query: 'the temp at ocean',
    badge: 'Clarification Demo',
  },
];

const SuggestionPills = () => {
  const { executeQuery, isLoading, selectedMode, setSelectedMode } = useQuery();

  // Determine filter based on selectedMode or manual filter
  const getFilter = () => {
    if (selectedMode === 'rag') return 'students';
    if (selectedMode === 'data') return 'data';
    if (selectedMode === 'hybrid') return 'physics';
    return 'all';
  };

  const currentFilter = getFilter();

  const handleFilterClick = (filterName, modeName) => {
    setSelectedMode(modeName);
  };

  const displayedSuggestions =
    currentFilter === 'all'
      ? SUGGESTIONS
      : SUGGESTIONS.filter(
          (s) => s.category === currentFilter || s.category === 'clarification'
        );

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 space-y-2">
      {/* Category Filter Tabs linked to Modes */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pl-1">
        <span className="text-xs uppercase font-medium text-slate-400 mr-1">
          Suggestions:
        </span>
        <button
          onClick={() => handleFilterClick('all', 'auto')}
          className={`px-3 py-1 rounded-lg transition ${
            selectedMode === 'auto'
              ? 'bg-slate-800 text-white font-medium border border-slate-700'
              : 'hover:text-slate-200'
          }`}
        >
          All Topics
        </button>
        <button
          onClick={() => handleFilterClick('data', 'data')}
          className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
            selectedMode === 'data'
              ? 'bg-cyan-950 text-cyan-300 font-medium border border-cyan-800/70'
              : 'hover:text-slate-200'
          }`}
        >
          <Microscope className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mode 1: Observational Data</span>
        </button>
        <button
          onClick={() => handleFilterClick('students', 'rag')}
          className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
            selectedMode === 'rag'
              ? 'bg-indigo-950 text-indigo-300 font-medium border border-indigo-800/70'
              : 'hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Mode 2: Knowledge (RAG)</span>
        </button>
        <button
          onClick={() => handleFilterClick('physics', 'hybrid')}
          className={`px-3 py-1 rounded-lg transition flex items-center space-x-1 ${
            selectedMode === 'hybrid'
              ? 'bg-amber-950 text-amber-300 font-medium border border-amber-800/70'
              : 'hover:text-slate-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-amber-400" />
          <span>Mode 3: Hybrid Physics</span>
        </button>
      </div>

      {/* Suggestion Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {displayedSuggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                if (!isLoading) {
                  setSelectedMode(item.mode);
                  executeQuery(item.query, item.mode);
                }
              }}
              disabled={isLoading}
              className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 disabled:opacity-50 ${
                item.category === 'students'
                  ? 'bg-navy-900/80 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border-slate-800 hover:border-indigo-500/40'
                  : item.category === 'physics'
                  ? 'bg-navy-900/80 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border-slate-800 hover:border-amber-500/40'
                  : item.category === 'clarification'
                  ? 'bg-navy-900/80 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border-slate-800 hover:border-cyan-500/40'
                  : 'bg-navy-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-cyan-300 border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  item.category === 'students'
                    ? 'text-indigo-400'
                    : item.category === 'physics'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestionPills;
