const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Omegatech • NFToken v1.0 ✓';
const TOKEN_FILE = './data/nftokens.json';

if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
function loadTokens(){ try{ if(fs.existsSync(TOKEN_FILE)) return JSON.parse(fs.readFileSync(TOKEN_FILE,'utf8')); }catch{} return {}; }
function saveTokens(t){ try{ fs.writeFileSync(TOKEN_FILE, JSON.stringify(t,null,2)); }catch{} }
let nftTokens = loadTokens();

function getBotThumb(){
  try{ for(const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null;
}
async function prepareImage(conn){
  try{
    const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
    const tb=getBotThumb(); if(!tb) return null;
    const media=await prepareWAMessageMedia({ image:tb }, { upload: conn.waUploadToServer });
    return media.imageMessage;
  }catch{ return null; }
}
async function generateNFToken(retries=3){
  let lastError;
  for(let i=0;i<retries;i++){
    try{
      const { data } = await axios.get('https://api.omegatech.app/api/tools/Nftoken?action=generate', { timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
      if(data.success && data.data) return data;
      throw new Error('Generation failed');
    }catch(e){ lastError=e; console.log(`[NFToken] Retry ${i+1}/${retries}: ${e.message}`); if(i<retries-1) await new Promise(r=>setTimeout(r,1000*(i+1))); }
  }
  throw lastError;
}

cmd({
  pattern: "nft", alias: ["nftoken","netflix"], react:"🎬",
  desc:"Generate Netflix NFToken", category:"hacking tools",
  use:".nft |.nft copy 0 |.nft token",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    const args=(q||"").split(' ').filter(Boolean);
    const sub=args[0]?.toLowerCase()||'';

    if(sub==='copy' && args[1]!==undefined){
      const idx=parseInt(args[1]);
      const nftData=nftTokens[m.sender];
      if(!nftData?.data) return reply(`*⚠️ No NFToken. Generate first: ${prefix}nft*`);
      const links=nftData.data.links?.all||[];
      if(idx>=links.length || idx<0) return reply(`*❌ Invalid device*`);
      const sel=links[idx];
      await conn.sendMessage(from,{ text:`*📱 ${sel.device}*\n\n*🔗* \`${sel.url}\`\n\n*Tap and hold to copy.*` },{quoted:mek});
      await conn.sendMessage(from,{ react:{ text:"📋", key:mek.key } }).catch(()=>{});
      return;
    }
    if(sub==='token'){
      const nftData=nftTokens[m.sender];
      if(!nftData?.data) return reply(`*⚠️ No NFToken. Generate first*`);
      await conn.sendMessage(from,{ text:`*🔑 NFToken*\n\n\`${nftData.data.token}\`\n\n*Tap and hold to copy.*` },{quoted:mek});
      await conn.sendMessage(from,{ react:{ text:"📋", key:mek.key } }).catch(()=>{});
      return;
    }

    await conn.sendMessage(from,{ react:{ text:"⏳", key:mek.key } }).catch(()=>{});
    reply(`*🔄 Generating NFToken...*`);

    const result=await generateNFToken(3);
    const data=result.data;
    const token=data.token;
    const links=data.links?.all||[];
    const generatedAt=data.generatedAt||new Date().toISOString();

    nftTokens[m.sender]={ data: data, timestamp: Date.now() };
    saveTokens(nftTokens);

    let imageMessage=await prepareImage(conn);

    let menuText=`┏━━〔 🎬 NFToken Generator 〕━━┓\n┃ 🔑 Token: ${token.substring(0,40)}...\n┃ 📱 Devices: ${links.length}\n┃ 🕐 ${new Date(generatedAt).toLocaleString()}\n┗━━━━━━━━━━━━━━┛\n\n*Select device to copy:*`;

    const buttons=[];
    links.slice(0,3).forEach((link,index)=>{
      buttons.push({
        name:"quick_reply",
        buttonParamsJson: JSON.stringify({ display_text:`📱 ${link.device}`, id:`${prefix}nft copy ${index}` })
      });
    });
    buttons.push({ name:"quick_reply", buttonParamsJson: JSON.stringify({ display_text:"🔑 Copy Token", id:`${prefix}nft token` }) });
    buttons.push({ name:"quick_reply", buttonParamsJson: JSON.stringify({ display_text:"🔄 Regenerate", id:`${prefix}nft` }) });
    buttons.push({ name:"cta_url", buttonParamsJson: JSON.stringify({ display_text:"📢 Channel", url:CHANNEL_LINK }) });

    await conn.relayMessage(from,{
      interactiveMessage:{
        header:{ title:"🎬 Netflix NFToken", hasMediaAttachment:!!imageMessage,...(imageMessage? { imageMessage } : {}) },
        body:{ text: menuText },
        footer:{ text: BRAND },
        nativeFlowMessage:{ buttons }
      }
    },{});

    await conn.sendMessage(from,{ react:{ text:"✅", key:mek.key } }).catch(()=>{});
  }catch(e){
    console.error('NFToken Error:', e.message);
    await conn.sendMessage(from,{ react:{ text:"❌", key:mek.key } }).catch(()=>{});
    reply(`*❌ Failed to generate NFToken.*\n*Error:* ${e.message}\n*Try again later.*`);
  }
});
