const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;
let qrImage = null;
let isConnected = false;
app.get('/', async (req, res) => {
  if (isConnected) return res.send('<h1 style="font-family:sans-serif;color:green;text-align:center;margin-top:100px">✅ YA QUEDO CONECTADO HAROLD!</h1>');
  if (!qrImage) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">⌛ Generando QR... refresca en 5 seg</h1><script>setTimeout(()=>location.reload(),5000)</script>');
  res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:20px">
  <h1>ESCANEA ESTE QR</h1>
  <img src="${qrImage}" style="width:300px;border:10px solid #000;border-radius:20px" />
  <p>WhatsApp > Dispositivos vinculados > Vincular dispositivo > Escanear QR</p>
  <p>Se actualiza cada 30 seg</p>
  <script>setTimeout(()=>location.reload(),20000)</script></div>`);
});
app.listen(PORT, () => console.log('Server', PORT));
async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ["Ubuntu", "Chrome", "20.0.04"] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update)=>{
    const { connection, lastDisconnect, qr } = update;
    if(qr){
      qrImage = await QRCode.toDataURL(qr);
      console.log('QR generado');
    }
    if(connection === 'open'){ isConnected = true; console.log('CONECTADO!'); }
    if(connection === 'close'){
      isConnected = false; qrImage = null;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if(shouldReconnect) setTimeout(startBot, 3000);
    }
  });
}
startBot();
