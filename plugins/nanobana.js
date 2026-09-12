const { cmd } = require('../redx');
const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

const BRAND = '👑 By MONA LISA MINI BOT';
const SESS_FILE = './data/nanopro.json';
if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
let bananaSession={};
try{ if(fs.existsSync(SESS_FILE)) bananaSession=JSON.parse(fs.readFileSync(SESS_FILE,'utf8')); }catch{}
function saveSess(){ try{ fs.writeFileSync(SESS_FILE, JSON.stringify(bananaSession,null,2)); }catch{} }

async function getBuffer(m){
  try{
    let msg=m.quoted? m.quoted : m;
    if(msg.msg) msg=msg.msg;
    if(msg.message) msg=msg.message;
    let type=Object.keys(msg)[0]; let content=msg[type];
    if(type==='viewOnceMessageV2'||type==='viewOnceMessage'){ content=content.message; type=Object.keys(content)[0]; content=content[type]; }
    let mediaType=type.replace('Message','');
    const stream=await downloadContentFromMessage(content, mediaType);
    let buf=Buffer.from([]);
    for await(const c of stream) buf=Buffer.concat([buf,c]);
    return buf;
  }catch{ return null; }
}

async function uploadMedia(m){
  try{
    const buf=await getBuffer(m);
    if(!buf) return null;
    // try tmp -> fallback catbox
    try{
      const form=new FormData();
      form.append('file', buf, { filename:'image.jpg' });
      const res=await axios.post('https://tmp.malvryx.dev/upload', form, { headers:form.getHeaders(), timeout:30000 });
      return res.data?.cdnUrl||res.data?.directUrl||null;
    }catch{
      const form2=new FormData();
      form2.append('reqtype','fileupload');
      form2.append('fileToUpload', buf, { filename:'image.jpg' });
      const res2=await axios.post('https://catbox.moe/user/api.php', form2, { headers:form2.getHeaders(), timeout:30000 });
      if(typeof res2.data==='string' && res2.data.startsWith('http')) return res2.data.trim();
      return null;
    }
  }catch(e){ console.log('upload fail', e.message); return null; }
}

cmd({
  pattern:"nano", alias:["nana","nanobana"], react:"🍌",
  desc:"Nano banana - txt2img & img edit", category:"progresstech ai",
  use:".nano prompt | reply image.nano prompt",
  filename:__filename
}, async (conn, mek, m, { from, q, reply }) => {
  try{
    const prompt=q||m.quoted?.text||m.msg?.caption||"";
    const imageUrl=await uploadMedia(m);

    if(imageUrl){
      if(!prompt) return reply(`*🍌 Reply image with prompt*\n*.nano make it zombie*`);
      await conn.sendMessage(from,{react:{text:"🎨",key:mek.key}}).catch(()=>{});
      reply(`*🍌 Editing... Please wait*`);
      const { data:init } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2`, { params:{ prompt, image:imageUrl }, timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
      if(!init.task_id) throw new Error('No task_id');
      let resultUrl=null;
      for(let i=0;i<20;i++){
        await new Promise(r=>setTimeout(r,5000));
        const { data:check } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result`, { params:{ task_id:init.task_id }, timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
        if(check.status==='completed'){ resultUrl=check.image_url; break; }
        if(check.status==='failed') throw new Error('Generation failed');
      }
      if(resultUrl){
        await conn.sendMessage(from,{ image:{ url:resultUrl }, caption:`*🍌 NANO EDIT SUCCESS*\n*📝 ${prompt}*\n*${BRAND}*` },{quoted:mek});
        await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
      }else reply(`*❌ Edit timed out. Try again.*`);
      return;
    }

    if(!prompt) return reply(`*🍌 Text to image:*\n*.nano a cute cat*\n\n*Edit: reply image.nano make cartoon*`);

    await conn.sendMessage(from,{react:{text:"⏳",key:mek.key}}).catch(()=>{});
    reply(`*🍌 Generating...*`);
    const { data } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana-pro`, { params:{ prompt }, timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
    if(data.image){
      await conn.sendMessage(from,{ image:{ url:data.image }, caption:`*🍌 NANO PRO*\n*📝 ${prompt}*\n*${BRAND}*` },{quoted:mek});
      await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
    }else reply(`*❌ No image generated*\n${JSON.stringify(data).slice(0,500)}`);
  }catch(e){
    console.log("NANO ERROR:", e.message);
    reply(`*❌ Error:* ${e.message}`);
  }
});

cmd({
  pattern:"nanopro", alias:["nanocollect","nanoblend"], react:"🚀",
  desc:"Collect up to 4 images and blend", category:"ai",
  use:".nanopro (reply image) |.nanopro done <prompt>",
  filename:__filename
}, async (conn, mek, m, { from, q, reply }) => {
  try{
    const userId=m.sender;
    if(!bananaSession[userId]) bananaSession[userId]={ images:[] };

    if(q?.toLowerCase().startsWith('done')){
      const session=bananaSession[userId];
      const finalPrompt=q.replace(/done/i,'').trim();
      if(session.images.length<2) return reply(`*⚠️ Need at least 2 images. Currently ${session.images.length}/4*`);
      if(!finalPrompt) return reply(`*📝 Provide prompt*\n*.nanopro done make them together*`);
      await conn.sendMessage(from,{react:{text:"🕒",key:mek.key}}).catch(()=>{});
      reply(`*🍌 Blending ${session.images.length} images...*\n*📝 ${finalPrompt}*`);
      let params={ prompt:finalPrompt };
      session.images.forEach((url,i)=>{ params[`image${i+1}`]=url; });
      const { data:initRes } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nanobana-pro-v3`, { params, timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
      if(!initRes.task_id) throw new Error('No task_id');
      let resultUrl=null;
      for(let i=0;i<25;i++){
        await new Promise(r=>setTimeout(r,5000));
        const { data:check } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result`, { params:{ task_id:initRes.task_id }, timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
        if(check.status==='completed' && check.image_url){ resultUrl=check.image_url; break; }
        if(check.status==='failed') throw new Error('Server failed');
      }
      if(!resultUrl) throw new Error('Timed out');
      await conn.sendMessage(from,{ image:{ url:resultUrl }, caption:`*🍌 NANO PRO BLEND*\n*🖼️ ${session.images.length} images*\n*📝 ${finalPrompt}*\n*${BRAND}*` },{quoted:mek});
      delete bananaSession[userId]; saveSess();
      await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
      return;
    }

    const link=await uploadMedia(m);
    if(!link){
      return reply(`*📸 COLLECTOR MODE*\nReply image with *.nanopro* to collect\nWhen done: *.nanopro done your prompt*\nCurrently: ${bananaSession[userId].images.length}/4`);
    }
    if(bananaSession[userId].images.length>=4) return reply(`*❌ Max 4 reached. Now:.nanopro done <prompt>*`);
    bananaSession[userId].images.push(link); saveSess();
    await conn.sendMessage(from,{react:{text:"📥",key:mek.key}}).catch(()=>{});
    reply(`*✅ Image ${bananaSession[userId].images.length}/4 Added*\nSend another or *.nanopro done <prompt>*`);
  }catch(e){
    console.log("NANOPRO ERROR:", e.message);
    reply(`*❌ Error: ${e.message}*`);
    delete bananaSession[m.sender]; saveSess();
  }
});
