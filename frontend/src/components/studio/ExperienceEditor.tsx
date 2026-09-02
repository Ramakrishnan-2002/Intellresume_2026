import React, { useState } from 'react';
import { ExperienceItem } from '../../types';
import {
  Plus,
  Trash2,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiClient } from '../../services/api';

interface ExperienceEditorProps {
  experience: ExperienceItem[];
  targetRole: string;
  onChange: (updated: ExperienceItem[]) => void;
  onIncrementScore?: (delta: number) => void;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  experience,
  targetRole,
  onChange,
  onIncrementScore,
}) => {
  const [optimizingKey, setOptimizingKey] = useState<string | null>(null);
  const [suggestedBullets, setSuggestedBullets] = useState<{
    key: string;
    options: { tag: string; content: string }[];
  } | null>(null);

  const handleFieldChange = (idx: number, field: keyof ExperienceItem, value: any) => {
    const updated = [...experience];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const handleBulletChange = (expIdx: number, bulletIdx: number, value: string) => {
    const updated = [...experience];
    updated[expIdx].bullets[bulletIdx] = value;
    onChange(updated);
  };

  const handleAddBullet = (expIdx: number) => {
    const updated = [...experience];
    updated[expIdx].bullets.push('Architected microservices subsystem reducing p99 latency by 35%.');
    onChange(updated);
  };

  const handleRemoveBullet = (expIdx: number, bulletIdx: number) => {
    const updated = [...experience];
    updated[expIdx].bullets.splice(bulletIdx, 1);
    onChange(updated);
  };

  const handleAddPosition = () => {
    const newPos: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: 'Senior Software Engineer',
      company: 'Tech Enterprise Corp',
      location: 'San Francisco, CA',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      bullets: [
        'Spearheaded end-to-end cloud platform architecture serving 2M+ active sessions daily.',
        'Mentored 6 engineers across distributed systems and modern TypeScript methodologies.',
      ],
    };
    onChange([newPos, ...experience]);
  };

  const handleRemovePosition = (idx: number) => {
    const updated = [...experience];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const handleOptimizeBullet = async (expIdx: number, bulletIdx: number) => {
    const key = `${expIdx}-${bulletIdx}`;
    setOptimizingKey(key);
    const text = experience[expIdx].bullets[bulletIdx];

    try {
      const data = await apiClient.optimizeContent({
        text,
        sectionType: 'Experience',
        role: targetRole,
      });
      if (data.options && data.options.length > 0) {
        setSuggestedBullets({ key, options: data.options });
      }
    } catch (err) {
      console.error('Failed to optimize bullet:', err);
    } finally {
      setOptimizingKey(null);
    }
  };

  const applyBulletOption = (expIdx: number, bulletIdx: number, chosenText: string) => {
    handleBulletChange(expIdx, bulletIdx, chosenText);
    setSuggestedBullets(null);
    if (onIncrementScore) onIncrementScore(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
            Professional Experience ({experience.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Document your career positions with measurable achievements and technical scale.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPosition}
          className="h-7 px-2.5 rounded text-[11px] font-semibold bg-[#141b27] hover:bg-[#1a2333] text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Position</span>
        </button>
      </div>

      <div className="space-y-6">
        {experience.map((pos, expIdx) => (
          <div
            key={pos.id || expIdx}
            className="p-4 rounded-lg bg-[#0d121c] border border-white/[0.08] space-y-4"
          >
            {/* Position Header Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white font-mono">
                  0{expIdx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {pos.role || 'Untitled Role'}
                </span>
                {pos.company && (
                  <span className="text-xs text-slate-400">@ {pos.company}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemovePosition(expIdx)}
                className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                title="Delete this role"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Position Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Job Title / Role</label>
                <input
                  type="text"
                  value={pos.role}
                  onChange={(e) => handleFieldChange(expIdx, 'role', e.target.value)}
                  placeholder="Staff Software Engineer"
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Company / Organization</label>
                <input
                  type="text"
                  value={pos.company}
                  onChange={(e) => handleFieldChange(expIdx, 'company', e.target.value)}
                  placeholder="Stripe, Inc."
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Location</label>
                <input
                  type="text"
                  value={pos.location || ''}
                  onChange={(e) => handleFieldChange(expIdx, 'location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400">Start Date</label>
                  <input
                    type="text"
                    value={pos.startDate}
                    onChange={(e) => handleFieldChange(expIdx, 'startDate', e.target.value)}
                    placeholder="2021"
                    className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-slate-400">End Date</label>
                  <input
                    type="text"
                    value={pos.endDate}
                    onChange={(e) => handleFieldChange(expIdx, 'endDate', e.target.value)}
                    placeholder="Present"
                    className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bullets List */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-slate-300">
                  Key Achievements & Impact ({pos.bullets.length})
                </span>
                <button
                  type="button"
                  onClick={() => handleAddBullet(expIdx)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Bullet</span>
                </button>
              </div>

              <div className="space-y-2">
                {pos.bullets.map((bullet, bulletIdx) => {
                  const key = `${expIdx}-${bulletIdx}`;
                  const isOptimizing = optimizingKey === key;
                  const suggestions =
                    suggestedBullets?.key === key ? suggestedBullets.options : null;

                  return (
                    <div key={bulletIdx} className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 font-mono text-xs mt-2">•</span>
                        <textarea
                          rows={2}
                          value={bullet}
                          onChange={(e) =>
                            handleBulletChange(expIdx, bulletIdx, e.target.value)
                          }
                          placeholder="Action verb + technical accomplishment + measurable impact"
                          className="flex-1 p-2 bg-[#111724] border border-white/10 rounded text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                        />

                        <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            disabled={isOptimizing || !bullet}
                            onClick={() => handleOptimizeBullet(expIdx, bulletIdx)}
                            className="h-7 w-7 rounded bg-[#161e2e] hover:bg-[#1f2a40] text-blue-400 border border-white/10 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                            title="AI rewrite with quantifiable impact"
                          >
                            {isOptimizing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Wand2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveBullet(expIdx, bulletIdx)}
                            className="h-7 w-7 rounded text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete bullet"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Suggestions comparison drawer */}
                      {suggestions && (
                        <div className="ml-4 p-3 rounded bg-[#0e1628] border border-blue-500/30 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between text-[11px] font-mono text-blue-300">
                            <span className="flex items-center gap-1 font-semibold">
                              <Sparkles className="w-3 h-3" />
                              Choose Optimized Variant
                            </span>
                            <button
                              onClick={() => setSuggestedBullets(null)}
                              className="text-slate-400 hover:text-white"
                            >
                              Dismiss
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {suggestions.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className="p-2 rounded bg-[#131d33] border border-white/[0.06] text-xs text-slate-200 flex items-start justify-between gap-2 hover:border-blue-500/40"
                              >
                                <div className="flex-1">
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 mr-2 border border-blue-500/30">
                                    {opt.tag || `Option ${optIdx + 1}`}
                                  </span>
                                  <span className="leading-relaxed">{opt.content}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    applyBulletOption(expIdx, bulletIdx, opt.content)
                                  }
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  Apply
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
