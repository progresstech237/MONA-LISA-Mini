const { cmd } = require('../redx');
const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const BASE = "https://omegatech-api.dixonomega.tech";

async function OmegatechGet(path, params){
  const { data } = await axios.get(BASE+path,{ params, timeout:180000, headers:{'User-Agent':'Mozilla/5.0'} });
  return data;
}
async function getBufferFromMsg(quoted){
  let msg=quoted; if(msg.msg) msg=msg.msg; if(msg.message) msg=msg.message;
  let type=Object.keys(msg)[0]; let content=msg[type];
  if(type==='viewOnceMessageV2'||type==='viewOnceMessage'){ content=content.message; type=Object.keys(content)[0]; content=content[type]; }
  let mediaType=type.replace('Message','');
  if(['image','video','audio','sticker','document'].includes(mediaType)){} else mediaType='image';
  const stream=await downloadContentFromMessage(content, mediaType);
  let buffer=Buffer.from([]);
  for await(const chunk of stream) buffer=Buffer.concat([buffer,chunk]);
  return buffer;
}

// ── AI ──
cmd({ pattern:"suno3", alias:["sonu3"], react:"🎵", desc:"Suno3 music", category:"progresstech ai", use:".suno3 happy afrobeat", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Example:.suno3 happy afrobeat love song_*");
    reply(`*_🎵 SUNO3 Generating: ${q}..._*`);
    const res=await OmegatechGet("/api/ai/sonu3",{ prompt:q, action:"full" });
    const d=res.data||res; const audio=d.audio_url||d.url||d.data?.audio_url;
    const title=d.title||q, lyrics=d.lyrics||"", thumb=d.thumbnail||d.image_url, dur=d.duration||"";
    if(audio){
      await conn.sendMessage(from,{ audio:{ url:audio }, mimetype:"audio/mpeg", ptt:false },{quoted:mek});
      if(thumb) await conn.sendMessage(from,{ image:{ url:thumb }, caption:`*🎵 ${title}*\n*Duration:* ${dur}\n*Prompt:* ${q}\n\n*Lyrics:*\n${lyrics.slice(0,1000)}` },{quoted:mek});
    }else reply(JSON.stringify(res).slice(0,4000));
  }catch(e){ reply(`*❌ SUNO3 Error:* ${e.response?.data?.message||e.message}`); }
});

cmd({ pattern:"veo3", react:"🎬", desc:"Veo3 video", category:"progresstech ai", use:".veo3 cow in city", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Prompt needed_*");
    reply(`*_🎬 VEO3: ${q}..._*`);
    const res=await OmegatechGet("/api/ai/veo3",{ prompt:q, action:"full" });
    const d=res.data||res; const url=d.video_url||d.url;
    if(url) await conn.sendMessage(from,{ video:{ url }, caption:`*🎬 VEO3: ${q}*` },{quoted:mek});
    else reply(JSON.stringify(res).slice(0,4000));
  }catch(e){ reply(`*❌ VEO3 Error:* ${e.message}`); }
});

cmd({ pattern:"aivideo", alias:["ai-video"], react:"📹", desc:"Ai Video", category:"progresstech ai", use:".aivideo cat dancing", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Prompt needed_*");
    reply(`*_📹 AI-VID: ${q}_*`);
    const res=await OmegatechGet("/api/ai/Ai-video",{ prompt:q });
    const d=res.data||res; const url=d.url||d.video_url;
    if(url) await conn.sendMessage(from,{ video:{ url }, caption:`*${q}*` },{quoted:mek});
    else reply(JSON.stringify(res).slice(0,4000));
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern:"ttsx", alias:["elevenlabs"], react:"🗣️", desc:"TTS", category:"progresstech ai", use:".ttsx Hello", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Text needed_*");
    const res=await OmegatechGet("/api/ai/elevenlabs",{ text:q });
    const d=res.data||res; const url=d.audio_url||d.url||d.audio;
    if(url) await conn.sendMessage(from,{ audio:{ url }, mimetype:"audio/mpeg", ptt:true },{quoted:mek});
    else reply(JSON.stringify(res).slice(0,4000));
  }catch(e){ reply(`*❌ TTS Error:* ${e.message}`); }
});

