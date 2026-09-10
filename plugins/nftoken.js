        const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

// ✅ YOUR BRANDING - Progress Tech / TECH TOY
const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND_FOOTER = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓ | NFToken v1.0';

let nftTokens = {};

function getBotThumb() {
    try {
        const thumbFiles = ['./media/menu1.png','./media/menu2.png','./media/menu3.png','./media/menu4.png','./media/menu-main.jpg','./media/menu-thumb.jpg'];
        for (const path of thumbFiles) { if (fs.existsSync(path)) return fs.readFileSync(path); }
        return null;
    } catch { return null; }
}

async function generateNFToken(retries = 3) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const url = 'https://api.omegatech.app/api/tools/Nftoken?action=generate';
            const { data } = await axios.get(url, { timeout: 30000 });
            if (data.success && data.data) return data;
            throw new Error('Generation failed');
        } catch (e) {
            lastError = e;
            console.log(`[NFToken] Retry ${i+1}/${retries}: ${e.message}`);
            if (i < retries - 1) await new Promise(r=>setTimeout(r, 1000*(i+1)));
        }
    }
    throw lastError || new Error('Failed after retries');
}

async function prepareImage(conn) {
    try {
        const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
        let thumbBuffer = getBotThumb();
        if (!thumbBuffer) return null;
        const media = await prepareWAMessageMedia({ image: thumbBuffer }, { upload: conn.waUploadToServer });
        return media.imageMessage;
    } catch { return null; }
}

cmd({
  pattern: "nft",
  alias: ["nftoken", "netflix"],
  react: "🎬",
  desc: "Generate Netflix NFToken for different devices",
  category: "progresstech tools",
  use: ".nft |.nft copy 0 |.nft token",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    const args = q? q.split(' ') : [];
    const subCommand = args[0]?.toLowerCase() || '';

    if (subCommand === 'copy' && args[1]!== undefined) {
        const idx = parseInt(args[1]);
        const nftData = nftTokens[m.sender];
        if (!nftData ||!nftData.data) return reply(`*⚠️ No NFToken found. Please generate one first using ${prefix}nft*`);
        const links = nftData.data.links.all || [];
        if (idx >= links.length) return reply(`*❌ Invalid device selection.*`);
        const selected = links[idx];
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: NEWSLETTER_JID,
                serverMessageId: 142,
                newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
            }
        };
        await conn.sendMessage(from, { text: `*📱 ${selected.device}*\n\n*🔗 \`${selected.url}\`*\n\n*📋 Tap and hold to copy.*\n\n*${BRAND_FOOTER}*`, contextInfo }, { quoted: mek });
        return;
    }

    if (subCommand === 'token') {
        const nftData = nftTokens[m.sender];
        if (!nftData ||!nftData.data) return reply(`*⚠️ No NFToken found. Please generate first using ${prefix}nft*`);
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: NEWSLETTER_JID,
                serverMessageId: 142,
                newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
            }
        };
        await conn.sendMessage(from, { text: `*🔑 NFToken*\n\n*\`${nftData.data.token}\`*\n\n*📋 Tap and hold to copy.*\n\n*${BRAND_FOOTER}*`, contextInfo }, { quoted: mek });
        return;
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    reply(`*🔄 Generating NFToken...*`);

    const result = await generateNFToken(3);
    const data = result.data;
    const token = data.token;
    const links = data.links.all || [];
    const generatedAt = data.generatedAt || new Date().toISOString();

    nftTokens[m.sender] = { data: data, timestamp: Date.now() };

    let imageMessage = await prepareImage(conn);

    let menuText = `
┏━━〔 🎬 NFToken Generator 〕━━┓
┃ 🔑 Token: ${token.substring(0, 40)}...
┃ 📱 Devices: ${links.length}
┃ 🕐 Generated: ${new Date(generatedAt).toLocaleString()}
┗━━━━━━━━━━━━━━┛

📌 *Select a device below to copy the link:*
`;const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';

let nftTokens = {};

