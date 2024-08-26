const express = require('express');
const app = express();
// Load environment variables from .env file
require('dotenv').config();

// Access the DB_PASSWORD environment variable
const dbPassword = process.env.DB_PASSWORD;
app.use(express.json());

const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pool',
    password: dbPassword,
    port: 5432,
});

pool.query(`SELECT * FROM users`, async (err, res) => {
    if (!res || res.rowCount === 0) {
        console.log(`users database not found, creating it.`);
        await pool.query(`CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT);`);
        console.log(`created database users`);
    } else {
        console.log(`users database exists.`);
    }
});

async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    console.log('executed query', { text, duration: Date.now() - start });
    return res;
}

app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    const result = await query('INSERT INTO users(name, email) VALUES($1, $2) RETURNING *', [name, email]);
    res.send(result.rows[0]);
});

app.get('/users', async (req, res) => {
    const result = await query('SELECT * FROM users');
    res.send(result.rows);
});

// Start the server
app.listen(3000, () => console.log('Server started on port 3000'));

process.on('uncaughtException', function (err) {
    console.log(err);
});