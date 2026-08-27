import React, { useState } from 'react';
import { BackgroundShader } from './BackgroundShader';
import { User, Lock, Mail, BadgeCheck, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthPortalViewProps {
  onSuccessAuth: () => void;
}

export const AuthPortalView: React.FC<AuthPortalViewProps> = ({ onSuccessAuth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('alex.chen@example.com');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('Alex Chen');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccessAuth();
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0B0F19] text-[#dfe2f1]">
      {/* Background WebGL Shader */}
      <BackgroundShader />

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-md px-4 sm:px-0">
        {/* Auth Glass Card */}
        <div className="glass-z2 rounded-2xl p-8 sm:p-10 floating-card border border-[#86948a]/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(78,222,163,0.08)]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4edea3] tracking-tighter mb-2 font-['Plus_Jakarta_Sans']">
              IntelliResume
            </h1>
            <p className="text-sm font-medium text-slate-400 font-mono">AI-Powered Assistant</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-8 border-b border-[#3c4a42]/40 font-mono text-xs font-bold tracking-wider">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 pb-3 text-center transition-all ${
                mode === 'login' ? 'tab-active' : 'tab-inactive'
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 pb-3 text-center transition-all ${
                mode === 'register' ? 'tab-active' : 'tab-inactive'
              }`}
            >
              REGISTER
            </button>
          </div>

          {/* Forms */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-semibold text-slate-400 block tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full input-glass rounded-lg py-3 pl-10 pr-4 text-sm font-sans placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-mono text-xs font-semibold text-slate-400 block tracking-wide">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full input-glass rounded-lg py-3 pl-10 pr-4 text-sm font-sans placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs font-semibold text-slate-400 block tracking-wide">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to demo email address.')}
                    className="font-mono text-[11px] text-[#4edea3] hover:text-[#6ffbbe] transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-glass rounded-lg py-3 pl-10 pr-4 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {mode === 'login' ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-bold text-base py-3.5 rounded-lg btn-spring shadow-[0_0_20px_rgba(78,222,163,0.3)] hover:shadow-[0_0_30px_rgba(78,222,163,0.5)] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
              >
                <span>{loading ? 'Authenticating...' : 'Authenticate'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full glass-z1 text-[#4edea3] border border-[#4edea3]/50 font-bold text-base py-3.5 rounded-lg btn-spring hover:bg-[#4edea3]/10 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Initializing...' : 'Initialize Account'}</span>
              </button>
            )}
          </form>

          {/* Quick Demo Bypass */}
          <div className="mt-6 pt-4 border-t border-[#3c4a42]/30 text-center">
            <button
              onClick={onSuccessAuth}
              className="text-xs font-mono text-slate-400 hover:text-[#4edea3] transition-colors inline-flex items-center gap-1.5"
            >
              <span>Instant Guest Access</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#4edea3]" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
