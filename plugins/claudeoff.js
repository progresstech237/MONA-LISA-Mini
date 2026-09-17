const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BRAND = '🔹 Powered by Progress Tech';
const API = 'https://omegatech-api.dixonomega.tech/api/ai/Claude-Off';
const SESSION_FILE = path.join(__dirname, '../data/claude-off-sessions.json');

try { const dir = path.dirname(SESSION_FILE); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch {}

function loadSessions() { try { if (fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); } catch {} return {}; }
function saveSessions(s) { try { fs.writeFileSync(SESSION_FILE, JSON.stringify(s, null, 2)); } catch {} }

let sessions = loadSessions();

cmd({
  pattern: "claudeoff",
  alias: ["claude-off", "coff"],
  react: "🟣",
  desc: "Claude Off Official - magic link auth",
  category: "progresstech ai",
  use: ".claudeoff auth email |.claudeoff verify 698830 |.claudeoff hello",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = (q || "").trim();
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`, 'i'), '').trim();
    const userKey = m.sender;

    // AUTH STEP 1: send_magic_link
    if (rawQ.toLowerCase().startsWith('auth ')) {
        const email = rawQ.slice(5).trim();
        if (!email.includes('@')) return reply(`*❌ Invalid email*\n${prefix}claudeoff auth danielheart12332@gmail.com`);

        await conn.sendMessage(from, { react: { text: "📧", key: mek.key } });
        await reply(`*📧 Sending code to ${email}...*`);

        try {
            const url = `${API}?action=send_magic_link&email=${encodeURIComponent(email)}`;
            const { data } = await axios.get(url, { timeout: 30000 });

            // From your screenshot: returns sessionId even on send
            if (data.success && data.sessionId) {
                sessions[userKey] = { email, tempSessionId: data.sessionId, verified: false };
                saveSessions(sessions);
                return reply(`*✅ Code sent to ${email}*\n*Check inbox - 6 digit code*\n\nNow do:\n*${prefix}claudeoff verify 123456*\n\nTemp Session: ${data.sessionId.slice(0,8)}...`);
            }
            return reply(`*Response:* ${JSON.stringify(data).slice(0,1000)}`);
        } catch (e) {
            return reply(`*❌ Send failed:* ${e.response?.data?.message || e.message}\nURL: ${API}?action=send_magic_link`);
        }
    }

    // AUTH STEP 2: verify_magic_link - THIS IS WHAT YOU MISSED
    if (rawQ.toLowerCase().startsWith('verify ')) {
        const code = rawQ.slice(7).trim();
        if (!sessions[userKey]?.email) return reply(`*❌ No email found.* Do ${prefix}claudeoff auth your@gmail.com first`);
        if (code.length!== 6) return reply(`*❌ Code must be 6 digits.* You sent: ${code}`);

        const email = sessions[userKey].email;
        await reply(`*🔐 Verifying code ${code} for ${email}...*`);

        try {
            const url = `${API}?action=verify_magic_link&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
            const { data } = await axios.get(url, { timeout: 30000 });

            // Final sessionId after verify
            const finalSessionId = data.sessionId || data.data?.sessionId || data.session_id;
            if (finalSessionId) {
                sessions[userKey] = { email, sessionId: finalSessionId, verified: true, created: Date.now() };
                saveSessions(sessions);
                return reply(`*✅ VERIFIED!*\n*Session saved: ${finalSessionId.slice(0,15)}...*\n\nNow chat:\n${prefix}claudeoff hello\n${prefix}claudeoff what is AI?`);
            }
            // Some APIs return success but sessionId in same temp
            if (data.success) {
                sessions[userKey].verified = true;
                sessions[userKey].sessionId = sessions[userKey].tempSessionId || data.sessionId;
                saveSessions(sessions);
                return reply(`*✅ Verified!* You can now chat:\n${prefix}claudeoff hello`);
            }

            return reply(`*Verify response:* ${JSON.stringify(data).slice(0,1000)}`);
        } catch (e) {
            return reply(`*❌ Verify failed:* ${e.response?.data?.message || e.response?.data?.error || e.message}\nCode might be expired. Do ${prefix}claudeoff auth again`);
        }
    }

    if (['logout','clear','reset'].includes(rawQ.toLowerCase())) {
        delete sessions[userKey];
        saveSessions(sessions);
        return reply(`*✅ Logged out.* Do ${prefix}claudeoff auth email again`);
    }

    if (!rawQ) {
        const s = sessions[userKey];
        return reply(`*🟣 Claude-Off Menu*\n\nStatus: ${s?.verified? `✅ Verified as ${s.email}` : s?.email? `⏳ Code sent to ${s.email}, verify now` : '❌ Not authed'}\n\n*Setup:*\n1. ${prefix}claudeoff auth your@gmail.com\n2. Check email code (like 698830)\n3. ${prefix}claudeoff verify 698830\n\n*Chat:*\n${prefix}claudeoff what is quantum?\n${prefix}claudeoff create_conversation\n${prefix}claudeoff get_conversations\n${prefix}claudeoff logout`);
    }

    // CHAT
    const sess = sessions[userKey];
    if (!sess?.sessionId &&!sess?.tempSessionId) return reply(`*❌ Not authed.*\n1. ${prefix}claudeoff auth your@gmail.com\n2. ${prefix}claudeoff verify <code from email>`);

    const sessionId = sess.sessionId || sess.tempSessionId;

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    try {
        // chat = create new conversation + send message
        const url = `${API}?action=chat&sessionId=${encodeURIComponent(sessionId)}&prompt=${encodeURIComponent(rawQ)}`;
        const { data } = await axios.get(url, { timeout: 90000 });

        const answer = data.response || data.message || data.result || data.data?.response || JSON.stringify(data).slice(0,3000);
        const convoId = data.conversationId || data.conversation_id;

        let txt = `*🟣 Claude-Off*\n\n${answer}\n\n${BRAND}`;
        if (convoId) {
            // save convo for continue
            sess.lastConversationId = convoId;
            saveSessions(sessions);
            txt += `\n\n*ConvoID:* ${convoId.slice(0,8)}...`;
        }

        await conn.sendMessage(from, { text: txt }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error('Chat err', e.response?.data || e.message);
        reply(`*❌ Chat failed:* ${e.response?.data?.message || e.message}\nIf session expired, do auth again.`);
    }

  } catch (e) {
    console.error(e);
    reply(`*❌ Error:* ${e.message}`);
  }
});
