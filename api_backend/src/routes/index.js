import express from 'express';
import authRoutes from './auth.js';
// import profileRoutes from './profiles.js';
// import analyticsRoutes from './analytics.js';
// import exportRoutes from './export.js';

const router = express.Router();

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TikTok Analytics API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
// router.use('/profiles', profileRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/export', exportRoutes);

// 404 handler for API routes
// router.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'API endpoint not found',
//     path: req.originalUrl,
//     timestamp: new Date().toISOString()
//   });
// });

export default router;
