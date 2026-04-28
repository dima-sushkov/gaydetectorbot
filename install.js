require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "database.db3");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT,
        discord_user_id TEXT,
        discord_user_name TEXT,
        score INTEGER DEFAULT 0,
        excluded INTEGER DEFAULT 0
    )`, (err) => { if (err) console.error(err); else console.log("✅ participants"); });

    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT,
        winner_participant_id INTEGER,
        datetime INTEGER
    )`, (err) => { if (err) console.error(err); else console.log("✅ games"); });

    db.run(`CREATE TABLE IF NOT EXISTS year_winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT,
        discord_user_id TEXT,
        discord_user_name TEXT,
        year INTEGER,
        score INTEGER,
        datetime INTEGER
    )`, (err) => { if (err) console.error(err); else console.log("✅ year_winners"); });

    db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT UNIQUE,
        auto_channel_id TEXT,
        auto_time TEXT DEFAULT '23:59'
    )`, (err) => { if (err) console.error(err); else console.log("✅ guild_settings"); });
});

db.close(() => console.log("✅ База данных готова!"));
