const { cmd } = require('../redx');
const axios = require('axios');
const crypto = require('crypto');

const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';
const CLOUDINARY_THUMB = 'https://res.cloudinary.com/di2a9lenz/image/upload/w_400,h_400,c_limit/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';

// temp storage like global.db
let sportsDB = { news: {}, feeds: {}, highlights: {} };

async function getTrendingNews(page = 1, perPage = 5) {
    const url = `https://api.omegatech.app/api/Sport/sport-trend?page=${page}&perPage=${perPage}`;
    const { data } = await axios.get(url, { timeout: 30000 });
    if (!data.success) throw new Error('Failed to fetch news');
    return data;
}

async function getSportFeeds() {
    const url = `https://api.omegatech.app/api/Sport/sport-feeds`;
    const { data } = await axios.get(url, { timeout: 30000 });
    if (!data.success) throw new Error('Failed to fetch feeds');
    return data;
}

async function sendRichResponse(conn, chatId, title, content, imageUrl, taggedUsers = []) {
    try {
        const messageSecret = crypto.randomBytes(32).toString('base64');
        const stanzaId = crypto.randomBytes(16).toString('hex').toUpperCase();
        const responseId = crypto.randomUUID();

        const responseData = {
            "response_id": responseId,
            "sections": [
                {
                    "view_model": {
                        "primitive": {
                            "title": title,
                            "brand": "Progress Tech Sports",
                            "price": "⚽",
                            "product_url": "https://wa.me/237682432296",
                            "image": { "url": imageUrl || CLOUDINARY_IMAGE, "mime_type": "image/jpeg" },
                            "additional_images": [],
                            "__typename": "GenAIProductItemCardPrimitive"
                        },
                        "__typename": "GenAISingleLayoutViewModel"
                    },
                    "__typename": "GenAIUnifiedResponseSection"
                },
                {
                    "view_model": {
                        "primitive": {
                            "text": content,
                            "inline_entities": [],
                            "__typename": "GenAIMarkdownTextUXPrimitive"
                        },
                        "__typename": "GenAISingleLayoutViewModel"
                    },
                    "__typename": "GenAIUnifiedResponseSection"
                },
                {
                    "view_model": {
                        "primitives": [
                            {
                                "__typename": "GenAI3PExtWidgetPrimitive",
                                "header": { "__typename": "GenAI3PExtWidgetStandardHeader", "title": "⚡ PROGRESS TECH SPORTS" },
                                "body": {
                                    "__typename": "GenAI3PExtCalendarEventList",
                                    "sections": [],
                                    "ctas": [
                                        { "__typename": "GenAI3PExtWidgetCTA", "label": "Trends", "state": "PENDING", "kind": "OTHER", "tool_call_id": "00", "toast": { "__typename": "GenAI3PExtWidgetToast", "label": "Trending News" } },
                                        { "__typename": "GenAI3PExtWidgetCTA", "label": "Feeds", "state": "PENDING", "kind": "OTHER", "tool_call_id": "01", "toast": { "__typename": "GenAI3PExtWidgetToast", "label": "Match Results" } },
                                        { "__typename": "GenAI3PExtWidgetCTA", "label": "Highlights", "state": "PENDING", "kind": "OTHER", "tool_call_id": "02", "toast": { "__typename": "GenAI3PExtWidgetToast", "label": "Watch Highlights" } }
                                    ]
                                }
                            }
                        ],
                        "__typename": "GenAIHScrollLayoutViewModel"
                    },
                    "__typename": "GenAIUnifiedResponseSection"
                }
            ]
        };

        await conn.relayMessage(
            chatId,
            {
                senderKeyDistributionMessage: {
                    groupId: "120363425020013890@g.us",
                    axolotlSenderKeyDistributionMessage: Buffer.from("Mwi6ieeLBxAHGiD/fbbPrF6NXxievrFYIENndR2KJc/bUm+NZ8Ihva8dGCIhBYacW+mUtF7tWBfr+yb2z1WQoIYpEj/chPPWWQm3j5El", "base64")
                },
                messageContextInfo: {
                    messageSecret,
                    botMetadata: { messageDisclaimerText: "Progress Tech Sports", botResponseId: responseId }
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            unifiedResponse: { data: Buffer.from(JSON.stringify(responseData)).toString('base64') },
                            contextInfo: {
                                stanzaId,
                                participant: "237682432296@s.whatsapp.net",
                                quotedMessage: { extendedTextMessage: { text: title, previewType: 0 } },
                                forwardingScore: 1,
                                isForwarded: true,
                                mentionedJid: taggedUsers
                            }
                        }
                    }
                }
            }, {}
        );
        return true;
    } catch (e) {
        console.log('Rich error:', e.message);
        return false;
    }
}

