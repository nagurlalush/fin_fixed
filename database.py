import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'creatorverse.db')

def get_db_path():
    return os.environ.get('CREATORVERSE_DB_PATH') or os.environ.get('DB_PATH') or DB_PATH

def get_db():
    try:
        from flask import g, has_app_context
        if has_app_context():
            if 'db' not in g:
                g.db = sqlite3.connect(get_db_path(), timeout=30.0)
                g.db.row_factory = sqlite3.Row
                g.db.execute("PRAGMA foreign_keys = ON")
                try:
                    g.db.execute("PRAGMA journal_mode = WAL")
                except Exception:
                    pass
            return g.db
    except ImportError:
        pass

    conn = sqlite3.connect(get_db_path(), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        conn.execute("PRAGMA journal_mode = WAL")
    except Exception:
        pass
    return conn

def close_db(e=None):
    try:
        from flask import g, has_app_context
        if has_app_context():
            db = g.pop('db', None)
            if db is not None:
                db.close()
    except ImportError:
        pass

def init_db(db_path=None):
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        conn.execute("PRAGMA journal_mode = WAL")
    except Exception:
        pass
    cursor = conn.cursor()

    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('creator', 'brand', 'admin')),
        avatar TEXT,
        bio TEXT,
        headline TEXT,
        location TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS creator_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        specialization TEXT NOT NULL,
        skills TEXT NOT NULL,
        tools_models TEXT NOT NULL,
        content_types TEXT NOT NULL,
        aspect_ratios TEXT NOT NULL,
        day_rate REAL NOT NULL,
        min_budget REAL NOT NULL,
        availability TEXT DEFAULT 'Available Now',
        commercial_rights_capabilities TEXT,
        languages TEXT DEFAULT 'English',
        verified_status TEXT DEFAULT 'unverified' CHECK(verified_status IN ('unverified', 'submitted', 'verified', 'rejected')),
        rating REAL DEFAULT 5.0,
        completed_projects_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS brand_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        industry TEXT NOT NULL,
        website TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        logo TEXT,
        description TEXT,
        company_address TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'animation')),
        media_url TEXT NOT NULL,
        thumbnail_url TEXT,
        tools_used TEXT NOT NULL,
        workflow_description TEXT NOT NULL,
        aspect_ratio TEXT NOT NULL,
        resolution TEXT NOT NULL,
        prompt_summary TEXT,
        intermediate_assets TEXT,
        commercial_rights TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS creative_briefs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        objective TEXT NOT NULL,
        target_audience TEXT,
        content_type TEXT NOT NULL,
        visual_style TEXT NOT NULL,
        aspect_ratio TEXT NOT NULL,
        resolution TEXT NOT NULL,
        duration TEXT,
        target_platforms TEXT NOT NULL,
        deliverables TEXT NOT NULL,
        budget_min REAL NOT NULL,
        budget_max REAL NOT NULL,
        deadline TEXT NOT NULL,
        required_skills TEXT NOT NULL,
        required_tools TEXT NOT NULL,
        commercial_usage_type TEXT NOT NULL,
        territory TEXT DEFAULT 'Worldwide',
        usage_duration TEXT DEFAULT 'Perpetual',
        restrictions TEXT,
        status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'in_progress', 'completed', 'closed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shortlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(brand_id, creator_id),
        FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brief_id INTEGER NOT NULL,
        brand_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        message TEXT,
        proposed_budget REAL NOT NULL,
        proposed_deadline TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
        response_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brief_id) REFERENCES creative_briefs(id) ON DELETE CASCADE,
        FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brief_id INTEGER NOT NULL,
        brand_id INTEGER NOT NULL,
        creator_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        agreed_budget REAL NOT NULL,
        agreed_deadline TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'in_review', 'revision_requested', 'approved', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (brief_id) REFERENCES creative_briefs(id) ON DELETE CASCADE,
        FOREIGN KEY (brand_id) REFERENCES brand_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_commercial_terms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER UNIQUE NOT NULL,
        usage_type TEXT NOT NULL,
        territory TEXT NOT NULL,
        duration TEXT NOT NULL,
        restrictions TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deliverables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        media_type TEXT DEFAULT 'video',
        aspect_ratio TEXT NOT NULL,
        resolution TEXT NOT NULL,
        file_size TEXT DEFAULT '148 MB',
        status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'revision_requested', 'approved')),
        revision_notes TEXT,
        revision_timecodes TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment_text TEXT NOT NULL,
        attachment_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_id INTEGER NOT NULL,
        tool_evidence TEXT NOT NULL,
        workflow_evidence TEXT NOT NULL,
        past_work_evidence TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        reviewer_id INTEGER,
        reviewer_notes TEXT,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ''')
    try:
        cur = conn.cursor()
        cur.execute("ALTER TABLE brand_profiles ADD COLUMN company_address TEXT")
        conn.commit()
    except Exception:
        pass

    try:
        cur = conn.cursor()
        cur.execute("ALTER TABLE invitations ADD COLUMN response_message TEXT")
        conn.commit()
    except Exception:
        pass

    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

def migrate_passwords(db_path=None):
    """
    Non-destructive password hashing migration.
    Scans users table and converts any legacy plaintext passwords to Werkzeug secure hashes.
    Preserves all existing user records and accounts.
    """
    from werkzeug.security import generate_password_hash
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash FROM users")
    users = cur.fetchall()
    migrated = 0
    for u in users:
        pwd = u['password_hash']
        if pwd and not pwd.startswith(('scrypt:', 'pbkdf2:')):
            hashed = generate_password_hash(pwd)
            cur.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, u['id']))
            migrated += 1
    conn.commit()
    conn.close()
    if migrated > 0:
        print(f"[SECURITY] Successfully migrated {migrated} user account password(s) to Werkzeug cryptographic hashes.")
    return migrated

if __name__ == '__main__':
    init_db()
    migrate_passwords()

