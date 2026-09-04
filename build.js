const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(dist, 'index.html'));

const redirectsPath = path.join(__dirname, '_redirects');
if (fs.existsSync(redirectsPath)) {
  fs.copyFileSync(redirectsPath, path.join(dist, '_redirects'));
}

console.log('Build complete: copied index.html to dist/');
