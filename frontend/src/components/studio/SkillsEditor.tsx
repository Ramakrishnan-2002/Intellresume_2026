import React, { useState } from 'react';
import { ResumeData } from '../../types';
import { Plus, X, Code2 } from 'lucide-react';

interface SkillsEditorProps {
  skills: ResumeData['skills'];
  onChange: (updated: ResumeData['skills']) => void;
}

type SkillCategory = 'languages' | 'frameworks' | 'tools' | 'cloud';

const CATEGORY_META: { key: SkillCategory; label: string; placeholder: string }[] = [
  { key: 'languages', label: 'Programming Languages', placeholder: 'TypeScript, Go, Python, SQL' },
  { key: 'frameworks', label: 'Frameworks & Libraries', placeholder: 'React, Next.js, Node.js, FastAPI' },
  { key: 'tools', label: 'Developer Toolchain', placeholder: 'Docker, Git, Webpack, PostgreSQL, Redis' },
  { key: 'cloud', label: 'Cloud & Infrastructure', placeholder: 'AWS, GCP, Kubernetes, Terraform' },
];

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, onChange }) => {
  const [newInputs, setNewInputs] = useState<Record<SkillCategory, string>>({
    languages: '',
    frameworks: '',
    tools: '',
    cloud: '',
  });

  const handleAddSkill = (category: SkillCategory) => {
    const val = newInputs[category].trim();
    if (!val) return;

    const currentList = skills[category] || [];
    if (!currentList.includes(val)) {
      onChange({
        ...skills,
        [category]: [...currentList, val],
      });
    }
    setNewInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const handleRemoveSkill = (category: SkillCategory, skillToRemove: string) => {
    onChange({
      ...skills,
      [category]: (skills[category] || []).filter((s) => s !== skillToRemove),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: SkillCategory) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill(category);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-white/[0.08]">
        <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
          Technical Skills & Tooling
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Categorized technical keywords calibrated for applicant tracking systems and technical screeners.
        </p>
      </div>

      <div className="space-y-5">
        {CATEGORY_META.map((cat) => {
          const list = skills[cat.key] || [];

          return (
            <div
              key={cat.key}
              className="p-4 rounded-lg bg-[#0d121c] border border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  {cat.label} ({list.length})
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Press Enter to add
                </span>
              </div>

              {/* Skills Tags List */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {list.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161e2e] border border-white/10 text-xs text-slate-200 font-mono"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(cat.key, skill)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInputs[cat.key]}
                  onChange={(e) =>
                    setNewInputs((prev) => ({ ...prev, [cat.key]: e.target.value }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, cat.key)}
                  placeholder={`Add to ${cat.label.toLowerCase()}...`}
                  className="flex-1 h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(cat.key)}
                  className="h-8 px-3 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-200 text-xs font-medium border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-400" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
