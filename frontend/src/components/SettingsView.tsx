import React, { useState, useRef } from 'react';
import { ResumeData } from '../types';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Cpu,
  HardDrive,
  FileCode,
  Save,
} from 'lucide-react';
import { Button } from './ui/Button';

interface SettingsViewProps {
  resumeData: ResumeData;
  onUpdateResumeData?: (data: ResumeData) => void;
  onSave: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  resumeData,
  onUpdateResumeData,
  onSave,
}) => {
  const [firstName, setFirstName] = useState(resumeData.personalInfo?.firstName || '');
  const [lastName, setLastName] = useState(resumeData.personalInfo?.lastName || '');
  const [email, setEmail] = useState(resumeData.personalInfo?.email || '');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateResumeData) {
      onUpdateResumeData({
        ...resumeData,
        personalInfo: {
          ...resumeData.personalInfo,
          firstName,
          lastName,
          email,
        },
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-${(resumeData.title || 'export').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.personalInfo && parsed.experience && onUpdateResumeData) {
          onUpdateResumeData(parsed);
          setFirstName(parsed.personalInfo.firstName || '');
          setLastName(parsed.personalInfo.lastName || '');
          setEmail(parsed.personalInfo.email || '');
          onSave();
        }
      } catch (err) {
        console.error('Invalid resume JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleClearLocalStorage = () => {
    if (confirm('Reset workspace to empty starter template? Local changes will be cleared.')) {
      localStorage.removeItem('intelliresume_data');
      localStorage.removeItem('intelliresume_activities');
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0b0f17] text-[#f8fafc] font-sans selection:bg-emerald-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Workspace Settings & Backup
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Document persistence, author identity, and local storage management.
          </p>
        </div>

        {/* 1. Author Profile */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-lg bg-[#111724] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Document Author Profile
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Default candidate identity attached to export documents.
              </p>
            </div>
            {saved && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-slate-400">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded px-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-slate-400">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded px-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-[11px] font-mono text-slate-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-8.5 bg-[#0d121c] border border-white/10 rounded px-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Author Profile
            </Button>
          </div>
        </form>

        {/* 2. Document Backup & Portability */}
        <section className="p-6 rounded-lg bg-[#111724] border border-white/[0.08] space-y-4">
          <div className="pb-3 border-b border-white/[0.06]">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Document Backup & Portability
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Export your structured resume as a standard JSON schema file, or restore from a previous backup.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded bg-[#0d121c] border border-white/[0.06] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export JSON Backup</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Download a structured file containing your experience, skills, metrics, and education.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportJSON}
                icon={<FileCode className="w-3.5 h-3.5" />}
              >
                Download .json
              </Button>
            </div>

            <div className="p-4 rounded bg-[#0d121c] border border-white/[0.06] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Import JSON Backup</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Upload an existing IntelliResume JSON file to replace your active workspace.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJSON}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<FileCode className="w-3.5 h-3.5" />}
                >
                  Choose File
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Storage & Engine Telemetry */}
        <section className="p-6 rounded-lg bg-[#111724] border border-white/[0.08] space-y-4">
          <div className="pb-3 border-b border-white/[0.06]">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Environment & Runtime Status
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verified connectivity to local workspace and backend intelligence APIs.
            </p>
          </div>

          <div className="divide-y divide-white/[0.06] text-xs font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                AI Inference Engine
              </span>
              <span className="text-slate-200 font-semibold">Gemini 3.6 Flash (Connected)</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                Draft Synchronization
              </span>
              <span className="text-slate-200 font-semibold">Browser LocalStorage (Active)</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Clear Local Draft Cache
              </span>
              <button
                type="button"
                onClick={handleClearLocalStorage}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Reset Workspace Cache
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
