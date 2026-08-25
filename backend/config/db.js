const { Sequelize } = require('sequelize');

// Override timezone formatting for MSSQL to prevent "+00:00" timezone offset suffixes which local SQL Server 2008 DATETIME columns reject
Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
  return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS');
};

let sequelize;

if (process.env.DB_DIALECT === 'sqlite') {
  console.log('[SQLite] Connecting to local SQLite file database (Portfolio Demo)...');
  const path = require('path');
  const dbPath = process.pkg
    ? path.join(path.dirname(process.execPath), 'database.sqlite')
    : path.join(__dirname, '..', 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
} else if (process.env.DB_CONNECTION_STRING) {
  console.log('[MSSQL] Connecting using custom Connection String...');
  const msnodesqlv8 = require('msnodesqlv8');
  sequelize = new Sequelize({
    dialect: 'mssql',
    dialectOptions: {
      driver: msnodesqlv8,
      connectionString: process.env.DB_CONNECTION_STRING,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        cryptoCredentialsDetails: {
          minVersion: 'TLSv1'
        }
      }
    },
    logging: false
  });
} else {
  console.log('[MSSQL] Connecting using host/port TCP parameters...');
  sequelize = new Sequelize(
    process.env.DB_NAME || 'admission_db',
    process.env.DB_USER || 'sa',
    process.env.DB_PASSWORD || 'BjsRampuria@2026',
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT, 10) || 1433,
      dialect: 'mssql',
      dialectOptions: {
        options: {
          encrypt: false, // For local SQL Server 2008 compatibility
          trustServerCertificate: true,
          cryptoCredentialsDetails: {
            minVersion: 'TLSv1'
          }
        }
      },
      logging: false
    }
  );
}

const ensureDatabaseExists = async () => {
  if (process.env.DB_DIALECT === 'sqlite') {
    console.log('[SQLite] Local database file verified.');
    return;
  }
  const dbName = process.env.DB_NAME || 'admission_db';
  console.log(`[MSSQL] Verifying database "${dbName}" exists on SQL Server...`);

  let tempSequelize;
  if (process.env.DB_CONNECTION_STRING) {
    const msnodesqlv8 = require('msnodesqlv8');
    const masterConnectionString = process.env.DB_CONNECTION_STRING.replace(
      new RegExp(`Database=${dbName}`, 'i'),
      'Database=master'
    );
    tempSequelize = new Sequelize({
      dialect: 'mssql',
      dialectOptions: {
        driver: msnodesqlv8,
        connectionString: masterConnectionString,
        options: {
          encrypt: false,
          trustServerCertificate: true,
          cryptoCredentialsDetails: {
            minVersion: 'TLSv1'
          }
        }
      },
      logging: false
    });
  } else {
    tempSequelize = new Sequelize(
      'master', // Connect to master system DB
      process.env.DB_USER || 'sa',
      process.env.DB_PASSWORD || 'BjsRampuria@2026',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT, 10) || 1433,
        dialect: 'mssql',
        dialectOptions: {
          options: {
            encrypt: false,
            trustServerCertificate: true,
            cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
            }
          }
        },
        logging: false
      }
    );
  }

  try {
    await tempSequelize.authenticate();
    const [results] = await tempSequelize.query(
      `SELECT name FROM sys.databases WHERE name = '${dbName}'`
    );
    
    if (results.length === 0) {
      console.log(`[MSSQL] Database "${dbName}" does not exist. Creating database...`);
      await tempSequelize.query(`CREATE DATABASE [${dbName}]`);
      console.log(`[MSSQL] Database "${dbName}" created successfully!`);
    } else {
      console.log(`[MSSQL] Database "${dbName}" verified.`);
    }
  } catch (error) {
    console.error(`[MSSQL] Master database check/creation failed:`, error.message);
  } finally {
    try {
      await tempSequelize.close();
    } catch (e) {}
  }
};

const connectDB = async () => {
  try {
    // Ensure database exists before attempting main sequelize connection
    await ensureDatabaseExists();

    await sequelize.authenticate();
    console.log('[MSSQL] Connected Successfully to SQL Server.');
    return true;
  } catch (error) {
    console.error('\n==================================================================');
    console.error('[DATABASE CONNECTION ERROR]');
    console.error('Failed to connect to Microsoft SQL Server.');
    if (process.env.DB_CONNECTION_STRING) {
      console.error(`Attempted Connection String: ${process.env.DB_CONNECTION_STRING}`);
    } else {
      console.error(`Attempted Host: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 1433}`);
      console.error(`Database Name: ${process.env.DB_NAME || 'admission_db'}`);
      console.error(`User: ${process.env.DB_USER || 'sa'}`);
    }
    console.error(`\nError Message: ${error.message}`);
    console.error('\nPROBABLE CAUSES & REMEDIES:');
    console.error('1. SQL Server service is not running. Start it in Services (services.msc).');
    console.error('2. TCP/IP connection protocol is disabled for MSSQL.');
    console.error('   Enable TCP/IP in SQL Server Configuration Manager and restart service.');
    console.error('3. Invalid credentials or password. Check DB_PASSWORD in backend/.env.');
    console.error('==================================================================\n');
    return false;
  }
};

module.exports = { sequelize, connectDB };
