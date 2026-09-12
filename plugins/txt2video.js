const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Txt2video';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "txt2video", alias: ["t2v","text2video"], react:"🎬",
  desc:"Text to video with ratio + voiceover", category:"progresstech ai",
  use:".txt2video a cat dancing |.txt2video 9:16 Mona Lisa singing with voiceover",
  filename:__filename
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

    if(!rawQ || ['txt2video','menu'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 🎬 Txt2Video AI 〕━━┓\n┃ Supports ratio + voiceover\n┃\n┃ ${prefix}txt2video a cat astronaut dancing\n┃ ${prefix}txt2video 16:9 futuristic city sunset\n┃ ${prefix}txt2video 9:16 Mona Lisa singing with voiceover\n┃ ${prefix}txt2video 1:1 omah lay concert\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🎬 Txt2Video",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎬 16:9",id:`${prefix}txt2video 16:9 cinematic futuristic city sunset`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"📱 9:16 Voiceover",id:`${prefix}txt2video 9:16 Mona Lisa afro girl dancing with voiceover`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🎬",key:mek.key}}).catch(()=>{});

    let prompt=rawQ, aspectRatio="16:9", voiceover=false;
    const arMatch=rawQ.match(/(16:9|9:16|1:1|4:3|21:9)/i);
    if(arMatch){ aspectRatio=arMatch[1]; prompt=rawQ.replace(arMatch[1],'').trim(); }
    if(/voiceover|with voice|voice over/i.test(rawQ)) voiceover=true;
    if(!prompt) prompt=rawQ.replace(/voiceover|with voice|voice over/gi,'').trim() || rawQ;

    reply(`*🎬 Generating...*\n*Prompt:* ${prompt.slice(0,100)}\n*Ratio:* ${aspectRatio}\n*Voiceover:* ${voiceover?'Yes':'No'}\n\n_Wait 30-90s..._\n_${BRAND}_`);

    let videoUrl=null;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    try{
      const { data } = await axios.post(API, { prompt, aspect_ratio: aspectRatio, voiceover }, { timeout:180000, headers });
      videoUrl=data?.data?.url || data?.data?.video_url || data?.url || data?.video_url || data?.data?.link || data?.data?.result;
      if(!videoUrl && typeof data?.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
    }catch(e){ console.log('T2V POST fail', e.response?.data||e.message); }

    if(!videoUrl){
      try{
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspectRatio)}&voiceover=${voiceover}`, { timeout:180000, headers:{'User-Agent':'Mozilla/5.0'} });
        videoUrl=data?.data?.url || data?.url || data?.data?.video_url || data?.data?.result;
        if(!videoUrl && typeof data?.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
      }catch{}
    }

    if(!videoUrl) throw new Error('No video URL - API busy');

    await conn.sendMessage(from,{
      video:{ url: videoUrl },
      caption:`*✅ Video Generated*\n*Prompt:* ${prompt}\n*Ratio:* ${aspectRatio}\n*Voiceover:* ${voiceover?'Yes':'No'}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
      contextInfo:ctx
    },{quoted:mek});
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Txt2Video Error:', e.response?.data||e.message);
    reply(`*❌ Txt2Video Failed*\n${e.response?.data?.message || e.message}\nTry: .txt2video a cat dancing`);
  }
});
