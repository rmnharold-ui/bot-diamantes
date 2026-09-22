const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 10000;
let pairingCode = null;
let isConnected = false;
let lastCodeTime = 0;

app.get('/', (req, res) => {
  if (isConnected) return res.send('<h1 style="font-family:sans-serif;color:green">✅ BOT CONECTADO EXITOSAMENTE</h1>');
  if (!pairingCode) return res.send('<h1 style="font-family:sans-serif">⌛ Generando codigo... refresca en 5 segundos</h1><script>setTimeout(()=>location.reload(),5000)</script>');
  const sec = Math.max(0, 60 - Math.floor((Date.now() - lastCodeTime)/1000));
  res.send(`<div style="font-family:sans-serif;text-align:center;margin-top:50px">
  <h1>TU CODIGO DE VINCULACION</h1>
  <h1 style="font-size:50px;letter-spacing:5px;background:#000;color:#fff;padding:20px;border-radius:10px;display:inline-block">${pairingCode}</h1>
  <p>Expira en ${sec} segundos</p>
  <p>WhatsApp > Dispositivos vinculados > Vincular con numero de telefono</p>
  <script>setTimeout(()=>location.reload(),15000)</script>
  </div>`);
});

app.listen(PORT, () => console.log('Servidor en puerto', PORT));

async function startBot(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ 
    version, 
    auth: state, 
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
     setTimeout(async ()=>{
       try{
         let code = await sock.requestPairingCode("523328034948");
         pairingCode = code;
         lastCodeTime = Date.now();
         console.log(`CODIGO: ${code}`);
       }catch(e){ console.log("Error al pedir codigo", e.message) }
     }, 3000);
  }

  sock.ev.on('connection.update', (update)=>{
    const { connection, lastDisconnect } = update;
    if(connection === 'open'){
      isConnected = true;
      pairingCode = null;
      console.log('CONECTADO!');
    }
    if(connection === 'close'){
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if(shouldReconnect){
        console.log('Reconectando...');
        setTimeout(startBot, 3000);
      }
    }
  });
}
startBot();
