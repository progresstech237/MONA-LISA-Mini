const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';
const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';

let dlCache = {};

async function prepareImage(conn, url){
  try{
    const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
    const resp = await axios.get(url||CLOUDINARY_IMAGE, { responseType:'arraybuffer', headers:{'User-Agent':'Mozilla/5.0'} });
    const media = await prepareWAMessageMedia({ image: Buffer.from(resp.data) }, { upload: conn.waUploadToServer });
    return media.imageMessage;
  }catch{ return null; }
}

async function sendInteractiveMedia(conn, chatId, result, sender, prefix){
  try{
    dlCache[sender] = { result, timestamp: Date.now() };
    const source=result.source||'Unknown', title=result.title||'Untitled', author=result.author||'Unknown', thumb=result.thumbnail||result.thumb||CLOUDINARY_IMAGE;
    const duration=result.duration||'N/A';
    const imageMessage=await prepareImage(conn, thumb);
    const videos=result.videos||[], audios=result.audios||[], photos=result.photos||[];

    const buttons=[];
    if(videos.length){
      const rows=videos.map((v,i)=>({ id:`${prefix}dl video ${i}`, title:`Video ${v.quality||i+1}`, description:`${v.quality||'HD'}` }));
      buttons.push({ name:"single_select", buttonParamsJson:JSON.stringify({ title:"🎬 Video", sections:[{ title:`Select Video (${videos.length})`, highlight_label:"📹", rows }] }) });
    }
    if(audios.length){
      const rows=audios.map((a,i)=>({ id:`${prefix}dl audio ${i}`, title:`Audio ${i+1}`, description:`${a.format||a.quality||'mp3'}` }));
      buttons.push({ name:"single_select", buttonParamsJson:JSON.stringify({ title:"🎵 Audio", sections:[{ title:`Select Audio (${audios.length})`, highlight_label:"🎵", rows }] }) });
    }
    if(photos.length){
      const rows=photos.map((p,i)=>({ id:`${prefix}dl photo ${i}`, title:`Photo ${i+1}`, description:`HD` }));
      buttons.push({ name:"single_select", buttonParamsJson:JSON.stringify({ title:"🖼️ Photos", sections:[{ title:`Select Photo (${photos.length})`, highlight_label:"🖼️", rows }] }) });
    }
    if((videos.length+audios.length+photos.length)>1){
      buttons.push({ name:"single_select", buttonParamsJson:JSON.stringify({ title:"📦 All", sections:[{ title:"All Media", highlight_label:"📦", rows:[{ id:`${prefix}dl all`, title:"Download All", description:`${videos.length+audios.length+photos.length} files` }] }] }) });
    }
    buttons.push({ name:"cta_url", buttonParamsJson:JSON.stringify({ display_text:"📢 Follow TECH TOY", url:CHANNEL_LINK }) });

    let body=`*📥 Media Found*\n━━━━━━━━━━━━\n*🎬 Title:* ${title}\n*👤 Author:* ${author}\n*📹 Source:* ${source}\n*⏱️ Duration:* ${duration}\n━━━━━━━━━━━━\n`;
    if(videos.length) body+=` 🎬 ${videos.length} video(s)\n`;
    if(audios.length) body+=` 🎵 ${audios.length} audio(s)\n`;
    if(photos.length) body+=` 🖼️ ${photos.length} photo(s)\n`;
    body+=`\n*Select below to download.*`;

    await conn.relayMessage(chatId,{
      interactiveMessage:{
        header:{ title:`📥 ${source}`, hasMediaAttachment:!!imageMessage,...(imageMessage?{imageMessage}:{}) },
        body:{ text: body }, footer:{ text:"🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓" },
        nativeFlowMessage:{ buttons }
      }
    },{});
    return true;
  }catch(e){ console.error('Interactive error',e); return false; }
}

async function sendMediaFile(conn, chatId, url, type, title, author, source){
  try{
    const caption=`*📥 ${title}*\n*👤 ${author}*\n*🔹 ${source}*\n*📢 ${CHANNEL_LINK}*`;
    const contextInfo={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:142, newsletterName:'🥷TECH TOY™ ✓' } };
    if(type==='video') await conn.sendMessage(chatId,{ video:{ url }, caption, contextInfo });
    else if(type==='audio') await conn.sendMessage(chatId,{ audio:{ url }, mimetype:'audio/mpeg', fileName:`${title}.mp3`, contextInfo });
    else if(type==='photo') await conn.sendMessage(chatId,{ image:{ url }, caption, contextInfo });
    return true;
  }catch(e){ console.error(e); return false; }
}

cmd({
  pattern: "dl", alias: ["download","yt","ig","fb","tt","tiktok"], react:"📥",
  desc:"Download from any platform", category:"downloader",
  use:".dl <url> |.dl video 0",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    if(!q) return reply(`*📥 UNIVERSAL DOWNLOADER*\n\n*${prefix}dl <url>*\nSupports TikTok, IG, YT, FB, Twitter, Snap, Bilibili\n\n${CHANNEL_LINK}`);

    const parts=q.split(' '), sub=parts[0]?.toLowerCase()||'';
    const cacheData=dlCache[m.sender] || dlCache[from];

    if(['video','audio','photo'].includes(sub) && parts[1]!==undefined){
      if(!cacheData?.result) return reply(`*⚠️ No media cache. Send URL again.*`);
      const idx=parseInt(parts[1]);
      const list = sub==='video'? cacheData.result.videos||[] : sub==='audio'? cacheData.result.audios||[] : cacheData.result.photos||[];
      if(idx>=list.length) return reply(`*❌ Invalid ${sub} selection.*`);
      const sel=list[idx]; const url=sel.url||sel;
      await sendMediaFile(conn, from, url, sub, cacheData.result.title, cacheData.result.author, cacheData.result.source);
      return;
    }
    if(sub==='all'){
      if(!cacheData?.result) return reply(`*⚠️ No cache.*`);
      const r=cacheData.result; let sent=0;
      for(const v of r.videos||[]) if(await sendMediaFile(conn,from,v.url,'video',r.title,r.author,r.source)) sent++;
      for(const a of r.audios||[]) if(await sendMediaFile(conn,from,a.url,'audio',r.title,r.author,r.source)) sent++;
      for(const p of r.photos||[]){ const u=p.url||p; if(await sendMediaFile(conn,from,u,'photo',r.title,r.author,r.source)) sent++; }
      return reply(sent? `*✅ Sent ${sent} files.*` : `*❌ Failed*`);
    }

    const urlMatch=q.match(/(https?:\/\/[^\s]+)/i);
    if(!urlMatch) return reply(`*❌ Invalid URL.*`);
    const url=urlMatch[0];

    await conn.sendMessage(from,{react:{text:"⏳",key:mek.key}}).catch(()=>{});
    reply(`*⏳ Fetching from: ${url.slice(0,60)}...*`);

    const apiUrl=`https://api.omegatech.app/api/download/All-downloader-v2?action=download&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl,{ timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });

    if(!data.success &&!data.data) return reply(`*❌ Failed to download. Try again.*`);
    const result=data.data||data;
    const v=result.videos||[], a=result.audios||[], p=result.photos||[];

    if(v.length===0 && a.length===0 && p.length===0) return reply(`*✅ Found*\n*Title:* ${result.title||'Untitled'}\nBut no downloadable media`);

    await sendInteractiveMedia(conn, from, result, m.sender, prefix);
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Download error:', e.response?.data||e.message);
    reply(`*❌ Error: ${e.message}*`);
  }
});
