import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('Escanea el QR');
});

client.on('ready', () => {
    console.log('¡Bot de diamantes listo!');
});

client.on('message', async msg => {
    if(msg.body === '!diamantes'){
        msg.reply('🔥 *BOT DIAMANTES* 🔥\n\n¡Enviame una foto de tu ID de Free Fire y te digo cuántos diamantes te toca!');
    }
});

client.initialize();
