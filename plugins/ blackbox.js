const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';

let sessions = {}; // session memory per user

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png','./media/menu-main.jpg']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "blackbox",
  alias: ["bbox", "bb", "blackai"],
  react: "📦",
  desc: "Blackbox AI - 80+ models with memory",
  category: "progresstech ai",
  use: ".blackbox hi | .blackbox clear",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    // ✅ Fix button clicks
    let rawQ = q || "";
    const inter = mek.message?.interactiveResponseMessage;
    if (inter?.nativeFlowResponseMessage?.paramsJson) {
        try {
            const p = JSON.parse(inter.nativeFlowResponseMessage.paramsJson);
            if (p.id) rawQ = p.id.replace(prefix,"").trim();
        } catch {}
    }
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        rawQ = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,"").trim();
    }
    if (rawQ.startsWith(prefix)) rawQ = rawQ.slice(prefix.length);

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    // Clear session
    if (rawQ.toLowerCase() === 'clear' || rawQ.toLowerCase() === 'reset' || rawQ.toLowerCase() === 'new') {
        delete sessions[m.sender];
        return reply(`*✅ Session cleared*\nNew chat started.\n\n${BRAND}`);
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

        const menu = `┏━━〔 📦 Blackbox AI 〕━━┓
┃ 🤖 80+ Models with Memory
┃ 💬 Multi-turn Chat
┃ 
┃ *Usage:*
┃ ${prefix}blackbox <question>
┃ ${prefix}blackbox clear - new chat
┃
┃ Example:
┃ ${prefix}blackbox write me a WhatsApp bot plugin
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🚀 Start Chat", id: `${prefix}blackbox Hello, who are you?` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💻 Code Help", id: `${prefix}blackbox write a JS function for...` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "📦 Blackbox AI • Progress Tech", hasMediaAttachment: !!thumb, ...(thumb ? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "💭", key: mek.key } });

    // Session ID per user for memory
    if (!sessions[m.sender]) sessions[m.sender] = { id: `sess_${m.sender.replace(/[^0-9]/g,'').slice(-8)}_${Date.now()}`, history: [] };
    const sessionId = sessions[m.sender].id;

    // ✅ POST as per your screenshot (GET + POST Working)
    const payload = {
        prompt: rawQ,
        message: rawQ,
        text: rawQ,
        sessionId: sessionId,
        session_id: sessionId,
        userId: m.sender,
        action: "chat"
    };

    const { data } = await axios.post('https://api.omegatech.app/api/ai/Blackbox', payload, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
    });

    let answer = data.data?.result || data.result || data.data?.answer || data.answer || data.message || data.response || data.data;
    if (typeof answer !== 'string') answer = JSON.stringify(answer).slice(0, 3500);

    // Save to history
    sessions[m.sender].history.push({ role: "user", content: rawQ });
    sessions[m.sender].history.push({ role: "assistant", content: answer });

    // Keep only last 10 turns to avoid too long
    if (sessions[m.sender].history.length > 20) sessions[m.sender].history = sessions[m.sender].history.slice(-20);

    await conn.sendMessage(from, {
        text: `*📦 Blackbox AI*\n\n${answer}\n\n_${BRAND}_\nType *${prefix}blackbox clear* for new chat`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Blackbox Error:', e.response?.data || e.message);
    reply(`*❌ Blackbox Failed*\n${e.response?.data?.message || e.message}\n\nTry: ${prefix}blackbox hello`);
  }
});