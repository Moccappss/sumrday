#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { applyTargetToEnv } from './switch-env.mjs';

const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');
const targetsPath = path.resolve(rootDir, 'deploy-targets.json');
const androidDir = path.resolve(rootDir, 'android');
const outDir = path.resolve(rootDir, 'dist-apk');

const FLAVORS = {
  'sumr-day': {
    flavor: 'sumrday',
    gradleTask: 'assembleSumrdayDebug',
    apkSource: 'android/app/build/outputs/apk/sumrday/debug/app-sumrday-debug.apk',
    apkOut: 'sumrday-admin-debug.apk',
  },
  websiteagenzie: {
    flavor: 'agenzie',
    gradleTask: 'assembleAgenzieDebug',
    apkSource: 'android/app/build/outputs/apk/agenzie/debug/app-agenzie-debug.apk',
    apkOut: 'agenzie-admin-debug.apk',
  },
};

function resolveJavaHome() {
  if (process.platform !== 'win32') return process.env.JAVA_HOME;
  const adoptiumDir = 'C:\\Program Files\\Eclipse Adoptium';
  if (fs.existsSync(adoptiumDir)) {
    const match = fs.readdirSync(adoptiumDir).find((d) => d.startsWith('jdk-21'));
    if (match) return path.join(adoptiumDir, match);
  }
  return process.env.JAVA_HOME;
}

function resolveAndroidHome() {
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
  }
  return undefined;
}

function run(cmd, cwd, envExtra = {}) {
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...envExtra },
  });
}

async function main() {
  const arg = process.argv[2] || '--all';
  const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf-8'));

  const selectedIds =
    arg === '--all' ? Object.keys(FLAVORS) : [arg].filter((id) => FLAVORS[id]);

  if (selectedIds.length === 0) {
    console.error('Target tidak dikenal. Gunakan: sumr-day, websiteagenzie, atau --all');
    process.exit(1);
  }

  const originalEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : null;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const javaHome = resolveJavaHome();
  const androidHome = resolveAndroidHome();
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

  try {
    for (const projectId of selectedIds) {
      const target = targets.find((t) => t.projectId === projectId);
      if (!target) {
        throw new Error(`Target "${projectId}" tidak ditemukan di deploy-targets.json`);
      }

      const cfg = FLAVORS[projectId];
      console.log(`\n=== Building Android APK untuk ${target.name} (${projectId}) ===`);
      applyTargetToEnv(target);

      if (process.platform === 'win32' && target.appIcon) {
        const flavorResDir = path.join('android', 'app', 'src', cfg.flavor, 'res');
        run(
          `powershell -ExecutionPolicy Bypass -File scripts/generate-android-icons.ps1 -SourceImage "${target.appIcon}" -ResDir "${flavorResDir}"`,
          rootDir
        );
      }

      run('npm run cap:sync', rootDir);
      run(`${gradleCmd} ${cfg.gradleTask}`, androidDir, {
        ...(javaHome ? { JAVA_HOME: javaHome } : {}),
        ...(androidHome ? { ANDROID_HOME: androidHome } : {}),
      });

      const srcApk = path.resolve(rootDir, cfg.apkSource);
      const destApk = path.resolve(outDir, cfg.apkOut);
      fs.copyFileSync(srcApk, destApk);
      console.log(`✅ APK siap: ${destApk}`);
    }
  } finally {
    if (originalEnv !== null) {
      fs.writeFileSync(envPath, originalEnv, 'utf-8');
      console.log('\n🔄 File .env dikembalikan ke kondisi semula.');
    }
  }
}

main().catch((err) => {
  console.error('❌ Build APK gagal:', err);
  process.exit(1);
});
