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
  alias: ["aivideo", "txt2vid"],
  react: "🎬",
  desc: "Sora Debug Version",
  category: "progresstech ai",
  use: ".sora prompt",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = q || "";
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`, 'i'), '').trim();
    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };

    if (!rawQ || ['help','menu'].includes(rawQ.toLowerCase())) {
        return reply(`*Usage:*\n${prefix}sora a cat walking on beach sunset cinematic\n${prefix}sora 16:9 mona lisa dancing`);
    }

    await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });

    let prompt = rawQ;
    let aspect_ratio = "16:9";
    const arMatch = rawQ.match(/(16:9|9:16|1:1)/i);
    if (arMatch) { aspect_ratio = arMatch[1]; prompt = rawQ.replace(arMatch[1], '').trim(); }

    reply(`*🎬 Testing API...*\nPrompt: ${prompt}\nWait...`);

    // TEST 1: GET
    let videoUrl = null;
    let apiResponse = null;
    
    try {
        const url = `${API}?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${aspect_ratio}&ai_sound=true`;
        console.log('SORA TEST URL:', url);
        const { data } = await axios.get(url, { timeout: 120000 });
        apiResponse = data;
        console.log('SORA API RESPONSE:', JSON.stringify(data).slice(0,1000));
        
        // Try all possible fields
        videoUrl = data.result?.url || data.data?.url || data.url || data.video_url || data.result?.video_url || data.videoUrl;
        if (data.success && data.result?.url) videoUrl = data.result.url;
        if (typeof data.result === 'string' && data.result.startsWith('http')) videoUrl = data.result;
        if (typeof data === 'string' && data.startsWith('http')) videoUrl = data;
        
        await conn.sendMessage(from, { text: `*API Raw Response:*\n\`\`\`${JSON.stringify(data).slice(0,2000)}\`\`\`` }, { quoted: mek });
        
    } catch (e) {
        console.log('GET ERROR:', e.response?.data || e.message);
        await conn.sendMessage(from, { text: `*GET Error:*\n${e.response?.data ? JSON.stringify(e.response.data).slice(0,1000) : e.message}` }, { quoted: mek });
    }

    // TEST 2: POST if GET failed
    if (!videoUrl) {
        try {
            const { data } = await axios.post(API, { prompt, aspect_ratio, ai_sound: "true" }, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
            apiResponse = data;
            videoUrl = data.result?.url || data.url || data.data?.url;
            await conn.sendMessage(from, { text: `*POST Response:*\n\`\`\`${JSON.stringify(data).slice(0,2000)}\`\`\`` }, { quoted: mek });
        } catch (e) {
            await conn.sendMessage(from, { text: `*POST Error:*\n${e.response?.data ? JSON.stringify(e.response.data) : e.message}` }, { quoted: mek });
        }
    }

    if (!videoUrl) return reply(`*❌ No video URL found*\nCheck logs above\nAPI Response: ${JSON.stringify(apiResponse || {}).slice(0,500)}`);

    reply(`*✅ Got URL:*\n${videoUrl}\n\nDownloading...`);

    // Download as buffer - REAL VIDEO
    const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
    const videoBuffer = Buffer.from(videoRes.data);

    await conn.sendMessage(from, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `*✅ Sora Video*\nPrompt: ${prompt}\n\n*${BRAND}*`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('SORA DEBUG ERROR:', e);
    reply(`*❌ Final Error:*\n${e.message}\n${e.response?.data ? JSON.stringify(e.response.data).slice(0,500) : ''}`);
  }
});