cmd({ pattern:"grokvideo", alias:["grok3video"], react:"🤖", desc:"Grok video", category:"progresstech ai", use:".grokvideo prompt", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Prompt needed_*");
    reply(`*_🤖 GROK VIDEO: ${q}_*`);
    const res=await OmegatechGet("/api/ai/grok-3-video",{ prompt:q });
    const d=res.data||res; const url=d.url||d.video_url;
    if(url) await conn.sendMessage(from,{ video:{ url }, caption:q },{quoted:mek});
    else reply(JSON.stringify(res).slice(0,4000));
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

// ── TOOLS ──
cmd({ pattern:"appmaker", alias:["web2apk"], react:"📱", desc:"Website to App", category:"hacking tools", use:".appmaker https://google.com", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_URL needed_*");
    const res=await OmegatechGet("/api/tools/appmaker",{ url:q });
    const d=res.data||res; reply(`*📱 APPMAKER*\n*URL:* ${q}\n*Download:* ${d.url||d.download_url||d.apk||JSON.stringify(d).slice(0,2000)}`);
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern:"ssweb", react:"🌐", desc:"Screenshot web", category:"hacking tools", use:".ssweb https://google.com", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_URL needed_*");
    const res=await OmegatechGet("/api/tools/ssweb",{ url:q });
    const d=res.data||res; const img=d.url||d.screenshot||d.image;
    if(img) await conn.sendMessage(from,{ image:{ url:img }, caption:`*🌐 SSWEB: ${q}*` },{quoted:mek});
    else reply(JSON.stringify(res).slice(0,3000));
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern:"webtozip", react:"📦", desc:"Web to Zip", category:"hacking tools", use:".webtozip https://example.com", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_URL needed_*");
    const res=await OmegatechGet("/api/tools/webtozip",{ url:q });
    const d=res.data||res; reply(`*📦 WEBTOZIP*\n*Link:* ${d.url||d.download_url||JSON.stringify(d).slice(0,3000)}`);
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern:"wallpaper", react:"🖼️", desc:"Wallpaper", category:"hacking tools", use:".wallpaper Naruto", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Query:.wallpaper anime_*");
    const res=await OmegatechGet("/api/tools/wallpaper",{ query:q });
    const d=res.data||res; let url=Array.isArray(d)? d[0]?.url : d.url||d.image;
    if(Array.isArray(res.data)) url=res.data[0]?.url||res.data[0]?.image_url;
    if(url) await conn.sendMessage(from,{ image:{ url }, caption:`*🖼️ Wallpaper: ${q}*` },{quoted:mek});
    else reply(JSON.stringify(res).slice(0,3000));
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern:"tempnumber", alias:["get-number"], react:"📞", desc:"Temp Number", category:"progressrech tools", use:".tempnumber", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ const res=await OmegatechGet("/api/tools/Temp-number",{}); reply(`*📞 TEMP NUMBER*\n${JSON.stringify(res,null,2).slice(0,4000)}`); }
  catch(e){ try{ const res2=await OmegatechGet("/api/tools/get-number",{}); reply(`*📞 GET NUMBER*\n${JSON.stringify(res2,null,2).slice(0,4000)}`); }catch(e2){ reply(`*❌ ${e2.message}*`); } }
});

cmd({ pattern:"getotp", react:"🔑", desc:"Get OTP", category:"progresstech tools", use:".getotp 2376xxxx", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Number needed_*");
    const res=await OmegatechGet("/api/tools/get-otp",{ number:q });
    reply(`*🔑 OTP ${q}*\n${JSON.stringify(res,null,2).slice(0,4000)}`);
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern:"smsvirtual", react:"💬", desc:"SMS Virtual", category:"progresstech tools", use:".smsvirtual", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ const res=await OmegatechGet("/api/tools/smsvitual",{ number:q }); reply(`*💬 SMS VIRTUAL*\n${JSON.stringify(res,null,2).slice(0,4000)}`); }catch(e){ reply(`*❌ ${e.message}*`); }
});

cmd({ pattern:"emailtick", alias:["tempmail"], react:"📧", desc:"Email Tick", category:"progresstech tools", use:".emailtick", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ const res=await OmegatechGet("/api/tools/EmailTick",{}); reply(`*📧 EMAIL TICK*\n${JSON.stringify(res,null,2).slice(0,4000)}`); }catch(e){ reply(`*❌ ${e.message}*`); }
});

cmd({ pattern:"waprofile", alias:["wastalk"], react:"👤", desc:"WA Profile", category:"progresstech tools", use:".waprofile 237682432296", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{ if(!q) return reply("*_Number needed_*");
    const res=await OmegatechGet("/api/tools/whatsapp-proile",{ number:q });
    const p=res.data||res; let cap=`*👤 WA PROFILE*\n*Number:* ${p.number||q}\n*Name:* ${p.name||'N/A'}\n*Link:* ${p.link||'https://wa.me/'+q}\n`;
    if(p.profile) await conn.sendMessage(from,{ image:{ url:p.profile }, caption:cap },{quoted:mek});
    else reply(cap+JSON.stringify(res).slice(0,2000));
  }catch(e){ reply(`*❌ Error:* ${e.message}`); }
});

