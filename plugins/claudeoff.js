const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Claude-Off';
const SESSION_FILE = './data/claude-off-sessions.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });

function loadSessions() {
    try { if (fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); } catch {}
    return {};
}
function saveSessions(s) {
    try { fs.writeFileSync(SESSION_FILE, JSON.stringify(s, null, 2)); }
    catch(e){ console.log('Save session fail:', e.message); }
}
let sessions = loadSessions();

function getThumbBuffer() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
    } catch {}
    return null;
}
function cleanQuery(raw, prefix, patterns){
    let q = (raw||"").trim();
    if(!q) return "";
    if(q.startsWith(prefix)){
        q = q.slice(prefix.length).trim();
        q = q.replace(new RegExp(`^(${patterns.join('|')})\\b\\s*`, 'i'), '').trim();
    }
    return q;
}

async function getFileBuffer(mek, conn) {
    try {
        const ctxInfo = mek.message?.extendedTextMessage?.contextInfo;
        const qMsg = ctxInfo?.quotedMessage;
        let targetMsg = null;
        let mimetype = '';

        if(qMsg?.documentMessage){ targetMsg = { message: { documentMessage: qMsg.documentMessage } }; mimetype = qMsg.documentMessage.mimetype; }
        else if(qMsg?.imageMessage){ targetMsg = { message: { imageMessage: qMsg.imageMessage } }; mimetype = 'image/jpeg'; }
        else if(mek.message?.documentMessage){ targetMsg = { message: { documentMessage: mek.message.documentMessage } }; mimetype = mek.message.documentMessage.mimetype; }
        else if(mek.message?.imageMessage){ targetMsg = { message: { imageMessage: mek.message.imageMessage } }; mimetype = 'image/jpeg'; }

        if(!targetMsg) return null;
        const buf = await conn.downloadMediaMessage(targetMsg, 'buffer', {}, { reuploadRequest: conn.updateMediaMessage });
        if(!buf || buf.length < 50) return null;

        const fileName = targetMsg.message.documentMessage?.fileName || targetMsg.message.imageMessage?.fileName || (mimetype.startsWith('image/')?'image.jpg':'file.pdf');
        return { buffer: buf, fileName, mimetype: mimetype || 'application/octet-stream' };
    } catch(e){ console.log('getFileBuffer err:', e.message); return null; }
}

