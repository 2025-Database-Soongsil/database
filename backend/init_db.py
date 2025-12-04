from db import get_conn

def init_db():
    with get_conn() as conn:
        cur = conn.cursor()
        
        # Create PregnancyInfo table
        print("Creating PregnancyInfo table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS "PregnancyInfo" (
                "user_id" BIGINT PRIMARY KEY,
                "pregnancy_start" DATE NULL,
                "due_date" DATE NULL,
                "ovulation_week_start" DATE NULL,
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW()
            );
        ''')

        # Create DoctorsNote table
        print("Creating DoctorsNote table...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS "DoctorsNote" (
                "id" BIGINT PRIMARY KEY,
                "user_id" BIGINT NOT NULL,
                "content" TEXT NOT NULL,
                "visit_date" DATE NULL,
                "created_at" TIMESTAMP DEFAULT NOW(),
                "updated_at" TIMESTAMP DEFAULT NOW()
            );
        ''')
        
        # Add columns to User table if they don't exist
        print("Checking User table columns...")
        try:
            cur.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_pregnant" BOOLEAN DEFAULT FALSE;')
        except Exception as e:
            print(f"Error adding is_pregnant: {e}")
            conn.rollback()
            
        try:
            cur.execute('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10);')
        except Exception as e:
            print(f"Error adding gender: {e}")
            conn.rollback()

        conn.commit()
        print("Database initialization completed.")

if __name__ == "__main__":
    init_db()
