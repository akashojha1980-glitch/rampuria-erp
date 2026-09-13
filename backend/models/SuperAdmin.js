const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const SuperAdmin = sequelize.define('SuperAdmin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('username', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  securityQuestion: {
    type: DataTypes.STRING,
    defaultValue: 'What is your software company master key code?'
  },
  securityAnswer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'MasterSuperAdmin'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
      if (admin.securityAnswer) {
        const salt = await bcrypt.genSalt(10);
        admin.securityAnswer = await bcrypt.hash(admin.securityAnswer.toLowerCase().trim(), salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
      if (admin.changed('securityAnswer')) {
        const salt = await bcrypt.genSalt(10);
        admin.securityAnswer = await bcrypt.hash(admin.securityAnswer.toLowerCase().trim(), salt);
      }
    }
  }
});

// Instance method to check password
SuperAdmin.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to verify security answer
SuperAdmin.prototype.matchSecurityAnswer = async function (enteredAnswer) {
  if (!this.securityAnswer) return false;
  return await bcrypt.compare(enteredAnswer.toLowerCase().trim(), this.securityAnswer);
};

module.exports = SuperAdmin;