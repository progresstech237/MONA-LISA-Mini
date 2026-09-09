const { cmd } = require('../redx');
const axios = require('axios');

const CLOUDINARY_IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';
const NEWSLETTER_JID = '120363422614794709@newsletter';

let dlCache = {};

async function prepareImage(conn, url) {
    try {
        const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
        const resp = await axios.get(url || CLOUDINARY_IMAGE, { responseType: 'arraybuffer' });
        const media = await prepareWAMessageMedia({ image: Buffer.from(resp.data) }, { upload: conn.waUploadToServer });
        return media.imageMessage;
    } catch { return null; }
}

async function sendInteractiveMedia(conn, chatId, result, sender, prefix) {
    try {
        dlCache[sender] = { result: result, timestamp: Date.now() };

        const source = result.source || 'Unknown';
        const title = result.title || 'Untitled';
        const author = result.author || 'Unknown';
        const thumbnail = result.thumbnail || result.thumb || CLOUDINARY_IMAGE;
        const duration = result.duration || 'N/A';

        const imageMessage = await prepareImage(conn, thumbnail);
        const videos = result.videos || [];
        const audios = result.audios || [];
        const photos = result.photos || [];

        const buttons = [];

        if (videos.length > 0) {
            const videoRows = videos.map((v, idx) => ({
                id: `${prefix}dl video ${idx}`,
                title: `Video ${v.quality || idx + 1}`,
                description: `Quality: ${v.quality || 'HD'}`
            }));
            buttons.push({
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🎬 Video",
                    sections: [{ title: `Select Video (${videos.length})`, highlight_label: "📹", rows: videoRows }]
                })
            });
        }

        if (audios.length > 0) {
            const audioRows = audios.map((a, idx) => ({
                id: `${prefix}dl audio ${idx}`,
                title: `Audio ${idx + 1}`,
                description: `Format: ${a.format || a.quality || 'mp3'}`
            }));
            buttons.push({
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🎵 Audio",
                    sections: [{ title: `Select Audio (${audios.length})`, highlight_label: "🎵", rows: audioRows }]
                })
            });
        }

        if (photos.length > 0) {
            const photoRows = photos.map((p, idx) => ({
                id: `${prefix}dl photo ${idx}`,
                title: `Photo ${idx + 1}`,
                description: `HD Quality`
            }));
            buttons.push({
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "🖼️ Photos",
                    sections: [{ title: `Select Photo (${photos.length})`, highlight_label: "🖼️", rows: photoRows }]
                })
            });
        }

        if ((videos.length > 0 && audios.length > 0) || (videos.length > 0 && photos.length > 0) || (audios.length > 0 && photos.length > 0)) {
            buttons.push({
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: "📦 Download All",
                    sections: [{ title: "All Media", highlight_label: "📦", rows: [{ id: `${prefix}dl all`, title: "Download All", description: "Get all media files" }] }]
                })
            });
        }

        buttons.push({
            name: "cta_url",
            buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: "https://whatsapp.com/channel/0029Vb785rSBlHpWSitPY61i" })
        });

        let bodyText = `*📥 Media Found*\n━━━━━━━━━━━━━━━━━━━━━\n`;
        bodyText += `*🎬 Title:* ${title}\n`;
        bodyText += `*👤 Author:* ${author}\n`;
        bodyText += `*📹 Source:* ${source}\n`;
        bodyText += `*⏱️ Duration:* ${duration}\n`;
        bodyText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        bodyText += `*📌 Available:*\n`;
        if (videos.length > 0) bodyText += ` 🎬 ${videos.length} video(s)\n`;
        if (audios.length > 0) bodyText += ` 🎵 ${audios.length} audio(s)\n`;
        if (photos.length > 0) bodyText += ` 🖼️ ${photos.length} photo(s)\n`;
        bodyText += `\n*💡 Select an option below to download.*`;

        const interactiveMsg = {
            interactiveMessage: {
                header: { title: `📥 ${source}`, hasMediaAttachment:!!imageMessage,...(imageMessage? { imageMessage } : {}) },
                body: { text: bodyText },
                footer: { text: "🔹 Powered by Omegatech • Universal Downloader" },
                nativeFlowMessage: { buttons: buttons }
            }
        };

        await conn.relayMessage(chatId, interactiveMsg, {
            additionalNodes: [{ tag: "biz", attrs: {}, content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }] }]
        });
        return true;
    } catch (e) {
        console.error('Interactive media error:', e);
        return false;
    }
}

async function sendMediaFile(conn, chatId, url, type, title, author, source) {
    try {
        const caption = `*📥 ${title}*\n*👤 ${author}*\n*🔹 ${source}*\n*📢 @Lady-Trish Channel*`;
        const contextInfo = { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 142, newsletterName: 'Lady-Trish Channel' } };
        if (type === 'video') {
            await conn.sendMessage(chatId, { video: { url }, caption: caption, contextInfo });
        } else if (type === 'audio') {
            await conn.sendMessage(chatId, { audio: { url }, mimetype: 'audio/mpeg', ptt: false, fileName: `${title}.mp3`, contextInfo });
        } else if (type === 'photo') {
            await conn.sendMessage(chatId, { image: { url }, caption: caption, contextInfo });
        }
        return true;
    } catch (e) { console.error(e); return false; }
}

