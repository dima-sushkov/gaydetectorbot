const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "database.db3");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT,
        discord_user_id TEXT,
        discord_user_name TEXT,
        score INTEGER DEFAULT 0,
        excluded INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT,
        winner_participant_id INTEGER,
        datetime INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS year_winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT,
        discord_user_id TEXT,
        discord_user_name TEXT,
        year INTEGER,
        score INTEGER,
        datetime INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_guild_id TEXT UNIQUE,
        auto_channel_id TEXT,
        auto_time TEXT DEFAULT '23:59'
    )`);
    console.log("База данных готова");
});

class DbAdapter {
    async get(sql, placeholders = {}) {
        const { text, values } = this._convert(sql, placeholders);
        return new Promise((resolve, reject) => {
            db.get(text, values, (err, row) => {
                if (err) { reject(err); return; }
                resolve(row);
            });
        });
    }

    async all(sql, placeholders = {}) {
        const { text, values } = this._convert(sql, placeholders);
        return new Promise((resolve, reject) => {
            db.all(text, values, (err, rows) => {
                if (err) { reject(err); return; }
                resolve(rows || []);
            });
        });
    }

    run(sql, placeholders = {}) {
        const { text, values } = this._convert(sql, placeholders);
        db.run(text, values);
    }

    _convert(sql, placeholders = {}) {
        let text = sql;
        const values = [];
        const keys = Object.keys(placeholders).sort((a, b) => Number(a) - Number(b));
        keys.forEach((key) => {
            text = text.replace(`?${key}`, "?");
            values.push(placeholders[key]);
        });
        return { text, values };
    }
}

module.exports = DbAdapter;
