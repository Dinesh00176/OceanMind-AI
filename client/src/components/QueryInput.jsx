import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, X } from 'lucide-react';
import { useQuery } from '../context/QueryContext';

const QueryInput = () => {
  const { currentQuery, setCurrentQuery, executeQuery, isLoading, contextMemory, resetAnalysis } = useQuery();
  const [localInput, setLocalInput] = useState(currentQuery || '');

  // Synchronize local input if query changed externally (e.g. from pill click)
  React.useEffect(() => {
    setLocalInput(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    executeQuery(localInput.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center rounded-2xl bg-navy-900/90 border border-slate-700/80 shadow-2xl focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all duration-150">
          
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
            placeholder="Ask an ARGO question (e.g. 'Average temp in Bay of Bengal', 'How does an ARGO float work?', 'Why is 500m colder?')..."
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
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed border border-cyan-600/40 shadow-sm transition-all"
            >
              <span>{isLoading ? 'Analyzing...' : 'Execute'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Multi-turn Context Memory Badge */}
        {contextMemory && (
          <div className="mt-2 flex items-center justify-between text-xs px-2 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Active Context:</span>
              <span className="font-mono text-cyan-300">
                {contextMemory.region || 'Global'}
                {contextMemory.depth !== null && contextMemory.depth !== undefined ? ` @ ${contextMemory.depth}m` : ''}
                {contextMemory.parameter ? ` • ${contextMemory.parameter}` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={resetAnalysis}
              className="text-xs text-slate-400 hover:text-cyan-400 underline underline-offset-2 transition"
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
