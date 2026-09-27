import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight, Search, FileText, CheckCircle, ExternalLink, Database } from 'lucide-react';
import { queryApi } from '../services/api';
import { useQuery } from '../context/QueryContext';

const KNOWLEDGE_CATEGORIES = [
  {
    id: '01_argo_program_overview',
    title: 'ARGO Program Overview & Global Array',
    badge: 'GOOS / WMO',
    summary: 'Mission objectives, international fleet of 4,000 active robotic floats, and expansions into Deep Argo and BGC-Argo.',
    topics: [
      'What is an ARGO float?',
      'Explain the mission and objectives of the ARGO program',
      'What are Deep Argo and BGC-Argo floats?',
    ],
  },
  {
    id: '02_argo_float_operation_and_sensors',
    title: 'Float Operation, Buoyancy Engine & CTD',
    badge: 'Hardware & Mechanics',
    summary: 'Hydraulic variable buoyancy engine, Archimedes principle, the standard 10-day profiling cycle, and Sea-Bird CTD sensor payload.',
    topics: [
      'How does an ARGO float work?',
      'Explain the 10-day profiling cycle of an ARGO float',
      'How does ARGO measure temperature, salinity, and depth?',
    ],
  },
  {
    id: '03_argo_data_system_and_gdac',
    title: 'ARGO Data Management System & GDAC',
    badge: 'Data Pipeline',
    summary: 'Satellite telemetry, 11 National DACs (including INCOIS, AOML, Coriolis), and the two synchronized global mirrors: Coriolis France and US GDAC.',
    topics: [
      'What is the ARGO Data System?',
      'What is GDAC and what are DACs?',
      'What is the difference between Real-Time and Delayed-Mode data?',
    ],
  },
  {
    id: '04_argo_quality_control_procedures',
    title: 'Quality Control Procedures & QC Flags',
    badge: 'Validation Standards',
    summary: '19 automated real-time screening tests (RTQC), DMQC statistical salinity calibration (Owens & Wong), and standardized QC flags 1 to 9.',
    topics: [
      'What are ARGO quality-control procedures?',
      'Explain the ARGO QC flag scale from 1 to 9',
      'What are the 19 automated real-time QC tests in ARGO?',
    ],
  },
  {
    id: '05_physical_oceanography_mechanisms',
    title: 'Water Column Stratification & Ocean Physics',
    badge: 'Ocean Dynamics',
    summary: 'Mixed layer, thermocline, halocline, Beer-Lambert solar light extinction, and comparative dynamics between Bay of Bengal and Arabian Sea.',
    topics: [
      'Why is ocean temperature lower at 500 meters than at the surface?',
      'Why is the Arabian Sea saltier than the Bay of Bengal?',
      'What is the barrier layer in the Bay of Bengal?',
    ],
  },
  {
    id: '06_importance_and_applications_of_argo',
    title: 'Scientific Importance & Weather Forecasting',
    badge: 'Climate & Forecasting',
    summary: 'Earth energy imbalance, Ocean Heat Content (OHC), thermosteric sea-level rise, and real-time operational NWP weather/cyclone models.',
    topics: [
      'Explain the importance of ARGO data in climate research',
      'How is ARGO data used in monsoon and cyclone forecasting?',
      'What is thermosteric sea-level rise?',
    ],
  },
];

const KnowledgeModal = ({ isOpen, onClose }) => {
  const { executeQuery, isLoading } = useQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  if (!isOpen) return null;

  const handleSelectTopic = (topicQuery) => {
    onClose();
    executeQuery(topicQuery);
  };

  const filteredCategories = KNOWLEDGE_CATEGORIES.filter((cat) => {
    const term = searchTerm.toLowerCase();
    return (
      cat.title.toLowerCase().includes(term) ||
      cat.summary.toLowerCase().includes(term) ||
      cat.topics.some((t) => t.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-navy-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-mono">
                ARGO Oceanographic Knowledge Base & Documentation
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative scientific literature, technical manuals, and physical oceanography principles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-navy-900/50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ARGO documentation (e.g. 'buoyancy engine', 'GDAC', 'QC flags', 'thermocline')..."
              className="w-full pl-9 pr-4 py-2 bg-navy-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>
        </div>

        {/* Categories & Topics Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-navy-950/70 rounded-xl p-4 border border-slate-800/90 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      {cat.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 font-mono">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cat.summary}
                  </p>
                </div>

                {/* Direct Query Prompts */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Inquire Natural Language:
                  </span>
                  {cat.topics.map((topic, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => handleSelectTopic(topic)}
                      disabled={isLoading}
                      className="w-full text-left p-2 rounded-lg bg-navy-900/60 hover:bg-indigo-950/40 border border-slate-800/60 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-300 flex items-center justify-between transition group"
                    >
                      <span className="truncate pr-2">{topic}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-navy-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>6 Official ARGO Documentation Volumes Indexed</span>
          <span className="font-mono text-indigo-400">TF-IDF Dense Vector Retrieval Active</span>
        </div>

      </div>
    </div>
  );
};

export default KnowledgeModal;
