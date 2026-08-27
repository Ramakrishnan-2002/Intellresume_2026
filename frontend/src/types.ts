export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  location?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  tech: string[];
  link?: string;
}

export interface ResumeData {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPTIMIZED' | 'PUBLISHED';
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    cloud: string[];
  };
  education: EducationItem[];
  projects: ProjectItem[];
  metrics: {
    resumeScore: number;
    jdMatchRate: number;
    profileViews: number;
    aiCredits: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  options?: {
    tag: string;
    content: string;
  }[];
}

export interface ActivityItem {
  id: string;
  type: 'rewrite' | 'generate' | 'parse' | 'match';
  title: string;
  time: string;
  description: string;
  quote?: string;
}

export type ActiveTab = 'dashboard' | 'studio' | 'chat' | 'analytics' | 'settings' | 'auth';
