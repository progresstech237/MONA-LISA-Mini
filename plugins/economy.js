// ═══════════════════════════════════════════════════════════════════════════
//   💰 ECONOMY — MONA LISA
//   Powered by Progress Tech
//
//   A self-contained virtual-currency game. No real money, no external
//   APIs — just MongoDB persistence and honest, working game logic.
// ═══════════════════════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const mongoose = require('mongoose');
const { success, error, pick } = require('../lib/responses');

const economySchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true, index: true },
    wallet: { type: Number, default: 500 },
    bank: { type: Number, default: 0 },
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
    'fishing rod': { price: 300, desc: 'Boosts .fish rewards by 50%' },
    'pickaxe': { price: 300, desc: 'Boosts .mine rewards by 50%' },
    'shield': { price: 500, desc: 'Halves losses if someone robs you (lasts until used once)' },
};

const FISH_CATCH = [
    { name: 'old boot', value: 5 }, { name: 'small fish', value: 20 },
    { name: 'tilapia', value: 40 }, { name: 'salmon', value: 70 },
    { name: 'rare golden fish', value: 200 },
];
const MINE_CATCH = [
    { name: 'gravel', value: 5 }, { name: 'coal', value: 25 },
    { name: 'iron ore', value: 50 }, { name: 'gold ore', value: 100 },
    { name: 'diamond', value: 300 },
];

function cooldownLeft(lastDate, cooldownMs) {
    if (!lastDate) return 0;
    const elapsed = Date.now() - new Date(lastDate).getTime();
    return Math.max(0, cooldownMs - elapsed);
}

function fmtTime(ms) {
    const s = Math.ceil(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h && `${h}h`, m && `${m}m`, sec && `${sec}s`].filter(Boolean).join(' ') || '0s';
}

async function getAccount(jid) {
    return Economy.findOne({ jid });
}

async function requireAccount(jid, reply) {
    const acc = await getAccount(jid);
    if (!acc) {
        reply(error('You don\'t have an account yet. Send *.register* to open one.'));
        return null;
    }
    return acc;
}

// ── Register / Balance ──

cmd({ pattern: "register", desc: "Open a virtual bank account to start playing", category: "fun", react: "💳", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const existing = await getAccount(m.sender);
        if (existing) return reply(error('You already have an account! Check it with *.balance*.'));
        await Economy.create({ jid: m.sender });
        reply(success('💳 Account opened! You start with *500 coins* in your wallet.\n\nTry *.daily*, *.work*, *.fish*, or *.mine* to earn more.'));
    });

cmd({ pattern: "balance", alias: ["bal", "cash", "wallet"], desc: "Check your wallet and bank balance", category: "fun", react: "💰", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const items = [...acc.inventory.entries()].map(([k, v]) => `${k} x${v}`).join(', ') || 'empty';
        reply(success(`💰 *Your Balance*\n\n👛 Wallet: ${acc.wallet} coins\n🏦 Bank: ${acc.bank} coins\n🎒 Inventory: ${items}`));
    });

// ── Earning ──

cmd({ pattern: "daily", desc: "Claim your daily reward", category: "fun", react: "🎁", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const cooldown = 24 * 60 * 60 * 1000;
        const left = cooldownLeft(acc.lastDaily, cooldown);
        if (left > 0) return reply(error(`You already claimed today. Come back in ${fmtTime(left)}.`));
        const amount = 100 + Math.floor(Math.random() * 200);
        acc.wallet += amount;
        acc.lastDaily = new Date();
        await acc.save();
        reply(success(`🎁 You claimed your daily reward: *+${amount} coins*!`));
    });

const WORK_JOBS = [
    'delivered packages across town', 'fixed a leaking pipe', 'taught a coding class',
    'played guitar on the street', 'walked three dogs at once', 'painted a fence',
    'helped at a bakery', 'wrote an article',
];

cmd({ pattern: "work", desc: "Work a job shift to earn coins", category: "fun", react: "🛠️", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const cooldown = 30 * 60 * 1000;
        const left = cooldownLeft(acc.lastWork, cooldown);
        if (left > 0) return reply(error(`You're still tired from your last shift. Wait ${fmtTime(left)}.`));
        const amount = 50 + Math.floor(Math.random() * 150);
        acc.wallet += amount;
        acc.lastWork = new Date();
        await acc.save();
        reply(success(`🛠️ You ${pick(WORK_JOBS)} and earned *+${amount} coins*!`));
    });

