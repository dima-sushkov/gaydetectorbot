require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function init() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS participants (
            id SERIAL PRIMARY KEY,
            discord_guild_id TEXT,
            discord_user_id TEXT,
            discord_user_name TEXT,
            score INTEGER DEFAULT 0,
            excluded INTEGER DEFAULT 0
        )
    `);
    console.log("✅ Таблица participants создана");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS games (
            id SERIAL PRIMARY KEY,
            discord_guild_id TEXT,
            winner_participant_id INTEGER,
            datetime INTEGER
        )
    `);
    console.log("✅ Таблица games создана");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS year_winners (
            id SERIAL PRIMARY KEY,
            discord_guild_id TEXT,
            discord_user_id TEXT,
            discord_user_name TEXT,
            year INTEGER,
            score INTEGER,
            datetime INTEGER
        )
    `);
    console.log("✅ Таблица year_winners создана");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS guild_settings (
            id SERIAL PRIMARY KEY,
            discord_guild_id TEXT UNIQUE,
            auto_channel_id TEXT,
            auto_time TEXT DEFAULT '09:00'
        )
    `);
    console.log("✅ Таблица guild_settings создана");

    await pool.end();
    console.log("✅ База данных готова!");
}

init().catch(console.error);
