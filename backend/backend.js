// Combined backend logic for FixBuddy
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
const fs = require('fs');
// Serve static files from the project root so HTML, JS and CSS can be requested by the browser
app.use(express.static(path.join(__dirname, '..')));

// Database connection (inlined from db.js)
const db = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Sekaimhani_0',
    database: process.env.MYSQL_DATABASE || 'fixbuddyDB'
});

// Ensure tables exist (inlined from db.js)
(async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(50) DEFAULT 'medium',
    requester_name VARCHAR(255),
    requester_email VARCHAR(255),
    assigned_to VARCHAR(255),
    tags JSON DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    ticket_id INT DEFAULT NULL,
    action VARCHAR(100) DEFAULT NULL,
    type VARCHAR(100) DEFAULT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
})();

// Auth middleware (from tickets-api.js)
function requireAuth(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (apiKey === 'demo-key') {
    req.userId = 1;
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

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
// Create ticket with validation and transaction. Accepts extra optional fields.
app.post('/api/tickets', async (req, res) => {
  try {
    // Prefer server-side user identification in real auth. For now accept user_id if provided.
    const user_id = req.body.user_id || null;
    const rawTitle = req.body.title || req.body.subject || '';
    const rawDescription = req.body.description || '';
    const priority = req.body.priority || 'medium';
    const requester_name = req.body.requester_name || null;
    const requester_email = req.body.requester_email || null;
    const assigned_to = req.body.assigned_to || null;
    const tags = req.body.tags || null; // expect array or null
    const metadata = req.body.metadata || null; // expect object or null

    if (!rawTitle || rawTitle.trim() === '') {
      return res.status(400).json({ success: false, message: 'title/subject is required' });
    }

    const title = rawTitle.toString().trim().slice(0, 255);
    const description = rawDescription.toString().slice(0, 5000);

    // Start a transaction: insert ticket and activity atomically
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const insertSql = `INSERT INTO tickets
        (user_id, title, description, status, priority, requester_name, requester_email, assigned_to, tags, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      // MySQL JSON columns accept strings or JS objects via parameterization in mysql2
      const [ticketRes] = await conn.query(insertSql, [
        user_id,
        title,
        description,
        req.body.status || 'Open',
        priority,
        requester_name,
        requester_email,
        assigned_to,
        tags ? JSON.stringify(tags) : null,
        metadata ? JSON.stringify(metadata) : null
      ]);

      const ticketId = ticketRes.insertId;

      const actSql = 'INSERT INTO activities (user_id, ticket_id, action, type, message) VALUES (?, ?, ?, ?, ?)';
      await conn.query(actSql, [user_id, ticketId, 'ticket_created', 'ticket', `New ticket submitted: ${title}`]);

      await conn.commit();

      // fetch created ticket row
      const [rows] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
      return res.status(201).json(rows[0]);
    } catch (dbErr) {
      await conn.rollback().catch(() => {});
      console.error('Ticket transaction error', dbErr);
      return res.status(500).json({ success: false, message: 'Could not create ticket' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Server error creating ticket', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List tickets. Optional query params: user_id, status, limit (with fallback from getTickets.js)
app.get('/api/tickets', async (req, res) => {
  try {
    const { user_id, status, limit = 100 } = req.query;
    const params = [];
    let sql = 'SELECT * FROM tickets';
    const where = [];
    if (user_id) {
      where.push('user_id = ?');
      params.push(user_id);
    }
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching tickets from DB:', err);
    // Fallback to local JSON (from getTickets.js)
    const fallbackPath = path.join(__dirname, '..', 'backend', 'offline-tickets.json');
    try {
      if (fs.existsSync(fallbackPath)) {
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        const data = JSON.parse(raw);
        return res.json(data);
      }
    } catch (fallbackErr) {
      console.error('Fallback failed:', fallbackErr);
    }
    return res.status(503).json({ error: 'No tickets available (offline fallback missing)' });
  }
});

// From view-tickets-handler.js
app.get('/api/view-tickets', async (req, res) => {
  try {
    const { user_id, status, limit = 100 } = req.query;
    
    const userId = user_id || 1;
    
    let sql = 'SELECT id, user_id, title, description, status, priority, created_at, updated_at FROM tickets WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));
    
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching tickets for view-my-tickets:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

app.get('/api/view-tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const [rows] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching ticket details:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
});

app.put('/api/view-tickets/:ticketId/status', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Open', 'In Progress', 'Closed', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await db.query('UPDATE tickets SET status = ? WHERE id = ?', [status, ticketId]);
    
    return res.json({ success: true, message: 'Ticket status updated', ticketId, newStatus: status });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    return res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
});

// From tickets-api.js
app.get('/api/whoami', requireAuth, (req, res) => {
  res.json({ userId: req.userId });
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

// ----------------------------------
// Combined Client JS for FixBuddy
// ----------------------------------
// Note: everything below is sent to the browser (included via <script> tags)
// Sections are marked with comments indicating which HTML page(s) use them.


// Includes service worker, authentication, and ticket management

// ======= Common/Utility (all pages) =======
// Service Worker registration (sw.js) - executed on every page load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registered:', reg))
    .catch(err => console.log('Service Worker registration failed:', err));
}

// Auth functionality
// [Page: AdminDashBoard.html]
// verify that the logged‑in user is an admin; otherwise redirect
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    alert('Access denied. Admins only.');
    window.location.href = '../Main Dashboard/UserLoginPage.html';
  }
}

// Utility function used by login/signup forms to hash passwords
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem('fixbuddy_users') || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalUsers(users) {
  localStorage.setItem('fixbuddy_users', JSON.stringify(users));
}

// [Page: SignUp.html]
// initialize the signup form and handle online/offline registration
function initSignup(formSelector = '.login-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('signupMessage');
    if (msg) msg.textContent = '';

    if (!email || !password || !name) {
      if (msg) msg.textContent = 'Please fill all required fields.';
      return;
    }

    const passwordHash = await sha256Hex(password);

    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = res.ok ? await res.json() : null;
        if (res.ok && data && data.message === 'User registered!') {
          alert('Registration successful! Please log in.');
          window.location.href = 'UserLoginPage.html';
        } else {
          if (msg) msg.textContent = data?.message || 'Registration failed.';
        }
      } catch (err) {
        console.warn('Online registration failed, falling back to offline', err);
        const users = getLocalUsers();
        if (users[email]) {
          if (msg) msg.textContent = 'User already exists locally.';
          return;
        }
        users[email] = { name, passwordHash, role: 'user' };
        saveLocalUsers(users);
        alert('Registered locally (offline). Sync when online.');
        window.location.href = 'UserLoginPage.html';
      }
    } else {
      const users = getLocalUsers();
      if (users[email]) {
        if (msg) msg.textContent = 'User already exists locally.';
        return;
      }
      users[email] = { name, passwordHash, role: 'user' };
      saveLocalUsers(users);
      alert('Registered locally (offline). Sync when online.');
      window.location.href = 'UserLoginPage.html';
    }
  });
}

// [Pages: UserLoginPage.html and AdminLoginPage.html]
// handle login logic with online and offline fallback
function initLogin(formSelector = '.login-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('loginMessage');
    if (msg) msg.textContent = '';

    if (!email || !password) {
      if (msg) msg.textContent = 'Please enter email and password.';
      return;
    }

    const passwordHash = await sha256Hex(password);

    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = res.ok ? await res.json() : null;
        if (res.ok && data && data.message === 'Login successful!') {
          localStorage.setItem('user', JSON.stringify({ id: data.userId, email, role: 'user' }));
          window.location.href = '../UserDashboard/UserDashboard.html';
        } else {
          if (msg) msg.textContent = data?.message || 'Login failed.';
        }
      } catch (err) {
        console.warn('Online login failed, trying offline', err);
        const users = getLocalUsers();
        const user = users[email];
        if (user && user.passwordHash === passwordHash) {
          localStorage.setItem('user', JSON.stringify({ email, role: user.role || 'user' }));
          window.location.href = '../UserDashboard/UserDashboard.html';
        } else {
          if (msg) msg.textContent = 'Invalid credentials.';
        }
      }
    } else {
      const users = getLocalUsers();
      const user = users[email];
      if (user && user.passwordHash === passwordHash) {
        localStorage.setItem('user', JSON.stringify({ email, role: user.role || 'user' }));
        window.location.href = '../UserDashboard/UserDashboard.html';
      } else {
        if (msg) msg.textContent = 'Invalid credentials.';
      }
    }
  });
}

// Ticket functionality
// [Page: submitticket.html]
// ticket submission logic, with offline caching
function initSubmitTicket() {
  const form = document.getElementById("ticketForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const user_id = 1; // Replace with actual user ID from auth

    const ticketData = {
        user_id: user_id,
        title: title,
        description: description,
        status: "Open",
        priority: "medium"
    };

    try {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketData)
        });

        if (response.ok) {
            document.getElementById("ticketMessage").innerText = "Ticket submitted successfully!";
            this.reset();
        } else {
            throw new Error('Server error');
        }
    } catch (err) {
        console.log('Offline, saving locally', err);
        let tickets = JSON.parse(localStorage.getItem("fixbuddy_tickets_cache")) || [];
        const localTicket = {
            id: "#FB" + Math.floor(Math.random() * 100000),
            ...ticketData,
            created_at: new Date().toISOString()
        };
        tickets.push(localTicket);
        localStorage.setItem("fixbuddy_tickets_cache", JSON.stringify(tickets));
        document.getElementById("ticketMessage").innerText = "Ticket saved locally (offline). It will sync when online.";
        this.reset();
    }
  });
}

// [Pages: MyTickets.html, view-my-tickets.html]
// logic for loading and rendering ticket lists on user dashboard
function initViewTickets() {
  const ticketListEl = document.getElementById('ticketList') || document.getElementById('ticketsTable');
  if (!ticketListEl) return;

  const LOCAL_KEY = 'fixbuddy_tickets_cache';

  function setYear(){
    try{ document.getElementById('year').textContent = new Date().getFullYear(); }catch(e){}
  }

  function loadFromCache(){
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveToCache(tickets){
    try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(tickets)); }catch(e){console.warn('Failed to save cache',e)}
  }

  function renderTickets(tickets){
    ticketListEl.innerHTML = '';
    if(!tickets || tickets.length === 0){
      ticketListEl.innerHTML = '<p class="muted">No tickets found.</p>';
      return;
    }

    tickets.forEach(t => {
      const card = document.createElement('article');
      card.className = 'ticket-card';
      card.dataset.ticket = JSON.stringify(t);
      card.innerHTML = `
        <h3>${escapeHtml(t.title || 'Untitled')}</h3>
        <p class="desc">${escapeHtml(t.description || '')}</p>
        <p class="meta">Status: <span class="status ${(t.status||'').toLowerCase()}">${escapeHtml(t.status||'Unknown')}</span></p>
        <p class="meta"><small>Created: ${new Date(t.date || t.created_at || Date.now()).toLocaleString()}</small></p>
        <p><button class="btn btn-secondary view-details">View Details</button></p>
      `;
      ticketListEl.appendChild(card);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[c]));
  }

  async function fetchOnline(){
    try{
      const response = await fetch(`/api/tickets?user_id=1`);
      if (!response.ok) throw new Error('Network response not ok');
      const tickets = await response.json();
      saveToCache(tickets);
      renderTickets(tickets);
    } catch (err) {
      console.warn('Could not fetch tickets, using cache', err);
      const cached = loadFromCache();
      renderTickets(cached);
    }
  }

  fetchOnline();
  setYear();
}

// Initialize based on page
// page-specific initialization; runs immediately after DOM load
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('AdminDashBoard')) {
    checkAdminAccess();
  }
  if (document.querySelector('.login-form')) {
    initLogin();
    initSignup();
  }
  if (document.getElementById('ticketForm')) {
    initSubmitTicket();
  }
  if (document.getElementById('ticketList') || document.getElementById('ticketsTable')) {
    initViewTickets();
  }
});
// =========================================================================
// SERVICE WORKER CODE (sw.js) - SMART OFFLINE CACHING & PWA FEATURES
// =========================================================================

// CACHE VERSIONING - Auto-invalidate old caches when you update assets
// Increment this version number to automatically clear and rebuild cache
const CACHE_VERSION = 'v3';
const CACHE_NAME = `fixbuddy-pwa-${CACHE_VERSION}`;

// NETWORK TIMEOUT - Prevent hanging on slow/dead connections (milliseconds)
const NETWORK_TIMEOUT = 5000; // 5 seconds

// CRITICAL ASSETS TO PRECACHE - Loaded on service worker install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/CSS-STYLING-UNIVERSAL/STYLING-UNIVERSAL.css',
  '/UserDashboard/view-my-tickets.html',
  '/UserDashboard/submitticket.html',
  '/UserDashboard/MyTickets.html'
];

// =========================================================================
// SW INSTALL EVENT - Download and cache critical assets on first load
// =========================================================================
self.addEventListener('install', event => {
  // Activate this SW immediately without waiting for all pages to close
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Precaching critical assets...');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// =========================================================================
// SW ACTIVATE EVENT - Clean up old cache versions & take control of pages
// =========================================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Delete any cache that doesn't match current version
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache -', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients (pages) to use this new SW version
      self.clients.claim();
      console.log('Service Worker: Activated and claimed all pages');
    })
  );
});

// =========================================================================
// HELPER FUNCTION - Fetch with timeout to prevent hanging
// =========================================================================
function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    )
  ]);
}

// =========================================================================
// SW FETCH EVENT - Handle all network requests intelligently
// =========================================================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // LEGACY PATH REDIRECT - Handle old incorrect CSS path from stale cache
  // (in case old pages were cached before the fix)
  if (url.pathname.includes('/Main%20Dashboard/css-styling/')) {
    console.warn('Service Worker: Redirecting legacy path to correct stylesheet');
    event.respondWith(fetch('/CSS-STYLING-UNIVERSAL/STYLING-UNIVERSAL.css'));
    return;
  }

  // Only handle GET requests (ignore POST, PUT, DELETE, etc)
  if (event.request.method !== 'GET') return;

  // ====================================================================
  // STRATEGY 1: STALE-WHILE-REVALIDATE for HTML pages (navigate mode)
  // Serve instantly from cache, update in background
  // ====================================================================
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetchWithTimeout(event.request, NETWORK_TIMEOUT)
          .then(resp => {
            if (resp && resp.status === 200 && resp.type === 'basic') {
              const copy = resp.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
            }
            return resp;
          })
          .catch(err => {
            console.warn('Service Worker: Network error, using cache:', err);
            return cached || caches.match('/offline.html');
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ====================================================================
  // STRATEGY 2: NETWORK-FIRST for stylesheets
  // Always try network first to avoid stale CSS, fallback to cache
  // ====================================================================
  if (url.pathname.endsWith('STYLING-UNIVERSAL.css')) {
    event.respondWith(
      fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(err => {
          console.warn('Service Worker: Stylesheet network failed, using cache:', err);
          return caches.match(event.request);
        })
    );
    return;
  }

  // ====================================================================
  // STRATEGY 3: CACHE-FIRST for other assets
  // Use cache if available, fallback to network with timeout
  // ====================================================================
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached; // Return from cache immediately if available
      
      return fetchWithTimeout(event.request, NETWORK_TIMEOUT)
        .then(resp => {
          // Cache successful responses
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(err => {
          console.warn('Service Worker: Request failed, returning offline fallback:', err);
          // Return offline fallback for failed requests
          return caches.match('/backend/offline-tickets.json');
        })
    })
  );
});

// =========================================================================
// SW MESSAGE HANDLER - Allow pages to communicate with service worker
// =========================================================================
self.addEventListener('message', event => {
  // SKIP_WAITING message - Install waiting SW immediately
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING command');
    self.skipWaiting();
  }
  
  // CLEAR_CACHE message - Remove all cached data on demand
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Service Worker: Clearing all cached data');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true, message: 'Cache cleared' });
    });
  }
});

// =========================================================================
// SW BACKGROUND SYNC EVENT - Sync pending tickets when user comes online
// NOTE: This requires your app to register sync via:
// navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-tickets'))
// and requires a backend endpoint at POST /api/sync-pending-tickets
// =========================================================================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tickets') {
    console.log('Service Worker: Background sync triggered for tickets');
    event.waitUntil(
      // Only attempt sync if endpoint exists, otherwise just log
      fetch('/api/sync-pending-tickets', { method: 'POST' })
        .then(resp => {
          if (resp.ok) return resp.json();
          throw new Error('Sync endpoint not available');
        })
        .then(data => {
          console.log('Service Worker: Tickets synced:', data);
        })
        .catch(err => {
          console.log('Service Worker: Sync skipped (endpoint unavailable):', err.message);
        })
    );
  }
});