cmd({ pattern: "beg", desc: "Beg for some pocket change", category: "fun", react: "🙏", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const cooldown = 5 * 60 * 1000;
        const left = cooldownLeft(acc.lastBeg, cooldown);
        if (left > 0) return reply(error(`Give it a rest. Try again in ${fmtTime(left)}.`));
        acc.lastBeg = new Date();
        if (Math.random() < 0.3) {
            await acc.save();
            return reply(error('😐 Nobody gave you anything this time.'));
        }
        const amount = 5 + Math.floor(Math.random() * 40);
        acc.wallet += amount;
        await acc.save();
        reply(success(`🙏 A stranger felt generous: *+${amount} coins*.`));
    });

cmd({ pattern: "fish", desc: "Go fishing to catch something valuable", category: "fun", react: "🎣", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const cooldown = 15 * 60 * 1000;
        const left = cooldownLeft(acc.lastFish, cooldown);
        if (left > 0) return reply(error(`Your line's still out. Wait ${fmtTime(left)}.`));
        const catchItem = pick(FISH_CATCH);
        const hasRod = acc.inventory.get('fishing rod') > 0;
        const value = hasRod ? Math.round(catchItem.value * 1.5) : catchItem.value;
        acc.wallet += value;
        acc.lastFish = new Date();
        await acc.save();
        reply(success(`🎣 You caught a *${catchItem.name}* and sold it for *+${value} coins*!${hasRod ? ' (fishing rod bonus applied)' : ''}`));
    });

cmd({ pattern: "mine", desc: "Go mining to find valuable ore", category: "fun", react: "⛏️", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const cooldown = 15 * 60 * 1000;
        const left = cooldownLeft(acc.lastMine, cooldown);
        if (left > 0) return reply(error(`Your pickaxe needs a rest. Wait ${fmtTime(left)}.`));
        const catchItem = pick(MINE_CATCH);
        const hasPickaxe = acc.inventory.get('pickaxe') > 0;
        const value = hasPickaxe ? Math.round(catchItem.value * 1.5) : catchItem.value;
        acc.wallet += value;
        acc.lastMine = new Date();
        await acc.save();
        reply(success(`⛏️ You mined *${catchItem.name}* and sold it for *+${value} coins*!${hasPickaxe ? ' (pickaxe bonus applied)' : ''}`));
    });

// ── Banking ──

cmd({ pattern: "deposit", desc: "Move coins from wallet to bank (safe from robbery)", category: "fun", react: "🏦", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const amount = q?.toLowerCase() === 'all' ? acc.wallet : parseInt(q);
        if (!amount || amount <= 0) return reply(error('Usage: .deposit <amount|all>'));
        if (amount > acc.wallet) return reply(error('You don\'t have that much in your wallet.'));
        acc.wallet -= amount;
        acc.bank += amount;
        await acc.save();
        reply(success(`🏦 Deposited *${amount} coins*. Bank balance: ${acc.bank}.`));
    });

cmd({ pattern: "withdraw", desc: "Move coins from bank to wallet", category: "fun", react: "🏧", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const amount = q?.toLowerCase() === 'all' ? acc.bank : parseInt(q);
        if (!amount || amount <= 0) return reply(error('Usage: .withdraw <amount|all>'));
        if (amount > acc.bank) return reply(error('You don\'t have that much in your bank.'));
        acc.bank -= amount;
        acc.wallet += amount;
        await acc.save();
        reply(success(`🏧 Withdrew *${amount} coins*. Wallet balance: ${acc.wallet}.`));
    });

cmd({ pattern: "transfer", desc: "Send coins to another registered user", category: "fun", react: "💸", filename: __filename },
    async (conn, mek, m, { reply, q, mentionedJid, quoted }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const targetJid = quoted?.sender || mentionedJid?.[0];
        const amount = parseInt(q?.replace(/@\S+/g, '').trim());
        if (!targetJid || !amount || amount <= 0) return reply(error('Usage: reply to or mention someone with .transfer <amount>'));
        if (targetJid === m.sender) return reply(error('You can\'t transfer coins to yourself.'));
        if (amount > acc.wallet) return reply(error('You don\'t have that much in your wallet.'));
        const target = await getAccount(targetJid);
        if (!target) return reply(error('That user doesn\'t have an account yet.'));
        acc.wallet -= amount;
        target.wallet += amount;
        await acc.save();
        await target.save();
        reply(success(`💸 Sent *${amount} coins* to @${targetJid.split('@')[0]}.`));
    });

// ── Rob ──

