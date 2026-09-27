/**
 * Multi-service orchestrator for ARGO Ocean AI
 * Starts:
 * 1. Python FastAPI ML/NLP Service (Port 5001)
 * 2. Node.js Express Backend API (Port 5000)
 * 3. Vite React Frontend (Port 5173)
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('       STARTING ARGO OCEAN AI FULL-STACK PLATFORM           ');
console.log('============================================================\n');

// 1. Start Python ML/NLP Engine
console.log('[Orchestrator] Starting Python FastAPI Service on port 5001...');
const pythonProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '5001'], {
  cwd: path.join(rootDir, 'ml-service'),
  stdio: 'inherit',
  shell: true,
});

// 2. Start Node.js Express Server
console.log('[Orchestrator] Starting Node.js Express Backend on port 5000...');
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(rootDir, 'server'),
  stdio: 'inherit',
  shell: true,
});

// 3. Start Vite Client
console.log('[Orchestrator] Starting Vite React Frontend on port 5173...');
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  stdio: 'inherit',
  shell: true,
});

// Handle termination signals
const cleanup = () => {
  console.log('\n[Orchestrator] Shutting down services...');
  pythonProcess.kill();
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
