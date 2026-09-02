import { ResumeData } from '../types';

export interface GenerateResumeRequest {
  targetRole: string;
  experienceLevel: string;
  prompt?: string;
  skillsNotes?: string;
  jobDescription?: string;
  currentData?: ResumeData;
}

export interface GenerateResumeResponse {
  resume: ResumeData;
  error?: string;
}

export interface AIAuditRequest {
  resumeData: ResumeData;
}

export interface AIAuditResponse {
  grade: string;
  strengths: string[];
  weaknesses: string[];
  suggestedSummary: string;
  error?: string;
}

export interface ChatRequest {
  message: string;
  resumeContext?: {
    targetRole?: string;
    currentSummary?: string;
    recentRole?: string;
    skills?: ResumeData['skills'];
  };
  history?: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[];
}

export interface ChatResponse {
  reply: string;
  error?: string;
}

export interface OptimizeRequest {
  text: string;
  sectionType: string;
  role: string;
}

export interface OptimizeOption {
  tag: string;
  content: string;
  scoreImprovement?: string;
}

export interface OptimizeResponse {
  options: OptimizeOption[];
  scoreImprovement?: string;
  error?: string;
}

export interface MatchJDRequest {
  jobDescription: string;
  resumeData: {
    title?: string;
    summary?: string;
    skills?: ResumeData['skills'];
    experience?: ResumeData['experience'];
  };
}

export interface MatchJDResponse {
  matchScore: number;
  matchedSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
  error?: string;
}

export interface HealthResponse {
  status: string;
  aiConfigured: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Empty baseUrl uses relative paths in browser, reaching the Express/Vite BFF server
    this.baseUrl = '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
          else if (errorData.detail) errorMessage = errorData.detail;
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${endpoint} timed out after ${timeoutMs / 1000}s`);
      }
      throw error;
    }
  }

  /**
   * Health check for AI configuration and backend availability
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health', { method: 'GET' }, 8000);
  }

  /**
   * Generate full structured resume using Gemini
   */
  async generateResume(payload: GenerateResumeRequest): Promise<GenerateResumeResponse> {
    return this.request<GenerateResumeResponse>('/api/generate-resume', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 45000);
  }

  /**
   * Run executive ATS & recruiter audit on resume data
   */
  async auditResume(payload: AIAuditRequest): Promise<AIAuditResponse> {
    return this.request<AIAuditResponse>('/api/ai-audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 35000);
  }

  /**
   * Conversational career coach with resume context and multi-turn history
   */
  async chatWithCoach(payload: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 35000);
  }

  /**
   * Optimize a single bullet point or summary with quantifiable impact
   */
  async optimizeContent(payload: OptimizeRequest): Promise<OptimizeResponse> {
    return this.request<OptimizeResponse>('/api/optimize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 25000);
  }

  /**
   * Match resume against job description to extract gaps and calculate ATS alignment
   */
  async matchJobDescription(payload: MatchJDRequest): Promise<MatchJDResponse> {
    return this.request<MatchJDResponse>('/api/match-jd', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 35000);
  }
}

export const apiClient = new ApiService();
