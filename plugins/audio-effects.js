// 🎧 AUDIO EFFECTS — MONA LISA | Fixed by Progress Tech
const { cmd } = require('../redx');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const TEMP_DIR = './temp';
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const EFFECTS = {
    bass: { filter: 'bass=g=20:f=110:w=0.6,volume=2', emoji: '🔊', desc: 'Heavy bass' },
    nightcore: { filter: 'atempo=1.25,asetrate=48000*1.25', emoji: '🌙', desc: 'Nightcore' },
    slow: { filter: 'atempo=0.8', emoji: '🐢', desc: 'Slowed + deep' },
    fast: { filter: 'atempo=1.5', emoji: '🐇', desc: 'Fast' },
    reverse: { filter: 'areverse', emoji: '⏪', desc: 'Reverse' },
    deep: { filter: 'atempo=0.8,asetrate=48000*0.8', emoji: '🕳️', desc: 'Deep voice' },
    smooth: { filter: 'lowpass=f=1000', emoji: '🎚️', desc: 'Smooth' },
    squirrel: { filter: 'atempo=0.8,asetrate=48000*1.4', emoji: '🐿️', desc: 'Chipmunk' },
    '8d': { filter: 'apulsator=hz=0.125', emoji: '🎧', desc: '8D audio' },
    blown: { filter: 'acrusher=level_in=8:level_out=18:bits=8:mode=log:aa=1', emoji: '💥', desc: 'Blown speaker' },
};

async function applyEffect(inputPath, outputPath, filter) {
    // check ffmpeg exists
    const cmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" "${outputPath}"`;
    await execAsync(cmd);
    if (!fs.existsSync(outputPath)) throw new Error('FFmpeg failed to create file');
}

for (const [name, cfg] of Object.entries(EFFECTS)) {
    cmd({
        pattern: name,
        desc: `${cfg.desc} effect - reply to audio`,
        category: 'audio',
        react: cfg.emoji,
        filename: __filename,
    }, async (conn, mek, m, { reply }) => {
        try {
            // FIX 1: Correct way to get quoted audio in redx
            let quoted = m.quoted || m.msg?.contextInfo?.quotedMessage;
            let audioMsg = null;

            if (m.quoted && m.quoted.mtype === 'audioMessage') audioMsg = m.quoted;
            else if (m.quoted && m.quoted.message?.audioMessage) audioMsg = m.quoted;
            else if (m.msg?.contextInfo?.quotedMessage?.audioMessage) {
                // fallback for some bots
                audioMsg = { message: m.msg.contextInfo.quotedMessage };
            }

            if (!m.quoted) {
                return reply(`${cfg.emoji} *Reply to an audio/voice note with .${name}*\nExample: reply to vn with .bass`);
            }

            await conn.sendMessage(m.chat, { react: { text: "⏳", key: mek.key } });

            // FIX 2: download properly
            const buffer = await m.quoted.download();
            if (!buffer) throw new Error('Failed to download audio');

            const inputPath = path.join(TEMP_DIR, `${Date.now()}_in.mp3`);
            const outputPath = path.join(TEMP_DIR, `${Date.now()}_out.mp3`);
            fs.writeFileSync(inputPath, buffer);

            await reply(`*${cfg.emoji} Applying ${name} effect...*`);

            await applyEffect(inputPath, outputPath, cfg.filter);

            const outBuffer = fs.readFileSync(outputPath);

            // send as ptt if original was ptt
            const isPtt = m.quoted.message?.audioMessage?.ptt || false;

            await conn.sendMessage(m.chat, {
                audio: outBuffer,
                mimetype: 'audio/mpeg',
                ptt: isPtt
            }, { quoted: mek });

            // cleanup
            try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}

            await conn.sendMessage(m.chat, { react: { text: "✅", key: mek.key } });

        } catch (e) {
            console.error(`[AUDIO EFFECT ${name}]`, e);
            reply(`*❌ Failed to apply ${name}:*\n${e.message}\n\nMake sure ffmpeg is installed: \`apt install ffmpeg\``);
        }
    });
                              }
