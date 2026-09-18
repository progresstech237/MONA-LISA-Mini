const { cmd } = require('../redx');
const axios = require('axios');
const API_URL = 'https://apis.davidcyril.name.ng/tools/wareact';
const ORIGIN = 'https://wa.dclabs.my.id';

const USER_AGENTS = [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36'
];

function randomItem(a){ return a[Math.floor(Math.random()*a.length)]; }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function getHeaders(){
    return {
        'User-Agent': randomItem(USER_AGENTS),
        'Accept': '*/*',
        'Origin': ORIGIN,
        'Referer': ORIGIN+'/',
        'sec-ch-ua': '"Chromium";v="154", "Google Chrome";v="154"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"'
    };
}

async function sendReaction(url, emoji){
    try{
        const { data } = await axios.get(API_URL, { params:{ url, emoji }, headers: getHeaders(), timeout:20000 });
        return data?.success===true || data?.successful>0;
    }catch{ return false; }
}

cmd({
  pattern: "wareact",
  alias: ["wreact","creact"],
  react: "❤️",
  desc: "Boost Channel Reaction",
  category: "tools",
  use: ".wareact link emoji",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    if(!q) return reply(`*Usage:*\n${prefix}wareact https://whatsapp.com/channel/xxx/123 😁\n${prefix}wareact link ❤️ 5`);
    const [url, emoji='😁', c] = q.trim().split(/\s+/);
    const count = parseInt(c)||3;
    if(!url.includes('whatsapp.com/channel/')) return reply('❌ Invalid link');

    await conn.sendMessage(from, { text:`🚀 Sending ${count}x ${emoji} to:\n${url}\nWait...` }, { quoted:mek });
    let ok=0;
    for(let i=0;i<count;i++){ if(await sendReaction(url, emoji)) ok++; await sleep(1500); }
    reply(ok?`✅ Done ${ok}/${count} ${emoji} sent`:`❌ Failed - rate limited, try 1`);
  }catch(e){ reply('Error: '+e.message); }
});
