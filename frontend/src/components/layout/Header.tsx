import React from 'react';
import {
  Menu,
  Printer,
  Save,
  Sparkles,
  FileCheck,
  Target,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab, ResumeData } from '../../types';
import { Button } from '../ui/Button';

interface HeaderProps {
  currentView: ActiveTab;
  resumeData: ResumeData;
  onOpenAIGenerator: () => void;
  onOpenJDMatcher: () => void;
  onOpenAIReview: () => void;
  onSaveDraft?: () => void;
  onToggleMobileMenu: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
}

const VIEW_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Career Workspace',
    subtitle: 'Active resume desk, triage checklist & career pipeline',
  },
  studio: {
    title: 'Resume Studio',
    subtitle: 'Document editor & vector paper canvas',
  },
  chat: {
    title: 'AI Career Coach',
    subtitle: 'Targeted prompt engineering & multi-turn resume refinement',
  },
  analytics: {
    title: 'ATS Telemetry',
    subtitle: 'Honest keyword density, action verb metrics & structural audit',
  },
  settings: {
    title: 'Settings & Data',
    subtitle: 'Author profile, preferences & JSON document backup',
  },
  auth: {
    title: 'Authentication',
    subtitle: 'Sign in to access synchronized workspaces',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  resumeData,
  onOpenAIGenerator,
  onOpenJDMatcher,
  onOpenAIReview,
  onSaveDraft,
  onToggleMobileMenu,
  onToggleSidebarCollapse,
  isSidebarCollapsed,
}) => {
  const meta = VIEW_TITLES[currentView] || {
    title: 'IntelliResume',
    subtitle: 'Career Document Architect',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="h-14 w-full bg-[#080c14] border-b border-white/[0.08] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 no-print app-header select-none">
      {/* Left: Hamburger + Context */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile drawer toggle */}
        <button
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation drawer"
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        {onToggleSidebarCollapse && (
          <button
            onClick={onToggleSidebarCollapse}
            aria-label="Toggle sidebar collapse"
            className="hidden lg:flex p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-white tracking-tight font-['Plus_Jakarta_Sans'] truncate">
              {meta.title}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-[11px] font-mono text-blue-400 hidden sm:inline font-medium">
              {resumeData.title || 'Full Stack Software Engineer'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2">
        {onSaveDraft && (
          <button
            onClick={onSaveDraft}
            className="h-7 px-2.5 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-[#131d33] hover:bg-[#1a2744] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Save draft to local workspace storage"
          >
            <Save className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
        )}

        {currentView === 'studio' && (
          <button
            onClick={handlePrint}
            className="h-7 px-2.5 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-[#131d33] hover:bg-[#1a2744] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export vector PDF via browser print"
          >
            <Printer className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        )}

        <button
          onClick={onOpenAIGenerator}
          className="h-7 px-3 rounded text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">AI Generator</span>
          <span className="sm:hidden">Generate</span>
        </button>
      </div>
    </header>
  );
};
