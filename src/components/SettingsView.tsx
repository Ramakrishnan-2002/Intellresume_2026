import React, { useState } from 'react';
import { ResumeData } from '../types';
import { Save, User, Shield, Bell, Moon, Key, Check } from 'lucide-react';

interface SettingsViewProps {
  resumeData: ResumeData;
  onSave: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ resumeData, onSave }) => {
  const [name, setName] = useState(
    `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`
  );
  const [email, setEmail] = useState(resumeData.personalInfo.email);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#090D16] text-[#dfe2f1]">
      <div className="max-w-[800px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Plus_Jakarta_Sans']">
            Account &amp; Studio Preferences
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Manage your AI telemetry configuration, profile, and security preferences.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Card */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-[#4edea3]" />
              <span>Architect Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-slate-200 focus:border-[#4edea3] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d0d15] border border-[#1F2937] rounded-lg p-2.5 text-slate-200 focus:border-[#4edea3] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#c0c1ff]" />
              <span>AI Engine &amp; Reasoning Parameters</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#1c1f2a] rounded-lg border border-[#3c4a42]/30">
                <div>
                  <div className="font-semibold text-slate-200">Adaptive ATS Keyword Density</div>
                  <div className="text-slate-400 text-[11px]">
                    Auto-aligns bullet points with modern hiring search algorithms.
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-[#4edea3] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1c1f2a] rounded-lg border border-[#3c4a42]/30">
                <div>
                  <div className="font-semibold text-slate-200">3D Viewport Hardware Acceleration</div>
                  <div className="text-slate-400 text-[11px]">
                    Uses WebGL2 for smooth interactive card physics and tilt.
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-[#4edea3] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-[#4edea3]/20 transition-all btn-spring"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
