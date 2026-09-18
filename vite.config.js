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
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    localAppsApiPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'sumr.day OS — Studio & Admin Workspace',
        short_name: 'sumr.day OS',
        description: 'Portal Manajemen & Kontrol Studio sumr.day OS — Desktop, Tablet & Mobile',
        theme_color: '#f59e0b',
        background_color: '#050507',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
        orientation: 'natural',
        scope: '/',
        start_url: '/admin',
        id: 'sumrday-os-admin',
        categories: ['business', 'productivity', 'utilities', 'design'],
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
            name: 'Dashboard Admin',
            url: '/admin',
            description: 'Buka Dashboard Utama sumr.day OS'
          },
          {
            name: 'Manajemen Proyek',
            url: '/admin/projects',
            description: 'Buka modul manajemen proyek dan tugas'
          },
          {
            name: 'Live Chat & Inbox',
            url: '/admin/chat',
            description: 'Buka pesan masuk dan percakapan klien'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
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
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('jszip')) return 'vendor-zip';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('react-google-recaptcha')) return 'vendor-recaptcha';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'vendor-charts';
            if (id.includes('jspdf') || id.includes('html-to-image')) return 'vendor-pdf';
            if (id.includes('@google/generative-ai')) return 'vendor-ai';
            if (id.includes('date-fns') || id.includes('react-datepicker')) return 'vendor-dates';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('dompurify')) return 'vendor-dompurify';
            if (id.includes('react-router-dom') || id.includes('react-router')) return 'vendor-react-router';
            if (id.includes('zustand') || id.includes('idb-keyval')) return 'vendor-storage';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
  },
});


