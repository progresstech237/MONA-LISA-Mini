const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/wan';
const SESSION_FILE = './data/wan-sessions.json';

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
  pattern: "wan",
  alias: ["wan22", "wanvideo", "wan2", "wan-ai"],
  react: "🎬",
  desc: "Generate AI videos using Wan 2.2 14B - polls if long job",
  category: "progresstech ai",
  use: ".wan a cat dancing |.wan session <id> |.wan myjobs",
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
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`, 'i'), '').trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    const userKey = m.sender;

    if (rawQ.toLowerCase().startsWith('session ') || rawQ.toLowerCase().startsWith('poll ')) {
        const sessId = rawQ.split(' ')[1];
        rawQ = sessId;
        // will poll below
    }

    if (rawQ.toLowerCase() === 'myjobs' || rawQ.toLowerCase() === 'jobs' || rawQ.toLowerCase() === 'history') {
        const jobs = sessions[userKey] || [];
        if (jobs.length === 0) return reply(`*No Wan jobs yet*\nUse: ${prefix}wan a cat astronaut dancing\n\n${BRAND}`);
        let list = jobs.map((j,i)=> `${i+1}. ${j.prompt.slice(0,50)}\n ID: ${j.sessionId}\n ${j.url? '✅ Done' : '⏳ Pending'}`).join('\n\n');
        return reply(`*🎬 Your Wan Jobs:*\n\n${list}\n\nPoll: ${prefix}wan session <sessionId>\n\n${BRAND}`);
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

        const menu = `┏━━〔 🎬 Wan 2.2 14B 〕━━┓
