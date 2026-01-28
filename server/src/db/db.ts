// Basic in-memory db structure using SQLite for persistence
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../polling.db');

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.run(`CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    question TEXT,
    options TEXT, -- JSON string
    timerDuration INTEGER,
    startTime INTEGER,
    isActive BOOLEAN
  )`);

    db.run(`CREATE TABLE IF NOT EXISTS votes (
    pollId TEXT,
    studentName TEXT,
    optionIndex INTEGER,
    UNIQUE(pollId, studentName)
  )`);
}
