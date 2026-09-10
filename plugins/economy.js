// ═══════════════════════════════════════════════════════════
// 💰 MONA LISA ECONOMY V2 - FULL REALISTIC PACK
// Powered by Progress Tech - Bamenda
// ═══════════════════════════════════════════════════════════
const { cmd } = require('../redx');
const mongoose = require('mongoose');

let success, error, pick;
try { const r=require('../lib/responses'); success=r.success; error=r.error; pick=r.pick; }
catch { success=t=>t; error=t=>t; pick=a=>a[Math.floor(Math.random()*a.length)]; }

const economySchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  wallet: { type: Number, default: 500 },
  bank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  inventory: { type: Map, of: Number, default: {} },
  lastDaily: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastBeg: { type: Date, default: null },
  lastFish: { type: Date, default: null },
  lastMine: { type: Date, default: null },
  lastRob: { type: Date, default: null },
}, { timestamps: true });

const Economy = mongoose.models.Economy || mongoose.model('Economy', economySchema);

const SHOP = {
  'fishing rod': { price: 800, emoji: '🎣', desc: '+65% fish profit' },
  'pickaxe': { price: 800, emoji: '⛏️', desc: '+65% mine profit' },
  'shield': { price: 1200, emoji: '🛡️', desc: 'Blocks 1 robbery' },
  'laptop': { price: 2500, emoji: '💻', desc: '+100% work salary' },
  'bank card': { price: 5000, emoji: '💳', desc: '5% bank interest daily' },
};

const FISH = [{n:'Old Boot',v:10,e:'🥾'},{n:'Tilapia',v:40,e:'🐟'},{n:'Salmon',v:90,e:'🐠'},{n:'Golden Fish',v:250,e:'🐡',rare:true},{n:'Shark',v:600,e:'🦈',rare:true}];
const MINE = [{n:'Gravel',v:10,e:'🪨'},{n:'Coal',v:35,e:'🪹'},{n:'Iron Ore',v:70,e:'🔩'},{n:'Gold Ore',v:150,e:'🥇'},{n:'Diamond',v:500,e:'💎',rare:true}];

function cd(last,ms){ if(!last) return 0; return Math.max(0,ms-(Date.now()-new Date(last).getTime())); }
function fmt(ms){ const s=Math.ceil(ms/1000); const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; if(h) return `${h}h ${m}m`; if(m) return `${m}m ${sec}s`; return `${sec}s`; }
function bar(p){ const f=Math.round(p/10); return '█'.repeat(f)+'░'.repeat(10-f)+` ${p}%`; }
async function getAcc(jid){ if(mongoose.connection.readyState!==1) throw new Error("MongoDB not connected!"); return await Economy.findOne({jid}); }

