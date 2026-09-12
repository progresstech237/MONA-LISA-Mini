const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/Maker/ephoto-3d-gradient';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "3dgradient",
  alias: ["3dg", "ephoto3d", "gradient3d", "3dtext"],
  react: "🌈",
  desc: "Generate 3D gradient style text logo - Ephoto",
  category: "progresstech ai",
  use: ".3dgradient Progress Tech |.3dgradient Mona Lisa |.3dgradient TECH TOY",
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

        const menu = `┏━━〔 🌈 3D Gradient 〕━━┓
┃ Ephoto - 3D Gradient Text
┃ Returns raw image directly
┃ HD quality
┃
┃ *Usage:*
┃ ${prefix}3dgradient Progress Tech
┃ ${prefix}3dgradient TECH TOY
┃ ${prefix}3dgradient Mona Lisa
┃ ${prefix}3dgradient Bamenda
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌈 Progress Tech", id: `${prefix}3dgradient Progress Tech` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌈 TECH TOY", id: `${prefix}3dgradient TECH TOY` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌈 Mona Lisa", id: `${prefix}3dgradient Mona Lisa` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🌈 3D Gradient • Ephoto", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🌈", key: mek.key } });
    reply(`*🌈 Generating 3D Gradient...*\n*Text:* ${rawQ}\n\n_${BRAND}_`);

    let imageBuffer = null;

    // GET - returns raw image (per screenshot)
    try {
        const { data } = await axios.get(`${API}?text=${encodeURIComponent(rawQ)}&name=${encodeURIComponent(rawQ)}&q=${encodeURIComponent(rawQ)}&query=${encodeURIComponent(rawQ)}`, {
            timeout: 60000,
            responseType: 'arraybuffer'
        });

        const buf = Buffer.from(data);
        if (buf.toString('utf8').slice(0,2) !== '{"' && buf.length > 1000) {
            imageBuffer = buf;
        } else {
            // JSON with URL
            try {
                const json = JSON.parse(buf.toString('utf8'));
                const url = json.data?.url || json.url || json.data?.image_url || json.result;
                if (url) {
                    await conn.sendMessage(from, {
                        image: { url },
                        caption: `*✅ 3D Gradient Logo*\n*Text:* ${rawQ}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
                        contextInfo: ctx
                    }, { quoted: mek });
                    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                    return;
                }
            } catch {}
        }
    } catch (e) {
        console.log('GET failed, trying POST', e.message);
        try {
            const { data } = await axios.post(API, { text: rawQ, name: rawQ, query: rawQ }, {
                timeout: 60000,
                headers: { 'Content-Type': 'application/json' },
                responseType: 'arraybuffer'
            });
            const buf = Buffer.from(data);
            if (buf.length > 1000 &&!buf.toString('utf8').startsWith('{')) imageBuffer = buf;
            else {
                const json = JSON.parse(buf.toString('utf8'));
                const url = json.data?.url || json.url;
                if (url) {
                    await conn.sendMessage(from, { image: { url }, caption: `*✅ 3D Gradient*\n*Text:* ${rawQ}\n\n*${BRAND}*`, contextInfo: ctx }, { quoted: mek });
                    return;
                }
            }
        } catch {}
    }

    if (!imageBuffer) throw new Error('No image returned from Ephoto API');

    await conn.sendMessage(from, {
        image: imageBuffer,
        caption: `*✅ 3D Gradient Generated*\n*Text:* ${rawQ}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        document: imageBuffer,
        mimetype: 'image/png',
        fileName: `3DGradient_${rawQ.replace(/\s+/g,'_')}.png`,
        caption: `*HD 3D Gradient - ${rawQ}*\n${BRAND}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('3D Gradient Error:', e.response?.data? Buffer.from(e.response.data).toString().slice(0,300) : e.message);
    reply(`*❌ 3D Gradient Failed*\n${e.message}\n\nTry: ${'.3dgradient Progress Tech'}`);
  }
});
