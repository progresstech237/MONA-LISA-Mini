const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://apis.davidcyril.name.ng/ai/txt2vid';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "sora",
  alias: ["aivideo", "txt2vid", "t2v"],
  react: "🎬",
  desc: "Sora Text to Video - Sends Video File",
  category: "progresstech ai",
  use: ".sora a cat walking on beach",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = q || "";
    const inter = mek.message?.interactiveResponseMessage;
    if (inter?.nativeFlowResponseMessage?.paramsJson) {
        try { const p = JSON.parse(inter.nativeFlowResponseMessage.paramsJson); if (p.id) rawQ = p.id.replace(prefix,"").trim(); } catch {}
    }
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        rawQ = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,"").trim();
    }
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`, 'i'), '').trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    if (!rawQ || ['help','menu'].includes(rawQ.toLowerCase())) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) { const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer }); thumb = media.imageMessage; }
        } catch {}
        const menu = `┏━━〔 🎬 Text to Video 〕━━┓\n┃ Sends REAL video file ✅\n┃\n┃ ${prefix}sora a cat walking on beach sunset\n┃ ${prefix}sora 16:9 cinematic city\n┃ ${prefix}sora 9:16 Mona Lisa dancing\n┗━━━━━━━━━━━━━━┛`;
        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🐱 Cat Beach", id: `${prefix}sora 16:9 a cat walking on the beach at sunset, cinematic` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👑 Mona Lisa", id: `${prefix}sora 9:16 beautiful girl in green velvet dress dancing luxury party` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📖 Docs", url: "https://apis.davidcyril.name.ng/endpoints/aivideo/" }) }
        ];
        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎬 Sora Video • Real File", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu }, footer: { text: BRAND }, nativeFlowMessage: { buttons }
            }, contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });

    let prompt = rawQ;
    let aspect_ratio = "16:9";
    const arMatch = rawQ.match(/(16:9|9:16|1:1)/i);
    if (arMatch) { aspect_ratio = arMatch[1]; prompt = rawQ.replace(arMatch[1], '').trim(); }
    if (!prompt) return reply(`*❌ No prompt*\nExample: ${prefix}sora a cat walking on beach`);

    reply(`*🎬 Generating Sora Video...*\n*Prompt:* ${prompt.slice(0,80)}\n*Ratio:* ${aspect_ratio}\n\n_Downloading video file..._\n_${BRAND}_`);

    let videoUrl = null;

    // GET - per your docs
    try {
        const url = `${API}?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspect_ratio)}&ai_sound=true`;
        const { data } = await axios.get(url, { timeout: 120000 });
        videoUrl = data.result?.url || data.data?.url || data.url || data.video_url;
        if (data.success && data.result?.url) videoUrl = data.result.url;
        if (typeof data.result === 'string' && data.result.startsWith('http')) videoUrl = data.result;
        if (typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
    } catch (e) { console.log('GET fail', e.message); }

    if (!videoUrl) {
        try {
            const { data } = await axios.post(API, { prompt, aspect_ratio, ai_sound: "true" }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
            videoUrl = data.result?.url || data.data?.url || data.url;
            if (data.success && data.result?.url) videoUrl = data.result.url;
        } catch {}
    }

    if (!videoUrl) throw new Error('No video URL returned');

    // DOWNLOAD VIDEO AS BUFFER THEN SEND AS REAL VIDEO
    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
    const videoBuffer = Buffer.from(videoRes.data);

    await conn.sendMessage(from, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `*✅ Sora Video Done*\n*Prompt:* ${prompt}\n*Ratio:* ${aspect_ratio}\n\n*${BRAND}*`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Sora Error:', e.response?.data || e.message);
    reply(`*❌ Sora Failed*\n${e.message}`);
  }
});
