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

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('intelliresume_data', JSON.stringify(resumeData));
      localStorage.setItem('intelliresume_activities', JSON.stringify(activities));
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
      showToast('Resume draft state saved to workspace storage.');
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
      showToast('Resume draft state updated.');
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
    </>
  );
}