cmd({ pattern: "rob", desc: "Attempt to rob another player's wallet", category: "fun", react: "🥷", filename: __filename },
    async (conn, mek, m, { reply, mentionedJid, quoted }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const cooldown = 60 * 60 * 1000;
        const left = cooldownLeft(acc.lastRob, cooldown);
        if (left > 0) return reply(error(`Lay low for a while. Wait ${fmtTime(left)}.`));

        const targetJid = quoted?.sender || mentionedJid?.[0];
        if (!targetJid) return reply(error('Reply to or mention the person you want to rob.'));
        if (targetJid === m.sender) return reply(error('You can\'t rob yourself.'));

        const target = await getAccount(targetJid);
        if (!target) return reply(error('That user doesn\'t have an account yet.'));
        if (target.wallet < 50) return reply(error('They don\'t have enough in their wallet to be worth robbing.'));

        acc.lastRob = new Date();
        const success_ = Math.random() < 0.4;

        if (success_) {
            const stolen = Math.round(target.wallet * (0.1 + Math.random() * 0.2));
            target.wallet -= stolen;
            acc.wallet += stolen;
            await acc.save();
            await target.save();
            return reply(success(`🥷 Success! You stole *${stolen} coins* from @${targetJid.split('@')[0]}.`));
        }

        const hasShield = target.inventory.get('shield') > 0;
        let penalty = Math.round(acc.wallet * 0.15);
        if (hasShield) {
            penalty = Math.round(penalty / 2);
            target.inventory.set('shield', target.inventory.get('shield') - 1);
            await target.save();
        }
        acc.wallet = Math.max(0, acc.wallet - penalty);
        await acc.save();
        reply(error(`🚨 Caught! You paid a *${penalty} coin* fine.${hasShield ? ' (their shield reduced your target\'s exposure)' : ''}`));
    });

// ── Shop ──

cmd({ pattern: "shop", alias: ["buy"], desc: "Browse or buy items from the shop", category: "fun", react: "🛒", filename: __filename },
    async (conn, mek, m, { reply, q, command }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;

        if (command === 'shop' || !q) {
            const list = Object.entries(SHOP).map(([name, item]) => `• *${name}* — ${item.price} coins\n  ${item.desc}`).join('\n\n');
            return reply(success(`🛒 *Shop*\n\n${list}\n\nBuy with: .buy <item name>`));
        }

        const itemName = q.toLowerCase().trim();
        const item = SHOP[itemName];
        if (!item) return reply(error(`No item called "${itemName}". Check *.shop* for the list.`));
        if (acc.wallet < item.price) return reply(error(`You need ${item.price} coins for that — you have ${acc.wallet}.`));
        acc.wallet -= item.price;
        acc.inventory.set(itemName, (acc.inventory.get(itemName) || 0) + 1);
        await acc.save();
        reply(success(`🛒 Bought *${itemName}* for ${item.price} coins!`));
    });

cmd({ pattern: "inventory", alias: ["inv"], desc: "View your owned items", category: "fun", react: "🎒", filename: __filename },
    async (conn, mek, m, { reply }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const items = [...acc.inventory.entries()].filter(([, v]) => v > 0);
        if (!items.length) return reply(success('🎒 Your inventory is empty. Visit *.shop* or try *.fish*/*.mine*.'));
        reply(success(`🎒 *Your Inventory*\n\n${items.map(([k, v]) => `• ${k} x${v}`).join('\n')}`));
    });

// ── Gambling (virtual currency only) ──

cmd({ pattern: "slots", alias: ["gamble"], desc: "Bet coins on the slot machine", category: "fun", react: "🎰", filename: __filename },
    async (conn, mek, m, { reply, q }) => {
        const acc = await requireAccount(m.sender, reply);
        if (!acc) return;
        const bet = parseInt(q);
        if (!bet || bet <= 0) return reply(error('Usage: .slots <amount>'));
        if (bet > acc.wallet) return reply(error('You don\'t have that much to bet.'));

        const symbols = ['🍒', '🍋', '🔔', '⭐', '💎'];
        const spin = () => symbols[Math.floor(Math.random() * symbols.length)];
        const reels = [spin(), spin(), spin()];
        const display = reels.join(' | ');

        let winnings = 0;
        if (reels[0] === reels[1] && reels[1] === reels[2]) winnings = bet * (reels[0] === '💎' ? 10 : 5);
        else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) winnings = Math.round(bet * 1.5);

        acc.wallet += (winnings - bet);
        await acc.save();

        if (winnings > 0) reply(success(`🎰 [ ${display} ]\n\nYou won *${winnings} coins*! New balance: ${acc.wallet}`));
        else reply(error(`🎰 [ ${display} ]\n\nNo match — you lost ${bet} coins. New balance: ${acc.wallet}`));
    });
