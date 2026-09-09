// ═══════════════════════════════════════════════════════════════════════════
//   🎨🧊🎵 STABILITY AI STUDIO — MONA LISA
//   Powered by Progress Tech
//   Real, documented Stability AI v2beta endpoints. Nothing here pretends
//   to work without a configured STABILITY_API_KEY — see providers/stability/.
// ═══════════════════════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const { success, error, loading } = require('../lib/responses');
const stImage = require('../providers/stability/image');
const st3D = require('../providers/stability/threeD');
const stAudio = require('../providers/stability/audio');
const { configHint, isConfigured } = require('../providers/stability/client');

function needsQuotedImage(m) {
    return !m.quoted || m.quoted.mtype !== 'imageMessage';
}

async function handle(reply, task, loadingMsg) {
    if (!isConfigured()) return reply(error(configHint()));
    try {
        await reply(loading(loadingMsg));
        return await task();
    } catch (e) {
        await reply(error(e.notConfigured ? e.message : `Stability AI had trouble: ${e.message}`));
    }
}

// ── GENERATE ──

cmd({
    pattern: "imagine",
    alias: ["aiimage", "txt2img", "ultra"],
    desc: "Generate an image with Stable Image Ultra (highest quality)",
    category: "image", react: "🎨", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (!q) return reply("🎨 *Usage:* .imagine <description>\n\nUses Stable Image Ultra — Stability's flagship, highest-quality model.");
    await handle(reply, async () => {
        const buf = await stImage.generateUltra(q);
        await conn.sendMessage(m.chat, { image: buf, caption: success(`"${q}"`) }, { quoted: mek });
    }, "Mixing the colors on the canvas...");
});

cmd({
    pattern: "core",
    alias: ["fastimage"],
    desc: "Generate an image with Stable Image Core (fast & affordable)",
    category: "image", react: "🎨", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (!q) return reply("🎨 *Usage:* .core <description>\n\nFaster, cheaper than .imagine — good for quick iteration.");
    await handle(reply, async () => {
        const buf = await stImage.generateCore(q);
        await conn.sendMessage(m.chat, { image: buf, caption: success(`"${q}"`) }, { quoted: mek });
    }, "Sketching a quick draft...");
});

cmd({
    pattern: "sd35",
    alias: ["sd3"],
    desc: "Generate an image with a specific Stable Diffusion 3.5 model",
    category: "image", react: "🎨", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    const VALID = ['sd3.5-large', 'sd3.5-large-turbo', 'sd3.5-medium', 'sd3.5-flash'];
    if (!q || !q.includes('|')) {
        return reply(`🎨 *Usage:* .sd35 <model>|<description>\n\nModels: ${VALID.join(', ')}\nExample: .sd35 sd3.5-large-turbo|a wolf in Yosemite, documentary photography`);
    }
    const [modelRaw, ...rest] = q.split('|');
    const model = modelRaw.trim().toLowerCase();
    const prompt = rest.join('|').trim();
    if (!VALID.includes(model)) return reply(error(`Unknown model "${model}". Choose from: ${VALID.join(', ')}`));

    await handle(reply, async () => {
        const buf = await stImage.generateSD35(prompt, model);
        await conn.sendMessage(m.chat, { image: buf, caption: success(`${model} — "${prompt}"`) }, { quoted: mek });
    }, "Rendering with SD 3.5...");
});

// ── UPSCALE ──

cmd({
    pattern: "upscale",
    alias: ["upscalefast"],
    desc: "Reply to an image to upscale it 4x (fast)",
    category: "image", react: "🔍", filename: __filename,
}, async (conn, mek, m, { reply }) => {
    if (needsQuotedImage(m)) return reply("🔍 *Usage:* Reply to an image with .upscale");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.upscaleFast(img);
        await conn.sendMessage(m.chat, { image: buf, caption: success('Upscaled 4x.') }, { quoted: mek });
    }, "Sharpening every detail...");
});

cmd({
    pattern: "upscalehd",
    alias: ["upscaleconservative"],
    desc: "Reply to a small/degraded image to upscale it up to 4MP, preserving detail",
    category: "image", react: "🔍", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m)) return reply("🔍 *Usage:* Reply to an image with .upscalehd [optional detail hints]");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.upscaleConservative(img, q);
        await conn.sendMessage(m.chat, { image: buf, caption: success('Upscaled to high resolution.') }, { quoted: mek });
    }, "Reconstructing fine detail (this can take a minute)...");
});

