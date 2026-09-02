import React from 'react';
import { ResumeData } from '../types';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  FileText,
  Percent,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface AnalyticsViewProps {
  data: ResumeData;
  onOpenJDMatcher: () => void;
}

const ACTION_VERB_REGEX =
  /^(Architected|Led|Engineered|Spearheaded|Delivered|Designed|Developed|Optimized|Scaled|Accelerated|Automated|Built|Orchestrated|Reduced|Increased|Mentored|Formulated|Deployed|Initiated|Published)\b/i;

const NUMBER_REGEX = /\d+%|\$\d+|\d+\+|\d+x|\b\d+\b/;

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data, onOpenJDMatcher }) => {
  // Real client-side derived analytics
  const allBullets =
    data.experience?.flatMap((e) => e.bullets || []) || [];
  const totalBullets = allBullets.length;

  const quantifiedBullets = allBullets.filter((b) => NUMBER_REGEX.test(b)).length;
  const quantifiedPercent =
    totalBullets > 0 ? Math.round((quantifiedBullets / totalBullets) * 100) : 0;

  const actionVerbBullets = allBullets.filter((b) => ACTION_VERB_REGEX.test(b.trim())).length;
  const actionVerbPercent =
    totalBullets > 0 ? Math.round((actionVerbBullets / totalBullets) * 100) : 0;

  // Word count
  const summaryWords = (data.personalInfo?.summary || '').split(/\s+/).filter(Boolean).length;
  const experienceWords = allBullets.join(' ').split(/\s+/).filter(Boolean).length;
  const projectWords = (data.projects || [])
    .map((p) => p.description || '')
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const totalWords = summaryWords + experienceWords + projectWords;

  // Skills counts
  const languagesCount = data.skills?.languages?.length || 0;
  const frameworksCount = data.skills?.frameworks?.length || 0;
  const toolsCount = data.skills?.tools?.length || 0;
  const cloudCount = data.skills?.cloud?.length || 0;
  const totalSkills = languagesCount + frameworksCount + toolsCount + cloudCount;

  // Structural checks
  const checks = [
    {
      label: 'Contact Details & Location',
      passed: !!(data.personalInfo?.email && data.personalInfo?.location),
      desc: data.personalInfo?.email ? data.personalInfo.email : 'Missing email or location',
    },
    {
      label: 'Executive Summary Depth',
      passed: summaryWords >= 25,
      desc: `${summaryWords} words (Target: 30-60 words)`,
    },
    {
      label: 'Experience Item Count',
      passed: (data.experience?.length || 0) >= 2,
      desc: `${data.experience?.length || 0} positions documented`,
    },
    {
      label: 'Measurable Achievements Ratio',
      passed: quantifiedPercent >= 50,
      desc: `${quantifiedBullets} of ${totalBullets} bullets (${quantifiedPercent}%) contain metrics`,
    },
    {
      label: 'Action Verb Openers',
      passed: actionVerbPercent >= 70,
      desc: `${actionVerbBullets} of ${totalBullets} bullets (${actionVerbPercent}%) start with strong action verbs`,
    },
    {
      label: 'Technical Skill Breadth',
      passed: totalSkills >= 10,
      desc: `${totalSkills} total skills across 4 categories`,
    },
    {
      label: 'Education Section',
      passed: (data.education?.length || 0) >= 1,
      desc: `${data.education?.length || 0} degree credentials listed`,
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const structuralScore = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#080c14] text-[#f8fafc] font-sans selection:bg-blue-600/30">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                ATS Readiness & Keyword Audit
              </span>
              <Badge variant="blue">Deterministic Telemetry</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Honest structural analysis derived directly from your active resume document.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenJDMatcher}
            icon={<Target className="w-3.5 h-3.5 text-blue-400" />}
          >
            Target Job Description
          </Button>
        </div>

        {/* Core Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#111724] border border-white/[0.08] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Structural Score
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400">
              {structuralScore}%
            </div>
            <p className="text-[11px] text-slate-400">
              {passedCount} of {checks.length} structural criteria satisfied.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#111724] border border-white/[0.08] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Total Word Count
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {totalWords}
            </div>
            <p className="text-[11px] text-slate-400">
              {totalWords >= 350 && totalWords <= 650
                ? 'Optimal length for a 1-page technical resume.'
                : totalWords < 350
                ? 'Brief profile; consider adding more detail.'
                : 'Long format; risk of spanning to page 2.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#111724] border border-white/[0.08] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Quantified Impact
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400">
              {quantifiedPercent}%
            </div>
            <p className="text-[11px] text-slate-400">
              {quantifiedBullets} of {totalBullets} bullets contain numbers, percentages, or scale metrics.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#111724] border border-white/[0.08] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Action Verb Density
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400">
              {actionVerbPercent}%
            </div>
            <p className="text-[11px] text-slate-400">
              {actionVerbBullets} of {totalBullets} bullets begin with recognized executive action verbs.
            </p>
          </div>
        </div>

        {/* Technical Keyword Distribution */}
        <section className="p-5 rounded-lg bg-[#111724] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Technical Keyword Matrix ({totalSkills} Keywords)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribution across categories targeted by technical search queries.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Inventory</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 p-3 rounded bg-[#0d121c] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400">Languages ({languagesCount})</span>
              <div className="text-xs text-slate-200 font-mono truncate">
                {data.skills?.languages?.join(', ') || 'None specified'}
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded bg-[#0d121c] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400">Frameworks ({frameworksCount})</span>
              <div className="text-xs text-slate-200 font-mono truncate">
                {data.skills?.frameworks?.join(', ') || 'None specified'}
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded bg-[#0d121c] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400">Tools ({toolsCount})</span>
              <div className="text-xs text-slate-200 font-mono truncate">
                {data.skills?.tools?.join(', ') || 'None specified'}
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded bg-[#0d121c] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400">Cloud & Infra ({cloudCount})</span>
              <div className="text-xs text-slate-200 font-mono truncate">
                {data.skills?.cloud?.join(', ') || 'None specified'}
              </div>
            </div>
          </div>
        </section>

        {/* Structural Audit Checklist */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              ATS Compliance Verification Checklist
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {passedCount} / {checks.length} Checks Passed
            </span>
          </div>

          <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-[#111724]">
            {checks.map((check, idx) => (
              <div
                key={idx}
                className="p-3.5 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200">{check.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 truncate text-right">
                  {check.desc}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
