const { cmd } = require('../redx');
const axios = require('axios');
const crypto = require('crypto');

let math=null; try{ math=require('mathjs'); }catch{}
let success, error;
try{ ({success,error}=require('../lib/responses')); }catch{
  success=(t)=>`✅ ${t}`; error=(t)=>`❌ ${t}`;
}

const get = (url, opts={}) => axios.get(url, { timeout:15000, headers:{'User-Agent':'Mozilla/5.0'}, ...opts }).then(r=>r.data);

cmd({ pattern:"dictionary", alias:["define"], desc:"Define word", category:"hacking tools", react:"📖", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("📖 .dictionary <word>");
  try{
    const data=await get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
    const entry=data[0]; let out=`📖 *${entry.word}*`+(entry.phonetic?` /${entry.phonetic}/`:'');
    for(const mm of entry.meanings.slice(0,3)){ out+=`\n\n*${mm.partOfSpeech}*`; for(const d of mm.definitions.slice(0,2)) out+=`\n• ${d.definition}`; }
    reply(success(out));
  }catch{ reply(error(`No definition for "${q}".`)); }
});

cmd({ pattern:"urban", alias:["slang"], desc:"Urban slang", category:"hacking tools", react:"🗣️", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("🗣️ .urban <term>");
  try{
    const data=await get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(q)}`);
    const top=data.list?.[0]; if(!top) return reply(error(`No results for "${q}".`));
    reply(success(`🗣️ *${top.word}*\n\n${top.definition.replace(/[\[\]]/g,'').slice(0,1000)}\n\n_Ex:_ ${top.example.replace(/[\[\]]/g,'').slice(0,500)}`));
  }catch{ reply(error('Urban lookup failed.')); }
});

cmd({ pattern:"weather", alias:["forecast"], desc:"Weather", category:"tools", react:"🌦️", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("🌦️ .weather <city>");
  try{ const text=await get(`https://wttr.in/${encodeURIComponent(q)}?format=3`); reply(success(`🌦️ ${String(text).trim()}`)); }
  catch{ reply(error(`Couldn't fetch weather for "${q}".`)); }
});

cmd({ pattern:"currency", alias:["convert"], desc:"Convert currency", category:"hacking tools", react:"💱", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("💱 .currency 100 USD EUR");
  const parts=q.trim().split(/\s+/); if(parts.length!==3) return reply(error('Format: .currency <amount> <from> <to>'));
  const [amountRaw,from,to]=parts; const amount=parseFloat(amountRaw); if(isNaN(amount)) return reply(error('Amount must be number.'));
  try{
    const data=await get(`https://api.frankfurter.app/latest?amount=${amount}&from=${from.toUpperCase()}&to=${to.toUpperCase()}`);
    const result=data.rates?.[to.toUpperCase()]; if(result===undefined) return reply(error('Unsupported currency.'));
    reply(success(`💱 ${amount} ${from.toUpperCase()} = *${result.toFixed(2)} ${to.toUpperCase()}*`));
  }catch{ reply(error('Conversion failed — check codes USD,EUR,XAF.')); }
});

cmd({ pattern:"ip", alias:["ipinfo","iplookup"], desc:"IP info", category:"hacking tools", react:"🌐", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("🌐 .ip <ip>");
  try{ const data=await get(`https://ip-api.com/json/${encodeURIComponent(q)}`); if(data.status!=='success') return reply(error(data.message||'Lookup failed.')); reply(success(`🌐 *${data.query}*\n📍 ${data.city}, ${data.regionName}, ${data.country}\n🏢 ISP: ${data.isp}\n🕰️ ${data.timezone}`)); }
  catch{ reply(error('IP lookup failed.')); }
});

cmd({ pattern:"github", alias:["gh"], desc:"GitHub repo/user", category:"hacking tools", react:"🐙", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("🐙 .github <user/repo> or <user>");
  try{
    if(q.includes('/')){ const data=await get(`https://api.github.com/repos/${q}`); reply(success(`🐙 *${data.full_name}*\n${data.description||''}\n\n⭐ ${data.stargazers_count} · 🍴 ${data.forks_count} · 🐛 ${data.open_issues_count}\n📜 ${data.license?.name||'none'}\n🔗 ${data.html_url}`)); }
    else{ const data=await get(`https://api.github.com/users/${q}`); reply(success(`🐙 *${data.login}* ${data.name?`(${data.name})`:''}\n${data.bio||''}\n\n📦 ${data.public_repos} repos · 👥 ${data.followers} followers\n🔗 ${data.html_url}`)); }
  }catch{ reply(error(`Couldn't find "${q}" on GitHub.`)); }
});

