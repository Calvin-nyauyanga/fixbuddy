// Combined backend logic for FixBuddy
// --- Service Worker ---
const CACHE_NAME = 'fixbuddy-cache-v1';
const urlsToCache = [
  '/',
  '/Main Dashboard/UserLoginPage.html',
  '/UserDashboard/UserDashboard.html',
  '/UserDashboard/submitticket.html',
  '/Main Dashboard/CSS STYLING/STYLING-UNIVERSAL.css',
  '/UserDashboard/CSS STYLING/STYLING-UNIVERSAL.css',
  // Add more HTML, JS, CSS, images as needed
];

if (typeof self !== 'undefined' && self.addEventListener) {
  self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    );
  });

  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  });
}

// --- Express Server & API Endpoints ---
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');
// Serve static files from the project root so HTML, JS and CSS can be requested by the browser
app.use(express.static(path.join(__dirname, '..')));

const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Sekaimhani_0',
    database: process.env.MYSQL_DATABASE || 'fixbuddyDB'
});

// Ensure users table exists
(async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
  )`);
})();

// (Google sign-in removed) If you previously used Google OAuth, it's been disabled.

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.status(201).json({ message: 'User registered!' });
    } catch (error) {
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
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        res.status(200).json({ message: 'Login successful!', userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// Ticket endpoints
app.post('/api/tickets', async (req, res) => {
  const { user_id, title, description } = req.body;
  const rs = await db.query(
    'INSERT INTO tickets (user_id, title, description) VALUES (?, ?, ?)',
    [user_id, title, description]
  );
  await db.query(
    'INSERT INTO activities (type, message) VALUES (?, ?)',
    ['ticket', `New ticket submitted: ${title}`]
  );
  res.json({ success: true, ticketId: rs[0].insertId });
});

app.get('/api/tickets', async (req, res) => {
  const { user_id } = req.query;
  let tickets;
  if (user_id) {
    [tickets] = await db.query('SELECT * FROM tickets WHERE user_id = ?', [user_id]);
  } else {
    [tickets] = await db.query('SELECT * FROM tickets');
  }
  res.json(tickets);
});

// Recent activities endpoint
app.get('/api/recent-activities', async (req, res) => {
  const [acts] = await db.query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 10');
  res.json(acts);
});

// Admin ticket endpoint
app.get('/api/admin-tickets', async (req, res) => {
  const [tickets] = await db.query('SELECT * FROM tickets');
  res.json(tickets);
});

// Admin authentication check (example)
app.get('/api/admin-auth', async (req, res) => {
  // Implement your admin authentication logic here
  res.json({ success: true });
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Admin change password (offline) - protected by passphrase
app.post('/api/admin-change-password', async (req, res) => {
  const { username, newPassword, passphrase } = req.body;
  const secret = process.env.OFFLINE_ADMIN_PASSPHRASE || 'changeme';
  if (passphrase !== secret) return res.status(403).json({ success: false, message: 'Forbidden' });
  try {
    if (!fs.existsSync(offlineAdminPath)) return res.status(404).json({ success: false, message: 'Offline admin file not found' });
    const raw = fs.readFileSync(offlineAdminPath, 'utf8');
    const admin = JSON.parse(raw);
    if (admin.username !== username) return res.status(404).json({ success: false, message: 'Offline admin not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    admin.passwordHash = hash;
    fs.writeFileSync(offlineAdminPath, JSON.stringify(admin, null, 2), 'utf8');
    return res.json({ success: true, message: 'Offline admin password updated' });
  } catch (err) {
    console.error('Change offline admin password failed', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin login with offline fallback
const fs = require('fs');
const offlineAdminPath = __dirname + '/offline-admin.json';
app.post('/api/admin-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Try DB first
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin']);
    if (rows.length > 0) {
      const admin = rows[0];
      const ok = await bcrypt.compare(password, admin.password);
      if (ok) return res.json({ success: true, user: { id: admin.id, email: admin.email, role: admin.role } });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
  } catch (err) {
    // DB error - will attempt offline fallback below
  }

  // Offline fallback
  try {
    if (fs.existsSync(offlineAdminPath)) {
      const raw = fs.readFileSync(offlineAdminPath, 'utf8');
      const admin = JSON.parse(raw);
      if (admin.username === email) {
        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (ok) return res.json({ success: true, user: { email: admin.username, role: admin.role, offline: true } });
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }
  } catch (err) {
    console.error('Offline admin check failed', err);
  }

  return res.status(401).json({ success: false, message: 'Admin not found or invalid credentials.' });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
