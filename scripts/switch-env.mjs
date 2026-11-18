#!/usr/bin/env node

/**
 * Switch Local Environment (.env) Target
 * Memindahkan konfigurasi aktif di file .env untuk keperluan localhost (npm run dev)
 * 
 * Penggunaan:
 *   node scripts/switch-env.mjs sumr-day
 *   node scripts/switch-env.mjs websiteagenzie
 *   node scripts/switch-env.mjs          (Menu interaktif)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rootDir = process.cwd();
const targetsPath = path.resolve(rootDir, 'deploy-targets.json');
const envPath = path.resolve(rootDir, '.env');

function loadTargets() {
  try {
    if (fs.existsSync(targetsPath)) {
      return JSON.parse(fs.readFileSync(targetsPath, 'utf-8') || '[]');
    }
  } catch (err) {
    console.error('Gagal membaca deploy-targets.json:', err.message);
  }
  return [];
}

export function applyTargetToEnv(target) {
  if (!fs.existsSync(envPath)) {
    console.error('File .env tidak ditemukan.');
    return false;
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');

  const pId = target.projectId;
  const updates = {
    VITE_FIREBASE_PROJECT_ID: pId,
    VITE_FIREBASE_AUTH_DOMAIN: `${pId}.firebaseapp.com`,
    VITE_FIREBASE_STORAGE_BUCKET: `${pId}.firebasestorage.app`,
  };

  if (target.apiKey !== undefined) updates.VITE_FIREBASE_API_KEY = target.apiKey;
  if (target.appId !== undefined) updates.VITE_FIREBASE_APP_ID = target.appId;
  if (target.messagingSenderId !== undefined) updates.VITE_FIREBASE_MESSAGING_SENDER_ID = target.messagingSenderId;
  if (target.measurementId !== undefined) updates.VITE_FIREBASE_MEASUREMENT_ID = target.measurementId;
  if (target.storagePrefix !== undefined) updates.VITE_STORAGE_PREFIX = target.storagePrefix;
  if (target.geminiApiKey !== undefined && target.geminiApiKey) updates.VITE_GEMINI_API_KEY = target.geminiApiKey;
  if (target.sheetId !== undefined) updates.VITE_GOOGLE_SHEET_ID = target.sheetId;
  if (target.appsScriptUrl !== undefined) updates.VITE_GOOGLE_APPS_SCRIPT_URL = target.appsScriptUrl;
  if (target.cloudinaryName !== undefined) updates.VITE_CLOUDINARY_NAME = target.cloudinaryName;
  if (target.cloudinaryPreset !== undefined) updates.VITE_CLOUDINARY_PRESET = target.cloudinaryPreset;
  if (target.googleWebClientId !== undefined) updates.VITE_GOOGLE_WEB_CLIENT_ID = target.googleWebClientId;

  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${val}`);
    } else {
      envContent += `\n${key}=${val}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
  console.log(`\n✅ BERHASIL! Database Localhost (.env) sekarang terhubung ke:`);
  console.log(`   📌 Target : ${target.name || target.projectId}`);
  console.log(`   🔥 Project: ${target.projectId}`);
  console.log(`   🗄️  Prefix : ${target.storagePrefix || 'porto'}`);
  console.log(`\nSilakan refresh browser Anda di http://localhost:5173\n`);
  return true;
}

function runCli() {
  const args = process.argv.slice(2);
  const targets = loadTargets();

  if (targets.length === 0) {
    console.error('Belum ada target di deploy-targets.json.');
    process.exit(1);
  }

  if (args.length > 0) {
    const query = args[0].toLowerCase().trim();
    const found = targets.find(t => 
      (t.projectId && t.projectId.toLowerCase().includes(query)) ||
      (t.name && t.name.toLowerCase().includes(query)) ||
      (t.id && t.id.toLowerCase().includes(query))
    );

    if (found) {
      applyTargetToEnv(found);
      process.exit(0);
    } else {
      console.error(`Target "${args[0]}" tidak ditemukan di deploy-targets.json.`);
      process.exit(1);
    }
  }

  // Menu interaktif jika tanpa argumen
  console.log(`\n========================================================`);
  console.log(`🔄 GANTI DATABASE AKTIF UNTUK LOCALHOST (npm run dev)`);
  console.log(`========================================================`);
  console.log(`Pilih database yang ingin dihubungkan ke localhost:5173:\n`);

  targets.forEach((t, i) => {
    console.log(`  [${i + 1}] ${t.name} (Firebase: ${t.projectId})`);
  });
  console.log(`  [Q] Batal / Keluar`);
  console.log(`--------------------------------------------------------`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`Ketik nomor target (1-${targets.length}): `, (ans) => {
    rl.close();
    const clean = ans.trim().toUpperCase();
    if (clean === 'Q' || !clean) {
      console.log('Batal.');
      process.exit(0);
    }

    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 1 && num <= targets.length) {
      applyTargetToEnv(targets[num - 1]);
    } else {
      console.error('Pilihan tidak valid.');
      process.exit(1);
    }
  });
}

// Only run CLI if executed directly
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('switch-env.mjs')) {
  runCli();
}
