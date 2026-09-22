import express from 'express';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
const app = express();
const PORT = process.env.PORT || 3000;
let pairingCode = null;
let isConnected = false;
let lastCodeTime = 0;

app.get('/', (req, res) => {
  if (isConnected) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">✅ BOT CONECTADO - 3328034948 - Ya puedes usar.diamantes</h1>');
  if (!pairingCode) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:50px">⏳ Generando codigo nuevo... espera 15s</h1><script>setTimeout(()=>location.reload(),10000)</script>');
  const sec = Math.max(0, 60 - Math.floor((Date.now()-lastCodeTime)/1000));
  res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:20px"><h1>🤖 CODIGO NUEVO (expira en ${sec}s):</h1><h1 style="font-size:50px;letter-spacing:6px;background:#000;color:#25D366;padding:20px;border-radius:12px">${pairingCode}</h1><p>WhatsApp > 3 puntitos > Dispositivos vinculados > Vincular dispositivo > Vincular con numero</p><p>¡Escribelo rapido!</p><script>setTimeout(()=>location.reload(),8000)</script></div>`);
});

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["Ubuntu","Chrome","20.0"] });
  sock.ev.on('creds.update', saveCreds);
  if (!sock.authState.creds.registered) {
    const genCode = async () => {
      try {
        pairingCode = await sock.requestPairingCode("5213328034948");
        lastCodeTime = Date.now();
        console.log('CODIGO:', pairingCode);
      } catch(e){ console.log('Error codigo', e); }
    };
    setTimeout(genCode, 3000);
    setInterval(genCode, 45000);
  }
  sock.ev.on('connection.update', (u)=>{
    const { connection, lastDisconnect } = u;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') { isConnected = true; console.log('CONECTADO'); }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if (!m.message || m.key.fromMe) return;
    const jid = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const t = text.toLowerCase().trim();
    if (t.startsWith('.diamantes')) {
      const num = parseInt(t.split(' ')[1]) || 0;
      if (num <= 0) await sock.sendMessage(jid, { text: '💎 Usa:.diamantes 100' });
      else await sock.sendMessage(jid, { text: `💎 ${num} diamantes = $${(num*0.18).toFixed(2)} USD\n📲 Para comprar: wa.me/5213328034948` });
    }
  });
}
app.listen(PORT, ()=>{ startBot(); });
