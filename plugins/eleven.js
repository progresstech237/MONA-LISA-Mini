const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/elevenlabs';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "eleven",
  alias: ["elevenlabs", "elevenlab", "elv", "arnold", "bella"],
  react: "🔊",
  desc: "ElevenLabs TTS - Arnold, Bella, Krishna",
  category: "progresstech ai",
  use: ".eleven bella|Hello world |.eleven arnold|I love you |.eleven krishna|Mona Lisa",
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

    const voices = ['arnold','bella','krishna'];

    if (!rawQ || rawQ.toLowerCase() === 'help' || rawQ.toLowerCase() === 'menu' || rawQ.toLowerCase() === 'voices') {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🔊 ElevenLabs TTS 〕━━┓
┃ Real ElevenLabs voices
┃ via Omegatech
┃
┃ *Voices:*
┃ 🎙️ Arnold - deep male
┃ 🎙️ Bella - soft female
┃ 🎙️ Krishna - indian male
┃
┃ *Usage:*
┃ ${prefix}eleven bella|Hello my love
┃ ${prefix}eleven arnold|Mona Lisa you fine
┃ ${prefix}eleven krishna|Welcome to Tech Toy
┃
┃ ${prefix}eleven <text> (default Bella)
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎙️ Arnold", id: `${prefix}eleven arnold|This is Arnold voice from ElevenLabs, deep and powerful` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎙️ Bella", id: `${prefix}eleven bella|Hello darling, this is Bella voice, soft and sweet` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎙️ Krishna", id: `${prefix}eleven krishna|Namaste, this is Krishna voice from Progress Tech` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🔊 ElevenLabs • Omegatech", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🔊", key: mek.key } });

    let voice = "bella"; // default
    let text = rawQ;

    if (rawQ.includes('|')) {
        const parts = rawQ.split('|');
        let maybeVoice = parts[0].trim().toLowerCase();
        if (voices.includes(maybeVoice)) {
            voice = maybeVoice;
            text = parts.slice(1).join('|').trim();
        }
    } else {
        const first = rawQ.split(' ')[0].toLowerCase();
        if (voices.includes(first)) {
            voice = first;
            text = rawQ.slice(first.length).trim();
        }
    }

    if (!text) return reply(`*❌ No text*\nExample: ${prefix}eleven bella|Hello world`);

    reply(`*🔊 Generating with ElevenLabs...*\nVoice: *${voice}*\nText: ${text.slice(0,80)}\n\n_${BRAND}_`);

    let audioUrl = null;

    // POST - Working per your screenshot
    try {
        const { data } = await axios.post(API, {
            text: text,
            voice: voice,
            voice_name: voice,
            model: voice
        }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });

        audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url || data.data?.audio || data.audio || data.data?.link || data.link;
        if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
        if (!audioUrl && typeof data === 'string' && data.startsWith('http')) audioUrl = data;
    } catch (e) {
        console.log('POST error', e.message);
    }

    // GET fallback
    if (!audioUrl) {
        const urls = [
            `${API}?text=${encodeURIComponent(text)}&voice=${voice}`,
            `${API}?text=${encodeURIComponent(text)}&voice_name=${voice}`,
            `https://api.omegatech.app/api/ai/elevenlabs?text=${encodeURIComponent(text)}&voice=${voice}&model=${voice}`
        ];
        for (const u of urls) {
            try {
                const { data } = await axios.get(u, { timeout: 60000 });
                audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url || data.data?.audio;
                if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
                if (audioUrl) break;
            } catch {}
        }
    }

    if (!audioUrl) throw new Error('No audio URL returned');

    // Send as voice note + downloadable
    await conn.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: true,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        text: `*✅ ElevenLabs Generated*\n*Voice:* ${voice}\n*Text:* ${text}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('ElevenLabs Error:', e.response?.data || e.message);
    reply(`*❌ ElevenLabs Failed*\n${e.response?.data?.message || e.message}`);
  }
});