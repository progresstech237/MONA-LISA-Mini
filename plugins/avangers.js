const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/Maker/avengers';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "avengers",
  alias: ["avenger", "avengerslogo", "textproavengers", "marvel"],
  react: "🦸",
  desc: "Generate Avengers-style logo using TextPro",
  category: "progresstech maker",
  use: ".avengers Progress Tech |.avengers Mona Lisa |.avengers TECH TOY",
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

        const menu = `┏━━〔 🦸 Avengers Logo 〕━━┓
┃ Generate Avengers-style logo
┃ Using TextPro
┃ Returns raw PNG HD
┃
┃ *Usage:*
┃ ${prefix}avengers Progress Tech
┃ ${prefix}avengers Mona Lisa
┃ ${prefix}avengers TECH TOY
┃ ${prefix}avengers Bamenda
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🦸 Progress Tech", id: `${prefix}avengers Progress Tech` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🦸 TECH TOY", id: `${prefix}avengers TECH TOY` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🦸 Mona Lisa", id: `${prefix}avengers Mona Lisa` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🦸 Avengers Logo • TextPro", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🦸", key: mek.key } });
    reply(`*🦸 Generating Avengers Logo...*\n*Text:* ${rawQ}\n\n_${BRAND}_`);

    let imageBuffer = null;

    // GET - This endpoint returns raw PNG directly (per screenshot)
    try {
        const { data } = await axios.get(`${API}?text=${encodeURIComponent(rawQ)}&name=${encodeURIComponent(rawQ)}&q=${encodeURIComponent(rawQ)}`, {
            timeout: 60000,
            responseType: 'arraybuffer'
        });

        const cType = data ? '' : '';
        // Check if it's image or JSON
        const buf = Buffer.from(data);
        const textCheck = buf.toString('utf8').slice(0,20);

        if (textCheck.startsWith('{')) {
            // JSON returned with URL
            try {
                const json = JSON.parse(buf.toString('utf8'));
                const url = json.data?.url || json.data?.image_url || json.url || json.result;
                if (url) {
                    await conn.sendMessage(from, {
                        image: { url },
                        caption: `*✅ Avengers Logo*\n*Text:* ${rawQ}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
                        contextInfo: ctx
                    }, { quoted: mek });
                    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                    return;
                }
            } catch {}
        } else if (buf.length > 1000) {
            imageBuffer = buf;
        }

    } catch (e) {
        console.log('GET raw failed', e.message);
        // Try POST
        try {
            const { data } = await axios.post(API, { text: rawQ, name: rawQ }, { timeout: 60000, responseType: 'arraybuffer' });
            const buf = Buffer.from(data);
            if (buf.length > 1000 &&!buf.toString('utf8').startsWith('{')) imageBuffer = buf;
            else {
                try {
                    const json = JSON.parse(buf.toString('utf8'));
                    const url = json.data?.url || json.url;
                    if (url) {
                        await conn.sendMessage(from, { image: { url }, caption: `*✅ Avengers Logo*\n*Text:* ${rawQ}\n\n*${BRAND}*`, contextInfo: ctx }, { quoted: mek });
                        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                        return;
                    }
                } catch {}
            }
        } catch {}
    }

    if (!imageBuffer) throw new Error('No PNG returned from TextPro API');

    await conn.sendMessage(from, {
        image: imageBuffer,
        caption: `*✅ Avengers Logo Generated*\n*Text:* ${rawQ}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    // Also send as document HD
    await conn.sendMessage(from, {
        document: imageBuffer,
        mimetype: 'image/png',
        fileName: `Avengers_${rawQ.replace(/\s+/g,'_')}.png`,
        caption: `*HD Avengers Logo - ${rawQ}*\n${BRAND}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Avengers Error:', e.response?.data? Buffer.from(e.response.data).toString().slice(0,300) : e.message);
    reply(`*❌ Avengers Logo Failed*\n${e.message}\n\nTry: ${'.avengers Progress Tech'}`);
  }
});