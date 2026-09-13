const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TenantCollege = sequelize.define('TenantCollege', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  collegeCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('collegeCode', value ? value.toUpperCase().trim() : '');
    }
  },
  collegeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productType: {
    type: DataTypes.STRING,
    defaultValue: 'College ERP' // 'College ERP', 'Hospital ERP', 'Lab ERP', 'School ERP', 'Pharmacy ERP', 'Service ERP'
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  city: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  state: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  mobileNumber: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  email: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  website: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  principalName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  principalMobile: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  principalEmail: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  installationDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  packageType: {
    type: DataTypes.STRING,
    defaultValue: 'Standard' // 'Basic', 'Standard', 'Premium', 'Custom'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active' // 'Active', 'Suspended', 'Expired'
  },
  licenseKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  licenseStartDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  licenseExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // Database connection details for this specific college/tenant
  dbServer: {
    type: DataTypes.STRING,
    defaultValue: '127.0.0.1'
  },
  dbPort: {
    type: DataTypes.INTEGER,
    defaultValue: 1433
  },
  dbName: {
    type: DataTypes.STRING,
    defaultValue: 'admission_db'
  },
  dbUsername: {
    type: DataTypes.STRING,
    defaultValue: 'sa'
  },
  dbPasswordEncrypted: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  // Enabled feature modules (JSON array of strings)
  installedModules: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify([
      'admission', 'registration', 'verification', 'fees', 
      'examination', 'results', 'promotion', 'library', 
      'staff', 'reports', 'id_card', 'accounts'
    ])
  },
  // Branding Assets
  logoUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  signatureUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  stampUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  // Financial Tracking
  amcAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  totalPaid: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
});

module.exports = TenantCollege;