const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/zchat-agent';
const SESSION_FILE = './data/zchat-sessions.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
function loadSessions() { try { if (fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); } catch {} return {}; }
function saveSessions(s) { try { fs.writeFileSync(SESSION_FILE, JSON.stringify(s, null, 2)); } catch {} }

let sessions = loadSessions();

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "zchat",
  alias: ["zai", "z-chat", "zagent", "zchatagent"],
  react: "🤖",
  desc: "Chat with ZChat AI - auto scrapes fresh credentials per session",
  category: "progresstech ai",
  use: ".zchat hello |.zchat clear |.zchat who are you",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
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
        return reply(`*✅ ZChat session cleared*\nFresh credentials will be scraped on next chat.\n\n${BRAND}`);
    }

    if (!rawQ || rawQ.toLowerCase() === 'help' || rawQ.toLowerCase() === 'menu') {
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
        const menu = `┏━━〔 🤖 ZChat Agent 〕━━┓
┃ Chat with ZChat AI models
┃ Auto scrapes fresh creds per session
┃ ${hasSess? '✅ Session active' : '🆕 No session'}
┃
┃ *Usage:*
┃ ${prefix}zchat hello, how are you?
┃ ${prefix}zchat write me a poem about Mona Lisa
┃ ${prefix}zchat explain quantum computing
┃ ${prefix}zchat clear - new session + fresh creds
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💬 Hello", id: `${prefix}zchat hello, introduce yourself` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📝 Write Poem", id: `${prefix}zchat write a romantic poem about Mona Lisa afro girl` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔄 New Session", id: `${prefix}zchat clear` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🤖 ZChat Agent • ZChat AI", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🤖", key: mek.key } });

    if (!sessions[userKey]) sessions[userKey] = { id: `zchat_${Date.now()}_${m.sender.slice(-6)}`, history: [] };
    const sessionId = sessions[userKey].id;

    // Typing...
    await conn.sendPresenceUpdate('composing', from);

    let answer = null;

    // POST - main method
    try {
        const { data } = await axios.post(API, {
            prompt: rawQ,
            message: rawQ,
            text: rawQ,
            query: rawQ,
            question: rawQ,
            sessionId: sessionId,
            session_id: sessionId,
            history: sessions[userKey].history
        }, {
            timeout: 60000,
            headers: { 'Content-Type': 'application/json' }
        });

        answer = data.data?.result || data.data?.response || data.data?.answer || data.data?.message || data.result || data.response || data.answer || data.message || data.reply;

        if (!answer && typeof data.data === 'string') answer = data.data;
        if (!answer && typeof data === 'string') answer = data;

    } catch (e) {
        console.log('ZChat POST failed', e.response?.data || e.message);
        // GET fallback
        try {
            const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&text=${encodeURIComponent(rawQ)}&sessionId=${sessionId}`, { timeout: 60000 });
            answer = data.data?.result || data.data?.response || data.result || data.response || data.data?.message || data.message;
            if (!answer && typeof data.data === 'string') answer = data.data;
        } catch {}
    }

    if (!answer) throw new Error('No response from ZChat AI');

    // Save history (limit 20)
    sessions[userKey].history.push({ role: "user", content: rawQ });
    sessions[userKey].history.push({ role: "assistant", content: answer.slice(0,1000) });
    if (sessions[userKey].history.length > 20) sessions[userKey].history = sessions[userKey].history.slice(-20);
    saveSessions(sessions);

    // Send answer with long text handling
    if (answer.length > 4000) {
        const parts = answer.match(/.{1,3500}/gs);
        for (let i = 0; i < parts.length; i++) {
            await conn.sendMessage(from, {
                text: `${i===0? `*🤖 ZChat*\n\n` : ''}${parts[i]}${i===parts.length-1? `\n\n_${BRAND}_\n${CHANNEL_LINK}` : ''}`,
                contextInfo: ctx
            }, { quoted: i===0? mek : undefined });
            await new Promise(r => setTimeout(r, 500));
        }
    } else {
        await conn.sendMessage(from, {
            text: `*🤖 ZChat:*\n\n${answer}\n\n_${BRAND}_\nSession: ${sessionId.slice(0,15)}... | ${prefix}zchat clear for fresh creds`,
            contextInfo: ctx
        }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('ZChat Error:', e.response?.data || e.message);
    reply(`*❌ ZChat Failed*\n${e.response?.data?.message || e.message}\n\nTry: ${'.zchat clear'} then ask again (fresh creds)`);
  }
});