// ── IMAGE FILTERS ──
async function handleImageTool(conn,mek,m,from,q,reply,toolPath,toolName){
  try{
    if(!m.quoted) return reply(`*_Reply to image for ${toolName}_*`);
    reply(`*_🎨 ${toolName} processing..._*`);
    const buffer=await getBufferFromMsg(m.quoted);
    const form=new FormData(); form.append("image", buffer, { filename:"image.jpg", contentType:"image/jpeg" });
    if(q) form.append("prompt", q);
    const { data } = await axios.post(BASE+toolPath, form, { headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, timeout:180000 });
    const d=data.data||data; const url=d.url||d.image_url||d.result;
    if(url) await conn.sendMessage(from,{ image:{ url }, caption:`*✨ ${toolName} Done*` },{quoted:mek});
    else reply(`*Result:* ${JSON.stringify(data).slice(0,3000)}`);
  }catch(e){ reply(`*❌ ${toolName} Error:* ${e.response?.data?.message||e.message}`); }
}

cmd({ pattern:"upscale", alias:["image-upscaler"], react:"✨", desc:"Upscaler", category:"progresstech tools", use:".upscale reply image", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{ await handleImageTool(conn,mek,m,from,q,reply,"/api/tools/Image-upscaler","UPSCALE"); });

cmd({ pattern:"tocartoon", react:"🎨", desc:"To Cartoon", category:"progresstech tools", use:".tocartoon reply image", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{ await handleImageTool(conn,mek,m,from,q,reply,"/api/tools/tocartoon","TOCARTOON"); });

cmd({ pattern:"tocomic", react:"💥", desc:"To Comic", category:"tools", use:".tocomic reply image", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{ await handleImageTool(conn,mek,m,from,q,reply,"/api/tools/tocomic","TOCOMIC"); });

cmd({ pattern:"tomirror", alias:["mirror"], react:"🪞", desc:"Mirror iPhone", category:"tools", use:".tomirror reply image", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{ await handleImageTool(conn,mek,m,from,q,reply,"/api/tools/tomirror-iphone","MIRROR"); });

cmd({ pattern:"tooilpainting", alias:["oilpaint"], react:"🖌️", desc:"Oil Painting", category:"tools", use:".tooilpainting reply image", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{ await handleImageTool(conn,mek,m,from,q,reply,"/api/tools/tooilpainting","OIL-PAINTING"); });

cmd({ pattern:"topixar", react:"✨", desc:"To Pixar", category:"tools", use:".topixar reply image", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{ await handleImageTool(conn,mek,m,from,q,reply,"/api/tools/topixar","TOPIXAR"); });

cmd({ pattern:"shazam", react:"🎧", desc:"Shazam", category:"progresstech tools", use:".shazam reply audio", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{
    if(!m.quoted) return reply("*_Reply to audio_*");
    reply("*_🎧 Shazaming..._*");
    const buffer=await getBufferFromMsg(m.quoted);
    const form=new FormData(); form.append("audio", buffer, { filename:"audio.mp3", contentType:"audio/mpeg" });
    const { data } = await axios.post(BASE+"/api/tools/shazam", form, { headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, timeout:180000 });
    reply(`*🎧 SHAZAM*\n${JSON.stringify(data,null,2).slice(0,4000)}`);
  }catch(e){ reply(`*❌ Shazam Error:* ${e.response?.data?.message||e.message}`); }
});

cmd({ pattern:"enhancevideo", alias:["wink"], react:"🎥", desc:"Video Enhancer", category:"progresstech tools", use:".enhancevideo reply video", filename:__filename },
async (conn,mek,m,{from,q,reply})=>{
  try{
    if(!m.quoted) return reply("*_Reply to video_*");
    reply("*_🎥 Enhancing video..._*");
    const buffer=await getBufferFromMsg(m.quoted);
    const form=new FormData(); form.append("video", buffer, { filename:"video.mp4", contentType:"video/mp4" });
    let data;
    try{ const res=await axios.post(BASE+"/api/tools/Video-Enhancer", form, { headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, timeout:300000 }); data=res.data; }
    catch{ const res2=await axios.post(BASE+"/api/tools/wink-Video-enhancer", form, { headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, timeout:300000 }); data=res2.data; }
    const d=data.data||data; const url=d.url||d.video_url||d.result;
    if(url) await conn.sendMessage(from,{ video:{ url }, caption:"*🎥 Enhanced*" },{quoted:mek});
    else reply(JSON.stringify(data).slice(0,3000));
  }catch(e){ reply(`*❌ Enhance Error:* ${e.message}`); }
});
