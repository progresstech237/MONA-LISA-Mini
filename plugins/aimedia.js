const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API_BASE = 'https://api.omegatech.app/api/ai/Ai';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

async function downloadQuotedImage(mek, conn) {
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = quoted?.imageMessage || mek.message?.imageMessage;
    if (!msg) return null;
    const buffer = await conn.downloadMediaMessage({ message: { imageMessage: msg } });
    return buffer;
}

cmd({
  pattern: "aimedia",
  alias: ["ai", "aitool", "mediaai", "genimg", "txt2img", "removebg", "enhance"],
  react: "🎨",
  desc: "Multi-function AI media tool - Progress Tech",
  category: "progresstech ai",
  use: ".aimedia text cat in space | .aimedia removebg (reply to image) | .aimedia enhance (reply)",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = q || "";
    // Fix button clicks
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

    if (!rawQ || rawQ.toLowerCase() === 'help' || rawQ.toLowerCase() === 'login' || rawQ.toLowerCase() === 'menu') {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🎨 AI Media Tool 〕━━┓
┃ Multi-function AI
┃ text-to-image, img-to-video,
┃ enhance, removebg, retouch,
┃ flux-edit, unwatermark, variation
┃
┃ *How to use:*
┃ ${prefix}aimedia cat in space
┃ ${prefix}aimedia flux-edit; make it cyberpunk
┃ ${prefix}aimedia enhance (reply image)
┃ ${prefix}aimedia removebg (reply image)
┃ ${prefix}aimedia retouch (reply image)
┃ ${prefix}aimedia unwatermark (reply image)
┃ ${prefix}aimedia variation (reply image)
┃ ${prefix}aimedia img2vid; slow zoom (reply image)
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🖼️ Text to Image", id: `${prefix}aimedia a beautiful Mona Lisa afro girl, omah lay album cover` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✂️ Remove BG", id: `${prefix}aimedia removebg` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ Enhance", id: `${prefix}aimedia enhance` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎬 Img to Video", id: `${prefix}aimedia img2vid` }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🎨 AI Media • Progress Tech", hasMediaAttachment: !!thumb, ...(thumb ? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    // Parse action
    let action = "text-to-image";
    let prompt = rawQ;

    const lower = rawQ.toLowerCase();
    if (lower.startsWith('removebg') || lower.startsWith('remove bg')) { action = 'remove-background'; prompt = rawQ.replace(/removebg|remove background/i,'').trim(); }
    else if (lower.startsWith('enhance')) { action = 'enhance'; prompt = rawQ.replace(/enhance/i,'').trim(); }
    else if (lower.startsWith('retouch')) { action = 'retouch'; prompt = rawQ.replace(/retouch/i,'').trim(); }
    else if (lower.startsWith('unwatermark')) { action = 'unwatermark'; prompt = rawQ.replace(/unwatermark/i,'').trim(); }
    else if (lower.startsWith('variation')) { action = 'image-variation'; prompt = rawQ.replace(/variation/i,'').trim(); }
    else if (lower.startsWith('img2vid') || lower.startsWith('image-to-video')) { action = 'image-to-video'; prompt = rawQ.replace(/img2vid|image-to-video/i,'').trim().replace(/^;|:|-/,'').trim(); }
    else if (lower.startsWith('flux-edit') || lower.startsWith('edit')) { action = 'flux-edit'; prompt = rawQ.replace(/flux-edit|edit/i,'').trim().replace(/^;|:|-/,'').trim(); }
    else { action = 'text-to-image'; }

    if (action === 'text-to-image' && !prompt) prompt = rawQ;

    await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
    reply(`*🎨 ${action.toUpperCase()} processing...*\nPrompt: ${prompt.slice(0,100) || 'image input'}\n\n_${BRAND}_`);

    let imageBuffer = null;
    let imageBase64 = null;
    
    // If action needs image, try to get quoted image
    if (['remove-background','enhance','retouch','unwatermark','image-variation','image-to-video','flux-edit'].includes(action)) {
        try {
            const buf = await downloadQuotedImage(mek, conn);
            if (buf) {
                imageBuffer = buf;
                imageBase64 = buf.toString('base64');
            } else if (action !== 'flux-edit') {
                return reply(`*❌ Reply to an image* for ${action}\nExample: reply image with ${prefix}aimedia ${action}`);
            }
        } catch (e) { console.log('No image found'); }
    }

    // Build payload for POST - OmegaTech pattern
    let payload = {
        action: action,
        prompt: prompt || "enhance image",
        text: prompt,
        mode: action
    };

    if (imageBase64) {
        payload.image = `data:image/jpeg;base64,${imageBase64}`;
        payload.image_base64 = imageBase64;
        payload.url = payload.image;
    }

    const { data } = await axios.post(API_BASE, payload, {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
    });

    const resultUrl = data.data?.url || data.data?.image_url || data.data?.result || data.url || data.result || data.image_url;
    const resultBase64 = data.data?.base64 || data.data?.image_base64;

    if (!resultUrl && !resultBase64) {
        console.log('AI Media raw:', JSON.stringify(data).slice(0,1000));
        // Try GET fallback
        const getUrl = `${API_BASE}?action=${encodeURIComponent(action)}&prompt=${encodeURIComponent(prompt)}`;
        const { data: getData } = await axios.get(getUrl, { timeout: 90000 });
        const url2 = getData.data?.url || getData.url || getData.data?.result;
        if (!url2) throw new Error('No image URL returned from API');
        
        if (action === 'image-to-video') {
            await conn.sendMessage(from, { video: { url: url2 }, caption: `*🎬 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { image: { url: url2 }, caption: `*🎨 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        }
        return;
    }

    if (action === 'image-to-video') {
        if (resultBase64) {
            const buf = Buffer.from(resultBase64, 'base64');
            await conn.sendMessage(from, { video: buf, caption: `*🎬 Generated*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { video: { url: resultUrl }, caption: `*🎬 Generated*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        }
    } else {
        if (resultBase64) {
            const buf = Buffer.from(resultBase64, 'base64');
            await conn.sendMessage(from, { image: buf, caption: `*🎨 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { image: { url: resultUrl }, caption: `*🎨 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        }
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('AI Media Error:', e.response?.data || e.message);
    reply(`*❌ AI Media Failed*\n${e.response?.data?.message || e.message}\n\nUsage:\n${prefix}aimedia a cat in space\nReply image with ${prefix}aimedia removebg`);
  }
});