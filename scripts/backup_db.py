import sqlite3
import os
import sys
import time

def backup_database(src_path="backend/resume.db", dest_dir="backups"):
    os.makedirs(dest_dir, exist_ok=True)
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    dest_path = os.path.join(dest_dir, f"resume_backup_{timestamp}.db")

    print(f"[*] Starting online SQLite backup from '{src_path}' to '{dest_path}'...")
    src_conn = sqlite3.connect(src_path)
    dest_conn = sqlite3.connect(dest_path)

    try:
        # sqlite3.backup() safely handles concurrent WAL writes and checkpoints
        with dest_conn:
            src_conn.backup(dest_conn, pages=100)
        print(f"[+] Backup completed successfully: {dest_path}")
        
        # Verify backup integrity
        cur = dest_conn.cursor()
        integrity = cur.execute("PRAGMA integrity_check;").fetchone()
        print(f"[+] Integrity check: {integrity[0]}")
        assert integrity[0] == "ok", "Database backup integrity check failed!"
        
        # Check tables
        tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
        print(f"[+] Tables in backup: {[t[0] for t in tables]}")
        return dest_path
    finally:
        src_conn.close()
        dest_conn.close()

def restore_database(backup_path, target_path="backend/resume.db"):
    print(f"[*] Restoring SQLite database from '{backup_path}' to '{target_path}'...")
    src_conn = sqlite3.connect(backup_path)
    dest_conn = sqlite3.connect(target_path)
    try:
        with dest_conn:
            src_conn.backup(dest_conn, pages=100)
        print(f"[+] Restore completed successfully to {target_path}")
    finally:
        src_conn.close()
        dest_conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        if len(sys.argv) < 3:
            print("Usage: python backup_db.py restore <backup_path>")
            sys.exit(1)
        restore_database(sys.argv[2])
    else:
        backup_database()
