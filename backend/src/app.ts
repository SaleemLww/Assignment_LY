import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { swaggerSpec } from './docs/swagger.config';
import uploadRoutes from './routes/upload.routes';
import timetableRoutes from './routes/timetable.routes';

// Create Express app
const app: Application = express();

// CORS configuration - MUST be first, before any other middleware
app.use(cors({
  origin: config.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} from ${req.get('origin') || 'no origin'}`);
  console.log(`   CORS Origin configured: ${config.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  next();
});

// Test CORS endpoint
app.get('/test-cors', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'CORS is working!', timestamp: new Date().toISOString() });
});

app.post('/test-upload', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Upload endpoint reached!', timestamp: new Date().toISOString() });
});

// Security middleware - Configure CSP for Swagger UI (disabled for CORS testing)
if (!config.isDevelopment()) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}

// Logging middleware
if (config.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Teacher Timetable API Docs',
}));

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Teacher Timetable Extraction API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      apiDocs: '/api-docs',
      upload: '/api/upload',
      uploadStatus: '/api/upload/status/:jobId',
      timetables: '/api/v1/timetables',
      timetableById: '/api/v1/timetables/:id',
      updateTimeBlock: '/api/v1/timetables/:timetableId/blocks/:blockId',
      deleteTimetable: '/api/v1/timetables/:id',
    },
  });
});

// Mount routes
app.use('/api/upload', uploadRoutes);
app.use('/api/v1/timetables', timetableRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
interface CustomError extends Error {
  statusCode?: number;
  status?: string;
}

app.use((err: CustomError, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  console.error('Error:', {
    message: err.message,
    stack: config.isDevelopment() ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error',
    ...(config.isDevelopment() && { stack: err.stack }),
  });
});

export default app;
