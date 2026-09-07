// Polyfill AbortSignal.any for older Node.js runtimes (like Node 18 in pkg)
if (typeof AbortSignal.any !== 'function') {
  AbortSignal.any = function any(signals) {
    const controller = new AbortController();
    for (const signal of signals) {
      if (!signal) continue;
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener('abort', () => {
        controller.abort(signal.reason);
      }, { once: true });
    }
    return controller.signal;
  };
}

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { sequelize, connectDB } = require('./config/db');


const app = express();

// Enable CORS
app.use(cors());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads folder (student documents)
const isPackaged = typeof process.pkg !== 'undefined';
const uploadsPath = isPackaged 
  ? path.join(path.dirname(process.execPath), 'uploads') 
  : path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// Database connection readiness state
let isDbConnected = false;

// Middleware to prevent API queries while database is offline/connecting
app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  if (!isDbConnected) {
    return res.status(503).json({ 
      message: 'Database is still starting up and synchronizing. Please wait a few seconds and try again.' 
    });
  }
  next();
});

// API Routers
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/students',  require('./routes/students'));
app.use('/api/courses',   require('./routes/courses'));
app.use('/api/allotment', require('./routes/allotment'));
app.use('/api/fees',      require('./routes/fees'));
app.use('/api/library',   require('./routes/library'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/sessions',  require('./routes/sessions'));
app.use('/api/results',   require('./routes/results'));
app.use('/api/settings',  require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BJS Rampuria Jain Law College ERP server is running on MS SQL Server!', time: new Date() });
});

// Serve React Frontend (production build)
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
const indexHtmlPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(frontendPath));
  // React SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
} else {
  console.log('[Server] Frontend build not found. Running in API-only mode.');
  app.get('/', (req, res) => {
    res.send('<h2>BJS Rampuria Jain Law College ERP Backend is running. Frontend not built yet.</h2>');
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]:', err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const connectAndSyncDB = async () => {
  console.log('[MSSQL] Attempting to connect to SQL Server...');
  const isConnected = await connectDB();
  
  if (isConnected) {
    try {
      await sequelize.sync();
      console.log('[MSSQL] Database schemas synchronized successfully.');
      
      // Auto-migration for schema extensions
      try {
        await sequelize.query('ALTER TABLE Students ADD currentYear NVARCHAR(255) NULL');
        console.log('[Migration] Added currentYear column to Students table.');
      } catch (err) {}
      
      try {
        await sequelize.query('ALTER TABLE Students ADD currentSemester NVARCHAR(255) NULL');
        console.log('[Migration] Added currentSemester column to Students table.');
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE Books ADD price FLOAT NULL');
        console.log('[Migration] Added price column to Books table.');
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE Books ADD isHidden BIT NULL');
        console.log('[Migration] Added isHidden column to Books table.');
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE Students ADD academicSession NVARCHAR(255) NULL');
        console.log('[Migration] Added academicSession column to Students table.');
      } catch (err) {}

      try {
        await sequelize.query("UPDATE Students SET academicSession = '2025-26' WHERE academicSession IS NULL OR academicSession = ''");
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE FeePayments ADD academicSession NVARCHAR(255) NULL');
        console.log('[Migration] Added academicSession column to FeePayments table.');
      } catch (err) {}

      try {
        await sequelize.query("UPDATE FeePayments SET academicSession = '2025-26' WHERE academicSession IS NULL OR academicSession = ''");
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE FeePayments ADD transactionNo NVARCHAR(255) NULL');
        console.log('[Migration] Added transactionNo column to FeePayments table.');
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE Admins ADD role NVARCHAR(255) NULL');
        console.log('[Migration] Added role column to Admins table.');
      } catch (err) {}

      try {
        await sequelize.query('ALTER TABLE Admins ADD permissions NVARCHAR(MAX) NULL');
        console.log('[Migration] Added permissions column to Admins table.');
      } catch (err) {}
      
      const seedData = require('./seed');
      await seedData();
      
      isDbConnected = true;
      console.log('[MSSQL] Database initialization complete and ready.');
    } catch (e) {
      console.error('[Sync/Seed] Database error during initialization:', e.message);
      // Fallback to ready in case of temporary minor sync errors
      isDbConnected = true;
    }
  } else {
    console.log('[MSSQL] Database connection failed. Retrying in 4 seconds...');
    setTimeout(connectAndSyncDB, 4000);
  }
};

const startServer = () => {
  // Start listening on network port immediately
  app.listen(PORT, () => {
    console.log('\n==================================================================');
    console.log(`  ✅  BJS Rampuria Jain Law College ERP — Running on http://localhost:${PORT}`);
    console.log(`  📁  Database: Microsoft SQL Server 2008 (MSSQL)`);
    console.log(`  🔑  Login: admin / admin123 (created on database connect success)`);
    console.log('==================================================================\n');

    // Automatically open browser on boot in production / packaged environment
    const isProd = process.env.NODE_ENV === 'production' || typeof process.pkg !== 'undefined';
    if (isProd) {
      const { exec } = require('child_process');
      exec(`start http://localhost:${PORT}`, (err) => {
        if (err) console.error('[Launcher] Failed to auto-open browser:', err.message);
      });
    }
  });

  // Connect to MS SQL Server asynchronously in background
  connectAndSyncDB();
};

startServer();
