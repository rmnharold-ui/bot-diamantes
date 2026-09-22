const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const P = require('pino');
const m = new Map();
const MENU=`💎 *DIAMANTES FREE FIRE* 💎

*PRECIO NORMAL:*
110 diamantes - $17 MXN
341 diamantes - $45 MXN
572 diamantes - $70 MXN
1166 diamantes - $130 MXN
2398 diamantes - $240 MXN
6160 diamantes - $610 MXN

*OFERTA 1 VEZ POR ID:*
110 x $13 MXN
341 x $35 MXN
572 x $55 MXN
1166 x $100 MXN
2389 x $190 MXN
6160 x $460 MXN

💳 *PAGO:*
BBVA Bancomer
4152 3144 5979 4353
Esperanza Maldonado

Manda captura + tu ID`;

async function start(){
 const { state, saveCreds } = await useMultiFileAuthState('auth_info');
 const sock = makeWASocket({ auth: state, logger: P({level:'silent'}), printQRInTerminal:true });
 sock.ev.on('creds.update', saveCreds);
 sock.ev.on('connection.update', u=>{
  if(u.qr){ qrcode.generate(u.qr,{small:true}); }
  if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) start();
 });
 sock.ev.on('messages.upsert', async ({messages})=>{
  for(let msg of messages){
   if(!msg.message || msg.key.fromMe) continue;
   let jid=msg.key.remoteJid; 
   let txt=(msg.message.conversation||msg.message.extendedTextMessage?.text||'').toLowerCase();
   if(jid.endsWith('@g.us') && (Date.now()-(m.get(jid)||0)<120000)) continue;
   let r=null;
   if(txt.includes('hola')||txt.includes('diamantes')||txt.includes('lista')||txt.includes('menu')||txt.includes('precio')) r=`Hola 👋\n${MENU}`;
   else if(txt.match(/110|341|572|1166|2398|6160/)) r=`${MENU}`;
   if(r){ await sock.sendMessage(jid,{text:r}); if(jid.endsWith('@g.us')) m.set(jid,Date.now()); }
  }
 });
}
start();
