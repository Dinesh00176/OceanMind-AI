import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import RightPanel from './components/RightPanel';
import ModeCards from './components/ModeCards';
import AnalysisResultCard from './components/AnalysisResultCard';
import HistoryDrawer from './components/HistoryDrawer';
import AuthModal from './components/AuthModal';
import FleetOverviewModal from './components/FleetOverviewModal';
import KnowledgeModal from './components/KnowledgeModal';
import { useQuery } from './context/QueryContext';
import {
  Waves,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function App() {
  const {
    result,
    isLoading,
    error,
    currentQuery,
    executeQuery,
    resetAnalysis,
    selectedMode,
    setSelectedMode,
  } = useQuery();

  const [activeTab, setActiveTab] = useState('chat');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [subSearchInput, setSubSearchInput] = useState('');

  // Handle follow-up query submission from the active result header
  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!subSearchInput.trim() || isLoading) return;
    executeQuery(subSearchInput.trim(), selectedMode);
    setSubSearchInput('');
  };

  const handleOpenPredictions = () => {
    executeQuery('Predict ocean temperature trend for the next 12 months in the Indian Ocean', 'data');
    setActiveTab('chat');
  };

  const handleExport = () => {
    if (result) {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `argo_ocean_analysis_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      setIsFleetOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#030b1e] text-slate-100 flex flex-col font-sans selection:bg-sky-600 selection:text-white">
      {/* Top Header matching exact mockup */}
      <Header
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Body with Left Sidebar + Content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(id) => {
            setActiveTab(id);
            if (id === 'chat') resetAnalysis();
          }}
          onOpenKnowledge={() => setIsKnowledgeOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenFleet={() => setIsFleetOpen(true)}
          onOpenPredictions={handleOpenPredictions}
          onExport={handleExport}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Center & Right Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto space-y-6 max-w-[1600px] w-full mx-auto">
          {/* VIEW A: Result or Loading Workspace */}
          {isLoading || result ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Back to Explorer Navigation & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#071329]/80 backdrop-blur-md border border-slate-700/60 p-3.5 sm:p-4 rounded-2xl shadow-xl">
                {/* Back Button */}
                <button
                  onClick={resetAnalysis}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition group border border-slate-700/60"
                >
                  <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Explorer</span>
                </button>

                {/* Inline Search Bar for Follow-up Questions */}
                <form
                  onSubmit={handleFollowUpSubmit}
                  className="flex-1 max-w-xl flex items-center bg-white rounded-full p-1 pl-4 shadow-md transition focus-within:ring-2 focus-within:ring-sky-500"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={subSearchInput}
                    onChange={(e) => setSubSearchInput(e.target.value)}
                    placeholder="Ask a follow-up or new question..."
                    disabled={isLoading}
                    className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!subSearchInput.trim() || isLoading}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center flex-shrink-0 transition disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </form>

                {/* Reset Query */}
                <button
                  onClick={resetAnalysis}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                  title="Reset analysis"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Loading State Animation */}
              {isLoading && (
                <div className="w-full max-w-xl mx-auto my-12 p-8 rounded-2xl bg-[#071329]/90 border border-slate-700/60 shadow-2xl text-center space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
                    <Waves className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Processing ARGO Oceanographic Query...
                    </h3>
                    <p className="text-xs text-slate-400">
                      Query Understanding • Observational Filtering • Scientific Verification
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                    <span className="text-sky-400">NLP Entity Parsing</span>
                    <span>•</span>
                    <span className="text-sky-400">CTD Calibration</span>
                    <span>•</span>
                    <span className="text-sky-400">Literature RAG</span>
                    <span>•</span>
                    <span>Visualizing</span>
                  </div>
                </div>
              )}

              {/* Error Message if Any */}
              {error && !isLoading && (
                <div className="w-full max-w-2xl mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs text-center space-y-1">
                  <p className="font-semibold">{error}</p>
                </div>
              )}

              {/* Detailed Analysis Result Card */}
              {!isLoading && result && <AnalysisResultCard />}

              {/* Mode Selection Cards at Bottom */}
              <div className="pt-4">
                <ModeCards />
              </div>
            </div>
          ) : (
            /* VIEW B: Default Dashboard matching exact uploaded design */
            <div className="space-y-6 animate-fadeIn">
              {/* Top Row: Hero Section + Right Sidebar Panel */}
              <div className="flex flex-col lg:flex-row gap-5 items-stretch">
                {/* Center Hero Card with ARGO Float Ocean Photo */}
                <div className="flex-1 min-w-0">
                  <HeroSection />
                </div>

                {/* Right Panel: ARGO at a Glance & Live Ocean View */}
                <RightPanel onOpenFleet={() => setIsFleetOpen(true)} />
              </div>

              {/* Bottom Row: The 3 Modes Cards */}
              <ModeCards />
            </div>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
      <FleetOverviewModal
        isOpen={isFleetOpen}
        onClose={() => setIsFleetOpen(false)}
      />
      <KnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />
    </div>
  );
}

export default App;
