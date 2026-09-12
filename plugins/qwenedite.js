const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Qwen-image-edit';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

async function getImageBuffer(mek, conn){
  try{
    if(mek.message?.imageMessage) return await conn.downloadMediaMessage(mek);
    const quoted=mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if(quoted) return await conn.downloadMediaMessage({ message:{ imageMessage: quoted } });
  }catch{}
  return null;
}

cmd({
  pattern: "qwenedit", alias: ["qwen","editimg","aiedit"], react:"✏️",
  desc:"Edit image with Qwen AI", category:"progresstech ai",
  use:".qwenedit add sunglasses (reply image)",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`,'i'),'').trim();
    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };
    const imageBuffer=await getImageBuffer(mek, conn);

    if(!imageBuffer){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const qwen=`┏━━〔 ✏️ Qwen Image Edit 〕━━┓\n┃ Reply to image:\n┃ ${prefix}qwenedit add sunglasses\n┃ ${prefix}qwenedit extract outfit\n┃ ${prefix}qwenedit sunset background\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"✏️ Qwen Edit",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🕶️ Add Sunglasses",id:`${prefix}qwenedit add black sunglasses`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }
    if(!rawQ) rawQ="enhance image 4k";

    await conn.sendMessage(from,{react:{text:"✏️",key:mek.key}}).catch(()=>{});
    reply(`*✏️ Qwen Editing...*\n*Prompt:* ${rawQ.slice(0,100)}\n_Wait 15-40s..._\n_${BRAND}_`);

    let editedUrl=null;
    try{
      const form=new FormData();
      form.append('image', imageBuffer, { filename:'input.jpg', contentType:'image/jpeg' });
      form.append('prompt', rawQ);
      const { data, headers } = await axios.post(API, form, { timeout:120000, headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, responseType:'arraybuffer' });
      if((headers['content-type']||'').includes('image')){
        await conn.sendMessage(from,{ image: Buffer.from(data), caption:`*✅ Qwen Edited*\n*${rawQ}*\n*${BRAND}*`, contextInfo:ctx },{quoted:mek});
        return;
      }
      try{
        const json=JSON.parse(Buffer.from(data).toString('utf8'));
        editedUrl=json?.data?.url||json?.url||json?.data?.result;
      }catch{}
    }catch(e){ console.log('FormData fail', e.message); }

    if(!editedUrl){
      try{
        const { data } = await axios.post(API, { image:`data:image/jpeg;base64,${imageBuffer.toString('base64')}`, prompt: rawQ }, { timeout:120000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'} });
        editedUrl=data?.data?.url||data?.url||data?.data?.result||data?.result;
      }catch(e){ console.log('JSON fail', e.message); }
    }

    if(!editedUrl) throw new Error('No result. Try simpler prompt.');
    await conn.sendMessage(from,{ image:{ url: editedUrl }, caption:`*✅ Qwen Edited*\n*${rawQ}*\n*${BRAND}*`, contextInfo:ctx },{quoted:mek});
  }catch(e){
    reply(`*❌ Qwen Failed*\n${e.message}\nReply image + .qwenedit add sunglasses`);
  }
});
