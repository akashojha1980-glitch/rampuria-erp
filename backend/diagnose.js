const fs = require('fs');
const path = require('path');

console.log('=== PKG SNAPSHOT DIAGNOSTIC ===');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

try {
  const contentsDirname = fs.readdirSync(__dirname);
  console.log(`Contents of __dirname (${__dirname}):`, contentsDirname);
} catch (e) {
  console.error(`Failed to read __dirname:`, e.message);
}

try {
  const parentDir = path.join(__dirname, '..');
  const contentsParent = fs.readdirSync(parentDir);
  console.log(`Contents of parent (${parentDir}):`, contentsParent);
} catch (e) {
  console.error(`Failed to read parent directory:`, e.message);
}

try {
  const snapshotRoot = 'C:\\snapshot';
  const contentsRoot = fs.readdirSync(snapshotRoot);
  console.log(`Contents of snapshot root (${snapshotRoot}):`, contentsRoot);
  
  // Recursively search for 'index.html' or 'dist' inside snapshot root
  const searchDir = (dir, depth = 0) => {
    if (depth > 3) return;
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          console.log(' '.repeat(depth * 2) + `[Dir] ${file}`);
          searchDir(fullPath, depth + 1);
        } else {
          console.log(' '.repeat(depth * 2) + `[File] ${file} (${stats.size} bytes)`);
        }
      });
    } catch (err) {}
  };
  console.log('\n--- Full Snapshot Tree ---');
  searchDir(snapshotRoot);
} catch (e) {
  console.error(`Failed to read snapshot root:`, e.message);
}