cmd({ pattern:"stackoverflow", alias:["error"], desc:"StackOverflow search", category:"hacking tools", react:"💻", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("💻 .stackoverflow <query>");
  try{ const data=await get(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(q)}&site=stackoverflow`); const top=data.items?.slice(0,5); if(!top?.length) return reply(error('No results.')); const list=top.map(i=>`• ${i.title}\n  ${i.link}`).join('\n\n'); reply(success(`💻 *Top results for "${q}"*\n\n${list}`)); }
  catch{ reply(error('StackOverflow search failed.')); }
});

cmd({ pattern:"book", desc:"Search books", category:"tools", react:"📚", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("📚 .book <title>");
  try{ const data=await get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5`); const top=data.docs?.slice(0,5); if(!top?.length) return reply(error('No books.')); const list=top.map(b=>`• *${b.title}* — ${b.author_name?.[0]||'Unknown'} (${b.first_publish_year||'?'})`).join('\n'); reply(success(`📚 *Results for "${q}"*\n\n${list}`)); }
  catch{ reply(error('Book search failed.')); }
});

cmd({ pattern:"country", alias:["flag"], desc:"Country info", category:"hacking tools", react:"🌍", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("🌍 .country <name>");
  try{ const data=await get(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`); const c=data[0]; reply(success(`${c.flag} *${c.name.common}*\n\n🏛️ Capital: ${c.capital?.[0]||'N/A'}\n🌍 Region: ${c.region} (${c.subregion||''})\n👥 Population: ${c.population.toLocaleString()}\n💬 Languages: ${Object.values(c.languages||{}).join(', ')}\n💰 Currency: ${Object.values(c.currencies||{}).map(cu=>cu.name).join(', ')}`)); }
  catch{ reply(error(`Couldn't find "${q}".`)); }
});

cmd({ pattern:"iss", desc:"ISS location", category:"hacking tools", react:"🛰️", filename:__filename },
 async (conn,mek,m,{reply})=>{
  try{ const data=await get('https://api.open-notify.org/iss-now.json'); reply(success(`🛰️ *ISS at:*\nLat: ${data.iss_position.latitude}\nLon: ${data.iss_position.longitude}\n🗺️ https://maps.google.com/?q=${data.iss_position.latitude},${data.iss_position.longitude}`)); }
  catch{ reply(error('Could not fetch ISS.')); }
});

cmd({ pattern:"mathfact", desc:"Math fact", category:"tools", react:"🔢", filename:__filename },
 async (conn,mek,m,{reply})=>{
  try{ const text=await get('http://numbersapi.com/random/math'); reply(success(`🔢 ${String(text).slice(0,1000)}`)); }catch{ reply(error('Could not fetch fact.')); }
});

cmd({ pattern:"sciencefact", desc:"Science fact", category:"fun", react:"🧪", filename:__filename },
 async (conn,mek,m,{reply})=>{
  try{ const data=await get('https://uselessfacts.jsph.pl/api/v2/facts/random'); reply(success(`🧪 ${data.text}`)); }catch{ reply(error('Could not fetch fact.')); }
});

cmd({ pattern:"bible", desc:"Bible verse", category:"tools", react:"📜", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("📜 .bible John 3:16");
  try{ const data=await get(`https://bible-api.com/${encodeURIComponent(q)}`); reply(success(`📜 *${data.reference}*\n\n"${data.text.trim()}"\n_${data.translation_name}_`)); }
  catch{ reply(error(`Couldn't find that reference.`)); }
});

cmd({ pattern:"calc", desc:"Calculate", category:"tools", react:"🧮", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  if(!q) return reply("🧮 .calc (12*8)+sqrt(144)");
  try{
    let result;
    if(math){ result=math.evaluate(q); }
    else{ if(!/^[0-9+\-*/().\s%^]+$/.test(q)) return reply(error('Expression not safe without mathjs. Install mathjs for advanced.')); result=Function('"use strict";return ('+q+')')(); }
    reply(success(`🧮 ${q} = *${result}*`));
  }catch(e){ reply(error(`Couldn't evaluate: ${e.message}`)); }
});

cmd({ pattern:"genpass", desc:"Gen password", category:"hacking tools", react:"🔐", filename:__filename },
 async (conn,mek,m,{reply,q})=>{
  const length=Math.min(Math.max(parseInt(q)||16,8),64);
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  const bytes=crypto.randomBytes(length);
  const pass=Array.from(bytes,b=>chars[b%chars.length]).join('');
  reply(success(`🔐 *Password:*\n\`\`\`${pass}\`\`\`\n_Length: ${length}_`));
});
