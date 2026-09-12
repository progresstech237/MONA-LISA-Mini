const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Unlimitedai';
const SESSION_FILE = './data/unlimitedai-sessions.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
const load=()=>{ try{ if(fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); }catch{} return {}; };
const save=s=>{ try{ fs.writeFileSync(SESSION_FILE, JSON.stringify(s,null,2)); }catch{} };
let sessions=load();

const getThumb=()=>{ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; };

cmd({
  pattern: "unlimitedai", alias: ["unlimited","uai"], react: "♾️",
  desc: "Unlimited AI - no limits", category: "progresstech ai",
  use: ".unlimitedai hello |.unlimitedai clear",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    try{
      const p=JSON.parse(mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson||'{}');
      if(p.id) rawQ=p.id.replace(prefix,"").trim();
      const r=mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      if(r) rawQ=r.replace(prefix,"").trim();
    }catch{}
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`,'i'),'').trim();

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };
    const userKey=m.sender;

    if(['clear','reset','new'].includes(rawQ.toLowerCase())){
      delete sessions[userKey]; save(sessions);
      return reply(`*✅ UnlimitedAI cleared*\n${BRAND}`);
    }

    if(!rawQ || ['uai','menu'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 ♾️ UnlimitedAI 〕━━┓\n┃ No Restrictions - No Censorship\n┃ ${sessions[userKey]? '✅ Session' : '🆕 No session'}\n┃ ${prefix}unlimitedai hello\n┃ ${prefix}unlimitedai clear\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"♾️ UnlimitedAI",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"♾️ Chat",id:`${prefix}unlimitedai hello what can you do`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🔄 Clear",id:`${prefix}unlimitedai clear`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"♾️",key:mek.key}}).catch(()=>{});
    await conn.sendPresenceUpdate('composing',from).catch(()=>{});

    if(!sessions[userKey]) sessions[userKey]={ id:`unlim_${Date.now()}`, history:[] };
    const sessionId=sessions[userKey].id;

    let answer="";
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    try{
      const { data } = await axios.post(API, { prompt: rawQ, sessionId }, { timeout:90000, headers });
      answer=data?.data?.result || data?.data?.response || data?.result || data?.response || data?.answer || data?.message || "";
      if(!answer && typeof data?.data==='string') answer=data.data;
      if(!answer && typeof data==='string') answer=data;
    }catch(e){
      console.log('Unlimited POST fail', e.response?.data||e.message);
      try{
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&sessionId=${sessionId}`, { timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
        answer=data?.data?.result || data?.result || data?.response || data?.data?.response || "";
        if(!answer && typeof data?.data==='string') answer=data.data;
      }catch{}
    }

    if(!answer){
      try{
        const { data } = await axios.post(API, { prompt: rawQ }, { timeout:30000, headers });
        answer=data?.data?.result || data?.result || "";
      }catch{}
    }

    if(!answer) throw new Error('No response - API busy');

    sessions[userKey].history.push({role:"user",content:rawQ});
    sessions[userKey].history.push({role:"assistant",content:answer.slice(0,1000)});
    if(sessions[userKey].history.length>20) sessions[userKey].history=sessions[userKey].history.slice(-20);
    save(sessions);

    if(answer.length>3800){
      for(const chunk of answer.match(/.{1,3500}/gs)){
        await conn.sendMessage(from,{ text: chunk+`\n\n_${BRAND}_`, contextInfo:ctx }, {quoted:mek});
      }
    }else{
      await conn.sendMessage(from,{ text:`*♾️ UnlimitedAI:*\n\n${answer}\n\n_${BRAND}_`, contextInfo:ctx }, {quoted:mek});
    }
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('UnlimitedAI Error:', e.response?.data||e.message);
    reply(`*❌ UnlimitedAI Failed*\n${e.message}`);
  }
});
