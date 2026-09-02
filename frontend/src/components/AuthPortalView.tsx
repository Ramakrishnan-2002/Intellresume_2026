import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

interface AuthPortalViewProps {
  onSuccessAuth: () => void;
}

export const AuthPortalView: React.FC<AuthPortalViewProps> = ({ onSuccessAuth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo.architect@intelliresume.internal');
  const [password, setPassword] = useState('executive-demo');
  const [fullName, setFullName] = useState('Alex Chen');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccessAuth();
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#080c14] text-[#f8fafc] font-sans selection:bg-blue-600/30">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-xl border border-white/[0.08] bg-[#0e1424] shadow-2xl overflow-hidden">
        {/* Left Column: Editorial Product Narrative */}
        <div className="p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0c1220]">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold font-mono text-[11px] flex items-center justify-center">
                IR
              </div>
              <span className="font-bold text-xs tracking-wider uppercase text-slate-300 font-mono">
                IntelliResume 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans'] leading-tight">
              Precision engineering for high-impact career documents.
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed">
              Design vector-accurate resumes tailored to modern applicant tracking systems. Structured editing, inline bullet quantification, and contextual AI coaching.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-white/[0.08] space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Full structured resume architect with live vector print preview.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Direct Gemini 3.6 Flash integration for bullet rewriting & JD matching.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Local draft synchronization and pristine PDF vector export.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Credentials Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.08]">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              {mode === 'login' ? 'Access Workspace' : 'Create Architect Profile'}
            </div>

            <div className="flex gap-4 font-mono text-xs">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`pb-1 transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'text-blue-400 font-bold border-b border-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`pb-1 transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'text-blue-400 font-bold border-b border-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-300 font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full h-9 bg-[#080c14] border border-white/10 rounded-md pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-300 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@example.com"
                  className="w-full h-9 bg-[#080c14] border border-white/10 rounded-md pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono text-slate-300 font-medium">
                  Password
                </label>
                {mode === 'login' && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Any password accepted in demo
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 bg-[#080c14] border border-white/10 rounded-md pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full h-9"
              >
                <span>{mode === 'login' ? 'Enter Workspace' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onSuccessAuth}
                className="w-full h-9"
              >
                Continue as Guest
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
            <span className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Encrypted local workspace session</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
