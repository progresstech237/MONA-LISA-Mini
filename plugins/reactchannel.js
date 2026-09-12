const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/tools/react-channel';
const LIMIT_FILE = './data/reactchannel-limit.json';
const MAX_REACT = 20;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 min

if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
function loadLimit(){ try{ if(fs.existsSync(LIMIT_FILE)) return JSON.parse(fs.readFileSync(LIMIT_FILE,'utf8')); }catch{} return {}; }
function saveLimit(d){ try{ fs.writeFileSync(LIMIT_FILE, JSON.stringify(d,null,2)); }catch{} }

function checkLimit(userKey){
  const data=loadLimit();
  const now=Date.now();
  if(!data[userKey]) data[userKey]=[];
  // Clean old (>30min)
  data[userKey]=data[userKey].filter(t=> now - t < COOLDOWN_MS);
  const used=data[userKey].length;
  if(used >= MAX_REACT){
    const oldest=data[userKey][0];
    const remainingMs=COOLDOWN_MS - (now - oldest);
    const remainingMin=Math.ceil(remainingMs/60000);
    saveLimit(data);
    return { allowed:false, remainingMin, remainingMs };
  }
  return { allowed:true, data, now };
}
function addUse(userKey, count, limitData, now){
  if(!limitData[userKey]) limitData[userKey]=[];
  for(let i=0;i<count;i++) limitData[userKey].push(now);
  saveLimit(limitData);
}

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "reactchannel", alias: ["channelreact","reactch","chreact","rchannel"], react:"❤️",
  desc:"React to channel - 20 per 30min limit", category:"progresstech tools",
  use:".reactchannel <link> <post_id> <emojis>",
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

    if(!rawQ || ['help','reactch'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const reactch=`┏━━〔 ❤️ React Channel 〕━━┓\n┃ 20 reacts / 30 min limit\n┃ Multi emoji supported\n┃\n┃ ${prefix}reactchannel <link> <id> ❤️\n┃ ${prefix}reactchannel ${CHANNEL_LINK} 1 ❤️🔥\n┃\n┃ Limit: ${MAX_REACT} per ${COOLDOWN_MS/60000} min\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"❤️ React Channel • 20/30min",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"❤️ Demo 5x",id:`${prefix}reactchannel ${CHANNEL_LINK} 1 ❤️🔥😂🎉👏`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    // --- LIMIT CHECK ---
    const userKey=m.sender;
    const limitCheck=checkLimit(userKey);
    if(!limitCheck.allowed){
      return reply(`*⏳ Limit Reached*\nYou used ${MAX_REACT} reactions.\nWait *${limitCheck.remainingMin} min* then try again.\n\nThis is to avoid channel ban / spam detection.\n\n${BRAND}`);
    }

    await conn.sendMessage(from,{react:{text:"❤️",key:mek.key}}).catch(()=>{});
    let channelUrl="", postId="", emojis="❤️";
    if(rawQ.includes('|')){
      const parts=rawQ.split('|').map(s=>s.trim());
      channelUrl=parts[0]||""; postId=parts[1]||""; emojis=parts[2]||"❤️";
    }else{
      const parts=rawQ.split(/\s+/);
      const urlIdx=parts.findIndex(p=> p.includes('whatsapp.com/channel')|| p.includes('0029'));
      if(urlIdx!==-1){ channelUrl=parts[urlIdx]; postId=parts[urlIdx+1]||""; emojis=parts.slice(urlIdx+2).join(' ')||"❤️"; }
      else{ channelUrl=parts[0]||""; postId=parts[1]||""; emojis=parts.slice(2).join(' ')||"❤️"; }
    }
    let channelId=channelUrl; const chMatch=channelUrl.match(/channel\/([A-Za-z0-9]+)/); if(chMatch) channelId=chMatch[1];
    if(!channelUrl||!postId) return reply(`*❌ Need link + post_id + emojis*\n${prefix}reactchannel ${CHANNEL_LINK} 5 ❤️🔥\n\n${BRAND}`);

    const emojiList=emojis.match(/[\p{Emoji}]/gu)||[emojis];
    const emojiStr=emojiList.join('').trim()||emojis;

    // Check if request exceeds remaining
    const remainingAllowed = MAX_REACT - loadLimit()[userKey].length;
    if(emojiList.length > remainingAllowed){
      return reply(`*⚠️ Too many emojis*\nYou have *${remainingAllowed}* left of ${MAX_REACT}.\nYou tried ${emojiList.length}.\nReduce emojis or wait ${COOLDOWN_MS/60000} min.\n\n${BRAND}`);
    }

    reply(`*❤️ Reacting... (${emojiList.length}/${remainingAllowed} left)*\n*Channel:* ${channelId.slice(0,30)}...\n*Post:* ${postId}\n*Emojis:* ${emojiStr}\n_${BRAND}_`);

    let result=null;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};
    try{
      const { data } = await axios.post(API, { channel_url: channelUrl, channel_id: channelId, post_id: postId, emojis: emojiList, emoji: emojiStr }, { timeout:60000, headers });
      result=data.data||data;
    }catch(e){
      console.log('react POST fail', e.response?.data||e.message);
      try{
        const { data } = await axios.get(`${API}?channel_url=${encodeURIComponent(channelUrl)}&post_id=${encodeURIComponent(postId)}&emojis=${encodeURIComponent(emojiStr)}`, { timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
        result=data.data||data;
      }catch{}
    }

    if(!result) throw new Error('No response from API');

    // Save usage only on success
    if(result.success!==false){
      addUse(userKey, emojiList.length, limitCheck.data, limitCheck.now);
    }

    const status=result.status||result.message||result.success||'Done';
    const ok=result.success!==false;
    const newUsed=loadLimit()[userKey]?.length||0;

    let msg=`*${ok? '✅' : '⚠️'} Reaction ${ok? 'Sent':'Result'}*\n\n📢 ${channelId}\n🆔 Post: ${postId}\nEmojis: ${emojiStr} (${emojiList.length})\nStatus: ${typeof status==='string'? status.slice(0,400) : JSON.stringify(status).slice(0,400)}\n\n📊 *Usage:* ${newUsed}/${MAX_REACT} this 30 min\n`;
    if(newUsed >= MAX_REACT) msg+=`⏳ *Next reset in 30 min*\n`;
    msg+=`\n\`\`\`${JSON.stringify(result,null,2).slice(0,800)}\`\`\`\n\n*${BRAND}*`;
    await conn.sendMessage(from,{ text: msg, contextInfo:ctx },{quoted:mek});
    await conn.sendMessage(from,{react:{text:ok?"✅":"⚠️",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('React Channel Error:', e.response?.data||e.message);
    reply(`*❌ React Failed*\n${e.response?.data?.message||e.message}`);
  }
});
