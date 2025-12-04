from db import get_conn

def add_column():
    with get_conn() as conn:
        cur = conn.cursor()
        print("Adding is_active column to CustomSupplement table...")
        try:
            cur.execute('ALTER TABLE "CustomSupplement" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT FALSE;')
            # Update existing rows to be active (optional, but maybe safer to keep them visible?)
            # User said "only clicked ones", so maybe default existing to FALSE?
            # Or TRUE to preserve current state?
            # Let's default to FALSE as per strict request, or TRUE if they were already being used.
            # Since it's a new feature request "make it so only clicked ones show", 
            # implies current state (everything shows) is not desired.
            # But if we set all to FALSE, user's current list disappears.
            # Let's set existing to TRUE so they don't lose data, and new ones will follow logic.
            # But wait, user wants "manage list" -> "active list".
            # If I set all to TRUE, they are all in active list.
            # If I set all to FALSE, they are all in manage list only.
            # Let's set to FALSE so they can select what they want from Manage list.
            # Actually, let's set to TRUE so we don't break existing view, 
            # and user can remove them to manage list if they want.
            # But the request is "Manage -> Click -> Active".
            # Let's stick to DEFAULT FALSE for new columns.
            # For existing rows, let's update them to TRUE so they don't disappear immediately?
            # Or FALSE?
            # Let's update to TRUE for now to be safe.
            cur.execute('UPDATE "CustomSupplement" SET is_active = TRUE WHERE is_active IS NULL;')
            conn.commit()
            print("Column added and existing rows updated.")
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_column()
