import urllib.request
import json
import subprocess
import time
import uuid

BFF_URL = "http://localhost:3000"

def run_test():
    print("\n=== [DURABILITY TEST] Testing Data Persistence Across Container Restarts & Downtime ===")
    
    # 1. Register user
    email = f"durable_{uuid.uuid4().hex[:6]}@example.com"
    pwd = "Password123!"
    reg_req = urllib.request.Request(
        f"{BFF_URL}/api/auth/register",
        data=json.dumps({"email": email, "password": pwd, "name": "Durable User"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(reg_req) as r:
        assert r.status == 201

    # 2. Login
    login_req = urllib.request.Request(
        f"{BFF_URL}/api/auth/login",
        data=f"username={email}&password={pwd}".encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(login_req) as r:
        token = json.loads(r.read().decode())["access_token"]

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 3. Create persistent resume
    doc_id = f"RES-DURABLE-{uuid.uuid4().hex[:6]}"
    doc_payload = {
        "title": "Durable Production Architecture Document",
        "status": "PUBLISHED",
        "version": 1,
        "data": {
            "id": doc_id,
            "title": "Durable Production Architecture Document",
            "status": "PUBLISHED",
            "personalInfo": {"firstName": "Durable", "lastName": "Persistence", "email": email, "phone": "555-0199", "location": "Austin, TX", "title": "Staff Architect", "summary": "Unbreakable persistence."},
            "experience": [], "skills": {"languages": ["Rust", "Python"], "frameworks": [], "tools": [], "cloud": []}, "education": [], "projects": [],
            "metrics": {"resumeScore": 99, "jdMatchRate": 95, "profileViews": 500, "aiCredits": 100}
        }
    }
    create_req = urllib.request.Request(f"{BFF_URL}/api/resumes", data=json.dumps(doc_payload).encode(), headers=headers)
    with urllib.request.urlopen(create_req) as r:
        created = json.loads(r.read().decode())
        print(f"[1] Created persistent resume: {created['resume_id']} (Version: {created['version']})")

    # 4. Perform restart of backend, frontend, and redis
    print("[2] Restarting all Docker containers (backend, frontend, redis)...")
    subprocess.run(["docker", "compose", "-f", "dockercompose.yml", "restart"], check=True)
    time.sleep(5)

    # 5. Fetch resume after restart
    get_req = urllib.request.Request(f"{BFF_URL}/api/resumes/{doc_id}", headers=headers)
    with urllib.request.urlopen(get_req) as r:
        fetched = json.loads(r.read().decode())
        print(f"[3] Fetched resume after restart: {fetched['resume_id']} (Title: '{fetched['title']}')")
        assert fetched["resume_id"] == doc_id
        assert fetched["title"] == "Durable Production Architecture Document"
        assert fetched["version"] == 1

    # 6. Perform docker compose down and docker compose up -d (container teardown and recreate)
    print("[4] Tearing down and recreating containers (docker compose down & up -d)...")
    subprocess.run(["docker", "compose", "-f", "dockercompose.yml", "down"], check=True)
    subprocess.run(["docker", "compose", "-f", "dockercompose.yml", "up", "-d"], check=True)
    time.sleep(6)

    # 7. Fetch resume after container recreation
    with urllib.request.urlopen(get_req) as r:
        fetched_after_down = json.loads(r.read().decode())
        print(f"[5] Fetched resume after full teardown/recreate: {fetched_after_down['resume_id']}")
        assert fetched_after_down["resume_id"] == doc_id
        assert fetched_after_down["title"] == "Durable Production Architecture Document"

    print("\n[+] DURABILITY PROVEN: Authoritative database is safely persisted on host volume and survives full container recreation!")

if __name__ == "__main__":
    run_test()
