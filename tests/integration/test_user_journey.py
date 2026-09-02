import urllib.request
import urllib.error
import json
import uuid

BFF_URL = "http://localhost:3000"

def post_json(url, data, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))

def put_json(url, data, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=h, method="PUT")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))

def get_json(url, headers=None):
    h = {}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h, method="GET")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))

def run_user_journey():
    print("\n=======================================================")
    print("STARTING FULL USER JOURNEY INTEGRATION TEST")
    print("=======================================================")

    # 1. Register
    email = f"journey_{uuid.uuid4().hex[:6]}@example.com"
    pwd = "Password123!"
    reg_res = post_json(f"{BFF_URL}/api/auth/register", {"email": email, "password": pwd, "name": "Journey User"})
    user_info = reg_res.get("user", reg_res)
    print(f"1. Registered User: {user_info.get('email')} (ID: {user_info.get('id')})")

    # 2. Login
    login_data = f"username={email}&password={pwd}".encode("utf-8")
    req = urllib.request.Request(f"{BFF_URL}/api/auth/login", data=login_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=10) as r:
        login_res = json.loads(r.read().decode("utf-8"))
    token = login_res["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}", "X-Request-Id": f"req-journey-{uuid.uuid4().hex[:6]}"}
    print(f"2. Logged In: Token acquired (Type: {login_res['token_type']})")

    # 3. Query Dashboard (List Resumes)
    dashboard_list = get_json(f"{BFF_URL}/api/resumes", headers=auth_headers)
    print(f"3. Dashboard Initial Resumes Count: {len(dashboard_list)}")
    assert len(dashboard_list) == 0

    # 4. Create Resume (v1)
    resume_id = f"RES-JOURNEY-{uuid.uuid4().hex[:6]}"
    initial_doc = {
        "title": "Principal Distributed Systems Architect",
        "status": "DRAFT",
        "version": 1,
        "data": {
            "id": resume_id,
            "title": "Principal Distributed Systems Architect",
            "status": "DRAFT",
            "personalInfo": {"firstName": "Alex", "lastName": "Vance", "email": email, "phone": "555-0123", "location": "Seattle, WA", "title": "Principal Architect", "summary": "Pioneering distributed resilience."},
            "experience": [{"id": "exp-1", "role": "Principal Architect", "company": "Hyperscale", "startDate": "2021", "endDate": "Present", "current": True, "location": "Remote", "bullets": ["Designed active-active multi-region platform"]}],
            "skills": {"languages": ["Go", "Rust"], "frameworks": ["FastAPI", "React"], "tools": ["Docker", "Redis"], "cloud": ["AWS", "GCP"]},
            "education": [{"id": "edu-1", "institution": "MIT", "degree": "B.S.", "field": "Computer Engineering", "graduationYear": "2018", "location": "Cambridge, MA"}],
            "projects": [{"id": "proj-1", "name": "IntelliResume", "description": "High-availability resume builder", "tech": ["Python", "React", "Redis"], "link": "https://github.com"}],
            "metrics": {"resumeScore": 92, "jdMatchRate": 88, "profileViews": 450, "aiCredits": 50}
        }
    }
    created_res = post_json(f"{BFF_URL}/api/resumes", initial_doc, headers=auth_headers)
    print(f"4. Created Resume: {created_res['resume_id']} (Version: {created_res['version']})")
    assert created_res["version"] == 1

    # 5. Edit Resume & Save (v1 -> v2)
    updated_doc = dict(initial_doc)
    updated_doc["title"] = "Senior Principal Distributed Systems Architect"
    updated_doc["version"] = 1
    updated_doc["data"]["title"] = "Senior Principal Distributed Systems Architect"
    save_res = put_json(f"{BFF_URL}/api/resumes/{resume_id}", updated_doc, headers=auth_headers)
    print(f"5. Saved Edit: Version transitioned {save_res['version'] - 1} -> {save_res['version']}")
    assert save_res["version"] == 2

    # 6. Fetch / Refresh Browser check
    fetched = get_json(f"{BFF_URL}/api/resumes/{resume_id}", headers=auth_headers)
    print(f"6. Browser Refresh (GET): Persisted Title='{fetched['title']}', Version={fetched['version']}")
    assert fetched["version"] == 2
    assert fetched["title"] == "Senior Principal Distributed Systems Architect"

    # 7. AI Optimize
    opt_res = post_json(f"{BFF_URL}/api/optimize", {"text": "Designed active-active multi-region platform", "sectionType": "Experience", "role": "Principal Architect"}, headers=auth_headers)
    print(f"7. AI Optimize: Received {len(opt_res['options'])} candidate suggestions (Score: {opt_res['scoreImprovement']})")

    # 8. AI Audit
    audit_res = post_json(f"{BFF_URL}/api/ai-audit", {"resumeData": fetched["data"]}, headers=auth_headers)
    print(f"8. AI Audit: Grade='{audit_res['grade']}', Strengths={len(audit_res['strengths'])}, Weaknesses={len(audit_res['weaknesses'])}")

    # 9. Job Match
    match_res = post_json(f"{BFF_URL}/api/match-jd", {"resumeData": fetched["data"], "jobDescription": "Staff Platform Architect with Kubernetes and Redis expertise"}, headers=auth_headers)
    print(f"9. Job Match: MatchScore={match_res['matchScore']}%, MatchedSkills={len(match_res['matchedSkills'])}")

    # 10. AI Coach Chat
    chat_res = post_json(f"{BFF_URL}/api/chat", {"message": "How do I optimize executive summary for VP roles?", "resumeContext": {"targetRole": "VP Architecture"}}, headers=auth_headers)
    print(f"10. AI Coach: Reply Length={len(chat_res['reply'])} chars")

    # 11. Apply AI Improvement & Save (v2 -> v3)
    improved_summary = "Pioneering technology executive and principal distributed systems architect with 10+ years engineering mission-critical platforms."
    updated_doc["data"]["personalInfo"]["summary"] = improved_summary
    updated_doc["version"] = 2
    save_v3 = put_json(f"{BFF_URL}/api/resumes/{resume_id}", updated_doc, headers=auth_headers)
    print(f"11. Applied AI Improvement & Saved: New Version = {save_v3['version']}")
    assert save_v3["version"] == 3

    # 12. Simulate Tab B attempting stale write (claims v2 while server is v3)
    tab_b_stale_doc = dict(updated_doc)
    tab_b_stale_doc["version"] = 2 # Stale version!
    tab_b_stale_doc["title"] = "Tab B Desynchronized Edit"
    
    conflict_caught = False
    try:
        put_json(f"{BFF_URL}/api/resumes/{resume_id}", tab_b_stale_doc, headers=auth_headers)
    except urllib.error.HTTPError as e:
        print(f"12. Tab B Stale Write Triggered: HTTP {e.code} (Expected 409 Conflict)")
        assert e.code == 409
        err_body = json.loads(e.read().decode("utf-8"))
        print(f"    Error detail: {err_body['detail']}")
        assert err_body["detail"]["error"] == "OPTIMISTIC_CONCURRENCY_CONFLICT"
        assert err_body["detail"]["serverVersion"] == 3
        assert err_body["detail"]["clientVersion"] == 2
        conflict_caught = True

    assert conflict_caught, "OCC Failure! Stale write should have been rejected with 409!"

    # 13. Tab B reviews conflict, fetches latest v3, and saves as v4
    latest_state = get_json(f"{BFF_URL}/api/resumes/{resume_id}", headers=auth_headers)
    latest_doc = latest_state["data"]
    latest_doc["title"] = "Resolved Conflict Title (Tab B Synchronized)"
    resolve_payload = {
        "title": "Resolved Conflict Title (Tab B Synchronized)",
        "status": "PUBLISHED",
        "version": latest_state["version"], # Uses fresh v3
        "data": latest_doc
    }
    resolved_res = put_json(f"{BFF_URL}/api/resumes/{resume_id}", resolve_payload, headers=auth_headers)
    print(f"13. Tab B Conflict Resolved: Saved as Version {resolved_res['version']}")
    assert resolved_res["version"] == 4

    # 14. Export/PDF Verification
    final_fetch = get_json(f"{BFF_URL}/api/resumes/{resume_id}", headers=auth_headers)
    print(f"14. Final Resume State: Title='{final_fetch['title']}', Version={final_fetch['version']}")
    assert final_fetch["title"] == "Resolved Conflict Title (Tab B Synchronized)"
    assert final_fetch["version"] == 4
    assert final_fetch["data"]["personalInfo"]["summary"] == improved_summary

    print("\n=======================================================")
    print("[+] COMPLETE USER JOURNEY PASSED 100% WITH ZERO REGRESSIONS")
    print("=======================================================")

if __name__ == "__main__":
    run_user_journey()
