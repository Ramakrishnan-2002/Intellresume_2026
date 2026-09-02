import React, { useState } from 'react';
import { ResumeData } from '../types';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  Briefcase,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from './ui/Button';
import { apiClient } from '../services/api';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: ResumeData;
  onApplyGeneratedResume: (newResume: ResumeData) => void;
}

const PRESET_ROLES = [
  {
    role: 'Senior Full Stack Engineer',
    desc: 'React 19, TypeScript, Go/Node, Cloud, Microservices',
    exp: 'Senior (5-8 yrs)',
  },
  {
    role: 'AI / Machine Learning Engineer',
    desc: 'Python, LLMs, PyTorch, RAG Pipelines, Vector DBs',
    exp: 'Staff / Lead (7+ yrs)',
  },
  {
    role: 'Cloud & Infrastructure Architect',
    desc: 'Kubernetes, Terraform, AWS/GCP, Distributed Systems',
    exp: 'Principal (8+ yrs)',
  },
  {
    role: 'Staff Frontend Engineer',
    desc: 'Design Systems, WebGL, Next.js, Performance Optimization',
    exp: 'Staff (7+ yrs)',
  },
];

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onApplyGeneratedResume,
}) => {
  const [targetRole, setTargetRole] = useState(currentData.title || 'Senior Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Senior (5-8 years)');
  const [customPrompt, setCustomPrompt] = useState(
    'Highlight high-throughput cloud architectures, 40%+ performance gains, and modern TypeScript/React 19 stack.'
  );
  const [skillsNotes, setSkillsNotes] = useState(
    'TypeScript, React 19, Go, Node.js, Kubernetes, AWS, GraphQL, PostgreSQL'
  );
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const resData = await apiClient.generateResume({
        targetRole,
        experienceLevel,
        prompt: customPrompt,
        skillsNotes,
        jobDescription,
        currentData,
      });

      if (resData.resume) {
        onApplyGeneratedResume(resData.resume);
        onClose();
      } else {
        throw new Error(resData.error || 'No resume data received from generator');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(err.message || 'Failed to generate resume. Please verify backend connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                AI Resume Architect
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Generate a full structured profile tailored via Gemini 3.6 Flash
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

        {/* Modal Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] space-y-5">
          {errorMsg && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset Roles */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono text-slate-400">
              Select Architecture Archetype
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_ROLES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTargetRole(p.role);
                    setSkillsNotes(p.desc);
                    setExperienceLevel(p.exp);
                  }}
                  className={`text-left p-3 rounded border text-xs transition-colors cursor-pointer ${
                    targetRole === p.role
                      ? 'bg-blue-950/60 border-blue-500/40 text-white'
                      : 'bg-[#0d121c] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-slate-100">{p.role}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Role & Seniority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-slate-400">
                Target Role Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Senior Full Stack Software Engineer"
                className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-slate-400">
                Seniority Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded px-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option>Junior (1-3 years)</option>
                <option>Mid-Level (3-5 years)</option>
                <option>Senior (5-8 years)</option>
                <option>Staff / Principal (8+ years)</option>
                <option>Engineering Leader / Director</option>
              </select>
            </div>
          </div>

          {/* Skills Keywords */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">
              Primary Skills & Tech Stack
            </label>
            <input
              type="text"
              value={skillsNotes}
              onChange={(e) => setSkillsNotes(e.target.value)}
              placeholder="TypeScript, React, Go, Docker, AWS, Kubernetes"
              className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Architecture Directives */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">
              Custom Directives & Accomplishments (Optional)
            </label>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on high-throughput distributed systems and p99 latency..."
              className="w-full p-2.5 bg-[#0d121c] border border-white/10 rounded text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
            />
          </div>

          {/* Optional Job Description */}
          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-400">
              Target Job Specification (Optional)
            </label>
            <textarea
              rows={2}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste specific job requirements to tailor keyword alignment..."
              className="w-full p-2.5 bg-[#0d121c] border border-white/10 rounded text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0c1018] border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">
            Replaces active document state
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isGenerating || !targetRole.trim()}
              onClick={handleGenerate}
              icon={
                isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )
              }
            >
              {isGenerating ? 'Generating Profile...' : 'Generate Resume'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
