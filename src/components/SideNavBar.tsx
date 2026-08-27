import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  User,
  Plus,
  Bot,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface SideNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewResume: () => void;
  onOpenAIGenerator: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  setActiveTab,
  onNewResume,
  onOpenAIGenerator,
}) => {
  return (
    <nav className="bg-[#1c1f2a]/90 backdrop-blur-xl fixed left-0 top-0 h-full w-[80px] hover:w-[250px] transition-all duration-300 ease-in-out z-50 border-r border-[#3c4a42]/30 shadow-2xl flex flex-col justify-between py-6 group overflow-hidden no-print">
      {/* Brand Header */}
      <div className="px-4 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#4edea3]/20 border border-[#4edea3]/30 flex-shrink-0 flex items-center justify-center text-[#4edea3] shadow-[0_0_15px_rgba(78,222,163,0.2)]">
          <Bot className="w-6 h-6" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
          <h1 className="font-extrabold text-base tracking-tight text-[#4edea3] font-['Plus_Jakarta_Sans']">
            IntelliResume
          </h1>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            AI Resume Studio
          </p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="px-3 mb-4 space-y-2">
        <button
          onClick={onOpenAIGenerator}
          className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg py-2.5 px-3 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-emerald-500/20 overflow-hidden"
          title="Generate AI Resume from Backend"
        >
          <Sparkles className="w-5 h-5 shrink-0 animate-pulse" />
          <span className="text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            AI Generator
          </span>
        </button>

        <button
          onClick={onNewResume}
          className="w-full bg-[#262a35] hover:bg-[#323746] text-slate-200 rounded-lg py-2 px-3 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all duration-200 border border-[#3c4a42]/40 overflow-hidden"
          title="Create New Blank Template"
        >
          <Plus className="w-4 h-4 shrink-0 text-[#4edea3]" />
          <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            New Workspace
          </span>
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex-1 px-2 space-y-1.5">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'text-[#4edea3] font-bold border-l-4 border-[#4edea3] bg-[#4edea3]/10 shadow-[0_0_15px_rgba(78,222,163,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#262a35]/60'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Dashboard
          </span>
        </button>

        {/* Resume Studio */}
        <button
          onClick={() => setActiveTab('studio')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'studio'
              ? 'text-[#4edea3] font-bold border-l-4 border-[#4edea3] bg-[#4edea3]/10 shadow-[0_0_15px_rgba(78,222,163,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#262a35]/60'
          }`}
        >
          <FileText className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Resume Studio
          </span>
        </button>

        {/* AI Chat */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'chat'
              ? 'text-[#4edea3] font-bold border-l-4 border-[#4edea3] bg-[#4edea3]/10 shadow-[0_0_15px_rgba(78,222,163,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#262a35]/60'
          }`}
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            AI Chat
          </span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'analytics'
              ? 'text-[#4edea3] font-bold border-l-4 border-[#4edea3] bg-[#4edea3]/10 shadow-[0_0_15px_rgba(78,222,163,0.15)]'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#262a35]/60'
          }`}
        >
          <BarChart3 className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Analytics
          </span>
        </button>
      </div>

      {/* Footer / Utilities */}
      <div className="px-2 space-y-1.5 pt-4 border-t border-[#3c4a42]/30">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 ${
            activeTab === 'settings'
              ? 'text-[#4edea3] font-bold bg-[#4edea3]/10'
              : 'text-slate-400 hover:text-slate-100 hover:bg-[#262a35]/60'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Settings
          </span>
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-[#262a35]/60 transition-all duration-200"
        >
          <User className="w-5 h-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Auth Portal
          </span>
        </button>
      </div>
    </nav>
  );
};
