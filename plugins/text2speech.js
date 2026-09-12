const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/text2speech-v3';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "tts2", alias: ["ttsv3","speak","voice","tts","text2speech"], react:"🎙️",
  desc:"TTS v3 Live3D AI - 6 voices", category:"progresstech ai",
  use:".tts2 hello |.tts2 woman2|hello |.tts2 man1|I love you",
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
    const validVoices=['woman1','woman2','woman3','man1','man2','man3'];

    if(!rawQ || ['help','tts3','tts2'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 🎙️ TTS v3 - Live3D AI 〕━━┓\n┃ 6 voices: woman1-3, man1-3\n┃\n┃ ${prefix}tts2 hello world\n┃ ${prefix}tts2 woman2|Hello my love\n┃ ${prefix}tts2 man1|Progress Tech best\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🎙️ TTS v3 • Live3D AI",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"👩 Woman1",id:`${prefix}tts2 woman1|Hello, I am woman1 voice from Progress Tech`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"👩 Woman2",id:`${prefix}tts2 woman2|Hello, I am woman2 voice test`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"👨 Man1",id:`${prefix}tts2 man1|Hello, I am man1 voice`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🎙️",key:mek.key}}).catch(()=>{});
    let voice="woman1", text=rawQ;

    if(rawQ.includes('|')){
      const parts=rawQ.split('|');
      const maybe=parts[0].trim().toLowerCase();
      if(validVoices.includes(maybe)){ voice=maybe; text=parts.slice(1).join('|').trim(); }
    }else{
      const first=rawQ.split(' ')[0].toLowerCase();
      if(validVoices.includes(first)){ voice=first; text=rawQ.slice(first.length).trim(); }
    }
    if(!text) return reply(`*❌ No text*\n${prefix}tts2 woman1|Hello world`);

    reply(`*🎙️ Generating...*\n*Voice:* ${voice}\n*Text:* ${text.slice(0,80)}\n\n_${BRAND}_`);

    let audioUrl=null;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    try{
      const { data } = await axios.post(API, { text, voice, language:"English" }, { timeout:60000, headers });
      audioUrl=data?.data?.url || data?.data?.audio_url || data?.url || data?.audio_url || data?.data?.link || data?.data?.audio;
      if(!audioUrl && typeof data?.data==='string' && data.data.startsWith('http')) audioUrl=data.data;
    }catch(e){ console.log('TTS POST fail', e.response?.data||e.message); }

    if(!audioUrl){
      try{
        const { data } = await axios.get(`${API}?text=${encodeURIComponent(text)}&voice=${voice}&language=English`, { timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
        audioUrl=data?.data?.url || data?.url || data?.data?.audio_url || data?.audio_url || data?.data?.audio;
        if(!audioUrl && typeof data?.data==='string' && data.data.startsWith('http')) audioUrl=data.data;
        if(!audioUrl && typeof data==='string' && data.startsWith('http')) audioUrl=data;
      }catch{}
    }

    if(!audioUrl) throw new Error('No audio URL returned');

    // Send ONE voice note (ptt true) - best UX
    await conn.sendMessage(from,{
      audio:{ url: audioUrl }, mimetype:'audio/mpeg', ptt:true, contextInfo:ctx
    },{quoted:mek});

    await conn.sendMessage(from,{
      text:`*✅ TTS Generated*\n*Voice:* ${voice}\n*Text:* ${text}\n*URL:* ${audioUrl}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
      contextInfo:ctx
    },{quoted:mek});

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('TTS v3 Error:', e.response?.data||e.message);
    reply(`*❌ TTS Failed*\n${e.response?.data?.message || e.message}`);
  }
});