cmd({
    pattern: "upscalecreative",
    alias: ["upscaleai"],
    desc: "Reply to a heavily degraded image for a creative AI upscale",
    category: "image", react: "🔍", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m)) return reply("🔍 *Usage:* Reply to an image with .upscalecreative [optional style hints]");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.upscaleCreative(img, q);
        await conn.sendMessage(m.chat, { image: buf, caption: success('Creatively reimagined and upscaled.') }, { quoted: mek });
    }, "This one takes a little longer — worth the wait...");
});

// ── EDIT ──

cmd({
    pattern: "removebg",
    alias: ["nobg", "bgremove"],
    desc: "Reply to an image to remove its background",
    category: "image", react: "✂️", filename: __filename,
}, async (conn, mek, m, { reply }) => {
    if (needsQuotedImage(m)) return reply("✂️ *Usage:* Reply to an image with .removebg");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.removeBackground(img);
        await conn.sendMessage(m.chat, { image: buf, caption: success('Background removed.') }, { quoted: mek });
    }, "Lifting the subject free...");
});

cmd({
    pattern: "outpaint",
    alias: ["extendimage"],
    desc: "Reply to an image to extend it in a direction",
    category: "image", react: "🖼️", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q || !q.includes('|')) {
        return reply("🖼️ *Usage:* Reply to an image with .outpaint <up|down|left|right> <pixels>|<optional description>\n\nExample: .outpaint right 400|a sunny meadow continuing the road");
    }
    const [dirPart, ...rest] = q.split('|');
    const [dirRaw, pxRaw] = dirPart.trim().split(/\s+/);
    const dir = (dirRaw || '').toLowerCase();
    const px = parseInt(pxRaw, 10);
    if (!['up', 'down', 'left', 'right'].includes(dir) || !px || px < 1) {
        return reply(error('Direction must be up/down/left/right, followed by a pixel amount, e.g. "right 400".'));
    }
    const prompt = rest.join('|').trim();

    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.outpaint(img, { [dir]: px }, prompt);
        await conn.sendMessage(m.chat, { image: buf, caption: success(`Extended ${px}px ${dir}.`) }, { quoted: mek });
    }, "Painting beyond the frame...");
});

cmd({
    pattern: "searchreplace",
    alias: ["swapobject"],
    desc: "Reply to an image to replace one object with another by description",
    category: "image", react: "🔄", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q || !q.includes('|')) {
        return reply("🔄 *Usage:* Reply to an image with .searchreplace <find>|<replace with>\n\nExample: .searchreplace the red car|a blue bicycle");
    }
    const [find, ...rest] = q.split('|');
    const replaceWith = rest.join('|').trim();

    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.searchAndReplace(img, find.trim(), replaceWith);
        await conn.sendMessage(m.chat, { image: buf, caption: success(`"${find.trim()}" → "${replaceWith}"`) }, { quoted: mek });
    }, "Finding and repainting...");
});

cmd({
    pattern: "recolor",
    alias: ["searchrecolor"],
    desc: "Reply to an image to recolor a specific object",
    category: "image", react: "🎨", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q || !q.includes('|')) {
        return reply("🎨 *Usage:* Reply to an image with .recolor <object>|<new color/description>\n\nExample: .recolor the jacket|bright red leather");
    }
    const [object, ...rest] = q.split('|');
    const newColor = rest.join('|').trim();

    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.searchAndRecolor(img, object.trim(), newColor);
        await conn.sendMessage(m.chat, { image: buf, caption: success(`Recolored "${object.trim()}".`) }, { quoted: mek });
    }, "Mixing new colors...");
});

cmd({
    pattern: "relight",
    alias: ["newbackground"],
    desc: "Reply to an image to replace its background and relight the subject",
    category: "image", react: "💡", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q) {
        return reply("💡 *Usage:* Reply to an image with .relight <new background description>\n\nExample: .relight a golden hour beach at sunset");
    }
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.replaceBackgroundAndRelight(img, q);
        await conn.sendMessage(m.chat, { image: buf, caption: success('New background, relit.') }, { quoted: mek });
    }, "Adjusting the light just so (this can take a minute)...");
});

// ── CONTROL ──

