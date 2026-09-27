import React from 'react';
import { X, History, Trash2, ArrowUpRight, Clock, Database } from 'lucide-react';
import { useQuery } from '../context/QueryContext';
import { useAuth } from '../context/AuthContext';

const HistoryDrawer = ({ isOpen, onClose, onOpenAuth }) => {
  const { queryHistory, loadFromHistory, deleteHistoryItem, clearHistory } = useQuery();
  const { isAuthenticated } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-navy-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Query History</h3>
              {queryHistory.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono">
                  {queryHistory.length}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {queryHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/30 transition flex items-center space-x-1"
                  title="Clear all query history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!isAuthenticated ? (
              <div className="text-center py-12 px-4 space-y-3">
                <Database className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-medium text-slate-300">
                  Authentication Required
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Log in with your researcher credentials to automatically persist your natural-language queries, predictions, and depth profiles.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-500 transition shadow-md shadow-ocean-600/30"
                >
                  Sign In to Access History
                </button>
              </div>
            ) : queryHistory.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 text-xs space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                <p>No query history recorded yet.</p>
                <p className="text-[11px] text-slate-600">
                  Ask a question to see your analyses saved here automatically.
                </p>
              </div>
            ) : (
              queryHistory.map((item) => (
                <div
                  key={item._id}
                  className="group relative bg-navy-950/80 hover:bg-slate-800/60 border border-slate-800 rounded-xl p-3.5 space-y-2 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">
                      "{item.query}"
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item._id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      title="Delete query record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>
                      {new Date(item.createdAt || item.timestamp).toLocaleDateString()} •{' '}
                      {new Date(item.createdAt || item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => {
                        loadFromHistory(item);
                        onClose();
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
                    >
                      <span>Reopen</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;
