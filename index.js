import express from 'express';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

const app = express();
const PORT = process.env.PORT || 3000;
let pairingCode = null;
let isConnected = false;

app.get('/', (req, res) => {
  if (isConnected) {
    return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">✅ BOT CONECTADO - 3328034948<br>Ya funciona .diamantes</h1>');
  }
  if (!pairingCode) {
    return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:50px">⏳ Generando tu codigo...<br>Refresca en 15 segundos</h1><script>setTimeout(()=>location.reload(),15000)</script>');
  }
  res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:20px"><h1>🤖 TU CODIGO ES:</h1><h1 style="font-size:55px;letter-spacing:8px;background:#000;color:#25D366;padding:25px;border-radius:15px">${pairingCode}</h1><p style="font-size:18px">1. Abre WhatsApp<br>2. Ajustes > Dispositivos vinculados<br>3. Vincular dispositivo<br>4. Abajo dice "Vincular con numero de telefono"<br>5. Escribe este codigo</p><p>Se actualiza cada 2 min, si expira refresca</p><script>setTimeout(()=>location.reload(),30000)</script></div>`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["Ubuntu","Chrome","20.0"] });
  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        pairingCode = await sock.requestPairingCode("523328034948");
        console.log('TU CODIGO:', pairingCode);
      } catch(e){ console.log('Error codigo', e); }
    }, 8000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
      else { pairingCode = null; isConnected = false; }
    } else if (connection === 'open') {
      isConnected = true;
      pairingCode = null;
      console.log('¡BOT CONECTADO!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if (!m.message || m.key.fromMe) return;
    const jid = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const t = text.toLowerCase().trim();
    if (t.startsWith('.diamantes')) {
      const num = parseInt(t.split(' ')[1]) || 0;
      if (num <= 0) await sock.sendMessage(jid, { text: '💎 Escribe: .diamantes 100\nTe digo cuanto cuestan 100 diamantes' });
      else { const precio = (num * 0.18).toFixed(2); await sock.sendMessage(jid, { text: `💎 ${num} diamantes = $${precio} USD\n\nPara comprar manda comprobante` }); }
    }
  });
}
app.listen(PORT, () => { console.log('Servidor en ' + PORT); startBot(); });
