import React from 'react';
import { ResumeData, ActivityItem, ActiveTab } from '../types';
import {
  Plus,
  Target,
  Bot,
  TrendingUp,
  Eye,
  Coins,
  Sparkles,
  FileText,
  UploadCloud,
  ArrowRight,
  Clock,
  Wand2,
} from 'lucide-react';

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
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#090D16] text-[#dfe2f1]">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Welcome & Actions (Bento Style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Welcome Bento Card */}
          <div className="col-span-1 md:col-span-2 bg-[#111827] border border-[#1F2937] hover:border-slate-700/60 rounded-xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all shadow-xl">
            <div className="z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#c0c1ff] mb-2 font-['Plus_Jakarta_Sans']">
                Welcome back, Architect
              </h2>
              <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                Your AI telemetry and PDF generator are online. Backend Gemini intelligence will structure and tailor your resume for any technical role.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-8 z-10">
              <button
                onClick={onOpenAIGenerator}
                className="btn-spring bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Generate Resume with AI</span>
              </button>

              <button
                onClick={() => {
                  onNewResume();
                  setActiveTab('studio');
                }}
                className="btn-spring bg-[#1c1f2a] border border-[#3c4a42]/50 hover:border-[#4edea3]/50 text-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-[#262a35]"
              >
                <Plus className="w-4 h-4 text-[#4edea3]" />
                <span>New Workspace</span>
              </button>

              <button
                onClick={onOpenJDMatcher}
                className="btn-spring bg-[#1c1f2a] border border-[#3c4a42]/50 hover:border-[#c0c1ff]/50 text-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-[#262a35]"
              >
                <Target className="w-4 h-4 text-[#c0c1ff]" />
                <span>Match Job Description</span>
              </button>
            </div>

            {/* Abstract Gradient Glow Decoration */}
            <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-600/10 via-purple-600/5 to-transparent pointer-events-none"></div>
          </div>

          {/* AI Advisor Bento Card */}
          <div
            onClick={() => setActiveTab('chat')}
            className="bg-[#111827] border border-[#1F2937] hover:border-[#4edea3]/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group btn-spring shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(78,222,163,0.3)] transition-all">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-['Plus_Jakarta_Sans'] flex items-center gap-1.5">
              <span>Consult AI Assistant</span>
              <ArrowRight className="w-4 h-4 text-[#4edea3] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-slate-400 mt-1 text-xs">Real-time prompt engineering &amp; career intelligence</p>
          </div>
        </section>

        {/* Telemetry Overview Metrics */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Telemetry Overview
            </h3>
            <span className="text-[11px] font-mono text-[#4edea3] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live ATS Synced
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Resume Score */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-xs font-medium">Resume Score</span>
                  <TrendingUp className="w-4 h-4 text-[#4edea3]" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-extrabold text-slate-100">
                    {data.metrics.resumeScore}
                  </span>
                  <span className="font-mono text-xs text-slate-500">/100</span>
                </div>
              </div>
              <div className="mt-4 bg-[#1c1f2a] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#4edea3] h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.metrics.resumeScore}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 2: JD Match Rate */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-xs font-medium">JD Match Rate</span>
                  <Target className="w-4 h-4 text-[#c0c1ff]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-extrabold text-[#c0c1ff]">
                    {data.metrics.jdMatchRate}%
                  </span>
                  <span className="font-mono text-[11px] text-[#4edea3] font-bold">+4%</span>
                </div>
              </div>
              <div className="mt-4 bg-[#1c1f2a] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#c0c1ff] h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.metrics.jdMatchRate}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 3: Profile Views */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-xs font-medium">Profile Views</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-extrabold text-slate-100">
                    {data.metrics.profileViews.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <span className="inline-block bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  High Traffic
                </span>
              </div>
            </div>

            {/* Metric 4: AI Credits */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-xs font-medium">AI Intelligence</span>
                  <Coins className="w-4 h-4 text-[#ffb783]" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-extrabold text-slate-100">
                    {data.metrics.aiCredits}
                  </span>
                  <span className="font-mono text-xs text-slate-500">Credits</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="font-mono text-[11px] text-[#4edea3]">
                  Unlimited Pro Access
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Activity Feed Timeline */}
        <section className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-[#1F2937] flex justify-between items-center">
            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
              Activity Timeline
            </h3>
            <span className="text-xs font-mono text-slate-500">Live Sync</span>
          </div>

          <div className="p-6 space-y-6">
            {activities.map((item, idx) => (
              <div key={item.id} className="flex gap-4 relative">
                {idx < activities.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-[#1F2937]"></div>
                )}

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border ${
                    item.type === 'rewrite'
                      ? 'bg-[#4edea3]/15 border-[#4edea3]/40 text-[#4edea3]'
                      : 'bg-[#1c1f2a] border-[#3c4a42]/40 text-slate-400'
                  }`}
                >
                  {item.type === 'rewrite' && <Sparkles className="w-4 h-4" />}
                  {item.type === 'generate' && <FileText className="w-4 h-4" />}
                  {item.type === 'parse' && <UploadCloud className="w-4 h-4" />}
                  {item.type === 'match' && <Target className="w-4 h-4" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1 flex-wrap gap-2">
                    <h4 className="font-semibold text-sm text-slate-200 font-['Plus_Jakarta_Sans']">
                      {item.title}
                    </h4>
                    <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mb-2">{item.description}</p>

                  {item.quote && (
                    <div className="bg-[#1c1f2a] rounded-lg p-3 border border-[#1F2937] border-l-2 border-l-[#4edea3] text-xs font-mono text-slate-300">
                      {item.quote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
