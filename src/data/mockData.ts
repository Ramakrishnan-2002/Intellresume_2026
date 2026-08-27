import { ResumeData, ActivityItem, ChatMessage } from '../types';

export const initialResumeData: ResumeData = {
  id: 'RES-992-A',
  title: 'Senior Frontend Engineer',
  status: 'DRAFT',
  personalInfo: {
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    title: 'Senior Frontend Architect',
    summary: 'Results-driven engineering leader with 8+ years architecting scalable web applications, real-time distributed interfaces, and high-performance WebGL/React ecosystems.',
    linkedin: 'linkedin.com/in/alexchen-eng',
    github: 'github.com/alexchen-dev',
  },
  experience: [
    {
      id: 'exp-1',
      role: 'Staff Frontend Engineer',
      company: 'OmniCloud Technologies',
      location: 'San Francisco, CA',
      startDate: '2022',
      endDate: 'Present',
      current: true,
      bullets: [
        'Architected and deployed modern micro-frontend ecosystem serving 1.4M+ daily active enterprise users.',
        'Engineered high-frequency real-time WebSocket state management pipeline reducing client sync latency by 45%.',
        'Spearheaded performance overhaul reducing initial LCP by 60% and bundle payload by 320KB across core workflows.',
        'Mentored 12 mid-level and junior engineers across design systems, TypeScript strict typing, and automated testing.'
      ]
    },
    {
      id: 'exp-2',
      role: 'Senior Software Engineer',
      company: 'Veloce Data Systems',
      location: 'Seattle, WA',
      startDate: '2019',
      endDate: '2022',
      current: false,
      bullets: [
        'Led core dashboard development in React 18, WebGL, and Tailwind CSS, increasing data throughput visualization 3x.',
        'Built reusable atomic design token system adopted across 8 internal engineering teams.',
        'Automated CI/CD performance testing and regression benchmarks, reducing deployment failures by 38%.'
      ]
    },
    {
      id: 'exp-3',
      role: 'Frontend Software Engineer',
      company: 'Nexus Interactive',
      location: 'Austin, TX',
      startDate: '2017',
      endDate: '2019',
      current: false,
      bullets: [
        'Developed interactive analytics components using D3.js and modern SVG rendering pipeline.',
        'Optimized client-side caching strategies using IndexedDB and Service Workers for offline-first capabilities.'
      ]
    }
  ],
  skills: {
    languages: ['TypeScript', 'JavaScript (ES2024)', 'HTML5 / CSS3', 'Python', 'SQL'],
    frameworks: ['React 19', 'Next.js', 'Tailwind CSS', 'Three.js / WebGL', 'Node.js', 'Express', 'Vite'],
    tools: ['Docker', 'Git', 'Webpack / Vite', 'Jest', 'Playwright', 'Figma', 'CI/CD Pipelines'],
    cloud: ['Google Cloud Platform', 'AWS (S3, CloudFront)', 'Firebase', 'Vercel', 'PostgreSQL']
  },
  education: [
    {
      id: 'edu-1',
      institution: 'University of Washington',
      degree: 'B.S. in Computer Science',
      field: 'Software Engineering & Human-Computer Interaction',
      graduationYear: '2017',
      location: 'Seattle, WA'
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Aether 3D Canvas Engine',
      description: 'Open-source WebGL/Three.js shader preview tool with real-time GLSL compiler and hot-swapping textures.',
      tech: ['TypeScript', 'Three.js', 'GLSL', 'Vite'],
      link: 'github.com/alexchen-dev/aether-engine'
    },
    {
      id: 'proj-2',
      name: 'TelemetryFlow ATS Optimizer',
      description: 'Automated semantic parser analyzing keyword density and role alignment for tech resumes.',
      tech: ['React', 'Node.js', 'Gemini API', 'Tailwind CSS'],
      link: 'telemetryflow.dev'
    }
  ],
  metrics: {
    resumeScore: 94,
    jdMatchRate: 87,
    profileViews: 1204,
    aiCredits: 45
  }
};

