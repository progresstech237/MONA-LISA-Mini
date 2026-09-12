const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Veo3-v3';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "veo4", alias: ["veo","veo3v3"], react: "🎥",
  desc: "Veo3 v3 - Google text to video", category: "progresstech ai",
  use: ".veo4 a cat dancing",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    try{
      const p=JSON.parse(mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson||'{}');
      if(p.id) rawQ=p.id.replace(prefix,"").trim();
      const r=mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      if(r) rawQ=r.replace(prefix,"").trim();
    }catch{}
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`,'i'),'').trim();

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };

    if(!rawQ || ['veo4','menu'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 🎥 Veo3 v3 - Google 〕━━┓\n┃ Text to video via veo3.ai\n┃ ${prefix}veo4 a cat astronaut dancing in space\n┃ ${prefix}veo4 Mona Lisa afro girl singing, sunset 4k\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🎥 Veo3 v3 • Google",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎬 Mona Lisa",id:`${prefix}veo4 cinematic Mona Lisa afro girl singing in Paris at sunset 4k`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🐱 Cat Astronaut",id:`${prefix}veo4 a cute cat astronaut dancing zero gravity cinematic 4k`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🎥",key:mek.key}}).catch(()=>{});
    reply(`*🎥 Veo3 Generating...*\n*Prompt:* ${rawQ.slice(0,120)}\n_Wait 30-90s..._\n\n_${BRAND}_`);

    let videoUrl=null;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    try{
      const { data } = await axios.post(API, { prompt: rawQ }, { timeout:180000, headers });
      videoUrl=data?.data?.url || data?.data?.video_url || data?.url || data?.video_url || data?.data?.result || data?.result || data?.link;
      if(!videoUrl && typeof data?.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
      if(!videoUrl && typeof data==='string' && data.startsWith('http')) videoUrl=data;
    }catch(e){ console.log('Veo3 POST fail', e.response?.data||e.message); }

    if(!videoUrl){
      try{
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}`, { timeout:180000, headers:{'User-Agent':'Mozilla/5.0'} });
        videoUrl=data?.data?.url || data?.url || data?.data?.video_url || data?.data?.result || data?.result;
        if(!videoUrl && typeof data?.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
      }catch(e){ console.log('Veo3 GET fail', e.message); }
    }

    if(!videoUrl) throw new Error('No video URL returned - API busy, try again');

    await conn.sendMessage(from,{
      video:{ url: videoUrl },
      caption:`*✅ Veo3 Video Generated*\n*Prompt:* ${rawQ}\n*Model:* Veo3-v3 (Google)\n\n*${BRAND}*\n${CHANNEL_LINK}`,
      contextInfo:ctx
    },{quoted:mek});
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Veo3 Error:', e.response?.data||e.message);
    reply(`*❌ Veo3 Failed*\n${e.response?.data?.message || e.message}\nTry: .veo4 a cat dancing`);
  }
});
