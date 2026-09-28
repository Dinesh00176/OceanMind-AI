import React from 'react';
import {
  MessageSquare,
  BarChart2,
  TrendingUp,
  BookOpen,
  Clock,
  Download,
  Settings,
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'data', label: 'Data Analysis', icon: BarChart2 },
  { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'history', label: 'Query History', icon: Clock },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({
  activeTab = 'chat',
  onSelectTab,
  onOpenKnowledge,
  onOpenHistory,
  onOpenFleet,
  onOpenPredictions,
  onExport,
  onOpenAuth,
}) => {
  const handleClick = (id) => {
    onSelectTab(id);
    if (id === 'knowledge' && onOpenKnowledge) onOpenKnowledge();
    if (id === 'history' && onOpenHistory) onOpenHistory();
    if (id === 'data' && onOpenFleet) onOpenFleet();
    if (id === 'predictions' && onOpenPredictions) onOpenPredictions();
    if (id === 'export' && onExport) onExport();
    if (id === 'settings' && onOpenAuth) onOpenAuth();
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-[#040f26] border-r border-slate-800/80 flex flex-col justify-between py-6 px-3 min-h-[calc(100vh-4rem)] select-none">
      {/* Top Menu Items */}
      <nav className="space-y-1.5">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Wave Graphics & Tagline */}
      <div className="relative pt-6 px-2 overflow-hidden">
        {/* Abstract Fluid Blue Wave Art */}
        <div className="w-full h-16 pointer-events-none opacity-60">
          <svg
            className="w-full h-full text-cyan-400/40"
            viewBox="0 0 200 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 35 C40 20, 90 45, 140 25 C170 12, 190 28, 200 20"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M0 45 C45 30, 95 55, 145 35 C175 22, 195 38, 200 30"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeOpacity="0.7"
              fill="none"
            />
            <path
              d="M0 55 C50 40, 100 65, 150 45 C180 32, 195 48, 200 40"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.4"
              fill="none"
            />
          </svg>
        </div>

        {/* Tagline */}
        <div className="text-left mt-2">
          <p className="text-xs text-slate-300 font-normal leading-snug">
            Better ocean data
          </p>
          <p className="text-xs text-slate-400 font-normal leading-snug">
            for a healthier planet
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
