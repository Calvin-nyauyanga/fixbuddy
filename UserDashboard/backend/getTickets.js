const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// This handler expects to be mounted at /UserDashboard/backend/getTickets or similar
// It will attempt to read from a MySQL DB via the main backend if available.
// For simplicity it will fallback to a local JSON file if DB is unreachable.

// Attempt to load a JSON fallback stored at backend/offline-tickets.json
const fallbackPath = path.join(__dirname, '..', '..', 'backend', 'offline-tickets.json');

router.get('/', async (req, res) => {
  // If the main backend has an API, proxy to it
  try{
    // Try contacting the main backend health endpoint to decide online state
    const host = process.env.MAIN_BACKEND_URL || 'http://localhost:3000';
    const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args));
    const proxyRes = await fetch(`${host}/api/tickets`, { method: 'GET' });
    if(proxyRes.ok){
      const json = await proxyRes.json();
      return res.json(json);
    }
  }catch(e){
    // fall through to local fallback
  }

  // Fallback to local JSON
  try{
    if(fs.existsSync(fallbackPath)){
      const raw = fs.readFileSync(fallbackPath, 'utf8');
      const data = JSON.parse(raw);
      return res.json(data);
    }
  }catch(err){
    console.error('Failed reading fallback tickets', err);
  }

  return res.status(503).json({ error: 'No tickets available (offline fallback missing)' });
});

module.exports = router;
