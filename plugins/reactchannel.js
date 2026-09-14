const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/react-channel';

function getThumb() { try { for (const p of ['./media/menu1.png','./media/menu2.png']) if (fs.existsSync(p)) return fs.readFileSync(p); } catch {} return null; }

cmd({
  pattern: "reactchannel",
  alias: ["channelreact", "reactch", "chreact", "rchannel", "react-channel"],
  react: "❤️",
  desc: "Send emoji reactions to WhatsApp channel post - multiple emojis + fresh device keys retry",
  category: "progresstech tools",
  use: ".reactchannel <channel_link> <post_id> <emojis> |.reactchannel link | post_id | ❤️🔥",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = (q || "").trim();
    const inter = mek.message?.interactiveResponseMessage;
    if (inter?.nativeFlowResponseMessage?.paramsJson) {
      try { const p = JSON.parse(inter.nativeFlowResponseMessage.paramsJson); if (p.id) rawQ = p.id.replace(prefix,"").trim(); } catch {}
    }
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      rawQ = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,"").trim();
    }
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`, 'i'), '').trim();

    const ctx = { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' } };

    if (!rawQ || ['help','menu'].includes(rawQ.toLowerCase())) {
        let thumb = null; try { const { prepareWAMessageMedia } = require('@whiskeysockets/baileys'); const tb = getThumb(); if (tb) { const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer }); thumb = media.imageMessage; } } catch {}
        const menu = `┏━━〔 ❤️ React Channel 〕━━┓
┃ Send emoji reactions to
┃ WhatsApp channel post
┃ Multiple emojis + fresh keys
┃
┃ *Usage:*
┃ ${prefix}reactchannel <channel_link> <message_id> <emoji>
┃
┃ *Examples:*
┃ ${prefix}reactchannel https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P 123 ❤️
┃ ${prefix}reactchannel 0029Vb7Lk3yAzNbrVaWDOk1P 123 ❤️🔥😂
┃ ${prefix}reactchannel <link> | <post_id> | ❤️ 🔥 🎉
┃
┃ *Tip:* Copy post link -> ID is number
┃ after /channel/XXXX/
┗━━━━━━━━━━━━━━┛
`;
        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "❤️ Demo React", id: `${prefix}reactchannel https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P 1 ❤️🔥` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 TECH TOY Channel", url: CHANNEL_LINK }) }
        ];
        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "❤️ React Channel • Multi Emoji", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu }, footer: { text: BRAND }, nativeFlowMessage: { buttons }
            }, contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "❤️", key: mek.key } });

    // Parse: supports "link | id | emojis" or space separated
    let channelUrl = "", postId = "", emojis = "❤️";

    if (rawQ.includes('|')) {
        const parts = rawQ.split('|').map(s=>s.trim());
        channelUrl = parts[0] || "";
        postId = parts[1] || "";
        emojis = parts[2] || "❤️";
    } else {
        const parts = rawQ.split(/\s+/);
        // Find url
        const urlIdx = parts.findIndex(p=> p.includes('whatsapp.com/channel') || p.includes('0029'));
        if (urlIdx!== -1) {
            channelUrl = parts[urlIdx];
            // Next is post id if numeric
            if (parts[urlIdx+1] && /^\d+/.test(parts[urlIdx+1])) {
                postId = parts[urlIdx+1];
                emojis = parts.slice(urlIdx+2).join(' ') || "❤️";
            } else {
                // post id might be inside url? try extract
                postId = parts[urlIdx+1] || "";
                emojis = parts.slice(urlIdx+2).join(' ') || "❤️";
            }
        } else {
            // No url found, assume format: channelId postId emojis
            channelUrl = parts[0] || "";
            postId = parts[1] || "";
            emojis = parts.slice(2).join(' ') || "❤️";
        }
    }

    // Extract channel ID from link if full link
    let channelId = channelUrl;
    const chMatch = channelUrl.match(/channel\/([A-Za-z0-9]+)/);
    if (chMatch) channelId = chMatch[1];

    if (!channelUrl ||!postId) {
        return reply(`*❌ Missing params*\nNeed: channel_link + post_id + emojis\n\nExample:\n${prefix}reactchannel https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P 5 ❤️🔥\n\nOr with |:\n${prefix}reactchannel ${CHANNEL_LINK} | 5 | ❤️ 🔥 😂\n\n${BRAND}`);
    }

    // Emojis array
    const emojiList = emojis.match(/[\p{Emoji}]/gu) || [emojis];
    const emojiStr = emojiList.join('').trim() || emojis;

    reply(`*❤️ Reacting to Channel Post...*\n*Channel:* ${channelId.slice(0,30)}...\n*Post ID:* ${postId}\n*Emojis:* ${emojiStr}\n*Method:* Fresh device keys retry\n\n_${BRAND}_`);

    let result = null;

    // Try POST with all possible param names
    try {
        const { data } = await axios.post(API, {
            channel_url: channelUrl,
            channelUrl: channelUrl,
            channel_link: channelUrl,
            channelLink: channelUrl,
            channel_id: channelId,
            channelId: channelId,
            post_id: postId,
            postId: postId,
            message_id: postId,
            messageId: postId,
            emojis: emojiList,
            emoji: emojiStr,
            reaction: emojiStr,
            reactions: emojiList,
            count: emojiList.length
        }, { timeout: 60000, headers: { 'Content-Type': 'application/json' } });
        result = data.data || data;
    } catch (e) {
        console.log('react-channel POST fail', e.response?.data || e.message);
        try {
            const { data } = await axios.get(`${API}?channel_url=${encodeURIComponent(channelUrl)}&channel_id=${encodeURIComponent(channelId)}&post_id=${encodeURIComponent(postId)}&emojis=${encodeURIComponent(emojiStr)}&emoji=${encodeURIComponent(emojiStr)}`, { timeout: 60000 });
            result = data.data || data;
        } catch {}
    }

    if (!result) throw new Error('No response from react-channel API');

    const status = result.status || result.message || result.success || result.result || 'Done';
    const success = result.success!== false;

    let msg = `*${success? '✅': '⚠️'} Channel Reaction ${success? 'Sent' : 'Result'}*\n\n`;
    msg += `📢 *Channel:* ${channelId}\n🆔 *Post:* ${postId}\n${emojiList.map(e=> `${e} `).join('')}*Emojis:* ${emojiStr} (${emojiList.length})\n`;
    msg += `📊 *Status:* ${typeof status === 'string'? status.slice(0,500) : JSON.stringify(status).slice(0,500)}\n`;
    if (result.retries) msg += `🔄 *Retries:* ${result.retries} (fresh keys)\n`;
    msg += `\n*Raw:*\n\`\`\`${JSON.stringify(result, null, 2).slice(0,1500)}\`\`\`\n\n*${BRAND}*`;

    await conn.sendMessage(from, { text: msg, contextInfo: ctx }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: success? "✅" : "⚠️", key: mek.key } });

  } catch (e) {
    console.error('React Channel Error:', e.response?.data || e.message);
    reply(`*❌ React Failed*\n${e.response?.data?.message || e.message}\n\nCheck: channel link + post ID correct\nExample: ${'.reactchannel https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P 1 ❤️🔥'}`);
  }
});