export const initialActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'rewrite',
    title: 'AI Rewrite: Summary Section',
    time: '10:24 AM',
    description: 'Optimized professional summary for "Senior Software Engineer" role.',
    quote: '"Results-driven engineering leader with 8+ years architecting scalable..."'
  },
  {
    id: 'act-2',
    type: 'generate',
    title: 'New Resume Generated',
    time: 'Yesterday',
    description: 'Generated specific version for Google - Full Stack Dev.'
  },
  {
    id: 'act-3',
    type: 'parse',
    title: 'Master Resume Parsed',
    time: 'Oct 12',
    description: 'Successfully imported and categorized data from LinkedIn PDF.'
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: `Welcome back! I've reviewed your current resume profile. It looks like you're targeting **Senior Software Engineer** roles.\n\nHow can I assist you today? We can optimize your bullet points, generate a tailored cover letter, or analyze your skills against a specific job description.`,
    timestamp: '10:20 AM'
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: `Can you help me rewrite this bullet point to be more impactful? "Worked on backend APIs using Node.js and improved speed."`,
    timestamp: '10:22 AM'
  },
  {
    id: 'msg-3',
    sender: 'ai',
    text: `Absolutely. To make it more impactful, we should use stronger action verbs and quantify the results if possible. Here are a few options based on common engineering metrics:`,
    timestamp: '10:24 AM',
    options: [
      {
        tag: 'Option 1 (Focus on performance)',
        content: `**Architected and optimized** scalable backend APIs utilizing **Node.js**, resulting in a **40% reduction** in average response time.`
      },
      {
        tag: 'Option 2 (Focus on scale)',
        content: `**Engineered** robust RESTful APIs in **Node.js** to support high-throughput data processing, handling over **10K requests/second**.`
      }
    ]
  }
];

export const avatarUrls = {
  user1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGanUMQVEzLJBU_ceSwIbjSb4Qq-4w1nIx9dQusYXEKLuXIGopvRl7klFwztY5N7M0b4yJVLo0ayqReEHk7yGg0M0Z8yxK1RKjAOwlu-Iylucp0qEQMi9nwn-CMV7MxEHTb7VNehTyyIs70oexHUXn-SBi5g5WWxYBBsx2k-Kh99HXgW4nDrsNaeXQB6ZGDfvIOk2VKQDBXNZvXXu1Y-Adr0ZNNwk2CXgI4-7ucsNCR98swlEFT-n3oQ',
  user2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB99sO0dpfY_ktAxkV1egvjdivRTXGevowWsDj-bOd7Pr2sRBi-aPkCLjUFTooyfAw4NMS8-wd60wGebw4mmnEks3pBsIr4zLVqkV7k168CHcHsrqW2c9nj_t4Vv0gl2B7XXYfCP5R4zycdESgiwgQmuZIkcUzV4aoM5ec7SzXllefNyATvhqhNBpMKR4zZMa1yYOwUPwyJwK-WrnRVrimWYFyLjdFLDXReDfLq4_cYY3ZrjEJ4WpAfrg',
  user3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoW0lJ3ge8R4QSgwtMR_NjslSE31aNKL8XPM7N0SxbXAux74Y4k2Bxw_KzzG6t7eraHZqYIdn9P4QG8IWDoQL0qN4dONjMljbLwZuSQZNOz4RyaKrxE3ZHDkm9kKZF2jhci9ADJ0FujD66sF3uQ13PI1xBL4I0_ZQJNmDMVlJVKpygVaH6WNHPqxHGdm8f1mMu3g-fOBENr_BcrNzKe3UX7iLGrj4O8kOgqpFytkQsNVgHDKQONNrfDg',
  user4: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArK3rln2SiZszDI1ijjPKBxGrOrlpSYBg9MOVfvP6gdq83ukEVcb__4U9NbyKXclXw6hQgqBo_M7U554jrqbNEBcY963JVk6RhhfnWaSMD3ixOlDeXj63QpT2LPNtGfQo1BpdnreDRqYD4hD2Z4CzdoLuWbx4Rq1cRTH7_O281p_w8GX2mdjR1L6DY8V1WU49z2A8HsKkQx8tR85xvbM5o_V5fiuvOBV_8jVI-NJ8zGKXJbXgbKD4hdQ',
};
