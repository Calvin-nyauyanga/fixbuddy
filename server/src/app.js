import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import helmet from 'helmet';
import prisma from './config/prisma.js';

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