cmd({
    pattern: "sketch2img",
    alias: ["sketchtoimg"],
    desc: "Reply to a hand-drawn sketch to render it as a full image",
    category: "image", react: "✏️", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q) return reply("✏️ *Usage:* Reply to a sketch image with .sketch2img <description>");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.controlSketch(img, q);
        await conn.sendMessage(m.chat, { image: buf, caption: success('From sketch to masterpiece.') }, { quoted: mek });
    }, "Bringing the sketch to life...");
});

cmd({
    pattern: "structure2img",
    alias: ["structuretoimg"],
    desc: "Reply to an image to regenerate it in a new style, keeping its structure",
    category: "image", react: "🏛️", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q) return reply("🏛️ *Usage:* Reply to an image with .structure2img <new description>");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.controlStructure(img, q);
        await conn.sendMessage(m.chat, { image: buf, caption: success('Same structure, new vision.') }, { quoted: mek });
    }, "Preserving the shape, changing the style...");
});

cmd({
    pattern: "styleguide",
    alias: ["stylefrom"],
    desc: "Reply to a reference image to generate a new image in that visual style",
    category: "image", react: "🖌️", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (needsQuotedImage(m) || !q) return reply("🖌️ *Usage:* Reply to a reference image with .styleguide <what to generate>");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await stImage.controlStyle(img, q);
        await conn.sendMessage(m.chat, { image: buf, caption: success('Styled after your reference.') }, { quoted: mek });
    }, "Studying the style...");
});

// ── 3D ──

cmd({
    pattern: "to3d",
    alias: ["stablefast3d"],
    desc: "Reply to an image to convert it into a 3D model (.glb)",
    category: "image", react: "🧊", filename: __filename,
}, async (conn, mek, m, { reply }) => {
    if (needsQuotedImage(m)) return reply("🧊 *Usage:* Reply to an image with .to3d");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await st3D.stableFast3D(img);
        await conn.sendMessage(m.chat, {
            document: buf, mimetype: 'model/gltf-binary', fileName: 'mona-lisa-3d.glb',
            caption: success('Your 3D model is ready (.glb).'),
        }, { quoted: mek });
    }, "Sculpting in three dimensions...");
});

cmd({
    pattern: "to3dhq",
    alias: ["spar3d"],
    desc: "Reply to an image for a higher-quality 3D model with better backside detail",
    category: "image", react: "🧊", filename: __filename,
}, async (conn, mek, m, { reply }) => {
    if (needsQuotedImage(m)) return reply("🧊 *Usage:* Reply to an image with .to3dhq");
    await handle(reply, async () => {
        const img = await m.quoted.download();
        const buf = await st3D.stablePointAware3D(img);
        await conn.sendMessage(m.chat, {
            document: buf, mimetype: 'model/gltf-binary', fileName: 'mona-lisa-3d-hq.glb',
            caption: success('High-quality 3D model ready (.glb).'),
        }, { quoted: mek });
    }, "Refining every angle, including the ones you can't see...");
});

// ── AUDIO ──

cmd({
    pattern: "genmusic",
    alias: ["aimusic", "makemusic", "stableaudio"],
    desc: "Generate music or sound effects from a text description (Stable Audio)",
    category: "music", react: "🎵", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (!q) return reply("🎵 *Usage:* .genmusic <description>\n\nExample: .genmusic a calm lo-fi piano melody for studying");
    await handle(reply, async () => {
        const buf = await stAudio.textToAudio(q);
        await conn.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg' }, { quoted: mek });
        await reply(success('Enjoy your composition.'));
    }, "Composing your melody (this can take a minute)...");
});

cmd({
    pattern: "audio2audio",
    alias: ["remixaudio"],
    desc: "Reply to an audio clip to restyle it with a text description (Stable Audio)",
    category: "music", react: "🎵", filename: __filename,
}, async (conn, mek, m, { reply, q }) => {
    if (!m.quoted || m.quoted.mtype !== 'audioMessage' || !q) {
        return reply("🎵 *Usage:* Reply to an audio clip with .audio2audio <new style description>\n\nExample: .audio2audio turn this into a lo-fi hip-hop beat");
    }
    await handle(reply, async () => {
        const audio = await m.quoted.download();
        const buf = await stAudio.audioToAudio(audio, q);
        await conn.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg' }, { quoted: mek });
        await reply(success('Restyled — take a listen.'));
    }, "Reshaping the sound (this can take a minute)...");
});
