import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") # Use SERVICE key for backend workers

if not url or not key:
    print("❌ Error: Missing API Keys")
    exit(1)

# 2. Initialize Supabase Client
supabase: Client = create_client(url, key)

def run_analytics():
    print("🤖 Starting Analytics...")

    # 3. Fetch Notes from Database
    response = supabase.table('notes').select('*').execute()
    notes = response.data

    if not notes:
        print("❌ No notes found to analyze")
        return

    print(f"✅ Found {len(notes)} notes. Processing...")

    # 4. Analyze Notes
    positive_count = sum(1 for n in notes if n.get('sentiment') == 'positive')
    score = (positive_count / len(notes)) * 100\
    
    print(f"✅ Analysis Complete: Productivity Score is {score:.2f}%")
    print("zzZ Sleeping for 1 hour...")

if __name__ == "__main__":
    # In a real worker, this might run on a schedule or loop
    run_analytics()