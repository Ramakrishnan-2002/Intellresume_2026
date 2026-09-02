import React, { useState } from 'react';
import { ProjectItem } from '../../types';
import { Plus, Trash2, FolderGit2, X } from 'lucide-react';

interface ProjectsEditorProps {
  projects: ProjectItem[];
  onChange: (updated: ProjectItem[]) => void;
}

export const ProjectsEditor: React.FC<ProjectsEditorProps> = ({ projects, onChange }) => {
  const [newTagInput, setNewTagInput] = useState<{ [key: number]: string }>({});

  const handleFieldChange = (idx: number, field: keyof ProjectItem, value: any) => {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const handleAddProject = () => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: 'Distributed Cache Subsystem',
      description: 'Engineered a lock-free distributed cache in Go supporting 150k QPS.',
      tech: ['Go', 'Redis', 'gRPC', 'Docker'],
      link: 'https://github.com/alexchen/dist-cache',
    };
    onChange([...projects, newProj]);
  };

  const handleRemoveProject = (idx: number) => {
    const updated = [...projects];
    updated.splice(idx, 1);
    onChange(updated);
  };

  const handleAddTechTag = (idx: number) => {
    const val = (newTagInput[idx] || '').trim();
    if (!val) return;

    const updated = [...projects];
    const currentTech = updated[idx].tech || [];
    if (!currentTech.includes(val)) {
      updated[idx].tech = [...currentTech, val];
      onChange(updated);
    }
    setNewTagInput((prev) => ({ ...prev, [idx]: '' }));
  };

  const handleRemoveTechTag = (projIdx: number, tagToRemove: string) => {
    const updated = [...projects];
    updated[projIdx].tech = (updated[projIdx].tech || []).filter((t) => t !== tagToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
            Featured Projects ({projects.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrate hands-on engineering depth with key repositories and systems.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProject}
          className="h-7 px-2.5 rounded text-[11px] font-semibold bg-[#131d33] hover:bg-[#1a2744] text-blue-400 border border-blue-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((proj, idx) => (
          <div
            key={proj.id || idx}
            className="p-4 rounded-lg bg-[#0d121c] border border-white/[0.08] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">
                  {proj.name || 'Project Name'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveProject(idx)}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="Remove project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Project Name</label>
                <input
                  type="text"
                  value={proj.name}
                  onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                  placeholder="Distributed Task Queue"
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Repository / Demo Link</label>
                <input
                  type="text"
                  value={proj.link || ''}
                  onChange={(e) => handleFieldChange(idx, 'link', e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400">Description</label>
                <textarea
                  rows={2}
                  value={proj.description}
                  onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                  placeholder="Key architecture, scale metrics, or technologies deployed..."
                  className="w-full p-2 bg-[#111724] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                />
              </div>

              {/* Technologies Tagging */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-[10px] font-mono text-slate-400">Technologies Used</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(proj.tech || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161e2e] border border-white/10 text-[11px] font-mono text-slate-200"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTechTag(idx, t)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput[idx] || ''}
                    onChange={(e) =>
                      setNewTagInput((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTechTag(idx);
                      }
                    }}
                    placeholder="Add tech tag and press Enter..."
                    className="flex-1 h-7.5 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTechTag(idx)}
                    className="h-7.5 px-2.5 rounded bg-[#131d33] hover:bg-[#1a2744] text-slate-200 text-xs border border-white/10 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-blue-400" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
