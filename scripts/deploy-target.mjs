#!/usr/bin/env node

/**
 * CLI Multi-Deploy Target Firebase (Local Terminal)
 * 
 * Penggunaan:
 *   npm run deploy:target               -> Menu interaktif pilih target
 *   npm run deploy:all                  -> Deploy ke semua target sekaligus
 *   npm run deploy:target <projectId>   -> Langsung deploy ke target spesifik
 *   node scripts/deploy-target.mjs --help
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { applyTargetToEnv } from './switch-env.mjs';

const rootDir = process.cwd();
const targetsPath = path.resolve(rootDir, 'deploy-targets.json');

// Membaca daftar target dari deploy-targets.json
function loadTargets() {
  try {
    if (fs.existsSync(targetsPath)) {
      const content = fs.readFileSync(targetsPath, 'utf-8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('⚠️  Peringatan: Gagal membaca deploy-targets.json:', err.message);
  }
  return [];
}

// Menjalankan build & deploy untuk satu target
function deployTarget(target, index = 1, total = 1) {
  const pId = typeof target === 'string' ? target : (target.projectId || target.name);
  const name = typeof target === 'object' && target.name ? target.name : pId;
  const prefix = typeof target === 'object' && target.storagePrefix ? target.storagePrefix : 'porto';

  console.log(`\n========================================================`);
  console.log(`🚀 [${index}/${total}] Menyiapkan Build & Deploy: ${name}`);
  console.log(`   Firebase Project: ${pId}`);
  console.log(`   Storage Prefix  : ${prefix}`);
  if (typeof target === 'object') {
    if (target.apiKey) console.log(`   API Key         : ${target.apiKey.slice(0, 8)}...`);
    if (target.geminiApiKey) console.log(`   Gemini AI Key   : [Aktif / Mandiri]`);
    if (target.sheetId) console.log(`   Google Sheet    : [Aktif / Mandiri]`);
  }
  console.log(`========================================================\n`);

  // Menyiapkan environment variable khusus untuk target ini
  const customEnv = { ...process.env };

  if (typeof target === 'object') {
    customEnv.VITE_FIREBASE_PROJECT_ID = pId;
    if (target.apiKey) customEnv.VITE_FIREBASE_API_KEY = target.apiKey;
    if (target.appId) customEnv.VITE_FIREBASE_APP_ID = target.appId;
    if (target.messagingSenderId) customEnv.VITE_FIREBASE_MESSAGING_SENDER_ID = target.messagingSenderId;
    if (target.measurementId) customEnv.VITE_FIREBASE_MEASUREMENT_ID = target.measurementId;
    if (target.storagePrefix) customEnv.VITE_STORAGE_PREFIX = target.storagePrefix;
    if (target.geminiApiKey !== undefined && target.geminiApiKey) customEnv.VITE_GEMINI_API_KEY = target.geminiApiKey;
    if (target.sheetId !== undefined) customEnv.VITE_GOOGLE_SHEET_ID = target.sheetId;
    if (target.appsScriptUrl !== undefined) customEnv.VITE_GOOGLE_APPS_SCRIPT_URL = target.appsScriptUrl;
    if (target.cloudinaryName !== undefined) customEnv.VITE_CLOUDINARY_NAME = target.cloudinaryName;
    if (target.cloudinaryPreset !== undefined) customEnv.VITE_CLOUDINARY_PRESET = target.cloudinaryPreset;
    customEnv.VITE_FIREBASE_AUTH_DOMAIN = `${pId}.firebaseapp.com`;
    customEnv.VITE_FIREBASE_STORAGE_BUCKET = `${pId}.firebasestorage.app`;
  } else {
    customEnv.VITE_FIREBASE_PROJECT_ID = pId;
    customEnv.VITE_FIREBASE_AUTH_DOMAIN = `${pId}.firebaseapp.com`;
    customEnv.VITE_FIREBASE_STORAGE_BUCKET = `${pId}.firebasestorage.app`;
  }

  // Backup file .env asli sebelum proses build
  const envPath = path.resolve(rootDir, '.env');
  let originalEnv = null;
  if (fs.existsSync(envPath)) {
    originalEnv = fs.readFileSync(envPath, 'utf-8');
  }

  try {
    // Terapkan konfigurasi target ini ke .env agar Vite & Rollup membaca data yang 100% akurat
    if (typeof target === 'object') {
      applyTargetToEnv(target);
    }

    console.log('📦 Langkah 1/2: Menjalankan Vite Build...');
    execSync('npm run build', { 
      cwd: rootDir, 
      stdio: 'inherit',
      env: customEnv
    });

    console.log(`\n🌐 Langkah 2/2: Mendeploy ke Firebase Hosting [${pId}]...`);
    try {
      execSync(`npx firebase deploy --only hosting --project ${pId}`, { 
        cwd: rootDir, 
        stdio: 'inherit' 
      });
    } catch {
      // Fallback ke npx firebase-tools jika npx firebase tidak tersedia
      execSync(`npx firebase-tools deploy --only hosting --project ${pId}`, { 
        cwd: rootDir, 
        stdio: 'inherit' 
      });
    }

    let buildInfo = null;
    try {
      const biPath = path.resolve(rootDir, 'dist', 'build-info.json');
      if (fs.existsSync(biPath)) {
        buildInfo = JSON.parse(fs.readFileSync(biPath, 'utf-8'));
      }
    } catch {}

    console.log(`\n✅ SUKSES! Target "${name}" telah aktif:`);
    console.log(`   🔗 URL        : https://${pId}.web.app`);
    if (buildInfo) {
      console.log(`   🏷️  Build Time : ${new Date(buildInfo.buildTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
      console.log(`   🆔 Build ID   : ${buildInfo.buildTime}`);
      console.log(`   📱 APK Target : ${buildInfo.apkAssetName}`);
    }
    console.log('');
    return { success: true, target, url: `https://${pId}.web.app`, buildInfo };
  } catch (err) {
    console.error(`\n❌ Gagal mendeploy target "${name}":`, err.message);
    return { success: false, target, error: err.message };
  } finally {
    // Kembalikan file .env asli agar tidak merusak lingkungan development lokal
    if (originalEnv !== null && fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, originalEnv, 'utf-8');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const targets = loadTargets();

  // Print Help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
MULTI-DEPLOY TARGET FIREBASE (Local Terminal)
==============================================
Perintah yang tersedia:
  npm run deploy:target              Tampilkan menu interaktif target
  npm run deploy:all                 Deploy ke semua target sekaligus
  npm run deploy:target <id/nama>    Deploy langsung ke target tertentu
  node scripts/deploy-target.mjs <project-id>

Daftar target saat ini di deploy-targets.json:
${targets.length === 0 ? '  (Belum ada target terdaftar)' : targets.map((t, i) => `  [${i + 1}] ${t.name} (Project: ${t.projectId})`).join('\n')}
    `);
    process.exit(0);
  }

  // Flag --all untuk batch deployment
  if (args.includes('--all') || args.includes('-a')) {
    if (targets.length === 0) {
      console.error('❌ Tidak ada target yang terdaftar di deploy-targets.json.');
      console.error('Buka Web Admin > Pengaturan > Multi-Deploy Target untuk menambahkan target.');
      process.exit(1);
    }

    console.log(`\n========================================================`);
    console.log(`🚀 MEMULAI BATCH DEPLOY KE SEMUA TARGET (${targets.length} Target)`);
    console.log(`========================================================`);

    const results = [];
    for (let i = 0; i < targets.length; i++) {
      const res = deployTarget(targets[i], i + 1, targets.length);
      results.push(res);
    }

    console.log(`\n========================================================`);
    console.log(`🎉 RINGKASAN DEPLOY BATCH SELESAI`);
    console.log(`========================================================`);
    results.forEach((r, idx) => {
      const statusIcon = r.success ? '✅' : '❌';
      const name = r.target?.name || r.target?.projectId || 'Target';
      console.log(`${statusIcon} [${idx + 1}] ${name}: ${r.success ? r.url : 'GAGAL: ' + r.error}`);
    });
    console.log(`========================================================\n`);
    process.exit(0);
  }

  // Jika ada argumen langsung (ID angka 1..N, nama target, atau project ID)
  if (args.length > 0 && !args[0].startsWith('-')) {
    const query = args[0].trim();
    
    // Cek apakah angka indeks 1-based
    const num = parseInt(query, 10);
    if (!isNaN(num) && num >= 1 && num <= targets.length) {
      const selected = targets[num - 1];
      deployTarget(selected, 1, 1);
      process.exit(0);
    }

    // Cek kecocokan projectId atau name atau id
    const found = targets.find(t => 
      (t.projectId && t.projectId.toLowerCase() === query.toLowerCase()) ||
      (t.name && t.name.toLowerCase() === query.toLowerCase()) ||
      (t.id && t.id.toLowerCase() === query.toLowerCase())
    );

    if (found) {
      deployTarget(found, 1, 1);
      process.exit(0);
    }

    // Jika tidak ditemukan di list, treat sebagai project ID langsung
    deployTarget({ projectId: query, name: query }, 1, 1);
    process.exit(0);
  }

  // Interactive CLI Menu
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n========================================================`);
  console.log(`🚀 MULTI-DEPLOY TARGET FIREBASE (Terminal Lokal)`);
  console.log(`========================================================`);

  if (targets.length === 0) {
    console.log(`Belum ada target yang disimpan di deploy-targets.json.`);
    console.log(`(Anda dapat mendaftarkannya di Web Admin > Pengaturan > Multi-Deploy Target)\n`);
    rl.question('Masukkan Firebase Project ID Target: ', (ans) => {
      rl.close();
      const pId = ans.trim();
      if (!pId) {
        console.error('Project ID tidak boleh kosong.');
        process.exit(1);
      }
      deployTarget({ projectId: pId, name: pId });
    });
    return;
  }

  console.log(`Pilih target yang ingin Anda deploy:\n`);
  targets.forEach((t, i) => {
    console.log(`  [${i + 1}] ${t.name} (Project: ${t.projectId}) -> https://${t.projectId}.web.app`);
  });
  console.log(`  [A] Deploy ke SEMUA (${targets.length} target sekaligus)`);
  console.log(`  [M] Masukkan Firebase Project ID secara manual`);
  console.log(`  [Q] Batal / Keluar`);
  console.log(`--------------------------------------------------------`);

  rl.question(`Ketik nomor pilihan (1-${targets.length} / A / M / Q): `, (ans) => {
    rl.close();
    const clean = ans.trim().toUpperCase();

    if (clean === 'Q' || !clean) {
      console.log('Operasi dibatalkan.');
      process.exit(0);
    }

    if (clean === 'A') {
      console.log(`\nMenjalankan deploy ke semua ${targets.length} target...`);
      const results = [];
      for (let i = 0; i < targets.length; i++) {
        const res = deployTarget(targets[i], i + 1, targets.length);
        results.push(res);
      }
      console.log(`\nSemua target selesai diproses.`);
      process.exit(0);
    }

    if (clean === 'M') {
      const rlManual = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rlManual.question('\nMasukkan Firebase Project ID Target: ', (pIdAns) => {
        rlManual.close();
        const pId = pIdAns.trim();
        if (!pId) {
          console.error('Project ID tidak boleh kosong.');
          process.exit(1);
        }
        deployTarget({ projectId: pId, name: pId });
      });
      return;
    }

    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 1 && num <= targets.length) {
      const target = targets[num - 1];
      deployTarget(target, 1, 1);
    } else {
      console.error(`Pilihan tidak valid: "${clean}".`);
      process.exit(1);
    }
  });
}

main();
