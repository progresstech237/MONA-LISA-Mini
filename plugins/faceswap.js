const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/faceswap';

function getThumb(){
  try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null;
}
async function getImageBuffer(mek, conn){
  try{
    const msg = mek.message?.imageMessage || mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || mek.message?.viewOnceMessageV2?.message?.imageMessage;
    if(!msg) return null;
    // Build correct WA message object for download
    let dlMsg;
    if(mek.message?.imageMessage) dlMsg = mek;
    else if(mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) dlMsg = { message: mek.message.extendedTextMessage.contextInfo.quotedMessage, key: mek.key };
    else dlMsg = { message: { imageMessage: msg }, key: mek.key };
    return await conn.downloadMediaMessage(dlMsg);
  }catch{ return null; }
}
async function getQuotedAndCurrentBuffers(mek, conn){
  let quoted = null, current = null;
  try{
    const qMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if(qMsg) quoted = await conn.downloadMediaMessage({ message: { imageMessage: qMsg }, key: mek.key });
  }catch{}
  try{
    if(mek.message?.imageMessage) current = await conn.downloadMediaMessage(mek);
  }catch{}
  return { quoted, current };
}

cmd({
  pattern: "faceswap", alias: ["swapface","fswap","swap"], react: "🔄",
  desc: "AI Face Swap - 2 images", category: "progresstech ai",
  use: ".faceswap (reply face + send target) | .faceswap url1 | url2",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ = (q||"").trim();
    try{
      const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
      if(p1){ const j=JSON.parse(p1); if(j.id) rawQ=j.id; }
      const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      if(p2) rawQ=p2;
    }catch{}

    const ctx = { forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY🧑‍💻™ ✓' } };

    const hasImage = !!mek.message?.imageMessage || !!mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if((!rawQ || ['faceswap','menu'].includes(rawQ.toLowerCase())) && !hasImage){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const media=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=media.imageMessage; } }catch{}
      const menu=`┏━━〔 🔄 FaceSwap AI 〕━━┓\n┃ Swap faces between 2 photos\n┃\n┃ 1️⃣ Reply to face image, send\n┃ 2nd image with caption:\n┃ ${prefix}faceswap\n┃\n┃ 2️⃣ ${prefix}faceswap https://url1.jpg | https://url2.jpg\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{
        interactiveMessage:{
          header:{ title:"🔄 FaceSwap • Progress Tech", hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{}) },
          body:{text:menu}, footer:{text:BRAND},
          nativeFlowMessage:{ buttons:[{name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🔄 How to?",id:`${prefix}faceswap help`})},{name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}] }
        }, contextInfo:ctx
      },{});
    }

    await conn.sendMessage(from,{react:{text:"🔄",key:mek.key}}).catch(()=>{});

    let sourceUrl=null, targetUrl=null, sourceBuf=null, targetBuf=null;

    // URL mode
    if(rawQ.includes('http')){
      const urls = rawQ.match(/https?:\/\/\S+/g);
      if(urls && urls.length>=2){ sourceUrl=urls[0]; targetUrl=urls[1]; }
      else if(urls && urls.length===1){
        sourceUrl=urls[0];
        const { quoted, current } = await getQuotedAndCurrentBuffers(mek, conn);
        targetBuf = current || quoted;
        if(!targetBuf) targetUrl = null; // need second url but not found
        else sourceUrl = urls[0];
      }
    }

    // Image mode
    if(!sourceUrl || !targetUrl){
      const { quoted, current } = await getQuotedAndCurrentBuffers(mek, conn);
      if(quoted && current){ sourceBuf=quoted; targetBuf=current; }
      else if(current && !quoted){ // only one image sent with command
        return reply(`*❌ Need 2 images*\n1. Reply to 1st face image\n2. Send 2nd image with caption ${prefix}faceswap\n\nOr: ${prefix}faceswap https://url1.jpg | https://url2.jpg`);
      } else if(!current && quoted){
        return reply(`*❌ Send target image*\nYou replied to a face. Now send the 2nd image with caption ${prefix}faceswap`);
      }
    }

    if(!sourceUrl && !sourceBuf) return reply(`*❌ No source face found*`);
    if(!targetUrl && !targetBuf) return reply(`*❌ No target image found*`);

    await reply(`*🔄 Swapping faces...* This may take 10-20s`);

    let response;
    if(sourceUrl && targetUrl){
      // JSON url mode
      response = await axios.post(API, { source: sourceUrl, target: targetUrl, source_image: sourceUrl, target_image: targetUrl }, { timeout:120000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'}, responseType:'arraybuffer' });
    }else{
      // Buffer mode - correct keys for omegatech
      const form = new FormData();
      if(sourceBuf) form.append('source_image', sourceBuf, { filename:'source.jpg', contentType:'image/jpeg' });
      else if(sourceUrl) form.append('source_image', sourceUrl);
      if(targetBuf) form.append('target_image', targetBuf, { filename:'target.jpg', contentType:'image/jpeg' });
      else if(targetUrl) form.append('target_image', targetUrl);

      // also add generic keys for compatibility
      if(sourceBuf) form.append('source', sourceBuf, { filename:'source.jpg', contentType:'image/jpeg' });
      if(targetBuf) form.append('target', targetBuf, { filename:'target.jpg', contentType:'image/jpeg' });

      response = await axios.post(API, form, { timeout:120000, headers:{ ...form.getHeaders(), 'User-Agent':'Mozilla/5.0' }, responseType:'arraybuffer' });
    }

    const ct = response.headers['content-type']||'';
    let buf = Buffer.from(response.data);

    // If server returned JSON with url
    if(ct.includes('json') || buf.toString('utf8').trim().startsWith('{')){
      try{
        const json = JSON.parse(buf.toString('utf8'));
        const url = json.data?.url || json.url || json.data?.result || json.result || json.data?.image;
        if(url){
          await conn.sendMessage(from,{ image:{ url }, caption:`*✅ FaceSwapped*\n${BRAND}`, contextInfo:ctx }, {quoted:mek});
          await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
          return;
        }
        throw new Error(json.message||JSON.stringify(json).slice(0,400));
      }catch(e){ if(e.message.includes('http')) throw e; /* not json? continue */ }
    }

    if(buf.length < 1000) throw new Error('API returned empty image - faces not detected');

    await conn.sendMessage(from,{ image: buf, caption:`*✅ FaceSwapped Successfully*\n${BRAND}\n${CHANNEL_LINK}`, contextInfo:ctx }, {quoted:mek});
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});

  }catch(e){
    let msg=''; try{ if(e.response?.data) msg=Buffer.from(e.response.data).toString('utf8').slice(0,600); }catch{}
    console.error('FaceSwap Error:', msg||e.message);
    reply(`*❌ FaceSwap Failed*\n${msg||e.message}\n\nUse:\n${prefix}faceswap (reply to face + attach target)\n${prefix}faceswap https://url1 | https://url2`);
  }
});
