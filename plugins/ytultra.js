const { cmd } = require('../redx');
const config = require('../config');
const omega = require('../lib/omegatech');
const { sendAudio, sendVideo } = require('../lib/media');

const NEWSLETTER_JID = config.CHANNEL_JID || '120363431455356251@newsletter';
const BRAND = '🔹 Powered by *Progress Tech* · OmegaTech YT Ultra';
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function channelCtx() {
    return {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥰 MONA LISA V2 🤭',
        },
    };
}

function isYtUrl(text) {
    return /(?:youtube\.com|youtu\.be)\//i.test(String(text || ''));
}

function putCache(chatId, data) {
    cache.set(chatId, { data, at: Date.now() });
}

function getCache(chatId) {
    const hit = cache.get(chatId);
    if (!hit) return null;
    if (Date.now() - hit.at > CACHE_TTL) {
        cache.delete(chatId);
        return null;
    }
    return hit.data;
}

function formatList(info, prefix) {
    const title = info.title || 'YouTube';
    const mp4 = info.mp4 || [];
    const mp3 = info.mp3 || [];
    const videos = mp4.slice(0, 8).map(q => `• ${prefix}yta video ${q.quality}`).join('\n') || '• none';
    const audios = mp3.slice(0, 8).map(q => `• ${prefix}yta audio ${q.quality}`).join('\n') || '• none';
    return [
        `*${title}*`,
        ``,
        `*Video:*`,
        videos,
        ``,
        `*Audio:*`,
        audios,
        ``,
        `_Pick a quality, e.g. ${prefix}yta video 720p_`,
        ``,
        BRAND,
    ].join('\n');
}

async function sendSearch(conn, from, mek, query, results, prefix) {
    const list = results.slice(0, 8).map((r, i) => {
        const title = String(r.title || 'Untitled').slice(0, 70);
        const dur = r.duration || '?';
        const ch = r.channel?.name || r.channel || '';
        const url = r.url || r.link || '';
        return `*${i + 1}.* ${title}\n${dur}${ch ? ` · ${ch}` : ''}\n${url}`;
    }).join('\n\n');

    await conn.sendMessage(from, {
        text: `*YouTube search:* ${query}\n\n${list}\n\nReply with:\n${prefix}yta <url>\n\n${BRAND}`,
        contextInfo: channelCtx(),
    }, { quoted: mek });
}

async function sendMedia(conn, from, mek, reply, info, type, quality) {
    const list = type === 'video' ? (info.mp4 || []) : (info.mp3 || []);
    const selected = list.find(q => String(q.quality).toLowerCase() === String(quality).toLowerCase()) || list[0];
    if (!selected?.url) return reply(`Quality ${quality} not found for ${type}.`);

    await reply(`Downloading ${type} (${selected.quality})...`);
    const title = info.title || 'youtube';
    const fileName = selected.filename || `${title}.${selected.format || (type === 'video' ? 'mp4' : 'mp3')}`;

    if (type === 'video') {
        await sendVideo(conn, from, {
            url: selected.url,
            caption: `*${title}*\nQuality: ${selected.quality}\n\n${BRAND}`,
            quoted: mek,
            fileName,
            contextInfo: channelCtx(),
        });
    } else {
        await sendAudio(conn, from, {
            url: selected.url,
            quoted: mek,
            fileName,
            contextInfo: channelCtx(),
        });
        await conn.sendMessage(from, {
            text: `*${title}*\nAudio · ${selected.quality}\n\n${BRAND}`,
            contextInfo: channelCtx(),
        }, { quoted: mek });
    }
}

cmd({
    pattern: 'yta',
    alias: ['ytultra', 'ytaudio'],
    desc: 'YouTube Ultra — search and download audio or video',
    category: 'download',
    react: '📥',
    use: '.yta <query or url> | .yta video 720p | .yta audio 128kbps',
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    if (!q) {
        return reply(
            `*YouTube Ultra*\n\n${prefix}yta Alone\n${prefix}yta https://youtu.be/xxxxx\n${prefix}yta video 720p\n${prefix}yta audio 128kbps\n\n${BRAND}`
        );
    }

    try {
        const args = q.trim().split(/\s+/);
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'video' || sub === 'audio') {
            const quality = args.slice(1).join(' ');
            if (!quality) return reply('Specify a quality, e.g. `.yta video 720p`');
            const info = getCache(from);
            if (!info) return reply('No download info cached. Search or paste a URL first.');
            await sendMedia(conn, from, mek, reply, info, sub, quality);
            return;
        }

        if (!isYtUrl(q)) {
            await reply(`Searching YouTube for *${q}*...`);
            const { results } = await omega.ytSearch(q);
            await sendSearch(conn, from, mek, q, results, prefix);
            return;
        }

        await reply('Fetching download info...');
        const info = await omega.ytDownloadInfo(q.trim());
        putCache(from, info);
        await conn.sendMessage(from, {
            text: formatList(info, prefix),
            contextInfo: channelCtx(),
        }, { quoted: mek });
    } catch (e) {
        console.error('YT Ultra error:', e);
        reply(`YouTube Ultra failed: ${e.message}`);
    }
});
