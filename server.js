const PORT = process.env.PORT || 3000;


const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '302019067009-t7ghuccd6oj44goe6frob9s0sunu0d63.apps.googleusercontent.com'; // Replace with your actual client ID
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Sekaimhani_0',
    database: process.env.MYSQL_DATABASE || 'fixbuddyDB'
});

// Ensure users table exists
db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
)`);

// Registration endpoint
// Google Auth endpoint
app.post('/api/google-auth', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ success: false, message: 'No request body received.' });
        }
        const { credential } = req.body;
        console.log('Received credential:', credential);
        if (!credential) return res.status(400).json({ success: false, message: 'No credential provided.' });
        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        console.log('Google payload:', payload);
        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        // Check if user exists
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        let user;
        if (rows.length > 0) {
            user = rows[0];
        } else {
            // Create new user with Google account, default to 'user' role
            await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, 'GOOGLE', 'user']);
            const [newRows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            user = newRows[0];
        }
        // Always return the role
        res.json({ success: true, user });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ success: false, message: 'Google authentication failed.' });
    }
});
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Check if user exists
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.status(201).json({ message: 'User registered!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
// Google OAuth for signup restored as requested
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        res.status(200).json({ message: 'Login successful!', userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
