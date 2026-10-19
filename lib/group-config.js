const config = require('../config');
const { sendImage } = require('./media');
// NOTE: Le code complet dépend de la fonction 'get' si vous voulez des messages par groupe
// const { get } = require('./database'); 

/**
 * Gère les événements de participants de groupe (ajout ou suppression).
 * @param {import('@whiskeysockets/baileys').WASocket} conn Le socket de connexion Baileys.
 * @param {import('@whiskeysockets/baileys').GroupParticipantsUpdate} update L'objet de mise à jour des participants.
 */
async function groupEvents(conn, update) {
    // Variables de configuration (Assurez-vous qu'elles existent dans config.js)
    const isWelcomeEnabled = config.WELCOME_ENABLE === 'true'; 
    const isGoodbyeEnabled = config.GOODBYE_ENABLE === 'true'; 
    
    if (!isWelcomeEnabled && !isGoodbyeEnabled) return;

    try {
        const metadata = await conn.groupMetadata(update.id);
        const groupName = metadata.subject;
        const groupJid = update.id;
        const participants = update.participants;

        for (const participantJid of participants) {
            const username = `@${participantJid.split('@')[0]}`;
            
            // 1. GESTION DU MESSAGE DE BIENVENUE (ADD)
            if (update.action === 'add' && isWelcomeEnabled) {
                
                const defaultWelcomeMsg = 
`*╭─「 WELCOME TO THE CREW 」─◇*
*│*
*│* *🌟 ɴᴇᴡ ᴍᴇᴍʙᴇʀ ᴀʀʀɪᴠᴇᴅ!*
*│* *👋 ʜᴇʟʟᴏ:* ${username}
*│* *🏰 ɢʀᴏᴜᴘ:* ${groupName}
*│* *📝 ʀᴜʟᴇs:* Please read the rules in the group description.
*│*
*╰────────────────────○*`;
                
                const welcomeText = config.WELCOME_MSG || defaultWelcomeMsg;

                const message = welcomeText
                    .replace(/@user/g, username)
                    .replace(/@group/g, groupName);

                // Envoi de l'image de bienvenue si configurée
                if (config.WELCOME_IMAGE && config.WELCOME_IMAGE.length > 5) {
                    try {
                        await sendImage(conn, groupJid, {
                            url: config.WELCOME_IMAGE,
                            caption: message,
                            contextInfo: { mentionedJid: [participantJid] },
                        });
                    } catch {
                        await conn.sendMessage(groupJid, { text: message, mentions: [participantJid] });
                    }
                } else {
                    await conn.sendMessage(groupJid, { text: message, mentions: [participantJid] });
                }
            }
            
            // 2. GESTION DU MESSAGE D'AU REVOIR (REMOVE)
            else if (update.action === 'remove' && isGoodbyeEnabled) {
                
                const defaultGoodbyeMsg = 
`*╭─「 FAREWELL LEGEND 」─◇*
*│*
*│* *😔 ᴍᴇᴍʙᴇʀ ʟᴇғᴛ ᴛʜᴇ ᴄʜᴀᴛ...*
*│* *👤 ʙʏᴇ ʙʏᴇ:* ${username}
*│* *📢 ᴍsɢ:* We hope to see you again soon!
*│*
*╰────────────────────○*`;
                
                const goodbyeText = config.GOODBYE_MSG || defaultGoodbyeMsg;

                const message = goodbyeText
                    .replace(/@user/g, username)
                    .replace(/@group/g, groupName);
                
                // Envoi de l'image d'au revoir si configurée
                if (config.GOODBYE_IMAGE && config.GOODBYE_IMAGE.length > 5) {
                    try {
                        await sendImage(conn, groupJid, {
                            url: config.GOODBYE_IMAGE,
                            caption: message,
                            contextInfo: { mentionedJid: [participantJid] },
                        });
                    } catch {
                        await conn.sendMessage(groupJid, { text: message, mentions: [participantJid] });
                    }
                } else {
                    await conn.sendMessage(groupJid, { text: message, mentions: [participantJid] });
                }
            }
        }
    } catch (e) {
        console.error("Group Events Error:", e.message);
    }
}

module.exports = {
    groupEvents
};
                                                      
