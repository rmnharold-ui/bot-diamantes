import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import P from 'pino';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr){
            qrcode.generate(qr, {small: true});
            console.log('Escanea el QR');
        }
        if(connection === 'close'){
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        } else if(connection === 'open'){
            console.log('¡Bot de diamantes conectado!');
        }
    });
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        if(text === '!diamantes'){
            await sock.sendMessage(msg.key.remoteJid, { text: '🔥 *BOT DIAMANTES* 🔥\n¡Manda foto de tu ID!' });
        }
    });
}
startBot();
