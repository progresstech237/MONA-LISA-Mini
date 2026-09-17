const { cmd } = require('../redx');
const axios = require('axios');

const API_BASE = 'https://omegatech-api.dixonomega.tech/api/ai/Text2image-pro';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const NEWSLETTER_JID = '120363425282620066@newsletter';

cmd({
  pattern: "aimage",
  alias: ["aiimg", "txt2img", "imagine", "genimg"],
  react: "🎨",
  desc: "Omegatech Text to Image Pro",
  category: "progresstech ai",
  use: ".aimage HD realistic anime girl",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let prompt = q?.trim() || "";
    if (prompt.startsWith(prefix)) prompt = prompt.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`, 'i'), '').trim();
    
    if (!prompt || ['help','menu'].includes(prompt.toLowerCase())) {
        return reply(`*🎨 Text2Image Pro - Omegatech*\n\n*Usage:*\n${prefix}aimage HD realistic anime girl\n${prefix}aimage beautiful girl in space suit, cinematic\n${prefix}aimage anime boy with blue eyes, 8k\n\n*Tip:* Be descriptive for better result`);
    }

    await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
    await conn.sendMessage(from, { text: `*🎨 Generating Image...*\n*Prompt:* ${prompt}\n\n_Wait 10s..._\n_${BRAND}_` }, { quoted: mek });

    const url = `${API_BASE}?action=generate&prompt=${encodeURIComponent(prompt)}&negativePrompt=${encodeURIComponent('Deform, double part, ai looks, blurry, low quality')}&cfg=6`;
    
    const { data } = await axios.get(url, { timeout: 60000 });
    
    if (!data.success || !data.data?.resultImageUrl) {
        throw new Error('No image returned: ' + JSON.stringify(data).slice(0,500));
    }

    const imageUrl = data.data.resultImageUrl;
    const taskId = data.data.taskId;

    // Download as buffer for real file
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60000 });

    await conn.sendMessage(from, {
        image: Buffer.from(imgRes.data),
        mimetype: 'image/webp',
        caption: `*✅ Image Generated*\n*Prompt:* ${prompt}\n*Task:* ${taskId}\n*Time:* ${data.data.runtime}\n\n*${BRAND}*`,
        contextInfo: {
            forwardingScore: 999, isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
        }
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('AI Image Error:', e.response?.data || e.message);
    reply(`*❌ Image Failed*\n${e.message}`);
  }
});
