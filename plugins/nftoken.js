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
`;

    const buttons = [];
    links.slice(0, 6).forEach((link, index)=>{
        buttons.push({
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: `📱 ${link.device}`,
                sections: [{ title: link.device, highlight_label: "🔗 Copy", rows: [{ id: `${prefix}nft copy ${index}`, title: link.device, description: `Copy ${link.device} link` }] }]
            })
        });
    });

    buttons.push({
        name: "single_select",
        buttonParamsJson: JSON.stringify({
            title: "🔑 Copy Token",
            sections: [{ title: "Token", highlight_label: "📋", rows: [{ id: `${prefix}nft token`, title: "Copy Token", description: "Copy the raw token" }] }]
        })
    });

    buttons.push({
        name: "single_select",
        buttonParamsJson: JSON.stringify({
            title: "🔄 Regenerate",
            sections: [{ title: "Generate New", highlight_label: "🔄", rows: [{ id: `${prefix}nft`, title: "Generate New", description: "Create a fresh NFToken" }] }]
        })
    });

    buttons.push({
        name: "cta_url",
        buttonParamsJson: JSON.stringify({ display_text: "📢 Follow TECH TOY Channel", url: CHANNEL_LINK })
    });

    const interactiveMsg = {
        interactiveMessage: {
            header: { title: "🎬 Netflix NFToken", hasMediaAttachment:!!imageMessage,...(imageMessage? { imageMessage } : {}) },
            body: { text: menuText.substring(0, 2000) },
            footer: { text: BRAND_FOOTER },
            nativeFlowMessage: { buttons: buttons.slice(0, 5) }
        }
    };

    await conn.relayMessage(from, interactiveMsg, {
        additionalNodes: [{ tag: "biz", attrs: {}, content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }] }]
    });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('NFToken Error:', e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`*❌ Failed to generate NFToken.*\n\n*Error: ${e.message || 'Unknown error'}*\n\n*💡 Please try again later.*`);
  }
});
