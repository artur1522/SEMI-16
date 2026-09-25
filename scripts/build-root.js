const fs = require('fs');
const path = require('path');

const root = __dirname;
const appDir = path.join(root, '..', 'SEMINA-5-main-main');
const appDist = path.join(appDir, 'dist');
const outputDist = path.join(root, '..', 'dist');

if (fs.existsSync(outputDist)) {
  fs.rmSync(outputDist, { recursive: true, force: true });
}

fs.cpSync(appDist, outputDist, { recursive: true });
console.log('dist synced from project app');
