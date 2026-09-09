const { cmd } = require('../redx');
const axios = require('axios');
const FormData = require('form-data');
const BASE = "https://omegatech-api.dixonomega.tech";

async function OmegatechGet(path, params) {
    const { data } = await axios.get(BASE + path, { params, timeout: 180000 });
    return data;
}

// ==================== AI PACK ====================
cmd({ pattern: "suno3", alias: ["sonu3"], react: "🎵", desc: "Suno3 AI Music Generator - /api/ai/sonu3", category: "progresstech ai", use: ".suno3 Alan Walker love song", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Example: .suno3 happy afrobeat love song_*");
        reply(`*_🎵 SUNO3 Generating: ${q}..._*`);
        const res = await OmegatechGet("/api/ai/sonu3", { prompt: q, action: "full" });
        const d = res.data || res; const audio = d.audio_url || d.url || d.audioUrl || d.data?.audio_url;
        const title = d.title || q; const lyrics = d.lyrics || d.lyric || ""; const thumb = d.thumbnail || d.image_url || d.cover;
        const dur = d.duration || "";
        if (audio) { await conn.sendMessage(from, { audio: { url: audio }, mimetype: "audio/mpeg", ptt: false }, { quoted: mek });
            if (thumb) await conn.sendMessage(from, { image: { url: thumb }, caption: `*🎵 ${title}*\n*Duration:* ${dur}\n*Prompt:* ${q}\n\n*Lyrics:*\n${lyrics.slice(0,1000)}` }, { quoted: mek });
        } else { reply(`*Result:*\n${JSON.stringify(res).slice(0,4000)}`); }
    } catch (e) { reply(`*❌ SUNO3 Error:* ${e.response?.data?.message || e.message}`); }
});

cmd({ pattern: "veo3", react: "🎬", desc: "Veo3 Video Gen - /api/ai/veo3", category: "progresstech ai", use: ".veo3 A cow in city cinematic", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Prompt needed: .veo3 A lion in city_*");
        reply(`*_🎬 VEO3 Generating: ${q}..._*`);
        const res = await OmegatechGet("/api/ai/veo3", { prompt: q, action: "full" });
        const d = res.data || res; const url = d.video_url || d.url || d.videoUrl;
        if (url) await conn.sendMessage(from, { video: { url }, caption: `*🎬 VEO3: ${q}*` }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,4000));
    } catch (e) { reply(`*❌ VEO3 Error:* ${e.message}`); }
});

cmd({ pattern: "aivideo", alias: ["ai-video","aivid"], react: "📹", desc: "Ai Video - /api/ai/Ai-video", category: "progresstech ai", use: ".aivideo cat dancing", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Prompt needed_*");
        reply(`*_📹 AI-VID Generating: ${q}_*`);
        const res = await OmegatechGet("/api/ai/Ai-video", { prompt: q });
        const d = res.data || res; const url = d.url || d.video_url;
        if (url) await conn.sendMessage(from, { video: { url }, caption: `*${q}*` }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,4000));
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "ttsx", alias: ["elevenlabs","tts11"], react: "🗣️", desc: "TTS ElevenLabs - /api/ai/elevenlabs", category: "ai", use: ".ttsx Hello world", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Text needed: .ttsx Hello_*");
        const res = await OmegatechGet("/api/ai/elevenlabs", { text: q, prompt: q });
        const d = res.data || res; const url = d.audio_url || d.url || d.audio;
        if (url) await conn.sendMessage(from, { audio: { url }, mimetype: "audio/mpeg", ptt: true }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,4000));
    } catch (e) { reply(`*❌ TTS Error:* ${e.message}`); }
});

