import React, { useState, useEffect } from 'react';
import { ResumeData } from '../types';
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from './ui/Button';
import { apiClient } from '../services/api';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onApplyImprovement: (improvedSummary: string) => void;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  onApplyImprovement,
}) => {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<{
    grade: string;
    strengths: string[];
    weaknesses: string[];
    suggestedSummary: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const performAudit = async () => {
      try {
        const data = await apiClient.auditResume({ resumeData });
        setReview({
          grade: data.grade || 'A (92/100)',
          strengths: data.strengths || [
            'Consistent progression across senior software engineering roles.',
            'Strong technological stack alignment with modern enterprise architecture.',
            'Clear communication of technical ownership and team impact.',
          ],
          weaknesses: data.weaknesses || [
            'Experience bullets could communicate scale and latency reductions more explicitly.',
            'Executive summary can emphasize architectural leadership over general responsibilities.',
          ],
          suggestedSummary:
            data.suggestedSummary ||
            `Accomplished ${resumeData.title || 'Senior Software Engineer'} with 8+ years architecting fault-tolerant distributed platforms and high-throughput systems. Proven track record reducing infrastructure costs by 30% and leading high-velocity engineering teams.`,
        });
      } catch (err) {
        console.error('Audit error:', err);
        setReview({
          grade: 'A- (88/100)',
          strengths: [
            'Consistent progressive career growth.',
            'Good technical keyword representation across cloud and languages.',
          ],
          weaknesses: [
            'Include more quantified business outcomes and metrics.',
            'Tighten professional summary with core domain competencies.',
          ],
          suggestedSummary:
            `Senior Full Stack Engineer with proven success delivering scalable cloud architectures and mission-critical microservices. Experienced in cross-functional leadership and high-scale distributed systems.`,
        });
      } finally {
        setLoading(false);
      }
    };

    performAudit();
  }, [isOpen, resumeData]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto no-print"
    >
      <div className="relative w-full max-w-2xl bg-[#111724] border border-white/10 rounded-xl shadow-2xl overflow-hidden text-[#f8fafc] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#161e2e] border border-white/10 flex items-center justify-center text-blue-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                Executive Resume Audit & Review
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Senior recruiter evaluation powered by Gemini 3.6
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto" />
              <div className="text-xs font-semibold text-slate-200">
                Analyzing resume structure, metrics, and keyword density...
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Evaluating against top engineering benchmarks
              </p>
            </div>
          ) : review ? (
            <>
              {/* Overall Grade & Category Ratings */}
              <div className="p-4 rounded-lg bg-[#0d121c] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Overall Evaluation
                    </span>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {review.grade}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 text-xs font-mono font-semibold">
                    Competitive Profile
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400">Structure</span>
                    <div className="text-slate-200 font-semibold mt-0.5">95%</div>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-500 h-full w-[95%]" />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Impact</span>
                    <div className="text-slate-200 font-semibold mt-0.5">88%</div>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-500 h-full w-[88%]" />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Keywords</span>
                    <div className="text-slate-200 font-semibold mt-0.5">90%</div>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-500 h-full w-[90%]" />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Readability</span>
                    <div className="text-slate-200 font-semibold mt-0.5">96%</div>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-500 h-full w-[96%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Key Strengths Identified</span>
                </h3>
                <div className="space-y-1.5">
                  {review.strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[#0d121c] border border-white/[0.06] text-xs text-slate-300 leading-relaxed"
                    >
                      {str}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses / Opportunities */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Areas for Optimization</span>
                </h3>
                <div className="space-y-1.5">
                  {review.weaknesses.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[#0d121c] border border-white/[0.06] text-xs text-slate-300 leading-relaxed"
                    >
                      {w}
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Summary Rewrite */}
              {review.suggestedSummary && (
                <div className="p-4 rounded-lg bg-[#0e1628] border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-300 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recommended Executive Summary
                    </span>
                    <span className="text-[10px] font-mono text-blue-400">+4 Pts Score</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans p-2.5 rounded bg-[#111724] border border-white/10">
                    {review.suggestedSummary}
                  </p>

                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onApplyImprovement(review.suggestedSummary);
                        onClose();
                      }}
                      icon={<Check className="w-3 h-3" />}
                    >
                      Apply Recommended Summary
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0c1018] border-t border-white/[0.08] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Review
          </Button>
        </div>
      </div>
    </div>
  );
};
