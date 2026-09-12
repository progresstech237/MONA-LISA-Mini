const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/tools/wink-Video-enhancer';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "winken", alias: ["wink","enhancevideo"], react: "✨",
  desc: "Enhance video 2k/4k with polling", category: "progresstech tools",
  use: ".winken reply to video",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasVideoQuoted = !!(quoted?.videoMessage || quoted?.documentMessage);
    const isVideoMsg = !!(mek.message?.videoMessage);

    if(!hasVideoQuoted && !isVideoMsg){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 ✨ Wink Enhancer V2 〕━━┓\n┃ Enhance & Unblur 2k/4k\n┃ Reply to video: ${prefix}winken\n┃ ${prefix}winken 2k / 4k\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"✨ Wink Enhancer",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"✨ 2k",id:`${prefix}winken 2k`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"✨ 4k",id:`${prefix}winken 4k`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"✨",key:mek.key}}).catch(()=>{});
    let quality = rawQ.toLowerCase().includes('4k')? '4k' : '2k';

    // Download
    let buffer;
    try{
      if(hasVideoQuoted){
        buffer = await conn.downloadMediaMessage({ message: quoted, key: mek.key });
      }else{
        buffer = await conn.downloadMediaMessage(mek);
      }
    }catch(e){ return reply(`❌ Download failed: ${e.message}\nReply to video`); }
    if(!buffer) return reply(`❌ Download failed - buffer empty`);

    const tmpDir='./tmp'; if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir,{recursive:true});
    const videoPath=path.join(tmpDir, `wink_${Date.now()}.mp4`);
    fs.writeFileSync(videoPath, buffer);
    const sizeMB=(buffer.length/1024/1024).toFixed(2);

    let statusMsg = await conn.sendMessage(from,{ text:`*✨ Enhancing to ${quality.toUpperCase()}...*\n📁 ${sizeMB} MB\n⏳ Uploading...\n[░░░░░░░░░░] 0%\n\n_${BRAND}_`, contextInfo:ctx }, {quoted:mek});

    let enhancedUrl=null, jobId=null, resultData=null;

    try{
      const form = new FormData();
      form.append('video', fs.createReadStream(videoPath), { filename:`video_${Date.now()}.mp4`, contentType:'video/mp4' });
      form.append('quality', quality);
      form.append('resolution', quality);

      const { data } = await axios.post(API, form, {
        timeout:300000,
        headers:{ ...form.getHeaders(), 'User-Agent':'Mozilla/5.0' },
        maxContentLength:Infinity, maxBodyLength:Infinity
      });

      resultData=data?.data || data;
      enhancedUrl=resultData.url || resultData.video_url || resultData.enhanced_url || resultData.result || resultData.link || resultData.download_url || data.url;
      jobId=resultData.job_id || resultData.jobId || resultData.task_id || resultData.id || null;
      if(!enhancedUrl && typeof resultData==='string' && resultData.startsWith('http')) enhancedUrl=resultData;

      // Poll if jobId
      if(jobId && !enhancedUrl){
        let attempts=0, max=60;
        while(attempts<max && !enhancedUrl){
          attempts++;
          const pct=Math.min(10+attempts*1.5,95);
          const bar='█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));
          try{
            await conn.sendMessage(from,{ text:`*✨ Enhancing ${quality.toUpperCase()}...*\n📁 ${sizeMB} MB\n🆔 ${jobId}\n[${bar}] ${pct.toFixed(0)}% - ${attempts}/${max}\n\n_${BRAND}_`, contextInfo:ctx }, {quoted:mek});
          }catch{}
          await new Promise(r=>setTimeout(r,5000));
          try{
            const checkUrls=[ `${API}?job_id=${jobId}`, `https://api.omegatech.app/api/tools/wink-status?job_id=${jobId}` ];
            for(const u of checkUrls){
              try{
                const { data: sd } = await axios.get(u,{ timeout:15000, headers:{'User-Agent':'Mozilla/5.0'} });
                const d=sd.data||sd;
                const maybe=d.url||d.video_url||d.enhanced_url||d.result;
                if(maybe){ enhancedUrl=maybe; resultData=d; break; }
                if(d.status==='completed') { enhancedUrl=maybe; if(enhancedUrl) break; }
              }catch{}
            }
          }catch{}
        }
      }
    }finally{
      try{ if(fs.existsSync(videoPath)) fs.unlinkSync(videoPath); }catch{}
    }

    if(!enhancedUrl) throw new Error(`No URL after polling. Last: ${JSON.stringify(resultData).slice(0,800)}`);

    await conn.sendMessage(from,{ text:`*✨ [██████████] 100% Done!*\nDownloading...` }, {quoted:mek}).catch(()=>{});

    await conn.sendMessage(from,{
      video:{ url: enhancedUrl },
      caption:`*✅ Enhanced to ${quality.toUpperCase()}*\n${BRAND}`,
      contextInfo:ctx
    },{quoted:mek});

    await conn.sendMessage(from,{
      document:{ url: enhancedUrl },
      mimetype:'video/mp4',
      fileName:`Enhanced_${quality}_${Date.now()}.mp4`,
      contextInfo:ctx
    },{quoted:mek}).catch(()=>{});

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Wink Error:', e.response?.data||e.message);
    reply(`*❌ Wink Failed*\n${e.message}`);
  }
});
