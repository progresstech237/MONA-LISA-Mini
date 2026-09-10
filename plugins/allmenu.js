// ═══════════════════════════════════════════════════════════════════════════
//   👑 MONA LISA MENU — the legendary command list
//   Powered by Progress Tech
// ═══════════════════════════════════════════════════════════════════════════

const { cmd, commands } = require("../redx");
const moment = require("moment-timezone");
const config = require("../config");
const { fakevCard } = require('../lib/fakevCard');
const { pick } = require('../lib/responses');

const bootTime = Date.now();

// Maps the raw `category` string every plugin registers with to a
// beautiful display section. Anything unmatched falls into "Bot Tools".
const SECTIONS = [
    { key: 'ai', title: '🧠 AI & INTELLIGENCE', match: ['ai'] },
    { key: 'progresstech ai', title: '💎 PROGRESS TECH AI', match: ['progresstech ai'] },
    { key: 'progresstech tools', title: '🔮 PROGRESS TECH TOOLS', match: ['progresstech tools'] },
    { key: 'stalk', title: '👁️ STALKER ZONE', match: ['stalk', 'stalker'] },
    { key: 'image', title: '🎨 IMAGE STUDIO', match: ['sticker', 'image'] },
    { key: 'video', title: '🎬 VIDEO STUDIO', match: ['video'] },
    { key: 'music', title: '🎵 MUSIC STUDIO', match: ['music', 'song'] },
    { key: 'download', title: '📥 DOWNLOAD TOOLS', match: ['download', 'downloader'] },
    { key: 'search', title: '🌐 SEARCH & INFO', match: ['search'] },
    { key: 'fun', title: '😄 FUN & GAMES', match: ['fun', 'games'] },
    { key: 'group', title: '👥 GROUP MANAGER', match: ['group', 'admin'] },
    { key: 'tools', title: '🛠️ UTILITIES', match: ['tools', 'settings', 'general'] },
    { key: 'system', title: '🤖 BOT TOOLS', match: ['system', 'main'] },
    { key: 'owner', title: '🔐 OWNER ONLY', match: ['owner'] },
    {key: 'economy', title: '⛏️ECONOMY👝', match: ['economy'] },
];

const TAGLINES = [
    '"Behind every smile, a command waiting to be painted."',
    '"Elegance is the only beauty that never fades."',
    '"A masterpiece never explains itself — it performs."',
    '"Mystery is my favorite command prefix."',
    '"Painted once. Remembered forever."',
];

function sectionFor(category) {
    const c = String(category || '').toLowerCase();
    return SECTIONS.find(s => s.match.includes(c)) || SECTIONS.find(s => s.key === 'system');
}

function uptime() {
    const sec = Math.floor((Date.now() - bootTime) / 1000);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
}

function frame(title, lines) {
    const left = `──❖ ${title} ❖`;
    const contentWidth = Math.max(...lines.map(l => l.length + 2), left.length + 1, 22);
    const dashCount = Math.max(contentWidth - left.length, 1);
    const top = `╭${left}${'─'.repeat(dashCount)}╮`;
    const body = lines.map(l => `│ ${l}`).join('\n');
    const bottom = `╰${'─'.repeat(left.length + dashCount)}╯`;
    return `${top}\n${body}\n${bottom}`;
}

function buildMenu(pushName) {
    const grouped = {};
    let total = 0;

    for (const c of commands) {
        if (!c.pattern || !c.category || c.dontAddCommandList) continue;
        total++;
        const section = sectionFor(c.category);
        if (!grouped[section.title]) grouped[section.title] = [];
        if (!grouped[section.title].includes(c.pattern)) grouped[section.title].push(c.pattern);
    }

    const time = moment().tz("Africa/Lagos").format("HH:mm:ss");
    const date = moment().tz("Africa/Lagos").format("dddd, Do MMMM YYYY");

    const statusBox = frame('⚜️ STATUS', [
        `👤 User     : ${pushName}`,
        `👑 Owner    : ${config.OWNER_NAME}`,
        `⚡ Prefix   : ${config.PREFIX}`,
        `📜 Commands : ${total}`,
        `⏱️ Uptime   : ${uptime()}`,
        `🕰️ Time     : ${time}`,
        `📅 Date     : ${date}`,
    ]);

    const sectionBoxes = SECTIONS
        .filter(s => grouped[s.title]?.length)
        .map(s => frame(s.title, grouped[s.title].map(p => `➛ ${config.PREFIX}${p}`)))
        .join('\n\n');

    const channelBox = frame('📡 STAY CONNECTED', [
        `Join the official channel:`,
        `${config.CHANNEL_LINK}`,
    ]);

    return `
👑 ✦ 𝐌𝐎𝐍𝐀 𝐋𝐈𝐒𝐀 🤭 ✦ 👑
   ᴍɪɴɪ ʙᴏᴛ • ʟᴇɢᴇɴᴅᴀʀʏ ᴇᴅɪᴛɪᴏɴ
   ${pick(TAGLINES)}

${statusBox}

${sectionBoxes}

${channelBox}

🥰 *MONA LISA* 🤭 · Powered by ${config.OWNER_NAME}
`.trim();
}

cmd({
    pattern: "menu",
    alias: ["commandlist", "allmenu", "help"],
    desc: "Display the full MONA LISA command menu",
    category: "system",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    try {
        const caption = buildMenu(m.pushName || "Guest");

        await conn.sendMessage(m.chat, {
            image: { url: config.IMAGE_PATH },
            caption,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.CHANNEL_JID,
                    newsletterName: "🥰 MONA LISA 🤭",
                    serverMessageId: 2,
                },
            },
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("Menu error:", err);
        reply("😌 Mona Lisa noticed something went wrong building the menu... let's fix it.\n\n" + err.message);
    }
});
