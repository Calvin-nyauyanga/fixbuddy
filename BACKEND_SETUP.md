# FixBuddy - Backend Setup Guide

## Issue: 404 Errors on /api/tickets

You're seeing 404 errors because you're using **Live Server** (port 5500), which is a static file server and doesn't run your Express backend.

### Solution: Run the Express Backend

#### Step 1: Install Dependencies
```bash
cd c:\Users\FUNGAI NYAMAHOWA\Desktop\fixbuddy
npm install
```

#### Step 2: Start the Backend Server
```bash
node backend/backend.js
```

You should see output like:
```
Backend running on port 3000
Mounted fallback tickets router from backend/getTickets.js
Mounted view-tickets handler from backend/view-tickets-handler.js
```

#### Step 3: Access Your App
Instead of using Live Server (port 5500), visit:
- **http://localhost:3000/UserDashboard/UserDashboard.html**

Or keep Live Server running on a different folder and proxy requests to the backend.

---

## Architecture

| Component | Purpose |
|-----------|---------|
| `backend/backend.js` | Main Express server, defines `/api/tickets` and other routes |
| `backend/getTickets.js` | Ticket fetching router (fallback handler) |
| `backend/view-tickets-handler.js` | Handler for `/api/view-tickets` (view-my-tickets.html navigation) |
| `UserDashboard/UserDashboard.html` | Fetches from `/api/tickets?user_id=1` |
| `UserDashboard/view-my-tickets.html` | Tries multiple endpoints: `/api/view-tickets` → `/api/tickets` → `../backend/getTickets` |

---

## API Endpoints

### Tickets
- `GET /api/tickets?user_id=1` - Fetch user's tickets (in UserDashboard)
- `GET /api/view-tickets` - Fetch all tickets (view-my-tickets.html)
- `GET /api/view-tickets/:id` - Fetch specific ticket
- `PUT /api/view-tickets/:id/status` - Update ticket status

---

## Troubleshooting

### Still seeing 404 errors?
1. ✅ Make sure `node backend/backend.js` is running
2. ✅ Check that you're accessing `http://localhost:3000` (not 5500)
3. ✅ Check console for endpoint details - app logs which endpoint succeeded
4. ✅ Refresh the page with `Ctrl+Shift+R` (hard refresh)

### Backend not starting?
Check these files exist:
- `backend/backend.js` ✓
- `backend/getTickets.js` ✓
- `backend/view-tickets-handler.js` ✓

If missing dependencies:
```bash
npm install express mysql2 bcryptjs cors dotenv body-parser
```

### Offline fallback
If the backend is offline, the app will:
- Show sample tickets from cache
- Use localStorage for persistence
- Log warnings to console about backend unavailability

---

## Environment Variables (.env)

Create a `.env` file in the project root:
```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=fixbuddyDB
PORT=3000
```

The app uses sensible defaults if .env is not present.
