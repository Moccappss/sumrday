import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function localAppsApiPlugin() {
  return {
    name: 'local-apps-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api/apps/') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const appsDir = path.resolve(__dirname, 'src/apps');
              
              if (req.url === '/api/apps/duplicate') {
                const src = path.join(appsDir, data.sourceId);
                const dest = path.join(appsDir, data.newId);
                if (!fs.existsSync(src)) throw new Error('Source not found');
                fs.cpSync(src, dest, { recursive: true });
                
                const indexPath = path.join(dest, 'index.jsx');
                if (fs.existsSync(indexPath)) {
                  let content = fs.readFileSync(indexPath, 'utf-8');
                  content = content.replace(/name:\s*['"][^'"]+['"]/, `name: "${data.newName}"`);
                  fs.writeFileSync(indexPath, content);
                }
                
                let rules = '';
                const rulesPath = path.join(src, 'AI_RULES.md');
                if (fs.existsSync(rulesPath)) {
                  rules = fs.readFileSync(rulesPath, 'utf-8');
                }
                
                const promptText = `Tolong buatkan fitur aplikasi untuk Agency OS bernama "${data.newName}".

# Detail Kebutuhan:
- Deskripsi: ${data.description || '-'}
- Fitur Utama:
${data.features ? data.features : '-'}
- Referensi / Tiru Fitur Dari: ${data.reference || '-'}
- Tampilan Client: ${data.layout || 'Responsive'}
- Catatan Tambahan:
${data.extraNotes ? data.extraNotes : '-'}

Folder tujuan (target) adalah \`src/apps/${data.newId}\`.
PENTING: JANGAN RE-GENERATE SELURUH KODE APLIKASI UTAMA. Fokus HANYA pada pengeditan file di dalam folder \`src/apps/${data.newId}/\`.

# Aturan Sistem CMS (WAJIB DIIKUTI):
${rules}`;

                const readmePath = path.join(dest, 'README.md');
                fs.writeFileSync(readmePath, promptText);

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, promptText }));
              } 
              else if (req.url === '/api/apps/update') {
                const dest = path.join(appsDir, data.appId);
                const indexPath = path.join(dest, 'index.jsx');
                if (fs.existsSync(indexPath)) {
                  let content = fs.readFileSync(indexPath, 'utf-8');
                  if (data.newName) content = content.replace(/name:\s*['"][^'"]+['"]/, `name: "${data.newName}"`);
                  if (data.newColor) content = content.replace(/color:\s*['"][^'"]+['"]/, `color: "${data.newColor}"`);
                  if (data.newIconData) {
                    content = content.replace(/,\s*iconData:\s*['"`]data:image\/[^'"`]+['"`]/g, '');
                    content = content.replace(/(export const config = \{[\s\S]*?)(\};)/, `$1,\n  iconData: "${data.newIconData}"\n$2`);
                  }
                  fs.writeFileSync(indexPath, content);
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              }
              else if (req.url === '/api/apps/delete') {
                const dest = path.join(appsDir, data.appId);
                if (fs.existsSync(dest)) {
                  fs.rmSync(dest, { recursive: true, force: true });
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              }
              else if (req.url === '/api/engines/create') {
                const enginesDir = path.resolve(__dirname, 'public/engines');
                const targetSlug = data.slug || `game-${Date.now()}`;
                const targetDir = path.join(enginesDir, targetSlug);

                if (!fs.existsSync(enginesDir)) {
                  fs.mkdirSync(enginesDir, { recursive: true });
                }
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }
                const assetsDir = path.join(targetDir, 'assets');
                if (!fs.existsSync(assetsDir)) {
                  fs.mkdirSync(assetsDir, { recursive: true });
                }

                if (data.indexHtml) {
                  fs.writeFileSync(path.join(targetDir, 'index.html'), data.indexHtml, 'utf-8');
                }
                if (data.configJson) {
                  fs.writeFileSync(path.join(targetDir, 'config.default.json'), typeof data.configJson === 'string' ? data.configJson : JSON.stringify(data.configJson, null, 2), 'utf-8');
                }
                if (data.readmeText) {
                  fs.writeFileSync(path.join(targetDir, 'README.txt'), data.readmeText, 'utf-8');
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  message: `Folder engine /public/engines/${targetSlug}/ berhasil dirakit di lokal!`,
                  path: `/engines/${targetSlug}/index.html`
                }));
              } else {
                next();
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.url === '/api/env/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, mode: 'local', canWrite: true }));
        } else if (req.url === '/api/env/read' && req.method === 'GET') {
          try {
            const envPath = path.resolve(__dirname, '.env');
            const envValues = {};
            if (fs.existsSync(envPath)) {
              const content = fs.readFileSync(envPath, 'utf-8');
              const lines = content.split('\n');
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                  const eqIdx = trimmed.indexOf('=');
                  if (eqIdx !== -1) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    const val = trimmed.slice(eqIdx + 1).trim();
                    envValues[key] = val;
                  }
                }
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, env: envValues }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        } else if (req.url === '/api/env/update' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const envPath = path.resolve(__dirname, '.env');
              let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

              for (const [key, rawValue] of Object.entries(data.updates || {})) {
                if (!key || typeof key !== 'string') continue;
                const value = String(rawValue || '').trim();
                const regex = new RegExp(`^${key}=.*$`, 'm');
                if (regex.test(envContent)) {
                  envContent = envContent.replace(regex, `${key}=${value}`);
                } else {
                  envContent += `\n${key}=${value}`;
                }
              }

              fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                message: 'File .env lokal berhasil diperbarui dan disinkronkan ke coding!' 
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.url === '/api/deploy/targets' && req.method === 'GET') {
          try {
            const targetsPath = path.resolve(__dirname, 'deploy-targets.json');
            let targets = [];
            if (fs.existsSync(targetsPath)) {
              const content = fs.readFileSync(targetsPath, 'utf-8');
              targets = JSON.parse(content || '[]');
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, targets }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, targets: [] }));
          }
        } else if (req.url === '/api/deploy/targets' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const targets = Array.isArray(data.targets) ? data.targets : [];
              const targetsPath = path.resolve(__dirname, 'deploy-targets.json');
              fs.writeFileSync(targetsPath, JSON.stringify(targets, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                message: 'Target berhasil disinkronkan ke file deploy-targets.json!' 
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

const BUILD_TIMESTAMP = Date.now();

function buildInfoManifestPlugin() {
  return {
    name: 'build-info-manifest',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;
      const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || 'sumr-day').trim();
      const prefix = (process.env.VITE_STORAGE_PREFIX || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const apkAssetName =
        projectId === 'websiteagenzie'
          ? 'agenzie-admin-debug.apk'
          : projectId === 'sumr-day'
            ? 'sumrday-admin-debug.apk'
            : `${prefix || projectId.replace(/[^a-z0-9]/gi, '').toLowerCase()}-admin-debug.apk`;

      const info = {
        buildTime: BUILD_TIMESTAMP,
        buildDate: new Date(BUILD_TIMESTAMP).toISOString(),
        projectId,
        apkAssetName,
      };
      fs.writeFileSync(path.join(distDir, 'build-info.json'), JSON.stringify(info, null, 2), 'utf-8');
    },
  };
}

function adminStaticEntryPlugin() {
  return {
    name: 'admin-static-entry',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      const adminDir = path.join(distDir, 'admin');
      if (!fs.existsSync(adminDir)) fs.mkdirSync(adminDir, { recursive: true });

      let html = fs.readFileSync(indexHtmlPath, 'utf-8');
      html = html.replace(/<link[^>]*rel=["']manifest["'][^>]*>/gi, '');
      html = html.replace(
        '</head>',
        '  <link rel="manifest" href="/manifest-admin.json" />\n</head>'
      );
      html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        '<title>sumr.day OS — Studio &amp; Admin Workspace</title>'
      );
      fs.writeFileSync(path.join(adminDir, 'index.html'), html, 'utf-8');
    }
  };
}

export default defineConfig({
  define: {
    __APP_BUILD_TIME__: JSON.stringify(BUILD_TIMESTAMP),
  },
  plugins: [
    localAppsApiPlugin(),
    adminStaticEntryPlugin(),
    buildInfoManifestPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg', 
        'icons.svg', 
        'logo.png',
        'pwa-192x192.png', 
        'pwa-512x512.png', 
        'pwa-admin-192x192.png', 
        'pwa-admin-512x512.png', 
        'manifest-client.json', 
        'manifest-admin.json', 
        'manifest.json'
      ],
      manifest: {
        short_name: 'sumr.day',
        description: 'Studio kreatif digital, katalog layanan, showcase portofolio, dan mini games interaktif sumr.day.',
        theme_color: '#f59e0b',
        background_color: '#09090e',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: 'sumrday-client-app',
        categories: ['lifestyle', 'shopping', 'entertainment', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'Katalog Layanan',
            url: '/katalog',
            description: 'Eksplorasi paket desain dan produk digital'
          },
          {
            name: 'Portofolio Karya',
            url: '/portfolio',
            description: 'Lihat galeri hasil karya dan studi kasus'
          },
          {
            name: 'Play Space (Apps & Game)',
            url: '/apps',
            description: 'Mainkan mini game & interactive apps'
          },
          {
            name: 'Portal Akun Klien',
            url: '/client',
            description: 'Cek progres pesanan & invoice'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/engines\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        globIgnores: [
          '**/google_apps_script*',
          '**/build-info.json',
          '**/Code.gs',
          '**/engines/**',
          '**/sw-*.js',
          '**/vendor-xlsx*',
          '**/vendor-pdf*',
          '**/vendor-charts*',
          '**/vendor-ai*',
          '**/vendor-zip*',
          '**/html2canvas*',
          '**/index.es*',
          '**/DashboardTrafficBarChart*',
          '**/LivePreview*',
          '**/QuickActionDrawer*',
          '**/ToolkitSidebar*',
          '**/vendor-dates*',
          '**/vendor-recaptcha*',
          '**/vendor-firebase*',
          '**/offlineTemplates*',
          '**/ProjectsModule*',
          '**/VisualWebEditor*',
          '**/DatabasePortal*',
          '**/MemoManager*',
          '**/GameManagementTab*',
          '**/SettingsPanel*',
          '**/CmsDashboard*',
          '**/UserManager*',
          '**/TransactionManager*',
          '**/BroadcastStudio*',
          '**/WhiteboardModule*',
          '**/CatalogManager*',
          '**/BlogManager*',
          '**/UpdatesFeedManager*',
          '**/DashboardOverview*',
          '**/LinksStudio*',
          '**/StorageMonitor*',
          '**/ActivityManager*',
          '**/PortfolioManager*',
          '**/ChatManager*',
          '**/GoogleSyncModal*',
          '**/GlobalSearchCenter*',
          '**/PageSettingsPanel*',
          '**/ClientVoiceManager*',
          '**/googleSync*',
          '**/ClientWebsitePreviewModal*',
          '**/BlockEditPanel*',
          '**/StickerEditPanel*',
          '**/FrameEditPanel*',
          '**/LPCompanyUpdatesHub*',
          '**/LPCompanySolutions*',
          '**/AppsManager*',
          '**/ClientAccountPage*',
          '**/CartCheckoutPage*',
          '**/ClientInvitationAdminPage*',
          '**/GameShowcasePage*',
          '**/CustomWebPage*',
          '**/GuidelinePage*',
          '**/ClientView*',
          '**/AboutPage*',
          '**/Blog*',
          '**/BlogPost*',
          '**/Katalog*',
          '**/PublicRateCardPage*',
          '**/PublicFeedbackPage*',
          '**/PublicInvitationPage*',
          '**/PublicFormPage*',
          '**/LinksPage*',
          '**/react-datepicker*',
          '**/jspdf*',
          '**/html2canvas*',
          '**/canvg*',
          '**/recharts*',
          '**/SocialPosterStudio*',
          '**/StudioIntelligenceAnalytics*',
          '**/RateCardManager*',
          '**/LinksStudio*',
          '**/MediaGalleryModal*',
          '**/PublicNotePreviewPage*',
          '**/LPFloatingStickers*',
          '**/FormEditor*',
          '**/FormResponsesView*',
          '**/ProofingManager*',
          '**/DesignProofingCanvas*',
          '**/ThirdPartyIntegrationsHub*',
          '**/QrStudio*',
          '**/WhatsAppStudio*',
          '**/UpdateStickerRenderer*',
          '**/PdfFlipbookViewer*',
          '**/Model3DViewer*'
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 15,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudinary-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.weserv\.nl\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'weserv-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/assets\/.*\.js$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-dynamic-scripts-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/assets\/.*\.css$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-styles-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 14
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-dom/client'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand'
    ]
  },

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    cssMinify: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normId = id.replace(/\\/g, '/');
            // 1. Core React runtime FIRST so jsx-runtime / react-is / scheduler never leak into lazy feature chunks
            if (
              normId.includes('/react/') ||
              normId.includes('/react-dom/') ||
              normId.includes('/scheduler/') ||
              normId.includes('/react-is/') ||
              normId.includes('use-sync-external-store') ||
              normId.includes('/prop-types/') ||
              normId.includes('/object-assign/') ||
              normId.includes('@babel/runtime') ||
              normId.includes('/tslib/')
            ) return 'vendor-react';
            if (normId.includes('xlsx')) return 'vendor-xlsx';
            if (normId.includes('recharts') || normId.includes('victory-vendor') || normId.includes('/d3-')) return 'vendor-charts';
            if (normId.includes('jspdf') || normId.includes('html2canvas') || normId.includes('canvg') || normId.includes('html-to-image')) return 'vendor-export';
            if (normId.includes('jszip') || normId.includes('pako')) return 'vendor-zip';
            if (normId.includes('@tanstack') || normId.includes('query-core')) return 'vendor-query';
            if (normId.includes('react-google-recaptcha')) return 'vendor-recaptcha';
            if (normId.includes('@google/generative-ai')) return 'vendor-ai';
            if (normId.includes('firebase')) return 'vendor-firebase';
            if (normId.includes('lucide-react')) return 'vendor-icons';
            if (normId.includes('dompurify')) return 'vendor-dompurify';
            if (normId.includes('react-router-dom') || normId.includes('react-router')) return 'vendor-react-router';
            if (normId.includes('zustand') || normId.includes('idb-keyval') || normId.includes('/idb/')) return 'vendor-storage';
            if (normId.includes('@floating-ui')) return 'vendor-ui';
            if (normId.includes('workbox-window')) return 'vendor-pwa';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      clientPort: 5173,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
  },
});


