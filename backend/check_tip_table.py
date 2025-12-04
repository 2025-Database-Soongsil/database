from db import get_conn

def check_tip_schema():
    try:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Tip';")
            columns = cur.fetchall()
            if not columns:
                print("Table 'Tip' does not exist.")
            else:
                print("Table 'Tip' columns:")
                for col in columns:
                    print(f"- {col['column_name']}: {col['data_type']}")
            
            # Also try to fetch one row to see sample data
            if columns:
                cur.execute('SELECT * FROM "Tip" LIMIT 1')
                row = cur.fetchone()
                print("\nSample row:", row)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tip_schema()
