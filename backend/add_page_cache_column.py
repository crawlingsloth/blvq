"""
Migration script to add last_api_page column to customer_links table
Run this once on your production server: python add_page_cache_column.py
"""
import sqlite3
from pathlib import Path

# Path to your database file (adjust if needed)
DB_PATH = "blvq.db"

def add_column():
    """Add last_api_page column to customer_links table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(customer_links)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'last_api_page' in columns:
            print("✓ Column 'last_api_page' already exists")
        else:
            # Add the new column
            cursor.execute("ALTER TABLE customer_links ADD COLUMN last_api_page INTEGER")
            conn.commit()
            print("✓ Successfully added 'last_api_page' column to customer_links table")

    except sqlite3.Error as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Adding last_api_page column to customer_links table...")
    add_column()
    print("\nMigration complete! You can now restart your backend service.")
