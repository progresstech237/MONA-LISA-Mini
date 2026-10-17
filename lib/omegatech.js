// ═══════════════════════════════════════════════════════════════════════════
//   🌐 OMEGATECH API CLIENT — MONA LISA
//   Powered by Progress Tech · attribution @Omegatech-01
//
//   One small, dependency-light client that wraps every OmegaTech endpoint the
//   bot needs: chat AI, text-to-image, image editing, music generation and
//   temporary file hosting (used to turn a WhatsApp image into a public URL so
//   the edit endpoints can fetch it).
//
//   Every call is defensive: OmegaTech sometimes answers HTTP 200 with
//   { success: false }, sometimes HTTP 500 with a JSON error, and sometimes
//   returns a bare binary body. The helpers below normalise all of that so the
//   plugins stay simple.
// ═══════════════════════════════════════════════════════════════════════════

const axios = require('axios');
const FormData = require('form-data');

const BASE = (process.env.OMEGATECH_API || 'https://api.omegatech.app').replace(/\/+$/, '');
const ATTRIBUTION = '@Omegatech-01';

const client = axios.create({
    baseURL: BASE,
    timeout: Number(process.env.OMEGATECH_TIMEOUT || 120000),
    maxRedirects: 5,
    headers: {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
    },
    // We handle non-2xx bodies ourselves so we can surface the API's own
    // error message instead of a generic axios status text.
    validateStatus: () => true,
});

// ─────────────────────────────────────────────────────────────────────────
//  Small helpers
// ─────────────────────────────────────────────────────────────────────────

function apiError(data) {
    if (!data) return null;
    if (typeof data === 'string') {
        const t = data.trim();
        if (t.startsWith('{') || t.startsWith('[')) {
            try { return apiError(JSON.parse(t)); } catch { /* not json */ }
        }
        return t.length ? t : null;
    }
    return data.error || data.message || data.result?.error || data.data?.error || null;
}

function isFailed(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.success === false || data.status === false) return true;
    if (typeof data.statusCode === 'number' && data.statusCode >= 400) return true;
    if (data.error && !data.data) return true;
    return false;
}

// Try to pull a human readable text answer out of any of the shapes the
// various chat endpoints use.
function extractText(data) {
    if (!data) return '';
    if (typeof data === 'string') return data.trim();
    const candidates = [
        data.reply, data.answer, data.result, data.message, data.text,
        data.response, data.output, data.content, data.choices?.[0]?.message?.content,
        data.data?.reply, data.data?.answer, data.data?.result, data.data?.message,
        data.data?.text, data.data?.response,
    ];
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c.trim();
    }
    // Some endpoints nest the answer a level deeper (e.g. result.data.lyrics)
    const deep = data.data?.result?.data || data.result?.data;
    if (deep && typeof deep === 'object') {
        for (const v of Object.values(deep)) {
            if (typeof v === 'string' && v.trim()) return v.trim();
        }
    }
    return '';
}

// Recursively look for the first http(s) URL whose path ends with one of the
// given extensions. Used to find media URLs without hard-coding each shape.
function findMediaUrl(obj, exts) {
    let found = '';
    const walk = (node) => {
        if (found) return;
        if (typeof node === 'string') {
            const s = node.trim();
            if (/^https?:\/\//i.test(s)) {
                if (!exts || exts.some(e => new RegExp(`\\.${e}(\\?|#|$)`, 'i').test(s))) found = s;
            }
            return;
        }
        if (Array.isArray(node)) { for (const v of node) walk(v); return; }
        if (node && typeof node === 'object') { for (const v of Object.values(node)) walk(v); }
    };
    walk(obj);
    return found;
}

// First string that looks like an image URL (png/jpg/jpeg/webp/gif).
function findImageUrl(obj) {
    return findMediaUrl(obj, ['png', 'jpg', 'jpeg', 'webp', 'gif']);
}

async function get(path, params, config = {}) {
    const res = await client.get(path, { params, ...config });
    return res;
}

// ─────────────────────────────────────────────────────────────────────────
//  Chat
// ─────────────────────────────────────────────────────────────────────────

