const { Pool } = require("pg");

const isInternal = (process.env.DATABASE_URL || "").includes(".railway.internal");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(isInternal ? {} : { ssl: { rejectUnauthorized: false } })
});

class DbAdapter {
    async get(sql, placeholders) {
        const { text, values } = this._convert(sql, placeholders);
        const result = await pool.query(text, values);
        return result.rows[0] || undefined;
    }

    async all(sql, placeholders) {
        const { text, values } = this._convert(sql, placeholders);
        const result = await pool.query(text, values);
        return result.rows;
    }

    async run(sql, placeholders) {
        const { text, values } = this._convert(sql, placeholders);
        await pool.query(text, values);
    }

    _convert(sql, placeholders = {}) {
        let text = sql;
        const values = [];
        const keys = Object.keys(placeholders).sort((a, b) => Number(a) - Number(b));
        keys.forEach((key, i) => {
            text = text.replace(new RegExp(`\\?${key}`, "g"), `$${i + 1}`);
            values.push(placeholders[key]);
        });
        return { text, values };
    }
}

module.exports = DbAdapter;
