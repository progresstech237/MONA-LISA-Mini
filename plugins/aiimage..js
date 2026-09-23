const { cmd } = require('../redx');
const axios = require('axios');

const API = 'https://omegatech-api.dixonomega.tech/api/ai/text2image';
const API_BACKUP = 'https://api.dixonomega.tech/api/ai/text2image';

cmd({
  pattern: "aimage",
  alias: ["imagine", "text2img", "genimg"],
  react: "🎨",
  desc: "Omegatech Text2Image Pro",
  category: "progresstech ai",
  use: ".aimage HD anime girl in space suit",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    // FIX undefined prefix bug - use fallback
    const pre = prefix || '.';

    if (!q) {
        return reply(`*🎨 Text2Image Pro*\n\n*Usage:*\n${pre}aimage HD realistic girl with blue eyes\n${pre}aimage anime boy, cinematic, 8k\n${pre}aimage dog with sunglasses, funny\n\n*Tip:* Use long description for best result`);
    }

    const prompt = q.trim();

    await conn.sendMessage(from, { 
        text: `*🎨 Generating...*\n*Prompt:* ${prompt}\n\n*Wait 15s...*\n🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    let imageUrl = null;

    // === TRY 1: Main API GET ===
    try {
        const { data } = await axios.get(API, {
            params: { prompt },
            timeout: 90000
        });
        console.log('AIMAGE DATA:', JSON.stringify(data).slice(0,1000));
        // Omegatech returns different formats, check all
        imageUrl = data.imageUrl || data.image_url || data.url || data.result || data.image || data.data?.imageUrl || data.data?.url;
        if (typeof data === 'string' && data.startsWith('http')) imageUrl = data.trim();
        if (typeof data.data === 'string' && data.data.startsWith('http')) imageUrl = data.data.trim();
    } catch (e) {
        console.log('AIMAGE try1 fail:', e.response?.data || e.message);
    }

    // === TRY 2: Backup API ===
    if (!imageUrl) {
        try {
            const { data } = await axios.get(API_BACKUP, {
                params: { prompt, model: 'pro' },
                timeout: 90000
            });
            console.log('AIMAGE BACKUP:', JSON.stringify(data).slice(0,1000));
            imageUrl = data.imageUrl || data.image_url || data.url || data.result;
        } catch (e) {
            console.log('AIMAGE try2 fail:', e.message);
        }
    }

    // === TRY 3: POST ===
    if (!imageUrl) {
        try {
            const { data } = await axios.post(API, { prompt }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 90000
            });
            imageUrl = data.imageUrl || data.image_url || data.url || data.result;
        } catch (e) {
            console.log('AIMAGE try3 fail:', e.message);
        }
    }

    if (!imageUrl) {
        throw new Error('API did not return image URL. API might be down. Check logs.');
    }

    console.log('Downloading image:', imageUrl.slice(0,100));

    // === DOWNLOAD AS BUFFER (MOST IMPORTANT FIX) ===
    const imgRes = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const buffer = Buffer.from(imgRes.data);

    // Check if buffer is actually error JSON
    if (buffer.length < 2000) {
        const check = buffer.toString('utf8');
        if (check.includes('error') || check.includes('<html') || check.includes('{')) {
            throw new Error('API returned error file: ' + check.slice(0,300));
        }
    }

    await conn.sendMessage(from, {
        image: buffer,
        caption: `*🎨 Generated*\n*Prompt:* ${prompt}\n\n🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('AIMAGE FATAL:', e.response?.data || e.message);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`*❌ Image Failed*\n*Error:* ${e.response?.data?.message || e.message}\n\nTry shorter prompt:\n${prefix || '.'}aimage a cat`);
  }
});