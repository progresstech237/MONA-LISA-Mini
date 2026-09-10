const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Rwmove-Bg';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "removebg",
  alias: ["rbg", "nobg", "rmbg", "rwmove", "remove-bg"],
  react: "✂️",
  desc: "Remove background from image using Pixpunk AI",
  category: "progresstech ai",
  use: ".removebg (reply to image) | send image with caption .removebg",
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

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    // Get image buffer
    let imgBuffer = null;
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (quoted) {
            imgBuffer = await conn.downloadMediaMessage({ message: { imageMessage: quoted } });
        } else if (mek.message?.imageMessage) {
            imgBuffer = await conn.downloadMediaMessage(mek);
        }
    } catch (e) {
        console.log('Download error', e.message);
    }

    if (!imgBuffer) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 ✂️ Remove BG - Pixpunk AI 〕━━┓
┃ Remove background from any image
┃ Returns transparent PNG
┃
┃ *Usage:*
┃ Reply to image with:
┃ ${prefix}removebg
┃
┃ Or send image with caption:
┃ ${prefix}removebg
┃
┃ Supports: people, products, cars
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✂️ How to use", id: `${prefix}removebg help` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "✂️ Remove BG • Pixpunk AI", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "✂️", key: mek.key } });
    reply(`*✂️ Removing background...*\nUsing Pixpunk AI\n\n_Wait 5-15 sec..._\n_${BRAND}_`);

    let resultUrl = null;
    let resultBuffer = null;

    // Try FormData POST (most image tools use this)
    try {
        const form = new FormData();
        form.append('image', imgBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        form.append('file', imgBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        form.append('image_file', imgBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        const { data, headers } = await axios.post(API, form, {
            timeout: 120000,
            headers: {...form.getHeaders() },
            responseType: 'arraybuffer'
        });

        const cType = headers['content-type'] || '';

        if (cType.includes('image')) {
            resultBuffer = Buffer.from(data);
        } else {
            // Might be JSON with URL
            try {
                const txt = Buffer.from(data).toString('utf8');
                const json = JSON.parse(txt);
                resultUrl = json.data?.url || json.data?.image_url || json.data?.result || json.url || json.result || json.image_url;
                if (!resultUrl && typeof json.data === 'string' && json.data.startsWith('http')) resultUrl = json.data;
            } catch {
                // If not JSON, maybe it's still image but wrong header
                if (data && data.byteLength > 1000) resultBuffer = Buffer.from(data);
            }
        }
    } catch (e) {
        console.log('FormData failed, trying base64 POST', e.response?.data? Buffer.from(e.response.data).toString().slice(0,300) : e.message);

        // Base64 POST fallback
        try {
            const base64 = imgBuffer.toString('base64');
            const { data } = await axios.post(API, {
                image: `data:image/jpeg;base64,${base64}`,
                image_base64: base64,
                base64: base64,
                file: `data:image/jpeg;base64,${base64}`
            }, { timeout: 120000, headers: { 'Content-Type': 'application/json' } });

            resultUrl = data.data?.url || data.data?.image_url || data.url || data.image_url || data.data?.result || data.result;
            const b64 = data.data?.base64 || data.data?.image_base64 || data.base64;
            if (b64) {
                resultBuffer = Buffer.from(b64.replace(/^data:image\/\w+;base64,/,''), 'base64');
            }
            if (!resultUrl &&!resultBuffer && typeof data.data === 'string' && data.data.startsWith('http')) resultUrl = data.data;
        } catch (e2) {
            console.log('Base64 also failed', e2.message);
        }
    }

    // GET fallback with uploaded URL? Some APIs need public URL, so we try GET with image url param if we have one
    if (!resultUrl &&!resultBuffer) {
        throw new Error('No result from Remove BG API - try again with clearer image');
    }

    if (resultBuffer) {
        await conn.sendMessage(from, {
            image: resultBuffer,
            caption: `*✅ Background Removed*\nPixpunk AI • Transparent PNG\n\n*${BRAND}*\n${CHANNEL_LINK}`,
            contextInfo: ctx
        }, { quoted: mek });

        // Also send as document for HD transparent
        await conn.sendMessage(from, {
            document: resultBuffer,
            mimetype: 'image/png',
            fileName: `NoBG_${Date.now()}.png`,
            caption: `*HD Transparent PNG*\n${BRAND}`,
            contextInfo: ctx
        }, { quoted: mek });

    } else if (resultUrl) {
        await conn.sendMessage(from, {
            image: { url: resultUrl },
            caption: `*✅ Background Removed*\nPixpunk AI • Transparent PNG\n\n*${BRAND}*\n${CHANNEL_LINK}`,
            contextInfo: ctx
        }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Remove BG Error:', e.response?.data? Buffer.from(e.response.data).toString().slice(0,500) : e.message);
    let err = e.message;
    try { if (e.response?.data) err = Buffer.from(e.response.data).toString('utf8').slice(0,500); } catch {}
    reply(`*❌ Remove BG Failed*\n${err}\n\nUse: Reply to image with ${'.removebg'}`);
  }
});