import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Sparkles } from 'lucide-react';
import { avatarUrls } from '../data/mockData';

interface TopAppBarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAIGenerator: () => void;
  onOpenHelp: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentView,
  onSelectView,
  searchQuery,
  setSearchQuery,
  onOpenAIGenerator,
  onOpenHelp,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-[#0f131d]/85 backdrop-blur-md sticky top-0 w-full z-40 border-b border-[#3c4a42]/30 flex justify-between items-center px-6 h-16 transition-all no-print">
      {/* Left Links */}
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <button
            onClick={() => onSelectView('studio')}
            className={`pb-1 transition-all ${
              currentView === 'studio'
                ? 'text-[#4edea3] font-bold border-b-2 border-[#4edea3]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Studio &amp; PDF
          </button>
          <button
            onClick={() => onSelectView('dashboard')}
            className={`pb-1 transition-all ${
              currentView === 'dashboard'
                ? 'text-[#4edea3] font-bold border-b-2 border-[#4edea3]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workspace
          </button>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search resumes, jobs..."
            className="bg-[#1c1f2a] border border-[#3c4a42]/40 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/30 w-48 lg:w-64 transition-all"
          />
        </div>

        {/* AI Resume Generator Trigger */}
        <button
          onClick={onOpenAIGenerator}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-blue-600/20 text-[#4edea3] border border-[#4edea3]/40 hover:bg-[#4edea3]/25 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm"
          title="Generate AI Resume from Backend"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>AI Generator</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-slate-400 hover:text-[#4edea3] transition-colors p-1.5 rounded-lg hover:bg-[#1c1f2a]"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#4edea3] rounded-full ring-2 ring-[#0f131d]"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#171b26] border border-[#3c4a42]/50 rounded-xl p-3 shadow-2xl z-50 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#3c4a42]/40 font-bold text-slate-200">
                <span>Notifications</span>
                <span className="text-[10px] text-[#4edea3] font-mono">2 New</span>
              </div>
              <div className="py-2 space-y-2">
                <div className="p-2 bg-[#1c1f2a] rounded-lg border border-[#3c4a42]/30">
                  <div className="font-semibold text-[#4edea3]">AI Model Ready</div>
                  <div className="text-slate-400 text-[11px]">
                    Backend Gemini 3.7 Flash connected for intelligent PDF resume generation.
                  </div>
                </div>
                <div className="p-2 bg-[#1c1f2a] rounded-lg border border-[#3c4a42]/30">
                  <div className="font-semibold text-blue-400">ATS Telemetry</div>
                  <div className="text-slate-400 text-[11px]">
                    Live 3D &amp; Flat printable rendering synced with editor state.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="text-slate-400 hover:text-[#4edea3] transition-colors p-1.5 rounded-lg hover:bg-[#1c1f2a]"
          title="Help & Shortcuts"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User Profile Avatar */}
        <div
          className="w-8 h-8 rounded-full border border-[#4edea3]/40 overflow-hidden shadow-md cursor-pointer hover:ring-2 hover:ring-[#4edea3]/50 transition-all"
          title="Architect Profile"
        >
          <img
            src={avatarUrls.user1}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
