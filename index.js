const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;
let qrImage = null;
let isConnected = false;

const MENU = `💎 *DIAMANTES FREE FIRE - HAROLD* 💎

*💎 NORMAL*
💎 110 x $17 MXN
💎 341 x $45 MXN
💎 572 x $70 MXN
💎 1166 x $130 MXN
💎 2398 x $240 MXN
💎 6160 x $610 MXN

*🔥 1 VEZ POR ID (MAS BARATO)*
💎 110 x $13 MXN
💎 341 x $35 MXN
💎 572 x $55 MXN
💎 1166 x $100 MXN
💎 2398 x $190 MXN
💎 6160 x $460 MXN

*PAGO:*
💳 4152 3144 5979 4353
Bancomer BBVA
Esperanza Maldonado

Manda tu ID y comprobante 💰`;

app.get('/', (req,res)=>{
  if(isConnected) return res.send('<h1>✅ Bot Conectado - Solo tu grupo</h1>');
  if(!qrImage) return res.send('<h1>⏳ Iniciando...</h1>');
  res.send(`<div style="text-align:center"><h2>Escanea el QR</h2><img src="${qrImage}" style="width:300px"/></div>`);
});
app.listen(PORT, ()=>console.log('Server',PORT));

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ version, auth: state, browser: ['Bot','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0];
    if(!msg.message || msg.key.fromMe) return;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const from = msg.key.remoteJid;

    // === FILTRO: SOLO RESPONDE EN GRUPOS ===
    console.log("MSG DE:", from);
    if(!from.endsWith('@g.us')) return;

    if(text.includes('diamante') || text.includes('precio') || text.includes('menu') || text.includes('costo') || text.includes('lista')){
      await sock.sendMessage(from, { text: MENU });
    }
  });

  sock.ev.on('connection.update', async (u)=>{
    const { connection, qr } = u;
    if(qr){ qrImage = await QRCode.toDataURL(qr); }
    if(connection==='open'){ isConnected=true; qrImage=null; console.log('Conectado'); }
    if(connection==='close'){ isConnected=false; startBot(); }
  });
}
startBot();
