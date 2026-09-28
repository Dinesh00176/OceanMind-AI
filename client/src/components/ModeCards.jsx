import React from 'react';
import { Database, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { useQuery } from '../context/QueryContext';

const MODES_DATA = [
  {
    id: 'data',
    title: 'Mode 1 — ARGO Data',
    description: 'Get actual ocean observations and analysis from ARGO data.',
    icon: Database,
    badgeBg: 'bg-blue-600',
    badgeColor: 'text-white',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/50',
    arrowBg: 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
  },
  {
    id: 'rag',
    title: 'Mode 2 — RAG Knowledge',
    description: 'Ask about ARGO program, floats, sensors, GDAC, and more using our knowledge base.',
    icon: BookOpen,
    badgeBg: 'bg-purple-600',
    badgeColor: 'text-white',
    activeBorder: 'border-purple-500 ring-2 ring-purple-500/60',
    arrowBg: 'bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
  },
  {
    id: 'hybrid',
    title: 'Mode 3 — Hybrid',
    description: 'Get both data and scientific explanation for deeper insights.',
    icon: Layers,
    badgeBg: 'bg-emerald-500',
    badgeColor: 'text-white',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/50',
    arrowBg: 'bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
  },
];

const ModeCards = ({ onSelectMode }) => {
  const { selectedMode, setSelectedMode } = useQuery();

  const handleCardClick = (modeId) => {
    setSelectedMode(modeId);
    if (onSelectMode) onSelectMode(modeId);
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
      {MODES_DATA.map((mode) => {
        const Icon = mode.icon;
        // Default to highlight mode 2 (RAG) if auto or rag, matching the user's uploaded mockup
        const isSelected = selectedMode === mode.id || (selectedMode === 'auto' && mode.id === 'rag');

        return (
          <div
            key={mode.id}
            onClick={() => handleCardClick(mode.id)}
            className={`relative rounded-2xl p-5 bg-[#071329]/80 backdrop-blur-md border transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-xl ${
              isSelected
                ? `${mode.activeBorder} bg-[#071329]/95 shadow-2xl`
                : 'border-slate-800/80 hover:border-slate-700/90 hover:bg-[#071329]'
            }`}
          >
            {/* Top Info */}
            <div className="flex items-start space-x-4">
              {/* Squircle Icon Badge */}
              <div
                className={`w-12 h-12 rounded-2xl ${mode.badgeBg} ${mode.badgeColor} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Title & Description */}
              <div className="flex-1 pr-6">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {mode.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
                  {mode.description}
                </p>
              </div>
            </div>

            {/* Bottom Arrow Circle Button */}
            <div className="flex justify-end pt-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${mode.arrowBg}`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModeCards;
