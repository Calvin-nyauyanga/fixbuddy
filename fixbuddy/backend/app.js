const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DB connection (adjust credentials)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Sekaimhani0',
  database: 'fixbuddy'
};

// Helper for DB queries
async function query(sql, params=[]) {
  const conn = await mysql.createConnection(dbConfig);
  const [results] = await conn.execute(sql, params);
  await conn.end();
  return results;
}

// Submit a new ticket
app.post('/tickets', async (req, res) => {
  const { user_id, title, description } = req.body;
  const rs = await query(
    'INSERT INTO tickets (user_id, title, description) VALUES (?, ?, ?)',
    [user_id, title, description]
  );

  await query(
    'INSERT INTO activities (type, message) VALUES (?, ?)',
    ['ticket', `New ticket submitted: ${title}`]
  );

  res.json({ success: true, ticketId: rs.insertId });
});

// Get tickets (all or by user)
app.get('/tickets', async (req, res) => {
  const { user_id } = req.query;
  let tickets;
  if (user_id) {
    tickets = await query('SELECT * FROM tickets WHERE user_id = ?', [user_id]);
  } else {
    tickets = await query('SELECT * FROM tickets');
  }
  res.json(tickets);
});

// Get activities (recent admin dashboard)
app.get('/activities', async (req, res) => {
  const acts = await query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 10');
  res.json(acts);
});

app.listen(5000, () => console.log('Server running on port 5000'));