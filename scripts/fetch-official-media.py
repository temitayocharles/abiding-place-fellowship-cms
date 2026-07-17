#!/usr/bin/env python3
"""Download rights-approved Abiding Place media from the generated manifest."""
from __future__ import annotations
import argparse, json, pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "content" / "media" / "media-manifest.json"
OUTPUT = ROOT / "assets" / "official-media"

def safe_name(asset: dict) -> str:
    category = asset.get("category", "media")
    if isinstance(category, list):
        category = category[0]
    raw = f"{category}-{asset.get('filename', asset['id'])}".lower()
    return re.sub(r"[^a-z0-9._-]+", "-", raw).strip("-")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", action="append", default=[], help="Approved asset ID; repeat for multiple assets")
    parser.add_argument("--all-approved", action="store_true", help="Download entries whose recommended_use is approved")
    args = parser.parse_args()
    data = json.loads(MANIFEST.read_text())
    selected=[]
    for asset in data["assets"]:
        if asset["id"] in args.id or (args.all_approved and asset.get("recommended_use") == "approved"):
            selected.append(asset)
    if not selected:
        print("No approved assets selected. Review media-manifest.json first.", file=sys.stderr)
        return 2
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for asset in selected:
        dest = OUTPUT / safe_name(asset)
        print(f"Downloading {asset['id']} -> {dest.relative_to(ROOT)}")
        req=urllib.request.Request(asset["url"],headers={"User-Agent":"AbidingPlaceMediaMigration/1.0"})
        with urllib.request.urlopen(req,timeout=60) as response, dest.open("wb") as handle:
            handle.write(response.read())
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
