#!/usr/bin/env python3
"""One-off: move JSON analyses saved by the old dev-mock store into Supabase.

Usage (from the api/ folder, with its venv active and SUPABASE_URL +
SUPABASE_SERVICE_ROLE_KEY exported):

    python ../scripts/migrate_analyses_to_supabase.py \
        --from data/analyses/evertondennis1_gmail.com \
        --user-id 00000000-0000-0000-0000-000000000000

Each <id>.json becomes one row in public.analyses owned by --user-id.
Existing ids are skipped, so the script is safe to re-run.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="src", required=True, help="folder of <id>.json files")
    ap.add_argument("--user-id", required=True, help="Supabase auth user id (uuid)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set", file=sys.stderr)
        return 2

    from supabase import create_client  # type: ignore

    client = create_client(url, key)
    table = client.table("analyses")
    src = Path(args.src)
    files = sorted(src.glob("*.json"))
    if not files:
        print(f"no .json files in {src}")
        return 0

    existing = {r["id"] for r in (table.select("id").eq("user_id", args.user_id).execute().data or [])}
    moved = skipped = 0
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        if data["id"] in existing:
            skipped += 1
            continue
        row = {
            "id": data["id"],
            "user_id": args.user_id,
            "name": data["name"],
            "country_id": data.get("country_id"),
            "source": data.get("source", "paste"),
            "total": data["total"],
            "dominant_label": data["dominant_label"],
            "mean_compound": data["mean_compound"],
            "languages_detected": data.get("languages_detected", 0),
            "created_at": data["created_at"],
            "batch": data["batch"],
            "original_texts": data.get("original_texts", []),
        }
        if args.dry_run:
            print(f"would insert {row['id']}  {row['name']!r}  ({row['total']} texts)")
        else:
            table.insert(row).execute()
            print(f"inserted {row['id']}  {row['name']!r}")
        moved += 1
    print(f"done: {moved} inserted, {skipped} already present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
