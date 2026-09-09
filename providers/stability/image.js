// ═══════════════════════════════════════════════════════════════════════════
//   STABILITY AI — IMAGE (generate / upscale / edit / control)
// ═══════════════════════════════════════════════════════════════════════════

const { requireConfigured, postForBinary, postAndPoll } = require('./client');

// ── Generate ──
async function generateUltra(prompt, opts = {}) {
    requireConfigured('Stable Image Ultra');
    return postForBinary('/v2beta/stable-image/generate/ultra', {
        prompt,
        aspect_ratio: opts.aspectRatio || '1:1',
        output_format: opts.outputFormat || 'png',
    });
}

async function generateCore(prompt, opts = {}) {
    requireConfigured('Stable Image Core');
    return postForBinary('/v2beta/stable-image/generate/core', {
        prompt,
        aspect_ratio: opts.aspectRatio || '1:1',
        output_format: opts.outputFormat || 'png',
    });
}

// model: sd3.5-large | sd3.5-large-turbo | sd3.5-medium | sd3.5-flash
async function generateSD35(prompt, model = 'sd3.5-large', opts = {}) {
    requireConfigured('Stable Diffusion 3.5');
    return postForBinary('/v2beta/stable-image/generate/sd3', {
        prompt,
        model,
        aspect_ratio: opts.aspectRatio || '1:1',
        output_format: opts.outputFormat || 'png',
    });
}

// ── Upscale ──
async function upscaleFast(imageBuffer) {
    requireConfigured('Fast Upscaler');
    return postForBinary('/v2beta/stable-image/upscale/fast', { image: imageBuffer, output_format: 'png' });
}

async function upscaleConservative(imageBuffer, prompt) {
    requireConfigured('Conservative Upscaler');
    return postForBinary('/v2beta/stable-image/upscale/conservative', {
        image: imageBuffer,
        prompt: prompt || 'high quality, detailed',
        output_format: 'png',
    });
}

async function upscaleCreative(imageBuffer, prompt) {
    requireConfigured('Creative Upscaler');
    return postAndPoll(
        '/v2beta/stable-image/upscale/creative',
        '/v2beta/stable-image/upscale/creative/result',
        { image: imageBuffer, prompt: prompt || 'high quality, detailed', output_format: 'png' }
    );
}

// ── Edit ──
async function removeBackground(imageBuffer) {
    requireConfigured('Remove Background');
    return postForBinary('/v2beta/stable-image/edit/remove-background', { image: imageBuffer, output_format: 'png' });
}

// direction: 'left'|'right'|'up'|'down' (pixels), prompt optional
async function outpaint(imageBuffer, directions, prompt) {
    requireConfigured('Outpaint');
    return postForBinary('/v2beta/stable-image/edit/outpaint', {
        image: imageBuffer,
        left: directions.left, right: directions.right, up: directions.up, down: directions.down,
        prompt: prompt || '',
        output_format: 'png',
    });
}

async function searchAndReplace(imageBuffer, searchPrompt, prompt) {
    requireConfigured('Search and Replace');
    return postForBinary('/v2beta/stable-image/edit/search-and-replace', {
        image: imageBuffer, search_prompt: searchPrompt, prompt, output_format: 'png',
    });
}

async function searchAndRecolor(imageBuffer, selectPrompt, prompt) {
    requireConfigured('Search and Recolor');
    return postForBinary('/v2beta/stable-image/edit/search-and-recolor', {
        image: imageBuffer, select_prompt: selectPrompt, prompt, output_format: 'png',
    });
}

async function replaceBackgroundAndRelight(imageBuffer, backgroundPrompt) {
    requireConfigured('Replace Background & Relight');
    return postAndPoll(
        '/v2beta/stable-image/edit/replace-background-and-relight',
        '/v2beta/stable-image/edit/replace-background-and-relight/result',
        { subject_image: imageBuffer, background_prompt: backgroundPrompt, output_format: 'png' }
    );
}

// Note: Erase and Inpaint both require a separate mask image and aren't
// wired to a chat command (a single WhatsApp message can't cleanly carry
// two images) — the functions are here if you build a two-step flow later.
async function erase(imageBuffer, maskBuffer) {
    requireConfigured('Erase Object');
    return postForBinary('/v2beta/stable-image/edit/erase', { image: imageBuffer, mask: maskBuffer, output_format: 'png' });
}

async function inpaint(imageBuffer, maskBuffer, prompt) {
    requireConfigured('Inpaint');
    return postForBinary('/v2beta/stable-image/edit/inpaint', { image: imageBuffer, mask: maskBuffer, prompt, output_format: 'png' });
}

// ── Control ──
async function controlSketch(imageBuffer, prompt) {
    requireConfigured('Control Sketch');
    return postForBinary('/v2beta/stable-image/control/sketch', { image: imageBuffer, prompt, output_format: 'png' });
}

async function controlStructure(imageBuffer, prompt) {
    requireConfigured('Control Structure');
    return postForBinary('/v2beta/stable-image/control/structure', { image: imageBuffer, prompt, output_format: 'png' });
}

async function controlStyle(imageBuffer, prompt) {
    requireConfigured('Control Style (Style Guide)');
    return postForBinary('/v2beta/stable-image/control/style', { image: imageBuffer, prompt, output_format: 'png' });
}

// Needs two images (style ref + target) — same reasoning as erase/inpaint,
// not wired to a chat command yet.
async function styleTransfer(initImageBuffer, styleImageBuffer, prompt) {
    requireConfigured('Style Transfer');
    return postForBinary('/v2beta/stable-image/control/style-transfer', {
        init_image: initImageBuffer, style_image: styleImageBuffer, prompt: prompt || '', output_format: 'png',
    });
}

module.exports = {
    generateUltra, generateCore, generateSD35,
    upscaleFast, upscaleConservative, upscaleCreative,
    removeBackground, outpaint, searchAndReplace, searchAndRecolor, replaceBackgroundAndRelight, erase, inpaint,
    controlSketch, controlStructure, controlStyle, styleTransfer,
};
