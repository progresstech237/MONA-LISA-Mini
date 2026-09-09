const { cmd } = require('../redx');
const axios = require('axios');
const crypto = require('crypto');

const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';
const CLOUDINARY_THUMB = 'https://res.cloudinary.com/di2a9lenz/image/upload/w_400,h_400,c_limit/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';

const MUSIC_STYLES = [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'EDM', 'Jazz', 'Classical', 'Country',
    'Metal', 'Reggae', 'Blues', 'Folk', 'Soul', 'Funk', 'Disco', 'House',
    'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'Lo-fi', 'Acoustic'
];

const activeGenerations = new Set();

async function generateMusicOld(prompt) {
    if (!prompt) throw "Prompt is required";
    const url = `https://omegatech-api.dixonomega.tech/api/ai/sonu3?action=full&prompt=${encodeURIComponent(prompt)}`;
    const { data } = await axios.get(url, { timeout: 120000 });
    if (!data?.success) throw "No music generated";
    return {
        title: data.title || 'Untitled',
        audio_url: data.url,
        image_url: data.thumbnail,
        lyrics: data.lyrics || 'No lyrics available.',
        tags: data.tags || 'N/A',
        duration: data.duration || 0,
    };
}

async function generateMusicNew(prompt, title, musicStyle = 'Pop') {
    if (!prompt) throw "Prompt is required";
    const url = `https://api.omegatech.app/api/ai/sonu-pro?action=generate&prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(title || prompt)}&isInstrumental=false&musicStyle=${encodeURIComponent(musicStyle)}`;
    const { data } = await axios.get(url, { timeout: 120000 });
    if (!data?.success) throw "No music generated";
    return data;
}

