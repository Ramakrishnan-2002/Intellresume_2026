import React, { useState } from 'react';
import { ActiveTab, ResumeData } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  resumeData: ResumeData;
  toastMessage: string | null;
  onNewResume: () => void;
  onOpenAIGenerator: () => void;
  onOpenJDMatcher: () => void;
  onOpenAIReview: () => void;
  onSaveDraft?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  resumeData,
  toastMessage,
  onNewResume,
  onOpenAIGenerator,
  onOpenJDMatcher,
  onOpenAIReview,
  onSaveDraft,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Auto-collapse sidebar in studio mode for maximum document width, expandable anytime
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#080c14] text-[#f8fafc] overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#121a2d] border border-blue-500/30 text-slate-100 px-3.5 py-2.5 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-2 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar (Desktop persistent collapsible + Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resumeData={resumeData}
        onNewResume={onNewResume}
        onOpenAIGenerator={onOpenAIGenerator}
        onOpenJDMatcher={onOpenJDMatcher}
        onOpenAIReview={onOpenAIReview}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <Header
          currentView={activeTab}
          resumeData={resumeData}
          onOpenAIGenerator={onOpenAIGenerator}
          onOpenJDMatcher={onOpenJDMatcher}
          onOpenAIReview={onOpenAIReview}
          onSaveDraft={onSaveDraft}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Dynamic View Viewport */}
        <main className="flex-1 flex overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
