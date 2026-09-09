// ═══════════════════════════════════════════════════════════════════════════
//   🎬 VIDEO PROVIDER ADAPTER — MONA LISA
//
//   Three distinct capabilities, all via Replicate's prediction API,
//   each pointing at its own model since a text-only model and an
//   image+text model are genuinely different endpoints on Replicate
//   (not one model that just ignores "image" when it's absent):
//
//   1. Text-to-video — scene generation from a description alone.
//      REPLICATE_T2V_MODEL. Recommended default: wan-video/wan-2.2-t2v-fast
//      — field name confirmed as { prompt } via Replicate's own blog post
//      announcing the model (replicate.com/blog/wan-22).
//
//   2. Image-to-video — animates a photo, guided by a description.
//      REPLICATE_I2V_MODEL. Recommended default: wan-video/wan-2.2-i2v-fast
//      — fields confirmed as { image, prompt } from the same blog post.
//
//   Neither of the above reliably produces accurate spoken dialogue — the
//   mouth may move, but it won't match specific scripted words. For that,
//   see generateAvatar() below.
//
//   3. Talking-avatar / lip-sync — a portrait image + an exact script,
//      returns the person actually saying those words. Different model
//      family, different inputs. REPLICATE_AVATAR_MODEL — verified against
//      prunaai/p-video-avatar's documented contract (image/voice_script/
//      voice_prompt/video_prompt are its real field names, confirmed from
//      its own README on Replicate).
//
//   Required env vars:
//     REPLICATE_API_TOKEN — from https://replicate.com/account/api-tokens
//     REPLICATE_T2V_MODEL, REPLICATE_I2V_MODEL, REPLICATE_AVATAR_MODEL —
//       each accepts either "owner/model" (latest version, resolved
//       automatically) or "owner/model:version" (pinned).
//
//   If you swap in a different model for any of these three, check that
//   model's own Replicate page/README for its actual field names first —
//   they vary a lot between models and guessing wrong fails silently
//   with an unhelpful error rather than working.
// ═══════════════════════════════════════════════════════════════════════════

const axios = require('axios');

function isT2VConfigured() {
    return Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_T2V_MODEL);
}

function isI2VConfigured() {
    return Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_I2V_MODEL);
}

function isAvatarConfigured() {
    return Boolean(process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_AVATAR_MODEL);
}

function t2vConfigHint() {
    return [
        'The text-to-video provider isn\'t configured yet.',
        'Ask the bot administrator to set these in .env:',
        '  REPLICATE_API_TOKEN — from https://replicate.com/account/api-tokens',
        '  REPLICATE_T2V_MODEL — e.g. "wan-video/wan-2.2-t2v-fast"',
    ].join('\n');
}

function i2vConfigHint() {
    return [
        'The image-to-video provider isn\'t configured yet.',
        'Ask the bot administrator to set these in .env:',
        '  REPLICATE_API_TOKEN — from https://replicate.com/account/api-tokens',
        '  REPLICATE_I2V_MODEL — e.g. "wan-video/wan-2.2-i2v-fast"',
    ].join('\n');
}

function avatarConfigHint() {
    return [
        'The Talking Avatar provider isn\'t configured yet.',
        'Ask the bot administrator to set these in .env:',
        '  REPLICATE_API_TOKEN    — from https://replicate.com/account/api-tokens',
        '  REPLICATE_AVATAR_MODEL — e.g. "prunaai/p-video-avatar" (no version needed)',
    ].join('\n');
}

// Accepts either "owner/model" (uses the latest version automatically,
// via Replicate's /v1/models/{owner}/{model}/predictions route — this is
// what the official SDK's replicate.run("owner/model", ...) does under
// the hood) or "owner/model:version" (pins an exact version, via the
// classic /v1/predictions route). Most official models work fine with
// just "owner/model" — no need to hunt down a version hash unless you
// specifically want to pin one.
async function runReplicate(modelRef, input, timeoutMs = 5 * 60 * 1000) {
    const headers = {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
    };

    const pinned = modelRef.includes(':');
    const url = pinned
        ? 'https://api.replicate.com/v1/predictions'
        : `https://api.replicate.com/v1/models/${modelRef}/predictions`;
    const body = pinned
        ? { version: modelRef.split(':')[1], input }
        : { input };

    const create = await axios.post(url, body, { headers, timeout: 30000 });

    let prediction = create.data;
    const started = Date.now();

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
        if (Date.now() - started > timeoutMs) throw new Error('Generation timed out.');
        await new Promise(r => setTimeout(r, 3000));
        const poll = await axios.get(prediction.urls.get, { headers, timeout: 15000 });
        prediction = poll.data;
    }

    if (prediction.status !== 'succeeded') {
        throw new Error(`Generation failed: ${prediction.error || 'unknown error'}`);
    }

    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!output) throw new Error('The provider returned no output.');
    return output;
}

/**
 * Text-to-video: a scene generated purely from a description.
 * @param {string} prompt
 * @returns {Promise<string>} URL of the resulting video
 */
async function generateFromText(prompt) {
    if (!isT2VConfigured()) {
        const err = new Error(t2vConfigHint());
        err.notConfigured = true;
        throw err;
    }
    return runReplicate(process.env.REPLICATE_T2V_MODEL, { prompt });
}

/**
 * Image-to-video: animates a source image, guided by a description.
 * @param {string} imageUrl - source image (URL or base64 data URI)
 * @param {string} prompt - describes the motion/action
 * @returns {Promise<string>} URL of the resulting video
 */
async function generateFromImage(imageUrl, prompt) {
    if (!isI2VConfigured()) {
        const err = new Error(i2vConfigHint());
        err.notConfigured = true;
        throw err;
    }
    return runReplicate(process.env.REPLICATE_I2V_MODEL, { image: imageUrl, prompt });
}

/**
 * Talking-avatar generation: a portrait image genuinely speaking your
 * exact words, via prunaai/p-video-avatar's documented contract.
 * @param {string} imageUrl - portrait image (must be a URL Replicate can fetch)
 * @param {string} script - the exact words to speak
 * @param {object} [opts]
 * @param {string} [opts.voicePrompt] - performance direction, e.g. "speak with excitement"
 * @param {string} [opts.videoPrompt] - what's happening in the video, e.g. "gesturing with their hands"
 * @param {string} [opts.resolution] - '720p' (default) or '1080p'
 * @returns {Promise<string>} URL of the resulting MP4
 */
async function generateAvatar(imageUrl, script, opts = {}) {
    if (!isAvatarConfigured()) {
        const err = new Error(avatarConfigHint());
        err.notConfigured = true;
        throw err;
    }
    const input = {
        image: imageUrl,
        voice_script: script,
    };
    if (opts.voicePrompt) input.voice_prompt = opts.voicePrompt;
    if (opts.videoPrompt) input.video_prompt = opts.videoPrompt;
    if (opts.resolution) input.resolution = opts.resolution;

    return runReplicate(process.env.REPLICATE_AVATAR_MODEL, input);
}

module.exports = {
    isT2VConfigured, t2vConfigHint, generateFromText,
    isI2VConfigured, i2vConfigHint, generateFromImage,
    isAvatarConfigured, avatarConfigHint, generateAvatar,
};
