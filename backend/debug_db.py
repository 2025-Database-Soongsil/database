import db
from datetime import datetime

try:
    print("Attempting to insert test event...")
    # Use a dummy user ID that likely exists or create one? 
    # I'll try to fetch a user first.
    with db.get_conn() as conn:
        cur = conn.cursor()
        cur.execute('SELECT id FROM "User" LIMIT 1')
        user = cur.fetchone()
        if not user:
            print("No users found to test with.")
        else:
            user_id = user['id']
            print(f"Testing with user_id: {user_id}")
            
            # Try insert
            try:
                res = db.upsert_calendar_event(
                    user_id=user_id,
                    title="Test Event",
                    start_datetime=datetime.now(),
                    type="todo"
                )
                print("Insert successful:", res)
                
                # Clean up
                db.delete_calendar_event(res['id'], user_id)
                print("Cleanup successful")
            except Exception as e:
                print("Insert failed:", e)
                import traceback
                traceback.print_exc()

except Exception as e:
    print("Connection failed:", e)
