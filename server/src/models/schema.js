import { query } from '../config/database.js';

export const createTables = async () => {
  const queries = [
    // Users table (synced from Clerk via webhooks)
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      profile_image_url TEXT,
      clerk_created_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP,
      
      -- User preferences (Writer's Tree specific)
      preferences JSONB DEFAULT '{}',
      subscription_tier VARCHAR(50) DEFAULT 'free',
      subscription_expires_at TIMESTAMP
    )`,

    // Projects table
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500) DEFAULT 'Untitled Project',
      word_goal INTEGER DEFAULT 50000,
      current_word_count INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      tree_seed VARCHAR(255) NOT NULL,
      tree_style VARCHAR(50) DEFAULT 'oak',
      tree_season VARCHAR(50) DEFAULT 'summer',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_edited_at TIMESTAMP DEFAULT NOW()
    )`,

    // Project content
    `CREATE TABLE IF NOT EXISTS project_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      content TEXT DEFAULT '',
      word_count INTEGER DEFAULT 0,
      character_count INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      cursor_position INTEGER DEFAULT 0,
      is_current BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Version history
    `CREATE TABLE IF NOT EXISTS version_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      version INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    )`,

    // Milestones
    `CREATE TABLE IF NOT EXISTS milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      milestone_type VARCHAR(50) NOT NULL,
      word_count INTEGER NOT NULL,
      achieved_at TIMESTAMP DEFAULT NOW(),
      celebrated BOOLEAN DEFAULT FALSE
    )`,

    // Writing streaks
    `CREATE TABLE IF NOT EXISTS writing_streaks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      words_written INTEGER DEFAULT 0,
      minutes_written INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, date)
    )`,

    // Analytics events
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB DEFAULT '{}',
      session_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`,
    `CREATE INDEX IF NOT EXISTS idx_project_content_project_id ON project_content(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_project_content_current ON project_content(is_current)`,
    `CREATE INDEX IF NOT EXISTS idx_version_history_project_id ON version_history(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_milestones_user_project ON milestones(user_id, project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_writing_streaks_user_date ON writing_streaks(user_id, date)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type)`
  ];

  try {
    for (const q of queries) {
      await query(q);
    }
    console.log('✓ Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

export const dropTables = async () => {
  const tables = [
    'analytics_events',
    'writing_streaks',
    'milestones',
    'version_history',
    'project_content',
    'projects',
    'users'
  ];

  try {
    for (const table of tables) {
      await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    console.log('✓ Database tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};
