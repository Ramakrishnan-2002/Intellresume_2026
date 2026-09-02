import React, { useState, useEffect } from 'react';
import { ResumeData, ActivityItem, ActiveTab } from './types';
import { initialResumeData, initialActivities } from './data/mockData';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/DashboardView';
import { ResumeStudioView } from './components/ResumeStudioView';
import { AIChatView } from './components/AIChatView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { AuthPortalView } from './components/AuthPortalView';
import { JDMatcherModal } from './components/JDMatcherModal';
import { AIReviewModal } from './components/AIReviewModal';
import { AIGenerateModal } from './components/AIGenerateModal';
import { apiClient } from './services/api';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Initialize with local storage if available, otherwise high-quality mock data
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('intelliresume_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load resumeData from localStorage:', e);
    }
    return initialResumeData;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem('intelliresume_activities');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load activities from localStorage:', e);
    }
    return initialActivities;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);
  const [isAIReviewOpen, setIsAIReviewOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Distributed Systems & OCC State
  const [resumeVersion, setResumeVersion] = useState<number>(1);
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictDetails, setConflictDetails] = useState<{ serverVersion: number; clientVersion: number } | null>(null);
  const [isAIDegraded, setIsAIDegraded] = useState<boolean>(false);

  useEffect(() => {
    // Probe backend readiness and circuit breaker status on launch
    apiClient.getHealth().then((h) => {
      if (h.circuitState === 'OPEN') {
        setIsAIDegraded(true);
      }
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApplyGeneratedResume = (newResume: ResumeData) => {
    setResumeData(newResume);
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'generate',
        title: `AI Generated: ${newResume.title}`,
        time: 'Just now',
        description: `Generated complete structured resume and PDF model with AI.`,
        quote: `"${newResume.personalInfo.summary.slice(0, 80)}..."`,
      },
      ...prev,
    ]);
    setActiveTab('studio');
    showToast(`AI Resume generated for ${newResume.title}! Ready to edit and export.`);
  };

  const handleNewResume = () => {
    setResumeData({
      id: `RES-${Math.floor(100 + Math.random() * 900)}-B`,
      title: 'Full Stack Engineer',
      status: 'DRAFT',
      personalInfo: {
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        title: 'Full Stack Software Engineer',
        summary: 'Full Stack Software Engineer specializing in modern cloud architectures, React 19, TypeScript, and high-concurrency microservices.',
        linkedin: 'linkedin.com/in/alexchen-eng',
        github: 'github.com/alexchen-dev',
      },
      experience: [
        {
          id: `exp-${Date.now()}`,
          role: 'Senior Full Stack Engineer',
          company: 'CloudScale Systems',
          location: 'San Francisco, CA',
          startDate: '2023',
          endDate: 'Present',
          current: true,
          bullets: [
            'Architected event-driven microservices processing 50M+ events/day with 99.99% uptime.',
            'Engineered React frontend dashboard with sub-second page load times and zero layout shifts.',
          ],
        },
      ],
      skills: {
        languages: ['TypeScript', 'JavaScript', 'Go', 'Python', 'SQL'],
        frameworks: ['React 19', 'Next.js', 'Express', 'Tailwind CSS', 'Node.js'],
        tools: ['Docker', 'Kubernetes', 'Git', 'Vite', 'CI/CD'],
        cloud: ['GCP', 'AWS', 'PostgreSQL', 'Redis'],
      },
      education: [
        {
          id: 'edu-new',
          institution: 'University of Washington',
          degree: 'B.S. in Computer Science',
          field: 'Software Engineering',
          graduationYear: '2019',
          location: 'Seattle, WA',
        },
      ],
      projects: [
        {
          id: 'proj-new',
          name: 'CloudScale Micro-Gateway',
          description: 'High throughput request routing proxy with sub-millisecond overhead.',
          tech: ['Go', 'Docker', 'GCP'],
          link: 'github.com/alexchen-dev/gateway',
        },
      ],
      metrics: {
        resumeScore: 91,
        jdMatchRate: 85,
        profileViews: 412,
        aiCredits: 50,
      },
    });

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'generate',
        title: 'New Resume Workspace Initialized',
        time: 'Just now',
        description: 'Initialized new Full Stack Engineer profile template.',
      },
      ...prev,
    ]);

    setActiveTab('studio');
    showToast('New Resume created and opened in 3D Studio!');
  };

  const handleApplyJDMatches = (missingKeywords: string[], matchRate: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        tools: Array.from(new Set([...prev.skills.tools, ...missingKeywords])),
      },
      metrics: {
        ...prev.metrics,
        jdMatchRate: Math.max(prev.metrics.jdMatchRate, matchRate),
        resumeScore: Math.min(100, prev.metrics.resumeScore + 3),
      },
    }));

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'match',
        title: 'Job Description Keywords Merged',
        time: 'Just now',
        description: `Added keywords (${missingKeywords.join(', ')}) to resume skills.`,
      },
      ...prev,
    ]);

    showToast('Keywords automatically integrated into Skills matrix!');
  };

  const handleApplyAIImprovement = (improvedSummary: string) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        summary: improvedSummary,
      },
      metrics: {
        ...prev.metrics,
        resumeScore: Math.min(100, prev.metrics.resumeScore + 4),
      },
    }));

    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        type: 'rewrite',
        title: 'AI Executive Summary Applied',
        time: 'Just now',
        description: 'Updated professional summary based on AI Audit recommendations.',
        quote: `"${improvedSummary.slice(0, 75)}..."`,
      },
      ...prev,
    ]);

    showToast('Executive Summary updated successfully!');
  };

  const handleSaveDraft = async () => {
    try {
      localStorage.setItem('intelliresume_data', JSON.stringify(resumeData));
      localStorage.setItem('intelliresume_activities', JSON.stringify(activities));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }

    try {
      const res = await apiClient.saveResume(resumeData, resumeVersion);
      setResumeVersion(res.version);
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      showToast(`Resume draft saved to cloud storage (v${res.version}).`);
    } catch (err: any) {
      if (err.status === 409 || err.code === 'OPTIMISTIC_CONCURRENCY_CONFLICT') {
        setConflictDetails({
          serverVersion: err.serverVersion || resumeVersion + 1,
          clientVersion: resumeVersion,
        });
        setConflictModalOpen(true);
      } else {
        confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
        showToast('Resume draft state saved to local workspace storage.');
      }
    }
  };

  // Global productivity shortcuts: Ctrl/Cmd+S (Save Draft), Ctrl/Cmd+P (Print)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDraft();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (activeTab === 'studio') {
          e.preventDefault();
          window.print();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumeData, activities, activeTab]);

  // If Auth tab is active or not authenticated, render Auth Portal
  if (!isAuthenticated || activeTab === 'auth') {
    return (
      <AuthPortalView
        onSuccessAuth={() => {
          setIsAuthenticated(true);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resumeData={resumeData}
        toastMessage={toastMessage}
        onNewResume={handleNewResume}
        onOpenAIGenerator={() => setIsAIGenerateOpen(true)}
        onOpenJDMatcher={() => setIsJDModalOpen(true)}
        onOpenAIReview={() => setIsAIReviewOpen(true)}
        onSaveDraft={handleSaveDraft}
      >
        {activeTab === 'dashboard' && (
          <DashboardView
            data={resumeData}
            activities={activities}
            setActiveTab={setActiveTab}
            onOpenJDMatcher={() => setIsJDModalOpen(true)}
            onOpenAIGenerator={() => setIsAIGenerateOpen(true)}
            onNewResume={handleNewResume}
          />
        )}

        {activeTab === 'studio' && (
          <ResumeStudioView
            data={resumeData}
            setData={setResumeData}
            onOpenJDMatcher={() => setIsJDModalOpen(true)}
            onOpenAIReview={() => setIsAIReviewOpen(true)}
            onOpenAIGenerator={() => setIsAIGenerateOpen(true)}
            onSaveDraft={handleSaveDraft}
          />
        )}

        {activeTab === 'chat' && (
          <AIChatView
            resumeData={resumeData}
            onApplyOptionToResume={(text) => {
              setResumeData((prev) => {
                const updatedExp = [...prev.experience];
                if (updatedExp[0]) {
                  updatedExp[0].bullets[0] = text;
                }
                return { ...prev, experience: updatedExp };
              });
              showToast('Applied bullet to Resume experience!');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            data={resumeData}
            onOpenJDMatcher={() => setIsJDModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            resumeData={resumeData}
            onUpdateResumeData={setResumeData}
            onSave={() => showToast('Settings saved successfully.')}
          />
        )}
      </AppShell>

      {/* Modals */}
      <AIGenerateModal
        isOpen={isAIGenerateOpen}
        onClose={() => setIsAIGenerateOpen(false)}
        currentData={resumeData}
        onApplyGeneratedResume={handleApplyGeneratedResume}
      />

      <JDMatcherModal
        isOpen={isJDModalOpen}
        onClose={() => setIsJDModalOpen(false)}
        resumeData={resumeData}
        onApplyMatches={handleApplyJDMatches}
      />

      <AIReviewModal
        isOpen={isAIReviewOpen}
        onClose={() => setIsAIReviewOpen(false)}
        resumeData={resumeData}
        onApplyImprovement={handleApplyAIImprovement}
      />

      {/* Optimistic Concurrency Conflict Resolution Dialog */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-amber-500/30 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Conflicting Update Detected</h3>
                <p className="text-xs text-slate-400">This resume was modified in another tab or session.</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Your local version:</span>
                <span className="text-amber-300">v{conflictDetails?.clientVersion || resumeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Latest server version:</span>
                <span className="text-emerald-400">v{conflictDetails?.serverVersion || resumeVersion + 1}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To prevent silently overwriting external edits, choose how you would like to synchronize:
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={async () => {
                  try {
                    const latest = await apiClient.getResume(resumeData.id);
                    setResumeData(latest.data);
                    setResumeVersion(latest.version);
                    setConflictModalOpen(false);
                    showToast(`Reloaded latest server version (v${latest.version}).`);
                  } catch (e) {
                    setConflictModalOpen(false);
                    showToast('Failed to reload from server; keeping local draft.');
                  }
                }}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🔄 Reload Latest Version
              </button>
              <button
                onClick={async () => {
                  try {
                    const forceVersion = conflictDetails?.serverVersion || resumeVersion + 1;
                    const res = await apiClient.saveResume(resumeData, forceVersion);
                    setResumeVersion(res.version);
                    setConflictModalOpen(false);
                    showToast(`Saved local changes as new version (v${res.version}).`);
                  } catch (e) {
                    setConflictModalOpen(false);
                    showToast('Saved locally.');
                  }
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                💾 Keep Current Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
