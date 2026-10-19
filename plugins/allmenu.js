// ═══════════════════════════════════════════════════════════════════════════
//   👑 MONA LISA MENU — the legendary command list
//   Powered by Progress Tech
// ═══════════════════════════════════════════════════════════════════════════

const { cmd, commands } = require("../redx");
const moment = require("moment-timezone");
const config = require("../config");
const { pick } = require('../lib/responses');
const { sendImage } = require('../lib/media');

const bootTime = Date.now();

const SECTIONS = [
    { key: 'ai', title: '🧠 AI & INTELLIGENCE', match: ['ai'] },
    { key: 'progresstech ai', title: '💎 PROGRESS TECH AI', match: ['progresstech-ai'] },
    { key: 'progresstech tools', title: '🔮 PROGRESS TECH TOOLS', match: ['progresstech tools'] },
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
];

const TAGLINES = [
    '"Behind every smile, a command waiting to be painted."',
    '"Elegance is the only beauty that never fades."',
    '"A masterpiece never explains itself — it performs."',
    '"Mystery is my favorite command prefix."',
    '"Painted once. Remembered forever."',
];

const MENU_IMAGES = [
    'https://files.catbox.moe/w4ttld.jpg',
    'https://files.catbox.moe/96vvsr.jpg',
    'https://files.catbox.moe/1dp0f5.jpg',
    'https://files.catbox.moe/jdnmqf.jpg',
];
const menuViewCount = new Map();

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

function groupCommands() {
    const grouped = {};
    let total = 0;
    for (const c of commands) {
        if (!c.pattern || !c.category || c.dontAddCommandList) continue;
        total++;
        const section = sectionFor(c.category);
        if (!grouped[section.title]) grouped[section.title] = [];
        if (!grouped[section.title].includes(c.pattern)) grouped[section.title].push(c.pattern);
    }
    return { grouped, total };
}

function findSection(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return null;
    return SECTIONS.find(s =>
        s.key === q ||
        s.title.toLowerCase().includes(q) ||
        s.match.some(m => m === q || m.includes(q))
    ) || null;
}

function channelCtx(sender) {
    const ctx = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: config.CHANNEL_JID,
            newsletterName: "🥰 MONA LISA V2 🤭",
            serverMessageId: 2,
        },
    };
    if (sender) ctx.mentionedJid = [sender];
    return ctx;
}

function buildOverview(pushName, total, grouped) {
    const time = moment().tz("Africa/Lagos").format("HH:mm:ss");
    const date = moment().tz("Africa/Lagos").format("ddd, D MMM YYYY");
    const p = config.PREFIX || '.';
    const lines = SECTIONS
        .filter(s => grouped[s.title]?.length)
        .map(s => `${s.title}  (${grouped[s.title].length})\n   ${p}menu ${s.key}`);

    return [
        `🥰 *MONA LISA V2* 🤭`,
        pick(TAGLINES),
        ``,
        `👤 ${pushName}  ·  👑 ${config.OWNER_NAME}`,
        `⚡ Prefix ${p}  ·  📜 ${total} cmds  ·  ⏱️ ${uptime()}`,
        `🕰️ ${time}  ·  📅 ${date}`,
        `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈`,
        ...lines,
        `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈`,
        `Type *${p}menu all* for every command`,
        `Type *${p}menu <section>* for one category`,
    ].join('\n');
}

function buildSectionText(section, grouped) {
    const p = config.PREFIX || '.';
    const list = grouped[section.title] || [];
    const cmds = list.map(name => `${p}${name}`).join('  ·  ');
    return `*${section.title}*\n${list.length} commands\n\n${cmds}\n\n> 🥰 *MONA LISA V2* 🤭 · ${config.OWNER_NAME}`;
}

function buildFullText(grouped) {
    const p = config.PREFIX || '.';
    const parts = SECTIONS
        .filter(s => grouped[s.title]?.length)
        .map(s => `*${s.title}*\n${grouped[s.title].map(name => `${p}${name}`).join('  ·  ')}`);
    parts.push(`> 🥰 *MONA LISA V2* 🤭 · ${config.OWNER_NAME}\n${config.CHANNEL_LINK || ''}`);
    return parts.join('\n\n');
}

function chunkText(text, max = 3500) {
    if (text.length <= max) return [text];
    const chunks = [];
    let rest = text;
    while (rest.length) {
        if (rest.length <= max) {
            chunks.push(rest);
            break;
        }
        let cut = rest.lastIndexOf('\n\n', max);
        if (cut < max * 0.4) cut = rest.lastIndexOf('\n', max);
        if (cut < max * 0.4) cut = max;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
    }
    return chunks;
}

cmd({
    pattern: "menu",
    alias: ["commandlist", "allmenu", "help"],
    desc: "Display the full MONA LISA command menu",
    category: "system",
    filename: __filename,
}, async (conn, mek, m, { reply, q, from }) => {
    try {
        const { grouped, total } = groupCommands();
        const chatId = from || m.chat;
        const filter = String(q || '').trim();
        const section = findSection(filter);

        if (section) {
            const text = buildSectionText(section, grouped);
            await conn.sendMessage(chatId, { text, contextInfo: channelCtx(m.sender) }, { quoted: mek });
            return;
        }

        if (filter && filter.toLowerCase() !== 'all') {
            await reply(`No section named "${filter}".\nTry: ${SECTIONS.map(s => s.key).join(', ')}, or *${config.PREFIX}menu all*`);
            return;
        }

        const caption = buildOverview(m.pushName || "Guest", total, grouped).slice(0, 1000);
        const viewIndex = menuViewCount.get(chatId) || 0;
        const imageUrl = MENU_IMAGES[viewIndex % MENU_IMAGES.length];
        menuViewCount.set(chatId, viewIndex + 1);

        try {
            await sendImage(conn, chatId, {
                url: imageUrl,
                caption,
                contextInfo: channelCtx(m.sender),
                quoted: mek,
            });
        } catch (imgErr) {
            console.error("Menu image send failed, falling back to text:", imgErr.message);
            await conn.sendMessage(chatId, { text: caption, contextInfo: channelCtx(m.sender) }, { quoted: mek });
        }

        if (filter.toLowerCase() === 'all') {
            const chunks = chunkText(buildFullText(grouped));
            for (const chunk of chunks) {
                await conn.sendMessage(chatId, { text: chunk, contextInfo: channelCtx() }, { quoted: mek });
            }
        }
    } catch (err) {
        console.error("Menu error:", err);
        reply("😌 Mona Lisa noticed something went wrong building the menu... let's fix it.\n\n" + (err.message || err));
    }
});
