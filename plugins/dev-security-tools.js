// ═══════════════════════════════════════════════════════════════════════════
// 🧑‍💻 DEV & SECURITY UTILITIES — MONA LISA — FIXED
// Pure local, no external calls
// ═══════════════════════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const crypto = require('crypto');
const { success, error } = require('../lib/responses');

const MAX = 3500;
const cut = (t) => t.length > MAX? t.slice(0,MAX) + `\n...(${t.length-MAX} chars more)` : t;

// ── Base64 ──
cmd({ pattern: "base64", desc: "Base64 encode/decode", category: "hacking tools", react: "🔤", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("🔤 *Usage:*.base64 encode|<text> or.base64 decode|<text>");
        const [mode,...rest] = q.split('|');
        const text = rest.join('|').trim();
        if(!text) return reply(error('Provide text'));
        try {
            const result = mode.trim().toLowerCase() === 'decode'
               ? Buffer.from(text, 'base64').toString('utf8')
                : Buffer.from(text, 'utf8').toString('base64');
            reply(success(cut(result)));
        } catch { reply(error('Invalid Base64 input.')); }
    });

// ── URL ──
cmd({ pattern: "urlencode", desc: "URL-encode", category: "hacking tools", react: "🔗", filename: __filename },
    async (conn, mek, m, { reply, q }) => q? reply(success(cut(encodeURIComponent(q)))) : reply("🔗 Usage:.urlencode <text>"));

cmd({ pattern: "urldecode", desc: "URL-decode", category: "tools", react: "🔗", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q) return reply("🔗 Usage:.urldecode <text>");
        try { reply(success(cut(decodeURIComponent(q)))); } catch { reply(error('Invalid URL-encoded text.')); }
    });

// ── Hash ──
cmd({ pattern: "hash", desc: "Hash text", category: "hacking tools", react: "#️⃣", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("#️⃣ Usage:.hash <md5|sha1|sha256|sha512>|<text>");
        const [algo,...rest] = q.split('|');
        const text = rest.join('|');
        const a = algo.trim().toLowerCase();
        if (!['md5', 'sha1', 'sha256', 'sha512'].includes(a)) return reply(error('Supported: md5, sha1, sha256, sha512'));
        reply(success(crypto.createHash(a).update(text).digest('hex')));
    });

// ── JWT decode ──
cmd({ pattern: "jwtdecode", desc: "Decode JWT header/payload", category: "hacking tools", react: "🔑", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q) return reply("🔑 Usage:.jwtdecode <token>");
        const parts = q.trim().split('.');
        if (parts.length < 2) return reply(error('Invalid JWT format'));
        try {
            const decode = (p) => JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'));
            const header = decode(parts[0]);
            const payload = decode(parts[1]);
            reply(success(`*Header:*\n\`\`\`${cut(JSON.stringify(header,null,2))}\`\`\`\n\n*Payload:*\n\`\`\`${cut(JSON.stringify(payload,null,2))}\`\`\`\n\n_read-only, sig not verified_`));
        } catch { reply(error('Could not decode token.')); }
    });

// ── Timestamp ──
cmd({ pattern: "timestamp", desc: "Unix timestamp", category: "hacking tools", react: "🕰️", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q) return reply(success(`Current: ${Math.floor(Date.now()/1000)} (${new Date().toUTCString()})`));
        const ts = parseInt(q.trim(),10);
        if (isNaN(ts)) return reply(error('Provide valid seconds'));
        const ms = q.trim().length > 10? ts : ts*1000;
        reply(success(new Date(ms).toUTCString() + ` | ${ms}`));
    });

// ── JSON ──
cmd({ pattern: "json", desc: "Validate & pretty JSON", category: "hacking tools", react: "🧾", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q) return reply("🧾 Usage:.json <json>");
        try { reply(success(`\`\`\`${cut(JSON.stringify(JSON.parse(q),null,2))}\`\`\``)); }
        catch(e){ reply(error(`Invalid JSON: ${e.message}`)); }
    });

