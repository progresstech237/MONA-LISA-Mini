const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

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
  use: ".tts2 hello world |.tts woman2 hello |.tts man1|I love you",
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

    const validVoices = ['woman1','woman2','woman3','man1','man2','man3'];

    if (!rawQ || ['help','menu','list'].includes(rawQ.toLowerCase())) {
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
┃ ${prefix}tts2 hello world
┃ ${prefix}tts2 woman2|Hello my love
┃ ${prefix}tts2 man1|Mona Lisa you fine
┗━━━━━━━━━━━━━━┛`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👩 Woman1", id: `${prefix}tts2 woman1|Hello, I am woman1 voice from Progress Tech` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👩 Woman2", id: `${prefix}tts2 woman2|Hello, I am woman2` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👨 Man1", id: `${prefix}tts2 man1|Hello, I am man1 voice` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👨 Man2", id: `${prefix}tts2 man2|This is man2 voice test` }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎙️ TTS v3 • Live3D AI", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            }
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🎙️", key: mek.key } });

    let voice = "woman1";
    let text = rawQ;

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

    if (!text) return reply(`*❌ No text*\nExample: ${prefix}tts2 woman1|Hello world`);

    await conn.sendMessage(from, { text: `*🎙️ Generating speech...*\nVoice: *${voice}*\nText: ${text.slice(0,80)}` }, { quoted: mek });

    let audioUrl = null;

    try {
        const { data } = await axios.post(API, { text, voice, language: "English" }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });
        audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url || data.data?.link || data.link || data.data?.audio;
        if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
    } catch {}

    if (!audioUrl) {
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
                if (audioUrl) break;
            } catch {}
        }
    }

    if (!audioUrl) throw new Error('No audio URL returned from API');

    // FIXED: Download as buffer then send ONCE as ptt, NO contextInfo = no JID, no Forwarded
    const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });

    // ONLY ONE SEND - reply with just voice note
    await conn.sendMessage(from, {
        audio: Buffer.from(audioRes.data),
        mimetype: 'audio/mpeg',
        ptt: true
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('TTS v3 Error:', e.response?.data || e.message);
    reply(`*❌ TTS Failed*\n${e.response?.data?.message || e.message}`);
  }
});
