const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

// Web app URL Anda
const WEB_APP_URL = 'https://kas-badminton.inilanding.biz.id';

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "kas-badminton-railway"
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
            '--disable-gpu'
        ]
    }
});

// QR Code
client.on('qr', (qr) => {
    console.log('🔐 SCAN QR CODE INI DENGAN WHATSAPP:');
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan dengan WhatsApp mobile app.');
});

// WhatsApp Ready
client.on('ready', () => {
    console.log('✅ WHATSAPP CONNECTED! 🏸');
    console.log('🤖 Kas Badminton Bot siap menerima pesan!');
});

// WhatsApp Disconnected
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
    console.log('🔄 Restarting in 10 seconds...');
    setTimeout(() => {
        client.initialize();
    }, 10000);
});

// Message Handler
client.on('message', async (message) => {
    const body = message.body.trim();
    const sender = message.from;
    
    console.log(`📱 Pesan dari: ${sender}, Isi: ${body}`);
    
    // Command: Cek kas
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
            message.reply('❌ Gagal mengambil data kas. Coba lagi nanti.');
        }
    }
    
    // Command: Tambah pemasukan
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
                    message.reply('❌ Gagal menambah pemasukan. Coba lagi nanti.');
                }
            } else {
                message.reply('❌ Format: !tambah [nominal] [keterangan]\nContoh: !tambah 50000 iuran mingguan');
            }
        } else {
            message.reply('❌ Format: !tambah [nominal] [keterangan]\nContoh: !tambah 50000 iuran mingguan');
        }
    }

    // Command: Tambah pengeluaran
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
                    message.reply('❌ Gagal menambah pengeluaran. Coba lagi nanti.');
                }
            } else {
                message.reply('❌ Format: !keluar [nominal] [keterangan]\nContoh: !keluar 150000 sewa lapangan');
            }
        } else {
            message.reply('❌ Format: !keluar [nominal] [keterangan]\nContoh: !keluar 150000 sewa lapangan');
        }
    }

    // Command: Riwayat transaksi
    if (body === '!riwayat') {
        try {
            const response = await fetch(`${WEB_APP_URL}/api/kas`);
            const data = await response.json();
            
            if (data.transaksi.length === 0) {
                message.reply('📝 Belum ada transaksi');
            } else {
                let riwayat = `📝 *RIWAYAT TRANSAKSI* (5 terakhir)\n\n`;
                
                data.transaksi.slice(-5).reverse().forEach((trans, index) => {
                    const emoji = trans.type === 'pemasukan' ? '💹' : '💸';
                    const type = trans.type === 'pemasukan' ? 'MASUK' : 'KELUAR';
                    riwayat += `${emoji} *${type}* - Rp ${trans.nominal.toLocaleString('id-ID')}\n`;
                    riwayat += `📋 ${trans.keterangan}\n`;
                    riwayat += `📅 ${trans.tanggal}\n\n`;
                });

                riwayat += `💰 *Saldo Akhir: Rp ${data.saldo.toLocaleString('id-ID')}*`;
                message.reply(riwayat);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            message.reply('❌ Gagal mengambil riwayat transaksi.');
        }
    }

    // Command: Help
    if (body === '!help' || body === '!menu') {
        const helpText = `🏸 *KAS BADMINTON BOT* 🏸

*Perintah WhatsApp:*
!cekkas - Cek saldo kas lengkap
!tambah [nominal] [keterangan] - Tambah pemasukan
!keluar [nominal] [keterangan] - Tambah pengeluaran  
!riwayat - Lihat riwayat transaksi
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

// Start bot
console.log('🔄 Starting Kas Badminton WhatsApp Bot...');
client.initialize();

// Handle process exit
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down WhatsApp bot...');
    await client.destroy();
    process.exit(0);
});