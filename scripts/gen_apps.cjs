const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'src', 'apps');

if (!fs.existsSync(appsDir)) {
  fs.mkdirSync(appsDir, { recursive: true });
}

for (let i = 1; i <= 10; i++) {
  const appName = `template${i}`;
  const appPath = path.join(appsDir, appName);
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath);
    const content = `import React from 'react';
import { Package } from 'lucide-react';

export const config = {
  name: 'App Template ${i}',
  description: 'Deskripsi singkat aplikasi template ke-${i}',
  icon: <Package size={24} />,
  color: '#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}'
};

const App = () => {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>{config.name}</h1>
      <p>Selamat datang di aplikasi {config.name}. Ini adalah template dasar.</p>
    </div>
  );
};

export default App;
`;
    fs.writeFileSync(path.join(appPath, 'index.jsx'), content);
  }
}

console.log('10 App templates created successfully!');
