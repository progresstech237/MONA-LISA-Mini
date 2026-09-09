// ═══════════════════════════════════════════════════════════════════════════
//   STABILITY AI — SHARED v2beta CLIENT
//
//   One place for auth, multipart form encoding, and the async
//   submit-then-poll pattern Stability uses for slower jobs (Creative
//   Upscale, Replace Background & Relight, Stable Audio).
//
//   Endpoints referenced throughout providers/stability/* are taken from
//   Stability's own documentation (platform.stability.ai/docs/api-reference)
//   as of this writing. Stability ships new models fairly often — if a
//   call starts failing, check that page for path/param changes before
//   assuming this code is wrong.
//
//   Required env var: STABILITY_API_KEY (https://platform.stability.ai)
// ═══════════════════════════════════════════════════════════════════════════

const axios = require('axios');
const FormData = require('form-data');

const BASE = 'https://api.stability.ai';

function isConfigured() {
    return Boolean(process.env.STABILITY_API_KEY);
}

function configHint(feature = 'This Stability AI feature') {
    return `${feature} isn't configured yet.\nAsk the bot administrator to set STABILITY_API_KEY in .env — get one at https://platform.stability.ai`;
}

function requireConfigured(feature) {
    if (!isConfigured()) {
        const err = new Error(configHint(feature));
        err.notConfigured = true;
        throw err;
    }
}

/**
 * POST multipart/form-data to a Stability endpoint and get back binary
 * content (image, 3D asset, or audio bytes) directly — used for every
 * synchronous endpoint (generate, most edit/control ops, fast/conservative
 * upscale, 3D).
 *
 * @param {string} path - e.g. '/v2beta/stable-image/generate/core'
 * @param {Record<string, string|Buffer>} fields - form fields; Buffer values become file parts
 * @param {string} accept - e.g. 'image/*', 'audio/*', 'model/gltf-binary'
 */
async function postForBinary(path, fields, accept = 'image/*') {
    const form = new FormData();
    let hasFile = false;
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null) continue;
        if (Buffer.isBuffer(value)) {
            form.append(key, value, { filename: `${key}.bin` });
            hasFile = true;
        } else {
            form.append(key, String(value));
        }
    }
    // Stability's synchronous image endpoints require a multipart body even
    // when there's no file to send — the documented workaround is an empty
    // "none" field.
    if (!hasFile) form.append('none', '');

    try {
        const res = await axios.post(`${BASE}${path}`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                Accept: accept,
            },
            responseType: 'arraybuffer',
            timeout: 90000,
            maxBodyLength: Infinity,
        });
        return Buffer.from(res.data);
    } catch (err) {
        throw normalizeError(err);
    }
}

/**
 * POST multipart/form-data to an async Stability endpoint (Creative
 * Upscale, Replace Background & Relight, Stable Audio) which returns
 * { id } immediately, then poll the matching /result/{id} route until
 * it's ready.
 *
 * @param {string} submitPath
 * @param {string} resultPathPrefix - e.g. '/v2beta/stable-image/upscale/creative/result'
 * @param {Record<string, string|Buffer>} fields
 * @param {string} accept
 */
async function postAndPoll(submitPath, resultPathPrefix, fields, accept = 'image/*') {
    const form = new FormData();
    let hasFile = false;
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null) continue;
        if (Buffer.isBuffer(value)) {
            form.append(key, value, { filename: `${key}.bin` });
            hasFile = true;
        } else {
            form.append(key, String(value));
        }
    }
    if (!hasFile) form.append('none', '');

    let id;
    try {
        const submit = await axios.post(`${BASE}${submitPath}`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                Accept: 'application/json',
            },
            timeout: 30000,
            maxBodyLength: Infinity,
        });
        id = submit.data?.id;
        if (!id) throw new Error('Stability did not return a job id.');
    } catch (err) {
        throw normalizeError(err);
    }

    const started = Date.now();
    const TIMEOUT_MS = 5 * 60 * 1000;

    while (Date.now() - started < TIMEOUT_MS) {
        await new Promise(r => setTimeout(r, 4000));
        try {
            const poll = await axios.get(`${BASE}${resultPathPrefix}/${id}`, {
                headers: {
                    Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                    Accept: accept,
                },
                responseType: 'arraybuffer',
                timeout: 30000,
                validateStatus: s => s === 200 || s === 202,
            });
            if (poll.status === 200) return Buffer.from(poll.data);
            // 202 = still processing, keep polling
        } catch (err) {
            throw normalizeError(err);
        }
    }
    throw new Error('Stability job timed out after 5 minutes.');
}

function normalizeError(err) {
    if (err.response?.data) {
        try {
            const text = Buffer.isBuffer(err.response.data) ? err.response.data.toString('utf8') : err.response.data;
            const parsed = typeof text === 'string' ? JSON.parse(text) : text;
            const msg = parsed?.errors?.join?.(', ') || parsed?.message || JSON.stringify(parsed);
            return new Error(`Stability AI error (${err.response.status}): ${msg}`);
        } catch (_) {
            return new Error(`Stability AI error (${err.response.status})`);
        }
    }
    return err;
}

module.exports = { BASE, isConfigured, configHint, requireConfigured, postForBinary, postAndPoll };
