import React, { useState } from 'react';
import {
  ResumeData,
  ExperienceItem,
  EducationItem,
  ProjectItem,
} from '../types';
import {
  FileEdit,
  Save,
  Target,
  Sparkles,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  User,
  Briefcase,
  Code2,
  GraduationCap,
  FolderGit2,
} from 'lucide-react';
import { PersonalInfoEditor } from './studio/PersonalInfoEditor';
import { ExperienceEditor } from './studio/ExperienceEditor';
import { SkillsEditor } from './studio/SkillsEditor';
import { EducationEditor } from './studio/EducationEditor';
import { ProjectsEditor } from './studio/ProjectsEditor';
import { StudioAICoachPanel } from './studio/StudioAICoachPanel';
import { ThreeResumeCanvas } from './ThreeResumeCanvas';

export type StudioSection = 'personal' | 'experience' | 'skills' | 'education' | 'projects';

interface ResumeStudioViewProps {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  onOpenJDMatcher: () => void;
  onOpenAIReview: () => void;
  onOpenAIGenerator?: () => void;
  onSaveDraft?: () => void;
}

export const ResumeStudioView: React.FC<ResumeStudioViewProps> = ({
  data,
  setData,
  onOpenJDMatcher,
  onOpenAIReview,
  onOpenAIGenerator,
  onSaveDraft,
}) => {
  const [activeSection, setActiveSection] = useState<StudioSection>('personal');
  // Toggle states for maximum space and clean, uncluttered layout
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false); // Default CLOSED so PDF has maximum space
  const [isOriginalSize, setIsOriginalSize] = useState(true); // Default to true 100% Letter size

  // Mobile mode toggle ('edit' vs 'preview')
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('preview');

  const handlePersonalInfoChange = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const handleUpdateTitle = (title: string) => {
    setData((prev) => ({ ...prev, title }));
  };

  const handleExperienceChange = (updated: ExperienceItem[]) => {
    setData((prev) => ({ ...prev, experience: updated }));
  };

  const handleSkillsChange = (updated: ResumeData['skills']) => {
    setData((prev) => ({ ...prev, skills: updated }));
  };

  const handleEducationChange = (updated: EducationItem[]) => {
    setData((prev) => ({ ...prev, education: updated }));
  };

  const handleProjectsChange = (updated: ProjectItem[]) => {
    setData((prev) => ({ ...prev, projects: updated }));
  };

  const handleIncrementScore = (delta: number) => {
    setData((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        resumeScore: Math.min(100, (prev.metrics?.resumeScore || 85) + delta),
      },
    }));
  };

  const handleApplySummaryFromCoach = (newSummary: string) => {
    handlePersonalInfoChange('summary', newSummary);
    handleIncrementScore(3);
  };

  const handleApplyBulletFromCoach = (
    expIndex: number,
    bulletIndex: number,
    newBullet: string
  ) => {
    setData((prev) => {
      const expCopy = [...(prev.experience || [])];
      if (expCopy[expIndex]) {
        const bulletsCopy = [...(expCopy[expIndex].bullets || [])];
        bulletsCopy[bulletIndex] = newBullet;
        expCopy[expIndex] = { ...expCopy[expIndex], bullets: bulletsCopy };
      }
      return { ...prev, experience: expCopy };
    });
    handleIncrementScore(2);
  };

  const handleAddSkillFromCoach = (category: string, skill: string) => {
    setData((prev) => {
      const currentSkills = prev.skills || { languages: [], frameworks: [], tools: [], cloud: [] };
      const catKey = category as keyof typeof currentSkills;
      const list = currentSkills[catKey] || [];
      if (!list.includes(skill)) {
        return {
          ...prev,
          skills: {
            ...currentSkills,
            [catKey]: [...list, skill],
          },
        };
      }
      return prev;
    });
    handleIncrementScore(1);
  };

  // Section meta with counts for the horizontal toggle bar
  const sectionTabs = [
    { id: 'personal' as StudioSection, label: 'Contact', icon: User },
    {
      id: 'experience' as StudioSection,
      label: 'Experience',
      icon: Briefcase,
      count: data.experience?.length || 0,
    },
    {
      id: 'skills' as StudioSection,
      label: 'Skills',
      icon: Code2,
      count:
        (data.skills?.languages?.length || 0) +
        (data.skills?.frameworks?.length || 0) +
        (data.skills?.tools?.length || 0) +
        (data.skills?.cloud?.length || 0),
    },
    {
      id: 'education' as StudioSection,
      label: 'Education',
      icon: GraduationCap,
      count: data.education?.length || 0,
    },
    {
      id: 'projects' as StudioSection,
      label: 'Projects',
      icon: FolderGit2,
      count: data.projects?.length || 0,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080c14] text-[#f8fafc] font-sans select-none">
      {/* Top Studio Toggle Bar */}
      <div className="shrink-0 h-11 bg-[#0b101c] border-b border-white/[0.08] px-3 sm:px-4 flex items-center justify-between gap-2 z-20 no-print">
        {/* Left: Panel Toggles & Section Switcher */}
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
          {/* Toggle Editor Panel */}
          <button
            onClick={() => setIsEditorOpen((prev) => !prev)}
            className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
              isEditorOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-[#131d33] hover:bg-[#1a2744] text-slate-300 border-white/10'
            }`}
            title={isEditorOpen ? 'Hide Editor Panel' : 'Show Editor Panel'}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>{isEditorOpen ? 'Hide Editor' : 'Show Editor'}</span>
          </button>

          {/* Section Tabs (Visible when Editor is open) */}
          {isEditorOpen && (
            <div className="hidden sm:flex items-center gap-1 p-0.5 bg-[#060911] rounded-md border border-white/10 shrink-0">
              {sectionTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`h-6 px-2.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#18233d] text-blue-400 font-semibold border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: PDF Sizing & Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Original Size Toggle */}
          <button
            onClick={() => setIsOriginalSize((prev) => !prev)}
            className={`h-7 px-2.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isOriginalSize
                ? 'bg-[#18233d] text-blue-300 border-blue-500/40'
                : 'bg-[#131d33] hover:bg-[#1a2744] text-slate-300 border-white/10'
            }`}
            title={isOriginalSize ? 'Switch to Fit Width' : 'Switch to 100% Original Size (8.5" x 11")'}
          >
            {isOriginalSize ? (
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden md:inline">
              {isOriginalSize ? '100% Original Size' : 'Fit Width'}
            </span>
          </button>

          {/* AI Coach Flyout Toggle */}
          <button
            onClick={() => setIsAICoachOpen((prev) => !prev)}
            className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isAICoachOpen
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-[#131d33] hover:bg-[#1a2744] text-blue-300 border-blue-500/30'
            }`}
            title="Toggle Contextual AI Coach"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>

          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              className="h-7 px-2.5 rounded text-xs font-medium text-slate-300 hover:text-white bg-[#131d33] hover:bg-[#1a2744] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Save draft"
            >
              <Save className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Switcher Tab (< 1024px) */}
      <div className="lg:hidden flex items-center justify-center p-2 bg-[#0a0f1d] border-b border-white/[0.08] no-print">
        <div className="inline-flex p-1 bg-[#131d33] rounded-lg border border-white/10 text-xs font-medium">
          <button
            onClick={() => setMobileMode('edit')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-colors ${
              mobileMode === 'edit'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Edit Document</span>
          </button>
          <button
            onClick={() => setMobileMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md transition-colors ${
              mobileMode === 'preview'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>PDF Preview</span>
          </button>
        </div>
      </div>

      {/* Main Studio Frame */}
      <div className="flex-1 flex overflow-hidden h-full relative">
        {/* Left Side: Structured Form Editor (Toggleable) */}
        {isEditorOpen && (
          <div
            className={`w-full lg:w-[420px] xl:w-[440px] shrink-0 flex flex-col h-full border-r border-white/[0.08] bg-[#0c111e] z-10 no-print transition-all duration-200 ${
              mobileMode === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Small Screen Section Selectors */}
            <div className="sm:hidden flex items-center gap-1 p-2 bg-[#090d18] border-b border-white/[0.08] overflow-x-auto shrink-0">
              {sectionTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white bg-[#131d33]'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {activeSection === 'personal' && (
                <PersonalInfoEditor
                  data={data}
                  onChange={handlePersonalInfoChange}
                  onUpdateTitle={handleUpdateTitle}
                />
              )}

              {activeSection === 'experience' && (
                <ExperienceEditor
                  experience={data.experience || []}
                  targetRole={data.title}
                  onChange={handleExperienceChange}
                  onIncrementScore={handleIncrementScore}
                />
              )}

              {activeSection === 'skills' && (
                <SkillsEditor
                  skills={
                    data.skills || { languages: [], frameworks: [], tools: [], cloud: [] }
                  }
                  onChange={handleSkillsChange}
                />
              )}

              {activeSection === 'education' && (
                <EducationEditor
                  education={data.education || []}
                  onChange={handleEducationChange}
                />
              )}

              {activeSection === 'projects' && (
                <ProjectsEditor
                  projects={data.projects || []}
                  onChange={handleProjectsChange}
                />
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-3 bg-[#080c16] border-t border-white/[0.08] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenJDMatcher}
                  className="h-7 px-2.5 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-[#131d33] hover:bg-[#1a2744] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Match against Job Description"
                >
                  <Target className="w-3 h-3 text-blue-400" />
                  <span>Match JD</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenAIReview}
                  className="h-7 px-2.5 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-[#131d33] hover:bg-[#1a2744] border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Run Executive AI Review"
                >
                  <FileCheck className="w-3 h-3 text-sky-400" />
                  <span>AI Audit</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="h-7 px-2.5 rounded text-[11px] font-medium text-slate-400 hover:text-white bg-[#131d33] border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Hide Editor (Full Screen PDF)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Collapse</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center: Live Vector Document Viewport (PDF in Original Size) */}
        <div
          className={`flex-1 h-full overflow-hidden ${
            mobileMode === 'edit' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <ThreeResumeCanvas
            data={data}
            isOriginalSize={isOriginalSize}
            onToggleOriginalSize={() => setIsOriginalSize((prev) => !prev)}
            onExportPDF={() => window.print()}
          />
        </div>

        {/* Right Side: Contextual AI Coach Flyout Drawer */}
        {isAICoachOpen && (
          <div
            className={`w-80 lg:w-88 shrink-0 h-full no-print z-30 transition-all border-l border-white/[0.08] shadow-2xl relative bg-[#0c1220] ${
              mobileMode === 'edit' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Quick Close Button */}
            <button
              onClick={() => setIsAICoachOpen(false)}
              className="absolute top-3.5 right-3.5 z-40 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close AI Coach"
            >
              <X className="w-4 h-4" />
            </button>

            <StudioAICoachPanel
              data={data}
              activeSection={activeSection}
              onApplySummary={handleApplySummaryFromCoach}
              onApplyBullet={handleApplyBulletFromCoach}
              onAddSkill={handleAddSkillFromCoach}
            />
          </div>
        )}
      </div>
    </div>
  );
};
