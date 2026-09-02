import React from 'react';
import { ResumeData, ActivityItem, ActiveTab } from '../types';
import {
  FileEdit,
  Target,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Plus,
  Compass,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './ui/Button';

interface DashboardViewProps {
  data: ResumeData;
  activities: ActivityItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenJDMatcher: () => void;
  onOpenAIGenerator: () => void;
  onNewResume: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  activities,
  setActiveTab,
  onOpenJDMatcher,
  onOpenAIGenerator,
  onNewResume,
}) => {
  // Real derived checklist items based on actual resume data
  const triageItems = [];

  const bulletsCount =
    data.experience?.reduce((acc, exp) => acc + (exp.bullets?.length || 0), 0) || 0;

  const quantifiedBulletsCount =
    data.experience?.reduce(
      (acc, exp) =>
        acc +
        (exp.bullets?.filter((b) => /\d+%|\$\d+|\d+\+|\d+x|\b\d+\b/.test(b)).length || 0),
      0
    ) || 0;

  if (!data.personalInfo?.summary || data.personalInfo.summary.length < 50) {
    triageItems.push({
      id: 'summary',
      severity: 'high',
      title: 'Executive summary is brief or incomplete',
      description: 'A 2-3 sentence overview establishes your seniority and engineering scope.',
      actionLabel: 'Edit Summary',
      onClick: () => setActiveTab('studio'),
    });
  }

  if (bulletsCount > 0 && quantifiedBulletsCount / bulletsCount < 0.5) {
    triageItems.push({
      id: 'metrics',
      severity: 'medium',
      title: `${bulletsCount - quantifiedBulletsCount} bullets lack measurable outcomes`,
      description: 'Strengthen bullet points with concrete percentages, latency numbers, or scale indicators.',
      actionLabel: 'Upgrade Bullets',
      onClick: () => setActiveTab('studio'),
    });
  }

  if (!data.skills?.tools || data.skills.tools.length < 4) {
    triageItems.push({
      id: 'tools',
      severity: 'medium',
      title: 'Toolchain skills coverage is low',
      description: 'Target applicant tracking systems by specifying developer tools and frameworks.',
      actionLabel: 'Add Skills',
      onClick: () => setActiveTab('studio'),
    });
  }

  const score = data.metrics?.resumeScore || 88;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 bg-[#080c14] text-[#f8fafc] font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Workspace Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                Career Engineering Workspace
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">v2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              {data.personalInfo.firstName} {data.personalInfo.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-slate-300 font-medium">{data.title || 'Senior Software Engineer'}</span>
              <span>•</span>
              <span className="font-mono text-blue-400 font-semibold">{score}% ATS Ready</span>
              <span>•</span>
              <span className="text-slate-500">Draft saved locally</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('studio')}
              className="gap-2 shadow-sm font-semibold"
            >
              <FileEdit className="w-4 h-4" />
              <span>Open Resume Studio</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onNewResume}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Button>
          </div>
        </div>

        {/* Central 2-Column Desk: Active Resume Sheet on Left, Action Pipeline on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Active Resume Document Preview Card */}
          <div className="lg:col-span-7 bg-[#0e1424] border border-white/[0.08] rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Primary Resume Sheet
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
                Job-Ready
              </span>
            </div>

            {/* Document Header Representation */}
            <div className="bg-[#070b14] border border-white/[0.06] rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                  {data.personalInfo.firstName} {data.personalInfo.lastName}
                </h3>
                <p className="text-xs text-blue-400 font-mono mt-0.5">
                  {data.title || data.personalInfo.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {data.personalInfo.email} • {data.personalInfo.location}
                </p>
              </div>

              {/* Summary snippet */}
              <div className="border-t border-white/[0.06] pt-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Executive Summary
                </span>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {data.personalInfo.summary || 'No summary entered yet.'}
                </p>
              </div>

              {/* Top experience preview */}
              {data.experience && data.experience[0] && (
                <div className="border-t border-white/[0.06] pt-3">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                    Current Position
                  </span>
                  <div className="flex items-center justify-between text-xs text-slate-200 font-medium">
                    <span>{data.experience[0].role}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {data.experience[0].company}
                    </span>
                  </div>
                  {data.experience[0].bullets?.[0] && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      • {data.experience[0].bullets[0]}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions Bar inside sheet */}
            <div className="mt-5 flex items-center justify-between pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('studio')}
                className="gap-1.5"
              >
                <span>Continue in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onOpenAIGenerator}
                  className="gap-1.5 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Regenerate</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right: The 4-Step Career Workflow Pipeline */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
              Career Workflow Actions
            </h2>

            {/* Step 1: Resume Studio */}
            <div
              onClick={() => setActiveTab('studio')}
              className="p-4 rounded-xl border border-white/[0.08] bg-[#0e1424] hover:border-blue-500/40 cursor-pointer transition-all flex items-start gap-3.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <FileEdit className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white font-['Plus_Jakarta_Sans'] group-hover:text-blue-300 transition-colors">
                    1. Resume Studio
                  </h3>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Edit sections with inline AI bullet rewrites and live vector preview.
                </p>
              </div>
            </div>

            {/* Step 2: Target a Job */}
            <div
              onClick={onOpenJDMatcher}
              className="p-4 rounded-xl border border-white/[0.08] bg-[#0e1424] hover:border-sky-500/40 cursor-pointer transition-all flex items-start gap-3.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white font-['Plus_Jakarta_Sans'] group-hover:text-sky-300 transition-colors">
                    2. Target a Job Description
                  </h3>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Compare alignment against specific roles to identify keyword gaps.
                </p>
              </div>
            </div>

            {/* Step 3: AI Career Coach */}
            <div
              onClick={() => setActiveTab('chat')}
              className="p-4 rounded-xl border border-white/[0.08] bg-[#0e1424] hover:border-purple-500/40 cursor-pointer transition-all flex items-start gap-3.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white font-['Plus_Jakarta_Sans'] group-hover:text-purple-300 transition-colors">
                    3. AI Career Coach
                  </h3>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Multi-turn strategic coaching grounded in your active resume data.
                </p>
              </div>
            </div>

            {/* Step 4: ATS Readiness */}
            <div
              onClick={() => setActiveTab('analytics')}
              className="p-4 rounded-xl border border-white/[0.08] bg-[#0e1424] hover:border-indigo-500/40 cursor-pointer transition-all flex items-start gap-3.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white font-['Plus_Jakarta_Sans'] group-hover:text-indigo-300 transition-colors">
                    4. ATS Telemetry & Checklist
                  </h3>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Verify word counts, action verb density, and structural compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Triage Checklist */}
        {triageItems.length > 0 && (
          <div className="p-6 rounded-xl border border-white/[0.08] bg-[#0e1424] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Actionable Resume Refinements ({triageItems.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Prioritized by recruiter impact
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {triageItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-white/[0.06] bg-[#131d33] flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={item.onClick}
                    className="w-full justify-center text-xs h-7.5"
                  >
                    {item.actionLabel}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
