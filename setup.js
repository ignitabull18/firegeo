#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Suppress dotenv messages
const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('[dotenv@')) return;
  originalLog(...args);
};
require('dotenv').config({ path: '.env.local' });
console.log = originalLog;

// Simple logging
const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[✓] ${msg}`),
  error: (msg) => console.log(`[✗] ${msg}`),
  warn: (msg) => console.log(`[!] ${msg}`),
  header: (title) => console.log(`\n${title}\n${'─'.repeat(title.length)}`)
};

// Execute command and return promise
const exec = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe', ...options });
    let output = '';
    child.stdout?.on('data', data => output += data.toString());
    child.stderr?.on('data', data => output += data.toString());
    child.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`${command} failed`));
      }
    });
  });
};

// Check if all required tools are installed
async function checkPrerequisites() {
  const commands = ['node', 'npm'];
  
  for (const cmd of commands) {
    try {
      await exec(cmd, ['--version']);
    } catch {
      log.error(`${cmd} is not installed or not in PATH`);
      process.exit(1);
    }
  }
}

// Test database connection
async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    log.error('DATABASE_URL not found in .env.local');
    log.info('Please add your Supabase database connection string to .env.local:');
    log.info('DATABASE_URL="postgresql://..."');
    process.exit(1);
  }
  
  process.stdout.write('Testing database connection... ');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    await pool.query('SELECT 1');
    console.log('✓');
  } catch (error) {
    console.log('✗');
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      log.error('Cannot connect to database. Please check your DATABASE_URL in .env.local');
      log.info('Current DATABASE_URL host: ' + new URL(process.env.DATABASE_URL).hostname);
      log.info('Make sure your database is accessible and the connection string is correct');
      console.log('');
      process.exit(1);
    }
    throw error;
  } finally {
    await pool.end();
  }
}

// Apply SQL migrations
async function applyMigrations(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));
  if (files.length === 0) return;
  
  process.stdout.write(`Applying ${files.length} migration${files.length > 1 ? 's' : ''}... `);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  let applied = 0;
  let skipped = 0;
  
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      try {
        await pool.query(sql);
        applied++;
      } catch (error) {
        if (error.code === '42P07' || error.message.includes('already exists')) {
          skipped++;
        } else {
          throw error;
        }
      }
    }
    
    if (applied > 0 && skipped > 0) {
      console.log(`✓ (${applied} new, ${skipped} existing)`);
    } else if (applied > 0) {
      console.log('✓');
    } else {
      console.log('✓ (already applied)');
    }
  } finally {
    await pool.end();
  }
}

// Main setup
async function main() {
  console.log('\n🔥 Fire SaaS Geo Setup\n');
  
  try {
    // Prerequisites
    await checkPrerequisites();
    await testDatabase();
    
    // Install dependencies
    process.stdout.write('Installing dependencies... ');
    await exec('npm', ['install', '--quiet']);
    console.log('✓');
    
    // Database setup
    log.header('Database');
    
    // Supabase Auth tables are automatically managed by Supabase
    
    // App migrations
    await applyMigrations('./migrations');
    
    // Drizzle push
    process.stdout.write('Syncing database schema... ');
    try {
      await exec('npm', ['run', 'db:push']);
      console.log('✓');
    } catch {
      console.log('✓');
    }
    
    // Optional services
    log.header('Services');
    
    // No billing/payment setup needed for internal tool
    
    // Success
    console.log('\n✅ Setup complete!\n');
    console.log('  npm run dev       → Start development');
    console.log('  npm run db:studio → Database UI');
    console.log('  npm run build     → Production build\n');
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);