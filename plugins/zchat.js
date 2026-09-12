const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/zchat-agent';
const SESSION_FILE = './data/zchat-sessions.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
const load = ()=>{ try{ if(fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); }catch{} return {}; };
const save = (s)=>{ try{ fs.writeFileSync(SESSION_FILE, JSON.stringify(s,null,2)); }catch{} };
let sessions = load();

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "zchat", alias: ["zai","zagent"], react: "🤖",
  desc: "ZChat AI with session", category: "progresstech ai",
  use: ".zchat hello |.zchat clear",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    try{
      const j=JSON.parse(mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson||'{}');
      if(j.id) rawQ=j.id.replace(prefix,"").trim();
      const r=mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      if(r) rawQ=r.replace(prefix,"").trim();
    }catch{}
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`,'i'),'').trim();

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };
    const userKey=m.sender;

    if(['clear','reset','new','newchat'].includes(rawQ.toLowerCase())){
      delete sessions[userKey]; save(sessions);
      return reply(`*✅ ZChat cleared*\nFresh creds on next chat.\n${BRAND}`);
    }

    if(!rawQ || ['zchat','menu'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const med=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=med.imageMessage; } }catch{}
      const has=!!sessions[userKey];
      const menu=`┏━━〔 🤖 ZChat Agent 〕━━┓\n┃ ${has? '✅ Session active' : '🆕 No session'}\n┃ Auto scrapes fresh creds\n┃\n┃ ${prefix}zchat hello how are you?\n┃ ${prefix}zchat clear - reset\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🤖 ZChat Agent",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"💬 Hello",id:`${prefix}zchat hello introduce yourself`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🔄 New Session",id:`${prefix}zchat clear`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🤖",key:mek.key}}).catch(()=>{});
    if(!sessions[userKey]) sessions[userKey]={ id:`zchat_${Date.now()}_${userKey.slice(-6)}`, history:[] };
    const sid=sessions[userKey].id;
    await conn.sendPresenceUpdate('composing',from).catch(()=>{});

    let answer=null;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    // Omega wants: prompt + sessionId
    try{
      const { data } = await axios.post(API, { prompt: rawQ, sessionId: sid, session_id: sid }, { timeout:60000, headers });
      answer = data?.data?.result || data?.data?.response || data?.data?.answer || data?.result || data?.response || data?.answer || data?.message || data?.reply;
      if(!answer && typeof data?.data==='string') answer=data.data;
      if(!answer && typeof data==='string') answer=data;
    }catch(e){
      console.log('POST fail', e.response?.data||e.message);
      try{
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&sessionId=${sid}`, { timeout:60000, headers });
        answer = data?.data?.result || data?.result || data?.data?.message || data?.message;
        if(!answer && typeof data?.data==='string') answer=data.data;
      }catch{}
    }

    if(!answer) throw new Error('No response - try.zchat clear');

    sessions[userKey].history.push({ role:"user", content: rawQ });
    sessions[userKey].history.push({ role:"assistant", content: answer.slice(0,1000) });
    if(sessions[userKey].history.length>20) sessions[userKey].history=sessions[userKey].history.slice(-20);
    save(sessions);

    if(answer.length>3800){
      const parts=answer.match(/.{1,3500}/gs);
      for(let i=0;i<parts.length;i++){
        await conn.sendMessage(from,{ text:`${i===0? '*🤖 ZChat:*\n\n':''}${parts[i]}${i===parts.length-1? `\n\n_${BRAND}_` : ''}`, contextInfo:ctx }, {quoted:i===0?mek:undefined});
      }
    }else{
      await conn.sendMessage(from,{ text:`*🤖 ZChat:*\n\n${answer}\n\n_${BRAND}_\n\`${prefix}zchat clear\` for fresh creds`, contextInfo:ctx }, {quoted:mek});
    }
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('ZChat Error:', e.response?.data||e.message);
    reply(`*❌ ZChat Failed*\n${e.response?.data?.message || e.message}\nTry ${'.zchat clear'}`);
  }
});
