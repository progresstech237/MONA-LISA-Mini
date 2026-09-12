const { cmd } = require('../redx');
const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/grok-3-video';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

async function getImageBuffer(mek){
  try{
    let msg=mek.message?.imageMessage? mek : mek.message?.extendedTextMessage?.contextInfo?.quotedMessage? { message: mek.message.extendedTextMessage.contextInfo.quotedMessage } : null;
    if(!msg) return null;
    let m=msg.message||msg;
    let type=Object.keys(m)[0]; let content=m[type];
    if(type==='viewOnceMessageV2'||type==='viewOnceMessage'){ content=content.message; type=Object.keys(content)[0]; content=content[type]; }
    if(!type.includes('image')) return null;
    const stream=await downloadContentFromMessage(content, 'image');
    let buf=Buffer.from([]);
    for await(const c of stream) buf=Buffer.concat([buf,c]);
    return buf;
  }catch{ return null; }
}

cmd({
  pattern: "grokvideo", alias: ["grok3video","grokv","grok3"], react:"🤖",
  desc:"Grok-3 Video - img2vid & txt2vid", category:"progresstech ai",
  use:".grokvideo a cat dancing |.grokvideo 9:16 prompt (reply image)",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`,'i'),'').trim();
    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };

    let imageBuffer=await getImageBuffer(mek);
    const hasImage=!!imageBuffer;

    if(!rawQ || ['help','grok'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const grok=`┏━━〔 🤖 Grok-3 Video 〕━━┓\n┃ Text & Image to Video\n┃ Ratios: 16:9 9:16 1:1\n┃\n┃ ${prefix}grokvideo a cat dancing\n┃ ${prefix}grokvideo 16:9 cinematic city\n┃ ${prefix}grokvideo 9:16 afro dance\n┃ Reply image + ${prefix}grokvideo make it dance\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🤖 Grok-3 Video",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🤖 16:9 Landscape",id:`${prefix}grokvideo 16:9 cinematic drone futuristic city sunset`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"📱 9:16 Portrait",id:`${prefix}grokvideo 9:16 afro girl dancing cinematic`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{ react:{ text:hasImage?"🖼️":"🤖", key:mek.key } }).catch(()=>{});
    let prompt=rawQ, aspectRatio="16:9";
    const arMatch=rawQ.match(/(16:9|9:16|1:1)/i);
    if(arMatch){ aspectRatio=arMatch[1]; prompt=rawQ.replace(arMatch[1],'').trim(); }
    if(!prompt && hasImage) prompt="animate this image, cinematic motion, 4k";
    if(!prompt) prompt=rawQ;

    reply(`*🤖 Grok-3 Generating...*\n*Mode:* ${hasImage?'Image to Video':'Text to Video'}\n*Prompt:* ${prompt.slice(0,120)}\n*Ratio:* ${aspectRatio}\n_Wait 30-90s..._\n_${BRAND}_`);

    let videoUrl=null;

    if(hasImage){
      try{
        const form=new FormData();
        form.append('image', imageBuffer, { filename:'input.jpg', contentType:'image/jpeg' });
        form.append('prompt', prompt);
        form.append('aspect_ratio', aspectRatio);
        const { data } = await axios.post(API, form, { timeout:180000, headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'} });
        videoUrl=data.data?.url||data.data?.video_url||data.url||data.video_url||data.data?.result;
        if(!videoUrl && typeof data.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
      }catch(e){ console.log('img POST fail', e.message); }
    }

    if(!videoUrl){
      try{
        const { data } = await axios.post(API, { prompt, aspect_ratio: aspectRatio }, { timeout:180000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'} });
        videoUrl=data.data?.url||data.data?.video_url||data.url||data.video_url||data.data?.result;
        if(!videoUrl && typeof data.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
      }catch(e){ console.log('txt POST fail', e.message); }
    }

    if(!videoUrl){
      try{
        const { data } = await axios.get(API, { params:{ prompt, aspect_ratio: aspectRatio }, timeout:180000, headers:{'User-Agent':'Mozilla/5.0'} });
        videoUrl=data.data?.url||data.data?.video_url||data.url||data.video_url;
      }catch{}
    }

    if(!videoUrl) throw new Error('No video URL from Grok-3 API');

    await conn.sendMessage(from,{ video:{ url:videoUrl }, caption:`*✅ Grok-3 Video*\n*Prompt:* ${prompt}\n*Mode:* ${hasImage?'Img2Vid':'Txt2Vid'}\n*Ratio:* ${aspectRatio}\n*${BRAND}*`, contextInfo:ctx },{quoted:mek});
    await conn.sendMessage(from,{ react:{ text:"✅", key:mek.key } }).catch(()=>{});
  }catch(e){
    console.error('Grok-3 Error:', e.response?.data||e.message);
    reply(`*❌ Grok-3 Failed*\n${e.response?.data?.message||e.message}\nTry:.grokvideo a cat dancing`);
  }
});
