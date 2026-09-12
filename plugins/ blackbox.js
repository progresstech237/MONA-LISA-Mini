const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Blackbox';

let sessions = {};

function getThumbBuffer() {
    try {
        const paths = ['./media/menu1.png','./media/menu2.png','./media/menu3.png'];
        for (const p of paths) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
    } catch {}
    return null;
}

function cleanQuery(raw, prefix, patterns){
    let q = (raw || "").trim();
    if(!q) return "";
    // From buttons/list
    if(q.startsWith(prefix)){
        q = q.slice(prefix.length).trim();
        const regex = new RegExp(`^(${patterns.join('|')})\\b\\s*`, 'i');
        q = q.replace(regex, '').trim();
    }
    return q;
}

cmd({
  pattern: "blackbox",
  alias: ["bbox", "bb", "blackai"],
  react: "📦",
  desc: "Blackbox AI - 80+ models with memory",
  category: "progresstech ai",
  use: ".blackbox hi |.blackbox clear",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  const senderId = m?.sender || mek?.key?.participant || mek?.key?.remoteJid || from;
  try {
    let rawQ = q || "";
    try{
        const inter = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if(inter){ const p = JSON.parse(inter); if(p.id) rawQ = p.id; }
        const listId = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if(listId) rawQ = listId;
    }catch{}

    rawQ = cleanQuery(rawQ, prefix, ["blackbox","bbox","bb","blackai"]);

    const ctx = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    if (['clear','reset','new','delete'].includes(rawQ.toLowerCase())) {
        delete sessions[senderId];
        return await reply(`*✅ Session cleared*\nNew chat started.\n\n${BRAND}`);
    }

    if (!rawQ) {
        let thumbMsg = null;
        try{
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if(buf){
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumbMsg = media.imageMessage;
            }
        }catch(e){ console.log("Thumb error:", e.message); }

        const blackbox = `┏━━〔 📦 Blackbox AI 〕━━┓
┃ 🤖 80+ Models with Memory
┃ 💬 Multi-turn Chat
┃
┃ *Usage:*
┃ ${prefix}blackbox write a WhatsApp bot
┃ ${prefix}blackbox clear - reset chat
┗━━━━━━━━━━━━━━┛`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🚀 Start Chat", id: `${prefix}blackbox Hello` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💻 Code Help", id: `${prefix}blackbox write a JS function` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "📦 Blackbox AI", hasMediaAttachment:!!thumbMsg,...(thumbMsg? { imageMessage: thumbMsg } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    try{ await conn.sendMessage(from, { react: { text: "💭", key: mek.key } }); }catch{}

    if (!sessions[senderId]) sessions[senderId] = { id: `sess_${senderId.replace(/\D/g,'').slice(-10)}_${Date.now()}`, history: [] };

    const payload = {
        prompt: rawQ,
        message: rawQ,
        text: rawQ,
        sessionId: sessions[senderId].id,
        userId: senderId
    };

    const { data } = await axios.post(API, payload, { timeout: 45000, headers: { 'Content-Type': 'application/json' } });

    let answer = data?.data?.result || data?.result || data?.answer || data?.message || data?.response || data?.data;
    if (typeof answer!== 'string') answer = answer? JSON.stringify(answer, null, 2).slice(0, 3500) : null;
    if (!answer) throw new Error('API returned empty response - API may be down');

    sessions[senderId].history.push({ role: "user", content: rawQ });
    if (sessions[senderId].history.length > 20) sessions[senderId].history = sessions[senderId].history.slice(-20);

    await conn.sendMessage(from, {
        text: `*📦 Blackbox AI*\n\n${answer}\n\n_${BRAND}_\nType *${prefix}blackbox clear* for new chat`,
        contextInfo: ctx
    }, { quoted: mek });

    try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}

  } catch (e) {
    console.error('BLACKBOX ERROR:', e.response?.data || e.stack);
    const err = e.response?.data? JSON.stringify(e.response.data).slice(0,400) : e.message;
    await reply(`*❌ Blackbox Failed*\n${err}\n\nTry again:.blackbox hello\nIf still fails, api.omegatech.app is down.`);
    try{ await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); }catch{}
  }
});
