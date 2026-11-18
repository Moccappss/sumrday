import React, { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Download, X, Sparkles, Loader2 } from 'lucide-react';
import { getActiveDeployTarget, type DeployTarget } from '../../config/AppConfig';

declare const __APP_BUILD_TIME__: number;

const RELEASE_API = 'https://api.github.com/repos/Moccappss/sumrday/releases/tags/admin-apk-latest';

const ApkUpdaterNative = registerPlugin<{
  downloadAndInstall: (opts: { url: string }) => Promise<{ status: 'installing' | 'permission_required' }>;
  addListener: (event: 'downloadProgress', cb: (data: { progress: number }) => void) => Promise<{ remove: () => void }>;
}>('ApkUpdater');

export function getExpectedApkAssetName(target?: DeployTarget): string {
  const active = target || getActiveDeployTarget();
  const pid = (active.projectId || '').toLowerCase();
  if (pid === 'sumr-day') return 'sumrday-admin-debug.apk';
  if (pid === 'websiteagenzie') return 'agenzie-admin-debug.apk';
  const slug = (active.storagePrefix || active.projectId || 'sumrday')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${slug || 'sumrday'}-admin-debug.apk`;
}

export function getApkDirectDownloadUrl(target?: DeployTarget): string {
  return `https://github.com/Moccappss/sumrday/releases/download/admin-apk-latest/${getExpectedApkAssetName(target)}`;
}

export async function fetchLatestApkAsset(target?: DeployTarget): Promise<{
  fileName: string;
  downloadUrl: string;
  updatedAt?: string;
  sizeBytes?: number;
}> {
  const fileName = getExpectedApkAssetName(target);
  const fallbackUrl = getApkDirectDownloadUrl(target);
  try {
    const res = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { fileName, downloadUrl: fallbackUrl };
    const release = await res.json();
    const asset = Array.isArray(release.assets)
      ? release.assets.find((a: any) => a.name === fileName)
      : null;
    if (asset?.browser_download_url) {
      return {
        fileName,
        downloadUrl: asset.browser_download_url,
        updatedAt: asset.updated_at,
        sizeBytes: asset.size,
      };
    }
  } catch {}
  return { fileName, downloadUrl: fallbackUrl };
}

export function getLocalBuildTime(): number {
  return typeof __APP_BUILD_TIME__ === 'number' ? __APP_BUILD_TIME__ : 0;
}

export function markApkDownloaded(fileName: string, remoteUpdatedAt?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const ts = remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : Date.now();
    localStorage.setItem(`apk_last_downloaded_at_${fileName}`, String(Number.isFinite(ts) ? ts : Date.now()));
  } catch {}
}

