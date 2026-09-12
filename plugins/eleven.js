const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/elevenlabs';

function getThumbBuffer() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
    } catch { return null; }
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

cmd({
  pattern: "eleven",
  alias: ["elevenlabs", "elv", "arnold", "bella"],
  react: "🔊",
  desc: "ElevenLabs TTS - Arnold, Bella, Krishna",
  category: "progresstech ai",
  use: ".eleven bella|Hello world",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = q || "";
    try{
        const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if(p1){ const j = JSON.parse(p1); if(j.id) rawQ = j.id; }
        const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if(p2) rawQ = p2;
    }catch{}

    let cleaned = cleanQuery(rawQ, prefix, ["eleven","elevenlabs","elevenlab","elv","arnold","bella"]);
    if(!cleaned) cleaned = cleanQuery(q, prefix, ["eleven","elevenlabs","elevenlab","elv","arnold","bella"]);
    if(!cleaned) cleaned = (rawQ||"").trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };

    const voices = ['arnold','bella','krishna'];

    if (!cleaned || ['eleven','menu','voices','list'].includes(cleaned.toLowerCase())) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if(buf){
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🔊 ElevenLabs TTS 〕━━┓
┃ Real ElevenLabs voices via Omegatech
┃
┃ *Voices:*
┃ 🎙️ arnold - deep male
┃ 🎙️ bella - soft female (default)
┃ 🎙️ krishna - indian male
┃
┃ *Usage:*
┃ ${prefix}eleven bella|Hello my love
┃ ${prefix}eleven arnold|Mona Lisa you fine
┃ ${prefix}eleven krishna|Welcome to Tech Toy
┃ ${prefix}eleven <text> (default bella)
┗━━━━━━━━━━━━━━┛`;

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🔊 ElevenLabs • Omegatech", hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: {
                    buttons: [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎙️ Arnold", id: `${prefix}eleven arnold|This is Arnold voice from ElevenLabs, deep and powerful` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎙️ Bella", id: `${prefix}eleven bella|Hello darling, this is Bella voice, soft and sweet` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎙️ Krishna", id: `${prefix}eleven krishna|Namaste, this is Krishna voice from Progress Tech` }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
                    ]
                }
            },
            contextInfo: ctx
        }, {});
    }

    try{ await conn.sendMessage(from, { react: { text: "🔊", key: mek.key } }); }catch{}

    let voice = "bella";
    let text = cleaned;

    if (cleaned.includes('|')) {
        const parts = cleaned.split('|');
        let maybeVoice = parts[0].trim().toLowerCase();
        if (voices.includes(maybeVoice)) {
            voice = maybeVoice;
            text = parts.slice(1).join('|').trim();
        }
    } else {
        const first = cleaned.split(/\s+/)[0].toLowerCase();
        if (voices.includes(first)) {
            voice = first;
            text = cleaned.slice(first.length).trim();
        }
    }

    if (!text || text.length < 1) return await reply(`*❌ No text*\nExample: ${prefix}eleven bella|Hello world`);
    if (text.length > 500) text = text.slice(0,500); // Eleven API limit

    await reply(`*🔊 Generating...*\nVoice: *${voice}*\nText: ${text.slice(0,80)}\n_${BRAND}_`);

    let audioUrl = null;
    let audioBuffer = null;

    // 1) POST try
    try {
        const { data } = await axios.post(API, {
            text, voice, voice_name: voice, model: voice
        }, { timeout: 60000, headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' } });

        if(data){
            audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url || data.data?.audio || data.audio || data.data?.link || data.link;
            if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
            if (!audioUrl && typeof data === 'string' && data.startsWith('http')) audioUrl = data;
            // direct buffer base64?
            const b64 = data.data?.base64 || data.base64 || data.data?.audio_base64;
            if(!audioUrl && b64) audioBuffer = Buffer.from(b64.replace(/^data:audio\/\w+;base64,/,'').trim(), 'base64');
        }
    } catch(e){ console.log('Eleven POST fail:', e.message); }

    // 2) GET fallback
    if (!audioUrl &&!audioBuffer) {
        const urls = [
            `${API}?text=${encodeURIComponent(text)}&voice=${voice}`,
            `${API}?text=${encodeURIComponent(text)}&voice_name=${voice}`,
            `${API}?text=${encodeURIComponent(text)}&voice=${voice}&model=${voice}`
        ];
        for (const u of urls) {
            try {
                const { data } = await axios.get(u, { timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                audioUrl = data.data?.url || data.data?.audio_url || data.url || data.audio_url;
                if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
                if (audioUrl) break;
            } catch {}
        }
    }

    if (!audioUrl &&!audioBuffer) throw new Error('No audio URL returned from omegatech - API may be down');

    const audioPayload = audioBuffer? audioBuffer : { url: audioUrl };

    // Send as PTT voice note
    await conn.sendMessage(from, {
        audio: audioPayload,
        mimetype: 'audio/mpeg',
        ptt: true,
        contextInfo: ctx
    }, { quoted: mek });

    // Send as normal audio file
    await conn.sendMessage(from, {
        audio: audioPayload,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `eleven_${voice}.mp3`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        text: `*✅ ElevenLabs Generated*\n*Voice:* ${voice}\n*Text:* ${text}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}

  } catch (e) {
    console.error('ElevenLabs Error:', e.response?.data || e.message);
    try{ await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); }catch{}
    const msg = e.response?.data? JSON.stringify(e.response.data).slice(0,500) : e.message;
    await reply(`*❌ ElevenLabs Failed*\n${msg}\n${BRAND}`);
  }
});
