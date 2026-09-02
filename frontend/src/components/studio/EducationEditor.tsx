import React from 'react';
import { EducationItem } from '../../types';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

interface EducationEditorProps {
  education: EducationItem[];
  onChange: (updated: EducationItem[]) => void;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({
  education,
  onChange,
}) => {
  const handleFieldChange = (idx: number, field: keyof EducationItem, value: any) => {
    const updated = [...education];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: 'University of California, Berkeley',
      degree: 'B.S.',
      field: 'Computer Science',
      graduationYear: '2020',
      location: 'Berkeley, CA',
    };
    onChange([...education, newItem]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...education];
    updated.splice(idx, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
            Education & Certifications ({education.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Academic degrees, institutions, and graduation credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="h-7 px-2.5 rounded text-[11px] font-semibold bg-[#131d33] hover:bg-[#1a2744] text-blue-400 border border-blue-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Education</span>
        </button>
      </div>

      <div className="space-y-4">
        {education.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-4 rounded-lg bg-[#0d121c] border border-white/[0.08] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">
                  {item.degree || 'Degree'} in {item.field || 'Field of Study'}
                </span>
                {item.institution && (
                  <span className="text-xs text-slate-400">@ {item.institution}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="Remove education item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Institution / University</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => handleFieldChange(idx, 'institution', e.target.value)}
                  placeholder="Stanford University"
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Degree</label>
                <input
                  type="text"
                  value={item.degree}
                  onChange={(e) => handleFieldChange(idx, 'degree', e.target.value)}
                  placeholder="B.S. / M.S."
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Field of Study</label>
                <input
                  type="text"
                  value={item.field}
                  onChange={(e) => handleFieldChange(idx, 'field', e.target.value)}
                  placeholder="Computer Science"
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-slate-400">Graduation Year</label>
                <input
                  type="text"
                  value={item.graduationYear}
                  onChange={(e) => handleFieldChange(idx, 'graduationYear', e.target.value)}
                  placeholder="2020"
                  className="w-full h-8 bg-[#111724] border border-white/10 rounded px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
