import express from 'express';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

const app = express();
const PORT = process.env.PORT || 3000;
let pairingCode = null;
let isConnected = false;

app.get('/', (req, res) => {
  if (isConnected) {
    return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">✅ BOT CONECTADO<br>3328034948 - Ya funciona .diamantes</h1>');
  }
  if (!pairingCode) {
    return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:50px">⏳ Generando codigo...<br>Refresca en 15 seg</h1><script>setTimeout(()=>location.reload(),15000)</script>');
  }
  res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:20px"><h1>🤖 TU CODIGO ES:</h1><h1 style="font-size:50px;letter-spacing:6px;background:#000;color:#25D366;padding:20px;border-radius:12px">${pairingCode}</h1><p>WhatsApp > Ajustes > Dispositivos vinculados > Vincular con numero</p><script>setTimeout(()=>location.reload(),30000)</script></div>`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["Ubuntu","Chrome","20.0"] });
  sock.ev.on('creds.update', saveCreds);
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        pairingCode = await sock.requestPairingCode("523328034948");
        console.log('CODIGO:', pairingCode);
      } catch(e){ console.log('Error', e); }
    }, 5000);
  }
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      isConnected = true;
      console.log('CONECTADO!');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if (!m.message || m.key.fromMe) return;
    const jid = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const t = text.toLowerCase().trim();
    if (t.startsWith('.diamantes')) {
      const num = parseInt(t.split(' ')[1]) || 0;
      if (num <= 0) await sock.sendMessage(jid, { text: '💎 Usa: .diamantes 100' });
      else await sock.sendMessage(jid, { text: `💎 ${num} diamantes = $${(num*0.18).toFixed(2)} USD` });
    }
  });
}
app.listen(PORT, () => { startBot(); });
