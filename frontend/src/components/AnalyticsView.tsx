import React from 'react';
import { ResumeData } from '../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  FileCheck,
} from 'lucide-react';

interface AnalyticsViewProps {
  data: ResumeData;
  onOpenJDMatcher: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data, onOpenJDMatcher }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#090D16] text-[#dfe2f1]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Plus_Jakarta_Sans']">
              ATS Telemetry &amp; Keyword Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Real-time deep scan of resume format, keyword distribution, and impact strength.
            </p>
          </div>
          <button
            onClick={onOpenJDMatcher}
            className="btn-spring bg-[#4edea3] text-[#003824] font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-[#4edea3]/20"
          >
            <Target className="w-4 h-4" />
            <span>Re-Scan Against Job Description</span>
          </button>
        </div>

        {/* High Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 block uppercase">
                  ATS Readability Index
                </span>
                <span className="text-3xl font-extrabold text-[#4edea3] font-mono mt-1 block">
                  98 / 100
                </span>
              </div>
              <div className="p-3 bg-[#4edea3]/10 text-[#4edea3] rounded-xl border border-[#4edea3]/20">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pristine single-column hierarchy with clean semantic headings. 100% parseable by Taleo,
              Workday, and Greenhouse.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 block uppercase">
                  Quantified Impact Metric
                </span>
                <span className="text-3xl font-extrabold text-[#c0c1ff] font-mono mt-1 block">
                  83%
                </span>
              </div>
              <div className="p-3 bg-[#c0c1ff]/10 text-[#c0c1ff] rounded-xl border border-[#c0c1ff]/20">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              5 of 6 bullet points contain quantifiable numbers, percentages, or scale indicators.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono text-slate-400 block uppercase">
                  Action Verb Density
                </span>
                <span className="text-3xl font-extrabold text-[#ffb783] font-mono mt-1 block">
                  Top 5%
                </span>
              </div>
              <div className="p-3 bg-[#ffb783]/10 text-[#ffb783] rounded-xl border border-[#ffb783]/20">
                <Zap className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leading verbs: <em>Architected, Engineered, Spearheaded, Optimized, Deployed</em>.
            </p>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Keyword Category Breakdown */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl">
            <h3 className="font-bold text-base text-slate-100 mb-4 font-['Plus_Jakarta_Sans']">
              Skill Density &amp; Market Alignment
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Frontend Ecosystem &amp; UI Architecture</span>
                  <span className="font-mono text-[#4edea3]">96% Match</span>
                </div>
                <div className="w-full bg-[#1c1f2a] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Distributed State &amp; WebGL 3D</span>
                  <span className="font-mono text-[#c0c1ff]">92% Match</span>
                </div>
                <div className="w-full bg-[#1c1f2a] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#c0c1ff] h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">Cloud Infrastructure &amp; CI/CD</span>
                  <span className="font-mono text-[#ffb783]">84% Match</span>
                </div>
                <div className="w-full bg-[#1c1f2a] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#ffb783] h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-medium">System Design &amp; Team Mentorship</span>
                  <span className="font-mono text-emerald-400">89% Match</span>
                </div>
                <div className="w-full bg-[#1c1f2a] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '89%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations Checklist */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl">
            <h3 className="font-bold text-base text-slate-100 mb-4 font-['Plus_Jakarta_Sans']">
              AI Priority Checklist
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex gap-3 items-start p-3 bg-[#1c1f2a] rounded-lg border border-emerald-800/30">
                <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">High-Impact Verb Variety</div>
                  <div className="text-slate-400 mt-0.5">
                    No repeated passive phrases detected in your recent roles.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-[#1c1f2a] rounded-lg border border-emerald-800/30">
                <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Length Optimization</div>
                  <div className="text-slate-400 mt-0.5">
                    Total word count is 482 words, strictly within the high-retention 1-page standard.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-[#1c1f2a] rounded-lg border border-amber-800/30">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Include Web Vitals Metric</div>
                  <div className="text-slate-400 mt-0.5">
                    Adding specific Core Web Vitals figures (e.g. LCP under 1.2s) will boost Senior Staff match by +5%.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
