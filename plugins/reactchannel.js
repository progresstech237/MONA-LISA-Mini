const { cmd } = require('../redx');
const axios = require('axios');

const BASE = 'https://satriareact.satriadeveloperz.workers.dev';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let lastUsed = 0;

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function getToken(){
    const { data } = await axios.post(`${BASE}/api/handshake`, {}, {
        headers: {
            'User-Agent': UA,
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Origin': 'https://satriareact.satriadeveloperz.workers.dev',
            'Referer': `${BASE}/`,
        },
        timeout: 15000
    });
    // token can be in data.token or data.data.token
    return data?.token || data?.data?.token || data?.data || data;
}

cmd({
  pattern: "wareact",
  alias: ["wreact","channelreact"],
  react: "❤️",
  desc: "Channel reaction - satria API",
  category: "tools",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try{
    if(!q || !q.includes('whatsapp.com/channel/')) 
      return reply('Use: .wareact https://whatsapp.com/channel/xxx/123 😍 ❤️ 🔥');

    const now = Date.now();
    if(now - lastUsed < 30000) return reply(`⏳ Wait ${Math.ceil((30000-(now-lastUsed))/1000)}s`);
    lastUsed = now;

    const args = q.trim().split(/\s+/);
    const url = args[0];
    const emojis = args.slice(1);
    const reactions = emojis.length ? emojis : ['❤️'];

    await conn.sendMessage(from, { text: `🚀 Handshake...\n${url}\nEmojis: ${reactions.join(' ')}` }, { quoted: mek });

    // 1. handshake
    let token;
    try{
        token = await getToken();
        console.log('[WAREACT] token:', token);
    }catch(e){
        console.log('[WAREACT] handshake fail', e.response?.data || e.message);
        return reply(`❌ Handshake failed: ${e.message}\nAPI may be down`);
    }

    if(!token || typeof token !== 'string'){
        // if token is object, try extract
        if(typeof token === 'object') token = token.token || token.accessToken;
    }

    // 2. react
    try{
        const { data } = await axios.post(`${BASE}/api/react`, {
            url,
            reactions,
            token
        }, {
            headers: {
                'User-Agent': UA,
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Origin': BASE,
                'Referer': `${BASE}/`,
            },
            timeout: 20000
        });
        console.log('[WAREACT] react:', data);
        if(data?.success || data?.status === 'ok' || data?.queued){
            return reply(`✅ Queued! ${reactions.join(' ')} → ${url}\n${JSON.stringify(data).slice(0,400)}`);
        } else {
            return reply(`⚠️ API response:\n${JSON.stringify(data).slice(0,600)}`);
        }
    }catch(e){
        console.log('[WAREACT] react fail', e.response?.data || e.message);
        return reply(`❌ React failed: ${JSON.stringify(e.response?.data||e.message).slice(0,500)}`);
    }

  }catch(e){
    reply('Error: '+e.message);
  }
});
