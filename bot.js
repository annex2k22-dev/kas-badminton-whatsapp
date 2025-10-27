const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Web app URL Anda
const WEB_APP_URL = 'https://kas-badminton.inilanding.biz.id';

// Config untuk Render - gunakan browserless atau system browser
const puppeteerOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--single-process'
  ]
};

// Coba berbagai executable path untuk Chromium
const possiblePaths = [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/snap/bin/chromium'
];

// Auto-detect Chromium path
for (const path of possiblePaths) {
  try {
    require('fs').accessSync(path);
    puppeteerOptions.executablePath = path;
    console.log(`✅ Using Chromium at: ${path}`);
    break;
  } catch (error) {
    // Continue to next path
  }
}

// Jika tidak ada Chromium, gunakan fallback
if (!puppeteerOptions.executablePath) {
  console.log('❌ No Chromium found, using fallback mode');
  // We'll handle this in client initialization
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
  console.log('📱 Scan QR code di atas dengan WhatsApp mobile app');
});

client.on('ready', () => {
  console.log('✅ WHATSAPP CONNECTED! 🏸');
  console.log('🤖 Kas Badminton Bot siap menerima pesan!');
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp disconnected:', reason);
});

// Message Handler
client.on('message', async (message) => {
  const body = message.body.trim();
  
  console.log(`📱 Received: ${body} from ${message.from}`);
  
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
      console.error('Error fetching data:', error);
      message.reply('❌ Gagal mengambil data kas. Web app mungkin sedang offline.');
    }
  }
  
  if (body.startsWith('!tambah')) {
    const parts = body.split(' ');
    if (parts.length >= 3) {
      const nominal = parts[1];
      const keterangan = parts.slice(2).join(' ');

      if (!isNaN(nominal) && parseInt(nominal) > 0) {
        try {
          const response = await fetch(`${WEB_APP_URL}/api/tambah`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nominal: nominal,
              keterangan: keterangan
            })
          });

          const result = await response.json();
          
          if (result.success) {
            const successMessage = `✅ *Pemasukan Berhasil*

Jumlah: Rp ${parseInt(nominal).toLocaleString('id-ID')}
Keterangan: ${keterangan}
Saldo baru: Rp ${result.saldo.toLocaleString('id-ID')}

Terima kasih! 🏸`;
            message.reply(successMessage);
          } else {
            message.reply(`❌ ${result.error}`);
          }
        } catch (error) {
          console.error('Error adding income:', error);
          message.reply('❌ Gagal menambah pemasukan. Web app mungkin sedang offline.');
        }
      } else {
        message.reply('❌ Format: !tambah [nominal] [keterangan]\nContoh: !tambah 50000 iuran mingguan');
      }
    } else {
      message.reply('❌ Format: !tambah [nominal] [keterangan]\nContoh: !tambah 50000 iuran mingguan');
    }
  }

  if (body.startsWith('!keluar')) {
    const parts = body.split(' ');
    if (parts.length >= 3) {
      const nominal = parts[1];
      const keterangan = parts.slice(2).join(' ');

      if (!isNaN(nominal) && parseInt(nominal) > 0) {
        try {
          const response = await fetch(`${WEB_APP_URL}/api/keluar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nominal: nominal,
              keterangan: keterangan
            })
          });

          const result = await response.json();
          
          if (result.success) {
            const successMessage = `✅ *Pengeluaran Berhasil*

Jumlah: Rp ${parseInt(nominal).toLocaleString('id-ID')}
Keterangan: ${keterangan}
Saldo baru: Rp ${result.saldo.toLocaleString('id-ID')}

Tetap hemat! 💰🏸`;
            message.reply(successMessage);
          } else {
            message.reply(`❌ ${result.error}`);
          }
        } catch (error) {
          console.error('Error adding expense:', error);
          message.reply('❌ Gagal menambah pengeluaran. Web app mungkin sedang offline.');
        }
      } else {
        message.reply('❌ Format: !keluar [nominal] [keterangan]\nContoh: !keluar 150000 sewa lapangan');
      }
    } else {
      message.reply('❌ Format: !keluar [nominal] [keterangan]\nContoh: !keluar 150000 sewa lapangan');
    }
  }

  if (body === '!help' || body === '!menu') {
    const helpText = `🏸 *KAS BADMINTON BOT* 🏸

*Perintah WhatsApp:*
!cekkas - Cek saldo kas lengkap
!tambah [nominal] [keterangan] - Tambah pemasukan
!keluar [nominal] [keterangan] - Tambah pengeluaran  
!help - Bantuan

*Contoh penggunaan:*
!tambah 50000 iuran anggota
!keluar 120000 beli shuttlecock
!cekkas

*Web Dashboard:*
${WEB_APP_URL}

_Semangat olahraga! 🏸_`;

    message.reply(helpText);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Kas Badminton WhatsApp Bot',
    whatsapp_status: 'initializing',
    timestamp: new Date().toISOString(),
    web_app: WEB_APP_URL
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Kas Badminton WhatsApp Bot',
    status: 'Running - Check logs for QR Code',
    usage: 'Add this bot to WhatsApp and use commands like !cekkas'
  });
});

// Initialize WhatsApp dengan error handling
async function initializeWhatsApp() {
  try {
    console.log('🔄 Initializing WhatsApp client...');
    await client.initialize();
    console.log('✅ WhatsApp client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WhatsApp:', error.message);
    
    if (error.message.includes('ENOENT') || error.message.includes('chromium')) {
      console.log('💡 Solution: Render.com tidak memiliki Chromium installed');
      console.log('💡 Consider using Koyeb.com atau Oracle Cloud untuk WhatsApp bot');
    }
    
    // Retry setelah 30 detik
    console.log('🔄 Retrying in 30 seconds...');
    setTimeout(initializeWhatsApp, 30000);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WhatsApp Bot API running on port ${PORT}`);
  console.log(`🌐 Web: https://kas-badminton-whatsapp.onrender.com`);
  console.log(`❤️ Health: https://kas-badminton-whatsapp.onrender.com/health`);
  
  // Initialize WhatsApp
  initializeWhatsApp();
});
