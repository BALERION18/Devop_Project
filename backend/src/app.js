import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import deploymentRoutes from './routes/deploymentRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import uptimeRoutes from './routes/uptimeRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import { getHealth } from './controllers/serverController.js';

const app = express();

// Trust reverse proxy (Nginx) for secure rate-limiting and client IP resolution
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://13.232.254.140',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || !config.isProduction) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS origin validation.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiting
app.use('/api/', apiRateLimiter);

// Public root health check route for AWS Load Balancer / EC2 target groups
app.get('/api/health', getHealth);
app.get('/health', getHealth);

// API route mounts
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/monitors', uptimeRoutes);
app.use('/api/team', teamRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'DevOpsHub API is online and operational.',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
