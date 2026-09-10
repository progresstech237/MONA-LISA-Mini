const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

// ✅ YOUR BRANDING
const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';

let argenSessions = {};

function getThumb() {
    try {
        const files = ['./media/menu1.png','./media/menu2.png','./media/menu3.png','./media/menu4.png'];
        for (const p of files) if (fs.existsSync(p)) return fs.readFileSync(p);
        return null;
    } catch { return null; }
}

async function callArgen(prompt) {
    // Omegatech Argen route
    const url = `https://api.omegatech.app/api/ai/Argen?action=ask&prompt=${encodeURIComponent(prompt)}`;
    const { data } = await axios.get(url, { timeout: 60000 });
    return data;
}

cmd({
  pattern: "argen",
  alias: ["argenai", "aiargen"],
  react: "🤖",
  desc: "Argen AI - Progress Tech",
  category: "progresstech ai",
  use: ".argen hi | .argen login",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    // ✅ Read button clicks
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

    const args = rawQ ? rawQ.split(' ') : (q ? q.split(' ') : []);
    const sub = args[0]?.toLowerCase() || '';

    const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 142,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    if (sub === 'login' || !rawQ) {
        // Show login / welcome menu like other plugins
        let thumbBuffer = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const tb = getThumb();
            if (tb) {
                const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer });
                thumbBuffer = media.imageMessage;
            }
        } catch {}

        let menuText = `┏━━〔 🤖 Argen AI Login 〕━━┓
┃ 👋 Welcome to Argen AI
┃ 🔹 ${BRAND}
┃ 
┃ 📌 *How to use:*
┃ • ${prefix}argen <your question>
┃ • Example: ${prefix}argen explain quantum physics
┗━━━━━━━━━━━━━━┛
`;

        const buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: "🚀 Start Chat", id: `${prefix}argen hi` })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: "💡 Examples", id: `${prefix}argen give me 5 business ideas` })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK })
            }
        ];

        const msg = {
            interactiveMessage: {
                header: { title: "🤖 Argen AI • Progress Tech", hasMediaAttachment: !!thumbBuffer, ...(thumbBuffer ? { imageMessage: thumbBuffer } : {}) },
                body: { text: menuText },
                footer: { text: BRAND },
                nativeFlowMessage: { buttons }
            },
            contextInfo
        };
        return await conn.relayMessage(from, msg, {});
    }

    // Normal chat
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    const result = await callArgen(rawQ);
    const answer = result.data?.result || result.result || result.data?.answer || result.data || result.message || JSON.stringify(result).slice(0,3000);

    // Save session
    argenSessions[m.sender] = { lastPrompt: rawQ, lastAnswer: answer, time: Date.now() };

    await conn.sendMessage(from, { 
        text: `*🤖 Argen AI*\n\n${answer}\n\n*${BRAND}*\n*📢 ${CHANNEL_LINK}*`,
        contextInfo
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Argen Error:', e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`*❌ Argen Failed*\n\n*Error: ${e.message}*\n\nIf API needs apikey, open https://api.omegatech.app/api.html and check what params Argen needs (prompt / apikey)`);
  }
});