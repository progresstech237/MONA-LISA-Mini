const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Argen';

let argenSessions = {};

function getThumbBuffer() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
    } catch {}
    return null;
}

function cleanQuery(raw, prefix, patterns) {
    let q = (raw || "").trim();
    if (!q) return "";
    if (q.startsWith(prefix)) {
        q = q.slice(prefix.length).trim();
        q = q.replace(new RegExp(`^(${patterns.join('|')})\\b\\s*`, 'i'), '').trim();
    }
    return q;
}

async function callArgen(prompt) {
    // Try GET first like your screenshot, then POST fallback
    try {
        const url = `${API}?action=ask&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(url, { timeout: 45000 });
        return data;
    } catch (e) {
        // POST fallback if GET fails
        const { data } = await axios.post(API, {
            action: "ask",
            prompt: prompt,
            text: prompt,
            message: prompt
        }, { timeout: 45000, headers: { 'Content-Type': 'application/json' } });
        return data;
    }
}

cmd({
  pattern: "argen",
  alias: ["argenai", "aiargen"],
  react: "🤖",
  desc: "Argen AI - Progress Tech",
  category: "progresstech ai",
  use: ".argen hi |.argen login",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  const senderId = m?.sender || mek?.key?.participant || mek?.key?.remoteJid || from;
  try {
    let rawQ = q || "";
    try {
        const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if (p1) { const j = JSON.parse(p1); if (j.id) rawQ = j.id; }
        const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if (p2) rawQ = p2;
    } catch {}

    // THIS FIXES YOUR BUTTON BUG
    let cleaned = cleanQuery(rawQ, prefix, ["argen","argenai","aiargen"]);
    // If rawQ was just from q (not button), clean that too
    if(!cleaned && q) cleaned = cleanQuery(q, prefix, ["argen","argenai","aiargen"]);
    if(!cleaned) cleaned = (rawQ || "").trim(); // fallback

    // If after cleaning it's still "login" or empty, show menu
    const sub = cleaned.split(' ')[0]?.toLowerCase() || '';

    const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 142,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    if (sub === 'login' ||!cleaned || ['help','menu'].includes(sub)) {
        let thumbMsg = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if (buf) {
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumbMsg = media.imageMessage;
            }
        } catch (e) { console.log("Thumb error:", e.message); }

        const menuText = `┏━━〔 🤖 Argen AI Login 〕━━┓
┃ 👋 Welcome to Argen AI
┃
┃ 📌 *How to use:*
┃ • ${prefix}argen <your question>
┃ • Example: ${prefix}argen explain quantum physics
┃ • ${prefix}argen login - this menu
┗━━━━━━━━━━━━━━┛`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🚀 Start Chat", id: `${prefix}argen Hello, who are you?` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💡 Business Ideas", id: `${prefix}argen give me 5 business ideas` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🤖 Argen AI • Progress Tech", hasMediaAttachment:!!thumbMsg,...(thumbMsg? { imageMessage: thumbMsg } : {}) },
                body: { text: menuText },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo
        }, {});
    }

    try { await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } }); } catch {}

    const result = await callArgen(cleaned);

    let answer = result?.data?.result || result?.result || result?.data?.answer || result?.answer || result?.message || result?.response || result?.data;
    if (typeof answer!== 'string') {
        answer = answer? JSON.stringify(answer, null, 2).slice(0, 3500) : "No response from Argen API";
    }
    if (!answer) throw new Error("Empty response - check https://api.omegatech.app/api.html");

    // Save session with cleanup
    argenSessions[senderId] = { lastPrompt: cleaned, lastAnswer: answer, time: Date.now() };
    // Keep only 100 sessions max
    const keys = Object.keys(argenSessions);
    if (keys.length > 100) delete argenSessions[keys[0]];

    await conn.sendMessage(from, {
        text: `*🤖 Argen AI*\n\n${answer}\n\n_${BRAND}_\n📢 ${CHANNEL_LINK}`,
        contextInfo
    }, { quoted: mek });

    try { await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); } catch {}

  } catch (e) {
    console.error('Argen Error:', e.response?.data || e.stack);
    try { await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); } catch {}
    const msg = e.response?.data? JSON.stringify(e.response.data).slice(0,400) : e.message;
    await reply(`*❌ Argen Failed*\n${msg}\n\nCheck API docs: https://api.omegatech.app/api.html\n\n${BRAND}`);
  }
});
