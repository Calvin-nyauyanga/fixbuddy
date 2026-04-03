import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import helmet from 'helmet';
import helpdeskRoutes from './routes/helpdeskRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import fs from 'fs';
import prisma from './config/prisma.js';
import userRoutes from './routes/userRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { loadSystemSettings } from './middleware/settingsMiddleware.js';


const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(loadSystemSettings);

// Request logging middleware
app.use((req, res, next) => {
  const logLine = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - auth=${req.headers.authorization || 'none'}\n`;
  console.log(logLine.trim());
  try {
    fs.appendFileSync('app.log', logLine);
  } catch (e) {
    console.error('Failed to write app log', e);
  }
  next();
});

//Test Prisma connection
app.get('/test-prisma', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        res.json({
            message: 'Database connected!',
            userCount
        });
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Temporary test route to verify routing (placed before userRoutes mounting)
app.get('/api/users/test-route', (req, res) => {
    console.log('app-level /api/users/test-route handler');
    res.json({ success: true, message: 'App-level test route reached' });
});

app.use('/api/users', userRoutes);



//Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Fixbuddy API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;