// REGISTER
cmd({ pattern: "register", desc: "Create account", category: "economy", react: "💳", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const ex=await getAcc(m.sender); if(ex) return reply(`💳 Already registered!\nWallet: ${ex.wallet}`); await Economy.create({jid:m.sender}); return reply(`╭─ *💳 MONA LISA BANK* ─\n│ ✅ Account Opened!\n│ 👤 @${m.sender.split('@')[0]}\n│ 💰 Bonus: 500 coins\n│ 💡 Use.daily to start streak\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// BALANCE
cmd({ pattern: "balance", alias: ["bal"], desc: "Balance", category: "economy", react: "💰", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register first`); const total=acc.wallet+acc.bank; const need=acc.level*1000; const pct=Math.min(100,Math.floor(acc.xp/need*100)); const inv=[...acc.inventory.entries()].filter(([,v])=>v>0).map(([k,v])=>`│ • ${k} x${v}`).join('\n')||'│ • Empty'; return reply(`╭── *💰 WALLET* ──\n│ 👤 @${m.sender.split('@')[0]} | Lv${acc.level} | ${bar(pct)}\n│ XP ${acc.xp}/${need} | Streak ${acc.streak}🔥\n│ ━━━━━━━\n│ 👛 Wallet: ${acc.wallet.toLocaleString()}\n│ 🏦 Bank: ${acc.bank.toLocaleString()}\n│ 💎 Net: ${total.toLocaleString()}\n│ ━━━━━━━\n│ 🎒 INV:\n${inv}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// DAILY
cmd({ pattern: "daily", desc: "Daily", category: "economy", react: "🎁", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const left=cd(acc.lastDaily,24*60*60*1000); if(left>0) return reply(`⏳ Daily cooldown: ${fmt(left)}\nStreak: ${acc.streak}🔥`); const cont=acc.lastDaily && (Date.now()-new Date(acc.lastDaily).getTime()<48*60*60*1000); acc.streak=cont?acc.streak+1:1; let base=200+Math.floor(Math.random()*300); let bonus=acc.streak>=7?500:acc.streak>=3?150:0; let intr=Math.floor(acc.bank*(acc.inventory.get('bank card')>0?0.05:0.02)); let tot=base+bonus; acc.wallet+=tot; if(intr>0) acc.bank+=intr; acc.xp+=50; if(acc.xp>=acc.level*1000){acc.level++;acc.xp=0;} acc.lastDaily=new Date(); await acc.save(); return reply(`╭── *🎁 DAILY* ──\n│ 📅 Day ${acc.streak} ${acc.streak>=7?'🔥🔥🔥':''}\n│ 💵 Base +${base}\n${bonus?`│ 🎉 Bonus +${bonus}\n`:''}${intr?`│ 🏦 Interest +${intr} to bank\n`:''}│ ━━━\n│ 💰 +${tot} coins\n│ 👛 ${acc.wallet} | 🏦 ${acc.bank}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// WORK
cmd({ pattern: "work", desc: "Work", category: "economy", react: "🛠️", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const left=cd(acc.lastWork,30*60*1000); if(left>0) return reply(`😴 Tired! Wait ${fmt(left)}`); const JOBS=[{n:"Uber Driver",p:[80,180],e:"🚕"},{n:"Chef K.man",p:[100,220],e:"🍳"},{n:"Coder",p:[150,350],e:"💻",need:'laptop'},{n:"Crypto Trader",p:[200,500],e:"📈",need:'laptop'}]; let job=pick(JOBS); if(job.need && (acc.inventory.get(job.need)||0)<=0) job=JOBS[0]; let pay=job.p[0]+Math.floor(Math.random()*(job.p[1]-job.p[0])); if(acc.inventory.get('laptop')>0) pay=Math.round(pay*2); acc.wallet+=pay; acc.xp+=30; acc.lastWork=new Date(); await acc.save(); return reply(`╭── *🛠️ WORK* ──\n│ ${job.e} ${job.n}\n│ 💵 Payslip +${pay} coins${acc.inventory.get('laptop')>0?' (laptop x2)':''}\n│ 📊 XP +30\n│ 👛 ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// FISH
cmd({ pattern: "fish", desc: "Fish", category: "economy", react: "🎣", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const left=cd(acc.lastFish,15*60*1000); if(left>0) return reply(`🎣 Line still out! Wait ${fmt(left)}`); const c=pick(FISH); const has=acc.inventory.get('fishing rod')>0; const val=has?Math.round(c.v*1.65):c.v; acc.wallet+=val; acc.xp+=20; acc.lastFish=new Date(); await acc.save(); return reply(`╭── *🎣 FISHING* ──\n│ ${c.e} Caught: *${c.n}* ${c.rare?'✨RARE✨':''}\n│ 💰 Sold for +${val} coins${has?' (rod +65%)':''}\n│ 👛 ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// MINE
cmd({ pattern: "mine", desc: "Mine", category: "economy", react: "⛏️", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const left=cd(acc.lastMine,15*60*1000); if(left>0) return reply(`⛏️ Pickaxe resting! Wait ${fmt(left)}`); const c=pick(MINE); const has=acc.inventory.get('pickaxe')>0; const val=has?Math.round(c.v*1.65):c.v; acc.wallet+=val; acc.xp+=20; acc.lastMine=new Date(); await acc.save(); return reply(`╭── *⛏️ MINING* ──\n│ ${c.e} Found: *${c.n}* ${c.rare?'💎RARE💎':''}\n│ 💰 Sold for +${val} coins${has?' (pickaxe +65%)':''}\n│ 👛 ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// BEG
cmd({ pattern: "beg", desc: "Beg", category: "economy", react: "🙏", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const left=cd(acc.lastBeg,5*60*1000); if(left>0) return reply(`🙏 Rest! Wait ${fmt(left)}`); acc.lastBeg=new Date(); if(Math.random()<0.35){await acc.save(); return reply(`╭── *🙏 BEG* ──\n│ 😔 Nobody gave you anything\n│ Try again in 5m\n╰──────────────`);} const amt=10+Math.floor(Math.random()*60); acc.wallet+=amt; await acc.save(); return reply(`╭── *🙏 BEG* ──\n│ 🥺 Stranger gave +${amt} coins\n│ 👛 ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// DEPOSIT
cmd({ pattern: "deposit", desc: "Deposit", category: "economy", react: "🏦", filename: __filename },
async (conn,mek,m,{reply,q})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const amt=q?.toLowerCase()==='all'?acc.wallet:parseInt(q); if(!amt||amt<=0) return reply(`❌ Usage:.deposit <amount|all>`); if(amt>acc.wallet) return reply(`❌ You have only ${acc.wallet}`); acc.wallet-=amt; acc.bank+=amt; await acc.save(); return reply(`╭── *🏦 DEPOSIT SLIP* ──\n│ 💳 Amount: ${amt} coins\n│ 👛 Wallet: ${acc.wallet}\n│ 🏦 Bank: ${acc.bank}\n│ 🔒 Safe from robbery\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// WITHDRAW
cmd({ pattern: "withdraw", desc: "Withdraw", category: "economy", react: "🏧", filename: __filename },
async (conn,mek,m,{reply,q})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const amt=q?.toLowerCase()==='all'?acc.bank:parseInt(q); if(!amt||amt<=0) return reply(`❌ Usage:.withdraw <amount|all>`); if(amt>acc.bank) return reply(`❌ Bank has only ${acc.bank}`); acc.bank-=amt; acc.wallet+=amt; await acc.save(); return reply(`╭── *🏧 WITHDRAWAL* ──\n│ 💵 Amount: ${amt}\n│ 👛 Wallet: ${acc.wallet}\n│ 🏦 Bank: ${acc.bank}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// ROB
cmd({ pattern: "rob", desc: "Rob", category: "economy", react: "🥷", filename: __filename },
async (conn,mek,m,{reply,mentionedJid,quoted})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const left=cd(acc.lastRob,60*60*1000); if(left>0) return reply(`🚨 Police watching! Wait ${fmt(left)}`); const targetJid=quoted?.sender||mentionedJid?.[0]; if(!targetJid) return reply(`❌ Mention or reply to someone to rob`); if(targetJid===m.sender) return reply(`❌ Can't rob yourself`); const target=await Economy.findOne({jid:targetJid}); if(!target) return reply(`❌ Target has no account`); if(target.wallet<100) return reply(`❌ They are broke (<100)`); acc.lastRob=new Date(); const success_=Math.random()<0.35; if(success_){ const stolen=Math.round(target.wallet*(0.15+Math.random()*0.15)); if((target.inventory.get('shield')||0)>0){ target.inventory.set('shield',target.inventory.get('shield')-1); await target.save(); acc.wallet+=Math.round(stolen*0.5); await acc.save(); return reply(`╭── *🥷 ROB* ──\n│ 🛡️ Target had shield! Reduced loot\n│ 💰 Stole ${Math.round(stolen*0.5)} coins from @${targetJid.split('@')[0]}\n╰──────────────`);} target.wallet-=stolen; acc.wallet+=stolen; await target.save(); await acc.save(); return reply(`╭── *🥷 ROB SUCCESS* ──\n│ 💰 Stole ${stolen} coins from @${targetJid.split('@')[0]}\n│ 👛 Your wallet: ${acc.wallet}\n╰──────────────`);} let penalty=Math.round(acc.wallet*0.15); acc.wallet=Math.max(0,acc.wallet-penalty); await acc.save(); return reply(`╭── *🚨 ROB FAILED* ──\n│ 👮 Caught! Fine -${penalty} coins\n│ 👛 Wallet: ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// SHOP
cmd({ pattern: "shop", alias: ["buy"], desc: "Shop", category: "economy", react: "🛒", filename: __filename },
async (conn,mek,m,{reply,q})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); if(!q){ let list=`╭── *🛒 MONA MARKET* ──\n│\n`; Object.entries(SHOP).forEach(([n,i])=>{list+=`│ ${i.emoji} *${n.toUpperCase()}* - ${i.price}\n│ ${i.desc}\n│\n`;}); list+=`│ Buy:.buy fishing rod\n╰──────────────`; return reply(list);} const name=q.toLowerCase().trim(); const item=SHOP[name]; if(!item) return reply(`❌ No item "${name}"`); if(acc.wallet<item.price) return reply(`❌ Need ${item.price}, you have ${acc.wallet}`); acc.wallet-=item.price; acc.inventory.set(name,(acc.inventory.get(name)||0)+1); await acc.save(); return reply(`╭── *🧾 RECEIPT* ──\n│ ✅ ${item.emoji} ${name}\n│ 💳 -${item.price}\n│ 👛 ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// SLOTS
cmd({ pattern: "slots", alias: ["gamble"], desc: "Slots", category: "economy", react: "🎰", filename: __filename },
async (conn,mek,m,{reply,q})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const bet=parseInt(q); if(!bet||bet<=0) return reply(`❌ Usage:.slots 100`); if(bet>acc.wallet) return reply(`❌ Wallet ${acc.wallet}`); const sym=['🍒','🍋','🔔','⭐','💎']; const spin=()=>sym[Math.floor(Math.random()*sym.length)]; const r=[spin(),spin(),spin()]; let win=0; if(r[0]===r[1]&&r[1]===r[2]) win=bet*(r[0]==='💎'?10:5); else if(r[0]===r[1]||r[1]===r[2]||r[0]===r[2]) win=Math.round(bet*1.5); acc.wallet+=(win-bet); await acc.save(); if(win>0) return reply(`╭── *🎰 SLOTS WIN!* ──\n│ [ ${r.join(' | ')} ]\n│ 💰 Won ${win} coins!\n│ 👛 ${acc.wallet}\n╰──────────────`); else return reply(`╭── *🎰 SLOTS LOST* ──\n│ [ ${r.join(' | ')} ]\n│ 💸 Lost ${bet}\n│ 👛 ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });

// LEADERBOARD
cmd({ pattern: "leaderboard", alias: ["lb","top"], desc: "Top", category: "economy", react: "🏆", filename: __filename },
async (conn,mek,m,{reply})=>{ try{ const top=await Economy.find().sort({wallet:-1}).limit(10); let msg=`╭── *🏆 TOP RICHEST* ──\n│\n`; top.forEach((u,i)=>{ const med=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`; msg+=`│ ${med} @${u.jid.split('@')[0]} - ${(u.wallet+u.bank).toLocaleString()} Lv${u.level}\n`;}); msg+=`│\n╰──────────────`; return reply(msg);}catch(e){return reply(`❌ ${e.message}`);} });

// TRANSFER
cmd({ pattern: "transfer", alias: ["pay"], desc: "Pay", category: "economy", react: "💸", filename: __filename },
async (conn,mek,m,{reply,q,mentionedJid,quoted})=>{ try{ const acc=await getAcc(m.sender); if(!acc) return reply(`❌.register`); const targetJid=quoted?.sender||mentionedJid?.[0]; const amt=parseInt(q?.replace(/@\S+/g,'').trim()); if(!targetJid||!amt) return reply(`❌ Usage:.pay @user 100`); if(targetJid===m.sender) return reply(`❌ Can't pay self`); if(amt>acc.wallet) return reply(`❌ Wallet ${acc.wallet}`); const target=await Economy.findOne({jid:targetJid}); if(!target) return reply(`❌ Target no account`); acc.wallet-=amt; target.wallet+=amt; await acc.save(); await target.save(); return reply(`╭── *💸 TRANSFER* ──\n│ 👤 From: @${m.sender.split('@')[0]}\n│ 👤 To: @${targetJid.split('@')[0]}\n│ 💵 Amount: ${amt} coins\n│ 👛 Bal: ${acc.wallet}\n╰──────────────`);}catch(e){return reply(`❌ ${e.message}`);} });
