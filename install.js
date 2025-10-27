// install.js - Custom install script untuk Render
const { execSync } = require('child_process');

console.log('🔧 Installing Chromium for Render.com...');

try {
  // Install Chromium dependencies
  execSync('apt-get update && apt-get install -y wget gnupg', { stdio: 'inherit' });
  
  // Install Chromium
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  
  console.log('✅ Chromium installed successfully');
} catch (error) {
  console.log('⚠️ Using system Chromium');
}
