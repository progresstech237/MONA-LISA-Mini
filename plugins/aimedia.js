const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API_BASE = 'https://api.omegatech.app/api/ai/Ai';

function getThumbBuffer() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
    } catch {}
    return null;
}

function cleanQuery(raw, prefix, patterns) {
    let q = (raw || "").trim();
    if (!q) return "";
    try {
        const inter = raw;
        if (typeof inter === 'string' && inter.startsWith(prefix)) {
            q = inter.slice(prefix.length).trim();
            q = q.replace(new RegExp(`^(${patterns.join('|')})\\b\\s*`, 'i'), '').trim();
        }
    } catch {}
    return q;
}

// ROBUST: Works for image, viewOnce image, quoted image, sticker as image
async function getQuotedOrOwnImage(mek, conn) {
    try {
        const ctx = mek.message?.extendedTextMessage?.contextInfo;
        const quoted = ctx?.quotedMessage;

        let targetMsg = null;
        
        // 1. Quoted image
        if (quoted?.imageMessage) targetMsg = { imageMessage: quoted.imageMessage };
        else if (quoted?.viewOnceMessageV2?.message?.imageMessage) targetMsg = { imageMessage: quoted.viewOnceMessageV2.message.imageMessage };
        else if (quoted?.viewOnceMessage?.message?.imageMessage) targetMsg = { imageMessage: quoted.viewOnceMessage.message.imageMessage };
        // 2. Own image (user sent .aimedia with image)
        else if (mek.message?.imageMessage) targetMsg = { imageMessage: mek.message.imageMessage };
        else if (mek.message?.viewOnceMessageV2?.message?.imageMessage) targetMsg = { imageMessage: mek.message.viewOnceMessageV2.message.imageMessage };

        if (!targetMsg) return null;
        const buffer = await conn.downloadMediaMessage({ message: targetMsg }, 'buffer', {}, { reuploadRequest: conn.updateMediaMessage });
        return buffer;
    } catch (e) {
        console.log("Download image error:", e.message);
        return null;
    }
}

