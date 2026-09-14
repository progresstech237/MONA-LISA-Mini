const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/text2speech-v3';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "tts2",
  alias: ["ttsv3", "speak", "voice", "text2speech"],
  react: "🎙️",
  desc: "Text to Speech Live3D AI - 6 voices",
  category: "progresstech ai",
  use: ".tts2 hello world | .tts woman2 hello | .tts man1|I love you",
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

    const validVoices = ['woman1','woman2','woman3','man1','man2','man3'];

    if (!rawQ || rawQ.toLowerCase() === 'help' || rawQ.toLowerCase() === 'menu' || rawQ.toLowerCase() === 'list') {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🎙️ TTS v3 - Live3D AI 〕━━┓
┃ Convert text to speech
┃ Voices: 6 available
┃
┃ *Voices:*
┃ 👩 woman1, woman2, woman3
┃ 👨 man1, man2, man3
┃
┃ *Usage:*
┃ ${prefix}tts hello world
┃ ${prefix}tts woman2|Hello my love
┃ ${prefix}tts man1|Mona Lisa you fine
┃ ${prefix}tts woman1|Progress Tech is the best
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👩 Woman1", id: `${prefix}tts woman1|Hello, I am woman1 voice from Progress Tech` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👩 Woman2", id: `${prefix}tts woman2|Hello, I am woman2` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👨 Man1", id: `${prefix}tts man1|Hello, I am man1 voice, Progress Tech` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👨 Man2", id: `${prefix}tts man2|This is man2 voice test` }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎙️ TTS v3 • Live3D AI", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🎙️", key: mek.key } });

    let voice = "woman1";
    let text = rawQ;

    // Parse voice|text or voice text
    if (rawQ.includes('|')) {
        const parts = rawQ.split('|');
        let maybeVoice = parts[0].trim().toLowerCase();
        if (validVoices.includes(maybeVoice)) {
            voice = maybeVoice;
            text = parts.slice(1).join('|').trim();
        }
    } else {
        const first = rawQ.split(' ')[0].toLowerCase();
        if (validVoices.includes(first)) {
            voice = first;
            text = rawQ.slice(first.length).trim();
        }
    }

    if (!text) return reply(`*❌ No text*\nExample: ${prefix}tts woman1|Hello world`);

    reply(`*🎙️ Generating speech...*\nVoice: *${voice}*\nText: ${text.slice(0,80)}\n\n_${BRAND}_`);

    // Try POST first as per your screenshot GET+POST Working
    let audioUrl = null;

    try {
        const { data } = await axios.post(API, {
            text: text,
            voice: voice,
            language: "English"
        }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });

        audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url || data.data?.link || data.link || data.data?.audio;
        if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
    } catch (e) {
        console.log('POST failed, trying GET', e.message);
    }

    if (!audioUrl) {
        // GET fallback: /api/ai/text2speech-v3?text=hello&voice=woman1
        // Also old route /api/ai/tts?text=hello&voice=woman1
        const urls = [
            `${API}?text=${encodeURIComponent(text)}&voice=${voice}&language=English`,
            `https://api.omegatech.app/api/ai/tts?text=${encodeURIComponent(text)}&voice=${voice}`,
            `${API}?text=${encodeURIComponent(text)}&voice=${voice}`
        ];
        
        for (const u of urls) {
            try {
                const { data } = await axios.get(u, { timeout: 60000 });
                audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url || data.data?.audio || data.audio;
                if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
                if (!audioUrl && typeof data === 'string' && data.startsWith('http')) audioUrl = data;
                if (audioUrl) break;
            } catch {}
        }
    }

    if (!audioUrl) {
        throw new Error('No audio URL returned from API');
    }

    await conn.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: true, // voice note style
        contextInfo: ctx
    }, { quoted: mek });

    // Also send as normal audio for download
    await conn.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        text: `*✅ TTS Generated*\n*Voice:* ${voice}\n*Text:* ${text}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('TTS v3 Error:', e.response?.data || e.message);
    reply(`*❌ TTS Failed*\n${e.response?.data?.message || e.message}`);
  }
});