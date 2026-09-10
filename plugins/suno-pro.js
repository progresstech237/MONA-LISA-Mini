const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/sonu-pro';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu-main.jpg']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "sonu4",
  alias: ["sonupro2", "chatmusic", "musicpro"],
  react: "🎵",
  desc: "ChatMusicPro - AI Music with 3min support",
  category: "progresstech ai",
  use: ".sonu4 <prompt> | <lyrics> |.sonu4 instrumental",
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

    // MENU
    if (!rawQ || rawQ.toLowerCase() === 'help' || rawQ.toLowerCase() === 'menu' || rawQ.toLowerCase() === 'login') {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🎵 Sonu Pro - ChatMusicPro 〕━━┓
┃ Generate AI music - UP TO 3 MINS
┃ Supports: prompts, lyrics, instrumental, multiple models
┃
┃ *How to get 3 mins:*
┃ Use model v4 + long lyrics (Verse + Chorus + Verse)
┃
┃ *Usage:*
┃ ${prefix}sonu4 afrobeat love, omah lay vibe | Mona Lisa lyrics...
┃ ${prefix}sonu instrumental; afro soul guitar chill
┃ ${prefix}sonu4 v4.5; omah lay | Verse1, Chorus, Verse2
┃
┃ Example for 3min:
┃ ${prefix}sonu4 afrobeat 102BPM romantic | [Verse] Oh Mona Lisa...
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎤 Mona Lisa 3min", id: `${prefix}sonu afrobeat, omah lay vibe, 102 BPM, guitar, log drums, romantic | [Verse 1] Oh Mona Lisa why you fine like that, smile wey dey kill me [Chorus] Mona Lisa Mona Lisa you dey make me lose control [Verse 2] Body like sculpture, face like art, you don steal my heart [Chorus] Mona Lisa Mona Lisa` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎹 Instrumental", id: `${prefix}sonu instrumental; afro soul chill, soft guitar, log drums, 102 BPM` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔥 Afrobeat Vibe", id: `${prefix}sonu afrobeat, omah lay, bnxn, sensual, 100 BPM | Make me dance` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎵 Sonu Pro • 3 Min Music", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

    // Parse: prompt | lyrics
    let prompt = rawQ;
    let lyrics = "";
    let model = "v4"; // v4 supports 3min
    let instrumental = false;

    if (rawQ.toLowerCase().includes('instrumental')) instrumental = true;
    if (rawQ.toLowerCase().includes('v4.5')) { model = "v4.5"; rawQ = rawQ.replace(/v4\.5/gi,'').trim(); }
    else if (rawQ.toLowerCase().includes('v4')) { model = "v4"; rawQ = rawQ.replace(/v4/gi,'').trim(); }
    else if (rawQ.toLowerCase().includes('v3.5')) { model = "v3.5"; }

    if (rawQ.includes('|')) {
        const parts = rawQ.split('|');
        prompt = parts[0].trim();
        lyrics = parts.slice(1).join('|').trim();
    } else if (rawQ.includes(';')) {
        const parts = rawQ.split(';');
        if (parts.length > 1 &&!instrumental) {
            prompt = parts[0].trim();
            lyrics = parts.slice(1).join(';').trim();
        }
    }

    if (!lyrics &&!instrumental && prompt.length < 20) {
        lyrics = prompt;
        prompt = "afrobeat, omah lay vibe, romantic, 102 BPM";
    }

    reply(`*🎵 Generating with Sonu-Pro [${model}]...*\n*Prompt:* ${prompt.slice(0,120)}\n*Lyrics:* ${lyrics.slice(0,100) || 'Instrumental'}\n*Mode:* ${instrumental?'Instrumental':'Vocal'}\n\n_Wait 40-90 sec for 3min track..._`);

    // POST payload - based on ChatMusicPro spec
    const payload = {
        prompt: prompt,
        lyrics: lyrics,
        instrumental: instrumental,
        model: model,
        model_version: model,
        action: "generate",
        duration: 180, // request 3 min
        custom: true
    };

    const { data } = await axios.post(API, payload, {
        timeout: 180000,
        headers: { 'Content-Type': 'application/json' }
    });

    // Find audio URL - Omegatech returns different formats
    let audioUrl = data.data?.audio_url || data.data?.url || data.data?.audioUrl || data.audio_url || data.url || data.data?.link || data.link || data.data?.audio || data.audio;
    let title = data.data?.title || data.title || "Sonu Pro Track";
    let duration = data.data?.duration || data.duration || "3:00";

    if (!audioUrl && typeof data.data === 'string' && data.data.startsWith('http')) audioUrl = data.data;
    if (!audioUrl && typeof data === 'string' && data.startsWith('http')) audioUrl = data;

    if (!audioUrl) {
        console.log('Sonu raw response:', JSON.stringify(data).slice(0,2000));
        // Try GET fallback
        const getUrl = `${API}?action=generate&prompt=${encodeURIComponent(prompt)}&lyrics=${encodeURIComponent(lyrics)}&instrumental=${instrumental}&model=${model}`;
        try {
            const { data: gData } = await axios.get(getUrl, { timeout: 180000 });
            audioUrl = gData.data?.audio_url || gData.audio_url || gData.data?.url || gData.url;
            title = gData.data?.title || title;
            if (!audioUrl) throw new Error('no url');
            // send from GET
            await conn.sendMessage(from, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: ctx
            }, { quoted: mek });
            await conn.sendMessage(from, { text: `*✅ Generated [${model}] - ${duration}*\n*${title}*\n*Prompt:* ${prompt}\n${BRAND}\n${CHANNEL_LINK}`, contextInfo: ctx }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            return;
        } catch (e2) {
            return reply(`*❌ No audio returned*\nRaw: ${JSON.stringify(data).slice(0,800)}\n\nTry again with shorter lyrics or try instrumental`);
        }
    }

    await conn.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        text: `*✅ Music Generated - ${duration}*\n\n*🎵 Title:* ${title}\n*🎧 Model:* ${model} (3min support)\n*📝 Prompt:* ${prompt}\n${lyrics? `*📜 Lyrics:* ${lyrics.slice(0,300)}...\n` : ''}\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Sonu-Pro Error:', e.response?.data || e.message);
    reply(`*❌ Sonu-Pro Failed*\n${e.response?.data?.message || e.message}\n\nTip: For 3 mins use model v4 with full Verse+Chorus+Verse lyrics`);
  }
});