const axios = require('axios');

async function fetchBuffer(url, timeout = 25000) {
    if (!url || typeof url !== 'string') throw new Error('No media URL');
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        maxRedirects: 5,
        maxContentLength: 80 * 1024 * 1024,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
            Accept: '*/*',
        },
        validateStatus: (s) => s >= 200 && s < 400,
    });
    const buf = Buffer.from(res.data);
    if (!buf.length) throw new Error('Empty media body');
    return buf;
}

async function sendImage(conn, jid, { url, buffer, caption = '', contextInfo, quoted, mimetype = 'image/jpeg' } = {}) {
    const image = buffer || (url ? await fetchBuffer(url) : null);
    if (!image) throw new Error('No image data');
    const payload = { image, caption, mimetype };
    if (contextInfo) payload.contextInfo = contextInfo;
    return conn.sendMessage(jid, payload, quoted ? { quoted } : {});
}

async function sendAudio(conn, jid, { url, buffer, quoted, contextInfo, fileName, ptt = false, mimetype = 'audio/mpeg' } = {}) {
    const audio = buffer || (url ? await fetchBuffer(url, 120000) : null);
    if (!audio) throw new Error('No audio data');
    const payload = { audio, mimetype, ptt, fileName: fileName || `mona-lisa-${Date.now()}.mp3` };
    if (contextInfo) payload.contextInfo = contextInfo;
    return conn.sendMessage(jid, payload, quoted ? { quoted } : {});
}

async function sendVideo(conn, jid, { url, buffer, caption = '', quoted, contextInfo, fileName, mimetype = 'video/mp4' } = {}) {
    const video = buffer || (url ? await fetchBuffer(url, 180000) : null);
    if (!video) throw new Error('No video data');
    if (video.length > 64 * 1024 * 1024) throw new Error('Video is larger than WhatsApp allows (64MB).');
    const payload = { video, caption, mimetype, fileName: fileName || `mona-lisa-${Date.now()}.mp4` };
    if (contextInfo) payload.contextInfo = contextInfo;
    return conn.sendMessage(jid, payload, quoted ? { quoted } : {});
}

module.exports = { fetchBuffer, sendImage, sendAudio, sendVideo };
