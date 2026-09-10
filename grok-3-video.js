const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/grok-3-video';

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

cmd({
  pattern: "grokvideo",
  alias: ["grok3video", "grokv", "grok-v", "grok3"],
  react: "🤖",
  desc: "Grok-3 Video - AI video with optional image input, 16:9 9:16 1:1",
  category: "progresstech ai",
  use: ".grokvideo a cat dancing |.grokvideo 9:16 an astronaut (reply to image for img2vid)",
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

    // Check for image
    let imageBuffer = null;
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (quoted) {
            imageBuffer = await conn.downloadMediaMessage({ message: { imageMessage: quoted } });
        } else if (mek.message?.imageMessage) {
            imageBuffer = await conn.downloadMediaMessage(mek);
        }
    } catch {}

    const hasImage = !!imageBuffer;

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

        const menu = `┏━━〔 🤖 Grok-3 Video 〕━━┓
┃ Creates AI video using Grok-3
┃ Supports image input + ratios
┃
┃ *Usage - Text to Video:*
┃ ${prefix}grokvideo a cat astronaut dancing in space
┃ ${prefix}grokvideo 16:9 cinematic city sunset
┃ ${prefix}grokvideo 9:16 Mona Lisa dancing afro vibe
┃
┃ *Usage - Image to Video:*
┃ Reply to image + ${prefix}grokvideo make it dance
┃ Reply to image + ${prefix}grokvideo 9:16 zoom in cinematic
┃
┃ *Ratios:*
┃ 16:9 - Landscape
┃ 9:16 - Portrait / TikTok
┃ 1:1 - Square
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🤖 16:9 Landscape", id: `${prefix}grokvideo 16:9 cinematic drone shot of futuristic city at sunset` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📱 9:16 Portrait", id: `${prefix}grokvideo 9:16 Mona Lisa afro girl dancing, omah lay vibe, cinematic` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🖼️ Image to Video", id: `${prefix}grokvideo animate this image, slow zoom in, cinematic` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🤖 Grok-3 Video • xAI", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: hasImage? "🖼️" : "🤖", key: mek.key } });

    let prompt = rawQ;
    let aspectRatio = "16:9";

    const arMatch = rawQ.match(/(16:9|9:16|1:1)/i);
    if (arMatch) {
        aspectRatio = arMatch[1];
        prompt = rawQ.replace(arMatch[1], '').trim();
    }

    if (!prompt && hasImage) prompt = "animate this image, cinematic motion, 4k";
    if (!prompt) prompt = rawQ;

    reply(`*🤖 Grok-3 Video Generating...*\n*Mode:* ${hasImage? 'Image to Video' : 'Text to Video'}\n*Prompt:* ${prompt.slice(0,120)}\n*Ratio:* ${aspectRatio}\n\n_Wait 30-90 sec... Grok-3 is powerful_\n\n_${BRAND}_`);

    let videoUrl = null;

    // If has image, use FormData POST
    if (hasImage) {
        try {
            const form = new FormData();
            form.append('image', imageBuffer, { filename: 'input.jpg', contentType: 'image/jpeg' });
            form.append('image_file', imageBuffer, { filename: 'input.jpg', contentType: 'image/jpeg' });
            form.append('file', imageBuffer, { filename: 'input.jpg', contentType: 'image/jpeg' });
            form.append('prompt', prompt);
            form.append('text', prompt);
            form.append('aspect_ratio', aspectRatio);
            form.append('aspectRatio', aspectRatio);
            form.append('ratio', aspectRatio);

            const { data } = await axios.post(API, form, {
                timeout: 180000,
                headers: {...form.getHeaders() },
            });

            videoUrl = data.data?.url || data.data?.video_url || data.data?.videoUrl || data.url || data.video_url || data.data?.result || data.result;
            if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;

        } catch (e) {
            console.log('Grok image POST error', e.response?.data || e.message);
            // Fallback base64
            try {
                const base64 = imageBuffer.toString('base64');
                const { data } = await axios.post(API, {
                    prompt: prompt,
                    text: prompt,
                    image: `data:image/jpeg;base64,${base64}`,
                    image_base64: base64,
                    aspect_ratio: aspectRatio,
                    aspectRatio: aspectRatio
                }, { timeout: 180000, headers: { 'Content-Type': 'application/json' } });

                videoUrl = data.data?.url || data.data?.video_url || data.url || data.video_url;
            } catch (e2) {
                console.log('Grok base64 also failed', e2.message);
            }
        }
    }

    // Text-only POST
    if (!videoUrl) {
        try {
            const { data } = await axios.post(API, {
                prompt: prompt,
                text: prompt,
                query: prompt,
                aspect_ratio: aspectRatio,
                aspectRatio: aspectRatio,
                ratio: aspectRatio
            }, { timeout: 180000, headers: { 'Content-Type': 'application/json' } });

            videoUrl = data.data?.url || data.data?.video_url || data.data?.videoUrl || data.url || data.video_url || data.data?.link || data.data?.result;
            if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
        } catch (e) {
            console.log('Grok POST text failed', e.message);
        }
    }

    // GET fallback (your screenshot shows GET working)
    if (!videoUrl) {
        const urls = [
            `${API}?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspectRatio)}`,
            `${API}?text=${encodeURIComponent(prompt)}&ratio=${aspectRatio}`,
            `https://api.omegatech.app/api/ai/grok-3-video?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${aspectRatio}`
        ];
        for (const u of urls) {
            try {
                const { data } = await axios.get(u, { timeout: 180000 });
                videoUrl = data.data?.url || data.data?.video_url || data.url || data.video_url || data.data?.result;
                if (!videoUrl && typeof data.data === 'string' && data.data.startsWith('http')) videoUrl = data.data;
                if (videoUrl) break;
            } catch {}
        }
    }

    if (!videoUrl) throw new Error('No video URL returned from Grok-3 API');

    await conn.sendMessage(from, {
        video: { url: videoUrl },
        caption: `*✅ Grok-3 Video Generated*\n*Prompt:* ${prompt}\n*Mode:* ${hasImage? 'Image to Video' : 'Text to Video'}\n*Ratio:* ${aspectRatio}\n\n*${BRAND}*\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Grok-3 Video Error:', e.response?.data || e.message);
    reply(`*❌ Grok-3 Video Failed*\n${e.response?.data?.message || e.message}\n\nTry: ${'.grokvideo a cat dancing in space'}`);
  }
});