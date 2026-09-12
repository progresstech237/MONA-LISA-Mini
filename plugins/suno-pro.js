const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/sonu-pro';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "sonu4", alias: ["sonupro2","chatmusic","musicpro","sonu"], react:"🎵",
  desc:"ChatMusicPro - 3min AI music", category:"progresstech ai",
  use:".sonu4 <prompt> | <lyrics> |.sonu4 instrumental",
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

    if(!rawQ || ['help','menu','sunopro'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 🎵 Sonu Pro - 3 Min 〕━━┓\n┃ Generate AI music up to 3 mins\n┃ Use v4 + Verse+Chorus+Verse for 3min\n┃\n┃ ${prefix}sonu4 afrobeat omah lay | [Verse] Mona Lisa...\n┃ ${prefix}sonu4 instrumental; afro soul guitar chill\n┃ ${prefix}sonu4 v4.5; omah lay | Verse1 Chorus Verse2\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🎵 Sonu Pro • 3 Min Music",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎤 Mona Lisa 3min",id:`${prefix}sonu4 afrobeat omah lay 102 BPM romantic | [Verse 1] Oh Mona Lisa why you fine like that [Chorus] Mona Lisa you dey make me lose control [Verse 2] Body like sculpture face like art`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎹 Instrumental",id:`${prefix}sonu4 instrumental; afro soul chill guitar log drums 102 BPM`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🎧",key:mek.key}}).catch(()=>{});

    let prompt=rawQ, lyrics="", model="v4", instrumental=false;
    if(/instrumental/i.test(rawQ)) instrumental=true;
    if(/v4\.5/i.test(rawQ)){ model="v4.5"; rawQ=rawQ.replace(/v4\.5/gi,'').trim(); }
    else if(/v4/i.test(rawQ)){ model="v4"; rawQ=rawQ.replace(/v4/gi,'').trim(); }
    else if(/v3\.5/i.test(rawQ)){ model="v3.5"; }

    if(rawQ.includes('|')){ const p=rawQ.split('|'); prompt=p[0].trim(); lyrics=p.slice(1).join('|').trim(); }
    else if(rawQ.includes(';') &&!instrumental){ const p=rawQ.split(';'); prompt=p[0].trim(); lyrics=p.slice(1).join(';').trim(); }

    if(!lyrics &&!instrumental && prompt.length<20){ lyrics=prompt; prompt="afrobeat omah lay vibe romantic 102 BPM"; }

    reply(`*🎵 Generating Sonu-Pro [${model}]...*\n*Prompt:* ${prompt.slice(0,100)}\n*Lyrics:* ${lyrics.slice(0,80)||'Instrumental'}\n_Wait 40-90s for 3min..._\n_${BRAND}_`);

    let audioUrl=null, title="Sonu Pro Track", duration="3:00";
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    try{
      const { data } = await axios.post(API, { prompt, lyrics, instrumental, model }, { timeout:180000, headers });
      audioUrl=data?.data?.audio_url || data?.data?.url || data?.audio_url || data?.url || data?.data?.link || data?.data?.audio;
      title=data?.data?.title||data?.title||title;
      duration=data?.data?.duration||data?.duration||duration;
      if(!audioUrl && typeof data?.data==='string' && data.data.startsWith('http')) audioUrl=data.data;
      if(!audioUrl && typeof data==='string' && data.startsWith('http')) audioUrl=data;
    }catch(e){ console.log('Sonu POST fail', e.response?.data||e.message); }

    if(!audioUrl){
      try{
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(prompt)}&lyrics=${encodeURIComponent(lyrics)}&instrumental=${instrumental}&model=${model}`, { timeout:180000, headers:{'User-Agent':'Mozilla/5.0'} });
        audioUrl=data?.data?.audio_url || data?.audio_url || data?.data?.url || data?.url;
        title=data?.data?.title||title;
      }catch{}
    }

    if(!audioUrl) throw new Error('No audio returned - try shorter lyrics or instrumental');

    await conn.sendMessage(from,{ audio:{ url: audioUrl }, mimetype:'audio/mpeg', ptt:false, contextInfo:ctx }, {quoted:mek});
    await conn.sendMessage(from,{ text:`*✅ Music Generated - ${duration}*\n*🎵 Title:* ${title}\n*Model:* ${model}\n*Prompt:* ${prompt}\n${lyrics? `*Lyrics:* ${lyrics.slice(0,300)}\n`:''}\n*${BRAND}*\n${CHANNEL_LINK}`, contextInfo:ctx }, {quoted:mek});
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Sonu-Pro Error:', e.response?.data||e.message);
    reply(`*❌ Sonu-Pro Failed*\n${e.response?.data?.message || e.message}\nTip: Use v4 + full Verse/Chorus/Verse for 3 mins`);
  }
});
