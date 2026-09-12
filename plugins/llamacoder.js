const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/ai/llamacoder';
const SESSION_FILE = './data/llamacoder-sessions.json';
const TMP_DIR = './data/tmp';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
function loadSessions() { try { if (fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); } catch {} return {}; }
function saveSessions(s) { try { fs.writeFileSync(SESSION_FILE, JSON.stringify(s, null, 2)); } catch {} }
let sessions = loadSessions();

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "llama", alias: ["llamacoder","appbuilder","buildapp"], react:"💻",
  desc:"LlamaCoder - Full-stack app builder", category:"progresstech ai",
  use:".llama build a todo app |.llama add dark mode |.llama clear",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`,'i'),'').trim();
    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };
    const userKey=m.sender;

    if(['clear','reset','new'].includes(rawQ.toLowerCase())){
      delete sessions[userKey]; saveSessions(sessions);
      return reply(`*✅ Session cleared*\nNew session started.\n\n${BRAND}`);
    }
    if(rawQ.toLowerCase()==='history'){
      const sess=sessions[userKey];
      if(!sess?.history?.length) return reply(`*No history*\nUse ${prefix}llama build a todo app`);
      let hist=sess.history.map((h,i)=>`${i+1}. ${h.role}: ${h.content.slice(0,80)}`).join('\n');
      return reply(`*📜 History*\n${hist}\n\n${BRAND}`);
    }
    if(!rawQ){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({ image:tb }, { upload:conn.waUploadToServer }); thumb=md.imageMessage; } }catch{}
      const hasSess=!!sessions[userKey];
      const llama=`┏━━〔 💻 LlamaCoder 〕━━┓\n┃ AI App Builder\n┃ ${hasSess?'✅ Session active':'🆕 No session'}\n┃\n┃ ${prefix}llama build a todo app with React\n┃ ${prefix}llama add dark mode\n┃ ${prefix}llama history | clear\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{ title:"💻 LlamaCoder", hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{}) }, body:{ text:menu }, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"📝 Todo App",id:`${prefix}llama build a modern todo app with React Tailwind`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🧮 Calculator",id:`${prefix}llama build calculator glassmorphism`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{ react:{ text:"💻", key:mek.key } }).catch(()=>{});
    if(!sessions[userKey]) sessions[userKey]={ id:`llama_${Date.now()}_${m.sender.slice(-6)}`, history:[] };
    const sessionId=sessions[userKey].id;

    reply(`*💻 Building...*\n*Prompt:* ${rawQ.slice(0,120)}\n*Session:* ${sessionId}\n_Wait 20-60s..._\n_${BRAND}_`);

    const { data } = await axios.post(API, {
      prompt: rawQ,
      session_id: sessionId,
      history: sessions[userKey].history
    }, { timeout:180000, headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'} });

    let appCode=data.data?.code||data.data?.result||data.data?.html||data.code||data.result||data.html||data.response;
    let previewUrl=data.data?.preview_url||data.preview_url||data.url;
    let explanation=data.data?.explanation||data.explanation||"";
    if(typeof appCode!=='string') appCode=JSON.stringify(appCode||data).slice(0,8000);

    sessions[userKey].history.push({ role:"user", content:rawQ });
    sessions[userKey].history.push({ role:"assistant", content:appCode.slice(0,1000) });
    if(sessions[userKey].history.length>30) sessions[userKey].history=sessions[userKey].history.slice(-30);
    saveSessions(sessions);

    if(appCode.length>3500){
      const fileName=`LlamaCoder-${Date.now()}.html`;
      const filePath=path.join(TMP_DIR, fileName);
      fs.writeFileSync(filePath, appCode);
      await conn.sendMessage(from,{
        document:{ url:filePath }, mimetype:'text/html', fileName,
        caption:`*✅ App Built*\n*Prompt:* ${rawQ}\n${explanation?`Info: ${explanation.slice(0,200)}\n`:''}${previewUrl?`Preview: ${previewUrl}\n`:''}*Session:* ${sessionId}\n*Next:* ${prefix}llama add dark mode\n\n${BRAND}`,
        contextInfo:ctx
      },{quoted:mek});
      try{ fs.unlinkSync(filePath); }catch{}
      await conn.sendMessage(from,{ text:`*💻 Preview:*\n\`\`\`html\n${appCode.slice(0,3000)}\n\`\`\`` },{quoted:mek});
    }else{
      let finalText=`*✅ App Built*\n*Prompt:* ${rawQ}\n${explanation?`Info: ${explanation}\n`:''}\n\`\`\`html\n${appCode}\n\`\`\`\n\n${previewUrl?`Preview: ${previewUrl}\n`:''}*Next:* ${prefix}llama add dark mode\n\n${BRAND}`;
      if(finalText.length>4000) finalText=finalText.slice(0,4000);
      await conn.sendMessage(from,{ text:finalText, contextInfo:ctx },{quoted:mek});
    }
    await conn.sendMessage(from,{ react:{ text:"✅", key:mek.key } }).catch(()=>{});
  }catch(e){
    console.error('LlamaCoder Error:', e.response?.data||e.message);
    reply(`*❌ LlamaCoder Failed*\n${e.response?.data?.message||e.message}\nTry:.llama build a simple todo app`);
  }
});    const inter = mek.message?.interactiveResponseMessage;
    if (inter?.nativeFlowResponseMessage?.paramsJson) {
        try {
            const p = JSON.parse(inter.nativeFlowResponseMessage.paramsJson);
            if (p.id) rawQ = p.id.replace(prefix,"").trim();
        } catch {}
    }
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        rawQ = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,"").trim();
    }
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`, 'i'), '').trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    const userKey = m.sender;

    if (rawQ.toLowerCase() === 'clear' || rawQ.toLowerCase() === 'reset' || rawQ.toLowerCase() === 'new') {
        delete sessions[userKey];
        saveSessions(sessions);
        return reply(`*✅ LlamaCoder session cleared*\nNew app session started.\n\n${BRAND}`);
    }

    if (rawQ.toLowerCase() === 'history') {
        const sess = sessions[userKey];
        if (!sess ||!sess.history || sess.history.length === 0) return reply(`*No history yet*\nUse ${prefix}llama build a todo app`);
        let hist = sess.history.map((h,i)=> `${i+1}. ${h.role}: ${h.content.slice(0,80)}`).join('\n');
        return reply(`*📜 LlamaCoder History*\nSession: ${sess.id}\n\n${hist}\n\n${BRAND}`);
    }

    if (!rawQ) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const hasSess =!!sessions[userKey];
        const menu = `┏━━〔 💻 LlamaCoder 〕━━┓