cmd({
  pattern: "claudeoff",
  alias: ["claude-off", "coff"],
  react: "🟣",
  desc: "Full Claude Official with magic link, files, search",
  category: "progresstech ai",
  use: ".claudeoff auth <email> |.claudeoff <prompt>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  const sender = m?.sender || mek?.key?.participant || mek?.key?.remoteJid || from;
  try {
    let rawQ = q || "";
    try {
        const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if(p1){ const j = JSON.parse(p1); if(j.id) rawQ = j.id; }
        const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if(p2) rawQ = p2;
    } catch {}

    let cleaned = cleanQuery(rawQ, prefix, ["claudeoff","claude-off","coff"]);
    if(!cleaned) cleaned = cleanQuery(q, prefix, ["claudeoff","claude-off","coff"]);
    if(!cleaned) cleaned = (rawQ || q || "").trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };

    if (cleaned.toLowerCase().startsWith('auth ')) {
        const email = cleaned.slice(5).trim();
        if (!email.includes('@') ||!email.includes('.')) return await reply(`*❌ Invalid email*\nUsage: ${prefix}claudeoff auth your@gmail.com`);

        try{ await conn.sendMessage(from, { react: { text: "🔗", key: mek.key } }); }catch{}
        await reply(`*🔗 Authenticating Claude Off...*\nEmail: ${email}\nCheck inbox for magic link`);

        try {
            const { data } = await axios.post(API, { action: "auth", email, mode: "magic_link" }, { timeout: 60000, headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' } });
            const sessionId = data.data?.sessionId || data.sessionId || data.data?.session_id || data.session_id;
            const authUrl = data.data?.authUrl || data.authUrl || data.data?.magic_link || data.magic_link;

            if (sessionId) {
                sessions[sender] = { sessionId, email, created: Date.now() };
                saveSessions(sessions);
                return await reply(`*✅ Claude-Off Authenticated*\nSessionId: ${sessionId.slice(0,20)}...\n\nNow: ${prefix}claudeoff hello`);
            }
            if (authUrl) {
                return await reply(`*📧 Magic Link Sent*\nOpen link from email:\n${authUrl}\n\nAfter clicking, do: ${prefix}claudeoff auth ${email} again`);
            }
            return await reply(`*Response:* ${JSON.stringify(data).slice(0,1000)}`);
        } catch (e) {
            const msg = e.response?.data? JSON.stringify(e.response.data).slice(0,500) : e.message;
            return await reply(`*Auth Failed:* ${msg}`);
        }
    }

    if (['logout','clear','reset','exit'].includes(cleaned.toLowerCase())) {
        delete sessions[sender];
        saveSessions(sessions);
        return await reply(`*✅ Session cleared*\nRe-auth with ${prefix}claudeoff auth <email>\n${BRAND}`);
    }

    if (!cleaned) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if(buf){
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const hasSession =!!sessions[sender]?.sessionId;
        const claude = `┏━━〔 🟣 Claude-Off Official 〕━━┓
┃ ${hasSession? '✅ Authenticated - '+sessions[sender].email : '❌ Not Authenticated'}
┃
┃ Features: Chat, PDF, Search
┃
┃ *Setup (once):*
┃ ${prefix}claudeoff auth your@gmail.com
┃
┃ *Usage:*
┃ ${prefix}claudeoff what is quantum?
┃ Reply PDF + ${prefix}claudeoff summarize
┃ ${prefix}claudeoff search latest AI news
┃ ${prefix}claudeoff logout
┗━━━━━━━━━━━━━━┛`;

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🟣 Claude Off • Official", hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: {
                    buttons: [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: hasSession?"💬 Chat":"🔗 Auth", id: hasSession?`${prefix}claudeoff Hello`:`${prefix}claudeoff auth ` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📄 Analyze File", id: `${prefix}claudeoff analyze this file` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌐 Search", id: `${prefix}claudeoff search latest tech news` }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
                    ]
                }
            },
            contextInfo: ctx
        }, {});
    }

    if (!sessions[sender]?.sessionId) {
        return await reply(`*❌ Not authenticated*\nDo:\n${prefix}claudeoff auth your@gmail.com\n${BRAND}`);
    }

    try{ await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } }); }catch{}

    const fileData = await getFileBuffer(mek, conn);
    const sessionId = sessions[sender].sessionId;

    let payload = {
        action: fileData? "upload_and_chat" : "chat",
        prompt: cleaned, message: cleaned, text: cleaned, query: cleaned,
        sessionId, session_id: sessionId,
        mode: "chat", stream: false,
        search: cleaned.toLowerCase().includes('search') || cleaned.toLowerCase().includes('latest'),
        artifacts: true
    };

    if (fileData) {
        payload.file_base64 = fileData.buffer.toString('base64');
        payload.fileName = fileData.fileName;
        payload.mimetype = fileData.mimetype;
        payload.file = `data:${fileData.mimetype};base64,${payload.file_base64}`;
        await reply(`*📎 File:* ${fileData.fileName} (${(fileData.buffer.length/1024).toFixed(1)}KB) - uploading...`);
    }

    const { data } = await axios.post(API, payload, { timeout: 120000, headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' } });

    let answer = data.data?.result || data.data?.response || data.result || data.response || data.answer || data.message;
    const artifactUrl = data.data?.artifact_url || data.artifact_url;

    if (typeof answer!== 'string') answer = answer? JSON.stringify(answer).slice(0,4000) : JSON.stringify(data).slice(0,4000);
    if(!answer) answer = "Empty response - session may be expired, re-auth";

    // Auto-update session if expired
    if(answer.toLowerCase().includes('session expired') || answer.toLowerCase().includes('unauthorized')){
        delete sessions[sender];
        saveSessions(sessions);
    }

    let finalText = `*🟣 Claude-Off*\n\n${answer}\n\n_${BRAND}_`;
    if (artifactUrl) finalText += `\n\n📦 *Artifact:* ${artifactUrl}`;

    await conn.sendMessage(from, { text: finalText, contextInfo: ctx }, { quoted: mek });
    try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}

  } catch (e) {
    console.error('Claude-Off Error:', e.response?.data || e.stack);
    try{ await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); }catch{}
    const msg = e.response?.data? (typeof e.response.data === 'object'? JSON.stringify(e.response.data).slice(0,600) : e.response.data.toString().slice(0,600)) : e.message;
    await reply(`*❌ Claude-Off Failed*\n${msg}\n\nIf expired, do ${prefix}claudeoff auth <email> again\n${BRAND}`);
  }
});
