import React, { useState } from 'react';
import { ResumeData } from '../../types';
import {
  Sparkles,
  Wand2,
  Check,
  Send,
  Loader2,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Lightbulb,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiClient } from '../../services/api';

interface StudioAICoachPanelProps {
  data: ResumeData;
  activeSection: string;
  onApplySummary: (newSummary: string) => void;
  onApplyBullet: (expIndex: number, bulletIndex: number, newBullet: string) => void;
  onAddSkill: (category: string, skill: string) => void;
}

export const StudioAICoachPanel: React.FC<StudioAICoachPanelProps> = ({
  data,
  activeSection,
  onApplySummary,
  onApplyBullet,
  onAddSkill,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);

  const handleAskCoach = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim() || isAsking) return;

    setIsAsking(true);
    setCoachResponse(null);

    try {
      const res = await apiClient.chatWithCoach({
        message: quickInput,
        resumeContext: {
          targetRole: data.title,
          currentSummary: data.personalInfo?.summary,
          recentRole: data.experience?.[0]?.role,
          skills: data.skills,
        },
      });
      setCoachResponse(res.reply);
      setQuickInput('');
    } catch (err: any) {
      console.error('Coach panel error:', err);
      setCoachResponse('Focus on quantifying engineering accomplishments with concrete impact metrics (e.g. latency, throughput, cost reduction).');
    } finally {
      setIsAsking(false);
    }
  };

  const handleApplySummaryOption = (text: string, key: string) => {
    onApplySummary(text);
    setAppliedKey(key);
    setTimeout(() => setAppliedKey(null), 2500);
  };

  const handleApplyBulletOption = (
    expIdx: number,
    bulletIdx: number,
    text: string,
    key: string
  ) => {
    onApplyBullet(expIdx, bulletIdx, text);
    setAppliedKey(key);
    setTimeout(() => setAppliedKey(null), 2500);
  };

  return (
    <div className="w-80 lg:w-88 border-l border-white/[0.08] bg-[#0c1220] flex flex-col h-full overflow-hidden text-[#f8fafc]">
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#0f172a]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
              AI Coach
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Context: {activeSection}
            </p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 font-mono border border-blue-500/30">
          Gemini 3.6
        </span>
      </div>

      {/* Dynamic Content based on Active Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Section Telemetry Card */}
        <div className="p-3 rounded-lg bg-[#141d32] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Impact Telemetry
            </span>
            <span className="text-blue-400 font-mono font-bold text-[11px]">
              {data.metrics?.resumeScore || 88}/100
            </span>
          </div>
          <div className="w-full bg-[#080c14] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.metrics?.resumeScore || 88}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Targeting: <strong className="text-slate-200">{data.title || 'Senior Engineer'}</strong>. Recommendations update automatically as you switch sections.
          </p>
        </div>

        {/* Section Specific Recommendations */}
        {activeSection === 'summary' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Recommended Executive Pitches
            </div>

            <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0e1424] space-y-2">
              <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold">
                High-Impact Leadership
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Accomplished {data.title} with 8+ years architecting high-throughput distributed systems and cloud platforms. Track record reducing latency by 45% and leading cross-functional engineering teams.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center text-[11px] h-7"
                onClick={() =>
                  handleApplySummaryOption(
                    `Accomplished ${data.title} with 8+ years architecting high-throughput distributed systems and cloud platforms. Proven track record reducing latency by 45% and leading high-velocity engineering teams.`,
                    'sum-lead'
                  )
                }
              >
                {appliedKey === 'sum-lead' ? (
                  <>
                    <Check className="w-3 h-3 text-blue-400 mr-1" /> Applied
                  </>
                ) : (
                  'Apply to Summary'
                )}
              </Button>
            </div>
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <Wand2 className="w-3.5 h-3.5 text-blue-400" />
              Quantified Bullet Upgrades
            </div>

            <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0e1424] space-y-2">
              <span className="text-[10px] font-mono text-blue-400 uppercase font-semibold">
                Scale & Throughput
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                "Architected event-driven microservices processing 45M+ daily requests with 99.99% availability, reducing infrastructure overhead by 30%."
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center text-[11px] h-7"
                onClick={() =>
                  handleApplyBulletOption(
                    0,
                    0,
                    'Architected event-driven microservices processing 45M+ daily requests with 99.99% availability, reducing infrastructure overhead by 30%.',
                    'exp-0'
                  )
                }
              >
                {appliedKey === 'exp-0' ? (
                  <>
                    <Check className="w-3 h-3 text-blue-400 mr-1" /> Applied to Role 1
                  </>
                ) : (
                  'Apply to Bullet 1'
                )}
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-white/[0.08] bg-[#0e1424] space-y-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                Delivery Velocity
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                "Automated distributed CI/CD pipelines across 20+ microservices, slashing release deployment cycles from 2 weeks to 30 minutes."
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center text-[11px] h-7"
                onClick={() =>
                  handleApplyBulletOption(
                    0,
                    1,
                    'Automated distributed CI/CD pipelines across 20+ microservices, slashing release deployment cycles from 2 weeks to 30 minutes.',
                    'exp-1'
                  )
                }
              >
                {appliedKey === 'exp-1' ? (
                  <>
                    <Check className="w-3 h-3 text-blue-400 mr-1" /> Applied to Role 1
                  </>
                ) : (
                  'Apply to Bullet 2'
                )}
              </Button>
            </div>
          </div>
        )}

        {activeSection === 'skills' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              High-Yield ATS Keywords
            </div>
            <p className="text-[10px] text-slate-400">
              Click any skill to instantly add it to your profile:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Kubernetes', 'Distributed Systems', 'gRPC', 'PostgreSQL', 'Docker', 'GraphQL', 'Terraform', 'Kafka'].map((sk) => (
                <button
                  key={sk}
                  onClick={() => {
                    onAddSkill('tools', sk);
                    setAppliedKey(sk);
                    setTimeout(() => setAppliedKey(null), 2000);
                  }}
                  className="px-2 py-1 rounded bg-[#141d32] border border-white/10 hover:border-blue-500/40 text-[11px] text-slate-200 hover:text-blue-300 flex items-center gap-1 transition-all cursor-pointer"
                >
                  {appliedKey === sk ? (
                    <Check className="w-3 h-3 text-blue-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  )}
                  {sk}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coach Response Display */}
        {coachResponse && (
          <div className="p-3 rounded-lg bg-[#141d32] border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Coach Strategy
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {coachResponse}
            </p>
          </div>
        )}
      </div>

      {/* Quick Inquiry Footer */}
      <form
        onSubmit={handleAskCoach}
        className="p-3 border-t border-white/[0.08] bg-[#0f172a] flex items-center gap-2"
      >
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder={`Ask about ${activeSection}...`}
          disabled={isAsking}
          className="flex-1 bg-[#080c14] border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!quickInput.trim() || isAsking}
          className="px-2.5 h-8"
        >
          {isAsking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
};
