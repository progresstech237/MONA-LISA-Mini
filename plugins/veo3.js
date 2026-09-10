const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Veo3-v3';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "veo4",
  alias: ["veo", "veo3v3", "veo3video", "googleveo"],
  react: "🎥",
  desc: "Text to video via Veo3.ai - only prompt required - Google Veo3",
  category: "progresstech ai",
  use: ".veo4 a cat dancing in space |.veo4 Mona Lisa singing",
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

        const menu = `┏━━〔 🎥 Veo3 v3 - Google 〕━━┓
┃ Text to video via veo3.ai
┃ Only prompt required - simplest
┃ Google's best video model
┃
┃ *Usage:*
┃ ${prefix}veo4 a cat astronaut dancing in space
┃ ${prefix}veo4 Mona Lisa afro girl singing, sunset
┃ ${prefix}veo4 cinematic drone shot of futuristic city
┃ ${prefix}veo4 a lion roaring in jungle, 4k
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎬 Mona Lisa", id: `${prefix}veo4 cinematic shot of Mona Lisa afro girl singing in Paris at sunset, omah lay vibe, 4k` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🐱 Cat Astronaut", id: `${prefix}veo4 a cute cat astronaut dancing in zero gravity, cinematic 4k` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌃 City Drone", id: `${prefix}veo4 cinematic drone shot of futuristic city at night, neon lights` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎥 Veo3 v3 • Google", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🎥", key: mek.key } });

    reply(`*🎥 Veo4 Generating...*\n*Prompt:* ${rawQ.slice(0,120)}\n\n_Veo3.ai - Google's best_\n_Wait 30-90 sec..._\n\n_${BRAND}_`);

    let videoUrl = null;

    // POST first - per screenshot POST is Working
    try {
        const { data } = await axios.post(API, {
            prompt: rawQ,
            text: rawQ,
            query: rawQ,
            content: rawQ
        }, { timeout: 180000, headers: { 'Content-Type': 'application/json' } });

        videoUrl = data.data?.url || data.data?.video_url || data.data?.videoUrl || data.url || data.video_url || data.data?.result || data.data?.link || data.result || data.link;
        if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
        if (!videoUrl && typeof data === 'string' && data.startsWith('http')) videoUrl = data;

    } catch (e) {
        console.log('Veo3 POST failed', e.response?.data || e.message);
    }

    // GET fallback
    if (!videoUrl) {
        try {
            const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&text=${encodeURIComponent(rawQ)}`, { timeout: 180000 });
            videoUrl = data.data?.url || data.data?.video_url || data.url || data.video_url || data.data?.result || data.result;
            if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
            if (!videoUrl && typeof data === 'string' && data.startsWith('http')) videoUrl = data;
        } catch (e) {
            console.log('Veo3 GET failed', e.message);
        }
    }

    if (!videoUrl) throw new Error('No video URL returned from Veo3 API');

    await conn.sendMessage(from, {
        video: { url: videoUrl },
        caption: `*✅ Veo3 Video Generated*\n*Prompt:* ${rawQ}\n*Model:* Veo3-v3 (Google) via veo3.ai\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Veo3 Error:', e.response?.data || e.message);
    reply(`*❌ Veo3 Failed*\n${e.response?.data?.message || e.message}\n\nTry simpler: ${'.veo3 a cat dancing'}`);
  }
});