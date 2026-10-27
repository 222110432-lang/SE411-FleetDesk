#!/usr/bin/env python3
"""Exercise the packaged app over real HTTP, then verify a saved record after restart.

Uses only Python's standard library. All records live in a temporary database.
Run from Project_Part2 after building backend/target/fleetdesk.jar.
"""
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
JAR = ROOT / "backend/target/fleetdesk.jar"
JAVA = str(Path(os.environ["JAVA_HOME"]) / "bin/java") if os.environ.get("JAVA_HOME") else "java"
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def stop(process):
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=25)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


def run():
    if not JAR.exists():
        raise SystemExit("Build the frontend and run mvn verify in backend first.")
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    base = f"http://127.0.0.1:{port}"

    def request(path, method="GET", body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(base + path, data=data, method=method,
                                     headers={"Content-Type": "application/json"})
        try:
            response = OPENER.open(req, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read().decode()
            content = json.loads(raw) if raw and "json" in response.headers.get("Content-Type", "") else raw
            return response.status, content, response.headers

    with tempfile.TemporaryDirectory(prefix="fleetdesk-smoke-", dir=ROOT / "backend/target") as folder:
        directory = Path(folder)
        environment = {**os.environ, "PORT": str(port), "SEED_DEMO": "false",
                       "SPRING_PROFILES_ACTIVE": "default", "DB_USER": "sa", "DB_PASSWORD": "",
                       "DB_URL": f"jdbc:h2:file:{directory / 'inventory'};DB_CLOSE_ON_EXIT=FALSE"}
        log_path = directory / "server.log"
        with log_path.open("w") as log:
            def start():
                process = subprocess.Popen([JAVA, "-jar", str(JAR)], cwd=directory, env=environment,
                                           stdout=log, stderr=subprocess.STDOUT)
                deadline = time.monotonic() + 120
                while time.monotonic() < deadline and process.poll() is None:
                    try:
                        status, body, _ = request("/actuator/health")
                        if status == 200 and body.get("status") == "UP":
                            return process
                    except (OSError, urllib.error.URLError):
                        pass
                    time.sleep(0.5)
                stop(process)
                raise RuntimeError("Server did not become healthy.\n" + log_path.read_text()[-6000:])

            process = start()
            try:
                code, html, _ = request("/")
                assert code == 200 and 'id="root"' in html, "The packaged frontend is missing"
                bundle = re.search(r'src="([^\"]+\.js)"', html).group(1)
                assert request("/" + bundle.removeprefix("./").lstrip("/"))[0] == 200
                print("PASS: packaged frontend and JavaScript bundle served", flush=True)

                created = []
                for number in range(1, 8):
                    payload = {"tag": f"SMOKE-{number:02}", "name": "Smoke test laptop", "serial": f"SMOKE-SERIAL-{number}",
                               "type": "Laptop", "status": "Available", "department": "IT", "assignedTo": "",
                               "location": "Test room", "purchaseDate": "2025-01-01", "cost": 1000.50, "notes": "Fictional test record"}
                    code, saved, headers = request("/api/computers", "POST", payload)
                    assert code == 201 and headers["Location"].endswith(saved["id"])
                    created.append(saved)
                print("PASS: create seven computers with generated IDs and Location headers", flush=True)

                code, page, _ = request("/api/computers?page=1&size=5")
                assert code == 200 and page["totalElements"] == 7 and len(page["content"]) == 2 and page["totalPages"] == 2
                assert page["content"][0]["tag"] == "SMOKE-06"
                assert request("/api/computers?size=101")[0] == 400
                assert request("/api/computers?q=SMOKE-07&department=IT")[1]["totalElements"] == 1
                print("PASS: server pagination, filtered search, and page-size validation", flush=True)

                saved = created[0]
                url = "/api/computers/" + saved["id"]
                assert request(url)[1]["tag"] == "SMOKE-01"
                update = {key: value for key, value in saved.items() if key != "id"}
                update.update({"status": "Assigned", "assignedTo": "QA team", "name": "Updated test laptop"})
                code, changed, _ = request(url, "PUT", update)
                assert code == 200 and changed["id"] == saved["id"] and changed["name"] == "Updated test laptop"
                assert request("/api/computers", "POST", update)[0] == 409
                assert request("/api/computers", "POST", {**update, "tag": "NEW-01", "serial": "NEW-01", "cost": -1})[0] == 400
                summary = request("/api/computers/summary")[1]
                assert summary["total"] == 7 and summary["statusCounts"]["Assigned"] == 1 and summary["value"] == 7003.50
                print("PASS: exact ID, update, duplicate rejection, validation, and inventory totals", flush=True)

                delete_url = "/api/computers/" + created[-1]["id"]
                assert request(delete_url, "DELETE")[0] == 204
                assert request(delete_url)[0] == 404
                print("PASS: confirmed deletion and missing-record response", flush=True)

                stop(process)
                process = start()
                assert request(url)[1]["name"] == "Updated test laptop"
                assert request("/api/computers")[1]["totalElements"] == 6
                print("PASS: saved changes and deletion survive a full server restart", flush=True)
                print("All live smoke checks passed.", flush=True)
            finally:
                stop(process)


if __name__ == "__main__":
    run()
