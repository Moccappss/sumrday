import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Sync main script
const mainSrc = path.join(rootDir, 'google_apps_script.js');
const mainDest = path.join(publicDir, 'google_apps_script.js');
if (fs.existsSync(mainSrc)) {
  fs.copyFileSync(mainSrc, mainDest);
  console.log('✅ Synced google_apps_script.js to public/');
}

// 2. Sync game script
const gameSrc = path.join(rootDir, 'scripts', 'Code.gs');
const gameDest = path.join(publicDir, 'Code.gs');
if (fs.existsSync(gameSrc)) {
  fs.copyFileSync(gameSrc, gameDest);
  console.log('✅ Synced scripts/Code.gs to public/');
}
