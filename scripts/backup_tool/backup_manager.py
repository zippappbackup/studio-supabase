import os
import sys
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

BUCKET = "uploads"
BASE_DIR = "vendor-photos"
LOCAL_DEST = "./backup_data"

def get_all_files_paginated(path):
    all_files = []
    offset = 0
    limit = 1000
    print(f"📡 Scanning Storage: {path}...")
    while True:
        try:
            items = supabase.storage.from_(BUCKET).list(path, {'limit': limit, 'offset': offset})
            if not items: break
            for item in items:
                # If there's no ID, it's a folder/directory placeholder
                if not item.get('id'):
                    full_path = f"{path}/{item['name']}" if path else item['name']
                    all_files.extend(get_all_files_paginated(full_path))
                else:
                    # It's a real file
                    full_path = f"{path}/{item['name']}" if path else item['name']
                    meta = item.get('metadata', {})
                    all_files.append({
                        "path": full_path, 
                        "size": meta.get('size', 0), 
                        "etag": item.get('etag')
                    })
            if len(items) == limit: offset += limit
            else: break
        except Exception as e:
            print(f"⚠️ Error scanning {path}: {e}")
            break
    return all_files

def sync():
    print(f"🚀 Re-scanning to filter out folder placeholders...")
    # First, clear the registry of any current 'pending' entries to start fresh
    # This is safe because we've only successfully downloaded 0 files so far.
    supabase.table("backup_registry").delete().eq("status", "pending").execute()
    
    files = get_all_files_paginated(BASE_DIR)
    total = len(files)
    print(f"📈 Found {total} REAL files. Updating Registry...")
    
    batch_size = 100
    for i in range(0, total, batch_size):
        batch = files[i : i + batch_size]
        payload = [{"file_path": f['path'], "file_size_bytes": f['size'], "status": "pending", "etag": f.get('etag')} for f in batch]
        try:
            supabase.table("backup_registry").upsert(payload, on_conflict="file_path").execute()
            print(f"💾 Logged {min(i + batch_size, total)}/{total}...")
        except Exception as e:
            print(f"⚠️ Batch update failed: {e}")
    print(f"✅ Registry Sync Complete.")

def download(file_limit=100):
    res = supabase.table("backup_registry").select("*").eq("status", "pending").limit(file_limit).execute()
    pending = res.data
    if not pending:
        print("🎉 No pending files!")
        return

    print(f"📥 Downloading {len(pending)} files...")
    for record in pending:
        path = record['file_path']
        local_path = os.path.join(LOCAL_DEST, path)
        
        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
            supabase.table("backup_registry").update({"status": "downloaded"}).eq("file_path", path).execute()
            continue

        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        try:
            response_bytes = supabase.storage.from_(BUCKET).download(path)
            if response_bytes:
                with open(local_path, 'wb') as f:
                    f.write(response_bytes)
                supabase.table("backup_registry").update({
                    "status": "downloaded",
                    "last_synced_at": datetime.datetime.now().isoformat()
                }).eq("file_path", path).execute()
                print(f"✅ Saved: {path} ({len(response_bytes)} bytes)")
        except Exception as e:
            # If it's still a 404, mark it as failed so we don't keep trying
            print(f"❌ Error {path}: {e}")
            supabase.table("backup_registry").update({"status": "failed"}).eq("file_path", path).execute()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 backup_manager.py [scan|download] [limit]")
    elif sys.argv[1] == "scan":
        sync()
    elif sys.argv[1] == "download":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        download(limit)
