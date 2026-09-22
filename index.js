const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;
let qrImage = null;
let isConnected = false;

const MENU = `💎 *DIAMANTES FREE FIRE - HAROLD SHOP* 💎

*🔹 NORMAL*
💎 110 x $17 MXN
💎 341 x $45 MXN
💎 572 x $70 MXN
💎 1166 x $130 MXN
💎 2398 x $240 MXN
💎 6160 x $610 MXN

*🔥 1 VEZ POR ID*
💎 110 x $13 MXN
💎 341 x $35 MXN
💎 572 x $55 MXN
💎 1166 x $100 MXN
💎 2398 x $190 MXN
💎 6160 x $460 MXN

💳 *PAGO:*
4152 3144 5979 4353
Bancomer BBVA
Esperanza Maldonado

Manda tu ID y comprobante 💰`;

app.get('/', (req,res)=>{
  if(isConnected) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px;color:green">✅ BOT ACTIVO HAROLD</h1><p style="text-align:center">Ya contesta solo</p>');
  if(!qrImage) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">⌛ Generando QR... refresca en 5s</h1><script>setTimeout(()=>location.reload(),5000)</script>');
  res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:20px"><h1>ESCANEA ESTE QR</h1><img src="${qrImage}" style="width:300px;border:10px solid #000;border-radius:20px" /><p>WhatsApp > Dispositivos vinculados > Vincular</p><script>setTimeout(()=>location.reload(),20000)</script></div>`);
});
app.listen(PORT, ()=>console.log('Server',PORT));

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ version, auth: state, browser:["Ubuntu","Chrome","20.0.04"] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0]; if(!msg.message || msg.key.fromMe) return;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const from = msg.key.remoteJid;
    if(text.includes('diamante') || text.includes('precio') || text.includes('lista') || text.includes('info') || text.includes('cuanto')){
      await sock.sendMessage(from, { text: MENU });
    }
  });
  sock.ev.on('connection.update', async (u)=>{
    const { connection, lastDisconnect, qr } = u;
    if(qr){ qrImage = await QRCode.toDataURL(qr); }
    if(connection==='open'){ isConnected=true; qrImage=null; console.log('CONECTADO!'); }
    if(connection==='close'){ isConnected=false; qrImage=null; const r = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut; if(r) setTimeout(startBot,3000); }
  });
}
startBot();
