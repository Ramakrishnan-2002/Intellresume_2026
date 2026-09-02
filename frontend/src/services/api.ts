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
  fallback?: boolean;
  reason?: string;
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
  fallback?: boolean;
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
  fallback?: boolean;
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
  fallback?: boolean;
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
  fallback?: boolean;
  error?: string;
}

export interface HealthResponse {
  status: string;
  aiConfigured: boolean;
  circuitState?: string;
  redis?: string;
  backend?: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  retryAfterSeconds?: number;
  serverVersion?: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '';
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestId = this.generateUUID();
    const isMutation = ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
      ...(options.headers as Record<string, string>),
    };

    // Auto-generate Idempotency-Key for mutating requests if not explicitly passed
    if (isMutation && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = `idemp-${requestId}`;
    }

    // Attach JWT bearer token if available
    try {
      const token = localStorage.getItem('intelliresume_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // localStorage may not be available in SSR
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        let errorCode = 'UNKNOWN_ERROR';
        let serverVersion: number | undefined;

        try {
          const errorData = await response.json();
          if (typeof errorData.detail === 'object' && errorData.detail !== null) {
            errorMessage = errorData.detail.message || errorMessage;
            errorCode = errorData.detail.error || errorCode;
            serverVersion = errorData.detail.serverVersion;
          } else if (errorData.message) {
            errorMessage = errorData.message;
            errorCode = errorData.error || errorCode;
          } else if (errorData.error) {
            errorMessage = errorData.error;
            errorCode = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Response was not JSON
        }

        const err = new Error(errorMessage) as ApiError;
        err.status = response.status;
        err.code = errorCode;
        err.serverVersion = serverVersion;

        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          err.retryAfterSeconds = parseInt(retryAfter, 10);
        }

        throw err;
      }

      return (await response.json()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const timeoutErr = new Error(`Request to ${endpoint} timed out after ${timeoutMs / 1000}s`) as ApiError;
        timeoutErr.status = 504;
        timeoutErr.code = 'CLIENT_TIMEOUT';
        throw timeoutErr;
      }
      throw error;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health/ready', { method: 'GET' }, 8000);
  }

  async generateResume(payload: GenerateResumeRequest, idempotencyKey?: string): Promise<GenerateResumeResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    return this.request<GenerateResumeResponse>('/api/generate-resume', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }, 45000);
  }

  async auditResume(payload: AIAuditRequest): Promise<AIAuditResponse> {
    return this.request<AIAuditResponse>('/api/ai-audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 35000);
  }

  async chatWithCoach(payload: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 35000);
  }

  async optimizeContent(payload: OptimizeRequest): Promise<OptimizeResponse> {
    return this.request<OptimizeResponse>('/api/optimize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 25000);
  }

  async matchJobDescription(payload: MatchJDRequest): Promise<MatchJDResponse> {
    return this.request<MatchJDResponse>('/api/match-jd', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, 35000);
  }

  // Authoritative Backend Persistence Methods
  async saveResume(resumeData: ResumeData, version = 1): Promise<{ version: number; resume: ResumeData }> {
    return this.request<{ version: number; resume: ResumeData }>(`/api/resumes/${resumeData.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: resumeData.title,
        status: resumeData.status,
        data: resumeData,
        version,
      }),
    });
  }

  async getResume(resumeId: string): Promise<{ version: number; data: ResumeData }> {
    return this.request<{ version: number; data: ResumeData }>(`/api/resumes/${resumeId}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiService();
