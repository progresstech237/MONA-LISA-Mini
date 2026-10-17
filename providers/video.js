// ═══════════════════════════════════════════════════════════════════════════
//   🎬 VIDEO PROVIDER — backed by the OmegaTech video APIs
//
//   The ai-studio plugin talks to this module for .genvideo and .img2video.
//   OmegaTech exposes several video backends; we try them in order and return
//   the first real video URL. Talking-avatar (lip-sync) is not offered by this
//   provider, so it reports itself as unconfigured instead of pretending.
// ═══════════════════════════════════════════════════════════════════════════

const omega = require('../lib/omegatech');
const { _internal } = omega;

function dataUrlToBuffer(dataUrl) {
    const m = /^data:([^;]+);base64,(.*)$/s.exec(String(dataUrl || ''));
    if (!m) return null;
    return { buffer: Buffer.from(m[2], 'base64'), contentType: m[1] };
}

function findVideoUrl(data) {
    return _internal.findMediaUrl(data, ['mp4', 'webm', 'mov', 'm4v']);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Text to video ─────────────────────────────────────────────────────────
async function generateFromText(prompt, { ratio = '1:1' } = {}) {
    const attempts = [
        async () => {
            const r = await omega._get('/api/ai/Txt2video', { action: 'generate', prompt, ratio, sound: false }, { timeout: 300000 });
            if (_internal.isFailed(r.data)) throw new Error(_internal.apiError(r.data));
            const url = findVideoUrl(r.data) || (typeof r.data?.data === 'string' && /^https?:/.test(r.data.data) ? r.data.data : '');
            if (!url) throw new Error('Txt2video returned no URL');
            return url;
        },
        async () => {
            const r = await omega._get('/api/ai/Sora', { action: 'generate', prompt, wait: true }, { timeout: 300000 });
            if (_internal.isFailed(r.data)) throw new Error(_internal.apiError(r.data));
            const url = findVideoUrl(r.data);
            if (!url) throw new Error('Sora returned no URL');
            return url;
        },
        async () => {
            // Wan fast returns directly for the short duration.
            const start = await omega._get('/api/ai/wan', { action: 'generate', prompt, duration: 5.1 }, { timeout: 300000 });
            let url = findVideoUrl(start.data);
            const sessionId = start.data?.sessionId || start.data?.data?.sessionId;
            if (!url && sessionId) {
                for (let i = 0; i < 18 && !url; i++) {
                    await sleep(8000);
                    const r = await omega._get('/api/ai/wan', { action: 'result', sessionId });
                    url = findVideoUrl(r.data);
                }
            }
            if (!url) throw new Error('Wan returned no URL');
            return url;
        },
        async () => {
            const r = await omega._get('/api/ai/Qwen-text-to-video', { prompt, size: '1280x720' }, { timeout: 300000 });
            if (_internal.isFailed(r.data)) throw new Error(_internal.apiError(r.data));
            const url = findVideoUrl(r.data);
            if (!url) throw new Error('Qwen video returned no URL');
            return url;
        },
    ];

    let last;
    for (const a of attempts) {
        try { return await a(); } catch (e) { last = e; }
    }
    throw last || new Error('Video generation failed on all providers.');
}

// ── Image to video ────────────────────────────────────────────────────────
async function generateFromImage(imageDataUrl, prompt) {
    const parsed = dataUrlToBuffer(imageDataUrl);
    if (!parsed) throw new Error('Invalid image data.');
    const publicUrl = await omega.uploadBuffer(parsed.buffer, 'mona-lisa-video.jpg', parsed.contentType || 'image/jpeg');

    const attempts = [
        async () => {
            const r = await omega._get('/api/ai/Ai-video', { prompt, imageUrl: publicUrl, timeout: 600 }, { timeout: 300000 });
            if (_internal.isFailed(r.data)) throw new Error(_internal.apiError(r.data));
            const url = findVideoUrl(r.data);
            if (!url) throw new Error('Ai-video returned no URL');
            return url;
        },
        async () => {
            const r = await omega._get('/api/ai/grok-3-video', { prompt, imageUrl: publicUrl, ratio: 'square' }, { timeout: 300000 });
            if (_internal.isFailed(r.data)) throw new Error(_internal.apiError(r.data));
            const url = findVideoUrl(r.data);
            if (!url) throw new Error('Grok video returned no URL');
            return url;
        },
        async () => {
            const start = await omega._get('/api/ai/Wan-fast', { action: 'submit', image: publicUrl, prompt, aspectRatio: '1:1' }, { timeout: 120000 });
            const taskId = start.data?.taskId || start.data?.data?.taskId || start.data?.id;
            if (!taskId) throw new Error('Wan-fast returned no taskId');
            for (let i = 0; i < 18; i++) {
                await sleep(8000);
                const r = await omega._get('/api/ai/Wan-fast', { action: 'status', taskId });
                const url = findVideoUrl(r.data);
                if (url) return url;
            }
            throw new Error('Wan-fast timed out');
        },
    ];

    let last;
    for (const a of attempts) {
        try { return await a(); } catch (e) { last = e; }
    }
    throw last || new Error('Image-to-video failed on all providers.');
}

module.exports = {
    name: 'OmegaTech Video',

    isT2VConfigured: () => true,
    t2vConfigHint: () => 'The video service is unreachable right now. Please try again shortly.',
    generateFromText,

    isI2VConfigured: () => true,
    i2vConfigHint: () => 'The image-to-video service is unreachable right now. Please try again shortly.',
    generateFromImage,

    // Not offered by this provider — report cleanly instead of faking it.
    isAvatarConfigured: () => false,
    avatarConfigHint: () => 'Talking-avatar (lip-sync) is not available on the current video provider.',
    generateAvatar: async () => { throw new Error('Talking-avatar is not available on the current video provider.'); },
};