async function sendRichResponse(conn, chatId, status, data, prompt, title, style, taggedUsers = []) {
    try {
        const messageSecret = crypto.randomBytes(32).toString('base64');
        const stanzaId = crypto.randomBytes(16).toString('hex').toUpperCase();
        const responseId = crypto.randomUUID();

        const isComplete = status === 'completed';
        const track = data?.tracks?.[0] || {};
        const coverImage = track.coverImage || track.image_url || CLOUDINARY_IMAGE;
        const trackTitle = track.title || title || 'Untitled';
        const lyrics = track.lyrics || 'No lyrics available.';
        const duration = track.duration || 'N/A';

        const responseData = {
            "response_id": responseId,
            "sections": [
                {
                    "view_model": {
                        "primitive": {
                            "title": isComplete? `🎵 ${trackTitle}` : "🎵 Generating Music...",
                            "brand": "Omegatech AI",
                            "price": isComplete? `⏱️ ${duration}s` : "⏳ Processing",
                            "product_url": "https://wa.me/237682432296",
                            "image": { "url": coverImage, "mime_type": "image/jpeg" },
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
                            "text": isComplete?
                                `✅ *Music Generated Successfully!*\n\n🎵 *Title:* ${trackTitle}\n🎼 *Style:* ${style || 'N/A'}\n⏱️ *Duration:* ${duration}s\n📝 *Prompt:* ${prompt.substring(0, 100)}${prompt.length > 100? '...' : ''}\n🚀 *Source:* Omegatech AI` :
                                `⏳ *Generating your music...*\n\n📝 *Prompt:* ${prompt.substring(0, 100)}${prompt.length > 100? '...' : ''}\n🎼 *Style:* ${style || 'Default'}\n🔄 *Status:* Generating\n⏰ *Estimated time:* ~60 seconds`,
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
                                "header": { "__typename": "GenAI3PExtWidgetStandardHeader", "title": "⚡ OMEGATECH AI" },
                                "body": {
                                    "__typename": "GenAI3PExtCalendarEventList",
                                    "sections": [],
                                    "ctas": [
                                        { "__typename": "GenAI3PExtWidgetCTA", "label": "Generate", "state": "PENDING", "kind": "OTHER", "tool_call_id": "00", "toast": { "__typename": "GenAI3PExtWidgetToast", "label": "Generate Another" } },
                                        { "__typename": "GenAI3PExtWidgetCTA", "label": "Menu", "state": "PENDING", "kind": "OTHER", "tool_call_id": "01", "toast": { "__typename": "GenAI3PExtWidgetToast", "label": "Show Menu" } },
                                        { "__typename": "GenAI3PExtWidgetCTA", "label": "Channel", "state": "PENDING", "kind": "OTHER", "tool_call_id": "02", "toast": { "__typename": "GenAI3PExtWidgetToast", "label": "Join Channel" } }
                                    ]
                                }
                            },
                            {
                                "prompt_text": "Lady-Trish",
                                "prompt_type": "SUGGESTED_PROMPT",
                                "__typename": "GenAIFollowUpSuggestionPillPrimitive"
                            },
                            {
                                "text": "L\nA\nD\nY\n-\nT\nR\nI\nS\nH",
                                "__typename": "GenAIMarkdownTextUXPrimitive"
                            },
                            {
                                "title": "Lady-Trish Bot",
                                "brand": "Omegatech",
                                "price": "v7.0",
                                "sale_price": "Free",
                                "product_url": "https://wa.me/237682432296",
                                "image": { "url": CLOUDINARY_THUMB },
                                "additional_images": [{}],
                                "__typename": "GenAIProductItemCardPrimitive"
                            }
                        ],
                        "__typename": "GenAIHScrollLayoutViewModel"
                    },
                    "__typename": "GenAIUnifiedResponseSection"
                },
                {
                    "view_model": {
                        "primitive": {
                            "text": `📢 *Join Our Channel:*\nhttps://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P`,
                            "inline_entities": [],
                            "__typename": "GenAIMarkdownTextUXPrimitive"
                        },
                        "__typename": "GenAISingleLayoutViewModel"
                    },
                    "__typename": "GenAIUnifiedResponseSection"
                }
            ]
        };

        if (isComplete && lyrics && lyrics!== 'No lyrics available.') {
            responseData.sections.splice(2, 0, {
                "view_model": {
                    "primitive": {
                        "text": `🎤 *Lyrics — ${trackTitle}*\n\n${lyrics.slice(0, 1500)}${lyrics.length > 1500? '...' : ''}`,
                        "inline_entities": [],
                        "__typename": "GenAIMarkdownTextUXPrimitive"
                    },
                    "__typename": "GenAISingleLayoutViewModel"
                },
                "__typename": "GenAIUnifiedResponseSection"
            });
        }

        await conn.relayMessage(
            chatId,
            {
                senderKeyDistributionMessage: {
                    groupId: "120363425020013890@g.us",
                    axolotlSenderKeyDistributionMessage: Buffer.from("Mwi6ieeLBxAHGiD/fbbPrF6NXxievrFYIENndR2KJc/bUm+NZ8Ihva8dGCIhBYacW+mUtF7tWBfr+yb2z1WQoIYpEj/chPPWWQm3j5El", "base64")
                },
                messageContextInfo: {
                    messageSecret,
                    botMetadata: {
                        messageDisclaimerText: "Omegatech AI Music Generator",
                        botResponseId: responseId
                    }
                },
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            messageType: 1,
                            unifiedResponse: {
                                data: Buffer.from(JSON.stringify(responseData)).toString('base64')
                            },
                            contextInfo: {
                                stanzaId,
                                participant: "237682432296@s.whatsapp.net",
                                quotedMessage: {
                                    extendedTextMessage: {
                                        text: prompt || "Generating music...",
                                        previewType: 0,
                                        inviteLinkGroupTypeV2: 0
                                    }
                                },
                                forwardingScore: 1,
                                isForwarded: true,
                                expiration: 7776000,
                                forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
                                forwardOrigin: 4,
                                mentionedJid: taggedUsers,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363425282620066 @newsletter',
                                    serverMessageId: 142,
                                    newsletterName: 'PROGRESS TECH'
                                }
                            }
                        }
                    }
                }
            },
            {}
        );
        return true;
    } catch (e) {
        console.error('Rich response error:', e);
        return false;
    }
}

