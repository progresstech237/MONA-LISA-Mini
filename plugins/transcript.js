const { cmd } = require('../redx');
const axios = require('axios');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';

async function uploadFileToCDN(buffer, filename){
  const uploaders=[
    { url:'https://tmpfiles.org/api/v1/upload', field:'file', parse:d=>d.data?.url || d.url },
    { url:'https://tmp.malvryx.dev/upload', field:'file', parse:d=>d.cdnUrl||d.directUrl||d.url||d.data?.url },
    { url:'https://file.io', field:'file', parse:d=>d.link }
  ];
  for(const u of uploaders){
    try{
      const form=new FormData();
      form.append(u.field, buffer, { filename: filename||`audio_${Date.now()}.mp3` });
      if(u.url.includes('malvryx')) form.append('type','permanent');
      const { data } = await axios.post(u.url, form, { headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, timeout:30000 });
      const link=u.parse(data);
      if(link && link.startsWith('http')) return link;
    }catch(e){ console.log('Uploader fail', u.url, e.message); }
  }
  return null;
}

async function transcribeAudio(audioUrl, scenario='auto'){
  const api=`https://api.omegatech.app/api/tools/audio-transcribe?audioUrl=${encodeURIComponent(audioUrl)}&scenario=${encodeURIComponent(scenario)}`;
  const { data } = await axios.get(api,{ timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
  if(!data.success &&!data.transcription) throw new Error(data.message||'Transcription failed');
  return data;
}

cmd({
  pattern: "transcribe", alias: ["transcript","voice2text"], react:"🎤",
  desc:"Transcribe audio/voice", category:"progresstech tools",
  use:".transcribe reply to audio |.transcribe <url> --scenario meeting",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let audioUrl=null, scenario='auto', text=(q||'').trim();
    const match=text.match(/--scenario\s+([^\s]+)/i);
    if(match){ scenario=match[1]; text=text.replace(/--scenario\s+[^\s]+/i,'').trim(); }

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };

    // Check quoted or own audio
    const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasQuotedAudio = !!(quotedMsg?.audioMessage || quotedMsg?.pttMessage || quotedMsg?.documentMessage);
    const hasOwnAudio = !!(mek.message?.audioMessage || mek.message?.pttMessage);

    if(hasQuotedAudio || hasOwnAudio){
      try{
        await conn.sendMessage(from,{react:{text:"📤",key:mek.key}}).catch(()=>{});
        reply(`*📤 Downloading audio...*`);
        let buffer;
        if(hasQuotedAudio){
          const msgObj = { message: quotedMsg, key: { id: mek.key.id } };
          // try different download methods for compatibility
          try{ buffer = await conn.downloadMediaMessage(msgObj); }catch{ buffer = await conn.downloadMediaMessage({ message:{ audioMessage: quotedMsg.audioMessage || quotedMsg.pttMessage } }); }
        }else{
          buffer = await conn.downloadMediaMessage(mek);
        }
        if(!buffer) throw new Error('Download empty');
        reply(`*📤 Uploading ${(buffer.length/1024).toFixed(1)}KB...*`);
        audioUrl = await uploadFileToCDN(buffer, `audio_${Date.now()}.mp3`);
        if(!audioUrl) throw new Error('Upload failed - try with direct URL');
      }catch(dlErr){
        return reply(`*❌ Download/upload failed*\n${dlErr.message}\nSend audio URL: ${prefix}transcribe https://...`);
      }
    }

    if(text && /^https?:\/\//.test(text)){
      audioUrl=text.split(' ')[0];
    }

    if(!audioUrl){
      return reply(`*🎤 AUDIO TRANSCRIPTION*\n\n*${prefix}transcribe* reply to voice note\n*${prefix}transcribe* https://example.com/audio.mp3\n*${prefix}transcribe* <url> --scenario meeting\n\n*Scenarios:* auto, meeting, interview, lecture\n\n${BRAND}`);
    }

    await conn.sendMessage(from,{react:{text:"⏳",key:mek.key}}).catch(()=>{});
    reply(`*⏳ Transcribing...*\n*🔊:* ${audioUrl.slice(0,60)}...\n*🎯:* ${scenario}\n\n_${BRAND}_`);

    const result = await transcribeAudio(audioUrl, scenario);
    const transcription=result.transcription||result.text||result.data?.transcription||'No transcription';
    const duration=result.durationMinutes||result.duration||'N/A';
    const lang=result.languageCode||result.language||'auto';
    const taskId=result.taskId||result.id||'N/A';

    let msg=`*✅ TRANSCRIPTION COMPLETE*\n\n`;
    msg+=`*🔊:* ${audioUrl}\n*🎯 Scenario:* ${scenario}\n*🌐 Language:* ${lang}\n*⏱️ Duration:* ${duration}m\n*📋 Task:* ${taskId}\n\n`;
    msg+=`*📝 Transcription:*\n${transcription}\n\n_${BRAND}_\n${CHANNEL_LINK}`;

    // chunk if long
    if(msg.length>3800){
      for(const chunk of msg.match(/.{1,3500}/gs)){
        await conn.sendMessage(from,{ text: chunk, contextInfo: ctx }, {quoted:mek});
      }
    }else{
      await conn.sendMessage(from,{ text: msg, contextInfo: ctx }, {quoted:mek});
    }

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Transcribe error:', e.response?.data||e.message);
    reply(`*❌ Transcribe Failed*\n${e.response?.data?.message || e.message}`);
  }
});
