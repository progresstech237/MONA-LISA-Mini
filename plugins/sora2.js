const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/Sora';
const TOKEN_FILE = './data/sora-tokens.json';

if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
function loadTokens(){ try{ if(fs.existsSync(TOKEN_FILE)) return JSON.parse(fs.readFileSync(TOKEN_FILE,'utf8')); }catch{} return {}; }
function saveTokens(t){ try{ fs.writeFileSync(TOKEN_FILE, JSON.stringify(t,null,2)); }catch{} }
let tokens=loadTokens();

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "sora2", alias: ["soraai","soravideo","opensora","sora"], react:"🎥",
  desc:"Sora.ai video - polling + token reuse", category:"progresstech ai",
  use:".sora2 cat astronaut |.sora2 token <token> extend |.sora2 mytokens",
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
    const userKey=m.sender;

    if(['mytokens','tokens','history'].includes(rawQ.toLowerCase())){
      const userTokens=tokens[userKey]||[];
      if(!userTokens.length) return reply(`*No Sora tokens*\n${prefix}sora2 a cat dancing\n\n${BRAND}`);
      let list=userTokens.map((t,i)=> `${i+1}. \`${t.token.slice(0,30)}...\`\n${t.prompt.slice(0,60)}`).join('\n\n');
      return reply(`*🎥 Your Sora Tokens:*\n\n${list}\n\n${prefix}sora2 token <token> continue\n\n${BRAND}`);
    }

    let reuseToken=null;
    if(rawQ.toLowerCase().startsWith('token ')){
      const parts=rawQ.slice(5).trim().split(' ');
      reuseToken=parts[0];
      rawQ=parts.slice(1).join(' ')||'continue';
    }

    if(!rawQ || ['help','sora2'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const sora2=`┏━━〔 🎥 Sora.ai 〕━━┓\n┃ Premium video gen\n┃ Polls till complete\n┃ Token reuse\n┃\n┃ ${prefix}sora2 cat astronaut dancing\n┃ ${prefix}sora2 9:16 Mona Lisa afro girl\n┃ ${prefix}sora2 token <token> make sunset\n┃ ${prefix}sora2 mytokens\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🎥 Sora.ai • OpenAI",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🎬 Generate",id:`${prefix}sora2 cinematic shot of Mona Lisa afro girl singing in Paris at sunset 4k`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"📜 My Tokens",id:`${prefix}sora2 mytokens`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🎥",key:mek.key}}).catch(()=>{});
    let actualPrompt=rawQ, aspectRatio="16:9";
    const arMatch=actualPrompt.match(/(16:9|9:16|1:1|4:3|21:9)/i);
    if(arMatch){ aspectRatio=arMatch[1]; actualPrompt=actualPrompt.replace(arMatch[1],'').trim(); }

    reply(`*🎥 Sora.ai Generating...*\n*Prompt:* ${actualPrompt.slice(0,120)}\n*Ratio:* ${aspectRatio}\n*Token:* ${reuseToken?'Reusing':'New'}\n_Polling 60-180s..._\n_${BRAND}_`);

    let videoUrl=null, returnedToken=reuseToken, attempts=0;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    // Initial
    try{
      const { data } = await axios.post(API, { prompt: actualPrompt, aspect_ratio: aspectRatio, ...(reuseToken? { token: reuseToken }: {}) }, { timeout:120000, headers });
      videoUrl=data?.data?.url || data?.data?.video_url || data?.url || data?.video_url || data?.data?.link;
      returnedToken=data?.data?.token || data?.token || returnedToken;
      if(!videoUrl && typeof data?.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
    }catch(e){ console.log('Sora POST err', e.response?.data||e.message); }

    // Poll non-blocking (10 attempts)
    if(!videoUrl && returnedToken){
      reply(`*⏳ Processing...*\nToken: \`${returnedToken.slice(0,30)}...\`\nPolling every 15s...`);
      while(attempts<12 &&!videoUrl){
        attempts++;
        await new Promise(r=>setTimeout(r,15000));
        try{
          const { data } = await axios.get(`${API}?token=${encodeURIComponent(returnedToken)}&action=poll`, { timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
          videoUrl=data?.data?.url || data?.url || data?.data?.video_url || data?.video_url;
          if(!videoUrl && typeof data?.data==='string' && data.data.startsWith('http')) videoUrl=data.data;
          if(attempts%2===0 &&!videoUrl) await conn.sendMessage(from,{ text:`*⏳ Still generating...* ${attempts*15}s` },{quoted:mek});
        }catch{}
      }
    }

    if(!videoUrl) throw new Error(`Still processing after ${attempts*15}s. Token: ${returnedToken}\nUse: ${prefix}sora2 token ${returnedToken} extend`);

    if(!tokens[userKey]) tokens[userKey]=[];
    tokens[userKey].push({ token: returnedToken||videoUrl, prompt: actualPrompt, url: videoUrl, time: Date.now() });
    if(tokens[userKey].length>10) tokens[userKey]=tokens[userKey].slice(-10);
    saveTokens(tokens);

    await conn.sendMessage(from,{
      video:{ url: videoUrl },
      caption:`*✅ Sora Video Generated*\n*Prompt:* ${actualPrompt}\n*Ratio:* ${aspectRatio}\n*Token:* \`${(returnedToken||'').slice(0,50)}\`\n\n${prefix}sora2 token ${returnedToken||'[token]'} extend scene\n\n*${BRAND}*\n${CHANNEL_LINK}`,
      contextInfo:ctx
    },{quoted:mek});
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Sora Error:', e.response?.data||e.message);
    reply(`*❌ Sora Failed*\n${e.response?.data?.message||e.message}\n${'.sora2 token <token> to check'}`);
  }
});
