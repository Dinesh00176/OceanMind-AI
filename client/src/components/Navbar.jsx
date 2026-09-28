import React, { useState, useEffect } from 'react';
import { Waves, History, Database, User, LogOut, BookOpen, Compass, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '../context/QueryContext';
import { dataApi } from '../services/api';

const Navbar = ({ onOpenAuth, onOpenHistory, onOpenFleet, onOpenKnowledge }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { resetAnalysis, queryHistory, executeQuery } = useQuery();
  const [fleetStats, setFleetStats] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await dataApi.getMetadata();
        if (res.data.success) {
          setFleetStats(res.data.metadata);
        }
      } catch (err) {
        console.warn('[Navbar] Could not fetch metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  return (
    <header className="border-b border-slate-800 bg-navy-900/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={resetAnalysis}>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-100">
                ARGO Ocean AI
              </span>
              <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                Oceanographic Platform
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Float Observations & Science
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 text-xs font-medium text-slate-300">
          <button
            onClick={resetAnalysis}
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center space-x-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Explore</span>
          </button>
          <button
            onClick={() =>
              executeQuery(
                'Show the temperature and salinity profile at different depths in the Indian Ocean.'
              )
            }
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center space-x-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Depth Profiles</span>
          </button>
          <button
            onClick={onOpenKnowledge}
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Knowledge Base</span>
          </button>
          <button
            onClick={onOpenFleet}
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center space-x-1.5"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>ARGO Fleet</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Knowledge Button for Mobile/Tablet */}
          <button
            onClick={onOpenKnowledge}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition lg:hidden"
            title="Open ARGO Knowledge Documentation"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Knowledge</span>
          </button>

          {/* History Drawer Toggle */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition"
          >
            <History className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">History</span>
            {queryHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-700 text-white font-semibold">
                {queryHistory.length}
              </span>
            )}
          </button>

          {/* Auth Button or User Menu */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
              <div className="w-5 h-5 rounded-full bg-cyan-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="text-slate-200 font-medium hidden sm:inline max-w-[100px] truncate">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 ml-1 transition"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
