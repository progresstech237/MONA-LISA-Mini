const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Claude-Off';
const SESSION_FILE = './data/claude-off-sessions.json';

// Ensure data dir
if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

function loadSessions() {
    try { if (fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); } catch {}
    return {};
}
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

async function getFileBuffer(mek, conn) {
    try {
        const q = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const doc = q?.documentMessage || q?.imageMessage || mek.message?.documentMessage || mek.message?.imageMessage;
        if (!doc) return null;
        const buf = await conn.downloadMediaMessage({ message: q? { documentMessage: doc } : { documentMessage: doc } }).catch(async () => {
            return await conn.downloadMediaMessage({ message: q? { imageMessage: doc } : { imageMessage: doc } });
        });
        const fileName = doc.fileName || 'image.jpg';
        const mimetype = doc.mimetype || 'image/jpeg';
        return { buffer: buf, fileName, mimetype };
    } catch { return null; }
}

cmd({
  pattern: "claudeoff",
  alias: ["claude-off", "claudeoffi", "coff"],
  react: "🟣",
  desc: "Full Claude Official with magic link, files, search, artifacts",
  category: "progresstech ai",
  use: ".claudeoff auth <email> |.claudeoff <prompt> | reply file.claudeoff analyze this pdf",
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

    if (rawQ.toLowerCase().startsWith('auth ')) {
        const email = rawQ.slice(5).trim();
        if (!email.includes('@')) return reply(`*❌ Invalid email*\nUsage: ${prefix}claudeoff auth your@gmail.com`);

        await conn.sendMessage(from, { react: { text: "🔗", key: mek.key } });
        reply(`*🔗 Authenticating Claude Off...*\nEmail: ${email}\nCheck your inbox for magic link`);

        try {
            const { data } = await axios.post(API, {
                action: "auth",
                email: email,
                mode: "magic_link"
            }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });

            const sessionId = data.data?.sessionId || data.sessionId || data.data?.session_id || data.session_id;
            const authUrl = data.data?.authUrl || data.authUrl || data.data?.magic_link;

            if (sessionId) {
                sessions[userKey] = { sessionId, email, created: Date.now() };
                saveSessions(sessions);
                return reply(`*✅ Claude-Off Authenticated*\nSessionId saved: ${sessionId.slice(0,20)}...\n\nNow use: ${prefix}claudeoff hello`);
            }
            if (authUrl) {
                return reply(`*📧 Magic Link Sent*\nOpen this link from your email:\n${authUrl}\n\nAfter clicking, send: ${prefix}claudeoff auth ${email}`);
            }
            return reply(`*Response:* ${JSON.stringify(data).slice(0,1000)}`);
        } catch (e) {
            return reply(`*Auth Failed:* ${e.response?.data?.message || e.message}`);
        }
    }

    if (rawQ.toLowerCase() === 'logout' || rawQ.toLowerCase() === 'clear' || rawQ.toLowerCase() === 'reset') {
        delete sessions[userKey];
        saveSessions(sessions);
        return reply(`*✅ Session cleared*\nRe-auth with ${prefix}claudeoff auth <email>`);
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

        const hasSession =!!sessions[userKey];
        const menu = `┏━━〔 🟣 Claude-Off Official 〕━━┓
┃ Full Claude with Magic Link
┃ ${hasSession? '✅ Authenticated' : '❌ Not Authenticated'}
┃
┃ Features:
┃ • Chat with streaming
┃ • Upload PDFs / images / docs
┃ • Web search & artifacts
┃ • Session-based
┃
┃ *Setup (once):*
┃ ${prefix}claudeoff auth your@gmail.com
┃
┃ *Usage after auth:*
┃ ${prefix}claudeoff what is quantum?
┃ Reply PDF + ${prefix}claudeoff summarize this
┃ ${prefix}claudeoff search latest news about AI
┃ ${prefix}claudeoff logout
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: hasSession? "💬 Chat" : "🔗 Auth Login", id: hasSession? `${prefix}claudeoff Hello` : `${prefix}claudeoff auth ` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📄 Upload PDF", id: `${prefix}claudeoff analyze this file` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌐 Web Search", id: `${prefix}claudeoff search latest tech news` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🟣 Claude Off • Official Client", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    // Need session
    if (!sessions[userKey]?.sessionId) {
        return reply(`*❌ Not authenticated*\nFirst do:\n${prefix}claudeoff auth your@gmail.com\n\nThen check email magic link, then try again.`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const fileData = await getFileBuffer(mek, conn);
    const sessionId = sessions[userKey].sessionId;

    let payload = {
        action: "chat",
        prompt: rawQ,
        message: rawQ,
        text: rawQ,
        sessionId: sessionId,
        session_id: sessionId,
        query: rawQ,
        mode: "chat",
        stream: false,
        search: rawQ.toLowerCase().includes('search') || rawQ.toLowerCase().includes('latest'),
        artifacts: true
    };

    if (fileData) {
        payload.file_base64 = fileData.buffer.toString('base64');
        payload.fileName = fileData.fileName;
        payload.mimetype = fileData.mimetype;
        payload.file = `data:${fileData.mimetype};base64,${payload.file_base64}`;
        payload.action = "upload_and_chat";
        reply(`*📎 File detected:* ${fileData.fileName} - uploading...`);
    }

    const { data } = await axios.post(API, payload, {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
    });

    let answer = data.data?.result || data.data?.response || data.result || data.response || data.answer || data.message;
    const artifactUrl = data.data?.artifact_url || data.artifact_url;
    const webResults = data.data?.web_search || data.web_search;

    if (typeof answer!== 'string') answer = JSON.stringify(answer || data).slice(0,4000);

    let finalText = `*🟣 Claude-Off*\n\n${answer}\n\n${BRAND}`;
    if (artifactUrl) finalText += `\n\n*📦 Artifact:* ${artifactUrl}`;
    if (webResults) finalText += `\n\n*🌐 Web:* searched`;

    await conn.sendMessage(from, { text: finalText, contextInfo: ctx }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Claude-Off Error:', e.response?.data || e.message);
    reply(`*❌ Claude-Off Failed*\n${e.response?.data?.message || e.message}\n\nIf session expired, do ${prefix}claudeoff auth <email> again`);
  }
});