let cmd;
try { cmd = require('../redx').cmd; } catch {
    try { cmd = require('../../redx').cmd; } catch {
        try { cmd = require('../lib/redx').cmd; } catch {
            cmd = require('./redx').cmd;
        }
    }
}
const axios = require('axios');
const fs = require('fs');

let store = {};

async function generateNFToken() {
    const urls = [
        'https://api.omegatech.app/api/tools/Nftoken?action=generate',
        'https://omegatech-api.dixonomega.tech/api/tools/Nftoken?action=generate'
    ];
    for (const url of urls) {
        try {
            const { data } = await axios.get(url, { timeout: 30000 });
            if (data.success && data.data?.token) return data.data;
            if (data.data?.token) return data.data;
        } catch(e){ console.log('retry', e.message); }
    }
    throw new Error('API down');
}

cmd({
  pattern: "nftoken",
  alias: ["nft","netflix"],
  react: "🎬",
  desc: "Netflix NFToken - Omegatech",
  category: "tools",
  use: ".nft",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    const pre = prefix || '.';
    const args = q?.trim().split(' ').filter(Boolean) || [];
    const sub = args[0]?.toLowerCase() || '';

    if (sub === 'copy') {
        const saved = store[from];
        if (!saved) return reply('⚠️ Generate first with.nft');
        const idx = parseInt(args[1]);
        const link = saved.links[idx];
        if (!link) return reply('❌ Invalid index');
        return conn.sendMessage(from, { text: `📱 *${link.device}*\n\n🔗 ${link.url}\n\nToken:\n\`\`\`${saved.token}\`\`\`` }, { quoted: mek });
    }
    if (sub === 'token') {
        const saved = store[from];
        if (!saved) return reply('⚠️ Generate first with.nft');
        return conn.sendMessage(from, { text: `🔑 *NFToken*\n\n\`\`\`${saved.token}\`\`\`` }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    const data = await generateNFToken();
    store[from] = { token: data.token, links: data.links.all || data.links };

    let menu = `┏━━〔 🎬 NFToken 〕━━┓
┃ 🔑 ${data.token.substring(0,35)}...
┃ 📱 ${store[from].links.length} Devices
┗━━━━━━━━━━━━━━┛`;

    let buttons = [];
    store[from].links.slice(0,3).forEach((l,i)=>{
        buttons.push({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: `📺 ${l.device}`, id: `${pre}nftoken copy ${i}` }) });
    });
    buttons.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "🔑 Copy Token", copy_code: data.token }) });

    await conn.relayMessage(from, {
        interactiveMessage: {
            body: { text: menu },
            footer: { text: "Powered by Progress Tech ✓" },
            nativeFlowMessage: { buttons }
        }
    }, {});
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error(e);
    reply(`❌ ${e.message}`);
  }
});