cmd({
  pattern: "dl",
  alias: ["download", "downloader", "yt", "ig", "fb", "tt", "tw", "sn", "bl", "bilibili", "tiktok", "instagram", "youtube", "facebook", "twitter", "snapchat"],
  react: "📥",
  desc: "Download videos, audios, and images from any platform",
  category: "downloader",
  use: ".dl <url> |.dl video 0 |.dl audio 0 |.dl photo 0 |.dl all",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) {
        return reply(`*📥 UNIVERSAL MEDIA DOWNLOADER 👑*\n\n*Download videos, audios, and images from any platform.*\n\n*Usage:*\n*👑 ${prefix}dl <url> 👑*\n\n*Supported Platforms:*\n• TikTok (.tt) • Instagram (.ig) • YouTube (.yt)\n• Facebook (.fb) • Twitter/X (.tw) • Snapchat (.sn)\n• Bilibili (.bl) • And more!\n\n*⚡ Powered by Omegatech*`);
    }

    const parts = q.split(' ');
    const subCommand = parts[0]?.toLowerCase() || '';
    const cacheData = dlCache[m.sender];

    // video select
    if (subCommand === 'video' && parts[1]!== undefined) {
        const idx = parseInt(parts[1]);
        if (!cacheData ||!cacheData.result) return reply(`*⚠️ No media found. Please search again.*`);
        const videos = cacheData.result.videos || [];
        if (idx >= videos.length) return reply(`*❌ Invalid video selection.*`);
        const selected = videos[idx];
        await sendMediaFile(conn, from, selected.url, 'video', cacheData.result.title, cacheData.result.author, cacheData.result.source);
        return;
    }

    // audio select
    if (subCommand === 'audio' && parts[1]!== undefined) {
        const idx = parseInt(parts[1]);
        if (!cacheData ||!cacheData.result) return reply(`*⚠️ No media found. Please search again.*`);
        const audios = cacheData.result.audios || [];
        if (idx >= audios.length) return reply(`*❌ Invalid audio selection.*`);
        const selected = audios[idx];
        await sendMediaFile(conn, from, selected.url, 'audio', cacheData.result.title, cacheData.result.author, cacheData.result.source);
        return;
    }

    // photo select
    if (subCommand === 'photo' && parts[1]!== undefined) {
        const idx = parseInt(parts[1]);
        if (!cacheData ||!cacheData.result) return reply(`*⚠️ No media found. Please search again.*`);
        const photos = cacheData.result.photos || [];
        if (idx >= photos.length) return reply(`*❌ Invalid photo selection.*`);
        const selected = photos[idx];
        const photoUrl = selected.url || selected;
        await sendMediaFile(conn, from, photoUrl, 'photo', cacheData.result.title, cacheData.result.author, cacheData.result.source);
        return;
    }

    // all
    if (subCommand === 'all') {
        if (!cacheData ||!cacheData.result) return reply(`*⚠️ No media found. Please search again.*`);
        const result = cacheData.result;
        let sent = 0;
        for (const v of (result.videos || [])) { if (await sendMediaFile(conn, from, v.url, 'video', result.title, result.author, result.source)) sent++; }
        for (const a of (result.audios || [])) { if (await sendMediaFile(conn, from, a.url, 'audio', result.title, result.author, result.source)) sent++; }
        for (const p of (result.photos || [])) { const photoUrl = p.url || p; if (await sendMediaFile(conn, from, photoUrl, 'photo', result.title, result.author, result.source)) sent++; }
        if (sent === 0) reply(`*❌ Failed to send any media.*`);
        else reply(`*✅ Sent ${sent} media files.*`);
        return;
    }

    const urlMatch = q.match(/(https?:\/\/[^\s]+)/i);
    if (!urlMatch) return reply(`*❌ Invalid URL. Please provide a valid URL.*`);

    const url = urlMatch[0];
    reply(`*⏳ Fetching media from: ${url}...*`);

    const apiUrl = `https://api.omegatech.app/api/download/All-downloader-v2?action=download&url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { timeout: 60000 });

    if (!data.success) return reply(`*❌ Failed to download media. Please try again.*`);

    const result = data.data;
    const videos = result.videos || [];
    const audios = result.audios || [];
    const photos = result.photos || [];

    if (videos.length === 0 && audios.length === 0 && photos.length === 0) {
        return reply(`*✅ Media Found*\n*🎬 Title: ${result.title || 'Untitled'}*\n*👤 Author: ${result.author || 'Unknown'}*\n*📹 Source: ${result.source || 'Unknown'}*\n\n*💡 No downloadable media found.*`);
    }

    await sendInteractiveMedia(conn, from, result, m.sender, prefix);

  } catch (e) {
    console.error('Download error:', e);
    reply(`*❌ Error: ${e.message || 'Unknown error'}*`);
  }
});