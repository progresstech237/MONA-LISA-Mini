const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/wrmgpt';
const SESSION_FILE = './data/wrmgpt-sessions.json';

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
  pattern: "wrmgpt",
  alias: ["wormgpt", "worm", "wrm", "wrmai"],
  react: "🪱",
  desc: "Chat with WRMGPT v5.5 - Fast direct AI via SSE streaming",
  category: "progresstech ai",
  use: ".wrmgpt hello |.wrmgpt write code |.wrmgpt clear",
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
        return reply(`*✅ WRMGPT session cleared*\nNew session started.\n\n${BRAND}`);
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
        const menu = `┏━━〔 🪱 WRMGPT v5.5 〕━━┓
┃ Chat with WRMGPT (wormgpt-v5.5)
┃ Fast, direct AI via SSE streaming
┃ ${hasSess? '✅ Session active' : '🆕 No session'}
┃
┃ *Usage:*
┃ ${prefix}wrmgpt hello
┃ ${prefix}wrmgpt write a WhatsApp bot code
┃ ${prefix}wrmgpt explain hacking concepts
┃ ${prefix}wrmgpt clear - new session
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💬 Chat", id: `${prefix}wrmgpt hello, what can you do?` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💻 Code Help", id: `${prefix}wrmgpt write a Node.js function to generate random password` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔄 Clear", id: `${prefix}wrmgpt clear` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🪱 WRMGPT v5.5 • WormGPT", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🪱", key: mek.key } });
    await conn.sendPresenceUpdate('composing', from);

    if (!sessions[userKey]) sessions[userKey] = { id: `wrm_${Date.now()}_${m.sender.slice(-6)}`, history: [] };
    const sessionId = sessions[userKey].id;

    let finalAnswer = "";

    // Try POST with SSE handling
    try {
        const response = await axios.post(API, {
            prompt: rawQ,
            message: rawQ,
            text: rawQ,
            query: rawQ,
            question: rawQ,
            sessionId: sessionId,
            session_id: sessionId,
            history: sessions[userKey].history,
            stream: true
        }, {
            timeout: 90000,
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            responseType: 'text'
        });

        let dataText = response.data;

        // Parse SSE format
        if (typeof dataText === 'string' && dataText.includes('data:')) {
            const lines = dataText.split('\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const content = line.replace('data:', '').trim();
                    if (content === '[DONE]') break;
                    try {
                        const json = JSON.parse(content);
                        const token = json.choices?.[0]?.delta?.content || json.delta?.content || json.content || json.text || json.response || json.message || "";
                        finalAnswer += token;
                        if (typeof json === 'string') finalAnswer += json;
                    } catch {
                        // If not JSON, raw text token
                        if (content && content!== '[DONE]' &&!content.startsWith('{')) finalAnswer += content;
                        else {
                            try {
                                const j = JSON.parse(content);
                                finalAnswer += j.result || j.response || j.answer || j.message || "";
                            } catch { finalAnswer += content; }
                        }
                    }
                }
            }
        } else if (typeof dataText === 'string') {
            finalAnswer = dataText;
        }

        // If SSE parsing failed, try direct JSON
        if (!finalAnswer) {
            try {
                const json = typeof response.data === 'string'? JSON.parse(response.data) : response.data;
                finalAnswer = json.data?.result || json.data?.response || json.result || json.response || json.answer || json.message || "";
            } catch {}
        }

    } catch (e) {
        console.log('WRM POST stream failed', e.message);
        // Fallback GET
        try {
            const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&text=${encodeURIComponent(rawQ)}&sessionId=${sessionId}`, {
                timeout: 60000,
                headers: { 'Accept': 'text/event-stream, application/json' }
            });

            if (typeof data === 'string') {
                if (data.includes('data:')) {
                    const lines = data.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            const c = line.replace('data:', '').trim();
                            if (c!== '[DONE]') finalAnswer += c + " ";
                        }
                    }
                } else {
                    finalAnswer = data;
                }
            } else {
                finalAnswer = data.data?.result || data.result || data.response || data.data?.response || data.answer || "";
                if (!finalAnswer && typeof data.data === 'string') finalAnswer = data.data;
            }
        } catch (e2) {
            console.log('WRM GET failed', e2.message);
        }
    }

    // Second fallback - non-stream POST simple
    if (!finalAnswer) {
        try {
            const { data } = await axios.post(API, { prompt: rawQ, message: rawQ }, { timeout: 30000, headers: { 'Content-Type': 'application/json' } });
            finalAnswer = data.data?.result || data.result || data.response || data.data?.response || data.message || data.answer || "";
            if (!finalAnswer && typeof data.data === 'string') finalAnswer = data.data;
            if (!finalAnswer && typeof data === 'string') finalAnswer = data;
        } catch {}
    }

    if (!finalAnswer) throw new Error('No response from WRMGPT v5.5');

    // Clean SSE artifacts
    finalAnswer = finalAnswer.replace(/\[DONE\]/g, '').trim();

    // Save history
    sessions[userKey].history.push({ role: "user", content: rawQ });
    sessions[userKey].history.push({ role: "assistant", content: finalAnswer.slice(0,1000) });
    if (sessions[userKey].history.length > 20) sessions[userKey].history = sessions[userKey].history.slice(-20);
    saveSessions(sessions);

    // Send
    if (finalAnswer.length > 4000) {
        const chunks = finalAnswer.match(/.{1,3500}/gs);
        for (let i = 0; i < chunks.length; i++) {
            await conn.sendMessage(from, {
                text: `${i===0? `*🪱 WRMGPT v5.5:*\n\n` : ''}${chunks[i]}${i===chunks.length-1? `\n\n_${BRAND}_` : ''}`,
                contextInfo: ctx
            }, { quoted: i===0? mek : undefined });
            await new Promise(r => setTimeout(r, 300));
        }
    } else {
        await conn.sendMessage(from, {
            text: `*🪱 WRMGPT v5.5:*\n\n${finalAnswer}\n\n_${BRAND}_\nSession: ${sessionId.slice(0,15)}...`,
            contextInfo: ctx
        }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('WRMGPT Error:', e.response?.data || e.message);
    reply(`*❌ WRMGPT Failed*\n${e.message}\n\nTry: ${'.wrmgpt clear'} then ask again`);
  }
});