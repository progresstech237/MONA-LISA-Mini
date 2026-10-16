const fs = require('fs');
const path = require('path');

// ── Startup diagnostics ──
// Printed before anything that could fail, so if something does fail,
// the logs already show exactly what Railway (or any host) actually has
// on disk — no guessing required.
console.log('🥰 MONA LISA 🤭 — starting up');
console.log('📁 Working directory:', __dirname);
try {
    const files = fs.readdirSync(__dirname);
    console.log('📁 Files present at root:', files.join(', '));
    if (!files.includes('main.js')) {
        console.error('⚠️  main.js is NOT present in this directory.');
        console.error('   This almost always means the deploy is missing files — check that your');
        console.error('   GitHub repo has main.js at the REPOSITORY ROOT (not nested in a subfolder),');
        console.error('   and check Railway → Settings → Root Directory is blank (or points at the');
        console.error('   folder that directly contains main.js).');
    }
} catch (err) {
    console.error('⚠️  Could not list the working directory:', err.message);
}
console.log('📦 Node version:', process.version);

// ── Core dependencies ──
let express, bodyParser, cors;
try {
    express = require('express');
    bodyParser = require('body-parser');
    cors = require('cors');
} catch (err) {
    console.error('❌ A core npm dependency failed to load:', err.message);
    console.error('   This means "npm install" did not fully succeed during the build.');
    console.error('   Check the Railway "Build" tab (not "Deploy") for install errors.');
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ── App router ──
let pairRouter;
try {
    pairRouter = require('./main');
} catch (err) {
    console.error('❌ Could not load ./main.js:', err.message);
    console.error('   See the "Files present at root" line above — if main.js is missing from');
    console.error('   that list, it was not included in this deploy. If it IS in that list but');
    console.error('   this error still happens, the problem is inside main.js itself (a missing');
    console.error('   dependency it requires, or a syntax error) — the message above should name it.');
    process.exit(1);
}
app.use('/', pairRouter);

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

// ── Optional keep-alive ──
// Some free hosts (e.g. Render's free plan) put an instance to sleep after 15
// minutes without inbound web traffic, which would take the WhatsApp
// connection down with it. Setting KEEP_ALIVE=true (on Render, which provides
// RENDER_EXTERNAL_URL automatically) or KEEP_ALIVE_URL=<your public URL> makes
// the bot hit its own /ping route every 10 minutes. This only helps while the
// instance is awake — pair it with a free external monitor (see README) that
// can also wake it up if it ever does go to sleep.
const keepAliveBase = process.env.KEEP_ALIVE_URL
    || (process.env.KEEP_ALIVE === 'true' ? process.env.RENDER_EXTERNAL_URL : '');
if (keepAliveBase) {
    const target = keepAliveBase.replace(/\/$/, '') + '/ping';
    setInterval(() => {
        fetch(target, { signal: AbortSignal.timeout(15000) })
            .then(r => console.log(`💓 keep-alive ping → HTTP ${r.status}`))
            .catch(e => console.log(`💓 keep-alive ping failed: ${e.message}`));
    }, 10 * 60 * 1000);
    console.log(`💓 Keep-alive on: pinging ${target} every 10 minutes`);
} else if (process.env.KEEP_ALIVE === 'true') {
    console.log('⚠️  KEEP_ALIVE=true but no public URL is known here — set KEEP_ALIVE_URL to your service URL.');
}

module.exports = app;