┃ Alibaba Wan 2.2 14B Video Model
┃ Short jobs = direct URL
┃ Long jobs = sessionId to poll
┃
┃ *Usage:*
┃ ${prefix}wan a cat dancing in space
┃ ${prefix}wan cinematic shot of Mona Lisa singing
┃ ${prefix}wan session <sessionId> - poll result
┃ ${prefix}wan myjobs - view jobs
┃
┃ *Note:* Auto polls if sessionId returned
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎬 Generate", id: `${prefix}wan cinematic shot of Mona Lisa afro girl singing, omah lay vibe, 4k` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🐱 Cat Astronaut", id: `${prefix}wan a cat astronaut dancing in zero gravity, cinematic 4k` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📜 My Jobs", id: `${prefix}wan myjobs` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎬 Wan 2.2 14B • Alibaba", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });

    // Check if rawQ looks like a sessionId (polling)
    const isSessionIdPoll = /^[a-zA-Z0-9_-]{20,}$/.test(rawQ) && rawQ.length > 20 &&!rawQ.includes(' ');

    let prompt = isSessionIdPoll? "" : rawQ;
    let sessionToPoll = isSessionIdPoll? rawQ : null;

    if (!isSessionIdPoll) reply(`*🎬 Wan 2.2 Generating...*\n*Prompt:* ${prompt.slice(0,120)}\n\n_Short jobs return video directly_\n_Long jobs return sessionId to poll - I'll auto poll_\n\n_${BRAND}_`);

    let videoUrl = null;
    let sessionId = sessionToPoll;

    // If we are polling an existing session
    if (sessionToPoll) {
        reply(`*⏳ Polling Wan job...*\nSession: ${sessionToPoll.slice(0,40)}...`);
    } else {
        // Initial generation - GET per your screenshot (GET Working)
        try {
            const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(prompt)}&text=${encodeURIComponent(prompt)}&query=${encodeURIComponent(prompt)}`, {
                timeout: 120000
            });

            videoUrl = data.data?.url || data.data?.video_url || data.data?.videoUrl || data.url || data.video_url || data.data?.result || data.result || data.data?.link;
            sessionId = data.data?.sessionId || data.data?.session_id || data.sessionId || data.session_id || data.data?.job_id || data.job_id;

            if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
            if (!videoUrl && typeof data === 'string' && data.startsWith('http')) videoUrl = data;

            // If data is object with status processing and sessionId
            if (!videoUrl && sessionId) {
                // will poll
            }

        } catch (e) {
            console.log('Wan GET failed, trying POST', e.response?.data || e.message);
            try {
                const { data } = await axios.post(API, { prompt, text: prompt, query: prompt }, { timeout: 120000, headers: { 'Content-Type': 'application/json' } });
                videoUrl = data.data?.url || data.data?.video_url || data.url || data.video_url || data.data?.result;
                sessionId = data.data?.sessionId || data.sessionId || data.data?.session_id;
                if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
            } catch {}
        }
    }

    // Polling loop if sessionId returned but no video yet
    if (!videoUrl && sessionId) {
        let attempts = 0;
        const maxAttempts = 30;

        await conn.sendMessage(from, { text: `*⏳ Long job detected*\nSessionId: \`${sessionId}\`\nPolling every 10 sec... (up to 5 mins)\n\n_${BRAND}_` }, { quoted: mek });

        while (attempts < maxAttempts &&!videoUrl) {
            attempts++;
            await new Promise(r => setTimeout(r, 10000));

            try {
                // Poll endpoints - try both GET with sessionId
                const pollUrls = [
                    `${API}?sessionId=${sessionId}&session_id=${sessionId}`,
                    `${API}?sessionId=${sessionId}`,
                    `${API}?job_id=${sessionId}`,
                    `https://api.omegatech.app/api/ai/wan?sessionId=${sessionId}`
                ];

                for (const url of pollUrls) {
                    try {
                        const { data } = await axios.get(url, { timeout: 30000 });
                        const v = data.data?.url || data.data?.video_url || data.url || data.video_url || data.data?.result || data.result;
                        if (v) {
                            videoUrl = v;
                            if (typeof v === 'string' && v.startsWith('http')) { videoUrl = v; break; }
                        }
                        if (data.data?.status === 'completed' && data.data?.url) { videoUrl = data.data.url; break; }
                        if (data.status === 'completed' && data.url) { videoUrl = data.url; break; }
                    } catch {}
                    if (videoUrl) break;
                }

                if (!videoUrl) {
                    // Try POST poll
                    const { data } = await axios.post(API, { sessionId: sessionId, session_id: sessionId, action: "poll" }, { timeout: 30000, headers: { 'Content-Type': 'application/json' } }).catch(()=> ({ data: {} }));
                    const v = data.data?.url || data.url || data.data?.video_url || data.data?.result;
                    if (v) videoUrl = v;
                }

                if (attempts % 3 === 0 &&!videoUrl) {
                    await conn.sendMessage(from, { text: `*⏳ Still processing...* (${attempts*10}s)\nSession: \`${sessionId.slice(0,30)}...\`\n\nUse ${prefix}wan session ${sessionId} to check later` }, { quoted: mek });
                }

                if (videoUrl) break;

            } catch (e) {
                console.log(`Wan poll ${attempts} failed`, e.message);
            }
        }
    }

    if (!videoUrl) {
        // Save session for later polling
        if (!sessions[userKey]) sessions[userKey] = [];
        sessions[userKey].push({ prompt: prompt || 'poll', sessionId: sessionId || rawQ, url: null, time: Date.now() });
        if (sessions[userKey].length > 10) sessions[userKey] = sessions[userKey].slice(-10);
        saveSessions(sessions);

        throw new Error(`Still processing. SessionId: ${sessionId || rawQ}\nPoll later with: ${prefix}wan session ${sessionId || rawQ}\nOr check: ${prefix}wan myjobs`);
    }

    // Save success
    if (!sessions[userKey]) sessions[userKey] = [];
    sessions[userKey].push({ prompt: prompt || 'polled job', sessionId: sessionId || 'direct', url: videoUrl, time: Date.now() });
    if (sessions[userKey].length > 10) sessions[userKey] = sessions[userKey].slice(-10);
    saveSessions(sessions);

    await conn.sendMessage(from, {
        video: { url: videoUrl },
        caption: `*✅ Wan 2.2 Video Generated*\n*Prompt:* ${prompt || 'Polled result'}\n*Model:* Wan 2.2 14B\n*Session:* \`${(sessionId || 'direct').slice(0,50)}\`\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Wan Error:', e.response?.data || e.message);
    reply(`*❌ Wan Failed*\n${e.message}\n\nIf sessionId returned, poll with:\n${'.wan session <sessionId>'}`);
  }
});