// Model registry for the generic .omega chat command.
const CHAT_MODELS = {
    standard: { provider: 'deepai', model: 'standard', label: 'Omega Standard' },
    deepseek: { provider: 'deepai', model: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
    gemini: { provider: 'deepai', model: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    gemma: { provider: 'deepai', model: 'gemma-4', label: 'Gemma 4' },
    llama: { provider: 'deepai', model: 'llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    oss: { provider: 'deepai', model: 'gpt-oss-120b', label: 'GPT-OSS 120B' },
    gpt5nano: { provider: 'deepai', model: 'gpt-5-nano', label: 'GPT-5 Nano' },
    'gpt-5': { provider: 'hotbot', model: 'gpt-5', label: 'GPT-5 (Hotbot)' },
    chatgpt: { provider: 'chatgpt', model: '', label: 'ChatGPT v2' },
    claude: { provider: 'claude', model: '', label: 'Claude AI' },
    perplexity: { provider: 'perplexity', model: '', label: 'Perplexity AI' },
};

// Talk to one specific OmegaTech chat provider.
async function chatWith(provider, message, model) {
    let res;
    switch ((provider || 'deepai').toLowerCase()) {
        case 'deepai':
        case 'deep-ai':
            res = await get('/api/ai/Deep-ai', {
                action: 'chat',
                message,
                ...(model ? { model } : {}),
            });
            break;
        case 'hotbot':
            res = await get('/api/ai/hotbot', { action: 'chat', message, model: model || 'gpt-5' });
            break;
        case 'chatgpt':
        case 'chatgpt-v2':
            res = await get('/api/ai/Chatgpt-v2', { action: 'chat', message });
            break;
        case 'claude':
            res = await get('/api/ai/Claude', { text: message });
            break;
        case 'gemini':
            res = await get('/api/ai/Gemini-premuim', { message });
            break;
        case 'perplexity':
            res = await get('/api/ai/perplexity-ai', { prompt: message });
            break;
        case 'gpt4mini':
        case 'gpt-4-mini':
            res = await get('/api/ai/Gpt-4-mini', { message });
            break;
        case 'chatbot':
            res = await get('/api/ai/Chatbot', { action: 'chat', message });
            break;
        case 'unlimited':
            res = await get('/api/ai/Unlimitedai', { action: 'chat', message });
            break;
        default:
            res = await get('/api/ai/Deep-ai', { action: 'chat', message, ...(model ? { model } : {}) });
    }

    const data = res.data;
    if (isFailed(data)) throw new Error(apiError(data) || `Chat request failed (HTTP ${res.status})`);
    const text = extractText(data);
    if (!text) throw new Error(apiError(data) || 'The AI returned an empty response.');
    return { text, raw: data };
}

// Default chat entry point used by the ai-studio plugin.
async function chat(message, model) {
    return (await chatWith('deepai', message, model)).text;
}

// ─────────────────────────────────────────────────────────────────────────
//  Text-to-image
// ─────────────────────────────────────────────────────────────────────────

// ArtGen model registry (subset of the API's enum, most useful first).
const IMAGE_MODELS = {
    flux2: 'flux2_klein_fast',
    flux2pro: 'flux2_klein',
    realistic: 'juggernaut_lighting',
    cinematic: 'dream_shape_lighting',
    anime: 'redcraft_illustrious',
    illustration: 'wai_Illustrious',
    disney: 'disney_cartoon_sdxl',
    chalk: 'guofeng_sdxl',
    zimage: 'redzimage_zimg',
};

const IMAGE_RATIOS = ['1:1', '9:16', '16:9', '3:4', '4:3', '2:3', '3:2'];

// Generate an image and return { url, model, ratio, provider }. Tries the
// higher-quality ArtGen endpoint first, then a couple of other image backends
// so a single provider being down doesn't take the feature with it.
async function generateImage(prompt, { modelId, ratio } = {}) {
    const usedRatio = IMAGE_RATIOS.includes(ratio) ? ratio : '1:1';

    const attempts = [
        async () => {
            const res = await get('/api/ai/Argen', {
                action: 'image', prompt, ratio: usedRatio, ...(modelId ? { modelId } : {}),
            });
            const data = res.data;
            if (isFailed(data)) throw new Error(apiError(data) || `ArtGen failed (HTTP ${res.status})`);
            const url = data?.data?.imageUrl || data?.imageUrl || findImageUrl(data);
            if (!url) throw new Error(apiError(data) || 'ArtGen returned no image');
            return { url, model: data?.data?.modelId || modelId || IMAGE_MODELS.flux2, ratio: usedRatio, provider: 'artgen' };
        },
        async () => {
            const numeric = /^\d+$/.test(String(modelId || '')) ? Number(modelId) : 2; // 2 = Nano Banana Pro
            const res = await get('/api/ai/dream', { modelId: numeric, prompt });
            const data = res.data;
            if (isFailed(data)) throw new Error(apiError(data) || 'DreamFace failed');
            const url = findImageUrl(data);
            if (!url) throw new Error('DreamFace returned no image');
            return { url, model: `dream-${numeric}`, ratio: usedRatio, provider: 'dream' };
        },
        async () => {
            const res = await get('/api/ai/flux-pro2', { prompt, aspect_ratio: usedRatio });
            const data = res.data;
            if (isFailed(data)) throw new Error(apiError(data) || 'Flux Pro 2 failed');
            const url = findImageUrl(data);
            if (!url) throw new Error('Flux Pro 2 returned no image');
            return { url, model: 'flux-pro2', ratio: usedRatio, provider: 'flux-pro2' };
        },
    ];

    let last;
    for (const a of attempts) {
        try { return await a(); } catch (e) { last = e; }
    }
    throw last || new Error('Image generation failed.');
}

function ratioToShape(ratio) {
    switch (ratio) {
        case '16:9': case '4:3': case '3:2': return 'landscape';
        case '9:16': case '3:4': case '2:3': return 'portrait';
        default: return 'square';
    }
}

// Always returns an image Buffer, falling back to the free Pollinations
// endpoint if none of the URL-based generators answer.
async function generateImageBuffer(prompt, opts = {}) {
    try {
        const r = await generateImage(prompt, opts);
        const { buffer } = await download(r.url);
        return { buffer, provider: r.provider, model: r.model, ratio: r.ratio };
    } catch (e) {
        const buffer = await generateImageRaw(prompt, { shape: ratioToShape(opts.ratio) });
        return { buffer, provider: 'pollinations', model: 'sana', ratio: opts.ratio || '1:1' };
    }
}

// Pollinations runner — returns a raw image Buffer (the endpoint streams bytes).
async function generateImageRaw(prompt, { shape = 'square', width, height } = {}) {
    const res = await client.get('/api/ai/polination', {
        params: {
            action: 'generate',
            prompt,
            shape,
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
        },
        responseType: 'arraybuffer',
        timeout: 150000,
    });
    const buf = Buffer.from(res.data || []);
    const ct = String(res.headers['content-type'] || '');
    if (ct.includes('application/json')) {
        let parsed = {};
        try { parsed = JSON.parse(buf.toString('utf8')); } catch { /* ignore */ }
        throw new Error(apiError(parsed) || 'Pollinations image generation failed.');
    }
    if (!buf.length || res.status >= 400) {
        throw new Error(`Pollinations image generation failed (HTTP ${res.status}).`);
    }
    return buf;
}

// ─────────────────────────────────────────────────────────────────────────
//  Image editing (image URL + instruction -> new image URL)
// ─────────────────────────────────────────────────────────────────────────

// Chain of edit backends — the primary works most reliably, the rest are
// best-effort fallbacks in case a provider is temporarily down.
async function editImage(imageUrl, prompt) {
    const attempts = [
        async () => {
            const r = await get('/api/ai/Nanobana-extra', { action: 'edit', image: imageUrl, prompt });
            const d = r.data;
            if (isFailed(d)) throw new Error(apiError(d) || 'Nanobana failed');
            const url = d?.data?.image || findImageUrl(d);
            if (!url) throw new Error('Nanobana returned no image');
            return { url, provider: d?.data?.model || 'nano-banana' };
        },
        async () => {
            const r = await get('/api/ai/nano-banana2', { image: imageUrl, prompt });
            const d = r.data;
            if (isFailed(d)) throw new Error(apiError(d) || 'NanoBanana2 failed');
            const url = d?.data?.image || findImageUrl(d);
            if (!url) throw new Error('NanoBanana2 returned no image');
            return { url, provider: 'nano-banana-2' };
        },
        async () => {
            const r = await get('/api/ai/Qwen-image-edit', { action: 'edit', imageUrl, prompt });
            const d = r.data;
            if (isFailed(d)) throw new Error(apiError(d) || 'Qwen edit failed');
            const url = d?.data?.image || d?.data?.imageUrl || findImageUrl(d);
            if (!url) throw new Error('Qwen returned no image');
            return { url, provider: 'qwen-image-edit' };
        },
        async () => {
            const r = await get('/api/ai/flux-pro', { image: imageUrl, prompt });
            const d = r.data;
            if (isFailed(d)) throw new Error(apiError(d) || 'Flux Pro failed');
            const url = d?.data?.image || d?.image || findImageUrl(d);
            if (!url) throw new Error('Flux Pro returned no image');
            return { url, provider: 'flux-pro' };
        },
        async () => {
            const r = await get('/api/ai/Gpt-image-edit', { imageUrl, prompt });
            const d = r.data;
            if (isFailed(d)) throw new Error(apiError(d) || 'GPT image edit failed');
            const url = d?.data?.image || findImageUrl(d);
            if (!url) throw new Error('GPT edit returned no image');
            return { url, provider: 'gpt-image-edit' };
        },
    ];

    let last;
    for (const attempt of attempts) {
        try { return await attempt(); } catch (e) { last = e; }
    }
    throw last || new Error('Image editing failed.');
}

// ─────────────────────────────────────────────────────────────────────────
//  Image -> prompt (vision)
// ─────────────────────────────────────────────────────────────────────────

async function imageToPrompt(imageUrl) {
    const r = await get('/api/ai/imagetoprompt', { action: 'generate', imageUrl });
    const d = r.data;
    if (isFailed(d)) throw new Error(apiError(d) || 'Image analysis failed');
    const prompt = d?.data?.prompt || d?.prompt || extractText(d);
    if (!prompt) throw new Error('No description returned.');
    return prompt;
}

// ─────────────────────────────────────────────────────────────────────────
//  File hosting — turn a Buffer into a public URL for the edit endpoints
// ─────────────────────────────────────────────────────────────────────────

const UPLOADERS = [
    { path: '/api/tools/Pone-uploader', pick: d => d?.data?.files?.[0]?.url },
    { path: '/api/tools/Kappa-uploader', pick: d => d?.data?.files?.[0]?.url },
    { path: '/api/tools/Top4top-uploader', pick: d => d?.data?.files?.[0]?.url },
    { path: '/api/tools/shz-uploader', pick: d => d?.data?.files?.[0]?.rawUrl || d?.data?.files?.[0]?.url },
];

async function uploadBuffer(buffer, filename = 'mona-lisa.jpg', contentType = 'image/jpeg') {
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Nothing to upload.');

    let last;
    for (const up of UPLOADERS) {
        try {
            const form = new FormData();
            form.append('action', 'upload');
            form.append('file', buffer, { filename, contentType });
            const res = await client.post(up.path, form, {
                headers: { ...form.getHeaders(), 'Expect': '' },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 120000,
            });
            const data = res.data;
            if (isFailed(data)) throw new Error(apiError(data) || 'upload failed');
            const url = up.pick(data);
            if (!url) throw new Error('upload returned no URL');
            return url;
        } catch (e) { last = e; }
    }
    throw last || new Error('All upload providers failed.');
}

// ─────────────────────────────────────────────────────────────────────────
//  Downloading remote media back into a Buffer
// ─────────────────────────────────────────────────────────────────────────

async function download(url, { timeout = 120000 } = {}) {
    const res = await client.get(url, {
        responseType: 'arraybuffer',
        timeout,
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
    });
    if (res.status >= 400 || !res.data) throw new Error(`Download failed (HTTP ${res.status}).`);
    return { buffer: Buffer.from(res.data), contentType: String(res.headers['content-type'] || '') };
}

// ─────────────────────────────────────────────────────────────────────────
//  Music generation
// ─────────────────────────────────────────────────────────────────────────
//
// OmegaTech exposes several music backends and their reliability varies from
// moment to moment, so we keep a small queue of strategies. Any strategy that
// returns an audio URL wins; otherwise we fall back to the lyrics generator so
// the user always gets *something* useful.
//
function extractAudioUrl(data) {
    return findMediaUrl(data, ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac']);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pollTask(buildUrl, { tries = 18, interval = 8000 } = {}) {
    for (let i = 0; i < tries; i++) {
        const { path, params } = buildUrl();
        const res = await get(path, params);
        const data = res.data;
        const url = extractAudioUrl(data);
        if (url) return { url, raw: data };
        const status = String(data?.status || data?.data?.status || '').toLowerCase();
        if (status === 'failed' || status === 'error') {
            throw new Error(apiError(data) || 'Music task failed.');
        }
        if (status === 'completed' || status === 'success' || status === 'succeeded') {
            throw new Error(apiError(data) || 'Task completed but no audio URL was returned.');
        }
        await sleep(interval);
    }
    throw new Error('Music generation timed out.');
}

async function generateMusic(prompt) {
    const strategies = [
        // 1) sonu3 — start task, poll for the finished song.
        async () => {
            const start = await get('/api/ai/sonu3', { action: 'generate', prompt });
            const taskId = start.data?.taskId || start.data?.data?.taskId;
            if (!taskId) throw new Error(apiError(start.data) || 'No taskId from sonu3.');
            return pollTask(() => ({ path: '/api/ai/sonu3', params: { action: 'result', taskId } }), { tries: 18, interval: 8000 })
                .then(r => r.url);
        },
        // 2) Remusic v2 — async start, then status.
        async () => {
            const start = await get('/api/ai/Remusicv2', { action: 'generate_async', prompt });
            const taskId = start.data?.taskId || start.data?.data?.taskId;
            if (!taskId) throw new Error(apiError(start.data) || 'No taskId from Remusicv2.');
            return pollTask(() => ({ path: '/api/ai/Remusicv2', params: { action: 'status', taskId } }), { tries: 15, interval: 9000 })
                .then(r => r.url);
        },
        // 3) aisong — sometimes returns the track synchronously.
        async () => {
            const r = await get('/api/ai/aisong', { prompt, title: 'MONA LISA' });
            const url = extractAudioUrl(r.data);
            if (!url) throw new Error(apiError(r.data) || 'aisong returned no audio.');
            return url;
        },
        // 4) sonu4 — Sunora, may return synchronously.
        async () => {
            const r = await get('/api/ai/sonu4', { action: 'generate', prompt });
            const url = extractAudioUrl(r.data);
            if (!url) throw new Error(apiError(r.data) || 'sonu4 returned no audio.');
            return url;
        },
        // 5) Melody-ai — last synchronous attempt.
        async () => {
            const r = await get('/api/ai/Melody-ai', { action: 'generate', prompt, title: 'MONA LISA' });
            const url = extractAudioUrl(r.data);
            if (!url) throw new Error(apiError(r.data) || 'Melody-ai returned no audio.');
            return url;
        },
    ];

    let last;
    for (const s of strategies) {
        try {
            const url = await s();
            if (url) return { url };
        } catch (e) { last = e; }
    }

    // Everything failed to produce audio — give lyrics so the reply is useful.
    try {
        const lyrics = await generateLyrics(prompt);
        return { url: null, lyrics };
    } catch {
        throw last || new Error('Music generation failed on all providers.');
    }
}

async function generateLyrics(prompt) {
    const r = await get('/api/ai/Sonu-ultra', { action: 'generate', prompt });
    const d = r.data;
    if (isFailed(d)) throw new Error(apiError(d) || 'Lyrics generation failed');
    const lyrics = d?.data?.result?.data?.lyrics || d?.data?.lyrics || findLyrics(d);
    if (!lyrics) throw new Error('No lyrics returned.');
    return lyrics;
}

function findLyrics(obj) {
    let found = '';
    const walk = (node) => {
        if (found) return;
        if (node && typeof node === 'object') {
            for (const [k, v] of Object.entries(node)) {
                if (/lyric/i.test(k) && typeof v === 'string' && v.trim()) { found = v.trim(); return; }
                walk(v);
            }
        }
    };
    walk(obj);
    return found;
}

// ─────────────────────────────────────────────────────────────────────────
//  Text-to-video (used by ai-studio's .genvideo)
// ─────────────────────────────────────────────────────────────────────────

async function generateVideoFromText(prompt, { ratio = '1:1', duration = 5, resolution = '720p' } = {}) {
    const r = await get('/api/ai/Argen', {
        action: 'video',
        prompt,
        videoType: 'text2video',
        videoDuration: duration,
        videoResolution: resolution,
        ratio,
    }, { timeout: 300000 });
    const d = r.data;
    if (isFailed(d)) throw new Error(apiError(d) || `Video generation failed (HTTP ${r.status})`);
    const url = d?.data?.videoUrl || d?.data?.url || findMediaUrl(d, ['mp4', 'webm', 'mov']);
    if (!url) throw new Error(apiError(d) || 'No video URL returned.');
    return url;
}

async function generateVideoFromImage(imageUrl, prompt, { duration = 5, resolution = '720p' } = {}) {
    const r = await get('/api/ai/Argen', {
        action: 'video',
        prompt,
        imageUrl,
        videoType: 'image2video',
        videoDuration: duration,
        videoResolution: resolution,
    }, { timeout: 300000 });
    const d = r.data;
    if (isFailed(d)) throw new Error(apiError(d) || `Image-to-video failed (HTTP ${r.status})`);
    const url = d?.data?.videoUrl || d?.data?.url || findMediaUrl(d, ['mp4', 'webm', 'mov']);
    if (!url) throw new Error(apiError(d) || 'No video URL returned.');
    return url;
}

module.exports = {
    BASE,
    ATTRIBUTION,
    CHAT_MODELS,
    IMAGE_MODELS,
    IMAGE_RATIOS,
    chat,
    chatWith,
    generateImage,
    generateImageBuffer,
    generateImageRaw,
    editImage,
    imageToPrompt,
    uploadBuffer,
    download,
    generateMusic,
    generateLyrics,
    generateVideoFromText,
    generateVideoFromImage,
    // exposed for reuse/testing
    _get: get,
    _internal: { apiError, isFailed, extractText, findMediaUrl, findImageUrl },
};
