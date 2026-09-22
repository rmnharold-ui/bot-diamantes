const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
let sock; let qrImage = null; let isConnected = false;

const MENU = `💎 *PRECIOS DIAMANTES FREE FIRE* 💎

*🔥 NORMAL:*
💎110 x $17 mx
💎341 x 45 mx
💎572 x 70 mx
💎1166 x 130 mx
💎2398 x 240 mx
💎6160 x 610 mx

*⭐ 1 VEZ POR ID:*
💎110 x $13 mx
💎341 x 35 mx
💎572 x 55 mx
💎1166 x 100 mx
💎2389 x 190 mx
💎6160 x 460 mx

💳 *PAGO:*
4152314459794353
Bancomer BBVA
Esperanza Maldonado

Manda tu ID y comprobante 💰`;

app.get('/', (req,res)=>{
  if(isConnected) return res.send('<h1>✅ Bot Conectado</h1><p>Ya esta escuchando, escribe diamante en tu grupo</p>');
  if(!qrImage) return res.send('<h1>⏳ Iniciando bot... refresca en 10 seg</h1>');
  res.send(`<center><h2>Escanea este QR con WhatsApp</h2><img src="${qrImage}" width="300"></center>`);
});

app.listen(PORT, ()=>console.log('Server en',PORT));

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  sock = makeWASocket({ version, auth: state, browser: ['Bot Diamantes','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0];
    if (!msg.message) return;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const from = msg.key.remoteJid;
    console.log("MSG DE:", from, "TEXTO:", text);
    if (text.includes('diamante') || text.includes('precio') || text.includes('lista') || text.includes('menu')) {
      console.log("RESPONDIENDO MENU A:", from);
      await sock.sendMessage(from, { text: MENU });
    }
  });
  sock.ev.on('connection.update', async (u)=>{
    const { connection, qr } = u;
    if(qr){ qrImage = await QRCode.toDataURL(qr); console.log('Nuevo QR'); }
    if(connection==='open'){ isConnected=true; qrImage=null; console.log('✅ CONECTADO'); }
    if(connection==='close'){ isConnected=false; startBot(); }
  });
}
startBot();