cmd({
  pattern: "aimedia",
  alias: ["ai", "aitool", "mediaai", "genimg", "txt2img", "removebg", "enhance"],
  react: "🎨",
  desc: "Multi-function AI media tool - Progress Tech",
  category: "progresstech ai",
  use: ".aimedia text cat in space | reply image .aimedia removebg",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  const senderId = m?.sender || mek?.key?.participant || from;
  try {
    let rawQ = q || "";
    try {
        const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if (p1) { const j = JSON.parse(p1); if (j.id) rawQ = j.id; }
        const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if (p2) rawQ = p2;
    } catch {}

    // Clean properly
    let cleaned = (rawQ || "").trim();
    if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.slice(prefix.length).trim();
        cleaned = cleaned.replace(/^(aimedia|ai|aitool|mediaai|genimg|txt2img|removebg|enhance)\b\s*/i, '').trim();
    }

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    if (!cleaned || ['help','menu','login'].includes(cleaned.toLowerCase())) {
        let thumbMsg = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if (buf) {
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumbMsg = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🎨 AI Media Tool 〕━━┓
┃ text-to-image, enhance,
┃ removebg, retouch, flux-edit
┃
┃ *Usage:*
┃ ${prefix}aimedia cat in space
┃ ${prefix}aimedia flux-edit; make it cyberpunk (reply img)
┃ ${prefix}aimedia enhance (reply to image)
┃ ${prefix}aimedia removebg (reply to image)
┃ ${prefix}aimedia retouch (reply)
┃ ${prefix}aimedia unwatermark (reply)
┗━━━━━━━━━━━━━━┛`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🖼️ Text to Image", id: `${prefix}aimedia a beautiful Mona Lisa afro girl` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✂️ Remove BG", id: `${prefix}aimedia removebg` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Enhance", id: `${prefix}aimedia enhance` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎨 AI Media • Progress Tech", hasMediaAttachment:!!thumbMsg,...(thumbMsg? { imageMessage: thumbMsg } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    // --- Parse Action ---
    let action = "text-to-image";
    let prompt = cleaned;
    const lower = cleaned.toLowerCase();

    if (lower.startsWith('removebg') || lower.startsWith('remove bg') || lower.startsWith('rmbg')) {
        action = 'remove-background'; prompt = cleaned.replace(/removebg|remove background|rmbg/i,'').trim();
    } else if (lower.startsWith('enhance')) {
        action = 'enhance'; prompt = cleaned.replace(/enhance/i,'').trim();
    } else if (lower.startsWith('retouch')) {
        action = 'retouch'; prompt = cleaned.replace(/retouch/i,'').trim();
    } else if (lower.startsWith('unwatermark')) {
        action = 'unwatermark'; prompt = cleaned.replace(/unwatermark/i,'').trim();
    } else if (lower.startsWith('variation')) {
        action = 'image-variation'; prompt = cleaned.replace(/variation/i,'').trim();
    } else if (lower.startsWith('img2vid') || lower.startsWith('image-to-video') || lower.startsWith('tovid')) {
        action = 'image-to-video'; prompt = cleaned.replace(/img2vid|image-to-video|tovid/i,'').trim().replace(/^[:;\-]\s*/,'').trim();
    } else if (lower.startsWith('flux-edit') || lower.startsWith('flux edit') || lower.startsWith('edit;') || lower.startsWith('edit ')) {
        action = 'flux-edit'; prompt = cleaned.replace(/flux-edit|flux edit|edit/i,'').trim().replace(/^[:;\-]\s*/,'').trim();
    }

    if (!prompt && action === 'text-to-image') prompt = cleaned;
    if (!prompt) prompt = action === 'text-to-image' ? cleaned : "enhance image quality";

    try { await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } }); } catch {}

    // --- Image Required Check ---
    const needsImage = ['remove-background','enhance','retouch','unwatermark','image-variation','image-to-video','flux-edit'].includes(action);
    let imageBuffer = null;

    if (needsImage) {
        imageBuffer = await getQuotedOrOwnImage(mek, conn);
        if (!imageBuffer) {
            return await reply(`*❌ Reply to an image* for *${action}*\n\nExample:\nSend image with caption: *${prefix}aimedia ${action}*\nOr reply to image with *${prefix}aimedia ${action}*\n\n${BRAND}`);
        }
    }

    await reply(`*🎨 ${action.toUpperCase()} processing...*\nPrompt: ${prompt.slice(0,120) || 'image input'}\n\n_${BRAND}_`);

    // --- Build Payload (NO data:image prefix - that breaks API) ---
    let payload = {
        action: action,
        mode: action,
        prompt: prompt,
        text: prompt
    };

    // Send image as base64 ONLY if needed - without data: prefix for stability
    if (imageBuffer) {
        payload.image_base64 = imageBuffer.toString('base64');
        payload.image = payload.image_base64; // some APIs expect 'image'
    }

    let resultUrl = null;
    let resultBase64 = null;

    try {
        const { data } = await axios.post(API_BASE, payload, {
            timeout: 120000,
            headers: { 'Content-Type': 'application/json' },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        resultUrl = data.data?.url || data.data?.image_url || data.data?.result || data.url || data.result || data.image_url;
        resultBase64 = data.data?.base64 || data.data?.image_base64 || data.base64;

        if (!resultUrl && !resultBase64) {
            console.log('POST empty, trying GET fallback. Raw:', JSON.stringify(data).slice(0,800));
            throw new Error('no_url');
        }
    } catch (e) {
        // GET fallback for text-to-image only
        if (action === 'text-to-image' && !imageBuffer) {
            try {
                const getUrl = `${API_BASE}?action=${encodeURIComponent(action)}&prompt=${encodeURIComponent(prompt)}&text=${encodeURIComponent(prompt)}`;
                const { data: getData } = await axios.get(getUrl, { timeout: 90000 });
                resultUrl = getData.data?.url || getData.url || getData.data?.result || getData.result;
            } catch (ge) {
                console.log("GET fallback failed:", ge.message);
                throw e;
            }
        } else {
            throw e;
        }
    }

    if (resultBase64 && !resultUrl) {
        const buf = Buffer.from(resultBase64, 'base64');
        if (action === 'image-to-video') {
            await conn.sendMessage(from, { video: buf, caption: `*🎬 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { image: buf, caption: `*🎨 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        }
    } else if (resultUrl) {
        if (action === 'image-to-video') {
            await conn.sendMessage(from, { video: { url: resultUrl }, caption: `*🎬 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { image: { url: resultUrl }, caption: `*🎨 ${action}*\n${prompt}\n*${BRAND}*`, contextInfo: ctx }, { quoted: mek });
        }
    } else {
        throw new Error('No image returned from API');
    }

    try { await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); } catch {}

  } catch (e) {
    console.error('AI MEDIA ERROR:', e.response?.data || e.stack);
    const msg = e.response?.data ? JSON.stringify(e.response.data).slice(0,400) : e.message;
    await reply(`*❌ AI Media Failed*\n${msg}\n\nUsage:\n${prefix}aimedia a cat in space\nReply image with ${prefix}aimedia removebg\n\n${BRAND}`);
    try { await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); } catch {}
  }
});
