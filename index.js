const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const app = express();
const PORT = process.env.PORT || 10000;
let isConnected = false;
app.get('/', (req,res)=>{ res.send(isConnected? '<h1>✅ BOT DE DIAMANTES ACTIVO</h1><p>Harold Shop</p>' : '<h1>⌛ Conectando...</h1>'); });
app.listen(PORT, ()=>console.log('Server',PORT));

const MENU = `💎 *DIAMANTES FREE FIRE - HAROLD SHOP* 💎

*🔹 NORMAL (ID + SIN CONTRASEÑA)*
💎 110 x $17 MXN
💎 341 x $45 MXN
💎 572 x $70 MXN
💎 1166 x $130 MXN
💎 2398 x $240 MXN
💎 6160 x $610 MXN

*🔥 1 VEZ POR ID (MÁS BARATO)*
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

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ version, auth: state, printQRInTerminal:false, browser:["Ubuntu","Chrome","20.0.04"] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0]; if(!msg.message || msg.key.fromMe) return;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const from = msg.key.remoteJid;
    if(text.includes('diamante') || text.includes('precio') || text.includes('cuanto') || text.includes('lista') || text.includes('info')){
      await sock.sendMessage(from, { text: MENU });
    }
  });
  sock.ev.on('connection.update', (u)=>{
    const { connection, lastDisconnect } = u;
    if(connection==='open'){ isConnected=true; console.log('CONECTADO!'); }
    if(connection==='close'){
      isConnected=false;
      const r = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if(r) setTimeout(startBot,3000);
    }
  });
}
startBot();
