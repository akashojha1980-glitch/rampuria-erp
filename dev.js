const { spawn } = require('child_process');

console.log('\n============================================================');
console.log('   BJS RAMPURIA ERP — STARTING DEVELOPMENT ENVIRONMENT');
console.log('============================================================\n');

// Start backend dev server
const backend = spawn('npm', ['run', 'dev'], { 
  cwd: 'backend', 
  shell: true, 
  stdio: 'inherit' 
});

// Start frontend dev server
const frontend = spawn('npm', ['run', 'dev'], { 
  cwd: 'frontend', 
  shell: true, 
  stdio: 'inherit' 
});

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('\nStopping development servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});