cmd({
  pattern: "sports",
  alias: ["sport", "football", "soccer"],
  react: "⚽",
  desc: "Get sports news, match results, and highlights",
  category: "news",
  use: ".sports |.sports trends |.sports feeds |.sports highlights",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    const args = q? q.split(' ') : [];
    const subCommand = args[0]?.toLowerCase() || '';
    const page = parseInt(args[1]) || 1;

    // SELECT SPECIFIC HIGHLIGHT
    if (subCommand === 'highlight' && args[1]!== undefined) {
        const idx = parseInt(args[1]);
        const hData = sportsDB.highlights?.[m.sender];
        if (!hData) return reply(`*⚠️ No highlights found. Please run ${prefix}sports highlights first.*`);
        const selected = hData.highlights[idx];
        if (!selected) return reply(`*❌ Invalid highlight selection.*`);
        const videoUrl = selected.videoUrl || selected.path || selected.url || '';
        if (!videoUrl) return reply(`*❌ Video URL not found.*`);
        reply(`*📤 Sending highlight: ${selected.title || 'Clip'}...*`);
        try {
            await conn.sendMessage(from, { video: { url: videoUrl }, caption: `*🎬 ${selected.title || 'Match Highlight'}*\n*Duration: ${selected.duration? Math.floor(selected.duration/60)+':'+String(selected.duration%60).padStart(2,'0') : 'N/A'}*` }, { quoted: mek });
        } catch {
            reply(`*📺 Watch here: ${videoUrl}*`);
        }
        return;
    }

    // SELECT SPECIFIC NEWS
    if (subCommand === 'news' && args[1]!== undefined) {
        const idx = parseInt(args[1]);
        const newsData = sportsDB.news?.[m.sender];
        if (!newsData) return reply(`*⚠️ No news found. Please run ${prefix}sports trends first.*`);
        const selected = newsData.news[idx];
        if (!selected) return reply(`*❌ Invalid news selection.*`);
        const date = selected.createdAt? new Date(parseInt(selected.createdAt)).toLocaleString() : 'N/A';
        const coverUrl = selected.cover?.url || selected.thumbnail || CLOUDINARY_IMAGE;
        const content = `*📰 ${selected.title}*\n━━━━━━━━━━━━━━━\n*📝 ${selected.summary || 'No summary.'}*\n\n*📅 ${date}*\n*🔗 ${selected.detailPath || 'N/A'}*`;
        await sendRichResponse(conn, from, '📰 Sports News', content, coverUrl, [m.sender]);
        return;
    }

    // SELECT SPECIFIC MATCH
    if (subCommand === 'match' && args[1]!== undefined) {
        const idx = parseInt(args[1]);
        const feedsData = sportsDB.feeds?.[m.sender];
        if (!feedsData) return reply(`*⚠️ No matches found. Please run ${prefix}sports feeds first.*`);
        const selected = feedsData.matches[idx];
        if (!selected) return reply(`*❌ Invalid match selection.*`);
        let content = `*⚽ ${selected.team1?.name || 'Team1'} vs ${selected.team2?.name || 'Team2'}*\n━━━━━━━━━━━━━━━\n*📊 Score: ${selected.team1?.score || '0'} - ${selected.team2?.score || '0'}*\n*🏆 League: ${selected.league || 'N/A'}*\n*📌 Status: ${selected.status || 'Unknown'}*\n`;
        if (selected.replay?.length) content += `\n*📺 Full Replay:*\n${selected.replay[0].path || selected.replay[0].url}\n`;
        if (selected.highlights?.length) {
            content += `\n*🎬 Highlights:*\n`;
            selected.highlights.forEach((h,i)=>{ content += `${i+1}. ${h.title || 'Clip'} (${h.duration? Math.floor(h.duration/60)+':'+String(h.duration%60).padStart(2,'0') : 'N/A'})\n`; });
            content += `\n*💡 Use.sports highlight <number> to watch*`;
        }
        return reply(content);
    }

    // MENU
    if (!q || subCommand === 'menu' || subCommand === 'help') {
        return reply(`*⚽ SPORTS HUB 👑*\n\n*📌 Welcome to Sports Hub!*\n\n*Select an option:*\n\n*📰 ${prefix}sports trends - Latest headlines*\n*⚽ ${prefix}sports feeds - Live results & scores*\n*🎬 ${prefix}sports highlights - Video clips & replays*\n\n*More:*\n*📰 ${prefix}sports trends 2 - Page 2*\n*📰 ${prefix}sports news 0 - Read news #0*\n*⚽ ${prefix}sports match 0 - View match #0*\n*🎬 ${prefix}sports highlight 0 - Watch highlight #0*\n\n*⚡ Powered by Omegatech Sports*`);
    }

    if (subCommand === 'trends' || subCommand === 'trend') {
        const data = await getTrendingNews(page, 5);
        const newsList = data?.news || data?.data?.news || [];
        sportsDB.news[m.sender] = { news: newsList, timestamp: Date.now() };
        let msg = `*📰 SPORTS TRENDING NEWS - Page ${data?.page || page} 👑*\n\n*Total: ${data?.totalNews || newsList.length} articles*\n\n`;
        newsList.slice(0,5).forEach((item,i)=>{
            msg += `*${i}. ${item.title?.substring(0,60)}*\n${item.summary?.substring(0,80)}...\n*Read: ${prefix}sports news ${i}*\n\n`;
        });
        if (data?.hasMore) msg += `*Next Page: ${prefix}sports trends ${parseInt(data?.page || page)+1}*\n`;
        return reply(msg);
    }

    if (subCommand === 'feeds' || subCommand === 'feed' || subCommand === 'matches') {
        const data = await getSportFeeds();
        const matches = data?.matches || data?.data?.matches || [];
        sportsDB.feeds[m.sender] = { matches: matches, timestamp: Date.now() };
        let msg = `*⚽ MATCH FEEDS - ${matches.length} matches 👑*\n\n`;
        matches.slice(0,5).forEach((match,i)=>{
            msg += `*${i}. ${match?.team1?.name || 'Team1'} vs ${match?.team2?.name || 'Team2'}*\n*Score: ${match?.team1?.score || '0'} - ${match?.team2?.score || '0'} • ${match?.league || 'N/A'}*\n*View: ${prefix}sports match ${i}*\n\n`;
        });
        return reply(msg);
    }

    if (subCommand === 'highlights' || subCommand === 'hl' || subCommand === 'replay') {
        const data = await getSportFeeds();
        const matches = data?.matches || data?.data?.matches || [];
        const allHighlights = [];
        for (const match of matches) {
            const highlights = match?.highlights || match?.videos || [];
            highlights.forEach(h=>{
                allHighlights.push({...h, matchTitle: `${match?.team1?.name || 'Team1'} vs ${match?.team2?.name || 'Team2'}`, videoUrl: h?.path || h?.url || h?.videoUrl || h?.src || '' });
            });
        }
        if (allHighlights.length===0) return reply(`*⚠️ No highlights available.*`);
        sportsDB.highlights[m.sender] = { highlights: allHighlights, timestamp: Date.now() };
        let msg = `*🎬 MATCH HIGHLIGHTS - ${allHighlights.length} clips 👑*\n\n`;
        allHighlights.slice(0,10).forEach((h,i)=>{
            msg += `*${i}. ${h.title || h.matchTitle}*\n*Duration: ${h.duration? Math.floor(h.duration/60)+':'+String(h.duration%60).padStart(2,'0') : 'N/A'}*\n*Watch: ${prefix}sports highlight ${i}*\n\n`;
        });
        return reply(msg);
    }

    reply(`*⚠️ Unknown option. Use ${prefix}sports menu*`);

  } catch (e) {
    console.error('Sports error:', e);
    reply(`*❌ Error: ${e.message || 'Unknown error'}*`);
  }
});