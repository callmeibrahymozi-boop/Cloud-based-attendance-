import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './src/server/middleware/auth';
import authRoutes from './src/server/routes/authRoutes';
import userRoutes from './src/server/routes/userRoutes';
import courseRoutes from './src/server/routes/courseRoutes';
import attendanceRoutes from './src/server/routes/attendanceRoutes';
import reportRoutes from './src/server/routes/reportRoutes';
import dashboardRoutes from './src/server/routes/dashboardRoutes';
import auditRoutes from './src/server/routes/auditRoutes';
import systemRoutes from './src/server/routes/systemRoutes';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware);

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'EduTrack Attendance Management System',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/system', systemRoutes);

  // Global Error Handler for API
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  // Vite integration
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduTrack Attendance Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
