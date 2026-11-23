const { DatabaseSync } = require('node:sqlite')

const db = new DatabaseSync(process.env.DB_PATH || 'database.sqlite')

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'manager', 'admin'))
  )
`)

const columns = db.prepare('PRAGMA table_info(users)').all()
if (!columns.some((column) => column.name === 'role')) {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'client'`)
}

module.exports = db
