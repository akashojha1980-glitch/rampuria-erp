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

const path = require('path');
const fs = require('fs');

// Support loading .env from next to exe or inside directory
const envPaths = [
  path.join(path.dirname(process.execPath), '.env'),
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env')
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}
require('dotenv').config();

const express = require('express');
const cors = require('cors');
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
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/library',   require('./routes/library'));
app.use('/api/reports',   require('./routes/reports'));
app.use('/api/sessions',    require('./routes/sessions'));
app.use('/api/results',     require('./routes/results'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/payment-gateway', require('./routes/paymentGateway'));
app.use('/api/superadmin',  require('./routes/superAdmin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: isDbConnected ? 'ok' : 'disconnected', 
    connected: isDbConnected, 
    message: isDbConnected ? 'BJS Rampuria Jain Law College ERP server is running on MS SQL Server!' : 'Database connecting...', 
    time: new Date() 
  });
});

// Serve React Frontend (production build)
let frontendPath = path.join(__dirname, 'public');
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
  frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
}
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
  frontendPath = path.join(path.dirname(process.execPath), 'public');
}
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
  frontendPath = path.join(process.cwd(), 'frontend', 'dist');
}

const indexHtmlPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  console.log(`[Server] Serving frontend UI from: ${frontendPath}`);
  app.use(express.static(frontendPath));
  // React SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    try {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (e) {
      res.sendFile(indexHtmlPath);
    }
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
      const addColSafe = async (table, col, sqlDef) => {
        try {
          const checkQuery = `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${col}'`;
          const [res] = await sequelize.query(checkQuery, { type: sequelize.QueryTypes.SELECT });
          const exists = (res && (res.count > 0 || res.COUNT > 0));
          if (!exists) {
            await sequelize.query(`ALTER TABLE [${table}] ADD [${col}] ${sqlDef};`);
            console.log(`[Migration] Added column ${table}.${col}`);
          }
        } catch (e) {}
      };

      await addColSafe('Courses', 'schemeType', "NVARCHAR(255) DEFAULT 'Semester'");
      await addColSafe('Courses', 'academicYear', "NVARCHAR(255) DEFAULT '1st Year'");
      await addColSafe('Courses', 'semester', "NVARCHAR(255) DEFAULT 'I & II Semester'");
      await addColSafe('Courses', 'firstInstallment', "FLOAT DEFAULT 0");
      await addColSafe('Courses', 'firstInstallmentDesc', "NVARCHAR(255) DEFAULT 'at the time of Admission'");
      await addColSafe('Courses', 'secondInstallment', "FLOAT DEFAULT 0");
      await addColSafe('Courses', 'secondInstallmentDesc', "NVARCHAR(255) DEFAULT 'at the time of Exam Form'");
      await addColSafe('Courses', 'totalFee', "FLOAT DEFAULT 0");
      await addColSafe('Courses', 'cautionMoney', "FLOAT DEFAULT 300");
      await addColSafe('Courses', 'provisionalPromotionFee', "FLOAT DEFAULT 300");
      await addColSafe('Courses', 'isActive', "BIT DEFAULT 1");

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

const getLanIps = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const lanIps = [];
  for (const ifName in interfaces) {
    for (const iface of interfaces[ifName]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        lanIps.push({ ifName, address: iface.address });
      }
    }
  }
  lanIps.sort((a, b) => {
    const aScore = (a.address.startsWith('192.168.') ? 2 : (a.address.startsWith('10.') ? 2 : 1)) +
                  (/wi-?fi|ethernet|wlan/i.test(a.ifName) ? 2 : 0);
    const bScore = (b.address.startsWith('192.168.') ? 2 : (b.address.startsWith('10.') ? 2 : 1)) +
                  (/wi-?fi|ethernet|wlan/i.test(b.ifName) ? 2 : 0);
    return bScore - aScore;
  });
  return lanIps;
};

const startServer = () => {
  // Start listening on network port immediately on all network interfaces (0.0.0.0)
  app.listen(PORT, '0.0.0.0', () => {
    const lanIps = getLanIps();
    const primaryLanIp = lanIps.length > 0 ? lanIps[0].address : null;

    console.log('\n==================================================================');
    console.log(`  ✅  BJS Rampuria Jain Law College ERP — Server Live!`);
    console.log(`  💻  Local Access   : http://localhost:${PORT}`);
    if (primaryLanIp) {
      console.log(`  📱  LAN Access (Phone/Other PC) : http://${primaryLanIp}:${PORT}`);
    }
    console.log(`  📁  Database       : Microsoft SQL Server 2008 (MSSQL)`);
    console.log(`  🔑  Login          : admin / admin123`);
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
