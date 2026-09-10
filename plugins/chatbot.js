const { cmd } = require('../redx');
const axios = require('axios');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';

let chatMemory = {}; // per user memory

async function tryChatbotAPI(prompt, retries = 2) {
    const endpoints = [
        `https://api.omegatech.app/api/ai/Chatbot?action=chat&message=${encodeURIComponent(prompt)}`,
        `https://api.omegatech.app/api/ai/Chatbot?action=ask&prompt=${encodeURIComponent(prompt)}`,
        `https://api.omegatech.app/api/ai/Chatbot?prompt=${encodeURIComponent(prompt)}`,
        `https://api.omegatech.app/api/ai/Chatbot?text=${encodeURIComponent(prompt)}&action=chat`,
    ];
    
    let lastError;
    for (const url of endpoints) {
        try {
            const { data } = await axios.get(url, { timeout: 30000 });
            if (data) {
                const result = data.data?.result || data.result || data.answer || data.data?.answer || data.data;
                if (result && typeof result === 'string' && result.length > 2) return result;
                if (result) return result;
            }
        } catch (e) { lastError = e; }
    }
    throw lastError || new Error('All endpoints failed');
}

cmd({
  pattern: "chatbot",
  alias: ["ai", "gpt", "chat"],
  react: "🤖",
  desc: "Omegatech Chatbot AI",
  category: "progresstech ai",
  use: ".chatbot hello",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) return reply(`*Usage:* ${prefix}chatbot <message>\nExample: ${prefix}chatbot who are you?\n\n${BRAND}`);

    await conn.sendMessage(from, { react: { text: "💭", key: mek.key } });

    const answer = await tryChatbotAPI(q);

    const contextInfo = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
        }
    };

    await conn.sendMessage(from, {
        text: `*🤖 Chatbot AI*\n\n${answer}\n\n_${BRAND}_\n📢 ${CHANNEL_LINK}`,
        contextInfo
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Chatbot Error:', e.message);
    reply(`*❌ Chatbot failed.*\n${e.message}\n\nTry again.`);
  }
});