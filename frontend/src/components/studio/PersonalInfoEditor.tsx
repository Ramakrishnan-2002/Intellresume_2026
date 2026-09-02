import React, { useState } from 'react';
import { ResumeData } from '../../types';
import { Wand2, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { apiClient } from '../../services/api';

interface PersonalInfoEditorProps {
  data: ResumeData;
  onChange: (field: string, value: string) => void;
  onUpdateTitle: (title: string) => void;
}

export const PersonalInfoEditor: React.FC<PersonalInfoEditorProps> = ({
  data,
  onChange,
  onUpdateTitle,
}) => {
  const info = data.personalInfo;
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestedSummaries, setSuggestedSummaries] = useState<string[] | null>(null);

  const handleOptimizeSummary = async () => {
    if (!info.summary) return;
    setIsOptimizing(true);
    try {
      const resData = await apiClient.optimizeContent({
        text: info.summary,
        sectionType: 'Summary',
        role: data.title,
      });
      if (resData.options && resData.options.length > 0) {
        setSuggestedSummaries(resData.options.map((o) => o.content));
      }
    } catch (err) {
      console.error('Failed to optimize summary:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applySummary = (text: string) => {
    onChange('summary', text);
    setSuggestedSummaries(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
          Target Role & Title
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          The primary engineering title recruiters and ATS filters use to categorize your profile.
        </p>
        <div className="mt-2.5">
          <input
            type="text"
            value={data.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="e.g. Senior Full Stack Software Engineer"
            className="w-full h-9 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.08]">
        <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
          Contact Details
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Essential personal and contact information for recruiter outreach.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">First Name</label>
            <input
              type="text"
              value={info.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              placeholder="Alex"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">Last Name</label>
            <input
              type="text"
              value={info.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder="Chen"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">Email Address</label>
            <input
              type="email"
              value={info.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="alex.chen@example.com"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">Phone</label>
            <input
              type="tel"
              value={info.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[11px] font-mono text-slate-400">Location</label>
            <input
              type="text"
              value={info.location}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder="San Francisco, CA (Open to Remote)"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.08]">
        <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
          Online Presence & Profiles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">Portfolio / Website</label>
            <input
              type="url"
              value={info.website || ''}
              onChange={(e) => onChange('website', e.target.value)}
              placeholder="alexchen.dev"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">LinkedIn Profile</label>
            <input
              type="text"
              value={info.linkedin || ''}
              onChange={(e) => onChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/alexchen"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">GitHub Profile</label>
            <input
              type="text"
              value={info.github || ''}
              onChange={(e) => onChange('github', e.target.value)}
              placeholder="github.com/alexchen"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded-md px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
              Executive Professional Summary
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              A 2-3 sentence overview highlighting your technical domain, scale, and core achievements.
            </p>
          </div>

          <button
            type="button"
            disabled={isOptimizing || !info.summary}
            onClick={handleOptimizeSummary}
            className="h-7 px-2.5 rounded text-[11px] font-semibold bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {isOptimizing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3 text-blue-400" />
            )}
            <span>AI Rewrite</span>
          </button>
        </div>

        <div className="mt-3">
          <textarea
            rows={4}
            value={info.summary}
            onChange={(e) => onChange('summary', e.target.value)}
            placeholder="Senior Full Stack Software Engineer with 8+ years architecting fault-tolerant distributed platforms. Led cloud infrastructure migrations reducing p99 latency by 45%."
            className="w-full p-3 bg-[#0d121c] border border-white/10 rounded-md text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
          />
        </div>

        {/* AI Rewrite Options Drawer / Box */}
        {suggestedSummaries && (
          <div className="mt-3 p-3.5 rounded-lg bg-[#0e1628] border border-blue-500/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Generated Variations
              </span>
              <button
                onClick={() => setSuggestedSummaries(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Dismiss
              </button>
            </div>

            <div className="space-y-2">
              {suggestedSummaries.map((text, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#131d33] border border-white/[0.06] text-xs text-slate-200 flex items-start justify-between gap-3 hover:border-blue-500/40 transition-colors"
                >
                  <p className="leading-relaxed flex-1">{text}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => applySummary(text)}
                    className="h-6 px-2 text-[10px] shrink-0"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply
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
