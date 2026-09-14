const { cmd } = require('../redx');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';

async function uploadFileToCDN(buffer, filename) {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: filename || 'audio.mp3' });
        form.append('type', 'permanent');
        const { data } = await axios.post('https://tmp.malvryx.dev/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        return data?.cdnUrl || data?.directUrl || null;
    } catch (e) {
        console.error('Upload error:', e);
        return null;
    }
}

async function transcribeAudio(audioUrl, scenario = 'auto') {
    const apiUrl = `https://api.omegatech.app/api/tools/audio-transcribe?audioUrl=${encodeURIComponent(audioUrl)}&scenario=${encodeURIComponent(scenario)}`;
    const { data } = await axios.get(apiUrl, { timeout: 60000 });
    if (!data.success) throw new Error('Transcription failed');
    return data;
}

async function sendRichResponse(conn, chatId, data, audioUrl, scenario, taggedUsers = []) {
    try {
        const messageSecret = crypto.randomBytes(32).toString('base64');
        const stanzaId = crypto.randomBytes(16).toString('hex').toUpperCase();
        const responseId = crypto.randomUUID();
        const transcription = data.transcription || 'No transcription available.';
        const duration = data.durationMinutes || 'N/A';
        const language = data.languageCode || 'auto';
        const taskId = data.taskId || 'N/A';

        const responseData = {
            "response_id": responseId,
            "sections": [
                {
                    "view_model": { "primitive": { "title": "🎤 Audio Transcription", "brand": "Progress Tech AI", "price": `⏱️ ${duration}m`, "product_url": "https://wa.me/237682432296", "image": { "url": CLOUDINARY_IMAGE, "mime_type": "image/jpeg" }, "additional_images": [], "__typename": "GenAIProductItemCardPrimitive" }, "__typename": "GenAISingleLayoutViewModel" },
                    "__typename": "GenAIUnifiedResponseSection"
                },
                {
                    "view_model": { "primitive": { "text": `*✅ Transcription Complete!*\n\n*🔊 Audio:* ${audioUrl}\n*🎯 Scenario:* ${scenario}\n*🌐 Language:* ${language}\n*⏱️ Duration:* ${duration} minute(s)\n*📋 Task ID:* ${taskId}\n\n*📝 Transcription:*\n${transcription.slice(0, 3000)}${transcription.length > 3000? '...' : ''}`, "inline_entities": [], "__typename": "GenAIMarkdownTextUXPrimitive" }, "__typename": "GenAISingleLayoutViewModel" },
                    "__typename": "GenAIUnifiedResponseSection"
                }
            ]
        };

        await conn.relayMessage(chatId, {
            senderKeyDistributionMessage: { groupId: "120363425020013890@g.us", axolotlSenderKeyDistributionMessage: Buffer.from("Mwi6ieeLBxAHGiD/fbbPrF6NXxievrFYIENndR2KJc/bUm+NZ8Ihva8dGCIhBYacW+mUtF7tWBfr+yb2z1WQoIYpEj/chPPWWQm3j5El", "base64") },
            messageContextInfo: { messageSecret, botMetadata: { messageDisclaimerText: "Progress Tech Audio Transcription", botResponseId: responseId } },
            botForwardedMessage: { message: { richResponseMessage: { messageType: 1, unifiedResponse: { data: Buffer.from(JSON.stringify(responseData)).toString('base64') }, contextInfo: { stanzaId, participant: "237682432296@s.whatsapp.net", quotedMessage: { extendedTextMessage: { text: "Transcription result", previewType: 0 } }, forwardingScore: 1, isForwarded: true, mentionedJid: taggedUsers } } } }
        }, {});
        return true;
    } catch (e) { console.error(e); return false; }
}

cmd({
  pattern: "transcribe",
  alias: ["transcript", "voice2text"],
  react: "🎤",
  desc: "Transcribe audio files using AI",
  category: "progresstech tools",
  use: ".transcribe (reply to audio) |.transcribe <audio_url> --scenario meeting",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let audioUrl = null;
    let scenario = 'auto';
    let text = q || '';

    const scenarioMatch = text.match(/--scenario\s+([^\s]+)/i);
    if (scenarioMatch) {
        scenario = scenarioMatch[1];
        text = text.replace(/--scenario\s+[^\s]+/i, '').trim();
    }

    const quoted = m.quoted || m;
    const isAudio = quoted.mimetype && quoted.mimetype.startsWith('audio/');
    const isVoice = quoted.mimetype && quoted.mimetype.includes('ogg');
    const mime2 = quoted.msg?.mimetype || "";
    const isAudio2 = /audio/.test(mime2) || /audio/.test(quoted.mimetype || "");

    if (isAudio || isVoice || isAudio2) {
        reply(`*📤 Downloading audio...*`);
        const media = await quoted.download();
        reply(`*📤 Uploading audio to server...*`);
        audioUrl = await uploadFileToCDN(media, `audio_${Date.now()}.mp3`);
        if (!audioUrl) return reply(`*❌ Failed to upload audio. Please try again.*`);
    }

    if (text && text.match(/^https?:\/\/[^\s]+$/)) {
        audioUrl = text;
    }

    if (!audioUrl) {
        return reply(`*🎤 AUDIO TRANSCRIPTION 👑*\n\n*Transcribe audio files to text using AI.*\n\n*Usage:*\n*👑 ${prefix}transcribe (reply to audio) 👑*\n*👑 ${prefix}transcribe <audio_url> 👑*\n\n*Examples:*\n*👑 ${prefix}transcribe (reply to voice note) 👑*\n*👑 ${prefix}transcribe https://example.com/audio.mp3 👑*\n*👑 ${prefix}transcribe <url> --scenario meeting 👑*\n\n*🎯 Scenarios: auto, meeting, interview, lecture, etc.*\n\n*⚡ Powered by PROGRESS AI*`);
    }

    reply(`*⏳ Transcribing audio... This may take a moment.*`);
    const result = await transcribeAudio(audioUrl, scenario);
    await sendRichResponse(conn, from, result, audioUrl, scenario, [m.sender]);

    // also send plain text fallback
    let fallback = `*✅ TRANSCRIPTION COMPLETE 👑*\n\n*🔊 Audio: ${audioUrl}*\n*🎯 Scenario: ${scenario}*\n*🌐 Language: ${result.languageCode || 'auto'}*\n*⏱️ Duration: ${result.durationMinutes || 'N/A'}m*\n\n*📝 Transcription:*\n${result.transcription || 'No transcription'}`;
    reply(fallback);

  } catch (e) {
    console.error('Transcribe error:', e);
    reply(`*❌ Error: ${e.message || 'Unknown error'}*`);
  }
});