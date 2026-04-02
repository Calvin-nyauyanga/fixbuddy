import express from 'express';
import {
  // Admin Reports
  getAdminDashboardStats,
  getAdminTicketAnalytics,
  getTicketsByStatus,
  getTicketsByPriority,
  getTicketsByCategory,
  getTicketsResolutionTrends,
  getAdminRecentActivities,
  exportReportToPDF,
  
  // User Reports
  getUserDashboardStats,
  getUserTicketsAnalytics,
  getUserTicketsByStatus,
  getUserTicketsSubmissionTrends,
} from '../controllers/reportsController.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ADMIN REPORTS ROUTES
// ============================================
router.use('/admin', adminAuthMiddleware);

// Dashboard & Statistics
router.get('/admin/stats', getAdminDashboardStats);
router.get('/admin/analytics', getAdminTicketAnalytics);
router.get('/admin/activities', getAdminRecentActivities);

// Tickets Analysis
router.get('/admin/tickets/status', getTicketsByStatus);
router.get('/admin/tickets/priority', getTicketsByPriority);
router.get('/admin/tickets/category', getTicketsByCategory);
router.get('/admin/tickets/trends', getTicketsResolutionTrends);

// Reports Export
router.get('/admin/export-pdf', exportReportToPDF);

// ============================================
// USER REPORTS ROUTES
// ============================================
router.use('/user', authMiddleware);

// User Dashboard Stats
router.get('/user/stats', getUserDashboardStats);
router.get('/user/analytics', getUserTicketsAnalytics);
router.get('/user/tickets/status', getUserTicketsByStatus);
router.get('/user/tickets/trends', getUserTicketsSubmissionTrends);
router.get('/user/status-distribution', authMiddleware, getUserTicketsByStatus);
router.get('/user/submission-trends', authMiddleware, getUserTicketsSubmissionTrends);

export default router;