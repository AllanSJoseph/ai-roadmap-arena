import pool from '../config/db.js';

const migrate = async () => {
  console.log('Starting database migrations...');
  
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error('Failed to connect to the database. Make sure your local PostgreSQL server is running and the database specified in DATABASE_URL exists.', err.message);
    process.exit(1);
  }
  
  try {
    await client.query('BEGIN');
    
    // Enable uuid-ossp extension if available (gen_random_uuid is standard in newer Postgres, but let's make sure it's ready)
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create roadmaps table
    console.log('Creating roadmaps table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roadmaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100) NOT NULL,
        experience_level VARCHAR(50) NOT NULL,
        user_context TEXT,
        specializations TEXT[],
        checkpoints JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create roadmap_progress table
    console.log('Creating roadmap_progress table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roadmap_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
        checkpoint_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'locked',
        best_score INT DEFAULT 0,
        attempts_count INT DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE (roadmap_id, checkpoint_id)
      );
    `);

    // Create quiz_history table
    console.log('Creating quiz_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
        checkpoint_id VARCHAR(100) NOT NULL,
        questions JSONB NOT NULL,
        user_answers JSONB NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Migrations completed successfully.');
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Migration failed. Rolled back.', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};

migrate();
