const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Web app URL Anda
const WEB_APP_URL = 'https://kas-badminton.inilanding.biz.id';

// Config untuk Render - gunakan system Chromium
const puppeteerOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
};

// Jika di Render, gunakan system Chromium
if (process.env.RENDER) {
  puppeteerOptions.executablePath = '/usr/bin/chromium-browser';
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "kas-badminton-render"
  }),
  puppeteer: puppeteerOptions
});

// QR Code
client.on('qr', (qr) => {
  console.log('🔐 SCAN QR CODE INI DENGAN WHATSAPP:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WHATSAPP CONNECTED! 🏸');
});

// [MESSAGE HANDLER SAMA SEPERTI SEBELUMNYA]
client.on('message', async (message) => {
  const body = message.body.trim();
  
  if (body === '!cekkas') {
    try {
      const response = await fetch(`${WEB_APP_URL}/api/kas`);
      const data = await response.json();
      
      const reply = `Assalamualaikum

🏸 *KAS BADMINTON* 🏸
Update kas, ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Pemasukkan: Rp ${data.pemasukan.toLocaleString('id-ID')}
Pengeluaran: Rp ${data.pengeluaran.toLocaleString('id-ID')}
Sisa kas: Rp ${data.saldo.toLocaleString('id-ID')}

Terima kasih,
SEMANGAT TERUSSS!! 💪🏸`;
      
      message.reply(reply);
    } catch (error) {
      message.reply('❌ Gagal mengambil data kas');
    }
  }
  
  // [TAMBAHKAN COMMAND LAINNYA...]
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Kas Badminton WhatsApp Bot - Render'
  });
});

// Start dengan error handling
async function startApp() {
  try {
    await client.initialize();
    console.log('✅ WhatsApp client initialized');
  } catch (error) {
    console.error('❌ WhatsApp init error:', error.message);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Bot running on port ${PORT}`);
  startApp();
});
