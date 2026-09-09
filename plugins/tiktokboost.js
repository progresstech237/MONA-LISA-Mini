const { cmd } = require('../redx');
const axios = require('axios');

cmd({
  pattern: "tiktokboost",
  alias: ["ttboost", "boosttiktok"],
  react: "🎯",
  desc: "Boost TikTok video views and likes",
  category: "progresstech tools",
  use: ".tiktokboost <tiktok_url>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) {
        return reply(`*⚠️ TIKTOK BOOSTER 👑*\n\n*Please provide a TikTok video URL*\n\n*Example: ${prefix}tiktokboost https://www.tiktok.com/@username/video/123456789*`);
    }

    const urlMatch = q.match(/(https?:\/\/[^\s]+)/i);
    if (!urlMatch) return reply(`*❌ Invalid URL. Please provide a valid TikTok video link.*`);

    const tiktokUrl = urlMatch[0];
    if (!tiktokUrl.includes('tiktok.com')) return reply(`*❌ Please provide a valid TikTok URL.*`);

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    reply(`*🔄 Processing your request...*\n\n*📱 Boosting TikTok video:*\n${tiktokUrl}`);

    const apiUrl = `https://omegatech-api.dixonomega.tech/api/Fun/Tiktok-booster?action=boost&url=${encodeURIComponent(tiktokUrl)}`;
    const response = await axios.get(apiUrl, { timeout: 30000 });

    if (!response.data.success) throw new Error('API request failed');

    const data = response.data.data;
    const timestamp = new Date(response.data.timestamp).toLocaleString();

    let msg = `*🎯 TIKTOK BOOSTER SUCCESS*\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*📹 Title:* ${data.title || 'Not available'}\n`;
    msg += `*👤 Author:* ${data.author || 'Unknown'}\n`;
    msg += `*🔗 Username:* @${data.username || 'Unknown'}*\n`;
    msg += `*📊 Status:* ${data.status || 'Processing'}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `\n*📝 Note: The likes and views take time to register due to personal reasons.*\n`;
    msg += `\n*🕐 Timestamp:* ${timestamp}*\n`;
    msg += `*🔹 Source:* ${response.data.source || 'Omegatech'}*\n`;
    msg += `*🔹 Attribution:* ${response.data.attribution || '@Omegatech-01'}*`;

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    reply(msg);

  } catch (e) {
    console.error('TikTok Booster Error:', e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    let errorMsg = `*❌ Failed to boost TikTok video*\n\n`;
    if (e.response) {
        errorMsg += `*📌 Status: ${e.response.status}*\n`;
        errorMsg += `*📌 Error: ${e.response.data?.message || 'Unknown error'}*`;
    } else if (e.request) {
        errorMsg += `*📌 No response from server. Please try again later.*`;
    } else {
        errorMsg += `*📌 Error: ${e.message}*`;
    }
    reply(errorMsg);
  }
});