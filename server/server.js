require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { getDBStatus } = require('./config/db');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const queryRoutes = require('./routes/queryRoutes');
const dataRoutes = require('./routes/dataRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / Local MongoDB
connectDB();

// Security Middlewares
app.use(helmet());

// Dynamic CORS configuration supporting comma-separated production origins
const rawOrigins = process.env.CLIENT_URL;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, mobile, or same-origin requests without Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
    },
    credentials: true,
  })
);

// Request Parsing & Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check endpoint (checks backend readiness and MongoDB Atlas connection)
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.isConnected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
    },
    timestamp: new Date().toISOString(),
    service: 'ARGO Oceanographic AI Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/history', historyRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware (prevents leaking internal details in production)
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Unhandled Server Error]', err);
  } else {
    console.error('[Unhandled Server Error]', err.message);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[ARGO Server] Backend API running at http://localhost:${PORT}`);
    console.log(`[ARGO Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