export async function checkAppAndApkUpdates(target?: DeployTarget): Promise<{
  apkHasUpdate: boolean;
  apkFileName: string;
  apkDownloadUrl: string;
  apkUpdatedAt?: string;
  apkSizeBytes?: number;
  webHasUpdate: boolean;
  serverBuildTime?: number;
  localBuildTime: number;
}> {
  const localBuildTime = getLocalBuildTime();
  const [apkAsset, webBuild] = await Promise.all([
    fetchLatestApkAsset(target),
    fetch(`/build-info.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  let apkHasUpdate = false;
  if (apkAsset.updatedAt) {
    const remoteTime = new Date(apkAsset.updatedAt).getTime();
    if (Capacitor.isNativePlatform()) {
      apkHasUpdate = remoteTime > localBuildTime + 120_000;
    } else {
      const lastDl = Number(
        (typeof localStorage !== 'undefined' && localStorage.getItem(`apk_last_downloaded_at_${apkAsset.fileName}`)) || '0'
      );
      const baseline = lastDl > 0 ? lastDl : localBuildTime;
      apkHasUpdate = remoteTime > baseline + 120_000;
    }
  }

  const serverBuildTime = typeof webBuild?.buildTime === 'number' ? webBuild.buildTime : undefined;
  const webHasUpdate = Boolean(serverBuildTime && localBuildTime > 0 && serverBuildTime > localBuildTime + 30_000);

  return {
    apkHasUpdate,
    apkFileName: apkAsset.fileName,
    apkDownloadUrl: apkAsset.downloadUrl,
    apkUpdatedAt: apkAsset.updatedAt,
    apkSizeBytes: apkAsset.sizeBytes,
    webHasUpdate,
    serverBuildTime,
    localBuildTime,
  };
}

function getExpectedAssetName(): string {
  return getExpectedApkAssetName();
}

export async function installApkInApp(
  url: string,
  onProgress?: (pct: number) => void
): Promise<{ status: string; message: string }> {
  if (!Capacitor.isNativePlatform()) {
    window.open(url, '_blank');
    return { status: 'opened', message: 'Membuka link download.' };
  }

  let removeProgress: (() => void) | undefined;
  try {
    const handle = await ApkUpdaterNative.addListener('downloadProgress', (d) => {
      onProgress?.(d.progress);
    });
    removeProgress = () => handle.remove();

    const res = await ApkUpdaterNative.downloadAndInstall({ url });
    if (res.status === 'permission_required') {
      return {
        status: 'permission_required',
        message: 'Aktifkan izin "Install aplikasi tidak dikenal", lalu tap Update lagi.',
      };
    }
    return { status: 'installing', message: 'Membuka installer pembaruan...' };
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Gagal mengunduh update di dalam aplikasi.',
    };
  } finally {
    if (removeProgress) removeProgress();
  }
}

export async function checkApkUpdateNow(force = false): Promise<{
  hasUpdate: boolean;
  downloadUrl?: string;
  updatedAt?: string;
  message: string;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { hasUpdate: false, message: 'Fitur cek update APK hanya aktif di aplikasi Android.' };
  }

  try {
    if (!force) {
      const lastCheck = Number(localStorage.getItem('apk_update_last_check') || '0');
      if (Date.now() - lastCheck < 30 * 60 * 1000) {
        return { hasUpdate: false, message: 'Baru saja diperiksa.' };
      }
    }

    const res = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    localStorage.setItem('apk_update_last_check', String(Date.now()));

    if (!res.ok) {
      return { hasUpdate: false, message: 'Belum ada rilis APK di GitHub Releases.' };
    }

    const release = await res.json();
    const assetName = getExpectedAssetName();
    const asset = Array.isArray(release.assets)
      ? release.assets.find((a: any) => a.name === assetName)
      : null;

    if (!asset?.browser_download_url || !asset?.updated_at) {
      return { hasUpdate: false, message: `File ${assetName} belum tersedia di rilis terbaru.` };
    }

    const remoteTime = new Date(asset.updated_at).getTime();
    const localBuildTime = typeof __APP_BUILD_TIME__ === 'number' ? __APP_BUILD_TIME__ : 0;

    if (remoteTime > localBuildTime + 120_000) {
      return {
        hasUpdate: true,
        downloadUrl: asset.browser_download_url,
        updatedAt: asset.updated_at,
        message: 'Versi APK terbaru tersedia untuk diunduh!',
      };
    }

    return { hasUpdate: false, message: 'Aplikasi APK Anda sudah versi terbaru.' };
  } catch {
    return { hasUpdate: false, message: 'Gagal memeriksa update (periksa koneksi internet).' };
  }
}

export const ApkUpdateChecker: React.FC = () => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const timer = setTimeout(() => {
      checkApkUpdateNow(false).then((info) => {
        if (info.hasUpdate && info.downloadUrl) {
          setDownloadUrl(info.downloadUrl);
        }
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!downloadUrl || dismissed) return null;

  const activeServer = getActiveDeployTarget();
  const assetName = getExpectedApkAssetName(activeServer);

  const handleUpdateClick = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setProgress(0);
    setStatusMsg('Mengunduh pembaruan...');
    const res = await installApkInApp(downloadUrl, (pct) => setProgress(pct));
    setIsDownloading(false);
    if (res.status === 'permission_required' || res.status === 'error') {
      setStatusMsg(res.message);
    } else {
      setStatusMsg(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 96,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10005,
        width: 'min(92vw, 380px)',
        background: 'var(--cms-card-bg, #121218)',
        border: '1px solid var(--cms-accent, #f59e0b)',
        borderRadius: 18,
        padding: '12px 14px',
        boxShadow: '0 14px 36px rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'var(--cms-text, #fff)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--cms-accent-soft, rgba(245,158,11,0.15))',
          color: 'var(--cms-accent, #f59e0b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isDownloading ? <Loader2 size={18} style={{ animation: 'cmsSpin 0.8s linear infinite' }} /> : <Sparkles size={18} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>Update {activeServer.name}</div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>
          {isDownloading ? `Mengunduh ${assetName} (${progress}%)...` : (statusMsg || `${assetName} versi terbaru siap diunduh.`)}
        </div>
      </div>
      <button
        type="button"
        disabled={isDownloading}
        onClick={handleUpdateClick}
        style={{
          background: 'var(--cms-accent, #f59e0b)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          cursor: isDownloading ? 'wait' : 'pointer',
          opacity: isDownloading ? 0.75 : 1,
          flexShrink: 0,
        }}
      >
        <Download size={14} />
        {isDownloading ? `${progress}%` : 'Update'}
      </button>
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--cms-text-muted, #888)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ApkUpdateChecker;
