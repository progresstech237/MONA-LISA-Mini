const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/wrmgpt';
const SESSION_FILE = './data/wrmgpt-sessions.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
const load=()=>{ try{ if(fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); }catch{} return {}; };
const save=(s)=>{ try{ fs.writeFileSync(SESSION_FILE, JSON.stringify(s,null,2)); }catch{} };
let sessions=load();

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

function parseSSE(text){
  let out='';
  const lines=text.split('\n');
  for(const line of lines){
    let l=line.trim();
    if(!l.startsWith('data:')) continue;
    let data=l.slice(5).trim();
    if(!data || data==='[DONE]') continue;
    try{
      const j=JSON.parse(data);
      out+= j.choices?.[0]?.delta?.content || j.delta?.content || j.content || j.text || j.response || j.result || j.answer || j.message || '';
      if(typeof j==='string') out+=j;
    }catch{
      if(data.startsWith('{')){
        try{ const j2=JSON.parse(data); out+=j2.result||j2.response||''; }catch{ out+=data; }
      }else out+=data;
    }
  }
  return out.trim();
}

cmd({
  pattern: "wrmgpt", alias: ["wormgpt","worm"], react: "🪱",
  desc: "WRMGPT v5.5 - SSE", category: "progresstech ai",
  use: ".wrmgpt hello |.wrmgpt clear",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    try{
      const p=JSON.parse(mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson||'{}');
      if(p.id) rawQ=p.id.replace(prefix,"").trim();
    }catch{}
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`,'i'),'').trim();

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };
    const userKey=m.sender;

    if(['clear','reset','new'].includes(rawQ.toLowerCase())){
      delete sessions[userKey]; save(sessions);
      return reply(`*✅ WRMGPT cleared*\n${BRAND}`);
    }

    if(!rawQ || ['wrmgpt','menu'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 🪱 WRMGPT v5.5 〕━━┓\n┃ Fast SSE AI\n┃\n┃ ${prefix}wrmgpt hello\n┃ ${prefix}wrmgpt write code\n┃ ${prefix}wrmgpt clear\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🪱 WRMGPT v5.5",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"💬 Chat",id:`${prefix}wrmgpt hello`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🔄 Clear",id:`${prefix}wrmgpt clear`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🪱",key:mek.key}}).catch(()=>{});
    await conn.sendPresenceUpdate('composing',from).catch(()=>{});

    if(!sessions[userKey]) sessions[userKey]={ id:`wrm_${Date.now()}_${userKey.slice(-6)}`, history:[] };
    const sid=sessions[userKey].id;

    let finalAnswer='';
    const headers={'Content-Type':'application/json','Accept':'text/event-stream, application/json','User-Agent':'Mozilla/5.0'};

    // 1. Primary SSE POST
    try{
      const res = await axios.post(API, { prompt: rawQ, sessionId: sid }, { timeout:90000, headers, responseType:'text' });
      let txt = typeof res.data==='string'? res.data : JSON.stringify(res.data);
      if(txt.includes('data:')) finalAnswer=parseSSE(txt);
      else {
        try{
          const j=typeof res.data==='string'? JSON.parse(res.data) : res.data;
          finalAnswer=j.data?.result||j.result||j.response||j.data?.response||j.answer||'';
          if(!finalAnswer && typeof j.data==='string') finalAnswer=j.data;
        }catch{ finalAnswer=txt; }
      }
    }catch(e){ console.log('WRM SSE POST fail', e.message); }

    // 2. Fallback GET
    if(!finalAnswer){
      try{
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&sessionId=${sid}`, { timeout:60000, headers:{ 'User-Agent':'Mozilla/5.0', Accept:'text/event-stream' }, responseType:'text' });
        let txt=typeof data==='string'? data : JSON.stringify(data);
        if(txt.includes('data:')) finalAnswer=parseSSE(txt);
        else finalAnswer=txt.slice(0,6000);
      }catch(e){ console.log('WRM GET fail', e.message); }
    }

    // 3. Simple JSON POST
    if(!finalAnswer){
      try{
        const { data } = await axios.post(API, { prompt: rawQ }, { timeout:30000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'} });
        finalAnswer=data?.data?.result||data?.result||data?.response||data?.message||'';
        if(!finalAnswer && typeof data?.data==='string') finalAnswer=data.data;
      }catch{}
    }

    if(!finalAnswer) throw new Error('No response from WRMGPT - try.wrmgpt clear');

    finalAnswer=finalAnswer.replace(/\[DONE\]/g,'').trim();

    sessions[userKey].history.push({role:"user",content:rawQ});
    sessions[userKey].history.push({role:"assistant",content:finalAnswer.slice(0,1000)});
    if(sessions[userKey].history.length>20) sessions[userKey].history=sessions[userKey].history.slice(-20);
    save(sessions);

    if(finalAnswer.length>3800){
      for(const chunk of finalAnswer.match(/.{1,3500}/gs)){
        await conn.sendMessage(from,{ text: chunk+`\n\n_${BRAND}_`, contextInfo:ctx }, {quoted:mek});
        await new Promise(r=>setTimeout(r,300));
      }
    }else{
      await conn.sendMessage(from,{ text:`*🪱 WRMGPT v5.5:*\n\n${finalAnswer}\n\n_${BRAND}_`, contextInfo:ctx }, {quoted:mek});
    }
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('WRMGPT Error:', e.response?.data||e.message);
    reply(`*❌ WRMGPT Failed*\n${e.message}`);
  }
});