cmd({
  pattern: "suno",
  alias: ["sonu", "music", "song"],
  react: "🎵",
  desc: "Generate AI music from text prompt",
  category: "ai",
  use: ".suno <prompt>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  let musicStyle = 'Pop';
  let isQuick = false;
  let prompt = q || '';

  try {
    if (!q) {
      return reply(`*🎵 SUNO MUSIC GENERATOR 👑*\n\n*Generate AI music from text prompts.*\n\n*Usage:*\n*👑 ${prefix}suno <prompt> 👑*\n\n*Examples:*\n*👑 ${prefix}suno Sad song about lost love 👑*\n*👑 ${prefix}suno Energetic EDM beat 👑*\n\n*Available Styles:* ${MUSIC_STYLES.join(', ')}\n\n*Powered by Omegatech AI*`);
    }

    const hasQuick = q.includes('--quick');
    const styleMatch = q.match(/--style\s+([^\s]+)/i);

    if (hasQuick) {
      isQuick = true;
      prompt = q.replace(/--quick/i, '').trim();
    } else if (styleMatch) {
      musicStyle = styleMatch[1];
      prompt = q.replace(/--style\s+[^\s]+/i, '').trim();
    } else {
      // Show style list if no style selected
      let listText = `*🎵 SUNO MUSIC GENERATOR 👑*\n\n*📝 Prompt: ${q.substring(0, 100)}*\n\n*🎼 Select Style by typing:*\n*👑 ${prefix}suno ${q} --style Pop 👑*\n\n*Available Styles:*\n`;
      MUSIC_STYLES.forEach(s => { listText += `• ${s}\n`; });
      listText += `\n*Quick Generate:*\n*👑 ${prefix}suno ${q} --quick 👑*`;
      return reply(listText);
    }

    const genKey = `${m.sender}_${prompt}_${isQuick? 'quick' : musicStyle}`;
    if (activeGenerations.has(genKey)) {
      return reply(`*⏳ A song is already being generated. Please wait...*`);
    }
    activeGenerations.add(genKey);

    await conn.sendMessage(from, { react: { text: "🎵", key: mek.key } });

    if (isQuick) {
      await sendRichResponse(conn, from, 'loading', null, prompt, prompt, 'Default', [m.sender]);
      const track = await generateMusicOld(prompt);
      await sendRichResponse(conn, from, 'completed', { tracks: [track] }, prompt, track.title, 'Default', [m.sender]);

      const audioRes = await axios.get(track.audio_url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 60000
      });
      await conn.sendMessage(from, {
        audio: Buffer.from(audioRes.data),
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${track.title}.mp3`,
      }, { quoted: mek });

    } else {
      await sendRichResponse(conn, from, 'loading', null, prompt, prompt, musicStyle, [m.sender]);
      const result = await generateMusicNew(prompt, prompt, musicStyle);
      const track = result.data.tracks[0];
      await sendRichResponse(conn, from, 'completed', result.data, prompt, track.title, musicStyle, [m.sender]);

      const audioRes = await axios.get(track.musicFile, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 60000
      });
      await conn.sendMessage(from, {
        audio: Buffer.from(audioRes.data),
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${track.title}.mp3`,
      }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Suno Error:', e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply(`*💥 Suno Error: ${e.message || e} 😔*`);
  } finally {
    if (q) {
      const cleanPrompt = q.replace(/--style\s+[^\s]+/i, '').replace(/--quick/i, '').trim();
      const genKey = `${m.sender}_${cleanPrompt}_${isQuick? 'quick' : musicStyle}`;
      activeGenerations.delete(genKey);
    }
  }
});