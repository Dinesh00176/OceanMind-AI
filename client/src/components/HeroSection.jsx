import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  BookOpen,
  FlaskConical,
  BarChart2,
  Droplets,
  Lightbulb,
  Globe,
} from 'lucide-react';
import { useQuery } from '../context/QueryContext';

const PROMPT_SUGGESTIONS = [
  {
    icon: BookOpen,
    text: 'What is the ARGO program?',
    mode: 'rag',
  },
  {
    icon: FlaskConical,
    text: 'How does an ARGO float work?',
    mode: 'rag',
  },
  {
    icon: BarChart2,
    text: 'What is the average temperature in the Bay of Bengal?',
    mode: 'data',
  },
  {
    icon: Droplets,
    text: 'Why is salinity important?',
    mode: 'rag',
  },
  {
    icon: Lightbulb,
    text: 'Why is the temperature different between the Bay of Bengal and Arabian Sea?',
    mode: 'hybrid',
  },
  {
    icon: Globe,
    text: 'How does ARGO help climate research?',
    mode: 'rag',
  },
];

const HeroSection = () => {
  const { currentQuery, executeQuery, isLoading, selectedMode, setSelectedMode } = useQuery();
  const [inputValue, setInputValue] = useState(currentQuery || '');

  // Synchronize local input if query changed externally
  React.useEffect(() => {
    setInputValue(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    executeQuery(inputValue.trim(), selectedMode);
  };

  const handlePromptClick = (prompt) => {
    if (isLoading) return;
    setInputValue(prompt.text);
    setSelectedMode(prompt.mode);
    executeQuery(prompt.text, prompt.mode);
  };

  // Dynamic placeholder based on selected mode
  const getPlaceholder = () => {
    if (selectedMode === 'data') return "Ask for ARGO observational data (e.g. 'Average temp in Bay of Bengal')...";
    if (selectedMode === 'rag') return "Ask about ARGO program, floats, sensors, GDAC...";
    if (selectedMode === 'hybrid') return "Ask physical oceanography question (e.g. 'Why is 500m colder?')...";
    return 'Ask anything about ARGO...';
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-[#030c1d] flex flex-col justify-between min-h-[500px]">
      {/* Background Image: ARGO Float in Ocean Split View */}
      <div className="absolute inset-0 z-0">
        <img
          src="/argo_float_ocean.jpg"
          alt="ARGO Ocean Float in Water"
          className="w-full h-full object-cover object-right-top"
        />
        {/* Soft Left Dark Gradient Overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030c1e] via-[#030c1e]/90 via-55% to-[#030c1e]/30" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-2xl flex flex-col justify-between h-full">
        {/* Top Titles */}
        <div className="space-y-2">
          <p className="text-slate-200 text-base sm:text-lg font-normal tracking-wide">
            Welcome to
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
            <span className="text-white">ARGO </span>
            <span className="text-sky-400">Ocean AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-200/90 pt-1 leading-relaxed font-normal">
            Ask questions about ARGO data, ocean science, or get insights from our knowledge base.
          </p>
        </div>

        {/* White Pill Search Input */}
        <form onSubmit={handleSubmit} className="mt-6 w-full">
          <div className="relative flex items-center bg-white rounded-full p-1.5 pl-5 shadow-2xl transition-all duration-150 focus-within:ring-4 focus-within:ring-sky-500/25">
            {/* Sparkles Icon */}
            <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mr-3" />

            {/* Input Field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isLoading}
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-50"
            />

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md transition disabled:opacity-40 disabled:hover:bg-blue-600 ml-2"
              title="Submit Query"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Prompt Suggestions Grid */}
        <div className="mt-8 space-y-3">
          <p className="text-xs text-slate-300 font-normal">
            Try asking (or type your own question):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PROMPT_SUGGESTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(item)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-150 flex items-center space-x-3 text-xs sm:text-xs text-slate-200 hover:text-white group shadow-sm disabled:opacity-50"
                >
                  <Icon className="w-4 h-4 text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="leading-snug truncate">{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
