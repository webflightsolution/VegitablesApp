import uvicorn
import os
import sys

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"[START] Bhajipala Billing Server starting on http://{host}:{port}")
    print(f"[DOCS] API Documentation: http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
