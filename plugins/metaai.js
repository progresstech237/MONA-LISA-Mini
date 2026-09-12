const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const CACHE_FILE='./data/metabots.json';
if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
let cacheStore={};
try{ if(fs.existsSync(CACHE_FILE)) cacheStore=JSON.parse(fs.readFileSync(CACHE_FILE,'utf8')); }catch{}
function saveCache(){ try{ fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheStore,null,2)); }catch{} }
global.metaBotsCache = global.metaBotsCache || cacheStore;

cmd({
  pattern:"metaai", alias:["metabots","aibots"], react:"🤖",
  desc:"Search Meta AI bots by category", category:"progresstech ai",
  use:".metaai anime |.metaai list",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    if(!q) return reply(`*🤖 META AI BOT FINDER*\n\n*${prefix}metaai <prompt>*\n*${prefix}metaai anime*\n*${prefix}metaai list*`);
    const prompt=q.trim();
    reply(`*🔄 Searching bots for: ${prompt}...*`);
    const { data } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/Meta`, {
      params:{ action:'categories', prompt },
      timeout:30000,
      headers:{'User-Agent':'Mozilla/5.0'}
    });
    if(!data.success ||!data.data?.length) return reply(`*❌ No bots found for: ${prompt}*`);
    const category=data.data[0];
    const bots=category.bots||[];
    let msg=`*🤖 META AI - ${category.cname}*\n━━━━━━━━━━━━━━\n*📦 ID: ${category.id}*\n*Table: ${category.tb_name}*\n*Total: ${bots.length}*\n*Query: ${prompt}*\n━━━━━━━━━━━━━━\n\n`;
    bots.slice(0,5).forEach((bot,i)=>{
      msg+=`*${i+1}. ${bot.bot_name}*\nID: ${bot.bot_id}\nDesc: ${(bot.description||'').slice(0,100)}...\nVIP: ${bot.is_vip?'Yes':'No'} - Voice: ${bot.voice_switch?'Yes':'No'}\nPrompt:\n\`\`\`${(bot.prompt||'').slice(0,600)}...\`\`\`\n\n`;
    });
    msg+=`*Source: ${data.source}*`;
    global.metaBotsCache[m.sender]=bots;
    cacheStore[m.sender]=bots; saveCache();
    reply(msg + `\n\n*💡.metaprompt 0 or.metaprompt <name> for full prompt*`);
  }catch(e){
    console.error('Meta AI Error:', e.message);
    reply(`*❌ Error: ${e.response?.data?.message||e.message}*`);
  }
});

cmd({
  pattern:"metaprompt", alias:["botprompt"], react:"📝",
  desc:"Get full prompt from cache", category:"ai",
  use:".metaprompt <index or name>",
  filename:__filename
}, async (conn, mek, m, { from, q, reply }) => {
  try{
    const cache=global.metaBotsCache?.[m.sender]||cacheStore[m.sender];
    if(!cache) return reply(`*⚠️ No cache. Use.metaai <prompt> first*`);
    if(!q) return reply(`*Usage:.metaprompt 0 or name*\nCache: ${cache.length} bots`);
    let bot=null;
    const idx=parseInt(q);
    if(!isNaN(idx) && idx>=0 && idx<cache.length) bot=cache[idx];
    else bot=cache.find(b=>b.bot_name?.toLowerCase().includes(q.toLowerCase()));
    if(!bot) return reply(`*❌ Bot not found in ${cache.length}*`);
    let msg=`*📝 FULL PROMPT - ${bot.bot_name}*\n━━━━━━━━━━━━━━━\n${bot.prompt||'No prompt'}\n━━━━━━━━━━━━━━━\n*Prologue:* ${bot.prologue||'N/A'}\n*Desc:* ${bot.description||''}`;
    // Split if too long
    if(msg.length>4000){
      await conn.sendMessage(from,{ text: msg.slice(0,4000) },{quoted:mek});
      if(msg.length>4000) await conn.sendMessage(from,{ text: msg.slice(4000,8000) },{quoted:mek});
    }else reply(msg);
  }catch(e){ reply(`*❌ ${e.message}*`); }
});
