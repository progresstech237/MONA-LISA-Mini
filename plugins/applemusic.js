const { cmd } = require('../redx');
const axios = require('axios');

let appleDB = {};
let downloadingDB = {};
let activeDownloads = new Set();

async function handleDownload(conn, mek, m, from, q, reply, query, num, prefix) {
    const downloadKey = `${m.sender}_${query}_${num}`;
    if (activeDownloads.has(downloadKey)) {
        return reply(`*⏳ Download already in progress...*`);
    }
    activeDownloads.add(downloadKey);

    try {
        let appleMusicData = appleDB[m.sender];
        let results = appleMusicData?.results || [];
        let searchQuery = appleMusicData?.query || query;

        if (!appleMusicData || results.length === 0) {
            try {
                const searchUrl = `https://api.omegatech.app/api/Search/Applemusic?action=search&query=${encodeURIComponent(query)}`;
                const { data: searchData } = await axios.get(searchUrl, { timeout: 30000 });
                if (!searchData.success ||!searchData.data.results || searchData.data.results.length === 0) {
                    return reply(`*❌ No results found for ${query} on Apple Music.*`);
                }
                results = searchData.data.results;
                searchQuery = query;
                appleDB[m.sender] = { results: results, query: query, timestamp: Date.now() };
            } catch (e) {
                return reply(`*❌ Error searching. Please try again.*`);
            }
        }

        if (appleMusicData && Date.now() - appleMusicData.timestamp > 300000) {
            delete appleDB[m.sender];
            return reply(`*⏰ Search results expired. Please search again.*`);
        }

        const selectedSong = results[num - 1];
        if (!selectedSong) {
            return reply(`*❌ Song #${num} not found. Please search again.*`);
        }

        if (downloadingDB[m.sender]) {
            return reply(`*⏳ Please wait for your current download to finish.*`);
        }

        downloadingDB[m.sender] = true;
        reply(`*⬇️ Downloading: ${selectedSong.title} - ${selectedSong.artist}...*\n*⏳ Please wait...*`);

        const downloadUrl = `https://api.omegatech.app/api/Search/Applemusic?action=download&query=${encodeURIComponent(searchQuery)}&url=${encodeURIComponent(selectedSong.url)}`;
        const { data: downloadData } = await axios.get(downloadUrl, { timeout: 60000 });

        if (!downloadData.success ||!downloadData.data.downloadUrl) {
            throw new Error('Failed to get download URL');
        }

        const audioUrl = downloadData.data.downloadUrl;
        const title = downloadData.data.title || selectedSong.title;
        const artist = downloadData.data.artist || selectedSong.artist;

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${title}.mp3`,
        }, { quoted: mek });

        reply(`*✅ Download Complete!*\n\n*🎵 ${title} - ${artist}*\n*🔹 Enjoy your music!*`);

        delete appleDB[m.sender];

    } catch (error) {
        console.error('Download error:', error);
        reply(`*❌ Failed to download song. Please try again later.*`);
    } finally {
        delete downloadingDB[m.sender];
        activeDownloads.delete(downloadKey);
    }
}

cmd({
  pattern: "play",
  alias: ["apple"],
  react: "🎵",
  desc: "Search and download music from Apple Music",
  category: "downloader",
  use: ".play <song title> |.play <song> <number>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    if (!q) {
        return reply(`*🎵 APPLE MUSIC PLAYER 👑*\n\n*Please provide a song name or artist.*\n\n*Example:*\n*👑 ${prefix}play Alone 👑*\n*👑 ${prefix}play Marshmello Alone 👑*`);
    }

    const parts = q.split(' ');
    const lastPart = parts[parts.length - 1];
    const isNumber = /^\d+$/.test(lastPart);

    if (isNumber) {
        const query = parts.slice(0, -1).join(' ');
        const num = parseInt(lastPart);
        return await handleDownload(conn, mek, m, from, q, reply, query, num, prefix);
    }

    reply(`*🔍 Searching Apple Music for: ${q}...*`);

    const searchUrl = `https://api.omegatech.app/api/Search/Applemusic?action=search&query=${encodeURIComponent(q)}`;
    const { data: searchData } = await axios.get(searchUrl, { timeout: 30000 });

    if (!searchData.success ||!searchData.data.results || searchData.data.results.length === 0) {
        return reply(`*❌ No results found for ${q} on Apple Music.*`);
    }

    const results = searchData.data.results;
    const total = searchData.data.total || results.length;

    appleDB[m.sender] = {
        results: results,
        query: q,
        timestamp: Date.now()
    };

    let msg = `*🎵 ${total} RESULTS FOR "${q}" 👑*\n\n*📌 Select a song to download:*\n\n`;
    results.slice(0, 5).forEach((song, i)=>{
        msg += `*${i+1}. ${song.title} - ${song.artist} ${song.explicit? '🔞' : '✅'}*\n`;
    });
    msg += `\n*To Download:*\n*👑 ${prefix}play ${q} 1 👑* - for song 1\n*👑 ${prefix}play ${q} 2 👑* - for song 2\n`;
    if (results.length > 5) msg += `\n*Showing first 5 of ${total} results*`;
    msg += `\n\n*🔹 Powered by Omegatech • Apple Music*`;

    // try send with cover
    try {
        if (results[0]?.cover) {
            await conn.sendMessage(from, {
                image: { url: results[0].cover },
                caption: msg
            }, { quoted: mek });
        } else {
            reply(msg);
        }
    } catch {
        reply(msg);
    }

  } catch (error) {
    console.error('Apple Music Error:', error);
    reply(`*❌ Error searching Apple Music. Please try again later.*`);
  }
});