#!/usr/bin/env node

/**
 * CLI Helper: Deploy ke Firebase Project Lain
 * Penggunaan:
 *   npm run deploy:target
 *   atau: node scripts/deploy-target.mjs <project-id>
 */

import { execSync } from 'child_process';
import readline from 'readline';

const args = process.argv.slice(2);
let targetProjectId = args[0];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  if (!targetProjectId) {
    targetProjectId = await new Promise((resolve) => {
      rl.question('\nMasukkan Firebase Project ID Target: ', (ans) => {
        resolve(ans.trim());
      });
    });
  }

  if (!targetProjectId) {
    console.error('Error: Firebase Project ID tidak boleh kosong.');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`Menyiapkan Build & Deploy ke: ${targetProjectId}`);
  console.log(`========================================\n`);

  try {
    console.log('1. Menjalankan Vite Build...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log(`\n2. Mendeploy ke Firebase Hosting [${targetProjectId}]...`);
    execSync(`npx firebase-tools deploy --only hosting --project ${targetProjectId}`, { stdio: 'inherit' });

    console.log(`\nSUKSES! Website target telah aktif:`);
    console.log(`https://${targetProjectId}.web.app\n`);
  } catch (err) {
    console.error('\nProses deploy gagal:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
