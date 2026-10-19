const { cmd } = require('../redx');

cmd({
    pattern: "online",
    alias: ["whosonline", "onlinemembers"],
    desc: "Check who's online in the group (Admins & Owner only)",
    category: "main",
    react: "🟢",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isCreator, fromMe, reply }) => {
    try {
        if (!isGroup) return reply("*THIS COMMAND IS ONLY FOR GROUPS 😊*");
        if (!isCreator && !isAdmins && !fromMe) {
            return reply("*THIS COMMAND IS ONLY FOR MY OWNER 😎 AND GROUP ADMINS CAN ALSO USE THIS COMMAND 😍❣️*");
        }

        await reply("*PREPARING THE LIST OF ONLINE MEMBERS 😊*\n*PLEASE WAIT A MOMENT...😊*");

        const onlineMembers = new Set();
        const groupData = await conn.groupMetadata(from);
        const participants = groupData.participants || [];

        await Promise.all(participants.map((p) =>
            conn.presenceSubscribe(p.id).catch(() => {})
        ));

        const presenceHandler = (json) => {
            for (const id in json.presences) {
                const presence = json.presences[id]?.lastKnownPresence;
                if (['available', 'composing', 'recording', 'online'].includes(presence)) {
                    onlineMembers.add(id);
                }
            }
        };

        conn.ev.on('presence.update', presenceHandler);

        await new Promise((resolve) => setTimeout(resolve, 8000));

        conn.ev.off('presence.update', presenceHandler);

        if (onlineMembers.size === 0) {
            return reply("⚠️ Couldn't detect any online members. They might be hiding their presence.");
        }

        const onlineArray = Array.from(onlineMembers);
        const onlineList = onlineArray.map((member, index) =>
            `${index + 1}. @${member.split('@')[0]}`
        ).join('\n');

        await conn.sendMessage(from, {
            text: `*👑 ONLINE MEMBERS LIST 👑* (${onlineArray.length}/${participants.length}):\n\n${onlineList}`,
            mentions: onlineArray
        }, { quoted: mek });
    } catch (e) {
        console.error("Error in online command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
