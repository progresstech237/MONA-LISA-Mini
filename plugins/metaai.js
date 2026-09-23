const { cmd } = require('../redx');
const axios = require('axios');

cmd({
  pattern: "metaai",
  alias: ["metabots", "aibots", "cozebots"],
  react: "🤖",
  desc: "Search Meta AI bots by category/prompt",
  category: "progresstech ai",
  use: ".metaai <prompt> | .metaai anime | .metaai list",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) return reply(`*🤖 META AI BOT FINDER 👑*\n\n*Usage:*\n*${prefix}metaai <prompt>*\n*Example: ${prefix}metaai A cow in city*\n\n*${prefix}metaai anime - get anime bots*\n*${prefix}metaai list - get all categories*`);

    const prompt = q.trim();
    const apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/Meta?action=categories&prompt=${encodeURIComponent(prompt)}`;
    
    reply(`*🔄 Searching bots for: ${prompt}...*`);
    
    const { data } = await axios.get(apiUrl, { timeout: 30000 });
    if (!data.success || !data.data?.length) return reply(`*❌ No bots found for: ${prompt}*`);

    const category = data.data[0];
    const bots = category.bots || [];
    
    let msg = `*🤖 META AI - ${category.cname} CATEGORY 👑*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*📦 Category ID: ${category.id}*\n`;
    msg += `*📦 Table: ${category.tb_name}*\n`;
    msg += `*🤖 Total Bots: ${bots.length}*\n`;
    msg += `*🔍 Query: ${prompt}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    bots.slice(0,5).forEach((bot, i) => {
        msg += `*${i+1}. ${bot.bot_name}*\n`;
        msg += `*ID: ${bot.bot_id}*\n`;
        msg += `*Desc: ${bot.description.slice(0,100)}...*\n`;
        msg += `*VIP: ${bot.is_vip ? 'Yes' : 'No'} - Voice: ${bot.voice_switch ? 'Yes' : 'No'}*\n`;
        msg += `*Prompt:*\n\`\`\`${bot.prompt.slice(0,800)}...\`\`\`\n\n`;
    });

    msg += `*🔹 Source: ${data.source}*\n*🔹 Full JSON: ${bots.length} bots found*`;
    
    // Also save full prompt of first bot to file option
    const firstBot = bots[0];
    if (firstBot) {
        reply(msg + `\n\n*💡 Use .metaai prompt ${firstBot.bot_name} to get full prompt*`);
        // Store for later
        global.metaBotsCache = global.metaBotsCache || {};
        global.metaBotsCache[m.sender] = bots;
    } else {
        reply(msg);
    }

  } catch (e) {
    console.error('Meta AI Error:', e);
    reply(`*❌ Error: ${e.response?.data?.message || e.message}*`);
  }
});

cmd({
  pattern: "metaprompt",
  alias: ["botprompt"],
  react: "📝",
  desc: "Get full prompt of a bot from cache",
  category: "ai",
  use: ".metaprompt <bot_name or index>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const cache = global.metaBotsCache?.[m.sender];
        if (!cache) return reply(`*⚠️ No cache. Use .metaai <prompt> first*`);
        const idx = parseInt(q) || 0;
        let bot = cache[idx] || cache.find(b=>b.bot_name.toLowerCase().includes(q.toLowerCase()));
        if (!bot) return reply(`*❌ Bot not found*`);
        let msg = `*📝 FULL PROMPT - ${bot.bot_name}*\n━━━━━━━━━━━━━━━\n${bot.prompt}\n━━━━━━━━━━━━━━━\n*Prologue: ${bot.prologue}*`;
        reply(msg);
    } catch (e) { reply(`*❌ ${e.message}*`); }
});