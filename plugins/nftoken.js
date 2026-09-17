const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

let store = {}; // sender -> data

function getThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

async function generateNFToken() {
    const { data } = await axios.get('https://api.omegatech.app/api/tools/Nftoken?action=generate', { timeout: 30000 });
    if (data.success && data.data) return data.data;
    throw new Error('Gen failed');
}

cmd({
  pattern: "nftoken",
  alias: ["nft", "netflix"],
  react: "🎬",
  desc: "Netflix NFToken Generator",
  category: "tools",
  use: ".nftoken",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    const sender = m.sender;
    const args = q?.trim().split(' ') || [];
    const sub = args[0]?.toLowerCase() || '';

    // ===== HANDLE COPY CLICKS =====
    if (sub === 'copy' && args[1]!== undefined) {
        const idx = parseInt(args[1]);
        const saved = store[from] || store[sender];
        if (!saved) return reply('⚠️ No token. Do.nftoken first');
        const link = saved.links[idx];
        if (!link) return reply('❌ Invalid');
        return await conn.sendMessage(from, {
            text: `*${link.device}*\n\n🔗 Link:\n${link.url}\n\n🔑 Token:\n\`\`\`${saved.token}\`\`\`\n\n_Tap and hold to copy_`,
        }, { quoted: mek });
    }
    if (sub === 'token') {
        const saved = store[from] || store[sender];
        if (!saved) return reply('⚠️ No token. Do.nftoken first');
        return await conn.sendMessage(from, {
            text: `*🔑 NFToken*\n\n\`\`\`${saved.token}\`\`\`\n\n_Tap and hold to copy_`,
        }, { quoted: mek });
    }

    // ===== GENERATE NEW =====
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const data = await generateNFToken();
    const token = data.token;
    const links = data.links?.all || [];
    store[from] = { token, links, raw: data };
    store[sender] = { token, links, raw: data };

    let thumb = null;
    try {
        const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
        const tb = getThumb();
        if (tb) {
            const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
            thumb = media.imageMessage;
        }
    } catch {}

    const menu = `┏━━〔 🎬 NFToken Generator 〕━━┓
┃ 🔑 Token: ${token.substring(0, 35)}...
┃ 📱 Devices: ${links.length}
┃ 🕐 ${new Date().toLocaleString()}
┗━━━━━━━━━━━━━━┛
📌 Tap a device to copy its link:`;

    // Build buttons from REAL api links
    let buttons = [];

    // PC/Browser -> direct URL button
    const pc = links.find(l => l.device.toLowerCase().includes('pc') || l.device.toLowerCase().includes('browser'));
    if (pc) {
        buttons.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: `🖥️ ${pc.device}`, url: pc.url }) });
    }

    // Android -> direct URL
    const android = links.find(l => l.device.toLowerCase().includes('android'));
    if (android) {
        buttons.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: `📱 ${android.device}`, url: android.url }) });
    }

    // Other devices as quick_reply that triggers copy logic
    links.forEach((link, i) => {
        if (link.device.toLowerCase().includes('pc') || link.device.toLowerCase().includes('android')) return; // already added as URL
        if (buttons.length >= 4) return; // reserve last slot for copy token
        buttons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: `📺 ${link.device}`, id: `${prefix}nftoken copy ${i}` })
        });
    });

    // THIS IS THE FIX FOR BLANK COPY
    buttons.push({
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({ display_text: "🔑 Copy Token", copy_code: token })
    });

    await conn.relayMessage(from, {
        interactiveMessage: {
            header: { title: "🎬 Netflix NFToken", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
            body: { text: menu },
            footer: { text: "🔹 Powered by Progress Tech • Omegatech API ✓" },
            nativeFlowMessage: { buttons }
        },
        contextInfo: {
            forwardingScore: 999, isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid: '120363425282620066@newsletter', serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
        }
    }, {});

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error(e);
    reply(`❌ Failed: ${e.message}`);
  }
});