function getBotThumb() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png','./media/menu4.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
        return null;
    } catch { return null; }
}

async function generateNFToken() {
    const { data } = await axios.get('https://api.omegatech.app/api/tools/Nftoken?action=generate', { timeout: 30000 });
    if (!data.success) throw new Error('Failed');
    return data;
}

cmd({
  pattern: "nft",
  alias: ["nftoken"],
  react: "🎬",
  desc: "Netflix NFToken",
  category: "progresstech tools",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    // ====== FIX 1: READ BUTTON CLICKS ======
    let body = q || "";
    // For interactive buttons
    if (mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
        try {
            const json = JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
            if (json.id) body = json.id.replace(prefix,'').trim();
        } catch {}
    }
    // For list selection
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
        body = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,'').trim();
    }
    // For template buttons (some Baileys)
    if (m.message?.buttonsResponseMessage?.selectedButtonId) {
        body = m.message.buttonsResponseMessage.selectedButtonId.replace(prefix,'').trim();
    }

    const args = body.split(' ');
    const sub = args[0]?.toLowerCase() || '';

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };

    if (sub === 'copy') {
        const idx = parseInt(args[1]);
        const cache = nftTokens[m.sender];
        if (!cache) return reply('⚠️ Generate first with.nft');
        const link = cache.data.links.all[idx];
        if (!link) return reply('❌ Invalid selection');
        return await conn.sendMessage(from, { text: `*📱 ${link.device}*\n\n🔗 \`${link.url}\`\n\n📋 Tap to copy\n\n${BRAND}\n${CHANNEL_LINK}`, contextInfo: ctx }, { quoted: mek });
    }

    if (sub === 'token') {
        const cache = nftTokens[m.sender];
        if (!cache) return reply('⚠️ Generate first with.nft');
        return await conn.sendMessage(from, { text: `*🔑 NFToken*\n\n\`${cache.data.token}\`\n\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
    }

    // Generate new
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    const res = await generateNFToken();
    nftTokens[m.sender] = res;

    const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
    const thumb = getBotThumb();
    let imgMsg = null;
    if (thumb) {
        const media = await prepareWAMessageMedia({ image: thumb }, { upload: conn.waUploadToServer });
        imgMsg = media.imageMessage;
    }

    const tokenShort = res.data.token.substring(0, 45) + '...';
    let txt = `┏━━〔 🎬 NFToken 〕━━┓\n┃ 🔑 ${tokenShort}\n┃ 📱 Devices: ${res.data.links.all.length}\n┗━━━━━━━━━━━━┛\n\n📌 Select below:`;

    // ====== FIX 2: USE WORKING BUTTON FORMAT (NO biz node) ======
    const buttons = res.data.links.all.slice(0,4).map((l,i)=>({
        name: "single_select",
        buttonParamsJson: JSON.stringify({
            title: `📱 ${l.device}`,
            sections: [{ title: l.device, highlight_label: "🔗 Copy", rows: [{ id: `${prefix}nft copy ${i}`, title: l.device, description: `Copy ${l.device}` }] }]
        })
    }));

    buttons.push({
        name: "single_select",
        buttonParamsJson: JSON.stringify({
            title: "🔑 Copy Token",
            sections: [{ title: "Copy Token", rows: [{ id: `${prefix}nft token`, title: "Copy Token", description: "Raw token" }] }]
        })
    });
    buttons.push({
        name: "cta_url",
        buttonParamsJson: JSON.stringify({ display_text: "📢 Follow Channel", url: CHANNEL_LINK })
    });

    await conn.relayMessage(from, {
        interactiveMessage: {
            header: { title: "🎬 Netflix NFToken", hasMediaAttachment:!!imgMsg,...(imgMsg? { imageMessage: imgMsg } : {}) },
            body: { text: txt },
            footer: { text: BRAND },
            nativeFlowMessage: { buttons }
        },
        contextInfo: ctx
    }, {});

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.log(e);
    reply(`❌ ${e.message}`);
  }
});
