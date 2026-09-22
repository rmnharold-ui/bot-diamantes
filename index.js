import express from 'express';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';

const app = express();
const PORT = process.env.PORT || 3000;
let qrCodeData = null;
let isConnected = false;

app.get('/', async (req, res) => {
  if (isConnected) {
    return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">✅ BOT DE DIAMANTES CONECTADO - Reynaldo</h1><p style="text-align:center">Ya puedes usar .diamantes en WhatsApp</p>');
  }
  if (!qrCodeData) {
    return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">⏳ Generando QR... refresca en 5 segundos</h1><script>setTimeout(()=>location.reload(),5000)</script>');
  }
  try {
    const qrImage = await qrcode.toDataURL(qrCodeData);
    res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:20px"><h1>🤖 BOT DE DIAMANTES - ESCANEA</h1><p>WhatsApp > 3 puntos > Dispositivos vinculados > Vincular</p><img src="${qrImage}" style="width:300px;height:300px"/><p>Se actualiza cada 30 segundos</p><script>setTimeout(()=>location.reload(),30000)</script></div>`);
  } catch (e) {
    res.send('Error generando QR');
  }
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { qrCodeData = qr; console.log('QR GENERADO'); }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      isConnected = true; qrCodeData = null;
      console.log('¡BOT CONECTADO!');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    if (text.toLowerCase().trim() === '.diamantes') {
      const response = `💎 *CALCULADORA DE DIAMANTES* 💎\n\nEscribe asi:\n.diamantes 100\n\nEjemplo: si recargas 100 diamantes, te digo cuanto cuesta.`;
      await sock.sendMessage(m.key.remoteJid, { text: response });
    } else if (text.toLowerCase().startsWith('.diamantes ')) {
      const num = parseInt(text.split(' ')[1]); if (isNaN(num)) return;
      const price = (num * 0.15).toFixed(2);
      await sock.sendMessage(m.key.remoteJid, { text: `💎 ${num} diamantes = $${price} USD\n\n¿Confirmas? Escribe .comprar` });
    }
  });
}

app.listen(PORT, () => { console.log('Servidor en puerto ' + PORT); startBot(); });7
