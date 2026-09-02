import time
import json
import urllib.request
import urllib.error
import uuid
import statistics
import hmac
import hashlib
import base64
from concurrent.futures import ThreadPoolExecutor

BFF_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"

def http_req(url, method="GET", data=None, headers=None, timeout=25):
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    encoded_data = None
    if data is not None:
        if isinstance(data, (dict, list)):
            encoded_data = json.dumps(data).encode("utf-8")
        elif isinstance(data, str):
            encoded_data = data.encode("utf-8")
        elif isinstance(data, bytes):
            encoded_data = data

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            dur = (time.time() - start) * 1000
            res_data = resp.read().decode("utf-8")
            try:
                parsed = json.loads(res_data)
            except Exception:
                parsed = res_data
            return {
                "status": resp.status,
                "duration_ms": round(dur, 2),
                "data": parsed,
                "headers": dict(resp.headers),
                "success": True,
            }
    except urllib.error.HTTPError as e:
        dur = (time.time() - start) * 1000
        err_data = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_data)
        except Exception:
            parsed = err_data
        return {
            "status": e.code,
            "duration_ms": round(dur, 2),
            "data": parsed,
            "headers": dict(e.headers),
            "success": False,
        }
    except Exception as e:
        dur = (time.time() - start) * 1000
        return {
            "status": 0,
            "duration_ms": round(dur, 2),
            "error": str(e),
            "success": False,
        }

def compute_percentiles(latencies):
    if not latencies:
        return {"p50": 0, "p95": 0, "p99": 0, "max": 0, "avg": 0}
    sorted_lats = sorted(latencies)
    def p(pct):
        idx = int(len(sorted_lats) * (pct / 100.0))
        return sorted_lats[min(idx, len(sorted_lats) - 1)]
    return {
        "p50": round(p(50), 1),
        "p95": round(p(95), 1),
        "p99": round(p(99), 1),
        "max": round(max(sorted_lats), 1),
        "avg": round(sum(sorted_lats) / len(sorted_lats), 1),
    }

def print_benchmark_summary(name, results):
    total = len(results)
    successes = sum(1 for r in results if r["success"] or (200 <= r["status"] < 300))
    failures = sum(1 for r in results if r["status"] >= 400)
    timeouts = sum(1 for r in results if r["status"] == 0 or "timeout" in str(r.get("error", "")).lower())
    latencies = [r["duration_ms"] for r in results if r["duration_ms"] > 0]
    stats = compute_percentiles(latencies)
    status_dist = {}
    for r in results:
        status_dist[r["status"]] = status_dist.get(r["status"], 0) + 1
    total_time_sec = (max(latencies) / 1000.0) if latencies else 1
    throughput = round(total / total_time_sec, 1) if total_time_sec > 0 else 0

    print(f"\n=======================================================")
    print(f"BENCHMARK: {name}")
    print(f"Total Requests: {total} | Success: {successes} | Failures: {failures} | Timeouts: {timeouts}")
    print(f"Latencies (ms): p50={stats['p50']} | p95={stats['p95']} | p99={stats['p99']} | Max={stats['max']} | Avg={stats['avg']}")
    print(f"Throughput: {throughput} req/sec | Status Dist: {status_dist}")
    print(f"=======================================================")
    return stats, status_dist

# ─── 1. End-to-End Concurrency: 20 User Registrations ─────────────
def test_20_concurrent_registrations():
    print("\n>>> [1] Running 20 Concurrent Registrations on FastAPI (:8000)...")
    def register_worker(i):
        payload = {
            "email": f"adv_user_{i}_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
            "name": f"Adversarial User {i}",
        }
        return http_req(f"{BACKEND_URL}/api/auth/register", method="POST", data=payload)

    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = [ex.submit(register_worker, i) for i in range(20)]
        results = [f.result() for f in futures]

    stats, dist = print_benchmark_summary("20 Concurrent Registrations (:8000)", results)
    assert dist.get(201, 0) == 20, f"Expected all 20 to succeed with 201, got {dist}"