cmd({ pattern: "grokvideo", alias: ["grok3video","grok-3-video"], react: "🤖", desc: "Grok 3 Video - /api/ai/grok-3-video", category: "progresstech ai", use: ".grokvideo prompt", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Prompt needed_*");
        reply(`*_🤖 GROK VIDEO: ${q}_*`);
        const res = await OmegatechGet("/api/ai/grok-3-video", { prompt: q });
        const d = res.data || res; const url = d.url || d.video_url;
        if (url) await conn.sendMessage(from, { video: { url }, caption: q }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,4000));
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

// ==================== TOOLS PACK ====================
cmd({ pattern: "appmaker", alias: ["web2apk"], react: "📱", desc: "Website to App - /api/tools/appmaker", category: "progresstech tools", use: ".appmaker https://google.com", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_URL needed: .appmaker https://google.com_*");
        const res = await OmegatechGet("/api/tools/appmaker", { url: q, website: q });
        const d = res.data || res; reply(`*📱 APPMAKER SUCCESS*\n*URL:* ${q}\n*Download:* ${d.url || d.download_url || d.apk || JSON.stringify(d).slice(0,2000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "ssweb", react: "🌐", desc: "Screenshot Web - /api/tools/ssweb", category: "progresstech tools", use: ".ssweb https://google.com", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_URL needed_*");
        const res = await OmegatechGet("/api/tools/ssweb", { url: q });
        const d = res.data || res; const img = d.url || d.screenshot || d.image || d.result;
        if (img) await conn.sendMessage(from, { image: { url: img }, caption: `*🌐 SSWEB: ${q}*` }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,3000));
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "webtozip", react: "📦", desc: "Web to Zip - /api/tools/webtozip", category: "tools", use: ".webtozip https://example.com", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_URL needed_*");
        const res = await OmegatechGet("/api/tools/webtozip", { url: q });
        const d = res.data || res; reply(`*📦 WEBTOZIP*\n*Link:* ${d.url || d.download_url || d.zip || JSON.stringify(d).slice(0,3000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "wallpaper", react: "🖼️", desc: "Wallpaper - /api/tools/wallpaper", category: "progresstech tools", use: ".wallpaper Naruto", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Query: .wallpaper anime_*");
        const res = await OmegatechGet("/api/tools/wallpaper", { query: q, q: q, prompt: q });
        const d = res.data || res; let url = Array.isArray(d) ? d[0]?.url : d.url || d.image || d.result;
        if (Array.isArray(res.data)) url = res.data[0]?.url || res.data[0]?.image_url;
        if (url) await conn.sendMessage(from, { image: { url }, caption: `*🖼️ Wallpaper: ${q}*` }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,3000));
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "tempnumber", alias: ["temp-number","get-number","getnumber"], react: "📞", desc: "Temp Number with OTP - /api/tools/Temp-number & get-number", category: "progresstech tools", use: ".tempnumber", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { const res = await OmegatechGet("/api/tools/Temp-number", {}); reply(`*📞 TEMP NUMBER*\n${JSON.stringify(res, null, 2).slice(0,4000)}`); } catch (e) { 
        try { const res2 = await OmegatechGet("/api/tools/get-number", {}); reply(`*📞 GET NUMBER*\n${JSON.stringify(res2, null, 2).slice(0,4000)}`); } catch (e2) { reply(`*❌ ${e2.message}*`); }
    }
});

cmd({ pattern: "getotp", alias: ["get-otp"], react: "🔑", desc: "Get OTP - /api/tools/get-otp", category: "progresstech tools", use: ".getotp 2376xxxx", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Number needed: .getotp 237682432296_*");
        const res = await OmegatechGet("/api/tools/get-otp", { number: q });
        reply(`*🔑 OTP RESULT for ${q}*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "smsvirtual", alias: ["smsvitual"], react: "💬", desc: "SMS Virtual - /api/tools/smsvitual", category: "progresstech tools", use: ".smsvirtual", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { const res = await OmegatechGet("/api/tools/smsvitual", { number: q, query: q }); reply(`*💬 SMS VIRTUAL*\n${JSON.stringify(res, null, 2).slice(0,4000)}`); } catch (e) { reply(`*❌ ${e.message}*`); }
});

cmd({ pattern: "emailtick", alias: ["tempmail","email"], react: "📧", desc: "Email Tick - /api/tools/EmailTick", category: "progresstech tools", use: ".emailtick", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { const res = await OmegatechGet("/api/tools/EmailTick", {}); reply(`*📧 EMAIL TICK*\n${JSON.stringify(res, null, 2).slice(0,4000)}`); } catch (e) { reply(`*❌ ${e.message}*`); }
});

cmd({ pattern: "waprofile", alias: ["whatsapp-proile","whatsapp-profile","wastalk"], react: "👤", desc: "WhatsApp Profile - /api/tools/whatsapp-proile", category: "progresstech tools", use: ".waprofile 237682432296", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Number needed: .waprofile 237682432296_*");
        const res = await OmegatechGet("/api/tools/whatsapp-proile", { number: q });
        const p = res.data || res; 
        let cap = `*👤 WA PROFILE*\n*Number:* ${p.number || q}\n*Name:* ${p.name || 'N/A'}\n*Link:* ${p.link || 'https://wa.me/'+q}\n`;
        if (p.profile) await conn.sendMessage(from, { image: { url: p.profile }, caption: cap }, { quoted: mek });
        else reply(cap + JSON.stringify(res).slice(0,2000));
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

// ==================== IMAGE FILTERS (REPLY IMAGE) ====================
async function handleImageTool(conn, mek, m, from, q, reply, toolPath, toolName) {
    try {
        let mediaMsg = m.quoted ? m.quoted : mek;
        if (!m.quoted && !mek.msg?.imageMessage && !mek.msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) return reply(`*_Reply to an image for ${toolName}: .${toolName} (reply image)_*`);
        reply(`*_🎨 ${toolName} processing..._*`);
        const buffer = await conn.downloadMediaMessage(m.quoted ? m.quoted : mek, 'buffer', {}, { reuploadRequest: conn });
        const form = new FormData(); form.append("image", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
        if (q) form.append("prompt", q);
        const { data } = await axios.post(BASE + toolPath, form, { headers: form.getHeaders(), timeout: 180000 });
        const d = data.data || data; const url = d.url || d.image_url || d.result || d.output;
        if (url) await conn.sendMessage(from, { image: { url }, caption: `*✨ ${toolName} Done*` }, { quoted: mek });
        else reply(`*Result:* ${JSON.stringify(data).slice(0,3000)}`);
    } catch (e) { reply(`*❌ ${toolName} Error:* ${e.response?.data?.message || e.message}`); }
}

cmd({ pattern: "upscale", alias: ["image-upscaler","imgupscale"], react: "✨", desc: "Image Upscaler - /api/tools/Image-upscaler", category: "progresstech tools", use: ".upscale (reply image)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => { await handleImageTool(conn, mek, m, from, q, reply, "/api/tools/Image-upscaler", "UPSCALE"); });

cmd({ pattern: "tocartoon", react: "🎨", desc: "To Cartoon - /api/tools/tocartoon", category: "progresstech tools", use: ".tocartoon (reply image)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => { await handleImageTool(conn, mek, m, from, q, reply, "/api/tools/tocartoon", "TOCARTOON"); });

cmd({ pattern: "tocomic", react: "💥", desc: "To Comic - /api/tools/tocomic", category: "progresstech tools", use: ".tocomic (reply image)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => { await handleImageTool(conn, mek, m, from, q, reply, "/api/tools/tocomic", "TOCOMIC"); });

cmd({ pattern: "tomirror", alias: ["tomirror-iphone","mirror"], react: "🪞", desc: "To Mirror iPhone - /api/tools/tomirror-iphone", category: "progresstech tools", use: ".tomirror (reply image)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => { await handleImageTool(conn, mek, m, from, q, reply, "/api/tools/tomirror-iphone", "MIRROR-IPHONE"); });

cmd({ pattern: "tooilpainting", alias: ["tooilpaint","oilpaint"], react: "🖌️", desc: "To Oil Painting - /api/tools/tooilpainting", category: "progress tools", use: ".tooilpainting (reply image)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => { await handleImageTool(conn, mek, m, from, q, reply, "/api/tools/tooilpainting", "OIL-PAINTING"); });

cmd({ pattern: "topixar", react: "✨", desc: "To Pixar - /api/tools/topixar", category: "progresstech tools", use: ".topixar (reply image)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => { await handleImageTool(conn, mek, m, from, q, reply, "/api/tools/topixar", "TOPIXAR"); });

cmd({ pattern: "shazam", react: "🎧", desc: "Shazam - /api/tools/shazam", category: "progresstech tools", use: ".shazam (reply audio)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!m.quoted) return reply("*_Reply to an audio/voice note to shazam_*");
        reply("*_🎧 Shazaming..._*");
        const buffer = await conn.downloadMediaMessage(m.quoted, 'buffer', {}, { reuploadRequest: conn });
        const form = new FormData(); form.append("audio", buffer, { filename: "audio.mp3", contentType: "audio/mpeg" });
        const { data } = await axios.post(BASE + "/api/tools/shazam", form, { headers: form.getHeaders(), timeout: 180000 });
        reply(`*🎧 SHAZAM FOUND*\n${JSON.stringify(data, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Shazam Error:* ${e.response?.data?.message || e.message}`); }
});

cmd({ pattern: "enhancevideo", alias: ["video-enhancer","wink-video-enhancer","wink"], react: "🎥", desc: "Video Enhancer - /api/tools/Video-Enhancer & wink", category: "progresstech tools", use: ".enhancevideo (reply video)", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!m.quoted) return reply("*_Reply to a video_*");
        reply("*_🎥 Enhancing video MONA LISA..._*");
        const buffer = await conn.downloadMediaMessage(m.quoted, 'buffer', {}, { reuploadRequest: conn });
        const form = new FormData(); form.append("video", buffer, { filename: "video.mp4", contentType: "video/mp4" });
        let data;
        try { const res = await axios.post(BASE + "/api/tools/Video-Enhancer", form, { headers: form.getHeaders(), timeout: 300000 }); data = res.data; }
        catch { const res2 = await axios.post(BASE + "/api/tools/wink-Video-enhancer", form, { headers: form.getHeaders(), timeout: 300000 }); data = res2.data; }
        const d = data.data || data; const url = d.url || d.video_url || d.result;
        if (url) await conn.sendMessage(from, { video: { url }, caption: "*🎥 Enhanced Video*" }, { quoted: mek });
        else reply(JSON.stringify(data).slice(0,3000));
    } catch (e) { reply(`*❌ Enhance Error:* ${e.message}`); }
});

// ==================== STALK PACK ====================
cmd({ pattern: "ffstalk", alias: ["freefire"], react: "🔥", desc: "FreeFire Stalk - /api/Stalk/Freefire", category: "stalk", use: ".ffstalk UID", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_UID needed: .ffstalk 123456_*");
        const res = await OmegatechGet("/api/Stalk/Freefire", { uid: q, id: q, username: q });
        reply(`*🔥 FREEFIRE STALK ${q}*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "igstalk", alias: ["instagram","ig"], react: "📸", desc: "Instagram Stalk - /api/Stalk/Instagram", category: "stalk", use: ".igstalk username", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Username: .igstalk cristiano_*");
        const res = await OmegatechGet("/api/Stalk/Instagram", { username: q });
        const d = res.data || res; 
        if (d.profile_pic) await conn.sendMessage(from, { image: { url: d.profile_pic }, caption: `*📸 IG: ${q}*\n*Name:* ${d.full_name || d.name}\n*Followers:* ${d.followers || d.follower_count}\n*Bio:* ${d.bio || d.biography}` }, { quoted: mek });
        else reply(`*📸 IG STALK ${q}*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "ttstalk", alias: ["tiktok"], react: "🎵", desc: "TikTok Stalk - /api/Stalk/TikTok", category: "stalk", use: ".ttstalk username", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Username: .ttstalk charlidamelio_*");
        const res = await OmegatechGet("/api/Stalk/TikTok", { username: q });
        reply(`*🎵 TIKTOK STALK ${q}*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "ytstalk", alias: ["youtube"], react: "▶️", desc: "YouTube Stalk - /api/Stalk/Youtube", category: "stalk", use: ".ytstalk channel name", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Channel: .ytstalk MrBeast_*");
        const res = await OmegatechGet("/api/Stalk/Youtube", { username: q, channel: q });
        reply(`*▶️ YT STALK ${q}*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

// ==================== DOWNLOAD PACK ====================
cmd({ pattern: "apkmody", react: "📲", desc: "ApkMody - /api/download/apkmody", category: "downloader", use: ".apkmody Spotify", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_App name: .apkmody Spotify_*");
        const res = await OmegatechGet("/api/download/apkmody", { q: q, query: q, app: q });
        reply(`*📲 APKMODY ${q}*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "mediafire", alias: ["mfdl"], react: "📁", desc: "Mediafire DL - /api/download/Mediafire", category: "downloader", use: ".mediafire <link>", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Link needed: .mediafire https://mediafire.com/..._*");
        const res = await OmegatechGet("/api/download/Mediafire", { url: q });
        const d = res.data || res; reply(`*📁 MEDIAFIRE*\n*Name:* ${d.filename || d.name}\n*Size:* ${d.size}\n*DL:* ${d.download_url || d.url || d.link}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "spotifydl", alias: ["spotify-dl","spdl"], react: "🎧", desc: "Spotify DL - /api/download/Spotify-dl", category: "downloader", use: ".spotifydl <link>", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_Spotify link needed_*");
        reply("*_🎧 Downloading Spotify..._*");
        const res = await OmegatechGet("/api/download/Spotify-dl", { url: q });
        const d = res.data || res; const url = d.download_url || d.url || d.audio_url || d.link;
        if (url) await conn.sendMessage(from, { audio: { url }, mimetype: "audio/mpeg", fileName: `${d.title || 'spotify'}.mp3` }, { quoted: mek });
        else reply(JSON.stringify(res).slice(0,4000));
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});

cmd({ pattern: "ytmate", alias: ["yt-mate","ytmp3","ytmp4"], react: "▶️", desc: "Yt-Mate - /api/download/Yt-mate", category: "downloader", use: ".ytmate <youtube link>", filename: __filename },
async (conn, mek, m, { from, q, reply }) => {
    try { if (!q) return reply("*_YT link: .ytmate https://youtu.be/..._*");
        const res = await OmegatechGet("/api/download/Yt-mate", { url: q });
        reply(`*▶️ YT-MATE*\n${JSON.stringify(res, null, 2).slice(0,4000)}`);
    } catch (e) { reply(`*❌ Error:* ${e.message}`); }
});