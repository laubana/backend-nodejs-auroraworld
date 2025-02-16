import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "..", "data.db"));

const initiate = () => {
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )`);

    db.exec(
      `INSERT INTO categories (id, name) SELECT 'cc27b00bc5214705931805e241ba2850', 'Personal Favorites' WHERE NOT EXISTS (SELECT * FROM categories WHERE id = 'cc27b00bc5214705931805e241ba2850' OR name = 'Personal Favorites')`
    );

    db.exec(
      `INSERT INTO categories (id, name) SELECT '74d1aade7cba4d64ac7131a7de0e181d', 'Work Resources' WHERE NOT EXISTS (SELECT * FROM categories WHERE id = '74d1aade7cba4d64ac7131a7de0e181d' OR name = 'Work Resources')`
    );

    db.exec(
      `INSERT INTO categories (id, name) SELECT '805fc4d564944d2b8ef9ddc02ca872e5', 'Reference Materials' WHERE NOT EXISTS (SELECT * FROM categories WHERE id = '805fc4d564944d2b8ef9ddc02ca872e5' OR name = 'Reference Materials')`
    );

    db.exec(
      `INSERT INTO categories (id, name) SELECT '6d699f092ac448c4a22840653833b39f', 'Educational and Learning Materials' WHERE NOT EXISTS (SELECT * FROM categories WHERE id = '6d699f092ac448c4a22840653833b39f' OR name = 'Educational and Learning Materials')`
    );

    db.exec(`CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      category_name TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
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
