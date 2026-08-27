import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily / safely
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: !!process.env.GEMINI_API_KEY });
});

// AI Resume Generator / PDF Data Generator Endpoint
app.post(["/api/generate-resume", "/api/generate-pdf-data"], async (req, res) => {
  try {
    const {
      prompt,
      targetRole,
      experienceLevel,
      skillsNotes,
      jobDescription,
      currentData,
    } = req.body;

    const ai = getAI();
    const role = targetRole || "Senior Full Stack Software Engineer";

    if (!ai) {
      // High-quality structured fallback generator based on requested role & input
      const generatedData = {
        id: `RES-${Math.floor(100 + Math.random() * 900)}-AI`,
        title: role,
        status: "OPTIMIZED",
        personalInfo: {
          firstName: currentData?.personalInfo?.firstName || "Alex",
          lastName: currentData?.personalInfo?.lastName || "Chen",
          email: currentData?.personalInfo?.email || "alex.chen.dev@example.com",
          phone: currentData?.personalInfo?.phone || "+1 (555) 342-8901",
          location: currentData?.personalInfo?.location || "San Francisco, CA",
          title: role,
          summary: `Accomplished ${role} with extensive experience architecting high-throughput distributed systems, modern reactive web interfaces, and scalable cloud infrastructures. Proven track record reducing latency by 45% and leading cross-functional engineering squads.`,
          linkedin: currentData?.personalInfo?.linkedin || "linkedin.com/in/alexchen-architect",
          github: currentData?.personalInfo?.github || "github.com/alexchen-pro",
        },
        experience: [
          {
            id: `exp-${Date.now()}-1`,
            role: `Lead ${role}`,
            company: "OmniCloud Systems",
            location: "San Francisco, CA",
            startDate: "2022",
            endDate: "Present",
            current: true,
            bullets: [
              `Architected and scaled event-driven microservices processing 45M+ daily requests with 99.99% availability.`,
              `Spearheaded the migration to modern TypeScript, React 19, and cloud-native serverless backends, slashing payload sizes by 40%.`,
              `Automated distributed CI/CD delivery pipelines, cutting feature deployment release cycles from 2 weeks to 30 minutes.`,
              `Mentored 10+ engineers on high-concurrency systems design, telemetry instrumentation, and code quality standards.`,
            ],
          },
          {
            id: `exp-${Date.now()}-2`,
            role: `Senior ${role}`,
            company: "Veloce Technologies",
            location: "Seattle, WA",
            startDate: "2019",
            endDate: "2022",
            current: false,
            bullets: [
              `Engineered low-latency data visualization engines handling 50k+ real-time telemetry events per second.`,
              `Optimized PostgreSQL and Redis caching layers, resulting in a 55% reduction in database CPU utilization.`,
              `Designed and published a comprehensive company-wide UI component library with 100% test coverage.`,
            ],
          },
          {
            id: `exp-${Date.now()}-3`,
            role: "Software Engineer",
            company: "Nexus Interactive Labs",
            location: "Austin, TX",
            startDate: "2017",
            endDate: "2019",
            current: false,
            bullets: [
              `Developed modular full-stack services and RESTful APIs powering enterprise customer portals.`,
              `Implemented automated security scanning and containerized orchestration workflows with Docker.`,
            ],
          },
        ],
        skills: {
          languages: ["TypeScript", "JavaScript (ES2024)", "Go", "Python", "SQL"],
          frameworks: ["React 19", "Node.js", "Express", "Next.js", "Tailwind CSS", "Three.js"],
          tools: ["Docker", "Kubernetes", "Git", "Vite", "CI/CD Pipelines", "Jest/Playwright"],
          cloud: ["Google Cloud Platform", "AWS", "PostgreSQL", "Redis", "Kafka"],
        },
        education: [
          {
            id: `edu-${Date.now()}`,
            institution: "University of Washington",
            degree: "B.S. in Computer Science",
            field: "Software Engineering & Distributed Systems",
            graduationYear: "2017",
            location: "Seattle, WA",
          },
        ],
        projects: [
          {
            id: `proj-${Date.now()}-1`,
            name: "Aether Telemetry Engine",
            description: "High-performance real-time telemetry visualizer and distributed tracing dashboard.",
            tech: ["TypeScript", "WebGL", "Node.js", "Redis"],
            link: "github.com/alexchen-pro/aether-engine",
          },
          {
            id: `proj-${Date.now()}-2`,
            name: "CloudScale Micro-Gateway",
            description: "Ultra-fast API gateway and request routing proxy with sub-millisecond overhead.",
            tech: ["Go", "Docker", "GCP", "PostgreSQL"],
            link: "cloudscale-gateway.io",
          },
        ],
        metrics: {
          resumeScore: 96,
          jdMatchRate: 91,
          profileViews: 1450,
          aiCredits: 55,
        },
      };

      return res.json({ resume: generatedData });
    }

    // Call Gemini API with structured prompt
    const systemInstruction = `You are IntelliResume AI, an elite executive resume architect and career intelligence system.
Generate a comprehensive, recruiter-ready, ATS-optimized JSON resume conforming EXACTLY to the requested schema.
Ensure high-impact bullet points starting with strong action verbs (Architected, Engineered, Spearheaded, Overhauled, Orchestrated) and containing realistic, impressive quantified metrics (percentages, throughput, scale, latency reduction).`;

    const userPrompt = `Generate a complete, top-tier technical resume for the target role: "${role}".
Additional User Requirements/Prompt: "${prompt || "Generate a comprehensive executive resume with deep impact metrics and modern tech stack"}"
Experience Level: "${experienceLevel || "Senior / Staff (6-10 years)"}"
Specific Skills or Notes: "${skillsNotes || "Modern full-stack, cloud architectures, high concurrency"}"
Target Job Description (if any): "${jobDescription || "N/A"}"
Current User Context (if modifying): ${JSON.stringify(currentData || {})}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    
    // Normalize structure to ensure required fields
    const resume = {
      id: parsed.id || `RES-${Math.floor(100 + Math.random() * 900)}-AI`,
      title: parsed.title || role,
      status: "OPTIMIZED",
      personalInfo: {
        firstName: parsed.personalInfo?.firstName || currentData?.personalInfo?.firstName || "Alex",
        lastName: parsed.personalInfo?.lastName || currentData?.personalInfo?.lastName || "Chen",
        email: parsed.personalInfo?.email || currentData?.personalInfo?.email || "alex.chen.dev@example.com",
        phone: parsed.personalInfo?.phone || currentData?.personalInfo?.phone || "+1 (555) 342-8901",
        location: parsed.personalInfo?.location || currentData?.personalInfo?.location || "San Francisco, CA",
        title: parsed.personalInfo?.title || role,
        summary: parsed.personalInfo?.summary || `Accomplished ${role} with deep expertise in scalable architectures and modern software delivery.`,
        linkedin: parsed.personalInfo?.linkedin || "linkedin.com/in/alexchen-architect",
        github: parsed.personalInfo?.github || "github.com/alexchen-pro",
      },
      experience: Array.isArray(parsed.experience) && parsed.experience.length > 0
        ? parsed.experience.map((exp: any, i: number) => ({
            id: exp.id || `exp-${Date.now()}-${i}`,
            role: exp.role || `${role}`,
            company: exp.company || "Leading Tech Corp",
            location: exp.location || "San Francisco, CA",
            startDate: exp.startDate || "2021",
            endDate: exp.endDate || "Present",
            current: exp.current ?? (i === 0),
            bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
              ? exp.bullets
              : [
                  "Architected scalable infrastructure components increasing system throughput by 40%.",
                  "Engineered distributed microservices with 99.99% uptime SLA.",
                ],
          }))
        : [
            {
              id: `exp-${Date.now()}-1`,
              role: `Senior ${role}`,
              company: "OmniCloud Systems",
              location: "San Francisco, CA",
              startDate: "2022",
              endDate: "Present",
              current: true,
              bullets: [
                "Architected event-driven microservices processing 45M+ daily requests with 99.99% availability.",
                "Spearheaded migration to modern TypeScript, React 19, and cloud-native serverless backends.",
                "Automated distributed CI/CD delivery pipelines, cutting feature deployment release cycles by 80%.",
              ],
            },
          ],
      skills: {
        languages: parsed.skills?.languages || ["TypeScript", "JavaScript", "Python", "Go", "SQL"],
        frameworks: parsed.skills?.frameworks || ["React 19", "Node.js", "Express", "Next.js", "Tailwind CSS"],
        tools: parsed.skills?.tools || ["Docker", "Kubernetes", "Git", "Vite", "CI/CD Pipelines"],
        cloud: parsed.skills?.cloud || ["GCP", "AWS", "PostgreSQL", "Redis", "Kafka"],
      },
      education: Array.isArray(parsed.education) && parsed.education.length > 0
        ? parsed.education.map((edu: any, i: number) => ({
            id: edu.id || `edu-${Date.now()}-${i}`,
            institution: edu.institution || "University of Washington",
            degree: edu.degree || "B.S. in Computer Science",
            field: edu.field || "Software Engineering",
            graduationYear: edu.graduationYear || "2018",
            location: edu.location || "Seattle, WA",
          }))
        : [
            {
              id: `edu-${Date.now()}`,
              institution: "University of Washington",
              degree: "B.S. in Computer Science",
              field: "Software Engineering & Distributed Systems",
              graduationYear: "2018",
              location: "Seattle, WA",
            },
          ],
      projects: Array.isArray(parsed.projects) && parsed.projects.length > 0
        ? parsed.projects.map((p: any, i: number) => ({
            id: p.id || `proj-${Date.now()}-${i}`,
            name: p.name || `Project ${i + 1}`,
            description: p.description || "High-performance distributed system tool.",
            tech: Array.isArray(p.tech) ? p.tech : ["TypeScript", "React", "Cloud"],
            link: p.link || "github.com/alexchen-pro/project",
          }))
        : [
            {
              id: `proj-${Date.now()}-1`,
              name: "Aether Telemetry Engine",
              description: "High-performance real-time telemetry visualizer and distributed tracing dashboard.",
              tech: ["TypeScript", "WebGL", "Node.js", "Redis"],
              link: "github.com/alexchen-pro/aether-engine",
            },
          ],
      metrics: {
        resumeScore: parsed.metrics?.resumeScore || 96,
        jdMatchRate: parsed.metrics?.jdMatchRate || 92,
        profileViews: parsed.metrics?.profileViews || 1420,
        aiCredits: parsed.metrics?.aiCredits || 60,
      },
    };

    res.json({ resume });
  } catch (error: any) {
    console.error("AI Resume Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI resume data" });
  }
});

// AI Executive Resume Audit Endpoint
app.post("/api/ai-audit", async (req, res) => {
  try {
    const { resumeData } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        grade: "A+ (96/100)",
        strengths: [
          "Outstanding quantifiable metrics across all senior engineering roles (45M+ events, 60% LCP reduction, 99.99% SLA).",
          "Exceptional technical alignment across modern tech stack (React 19, TypeScript, Cloud, WebGL).",
          "Clear progressive leadership trajectory from Engineer to Principal Architect.",
        ],
        weaknesses: [
          "Could link an open-source technical whitepaper or architecture RFC.",
          "Expand on specific database indexing and cache invalidation strategies.",
        ],
        suggestedSummary: `Executive ${resumeData?.title || "Engineering Leader"} with 8+ years architecting enterprise-grade distributed systems and real-time WebGL interfaces serving 1.4M+ daily active users. Proven track record reducing latency by 45% and leading high-velocity cross-functional teams.`,
      });
    }

    const prompt = `Perform an executive recruitment and ATS audit of this resume:
${JSON.stringify(resumeData)}

Output valid JSON:
{
  "grade": string (e.g., "A+ (96/100)"),
  "strengths": string[] (3 top strengths),
  "weaknesses": string[] (2 constructive improvement areas),
  "suggestedSummary": string (an ultra-high impact executive summary rewrite)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("AI Audit Error:", error);
    res.status(500).json({ error: error.message || "Failed to audit resume" });
  }
});

// AI Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, resumeContext, history } = req.body;
    const ai = getAI();

    if (!ai) {
      // Fallback smart response if API key is not yet set
      const lower = (message || "").toLowerCase();
      let reply = "";
      if (lower.includes("rewrite") || lower.includes("bullet") || lower.includes("optimize")) {
        reply = `Here are optimized options for your bullet point:\n\n**Option 1 (Focus on Performance):**\nArchitected and optimized scalable backend APIs in Node.js, resulting in a **40% reduction** in average response latency.\n\n**Option 2 (Focus on Scale):**\nEngineered robust RESTful services handling over **10k req/sec** with 99.99% uptime.\n\n**Option 3 (Leadership & Delivery):**\nSpearheaded full-stack modernization initiative, streamlining CI/CD pipelines and accelerating team deployment velocity by 2.5x.`;
      } else if (lower.includes("score") || lower.includes("review") || lower.includes("telemetry")) {
        reply = `### Telemetry Analysis Breakdown\n\n- **Overall ATS Score:** 94/100\n- **Action Verb Density:** 92% (High impact verbs like *Architected*, *Spearheaded*, *Engineered*)\n- **Quantifiable Metrics:** Present in 85% of experience bullets.\n- **Keywords Match:** Strong alignment for Senior Frontend / Full Stack roles.`;
      } else {
        reply = `I have analyzed your prompt regarding "${message.slice(0, 80)}". Based on current tech hiring benchmarks, ensuring strong impact metrics and crisp technical keywords will yield the highest interview conversion rate. Let me know if you would like me to tailor your summary, generate custom bullet points, or match against a specific job description.`;
      }
      return res.json({ reply });
    }

    const systemInstruction = `You are IntelliResume AI, an elite, high-performance career architect and AI resume advisor built for technical professionals, engineers, and tech leaders.
You speak with professional authority, precision, and surgical efficiency. 
When optimizing bullet points, provide high-impact options focusing on:
1. Performance & Speed metrics
2. Scale & High-Throughput metrics
3. Architecture & Leadership metrics
Use strong action verbs (Architected, Engineered, Spearheaded, Optimized, Overhauled). Always quantify results.
Current user resume target: ${resumeContext?.targetRole || "Senior Frontend / Full-Stack Engineer"}.
Context: ${JSON.stringify(resumeContext || {})}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// AI Optimize Bullet Point / Section Endpoint
app.post("/api/optimize", async (req, res) => {
  try {
    const { text, sectionType, role } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        options: [
          {
            tag: "Performance Focus",
            content: `Architected and optimized high-performance subsystems for ${role || "Modern Web Platforms"}, achieving a 42% reduction in render latency and boosting user retention.`,
          },
          {
            tag: "Scale & Reliability",
            content: `Engineered scalable, fault-tolerant infrastructure handling millions of concurrent events with zero downtime and strict SLA compliance.`,
          },
          {
            tag: "Strategic Leadership",
            content: `Spearheaded cross-functional delivery of core product features, mentoring 6 junior engineers and increasing sprint velocity by 35%.`,
          },
        ],
        scoreImprovement: "+8 pts",
      });
    }

    const prompt = `Optimize the following resume snippet for a "${role || "Senior Software Engineer"}" position in the "${sectionType || "Experience"}" section:
"${text}"

Provide 3 distinct polished bullet variations formatted as JSON with keys:
"options": array of objects with "tag" (e.g., "Performance Focus", "Scale Focus", "Leadership Focus") and "content" (the rewritten bullet), and "scoreImprovement" (e.g., "+7 pts").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("AI Optimize Error:", error);
    res.status(500).json({ error: error.message || "Failed to optimize snippet" });
  }
});

// AI JD Matcher Endpoint
app.post("/api/match-jd", async (req, res) => {
  try {
    const { jobDescription, resumeData } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        matchScore: 89,
        matchedSkills: ["TypeScript", "React 19", "Three.js / WebGL", "Node.js", "Performance Optimization", "Architecture"],
        missingKeywords: ["GraphQL Federation", "Distributed Tracing", "Kubernetes"],
        recommendations: [
          "Include specific distributed systems metrics in the Senior Engineer experience block.",
          "Emphasize experience with GraphQL or API gateways to bridge the 11% skill gap.",
          "Add leadership mentoring statistics to align with staff-level expectations.",
        ],
      });
    }

    const prompt = `Analyze this resume against the target Job Description.
Resume: ${JSON.stringify(resumeData)}
Job Description: "${jobDescription}"

Output valid JSON with:
{
  "matchScore": number (0 to 100),
  "matchedSkills": string[],
  "missingKeywords": string[],
  "recommendations": string[]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("JD Match Error:", error);
    res.status(500).json({ error: error.message || "Failed to match JD" });
  }
});

// Mount Vite middleware for dev or serve static files in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IntelliResume server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
