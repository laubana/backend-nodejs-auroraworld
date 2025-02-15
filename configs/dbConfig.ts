import Database from "better-sqlite3";

const db = new Database("data.db");

const initiate = () => {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_writable BOOLEAN NOT NULL DEFAULT 0,
      UNIQUE (link_id, user_id)
    )`);

    return true;
  } catch (error) {
    console.error(error);

    return false;
  }
};

export default { db, initiate };
