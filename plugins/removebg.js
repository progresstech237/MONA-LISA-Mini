const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Rwmove-Bg';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "removebg", alias: ["rbg","nobg","rmbg","rwmove","remove-bg"], react:"✂️",
  desc:"Remove BG - Pixpunk AI", category:"progresstech ai",
  use:".removebg reply to image",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };

    let imgBuffer=null;
    try{
      const quoted=mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if(quoted) imgBuffer=await conn.downloadMediaMessage({ message:{ imageMessage: quoted } });
      else if(mek.message?.imageMessage) imgBuffer=await conn.downloadMediaMessage(mek);
    }catch(e){ console.log('Download error', e.message); }

    if(!imgBuffer){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const removebg=`┏━━〔 ✂️ Remove BG 〕━━┓\n┃ Remove background → transparent PNG\n┃\n┃ Reply to image:\n┃ ${prefix}removebg\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"✂️ Remove BG • Pixpunk AI",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"✂️ How to use",id:`${prefix}removebg help`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"✂️",key:mek.key}}).catch(()=>{});
    reply(`*✂️ Removing background...*\n_Pixpunk AI 5-15s..._\n_${BRAND}_`);

    let resultUrl=null, resultBuffer=null;

    // POST - single field only
    try{
      const form=new FormData();
      form.append('image', imgBuffer, { filename:'image.jpg', contentType:'image/jpeg' });
      const { data, headers } = await axios.post(API, form, {
        timeout:120000, headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, responseType:'arraybuffer'
      });
      const cType=headers['content-type']||'';
      if(cType.includes('image')){
        resultBuffer=Buffer.from(data);
      }else{
        try{
          const json=JSON.parse(Buffer.from(data).toString('utf8'));
          resultUrl=json?.data?.url || json?.data?.image_url || json?.url || json?.result;
          const b64=json?.data?.base64||json?.base64;
          if(b64) resultBuffer=Buffer.from(b64.replace(/^data:image\/\w+;base64,/,''),'base64');
          if(!resultUrl && typeof json?.data==='string' && json.data.startsWith('http')) resultUrl=json.data;
        }catch{ if(data?.byteLength>1000) resultBuffer=Buffer.from(data); }
      }
    }catch(e){
      console.log('FormData fail', e.response?.data? Buffer.from(e.response.data).toString().slice(0,300) : e.message);
      try{
        const base64=imgBuffer.toString('base64');
        const { data } = await axios.post(API, { image: `data:image/jpeg;base64,${base64}` }, { timeout:120000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'} });
        resultUrl=data?.data?.url || data?.url || data?.data?.result;
        const b64=data?.data?.base64||data?.base64;
        if(b64) resultBuffer=Buffer.from(b64.replace(/^data:image\/\w+;base64,/,''),'base64');
        if(!resultUrl && typeof data?.data==='string' && data.data.startsWith('http')) resultUrl=data.data;
      }catch(e2){ console.log('Base64 fail', e2.message); }
    }

    if(!resultUrl &&!resultBuffer) throw new Error('No result - try clearer image');

    if(resultBuffer){
      await conn.sendMessage(from,{ image: resultBuffer, caption:`*✅ Background Removed*\nTransparent PNG\n*${BRAND}*`, contextInfo:ctx },{quoted:mek});
    }else if(resultUrl){
      await conn.sendMessage(from,{ image:{ url: resultUrl }, caption:`*✅ Background Removed*\n*${BRAND}*\n${CHANNEL_LINK}`, contextInfo:ctx },{quoted:mek});
    }

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    let err=e.message; try{ if(e.response?.data) err=Buffer.from(e.response.data).toString('utf8').slice(0,500); }catch{}
    console.error('Remove BG Error:', err);
    reply(`*❌ Remove BG Failed*\n${err}\nReply to image: ${'.removebg'}`);
  }
});const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Rwmove-Bg';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "removebg", alias: ["rbg","nobg","rmbg","rwmove","remove-bg"], react:"✂️",
  desc:"Remove BG - Pixpunk AI", category:"progresstech ai",
  use:".removebg reply to image",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };

    let imgBuffer=null;
    try{
      const quoted=mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      if(quoted) imgBuffer=await conn.downloadMediaMessage({ message:{ imageMessage: quoted } });
      else if(mek.message?.imageMessage) imgBuffer=await conn.downloadMediaMessage(mek);
    }catch(e){ console.log('Download error', e.message); }

    if(!imgBuffer){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const removebg=`┏━━〔 ✂️ Remove BG 〕━━┓\n┃ Remove background → transparent PNG\n┃\n┃ Reply to image:\n┃ ${prefix}removebg\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"✂️ Remove BG • Pixpunk AI",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"✂️ How to use",id:`${prefix}removebg help`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"✂️",key:mek.key}}).catch(()=>{});
    reply(`*✂️ Removing background...*\n_Pixpunk AI 5-15s..._\n_${BRAND}_`);

    let resultUrl=null, resultBuffer=null;

    // POST - single field only
    try{
      const form=new FormData();
      form.append('image', imgBuffer, { filename:'image.jpg', contentType:'image/jpeg' });
      const { data, headers } = await axios.post(API, form, {
        timeout:120000, headers:{...form.getHeaders(),'User-Agent':'Mozilla/5.0'}, responseType:'arraybuffer'
      });
      const cType=headers['content-type']||'';
      if(cType.includes('image')){
        resultBuffer=Buffer.from(data);
      }else{
        try{
          const json=JSON.parse(Buffer.from(data).toString('utf8'));
          resultUrl=json?.data?.url || json?.data?.image_url || json?.url || json?.result;
          const b64=json?.data?.base64||json?.base64;
          if(b64) resultBuffer=Buffer.from(b64.replace(/^data:image\/\w+;base64,/,''),'base64');
          if(!resultUrl && typeof json?.data==='string' && json.data.startsWith('http')) resultUrl=json.data;
        }catch{ if(data?.byteLength>1000) resultBuffer=Buffer.from(data); }
      }
    }catch(e){
      console.log('FormData fail', e.response?.data? Buffer.from(e.response.data).toString().slice(0,300) : e.message);
      try{
        const base64=imgBuffer.toString('base64');
        const { data } = await axios.post(API, { image: `data:image/jpeg;base64,${base64}` }, { timeout:120000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'} });
        resultUrl=data?.data?.url || data?.url || data?.data?.result;
        const b64=data?.data?.base64||data?.base64;
        if(b64) resultBuffer=Buffer.from(b64.replace(/^data:image\/\w+;base64,/,''),'base64');
        if(!resultUrl && typeof data?.data==='string' && data.data.startsWith('http')) resultUrl=data.data;
      }catch(e2){ console.log('Base64 fail', e2.message); }
    }

    if(!resultUrl &&!resultBuffer) throw new Error('No result - try clearer image');

    if(resultBuffer){
      await conn.sendMessage(from,{ image: resultBuffer, caption:`*✅ Background Removed*\nTransparent PNG\n*${BRAND}*`, contextInfo:ctx },{quoted:mek});
    }else if(resultUrl){
      await conn.sendMessage(from,{ image:{ url: resultUrl }, caption:`*✅ Background Removed*\n*${BRAND}*\n${CHANNEL_LINK}`, contextInfo:ctx },{quoted:mek});
    }

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    let err=e.message; try{ if(e.response?.data) err=Buffer.from(e.response.data).toString('utf8').slice(0,500); }catch{}
    console.error('Remove BG Error:', err);
    reply(`*❌ Remove BG Failed*\n${err}\nReply to image: ${'.removebg'}`);
  }
});
