import dotenv from "dotenv";

// Load environment variables FIRST before any imports that use them
dotenv.config();

import app from './src/app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ FixBuddy API running on port ${PORT}`);
  console.log(`📌 Database: PostgreSQL (postgres:***@localhost:5432/fixbuddy)`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});