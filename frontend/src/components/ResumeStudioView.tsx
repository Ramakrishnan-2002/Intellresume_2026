import React, { useState } from 'react';
import { ResumeData, ExperienceItem, EducationItem, ProjectItem } from '../types';
import { ThreeResumeCanvas } from './ThreeResumeCanvas';
import {
  ChevronDown,
  ChevronUp,
  Radar,
  User,
  Briefcase,
  Code2,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Wand2,
  Edit3,
} from 'lucide-react';

interface ResumeStudioViewProps {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  onOpenJDMatcher: () => void;
  onOpenAIReview: () => void;
  onOpenAIGenerator: () => void;
  onSaveDraft: () => void;
}

export const ResumeStudioView: React.FC<ResumeStudioViewProps> = ({
  data,
  setData,
  onOpenJDMatcher,
  onOpenAIReview,
  onOpenAIGenerator,
  onSaveDraft,
}) => {
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [optimizingIndex, setOptimizingIndex] = useState<{ expIdx: number; bulletIdx: number } | null>(null);
  const [isOptimizingSection, setIsOptimizingSection] = useState(false);

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev === section ? '' : section));
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  // Experience Handlers
  const handleExperienceChange = (expIdx: number, field: keyof ExperienceItem, value: any) => {
    setData((prev) => {
      const updatedExp = [...prev.experience];
      updatedExp[expIdx] = { ...updatedExp[expIdx], [field]: value };
      return { ...prev, experience: updatedExp };
    });
  };

  const handleExperienceBulletChange = (expIdx: number, bulletIdx: number, value: string) => {
    setData((prev) => {
      const updatedExp = [...prev.experience];
      updatedExp[expIdx].bullets[bulletIdx] = value;
      return { ...prev, experience: updatedExp };
    });
  };

  const addExperienceBullet = (expIdx: number) => {
    setData((prev) => {
      const updatedExp = [...prev.experience];
      updatedExp[expIdx].bullets.push('Architected scalable subsystem improving team velocity by 35%.');
      return { ...prev, experience: updatedExp };
    });
  };

  const removeExperienceBullet = (expIdx: number, bulletIdx: number) => {
    setData((prev) => {
      const updatedExp = [...prev.experience];
      updatedExp[expIdx].bullets.splice(bulletIdx, 1);
      return { ...prev, experience: updatedExp };
    });
  };

  const addExperiencePosition = () => {
    setData((prev) => ({
      ...prev,
      experience: [
        {
          id: `exp-${Date.now()}`,
          role: 'Senior Software Engineer',
          company: 'Tech Enterprise Corp',
          location: 'San Francisco, CA',
          startDate: '2023',
          endDate: 'Present',
          current: true,
          bullets: [
            'Led technical architecture and engineering of high-availability microservices.',
            'Collaborated across cross-functional teams to deliver critical production features.',
          ],
        },
        ...prev.experience,
      ],
    }));
    setActiveSection('experience');
  };

  const removeExperiencePosition = (expIdx: number) => {
    setData((prev) => {
      const updatedExp = [...prev.experience];
      updatedExp.splice(expIdx, 1);
      return { ...prev, experience: updatedExp };
    });
  };

  // Education Handlers
  const handleEducationChange = (eduIdx: number, field: keyof EducationItem, value: string) => {
    setData((prev) => {
      const updatedEdu = [...prev.education];
      updatedEdu[eduIdx] = { ...updatedEdu[eduIdx], [field]: value };
      return { ...prev, education: updatedEdu };
    });
  };

  const addEducationItem = () => {
    setData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          institution: 'University / College Name',
          degree: 'B.S. in Computer Science',
          field: 'Software Engineering',
          graduationYear: '2020',
          location: 'City, State',
        },
      ],
    }));
    setActiveSection('education');
  };

  const removeEducationItem = (eduIdx: number) => {
    setData((prev) => {
      const updatedEdu = [...prev.education];
      updatedEdu.splice(eduIdx, 1);
      return { ...prev, education: updatedEdu };
    });
  };

  // Projects Handlers
  const handleProjectChange = (projIdx: number, field: keyof ProjectItem, value: any) => {
    setData((prev) => {
      const updatedProj = [...prev.projects];
      updatedProj[projIdx] = { ...updatedProj[projIdx], [field]: value };
      return { ...prev, projects: updatedProj };
    });
  };

  const addProjectItem = () => {
    setData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj-${Date.now()}`,
          name: 'Distributed Cloud Dashboard',
          description: 'Full-stack application delivering real-time telemetry streaming.',
          tech: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
          link: 'github.com/project',
        },
      ],
    }));
    setActiveSection('projects');
  };

  const removeProjectItem = (projIdx: number) => {
    setData((prev) => {
      const updatedProj = [...prev.projects];
      updatedProj.splice(projIdx, 1);
      return { ...prev, projects: updatedProj };
    });
  };

  // AI Bullet Optimizer
  const handleAIBulletOptimize = async (expIdx: number, bulletIdx: number) => {
    setOptimizingIndex({ expIdx, bulletIdx });
    const currentBullet = data.experience[expIdx].bullets[bulletIdx];

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentBullet,
          sectionType: 'Experience',
          role: data.title,
        }),
      });
      const resData = await res.json();
      if (resData.options && resData.options.length > 0) {
        const chosen = resData.options[0].content;
        handleExperienceBulletChange(expIdx, bulletIdx, chosen);
        setData((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            resumeScore: Math.min(100, prev.metrics.resumeScore + 2),
          },
        }));
      }
    } catch (e) {
      console.error('Error optimizing:', e);
      handleExperienceBulletChange(
        expIdx,
        bulletIdx,
        `Architected and optimized ${currentBullet.toLowerCase().replace(/^(worked on|helped|did)\s*/i, '')}, improving performance by 40%.`
      );
    } finally {
      setOptimizingIndex(null);
    }
  };

  // AI Summary Optimize
  const handleAIOptimizeSummary = async () => {
    setIsOptimizingSection(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: data.personalInfo.summary,
          sectionType: 'Summary',
          role: data.title,
        }),
      });
      const resData = await res.json();
      if (resData.options && resData.options[0]) {
        handlePersonalInfoChange('summary', resData.options[0].content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizingSection(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Left Panel: Structured Editor */}
      <div className="w-full lg:w-[500px] flex-shrink-0 bg-[#111827] border-r border-[#1F2937] flex flex-col h-full z-10 shadow-2xl overflow-hidden no-print">
        {/* Editor Header */}
        <div className="p-4 border-b border-[#1F2937] flex justify-between items-center bg-[#111827]">
          <div className="flex-1 mr-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                className="text-base font-bold text-slate-100 font-['Plus_Jakarta_Sans'] bg-transparent border-b border-transparent hover:border-slate-600 focus:border-[#4edea3] focus:outline-none w-full"
                title="Click to rename resume role title"
              />
            </div>
            <p className="font-mono text-xs text-slate-400 mt-0.5">ID: {data.id}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAIGenerator}
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/20 to-blue-600/20 hover:from-emerald-500/30 hover:to-blue-600/30 text-[#4edea3] border border-[#4edea3]/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Generate new resume with backend AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Generator</span>
            </button>
          </div>
        </div>

        {/* Scrollable Accordion Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* JD Matcher Bar */}
          <div className="bg-[#1c1f2a] border border-[#1F2937] rounded-lg overflow-hidden hover:border-[#4edea3]/40 transition-all">
            <button
              onClick={onOpenJDMatcher}
              className="w-full p-3 flex justify-between items-center hover:bg-[#262a35] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Radar className="w-4 h-4 text-[#c0c1ff]" />
                <span className="font-bold text-slate-200 text-xs">JD Matcher &amp; ATS Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#4edea3] font-mono text-xs font-bold">
                  {data.metrics.jdMatchRate}% Match
                </span>
                <span className="text-[10px] font-mono bg-[#4edea3]/15 text-[#4edea3] px-1.5 py-0.5 rounded">
                  SCAN
                </span>
              </div>
            </button>
          </div>

          {/* Personal Info Accordion */}
          <div className="bg-[#1c1f2a] border border-[#1F2937] rounded-lg overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full p-3 flex justify-between items-center bg-[#1c1f2a] hover:bg-[#262a35] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200 text-xs">Personal Details &amp; Summary</span>
              </div>
              {activeSection === 'personal' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeSection === 'personal' && (
              <div className="p-4 space-y-3 border-t border-[#1F2937] bg-[#171b26]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">First Name</label>
                    <input
                      type="text"
                      value={data.personalInfo.firstName}
                      onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={data.personalInfo.lastName}
                      onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={data.personalInfo.email}
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 font-mono text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={data.personalInfo.phone}
                      onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 font-mono text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={data.personalInfo.location}
                      onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">Role Title</label>
                    <input
                      type="text"
                      value={data.personalInfo.title}
                      onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={data.personalInfo.linkedin || ''}
                      onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/..."
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 font-mono text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={data.personalInfo.github || ''}
                      onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                      placeholder="github.com/..."
                      className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 font-mono text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-mono text-[11px] text-slate-400">Professional Summary</label>
                    <button
                      type="button"
                      onClick={handleAIOptimizeSummary}
                      disabled={isOptimizingSection}
                      className="font-mono text-[10px] text-[#4edea3] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isOptimizingSection ? 'Enhancing...' : 'AI Polish'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={data.personalInfo.summary}
                    onChange={(e) => handlePersonalInfoChange('summary', e.target.value)}
                    className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Experience Accordion */}
          <div className="bg-[#1c1f2a] border border-[#1F2937] rounded-lg overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('experience')}
              className="w-full p-3 flex justify-between items-center bg-[#1c1f2a] hover:bg-[#262a35] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200 text-xs">
                  Experience ({data.experience.length})
                </span>
              </div>
              {activeSection === 'experience' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeSection === 'experience' && (
              <div className="p-4 space-y-4 border-t border-[#1F2937] bg-[#171b26]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[11px] text-slate-400 uppercase">Work History</span>
                  <button
                    type="button"
                    onClick={addExperiencePosition}
                    className="text-xs text-[#4edea3] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Position
                  </button>
                </div>

                {data.experience.map((exp, expIdx) => (
                  <div key={exp.id} className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] space-y-3">
                    {/* Role & Company Details */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Role / Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleExperienceChange(expIdx, 'role', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(expIdx, 'company', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleExperienceChange(expIdx, 'startDate', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => handleExperienceChange(expIdx, 'endDate', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleExperienceChange(expIdx, 'location', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2 pt-1 border-t border-[#1F2937]">
                      <div className="flex justify-between items-center">
                        <label className="font-mono text-[10px] text-slate-400">Impact Bullet Points</label>
                        <button
                          type="button"
                          onClick={() => removeExperiencePosition(expIdx)}
                          className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Position
                        </button>
                      </div>

                      {exp.bullets.map((bullet, bulletIdx) => {
                        const isThisOptimizing =
                          optimizingIndex?.expIdx === expIdx &&
                          optimizingIndex?.bulletIdx === bulletIdx;

                        return (
                          <div key={bulletIdx} className="space-y-1">
                            <div className="flex gap-1.5 items-start">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) =>
                                  handleExperienceBulletChange(expIdx, bulletIdx, e.target.value)
                                }
                                className="flex-1 bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-200 focus:border-[#4edea3] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAIBulletOptimize(expIdx, bulletIdx)}
                                disabled={isThisOptimizing}
                                title="AI Polish & Quantify Bullet"
                                className="p-1.5 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 border border-[#4edea3]/30 text-[#4edea3] rounded transition-all shrink-0"
                              >
                                <Wand2 className={`w-3.5 h-3.5 ${isThisOptimizing ? 'animate-spin' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExperienceBullet(expIdx, bulletIdx)}
                                title="Remove bullet"
                                className="p-1.5 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addExperienceBullet(expIdx)}
                      className="text-[11px] font-mono text-[#4edea3] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Bullet Point
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Accordion */}
          <div className="bg-[#1c1f2a] border border-[#1F2937] rounded-lg overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('skills')}
              className="w-full p-3 flex justify-between items-center bg-[#1c1f2a] hover:bg-[#262a35] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200 text-xs">Skills &amp; Tooling</span>
              </div>
              {activeSection === 'skills' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeSection === 'skills' && (
              <div className="p-4 space-y-3 border-t border-[#1F2937] bg-[#171b26] text-xs">
                <div>
                  <label className="block font-mono text-[11px] text-slate-400 mb-1">
                    Programming Languages (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={data.skills.languages.join(', ')}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        skills: {
                          ...prev.skills,
                          languages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      }))
                    }
                    className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-slate-400 mb-1">
                    Frameworks &amp; Libraries
                  </label>
                  <input
                    type="text"
                    value={data.skills.frameworks.join(', ')}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        skills: {
                          ...prev.skills,
                          frameworks: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      }))
                    }
                    className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-slate-400 mb-1">
                    Developer Tools &amp; CI/CD
                  </label>
                  <input
                    type="text"
                    value={data.skills.tools.join(', ')}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        skills: {
                          ...prev.skills,
                          tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      }))
                    }
                    className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-slate-400 mb-1">
                    Cloud &amp; Databases
                  </label>
                  <input
                    type="text"
                    value={data.skills.cloud.join(', ')}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        skills: {
                          ...prev.skills,
                          cloud: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        },
                      }))
                    }
                    className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-2 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Projects Accordion */}
          <div className="bg-[#1c1f2a] border border-[#1F2937] rounded-lg overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('projects')}
              className="w-full p-3 flex justify-between items-center bg-[#1c1f2a] hover:bg-[#262a35] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200 text-xs">
                  Featured Projects ({data.projects.length})
                </span>
              </div>
              {activeSection === 'projects' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeSection === 'projects' && (
              <div className="p-4 space-y-4 border-t border-[#1F2937] bg-[#171b26]">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px] text-slate-400 uppercase">Projects List</span>
                  <button
                    type="button"
                    onClick={addProjectItem}
                    className="text-xs text-[#4edea3] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {data.projects.map((proj, projIdx) => (
                  <div key={proj.id} className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => handleProjectChange(projIdx, 'name', e.target.value)}
                        placeholder="Project Name"
                        className="bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-bold flex-1 mr-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeProjectItem(projIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => handleProjectChange(projIdx, 'description', e.target.value)}
                        placeholder="Project Description & Metrics"
                        className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-200 focus:border-[#4edea3] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Tech Stack</label>
                        <input
                          type="text"
                          value={proj.tech.join(', ')}
                          onChange={(e) =>
                            handleProjectChange(
                              projIdx,
                              'tech',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Link / URL</label>
                        <input
                          type="text"
                          value={proj.link || ''}
                          onChange={(e) => handleProjectChange(projIdx, 'link', e.target.value)}
                          placeholder="github.com/..."
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Accordion */}
          <div className="bg-[#1c1f2a] border border-[#1F2937] rounded-lg overflow-hidden transition-all">
            <button
              onClick={() => toggleSection('education')}
              className="w-full p-3 flex justify-between items-center bg-[#1c1f2a] hover:bg-[#262a35] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200 text-xs">
                  Education ({data.education.length})
                </span>
              </div>
              {activeSection === 'education' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeSection === 'education' && (
              <div className="p-4 space-y-4 border-t border-[#1F2937] bg-[#171b26]">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[11px] text-slate-400 uppercase">Education List</span>
                  <button
                    type="button"
                    onClick={addEducationItem}
                    className="text-xs text-[#4edea3] font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Degree
                  </button>
                </div>

                {data.education.map((edu, eduIdx) => (
                  <div key={edu.id} className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="grid grid-cols-2 gap-2 flex-1 mr-2">
                        <div>
                          <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                            className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Field / Major</label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) => handleEducationChange(eduIdx, 'field', e.target.value)}
                            className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEducationItem(eduIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-slate-400 mb-0.5">Graduation Year</label>
                        <input
                          type="text"
                          value={edu.graduationYear}
                          onChange={(e) => handleEducationChange(eduIdx, 'graduationYear', e.target.value)}
                          className="w-full bg-[#0d0d15] border border-[#1F2937] rounded p-1.5 text-xs text-slate-100 focus:border-[#4edea3] focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-[#1F2937] bg-[#111827] flex gap-3">
          <button
            onClick={onSaveDraft}
            className="flex-1 bg-[#1c1f2a] border border-[#1F2937] hover:border-slate-600 text-slate-200 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={onOpenAIReview}
            className="flex-1 bg-[#c0c1ff] hover:bg-[#e1e0ff] text-[#0d0096] font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 btn-spring shadow-md shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Audit &amp; Review</span>
          </button>
        </div>
      </div>

      {/* Right Panel: 3D Viewport & PDF Preview */}
      <ThreeResumeCanvas data={data} />
    </div>
  );
};
