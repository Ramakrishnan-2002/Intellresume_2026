import React, { useState } from 'react';
import { ResumeData } from '../types';
import {
  X,
  Sparkles,
  Bot,
  Wand2,
  Check,
  Briefcase,
  Layers,
  FileCode,
  FileText,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    desc: 'Python, LLMs, LangChain, PyTorch, RAG Pipelines',
    exp: 'Staff / Lead (7+ yrs)',
  },
  {
    role: 'Cloud & DevOps Architect',
    desc: 'Kubernetes, Terraform, AWS/GCP, Distributed Systems',
    exp: 'Principal (8+ yrs)',
  },
  {
    role: 'Frontend System Architect',
    desc: 'Three.js, WebGL, Design Systems, Next.js, Performance',
    exp: 'Senior (6+ yrs)',
  },
  {
    role: 'Technical Product & Engineering Lead',
    desc: 'System Design, Team Mentorship, Roadmaps, CI/CD',
    exp: 'Lead (8+ yrs)',
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
  const [skillsNotes, setSkillsNotes] = useState('TypeScript, React 19, Go, Node.js, Kubernetes, AWS/GCP, GraphQL, Redis');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          experienceLevel,
          prompt: customPrompt,
          skillsNotes,
          jobDescription,
          currentData,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned error during AI resume generation');
      }

      const resData = await res.json();
      if (resData.resume) {
        onApplyGeneratedResume(resData.resume);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4edea3', '#60a5fa', '#c084fc'],
        });
        onClose();
      } else {
        throw new Error('Invalid resume data structure received');
      }
    } catch (err: any) {
      console.error('Failed to generate resume:', err);
      setErrorMsg(err.message || 'Failed to generate resume from backend AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto no-print animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-[#1F2937] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative text-[#dfe2f1]">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-[#1c1f2a] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-600/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3] shadow-[0_0_20px_rgba(78,222,163,0.2)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-slate-100 flex items-center gap-2">
              <span>AI Resume &amp; PDF Data Generator</span>
            </h2>
            <p className="text-xs text-slate-400">
              Generates a complete structured, high-impact resume on the backend. Fully editable in the 3D Studio.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Presets Row */}
        <div className="mb-5">
          <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-2">
            Fast Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_ROLES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTargetRole(preset.role);
                  setSkillsNotes(preset.desc);
                  setExperienceLevel(preset.exp);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                  targetRole === preset.role
                    ? 'bg-[#4edea3]/10 border-[#4edea3] text-slate-100 shadow-[0_0_15px_rgba(78,222,163,0.15)]'
                    : 'bg-[#1c1f2a] border-[#1F2937] hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>{preset.role}</span>
                  {targetRole === preset.role && <Check className="w-3.5 h-3.5 text-[#4edea3]" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          {/* Target Role & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1">
                Target Role / Title
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Staff Full Stack Engineer"
                className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
              >
                <option value="Entry / Junior (1-3 years)">Entry / Junior (1-3 years)</option>
                <option value="Mid-Level (3-5 years)">Mid-Level (3-5 years)</option>
                <option value="Senior (5-8 years)">Senior (5-8 years)</option>
                <option value="Staff / Lead (8-12 years)">Staff / Lead (8-12 years)</option>
                <option value="Principal / Director (12+ years)">Principal / Director (12+ years)</option>
              </select>
            </div>
          </div>

          {/* Key Skills */}
          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1">
              Core Skills &amp; Stack Focus
            </label>
            <input
              type="text"
              value={skillsNotes}
              onChange={(e) => setSkillsNotes(e.target.value)}
              placeholder="TypeScript, React, Go, Docker, AWS, PostgreSQL..."
              className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
            />
          </div>

          {/* Custom Prompt & Instructions */}
          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1">
              AI Customization Instructions
            </label>
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Tell the AI what achievements, projects, or strengths to emphasize..."
              className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
            />
          </div>

          {/* Target Job Description (Optional) */}
          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1">
              Target Job Description (Optional — Tailors keywords to JD)
            </label>
            <textarea
              rows={2}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target job posting here to auto-tune keywords and ATS scores..."
              className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-[#1F2937] flex gap-3 justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-[#1c1f2a] transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-spring bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Resume Data...' : 'Generate AI Resume'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
