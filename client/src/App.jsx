import React, { useState } from 'react';
import Navbar from './components/Navbar';
import QueryInput from './components/QueryInput';
import SuggestionPills from './components/SuggestionPills';
import AnalysisResultCard from './components/AnalysisResultCard';
import HistoryDrawer from './components/HistoryDrawer';
import AuthModal from './components/AuthModal';
import FleetOverviewModal from './components/FleetOverviewModal';
import KnowledgeModal from './components/KnowledgeModal';
import { useQuery } from './context/QueryContext';
import { Waves, Compass, Activity, ShieldCheck, Database, Layers, ArrowRight, BookOpen, HelpCircle } from 'lucide-react';

function App() {
  const { result, isLoading, error } = useQuery();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-700 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFleet={() => setIsFleetOpen(true)}
        onOpenKnowledge={() => setIsKnowledgeOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center">
        
        {/* Hero Section (Visible when no active analysis) */}
        {!result && !isLoading && (
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-navy-900 border border-slate-800 text-xs font-mono text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>ARGO Oceanographic Analysis & Knowledge Platform</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-mono leading-tight">
              Oceanographic Analysis via <br className="hidden sm:inline" />
              <span className="text-cyan-400">
                Natural-Language Interaction
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Query 2,000-meter CTD vertical profiles, evaluate cross-basin salinity dynamics, and retrieve grounded physical oceanography literature with strict anti-hallucination guardrails.
            </p>

            {/* 3 Core Query Modes Architecture (Section 5, 6, 7) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-3xl mx-auto text-left">
              <div className="bg-navy-900/70 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Mode 1: Data Analysis</span>
                </div>
                <p className="text-xs font-semibold text-slate-200">Numerical Truth</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Deterministic filtering across 1,568+ ARGO profiles, depth slicing, and statistics.
                </p>
              </div>

              <div 
                onClick={() => setIsKnowledgeOpen(true)}
                className="bg-navy-900/70 p-3.5 rounded-xl border border-slate-800/90 hover:border-indigo-500/40 transition cursor-pointer space-y-1"
              >
                <div className="flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-mono text-indigo-400 uppercase font-bold">Mode 2: RAG Knowledge</span>
                </div>
                <p className="text-xs font-semibold text-slate-200">Official Literature</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Semantic retrieval over official ARGO documentation, GDAC architecture, and QC tests.
                </p>
              </div>

              <div className="bg-navy-900/70 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">Mode 3: Hybrid Engine</span>
                </div>
                <p className="text-xs font-semibold text-slate-200">Data + Physical Mechanism</p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Calculates exact observations and explains physical mechanisms (thermocline, solar attenuation).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Query Input Box */}
        <QueryInput />

        {/* Suggestion Pills */}
        <SuggestionPills />

        {/* Loading Pipeline State */}
        {isLoading && (
          <div className="w-full max-w-xl mx-auto mt-12 p-6 rounded-2xl bg-navy-900/80 border border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-cyan-400 flex items-center justify-center mx-auto border border-slate-700">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white font-mono">
                Processing Oceanographic Query...
              </h3>
              <p className="text-xs text-slate-400">
                Parsing intent, routing to ARGO Data Engine / RAG Knowledge, and validating measurements.
              </p>
            </div>
            {/* Scientific Pipeline Steps */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              <span className="text-cyan-400">NLP Intent Detection</span>
              <span>•</span>
              <span className="text-cyan-400">Exact Filter / RAG Retrieval</span>
              <span>•</span>
              <span>Deterministic Validation</span>
              <span>•</span>
              <span>Rendering</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="w-full max-w-2xl mx-auto mt-8 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs text-center space-y-1">
            <p className="font-semibold">{error}</p>
            <p className="text-rose-400/80">
              Please check your query or verify that the backend and Python services are operational.
            </p>
          </div>
        )}

        {/* Main Analysis Result Workspace */}
        {!isLoading && result && <AnalysisResultCard />}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-navy-950 py-6 text-center text-xs text-slate-400 space-y-2 mt-auto">
        <div className="flex items-center justify-center space-x-4">
          <span>ARGO Global Ocean Profiling Array</span>
          <span>•</span>
          <span>WMO / IOC Global Ocean Observing System</span>
          <span>•</span>
          <span>Zero Hallucination Grounded Architecture</span>
        </div>
        <p className="text-[11px] text-slate-500 font-mono">
          ARGO Data Engine (Numerical Truth) • RAG Knowledge (Document Truth) • Deterministic Analysis
        </p>
      </footer>

      {/* Modals & Slide-overs */}
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
