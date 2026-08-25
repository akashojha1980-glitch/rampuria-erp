const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DB_DIR = path.join(process.cwd(), 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Simple Helper to generate short unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

class JsonDatabase {
  constructor(collectionName, defaultData = []) {
    this.filePath = path.join(DB_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  getAll() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch (e) {
      return [];
    }
  }

  saveAll(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // Mimics Mongoose Model query methods
  async find(query = {}) {
    let items = this.getAll();
    
    // Simple filter matching
    if (query.$or) {
      items = items.filter(item => {
        return query.$or.some(q => {
          return Object.keys(q).some(key => {
            const val = q[key];
            if (val && val.$regex) {
              const regex = new RegExp(val.$regex, val.$options || '');
              // Match nested or flat properties
              if (key.includes('.')) {
                const parts = key.split('.');
                const nestedVal = item[parts[0]]?.[parts[1]];
                return regex.test(String(nestedVal || ''));
              }
              return regex.test(String(item[key] || ''));
            }
            return item[key] === val;
          });
        });
      });
    } else {
      Object.keys(query).forEach(key => {
        if (key === 'registrationDate' && (query[key].$gte || query[key].$lt)) {
          // Date range filter
          items = items.filter(item => {
            const date = new Date(item.registrationDate);
            if (query[key].$gte && date < new Date(query[key].$gte)) return false;
            if (query[key].$lt && date >= new Date(query[key].$lt)) return false;
            return true;
          });
        } else if (key === 'coursePreference') {
          items = items.filter(item => item.coursePreference === query[key]);
        } else if (key === 'admissionStatus') {
          items = items.filter(item => item.admissionStatus === query[key]);
        } else if (key === 'category') {
          items = items.filter(item => item.category === query[key]);
        }
      });
    }

    // Add mock sort, skip, limit methods to chain
    const chain = {
      data: items,
      sort(sortOptions) {
        // Simple sort logic: registrationDate or marks12th
        const sortKey = Object.keys(sortOptions)[0];
        const dir = sortOptions[sortKey];
        this.data.sort((a, b) => {
          let valA = a[sortKey];
          let valB = b[sortKey];
          // Handle nested profile properties
          if (sortKey.includes('.')) {
            const parts = sortKey.split('.');
            valA = a[parts[0]]?.[parts[1]];
            valB = b[parts[0]]?.[parts[1]];
          }
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
          return 0;
        });
        return this;
      },
      skip(n) {
        this.data = this.data.slice(n);
        return this;
      },
      limit(n) {
        this.data = this.data.slice(0, n);
        return this;
      },
      // Mimic then-able Promise resolution
      then(resolve) {
        resolve(this.data);
      }
    };

    return chain;
  }

  async findOne(query = {}) {
    const items = this.getAll();
    const found = items.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
    if (!found) return null;

    const bcrypt = require('bcryptjs');
    return {
      ...found,
      matchPassword: async function (enteredPassword) {
        if (enteredPassword === this.password) return true;
        try {
          return await bcrypt.compare(enteredPassword, this.password);
        } catch (err) {
          return false;
        }
      },
      save: async function () {
        return this;
      }
    };
  }

  async findById(id) {
    const items = this.getAll();
    const found = items.find(item => item._id === id);
    if (!found) return null;
    
    // Return document wrapper with save() method
    const self = this;
    return {
      ...found,
      save: async function() {
        const list = self.getAll();
        const index = list.findIndex(i => i._id === this._id);
        if (index !== -1) {
          list[index] = { ...this };
          self.saveAll(list);
        }
        return this;
      }
    };
  }

  async countDocuments(query = {}) {
    const chain = await this.find(query);
    return chain.data.length;
  }

  async insertMany(array) {
    const items = this.getAll();
    const formatted = array.map(item => ({
      _id: generateId(),
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    this.saveAll([...items, ...formatted]);
    return formatted;
  }

  async create(data) {
    const items = this.getAll();
    const newItem = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  async deleteOne(query = {}) {
    const items = this.getAll();
    const filtered = items.filter(item => item._id !== query._id);
    this.saveAll(filtered);
    return { deletedCount: items.length - filtered.length };
  }
}

// Instances of local databases
const localAdmins = new JsonDatabase('admins', [
  {
    _id: 'default_admin',
    username: 'admin',
    password: '$2a$10$S9GjH8C8U4GgO6qW8w6B1eH1cZt2Fw6YmQeL2h1v1G1e1G1e1G1e1', // bcrypt for 'admin123'
    name: 'System Administrator',
    createdAt: new Date()
  }
]);

const localCourses = new JsonDatabase('courses', [
  { _id: 'c1', name: 'Bachelor of Computer Applications', code: 'BCA', duration: '3 Years', totalSeats: 60, seatsFilled: 0, cutoffMarks: 50, reservations: { General: 30, OBC: 16, SC: 9, ST: 5 } },
  { _id: 'c2', name: 'Bachelor of Business Administration', code: 'BBA', duration: '3 Years', totalSeats: 60, seatsFilled: 0, cutoffMarks: 45, reservations: { General: 30, OBC: 16, SC: 9, ST: 5 } },
  { _id: 'c3', name: 'B.Sc. Computer Science', code: 'BSC_CS', duration: '3 Years', totalSeats: 40, seatsFilled: 0, cutoffMarks: 55, reservations: { General: 20, OBC: 11, SC: 6, ST: 3 } },
  { _id: 'c4', name: 'Bachelor of Commerce', code: 'BCOM', duration: '3 Years', totalSeats: 80, seatsFilled: 0, cutoffMarks: 40, reservations: { General: 40, OBC: 22, SC: 12, ST: 6 } },
  { _id: 'c5', name: 'B.Tech Computer Science & Engineering', code: 'BTECH_CSE', duration: '4 Years', totalSeats: 120, seatsFilled: 0, cutoffMarks: 60, reservations: { General: 60, OBC: 32, SC: 18, ST: 10 } }
]);

const localStudents = new JsonDatabase('students');

// Wrapper function to intercept Mongoose Model calls if database is offline
const getModel = (mongooseModel, localDb) => {
  return new Proxy(mongooseModel, {
    get: (target, prop) => {
      const isDbConnected = mongoose.connection.readyState === 1;
      
      if (isDbConnected) {
        return target[prop];
      }
      
      // Redirect to local JSON database if offline
      console.log(`[Offline Mode] Intercepted Mongoose Model call: ${mongooseModel.modelName}.${prop}`);
      if (typeof localDb[prop] === 'function') {
        return localDb[prop].bind(localDb);
      }
      return localDb[prop];
    },
    // Intercept constructor instantiate new Model()
    construct: (target, args) => {
      const isDbConnected = mongoose.connection.readyState === 1;
      if (isDbConnected) {
        return new target(...args);
      }

      // Return a plain JS object wrapper with save() support for offline modes
      const data = args[0] || {};
      return {
        _id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function() {
          const list = localDb.getAll();
          const index = list.findIndex(i => i._id === this._id);
          if (index !== -1) {
            list[index] = { ...this };
          } else {
            list.push(this);
          }
          localDb.saveAll(list);
          return this;
        }
      };
    }
  });
};

module.exports = {
  localAdmins,
  localCourses,
  localStudents,
  getModel
};
