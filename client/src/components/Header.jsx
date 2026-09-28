import React, { useState } from 'react';
import { User, ChevronDown, LogOut, LogIn, Database, Waves } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '../context/QueryContext';

const Header = ({ onOpenAuth, onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { resetAnalysis } = useQuery();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="w-full bg-[#030c1d] border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between z-30 sticky top-0">
      {/* Brand Identity */}
      <div
        className="flex items-center space-x-3 cursor-pointer select-none group"
        onClick={resetAnalysis}
      >
        {/* 3-wave Logo Icon */}
        <div className="w-9 h-9 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
          <svg
            className="w-8 h-8"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 13C10 9 18 17 26 13C32 10 36 12 38 13"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
            <path
              d="M4 20C10 16 18 24 26 20C32 17 36 19 38 20"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
            <path
              d="M4 27C10 23 18 31 26 27C32 24 36 26 38 27"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">
            ARGO Ocean AI
          </h1>
          <p className="text-[11px] text-sky-400/80 font-normal tracking-wide mt-1">
            Explore • Analyze • Understand
          </p>
        </div>
      </div>

      {/* Right Controls: User Profile Badge */}
      <div className="relative">
        <button
          onClick={() => {
            if (isAuthenticated) {
              setIsDropdownOpen(!isDropdownOpen);
            } else {
              onOpenAuth();
            }
          }}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 transition text-xs text-slate-200"
          title={isAuthenticated ? user?.email : 'Sign in to save query history'}
        >
          {/* Avatar Icon */}
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <User className="w-3.5 h-3.5" />
          </div>

          <span className="font-medium text-slate-200">
            {isAuthenticated ? user?.name || 'Ocean Researcher' : 'Ocean Researcher'}
          </span>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* User Dropdown if Authenticated */}
        {isAuthenticated && isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn text-xs">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="font-semibold text-white truncate">{user?.name}</p>
              <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-950/40 text-rose-300 flex items-center space-x-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
