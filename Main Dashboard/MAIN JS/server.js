// Serve service worker and font assets for offline access
const path = require('path');
app.use('/sw.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../../sw.js'));
});
app.use('/node_modules/@fontsource/poppins/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../../node_modules/@fontsource/poppins/index.css'));
});
// ...existing code...
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const OTP_EXPIRY_MINUTES = 10;
let otpStore = {}; // { email: { otp, expiresAt } }
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '302019067009-t7ghuccd6oj44goe6frob9s0sunu0d63.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('302019067009-t7ghuccd6oj44goe6frob9s0sunu0d63.apps.googleusercontent.com');

app.post('/api/google-auth', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.json({ success: false, message: 'Missing credential.' });

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: '302019067009-t7ghuccd6oj44goe6frob9s0sunu0d63.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // Find or create user in DB
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (row) {
                // User exists, log in
                res.json({ success: true, user: { id: row.id, email: row.email }, message: 'Google login successful!' });
            } else {
                // Create user
                db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [payload.name, email, null], function (err2) {
                    if (err2) return res.json({ success: false, message: 'Registration failed.' });
                    res.json({ success: true, user: { id: this.lastID, email }, message: 'Google login successful!' });
                });
            }
        });
    } catch (error) {
        res.json({ success: false, message: 'Invalid Google credential.' });
    }
});
// Google Auth endpoint
app.post('/api/google-auth', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.json({ success: false, message: 'Missing credential.' });
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        // Find or create user in DB
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = rows[0];
        if (user) {
            // User exists, log in
            res.json({ success: true, user: { id: user.id, email: user.email, role: user.role }, message: 'Google login successful!' });
        } else {
            // Create user
            await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [payload.name, email, null, 'user']);
            const [newRows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            user = newRows[0];
            res.json({ success: true, user: { id: user.id, email: user.email, role: user.role }, message: 'Google login successful!' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Invalid Google credential.' });
    }
});
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.', {
    setHeaders: (res, path) => {
        // Set correct Content-Type for .woff2 fonts
        if (path.endsWith('.woff2')) {
            res.setHeader('Content-Type', 'font/woff2');
        }
        // Set Cache-Control for static resources
        if (path.match(/\.(woff2|css|js)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        // Set Content-Security-Policy for frame protection
        res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
        // Remove X-Frame-Options if present (Express does not set by default)
    }
}));

// --- ACTIVITY LOGGING AND RECENT ACTIVITIES ENDPOINT ---

// Replace admin login endpoint with activity logging
app.post('/api/admin-login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (row && row.role === 'admin' && await bcrypt.compare(password, row.password)) {
            // Log admin login activity
            const now = new Date().toISOString();
            db.run('INSERT INTO activities (type, user, details, date) VALUES (?, ?, ?, ?)',
                ['Admin Login', row.email, 'Admin logged in.', now]);
            res.json({ success: true, message: 'Admin login successful!', admin: { id: row.id, email: row.email } });
        } else if (row && row.role !== 'admin') {
            res.json({ success: false, message: 'Not an admin account.' });
        } else {
            res.json({ success: false, message: 'Invalid credentials.' });
        }
    });
});

// Replace ticket submission endpoint with activity logging
app.post('/api/tickets', (req, res) => {
    const { user_id, title, description } = req.body;
    db.run('INSERT INTO tickets (user_id, title, description) VALUES (?, ?, ?)', [user_id, title, description], function(err) {
        // Ensure users table has role column
        const ensureRoleColumn = async () => {
            try {
                await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(255) DEFAULT 'user'");
            } catch (err) {
                // Ignore error if column already exists
            }
        };
        ensureRoleColumn();
        if (err) {
            return res.status(500).json({ success: false, message: 'Ticket submission failed.' });
        }
        // Increment admin notification count
        adminNotifications++;
        // Log activity for new ticket
        const now = new Date().toISOString();
        db.run('INSERT INTO activities (type, user, details, date) VALUES (?, ?, ?, ?)',
            ['New Ticket Submitted', user_id.toString(), `Submitted ticket #${this.lastID}`, now], (err2) => {
                // Emit real-time events for new ticket and activity
                io.emit('new_ticket', {
                    ticket_id: this.lastID,
                    user_id,
                    title,
                    description,
                    created_at: now
                });
                io.emit('activity', {
                    type: 'New Ticket Submitted',
                    user: user_id.toString(),
                    details: `Submitted ticket #${this.lastID}`,
                    date: now
                });
                res.json({ success: true, message: 'Ticket submitted!', ticket_id: this.lastID });
            });
    });
});

// Replace ticket solve/report endpoint with activity logging
app.post('/api/tickets/:id/solve', (req, res) => {
    const ticket_id = req.params.id;
    const { admin_id, report_text } = req.body;
    db.serialize(() => {
        db.run('UPDATE tickets SET status = ? WHERE id = ?', ['solved', ticket_id], function(err) {
            if (err) return res.json({ message: 'Failed to update ticket status.' });
            db.run('INSERT INTO reports (ticket_id, admin_id, report_text) VALUES (?, ?, ?)', [ticket_id, admin_id, report_text], function(err2) {
                if (err2) return res.json({ message: 'Failed to post report.' });
                // Log activity for ticket solved
                const now = new Date().toISOString();
                db.get('SELECT name FROM users WHERE id = ?', [admin_id], (err3, userRow) => {
                    const adminName = userRow && userRow.name ? userRow.name : `Admin #${admin_id}`;
                    db.run('INSERT INTO activities (type, user, details, date) VALUES (?, ?, ?, ?)',
                        ['Ticket Closed', adminName, `Closed ticket #${ticket_id}`, now], (err4) => {
                            // Emit real-time events for ticket closed and activity
                            io.emit('ticket_solved', {
                                ticket_id,
                                admin_id,
                                report_text,
                                adminName,
                                date: now
                            });
                            io.emit('activity', {
                                type: 'Ticket Closed',
                                user: adminName,
                                details: `Closed ticket #${ticket_id}`,
                                date: now
                            });
                            res.json({ message: 'Ticket marked as solved and report posted.' });
                        });
                });
            });
        });
    });
});

