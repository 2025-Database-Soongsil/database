from db import create_social_user_with_profile, delete_user_by_id, fetch_user_by_id
from datetime import date
import json
import datetime

# Helper to serialize dates for printing
def json_default(value):
    if isinstance(value, (date, datetime.datetime)):
        return value.isoformat()
    raise TypeError("Type not serializable")

def debug_user_data():
    print("--- Debugging User Data Structure ---")
    
    # Create a temporary user
    social_id = "debug_user_123"
    email = "debug@example.com"
    
    try:
        print("Creating user...")
        user = create_social_user_with_profile(
            provider="kakao",
            social_id=social_id,
            email=email,
            nickname="Debug User",
            gender="female",
            is_pregnant=True,
            last_period_date=date(2024, 1, 1),
            due_date=date(2024, 10, 10),
            height=165,
            weight=55.5
        )
        
        print("\nUser Object from create_social_user_with_profile:")
        print(json.dumps(user, default=json_default, indent=2, ensure_ascii=False))
        
        # Fetch again to be sure
        print("\nFetching user by ID...")
        fetched_user = fetch_user_by_id(user['id'])
        print(json.dumps(fetched_user, default=json_default, indent=2, ensure_ascii=False))
        
        # Clean up
        delete_user_by_id(user['id'])
        print("\nCleaned up.")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_user_data()
