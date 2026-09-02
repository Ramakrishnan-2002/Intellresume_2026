import React from 'react';
import {
  FileEdit,
  Activity,
  MessageSquare,
  BarChart2,
  Settings,
  Sparkles,
  Plus,
  X,
  Target,
  FileCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, ResumeData } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  resumeData: ResumeData;
  onNewResume: () => void;
  onOpenAIGenerator: () => void;
  onOpenJDMatcher: () => void;
  onOpenAIReview: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSectionItem {
  id: ActiveTab;
  label: string;
  description: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavSectionItem[] = [
  {
    id: 'dashboard',
    label: 'Career Workspace',
    description: 'Overview, triage & action pipeline',
    icon: Activity,
  },
  {
    id: 'studio',
    label: 'Resume Studio',
    description: 'Document editor & vector canvas',
    icon: FileEdit,
  },
  {
    id: 'chat',
    label: 'AI Career Coach',
    description: 'Targeted resume strategy & suggestions',
    icon: MessageSquare,
  },
  {
    id: 'analytics',
    label: 'ATS Telemetry',
    description: 'Action verbs, impact ratio & compliance',
    icon: BarChart2,
  },
  {
    id: 'settings',
    label: 'Settings & Data',
    description: 'Author profile & JSON backup',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  resumeData,
  onNewResume,
  onOpenAIGenerator,
  onOpenJDMatcher,
  onOpenAIReview,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const handleSelect = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  // Collapsed Mini-Rail Content (64px wide)
  const collapsedNavContent = (
    <div className="flex flex-col h-full justify-between items-center py-4 px-2 select-none text-slate-300">
      <div className="flex flex-col items-center gap-6">
        {/* Brand Icon */}
        <button
          onClick={() => handleSelect('dashboard')}
          className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-mono text-xs shadow-sm hover:bg-blue-500 transition-colors cursor-pointer"
          title="IntelliResume Home"
        >
          IR
        </button>

        {/* Action Icon Pill */}
        <button
          onClick={onOpenAIGenerator}
          className="w-8 h-8 rounded-md bg-blue-950/70 border border-blue-500/30 text-blue-400 flex items-center justify-center hover:bg-blue-900/60 hover:text-white transition-colors cursor-pointer"
          title="AI Resume Generator"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Nav Items as Tooltip Icons */}
        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-white/[0.08] w-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer relative group ${
                  isActive
                    ? 'bg-[#141d32] text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {/* Floating Tooltip */}
                <span className="absolute left-full ml-2.5 px-2 py-1 rounded bg-[#141d32] border border-white/10 text-[11px] font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expand Button at Bottom */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-md bg-[#131d33] hover:bg-[#1a2744] text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  // Full Expanded Nav Content (240px wide)
  const fullNavContent = (
    <div className="flex flex-col h-full justify-between p-4 font-sans select-none text-slate-300">
      {/* Brand & Workspace Identity */}
      <div className="space-y-4">
        {/* Top Product Mark */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold font-mono text-xs shadow-sm">
              IR
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-xs tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  INTELLIRESUME
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
                Career Document Architect
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse Sidebar"
                className="hidden lg:flex p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="lg:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Current Active Document Meta */}
        <div className="p-3 rounded-lg bg-[#0d121c] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">ACTIVE RESUME</span>
            <span className="text-blue-400 font-semibold">
              {resumeData.metrics?.resumeScore || 0}/100
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate font-['Plus_Jakarta_Sans']">
            {resumeData.title || 'Full Stack Software Engineer'}
          </div>
          <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{resumeData.status || 'DRAFT'}</span>
            <span>•</span>
            <span>{resumeData.experience?.length || 0} roles</span>
          </div>
        </div>

        {/* Primary Generator Action */}
        <div className="space-y-1.5">
          <button
            onClick={() => {
              onOpenAIGenerator();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-md text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Resume Generator</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                onOpenJDMatcher();
                if (onCloseMobile) onCloseMobile();
              }}
              className="bg-[#131d33] hover:bg-[#1a2744] text-slate-200 border border-white/10 py-1.5 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Compare against Job Description"
            >
              <Target className="w-3 h-3 text-blue-400" />
              <span>Job Match</span>
            </button>

            <button
              onClick={() => {
                onOpenAIReview();
                if (onCloseMobile) onCloseMobile();
              }}
              className="bg-[#131d33] hover:bg-[#1a2744] text-slate-200 border border-white/10 py-1.5 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Executive Audit"
            >
              <FileCheck className="w-3 h-3 text-sky-400" />
              <span>AI Audit</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation */}
        <div className="space-y-0.5 pt-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-colors flex items-start gap-3 cursor-pointer group ${
                  isActive
                    ? 'bg-[#131d33] text-white border-l-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <div className="overflow-hidden leading-tight">
                  <div
                    className={`text-xs font-semibold ${
                      isActive ? 'text-slate-100' : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="pt-3 border-t border-white/[0.07] space-y-2">
        <button
          onClick={() => {
            onNewResume();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Start Fresh Workspace</span>
        </button>

        <div className="px-2 py-1.5 rounded bg-[#0d121c] border border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Gemini 3.6 Flash</span>
          </span>
          <span className="text-slate-400">Live API</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Collapsible) */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed ? 'w-16' : 'w-60'
        } bg-[#0d111a] border-r border-white/[0.08] flex-col shrink-0 h-screen sticky top-0 z-40 no-print transition-all duration-200`}
      >
        {isCollapsed ? collapsedNavContent : fullNavContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden flex no-print animate-in fade-in duration-150"
        >
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="relative w-68 max-w-[80vw] bg-[#0d111a] border-r border-white/10 h-full flex flex-col z-10 shadow-2xl">
            {fullNavContent}
          </div>
        </div>
      )}
    </>
  );
};