// Real DB query for recent activities
app.get('/api/recent-activities', (req, res) => {
    db.all('SELECT type, user, details, date FROM activities ORDER BY date DESC LIMIT 20', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch activities.' });
        } else {
            res.json(rows);
        }
    });
});

function generateOtpForEmail(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
    otpStore[email] = { otp, expiresAt };
    return otp;
}

function isValidOtp(email, otp) {
    const entry = otpStore[email];
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
        delete otpStore[email];
        return false;
    }
    if (entry.otp !== otp) return false;
    delete otpStore[email];
    return true;
}
// Reset password endpoint
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email], function(err) {
        if (err) return res.json({ message: 'Failed to reset password.' });
        if (this.changes === 0) {
            return res.json({ message: 'No user found with that email.' });
        }
        // Optionally: send confirmation email here
        res.json({ message: 'Password reset successful. You can now log in.' });
    });
});
// --- ADMIN NOTIFICATION LOGIC (in-memory for demo) ---
let adminNotifications = 0;

// Admin: Get all reports
app.get('/api/reports', (req, res) => {
    db.all('SELECT * FROM reports', [], (err, rows) => {
        if (err) return res.json({ message: 'Error fetching reports.' });
        res.json(rows);
    });
});
// --- TICKET & REPORT ENDPOINTS ---

// Get all tickets (optionally filter by user)
app.get('/api/tickets', (req, res) => {
    const { user_id } = req.query;
    let sql = 'SELECT * FROM tickets';
    let params = [];
    if (user_id) {
        sql += ' WHERE user_id = ?';
        params.push(user_id);
    }
    db.all(sql, params, (err, rows) => {
        if (err) return res.json({ message: 'Error fetching tickets.' });
        res.json(rows);
    });
});

// Mark ticket as solved and post a report
app.post('/api/tickets/:id/solve', (req, res) => {
    const ticket_id = req.params.id;
    const { admin_id, report_text } = req.body;
    db.serialize(() => {
        db.run('UPDATE tickets SET status = ? WHERE id = ?', ['solved', ticket_id], function(err) {
            if (err) return res.json({ message: 'Failed to update ticket status.' });
            db.run('INSERT INTO reports (ticket_id, admin_id, report_text) VALUES (?, ?, ?)', [ticket_id, admin_id, report_text], function(err2) {
                if (err2) return res.json({ message: 'Failed to post report.' });
                res.json({ message: 'Ticket marked as solved and report posted.' });
            });
        });
    });
});

// Get reports for a ticket
app.get('/api/tickets/:id/reports', (req, res) => {
    const ticket_id = req.params.id;
    db.all('SELECT * FROM reports WHERE ticket_id = ?', [ticket_id], (err, rows) => {
        if (err) return res.json({ message: 'Error fetching reports.' });
        res.json(rows);
    });
});
// --- USER AUTHENTICATION LOGIC (SQLite) ---
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');


// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
)`);

// Create tickets table
db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);

// Create reports table
db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER,
    admin_id INTEGER,
    report_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ticket_id) REFERENCES tickets(id),
    FOREIGN KEY(admin_id) REFERENCES users(id)
)`);

// Create activities table
db.run(`CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    user TEXT,
    details TEXT,
    date DATETIME
)`);

// Register user endpoint
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.json({ message: 'Name, email and password required.' });
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash], function(err) {
        if (err) return res.json({ message: 'Registration failed. Email may already exist.' });
        res.json({ message: 'User registered!' });
    });
});

// Login user endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (row && await bcrypt.compare(password, row.password)) {
            // In production, set a session or JWT here
            res.json({ success: true, message: 'Login successful!', user: { id: row.id, email: row.email, role: row.role } });
        } else {
            res.json({ success: false, message: 'Invalid credentials.' });
        }
    });
});


// Send OTP to email
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ message: 'If this email is registered, an OTP has been sent.' });

    // Generate OTP and expiry
    const otp = generateOtpForEmail(email);
    console.log(`OTP for ${email}: ${otp}`); // For testing only

    // Set up email transport (update these for your own Gmail)
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'yourgmail@gmail.com',
            pass: 'yourapppassword'
        }
    });

    let mailOptions = {
        from: '"FixBuddy Support" <yourgmail@gmail.com>',
        to: email,
        subject: 'Your FixBuddy OTP Code',
        text: `Your OTP code is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error sending OTP:', err);
    }
    // Always respond with generic message
    res.json({ message: 'If this email is registered, an OTP has been sent.' });
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (isValidOtp(email, otp)) {
        res.json({ message: 'OTP verified! You can now reset your password.' });
    } else {
        res.json({ message: 'Invalid or expired OTP.' });
    }
});

server.listen(3000, () => console.log('Server running with Socket.IO on http://localhost:3000'));