const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

let store = {};

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/logo.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

async function generateNFToken() {
    const urls = [
        'https://api.omegatech.app/api/tools/Nftoken?action=generate',
        'https://omegatech-api.dixonomega.tech/api/tools/Nftoken?action=generate',
        'https://api.dixonomega.tech/api/tools/Nftoken?action=generate'
    ];
    let lastErr = null;
    for (const url of urls) {
        try {
            const { data } = await axios.get(url, { timeout: 30000 });
            if (data.success && data.data?.token) return data.data;
            if (data.token) return data; // some versions return direct
            lastErr = JSON.stringify(data).slice(0,300);
        } catch (e) {
            lastErr = e.response?.data || e.message;
        }
    }
    throw new Error('Gen failed: ' + lastErr);
}

cmd({
  pattern: "nftoken",
  alias: ["nft", "netflix", "nftok"],
  react: "🎬",
  desc: "Netflix NFToken Generator - Omegatech",
  category: "tools",
  use: ".nftoken",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    const pre = prefix || '.'; // FIX undefined bug
    const sender = m.sender;
    const args = q?.trim().split(' ').filter(a=>a) || [];
    const sub = args[0]?.toLowerCase() || '';

    if (sub === 'copy') {
        const idx = parseInt(args[1]);
        const saved = store[from] || store[sender] || store['global'];
        if (!saved) return reply(`⚠️ No token found. Do ${pre}nftoken first`);
        const link = saved.links[idx];
        if (!link || isNaN(idx)) return reply(`❌ Invalid index. Do ${pre}nftoken again`);
        return await conn.sendMessage(from, {
            text: `*${link.device}*\n\n🔗 *Link:*\n${link.url}\n\n🔑 *Token:*\n\`\`\`${saved.token}\`\`\`\n\n_Tap and hold to copy token_`,
        }, { quoted: mek });
    }

    if (sub === 'token') {
        const saved = store[from] || store[sender] || store['global'];
        if (!saved) return reply(`⚠️ No token. Do ${pre}nftoken first`);
        return await conn.sendMessage(from, {
            text: `*🔑 NFToken*\n\n\`\`\`${saved.token}\`\`\`\n\n_Tap and hold to copy_`,
        }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const data = await generateNFToken();
    const token = data.token;
    const links = data.links?.all || data.links || [];

    if (!token) throw new Error('API returned no token');

    store[from] = { token, links, raw: data };
    store[sender] = { token, links, raw: data };
    store['global'] = { token, links, raw: data };

    let thumbMsg = null;
    try {
        const tb = getThumb();
        if (tb) {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
            thumbMsg = media.imageMessage;
        }
    } catch (e) {
        console.log('Thumb skip:', e.message);
    }

    const menu = `┏━━〔 🎬 NFToken Generator 〕━━┓
┃ 🔑 Token: ${token.substring(0, 35)}...
┃ 📱 Devices: ${links.length}
┃ 🕐 ${new Date().toLocaleString()}
┗━━━━━━━━━━━━━━┛
📌 Tap a device to open / copy:`;

    let buttons = [];

    const pc = links.find(l => l.device?.toLowerCase().includes('pc') || l.device?.toLowerCase().includes('browser') || l.device?.toLowerCase().includes('web'));
    if (pc) {
        buttons.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: `🖥️ ${pc.device}`, url: pc.url }) });
    }

    const android = links.find(l => l.device?.toLowerCase().includes('android'));
    if (android) {
        buttons.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: `📱 ${android.device}`, url: android.url }) });
    }

    links.forEach((link, i) => {
        const low = link.device?.toLowerCase() || '';
        if (low.includes('pc') || low.includes('browser') || low.includes('web') || low.includes('android')) {
            if (buttons.length < 2) return; // already added as URL, skip duplicate
        }
        if (buttons.length >= 4) return;
        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: `📺 ${link.device}`, id: `${pre}nftoken copy ${i}` })
        });
    });

    buttons.push({
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({ display_text: "🔑 Copy Token", copy_code: token })
    });

    // Limit to 5 buttons max for WhatsApp
    buttons = buttons.slice(0, 5);

    await conn.relayMessage(from, {
        interactiveMessage: {
            header: {
                title: "🎬 Netflix NFToken",
                hasMediaAttachment:!!thumbMsg,
               ...(thumbMsg? { imageMessage: thumbMsg } : {})
            },
            body: { text: menu },
            footer: { text: "🔹 Powered by Progress Tech • Omegatech API ✓" },
            nativeFlowMessage: { buttons }
        }
    }, {});

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('NFTOKEN ERROR:', e.stack || e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`❌ Failed: ${e.message}\nTry again in 10s`);
  }
});
