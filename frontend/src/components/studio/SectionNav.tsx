import React from 'react';
import {
  User,
  FileText,
  Briefcase,
  Code2,
  GraduationCap,
  FolderGit2,
} from 'lucide-react';

export type StudioSection = 'personal' | 'experience' | 'skills' | 'education' | 'projects';

interface SectionNavProps {
  activeSection: StudioSection;
  onSelectSection: (section: StudioSection) => void;
  counts: {
    experience: number;
    skills: number;
    education: number;
    projects: number;
  };
}

export const SectionNav: React.FC<SectionNavProps> = ({
  activeSection,
  onSelectSection,
  counts,
}) => {
  const sections: { id: StudioSection; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'personal', label: 'Contact & Summary', icon: User },
    { id: 'experience', label: 'Work Experience', icon: Briefcase, badge: counts.experience },
    { id: 'skills', label: 'Technical Skills', icon: Code2, badge: counts.skills },
    { id: 'education', label: 'Education', icon: GraduationCap, badge: counts.education },
    { id: 'projects', label: 'Projects', icon: FolderGit2, badge: counts.projects },
  ];

  return (
    <nav aria-label="Resume sections" className="flex lg:flex-col gap-1 p-2 bg-[#0a0f1d] border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-x-auto lg:overflow-x-visible shrink-0 select-none">
      {sections.map((s) => {
        const Icon = s.icon;
        const isActive = activeSection === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelectSection(s.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[#141d32] text-white border-l-0 lg:border-l-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{s.label}</span>
            </div>
            {s.badge !== undefined && (
              <span className="hidden lg:inline text-[10px] font-mono text-slate-500 ml-2">
                {s.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
