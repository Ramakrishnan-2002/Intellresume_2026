from typing import Optional, List
from pydantic import BaseModel, EmailStr

# ─── Auth ───────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ─── Resume Data (matches frontend types.ts) ────────────

class PersonalInfo(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    location: str
    title: str
    summary: str
    website: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None

class ExperienceItem(BaseModel):
    id: str
    role: str
    company: str
    location: str
    startDate: str
    endDate: str
    current: bool
    bullets: List[str]

class EducationItem(BaseModel):
    id: str
    institution: str
    degree: str
    field: str
    graduationYear: str
    location: Optional[str] = None

class ProjectItem(BaseModel):
    id: str
    name: str
    description: str
    tech: List[str]
    link: Optional[str] = None

class Skills(BaseModel):
    languages: List[str]
    frameworks: List[str]
    tools: List[str]
    cloud: List[str]

class Metrics(BaseModel):
    resumeScore: int
    jdMatchRate: int
    profileViews: int
    aiCredits: int

class ResumeData(BaseModel):
    id: str
    title: str
    status: str  # DRAFT | OPTIMIZED | PUBLISHED
    personalInfo: PersonalInfo
    experience: List[ExperienceItem]
    skills: Skills
    education: List[EducationItem]
    projects: List[ProjectItem]
    metrics: Metrics

# ─── API Request / Response models ──────────────────────

class GenerateResumeRequest(BaseModel):
    prompt: Optional[str] = None
    targetRole: Optional[str] = None
    experienceLevel: Optional[str] = None
    skillsNotes: Optional[str] = None
    jobDescription: Optional[str] = None
    currentData: Optional[ResumeData] = None

class GenerateResumeResponse(BaseModel):
    resume: ResumeData
    source: Optional[str] = None  # "gemini" | "fallback" | None
    fallback: Optional[bool] = None  # backward compat with frontend
    reason: Optional[str] = None     # backward compat: why fallback

class AIAuditRequest(BaseModel):
    resumeData: dict  # Accept partial resume data for audit

class AIAuditResponse(BaseModel):
    grade: str
    strengths: List[str]
    weaknesses: List[str]
    suggestedSummary: str
    source: Optional[str] = None
    fallback: Optional[bool] = None

class ChatRequest(BaseModel):
    message: str
    resumeContext: Optional[dict] = None
    history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    reply: str
    source: Optional[str] = None
    fallback: Optional[bool] = None

class OptimizeRequest(BaseModel):
    text: str
    sectionType: Optional[str] = None
    role: Optional[str] = None

class OptimizeOption(BaseModel):
    tag: str
    content: str

class OptimizeResponse(BaseModel):
    options: List[OptimizeOption]
    scoreImprovement: str
    source: Optional[str] = None
    fallback: Optional[bool] = None

class MatchJDRequest(BaseModel):
    jobDescription: str
    resumeData: dict  # partial resume data

class MatchJDResponse(BaseModel):
    matchScore: int
    matchedSkills: List[str]
    missingKeywords: List[str]
    recommendations: List[str]
    source: Optional[str] = None
    fallback: Optional[bool] = None

class HealthResponse(BaseModel):
    status: str
    aiConfigured: bool
    circuitState: Optional[str] = None
    source: Optional[str] = None

class ResumeSaveRequest(BaseModel):
    title: str
    status: Optional[str] = "DRAFT"
    data: ResumeData
    version: int = 1  # Client expected version for OCC

class ResumeRecordOut(BaseModel):
    id: int
    user_id: int
    resume_id: str
    title: str
    status: str
    data: ResumeData
    version: int
    class Config:
        from_attributes = True

class ResumeListItem(BaseModel):
    id: int
    resume_id: str
    title: str
    status: str
    version: int
    class Config:
        from_attributes = True
