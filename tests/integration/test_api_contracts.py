import urllib.request
import urllib.error
import json
import uuid

BFF_URL = "http://localhost:3000"

def post(endpoint, payload):
    req = urllib.request.Request(
        f"{BFF_URL}{endpoint}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Idempotency-Key": f"contract-{uuid.uuid4()}"}
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))

def get(endpoint):
    req = urllib.request.Request(f"{BFF_URL}{endpoint}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8"))

def test_api_contracts():
    print("\n=== [API CONTRACT REGRESSION AUDIT] Verifying 5 AI Endpoints + Health ===")

    # 1. GET /api/health
    h = get("/api/health")
    print("1. GET /api/health:", h)
    assert h["status"] == "ok"
    assert "circuitState" in h

    # 2. POST /api/optimize
    opt = post("/api/optimize", {"text": "Wrote backend APIs", "sectionType": "Experience", "role": "Senior Engineer"})
    print("2. POST /api/optimize: keys =", list(opt.keys()))
    assert "options" in opt and isinstance(opt["options"], list)
    assert len(opt["options"]) > 0
    assert "tag" in opt["options"][0] and "content" in opt["options"][0]

    # 3. POST /api/ai-audit
    resume_sample = {
        "title": "Staff Engineer",
        "personalInfo": {"summary": "Experienced builder", "title": "Staff Engineer"},
        "experience": [{"role": "Architect", "company": "Acme", "bullets": ["Scaled system 5x"]}],
        "skills": {"languages": ["Python", "Go"]},
    }
    audit = post("/api/ai-audit", {"resumeData": resume_sample})
    print("3. POST /api/ai-audit: keys =", list(audit.keys()))
    assert "grade" in audit and "strengths" in audit and "weaknesses" in audit and "suggestedSummary" in audit
    assert isinstance(audit["strengths"], list) and isinstance(audit["weaknesses"], list)

    # 4. POST /api/chat
    chat = post("/api/chat", {"message": "How do I highlight distributed systems?", "resumeContext": {"targetRole": "Platform Architect"}})
    print("4. POST /api/chat: keys =", list(chat.keys()))
    assert "reply" in chat and len(chat["reply"]) > 5

    # 5. POST /api/match-jd
    match = post("/api/match-jd", {"resumeData": resume_sample, "jobDescription": "Looking for Go and Python Kubernetes engineer"})
    print("5. POST /api/match-jd: keys =", list(match.keys()))
    assert "matchScore" in match
    assert "matchedSkills" in match and isinstance(match["matchedSkills"], list)
    assert "missingKeywords" in match and isinstance(match["missingKeywords"], list)

    # 6. POST /api/generate-resume
    gen = post("/api/generate-resume", {"prompt": "Senior Distributed Systems Engineer with 8 years experience"})
    print("6. POST /api/generate-resume: keys =", list(gen.keys()))
    assert "resume" in gen and "personalInfo" in gen["resume"]
    assert "experience" in gen["resume"] and "skills" in gen["resume"]

    print("\n[+] ALL 6 API CONTRACTS 100% VERIFIED AND COMPATIBLE WITH CLIENT SCHEMAS!")

if __name__ == "__main__":
    test_api_contracts()