┃ AI Full-stack App Builder
┃ ${hasSess? '✅ Session active' : '🆕 No session'}
┃
┃ Build complete web apps from prompt
┃ Then iterate with follow-ups
┃
┃ *Usage:*
┃ ${prefix}llama build a todo app with React
┃ ${prefix}llama build a calculator with dark mode
┃ ${prefix}llama add login page to it
┃ ${prefix}llama make it responsive
┃ ${prefix}llama history - view edits
┃ ${prefix}llama clear - new app
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📝 Todo App", id: `${prefix}llama build a modern todo app with React, Tailwind, add/delete, dark mode` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🧮 Calculator", id: `${prefix}llama build a calculator web app with glassmorphism design` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌐 Portfolio", id: `${prefix}llama build a portfolio website for a developer, responsive, dark mode` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "💻 LlamaCoder • App Builder", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "💻", key: mek.key } });

    if (!sessions[userKey]) sessions[userKey] = { id: `llama_${Date.now()}_${m.sender.slice(-6)}`, history: [] };
    const sessionId = sessions[userKey].id;

    reply(`*💻 LlamaCoder building...*\n*Prompt:* ${rawQ.slice(0,120)}\n*Session:* ${sessionId}\n\n_Wait 20-60 sec for full app code..._\n\n_${BRAND}_`);

    // POST - Session-based
    const payload = {
        prompt: rawQ,
        message: rawQ,
        text: rawQ,
        query: rawQ,
        sessionId: sessionId,
        session_id: sessionId,
        action: "build",
        mode: "build",
        history: sessions[userKey].history
    };

    const { data } = await axios.post(API, payload, {
        timeout: 180000,
        headers: { 'Content-Type': 'application/json' }
    });

    // Parse response - usually returns code + preview
    let appCode = data.data?.code || data.data?.result || data.data?.html || data.code || data.result || data.html || data.response;
    let previewUrl = data.data?.preview_url || data.data?.url || data.preview_url || data.url;
    let explanation = data.data?.explanation || data.explanation || "";

    if (typeof appCode!== 'string') appCode = JSON.stringify(appCode || data).slice(0,8000);

    // Save history
    sessions[userKey].history.push({ role: "user", content: rawQ });
    sessions[userKey].history.push({ role: "assistant", content: appCode.slice(0,1000) });
    if (sessions[userKey].history.length > 30) sessions[userKey].history = sessions[userKey].history.slice(-30);
    saveSessions(sessions);

    // If code too long, send as file
    if (appCode.length > 3500) {
        const fileName = `LlamaCoder-${Date.now()}.html`;
        const filePath = `./${fileName}`;
        fs.writeFileSync(filePath, appCode);

        await conn.sendMessage(from, {
            document: { url: filePath },
            mimetype: 'text/html',
            fileName: fileName,
            caption: `*✅ App Built*\n*Prompt:* ${rawQ}\n${explanation? `*Info:* ${explanation.slice(0,200)}\n` : ''}${previewUrl? `*Preview:* ${previewUrl}\n` : ''}*Session:* ${sessionId}\n*Next:* ${prefix}llama add dark mode\n\n${BRAND}`,
            contextInfo: ctx
        }, { quoted: mek });

        try { fs.unlinkSync(filePath); } catch {}

        // Also send first part as text preview
        await conn.sendMessage(from, {
            text: `*💻 Code Preview (first 3000 chars):*\n\n\`\`\`html\n${appCode.slice(0,3000)}\n\`\`\`\n\n_Full code sent as file above_\n_Type ${prefix}llama add [feature] to iterate_`,
            contextInfo: ctx
        }, { quoted: mek });

    } else {
        let finalText = `*✅ App Built*\n\n*Prompt:* ${rawQ}\n${explanation? `*Info:* ${explanation}\n` : ''}\n*Code:*\n\`\`\`html\n${appCode}\n\`\`\`\n\n${previewUrl? `*Preview:* ${previewUrl}\n` : ''}*Next iteration:* ${prefix}llama add dark mode to it\n\n${BRAND}`;

        if (finalText.length > 4000) finalText = finalText.slice(0,4000);

        await conn.sendMessage(from, {
            text: finalText,
            contextInfo: ctx
        }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('LlamaCoder Error:', e.response?.data || e.message);
    reply(`*❌ LlamaCoder Failed*\n${e.response?.data?.message || e.message}\n\nTry: ${prefix}llama build a simple todo app`);
  }
});