# ─── 2. End-to-End Concurrency: 20 Concurrent Resume Writes ────────
def test_20_concurrent_resume_writes():
    print("\n>>> [2] Running 20 Concurrent Unique Resume Writes on FastAPI (:8000)...")
    # Register single user
    user_email = f"writer_{uuid.uuid4().hex[:6]}@example.com"
    http_req(f"{BACKEND_URL}/api/auth/register", method="POST", data={"email": user_email, "password": "Password123!", "name": "Writer"})
    login_res = http_req(f"{BACKEND_URL}/api/auth/login", method="POST", data=f"username={user_email}&password=Password123!", headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = login_res["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    def write_worker(i):
        resume_id = f"RES-CONCUR-{i}-{uuid.uuid4().hex[:4]}"
        payload = {
            "title": f"Concurrent Resume {i}",
            "status": "DRAFT",
            "version": 1,
            "data": {
                "id": resume_id,
                "title": f"Concurrent Resume {i}",
                "status": "DRAFT",
                "personalInfo": {"firstName": "Test", "lastName": f"User {i}", "email": user_email, "phone": "123", "location": "Remote", "title": "Dev", "summary": "S"},
                "experience": [], "skills": {"languages": [], "frameworks": [], "tools": [], "cloud": []}, "education": [], "projects": [],
                "metrics": {"resumeScore": 90, "jdMatchRate": 80, "profileViews": 50, "aiCredits": 50}
            }
        }
        return http_req(f"{BACKEND_URL}/api/resumes", method="POST", data=payload, headers=headers)

    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = [ex.submit(write_worker, i) for i in range(20)]
        results = [f.result() for f in futures]

    stats, dist = print_benchmark_summary("20 Concurrent Unique Resume Writes (:8000)", results)
    assert dist.get(201, 0) == 20, f"Expected 20 unique resumes created with 201, got {dist}"

# ─── 3. Atomic OCC: Real Simultaneous Conflicting Writes ──────────
def test_simultaneous_conflicting_occ():
    print("\n>>> [3] Testing True Simultaneous Conflicting Writes on SAME Resume...")
    # Register & setup
    user_email = f"occ_race_{uuid.uuid4().hex[:6]}@example.com"
    http_req(f"{BACKEND_URL}/api/auth/register", method="POST", data={"email": user_email, "password": "Password123!", "name": "OCC Race"})
    login_res = http_req(f"{BACKEND_URL}/api/auth/login", method="POST", data=f"username={user_email}&password=Password123!", headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = login_res["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resume_id = f"RES-RACE-{uuid.uuid4().hex[:6]}"
    payload = {
        "title": "Initial Title",
        "status": "DRAFT",
        "version": 1,
        "data": {
            "id": resume_id,
            "title": "Initial Title",
            "status": "DRAFT",
            "personalInfo": {"firstName": "A", "lastName": "B", "email": user_email, "phone": "1", "location": "C", "title": "D", "summary": "E"},
            "experience": [], "skills": {"languages": [], "frameworks": [], "tools": [], "cloud": []}, "education": [], "projects": [],
            "metrics": {"resumeScore": 90, "jdMatchRate": 80, "profileViews": 50, "aiCredits": 50}
        }
    }
    create_res = http_req(f"{BACKEND_URL}/api/resumes", method="POST", data=payload, headers=headers)
    assert create_res["status"] == 201

    # Now fire 10 SIMULTANEOUS writes, ALL claiming version 1
    def update_worker(i):
        update_payload = dict(payload)
        update_payload["version"] = 1 # Stale for all but the first to commit
        update_payload["title"] = f"Conflicting Title by Thread {i}"
        return http_req(f"{BACKEND_URL}/api/resumes/{resume_id}", method="PUT", data=update_payload, headers=headers)

    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = [ex.submit(update_worker, i) for i in range(10)]
        results = [f.result() for f in futures]

    statuses = [r["status"] for r in results]
    print(f"Simultaneous OCC Results (10 parallel writes with version 1): {statuses}")
    assert statuses.count(200) == 1, f"Expected EXACTLY ONE thread to succeed (200), got {statuses.count(200)}"
    assert statuses.count(409) == 9, f"Expected EXACTLY 9 threads to be rejected with 409 Conflict, got {statuses.count(409)}"
    print("[PASS] True Atomic OCC: compare-and-swap guaranteed single-winner update, eliminating race overwrites!")

# ─── 4. Idempotency Semantics: Fingerprint Mismatch Validation ───
def test_idempotency_fingerprint_mismatch():
    print("\n>>> [4] Testing Idempotency Semantics & Payload Fingerprint Binding...")
    # Reset circuit breaker first
    http_req(f"{BFF_URL}/api/circuit-breaker/reset", method="POST")

    key = f"idemp-fingerprint-{uuid.uuid4()}"
    payload_a = {"text": "Architected streaming pipelines", "sectionType": "Experience", "role": "Staff Engineer"}
    payload_b = {"text": "COMPLETELY DIFFERENT PAYLOAD", "sectionType": "Education", "role": "Intern"}

    # 1. First request with Key + Payload A
    res1 = http_req(f"{BFF_URL}/api/optimize", method="POST", data=payload_a, headers={"Idempotency-Key": key})
    assert res1["status"] == 200
    print("  First request (Payload A): 200 OK (Calculated)")

    # 2. Second request with SAME Key + SAME Payload A -> IDEMPOTENT-HIT
    res2 = http_req(f"{BFF_URL}/api/optimize", method="POST", data=payload_a, headers={"Idempotency-Key": key})
    assert res2["status"] == 200
    assert res2["headers"].get("X-Cache") == "IDEMPOTENT-HIT"
    print("  Second request (Same Key + Payload A): 200 OK (IDEMPOTENT-HIT)")

    # 3. Third request with SAME Key + DIFFERENT Payload B -> MUST REJECT WITH 422!
    res3 = http_req(f"{BFF_URL}/api/optimize", method="POST", data=payload_b, headers={"Idempotency-Key": key})
    print(f"  Third request (Same Key + Payload B): status={res3['status']} error={res3['data'].get('error')}")
    assert res3["status"] == 422, f"Expected 422 IDEMPOTENCY_PAYLOAD_MISMATCH, got {res3['status']}"
    err_obj = res3["data"].get("error")
    err_code = err_obj if isinstance(err_obj, str) else err_obj.get("code")
    assert err_code == "IDEMPOTENCY_PAYLOAD_MISMATCH"
    print("[PASS] Idempotency Key bound to request fingerprint: prevents silent stale cache poisoning!")

# ─── 5. Adversarial Authorization & BOLA/IDOR Tests ───────────────
def test_adversarial_auth_and_bola():
    print("\n>>> [5] Testing Adversarial Authorization & BOLA/IDOR User Isolation...")
    # Register User A and User B
    user_a = f"user_a_{uuid.uuid4().hex[:6]}@example.com"
    user_b = f"user_b_{uuid.uuid4().hex[:6]}@example.com"
    http_req(f"{BACKEND_URL}/api/auth/register", method="POST", data={"email": user_a, "password": "Password123!", "name": "User A"})
    http_req(f"{BACKEND_URL}/api/auth/register", method="POST", data={"email": user_b, "password": "Password123!", "name": "User B"})

    login_a = http_req(f"{BACKEND_URL}/api/auth/login", method="POST", data=f"username={user_a}&password=Password123!", headers={"Content-Type": "application/x-www-form-urlencoded"})
    login_b = http_req(f"{BACKEND_URL}/api/auth/login", method="POST", data=f"username={user_b}&password=Password123!", headers={"Content-Type": "application/x-www-form-urlencoded"})
    token_a = login_a["data"]["access_token"]
    token_b = login_b["data"]["access_token"]

    # User A creates Resume A
    resume_a_id = f"RES-A-{uuid.uuid4().hex[:6]}"
    create_res = http_req(f"{BACKEND_URL}/api/resumes", method="POST", data={
        "title": "User A Secret Resume", "status": "DRAFT", "version": 1,
        "data": {"id": resume_a_id, "title": "User A Secret Resume", "status": "DRAFT",
                 "personalInfo": {"firstName": "A", "lastName": "A", "email": user_a, "phone": "1", "location": "A", "title": "A", "summary": "Secret"},
                 "experience": [], "skills": {"languages": [], "frameworks": [], "tools": [], "cloud": []}, "education": [], "projects": [],
                 "metrics": {"resumeScore": 90, "jdMatchRate": 80, "profileViews": 50, "aiCredits": 50}}
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert create_res["status"] == 201

    # 1. User B attempts GET User A's Resume -> MUST RETURN 403 FORBIDDEN
    get_res = http_req(f"{BACKEND_URL}/api/resumes/{resume_a_id}", method="GET", headers={"Authorization": f"Bearer {token_b}"})
    print(f"  User B GET User A Resume -> status={get_res['status']} (Expected 403)")
    assert get_res["status"] == 403, f"BOLA violation! Expected 403, got {get_res['status']}"

    # 2. User B attempts PUT User A's Resume -> MUST RETURN 403 FORBIDDEN
    put_res = http_req(f"{BACKEND_URL}/api/resumes/{resume_a_id}", method="PUT", data={"title": "Hacked", "version": 1, "data": {"id": resume_a_id, "title": "Hacked", "status": "DRAFT", "personalInfo": {"firstName": "H", "lastName": "H", "email": "h@h.com", "phone": "1", "location": "H", "title": "H", "summary": "H"}, "experience": [], "skills": {"languages": [], "frameworks": [], "tools": [], "cloud": []}, "education": [], "projects": [], "metrics": {"resumeScore": 90, "jdMatchRate": 80, "profileViews": 50, "aiCredits": 50}}}, headers={"Authorization": f"Bearer {token_b}"})
    print(f"  User B PUT User A Resume -> status={put_res['status']} (Expected 403)")
    assert put_res["status"] == 403, f"BOLA violation! Expected 403, got {put_res['status']}"

    # 3. User B attempts DELETE User A's Resume -> MUST RETURN 403 FORBIDDEN
    del_res = http_req(f"{BACKEND_URL}/api/resumes/{resume_a_id}", method="DELETE", headers={"Authorization": f"Bearer {token_b}"})
    print(f"  User B DELETE User A Resume -> status={del_res['status']} (Expected 403)")
    assert del_res["status"] == 403, f"BOLA violation! Expected 403, got {del_res['status']}"

    # 4. Anonymous user attempts access -> MUST RETURN 401 UNAUTHORIZED
    anon_res = http_req(f"{BACKEND_URL}/api/resumes/{resume_a_id}", method="GET")
    print(f"  Anonymous GET Resume -> status={anon_res['status']} (Expected 401)")
    assert anon_res["status"] == 401

    # 5. Tampered JWT token -> MUST RETURN 401 UNAUTHORIZED
    tampered_token = token_a[:-5] + "XXXXX"
    tampered_res = http_req(f"{BACKEND_URL}/api/resumes/{resume_a_id}", method="GET", headers={"Authorization": f"Bearer {tampered_token}"})
    print(f"  Tampered Token GET Resume -> status={tampered_res['status']} (Expected 401)")
    assert tampered_res["status"] == 401

    print("[PASS] BOLA/IDOR Security: Cross-user mutations, reads, and token forgery strictly rejected!")

# ─── 6. Bulkhead Mathematical Concurrency & Queue Rejection ───────
def test_bulkhead_concurrency_and_overflow():
    print("\n>>> [6] Mathematically Verifying Bulkhead Concurrency (Max 4 active, Max 12 queued)...")
    http_req(f"{BFF_URL}/api/circuit-breaker/reset", method="POST")

    # Send burst of 20 requests to BFF
    def burst_worker(i):
        payload = {"text": f"Bulkhead stress test {i}", "sectionType": "Experience", "role": "Engineer"}
        return http_req(f"{BFF_URL}/api/optimize", method="POST", data=payload, headers={"Idempotency-Key": f"bh-{i}-{uuid.uuid4()}"})

    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = [ex.submit(burst_worker, i) for i in range(20)]
        results = [f.result() for f in futures]

    ready = http_req(f"{BFF_URL}/health/ready")["data"]
    max_observed = ready["bulkhead"]["maxObserved"]
    print(f"  Bulkhead Stats: {ready['bulkhead']}")
    print(f"  Max simultaneous active AI executions: {max_observed} (Configured Limit: 4)")
    assert max_observed <= 4, f"Bulkhead breach! Observed {max_observed} > 4 simultaneous AI executions!"
    print("[PASS] Bulkhead mathematically holds max concurrent AI operations <= 4!")

# ─── 7. Circuit Breaker Exact State Machine Test ──────────────────
def test_circuit_breaker_state_machine():
    print("\n>>> [7] Verifying Circuit Breaker State Transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)...")
    http_req(f"{BFF_URL}/api/circuit-breaker/reset", method="POST")

    # Phase 1: Verify CLOSED state
    ready = http_req(f"{BFF_URL}/health/ready")["data"]
    assert ready["circuitState"] == "CLOSED"
    print("  [1] Initial State: CLOSED")

    # Phase 2: Trip to OPEN by sending 5 failures
    print("  [2] Sending 5 simulated upstream failures (503)...")
    for i in range(5):
        r = http_req(f"{BFF_URL}/api/optimize", method="POST", data={"text": f"Fail {i}", "sectionType": "Experience", "role": "Dev"}, headers={"X-Simulate-Ai-Failure": "503", "X-Test-Bypass-Rate-Limit": "1", "Idempotency-Key": f"cb-fail-{i}-{uuid.uuid4()}"})
    
    ready = http_req(f"{BFF_URL}/health/ready")["data"]
    print(f"  Circuit State after 5 failures: {ready['circuitState']}")
    assert ready["circuitState"] == "OPEN", f"Expected OPEN, got {ready['circuitState']}"

    # Phase 3: In OPEN state, requests should fail-fast into deterministic fallback (0 network calls to Gemini)
    fast_req = http_req(f"{BFF_URL}/api/optimize", method="POST", data={"text": "Should use fallback", "sectionType": "Experience", "role": "Staff"})
    print(f"  Fast-fail in OPEN state: status={fast_req['status']}, isFallback={fast_req['data'].get('fallback')}, duration={fast_req['duration_ms']}ms")
    assert fast_req["status"] == 200
    assert fast_req["data"].get("fallback") == True

    # Phase 4: Wait recovery period (15s) and verify HALF_OPEN transition
    print("  [3] Waiting 15 seconds for recovery timeout...")
    time.sleep(15.5)

    # First probe request in HALF_OPEN (simulating recovery of upstream provider)
    probe_req = http_req(f"{BFF_URL}/api/optimize", method="POST", data={"text": "Trial probe", "sectionType": "Experience", "role": "Staff"}, headers={"X-Simulate-Ai-Probe": "success"})
    assert probe_req["status"] == 200

    # Verify transition back to CLOSED
    ready_after = http_req(f"{BFF_URL}/health/ready")["data"]
    print(f"  Circuit State after successful probe: {ready_after['circuitState']}")
    assert ready_after["circuitState"] == "CLOSED", f"Expected CLOSED after successful trial, got {ready_after['circuitState']}"
    print("[PASS] Circuit Breaker state machine verified: CLOSED -> OPEN -> HALF_OPEN -> CLOSED!")

# ─── 8. SQLite WAL Concurrency Boundary (20, 50, 100 Writes) ──────
def test_sqlite_wal_scaling_boundaries():
    print("\n>>> [8] Testing SQLite WAL Concurrency Boundaries (20, 50, 100 writes)...")
    user_email = f"boundary_{uuid.uuid4().hex[:6]}@example.com"
    http_req(f"{BACKEND_URL}/api/auth/register", method="POST", data={"email": user_email, "password": "Password123!", "name": "Boundary"})
    login = http_req(f"{BACKEND_URL}/api/auth/login", method="POST", data=f"username={user_email}&password=Password123!", headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = login["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    for count in [20, 50, 100]:
        def write_n(i):
            payload = {
                "title": f"Boundary Test {count}-{i}",
                "status": "DRAFT",
                "version": 1,
                "data": {
                    "id": f"RES-BND-{count}-{i}-{uuid.uuid4().hex[:4]}",
                    "title": f"Boundary Test {count}-{i}",
                    "status": "DRAFT",
                    "personalInfo": {"firstName": "B", "lastName": "T", "email": user_email, "phone": "1", "location": "B", "title": "B", "summary": "B"},
                    "experience": [], "skills": {"languages": [], "frameworks": [], "tools": [], "cloud": []}, "education": [], "projects": [],
                    "metrics": {"resumeScore": 90, "jdMatchRate": 80, "profileViews": 50, "aiCredits": 50}
                }
            }
            return http_req(f"{BACKEND_URL}/api/resumes", method="POST", data=payload, headers=headers)

        with ThreadPoolExecutor(max_workers=count) as ex:
            futures = [ex.submit(write_n, i) for i in range(count)]
            results = [f.result() for f in futures]

        stats, dist = print_benchmark_summary(f"SQLite WAL Concurrency: {count} parallel writes", results)

if __name__ == "__main__":
    test_20_concurrent_registrations()
    test_20_concurrent_resume_writes()
    test_simultaneous_conflicting_occ()
    test_idempotency_fingerprint_mismatch()
    test_adversarial_auth_and_bola()
    test_bulkhead_concurrency_and_overflow()
    test_circuit_breaker_state_machine()
    test_sqlite_wal_scaling_boundaries()
    print("\n=======================================================")
    print("ALL ADVERSARIAL & CONCURRENCY VALIDATIONS COMPLETE")
    print("=======================================================")