// ── Regex ──
cmd({ pattern: "regex", desc: "Test regex", category: "hacking tools", react: "🔍", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("🔍 Usage:.regex <pattern>|<text>");
        const [pattern,...rest] = q.split('|');
        const text = rest.join('|');
        if(pattern.length > 200) return reply(error('Pattern too long'));
        try {
            const re = new RegExp(pattern.trim(), 'g');
            const start = Date.now();
            const matches = [...text.matchAll(re)].slice(0,50).map(x=>x[0]);
            if(Date.now()-start > 2000) return reply(error('Regex too slow, aborted'));
            reply(success(matches.length? `✅ ${matches.length} match(es):\n${cut(matches.join(', '))}` : '❌ No matches.'));
        } catch(e){ reply(error(`Invalid regex: ${e.message}`)); }
    });

// ── Ciphers ──
function caesar(text, shift) {
    return text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z'? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0)-base+shift)%26+26)%26+base);
    });
}
cmd({ pattern: "caesar", desc: "Caesar cipher", category: "hacking tools", react: "🔐", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("🔐 Usage:.caesar <shift>|<text>");
        const [s,...rest] = q.split('|');
        const shift = parseInt(s.trim(),10);
        if (isNaN(shift)) return reply(error('Shift must be number'));
        reply(success(cut(caesar(rest.join('|'), shift))));
    });

cmd({ pattern: "rot13", desc: "ROT13", category: "hacking tools", react: "🔐", filename: __filename },
    async (conn, mek, m, { reply, q }) => q? reply(success(cut(caesar(q,13)))) : reply("🔐 Usage:.rot13 <text>"));

cmd({ pattern: "xor", desc: "XOR cipher", category: "tools", react: "🔐", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("🔐 Usage:.xor encode <key>|<text> or.xor decode <key>|<hex>");
        const firstSep = q.indexOf('|');
        if(firstSep === -1) return reply(error('Use | separator'));
        const left = q.slice(0,firstSep).trim();
        const right = q.slice(firstSep+1);
        const [mode, key] = left.split(/\s+/);
        const mLow = (mode||'encode').toLowerCase();
        const k = key || mode;
        const actualMode = key? mLow : 'encode';
        const actualKey = key? key : mode;
        if(!actualKey ||!right) return reply(error('Usage:.xor <key>|<text> or.xor decode <key>|<hex>'));

        try{
            if(actualMode === 'decode'){
                const bytes = Buffer.from(right.trim(), 'hex');
                const out = [...bytes].map((b,i)=> String.fromCharCode(b ^ actualKey.charCodeAt(i % actualKey.length))).join('');
                reply(success(cut(out)));
            } else {
                const out = [...right].map((c,i)=> (c.charCodeAt(0) ^ actualKey.charCodeAt(i % actualKey.length)).toString(16).padStart(2,'0')).join('');
                reply(success(cut(`Hex: ${out}`)));
            }
        }catch(e){ reply(error('Invalid hex or key')); }
    });

cmd({ pattern: "hex", desc: "Hex encode/decode", category: "hacking tools", react: "🔢", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("🔢 Usage:.hex encode|<text> or.hex decode|<hex>");
        const [mode,...rest] = q.split('|');
        const text = rest.join('|').trim();
        try {
            const result = mode.trim().toLowerCase() === 'decode'? Buffer.from(text,'hex').toString('utf8') : Buffer.from(text,'utf8').toString('hex');
            reply(success(cut(result)));
        } catch { reply(error('Invalid hex')); }
    });

cmd({ pattern: "binary", desc: "Binary encode/decode", category: "hacking tools", react: "🔢", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        if (!q ||!q.includes('|')) return reply("🔢 Usage:.binary encode|<text> or.binary decode|<binary>");
        const [mode,...rest] = q.split('|');
        const text = rest.join('|').trim();
        try {
            if (mode.trim().toLowerCase() === 'decode') {
                const result = text.split(/[\s,]+/).filter(Boolean).map(b=> String.fromCharCode(parseInt(b,2))).join('');
                reply(success(cut(result)));
            } else {
                const result = [...text].map(c=> c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
                reply(success(cut(result)));
            }
        } catch { reply(error('Invalid binary')); }
    });
