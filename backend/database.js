const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student',
    reg_ip TEXT,
    reg_location TEXT,
    reg_timezone TEXT,
    reg_device TEXT,
    two_factor_secret TEXT,
    is_two_factor_enabled INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address TEXT,
    device TEXT,
    location TEXT,
    status TEXT,
    risk_level TEXT,
    risk_score INTEGER,
    rules_triggered TEXT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS banned_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT UNIQUE,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT,
    course_name TEXT,
    credits INTEGER,
    instructor TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.get(`SELECT count(*) as count FROM banned_ips`, [], (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO banned_ips (ip_address, reason) VALUES ('89.187.160.40', 'Known Malicious ISP')`);
    }
  });

  db.get(`SELECT count(*) as count FROM courses`, [], (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO courses (course_code, course_name, credits, instructor) VALUES ('SWE301', 'Web Application Development', 3, 'Dr. Azlan')`);
      db.run(`INSERT INTO courses (course_code, course_name, credits, instructor) VALUES ('DAT205', 'Database Systems', 4, 'Prof. Sarah')`);
      db.run(`INSERT INTO courses (course_code, course_name, credits, instructor) VALUES ('SEC402', 'Information Security', 3, 'Dr. Kumar')`);
      db.run(`INSERT INTO courses (course_code, course_name, credits, instructor) VALUES ('PRJ499', 'Final Year Project', 6, 'Assoc. Prof. Lin')`);
    }
  });

  db.get(`SELECT count(*) as count FROM announcements`, [], (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO announcements (title, content) VALUES ('Campus Tech Maintenance', 'The student portal will undergo scheduled maintenance this Saturday from 2 AM to 6 AM.')`);
      db.run(`INSERT INTO announcements (title, content) VALUES ('Final Exam Schedule', 'The preliminary final exam schedule has been released. Please check with your respective faculty.')`);
      db.run(`INSERT INTO announcements (title, content) VALUES ('Library Extended Hours', 'The main library will be open 24/7 starting next week to accommodate study weeks.')`);
    }
  });
});

module.exports = db;