const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  srNo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  registrationId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fatherName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  motherName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alternateMobile: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'General'
  },
  courseApplied: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Academic marks
  marks10: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  board10: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passingYear10: {
    type: DataTypes.STRING,
    allowNull: false
  },
  marks12: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  board12: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passingYear12: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject12: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Documents status JSON
  documents: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const rawValue = this.getDataValue('documents');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('documents', JSON.stringify(value));
    }
  },
  verificationStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  verificationRemarks: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  // Allotment details
  seatAllotted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allottedCourse: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  allottedOn: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  meritRank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  admissionBase: {
    type: DataTypes.ENUM('UG', 'PG'),
    defaultValue: 'UG'
  },
  formNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  studentAccNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  medium: {
    type: DataTypes.STRING,
    defaultValue: 'English'
  },
  permanentAddress: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  parentsContact: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  whatsAppNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  aadharNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  yearlyIncomeFather: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  yearlyIncomeMother: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  // Qualifying Exam details
  qualExamName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  qualUniversity: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  qualType: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  qualYear: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  qualMaxMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  qualObtainedMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  qualPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  // Extra detailed academic fields
  maxMarks10: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  obtainedMarks10: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxMarks12: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  obtainedMarks12: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gradUniversity: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  gradYear: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  gradSubject: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  gradMaxMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gradObtainedMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gradPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  pgUniversity: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  pgYear: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  pgSubject: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  pgMaxMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pgObtainedMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pgPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  otherExamName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  otherUniversity: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  otherYear: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  otherSubject: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  otherMaxMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  otherObtainedMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  otherPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  // Fee Payment information
  feesPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  feesAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  feesReceiptNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  feesPaymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  feesPaymentMode: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  feesInstallment: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Full Payment'
  },
  currentYear: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '1st Year'
  },
  currentSemester: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Annual'
  },
  // Profile specifics (roll, enrollment, emergency contact)
  profile: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const rawValue = this.getDataValue('profile');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('profile', JSON.stringify(value));
    }
  }
});

// Backward compatibility with Mongoose's toObject()
Student.prototype.toObject = function() {
  return this.get({ plain: true });
};

module.exports = Student;
