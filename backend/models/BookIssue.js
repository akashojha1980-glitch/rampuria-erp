const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Student = require('./Student');
const Book = require('./Book');

const BookIssue = sequelize.define('BookIssue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  bookId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Books',
      key: 'id'
    }
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  returnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  fineAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Issued'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
});

// Relationships
Student.hasMany(BookIssue, { foreignKey: 'studentId', as: 'issues' });
BookIssue.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Book.hasMany(BookIssue, { foreignKey: 'bookId', as: 'issues' });
BookIssue.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

module.exports = BookIssue;
