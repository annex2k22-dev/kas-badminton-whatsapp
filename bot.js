const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Web app URL Anda
const WEB_APP_URL = 'https://kas-badminton.inilanding.biz.id';

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "kas-badminton-render"
    }),
    puppeteer: {
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
    }
});

// QR Code
client.on('qr', (qr) => {
    console.log('🔐 SCAN QR CODE INI DENGAN WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WHATSAPP CONNECTED! 🏸');
});

client.on('message', async (message) => {
    const body = message.body.trim();
    
    if (body === '!cekkas') {
        try {
            const response = await fetch(`${WEB_APP_URL}/api/kas`);
            const data = await response.json();
            
            const reply = `🏸 *KAS BADMINTON* 🏸

Pemasukkan: Rp ${data.pemasukan.toLocaleString('id-ID')}
Pengeluaran: Rp ${data.pengeluaran.toLocaleString('id-ID')}
Sisa kas: Rp ${data.saldo.toLocaleString('id-ID')}

Terima kasih! 🏸`;
            
            message.reply(reply);
        } catch (error) {
            message.reply('❌ Gagal mengambil data kas');
        }
    }
    
    if (body.startsWith('!tambah')) {
        const parts = body.split(' ');
        if (parts.length >= 3) {
            try {
                const response = await fetch(`${WEB_APP_URL}/api/tambah`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nominal: parts[1],
                        keterangan: parts.slice(2).join(' ')
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    message.reply(`✅ ${result.message}`);
                } else {
                    message.reply(`❌ ${result.error}`);
                }
            } catch (error) {
                message.reply('❌ Gagal menambah transaksi');
            }
        }
    }

    if (body.startsWith('!keluar')) {
        const parts = body.split(' ');
        if (parts.length >= 3) {
            try {
                const response = await fetch(`${WEB_APP_URL}/api/keluar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nominal: parts[1],
                        keterangan: parts.slice(2).join(' ')
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    message.reply(`✅ ${result.message}`);
                } else {
                    message.reply(`❌ ${result.error}`);
                }
            } catch (error) {
                message.reply('❌ Gagal menambah pengeluaran');
            }
        }
    }

    if (body === '!help') {
        const helpText = `🏸 *KAS BADMINTON BOT* 🏸

!cekkas - Cek saldo
!tambah [nominal] [keterangan] - Tambah pemasukan
!keluar [nominal] [keterangan] - Tambah pengeluaran
!help - Bantuan

Contoh: !tambah 50000 iuran mingguan`;
        
        message.reply(helpText);
    }
});

// Health check endpoint untuk Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Kas Badminton WhatsApp Bot',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Kas Badminton WhatsApp Bot is running!',
        usage: 'Add this bot to your WhatsApp and use commands like !cekkas'
    });
});

// Start bot
console.log('🔄 Starting WhatsApp Bot on Render...');
client.initialize();

// Start web server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ WhatsApp Bot running on port ${PORT}`);
    console.log(`❤️ Health: http://localhost:${PORT}/health`);
});
