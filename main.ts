import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Access the DB_PASSWORD environment variable
const dbPassword: string | undefined = process.env.DB_PASSWORD;

if (!dbPassword) {
    throw new Error('DB_PASSWORD is not defined in the environment variables');
}

const app = express();
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pool',
    password: dbPassword,
    port: 5432,
});

// Function to run a query and log execution time
async function query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        console.log('Executed query', { text, duration: Date.now() - start });
        return res;
    } catch (err) {
        console.error('Query error', err);
        throw err;
    }
}

// Check if the users table exists, and create it if it does not
async function initializeDatabase() {
    try {
        const res = await pool.query('SELECT * FROM users');
        if (res.rowCount === 0) {
            console.log('Users table not found, creating it.');
            await pool.query('CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT, email TEXT)');
            console.log('Created table users');
        } else {
            console.log('Users table exists.');
        }
    } catch (err) {
        console.error('Error checking/creating users table', err);
    }
}

// Initialize database on startup
initializeDatabase();

// Route to insert a new user
app.post('/users', async (req: Request, res: Response) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }
    try {
        const result = await query('INSERT INTO users(name, email) VALUES($1, $2) RETURNING *', [name, email]);
        res.status(201).send(result.rows[0]);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

// Route to get all users
app.get('/users', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM users');
        res.send(result.rows);
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    // Optionally, you could shut down the server or perform other clean-up tasks here
});