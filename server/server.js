import "dotenv/config";                // ← FIRST LINE (loads env vars)

import app from './src/app.js';        // ← SECOND (now env vars are available)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ FixBuddy API running on port ${PORT}`);
  console.log(`📌 Database: PostgreSQL (postgres:***@localhost:5432/fixbuddy)`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});