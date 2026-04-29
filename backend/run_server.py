from __future__ import annotations

import sys
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOCAL_PACKAGES = ROOT / "backend" / "python_packages"
VENV_PACKAGES = ROOT / "backend" / "venv" / "Lib" / "site-packages"

if VENV_PACKAGES.exists():
    sys.path.insert(0, str(VENV_PACKAGES))
if LOCAL_PACKAGES.exists():
    sys.path.insert(0, str(LOCAL_PACKAGES))

sys.path.insert(0, str(ROOT))

import uvicorn  # noqa: E402


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
