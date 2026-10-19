const axios = require('axios')
const yts = require('yt-search')
const { cmd } = require('../redx')
const { sendImage, sendVideo } = require('../lib/media')

cmd({
pattern: "videoy",
alias: ["vid","playvideo"],
desc: "Download YouTube Video (Fast)",
category: "download",
react: "🎬",
filename: __filename
},
async (conn, mek, m, { from, reply, text }) => {

try {

if (!text) {
return reply("❌ Example:\n.video pasoori")
}

/* 🔍 Search */
const search = await yts(text)

if (!search.videos.length) {
return reply("❌ No video found")
}

const vid = search.videos[0]

/* 🎨 Preview */

const caption = `
╔ஜ۩▒█ *🥰𝑴𝑶𝑵𝑨 𝑳𝑰𝑺𝑨🤭* █▒۩ஜ╗
┃🎬 VIDEO FOUND
┃📌 Title: ${vid.title}
┃⏱️ Duration: ${vid.timestamp}
┃⚡ Sending video...
╰━━━━━━━━━━━━━━⊷
`

try {
await sendImage(conn, from, { url: vid.thumbnail, caption, quoted: mek })
} catch (_) {
await conn.sendMessage(from, { text: caption }, { quoted: mek })
}

/* 🎥 API */

const api = `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(vid.url)}`

const res = await axios.get(api,{timeout:60000})

if(
!res.data ||
!res.data.status ||
!res.data.result ||
!res.data.result.download ||
!res.data.result.download.url
){
return reply("❌ Video API failed")
}

const videoUrl = res.data.result.download.url
const title = res.data.result.metadata.title || vid.title

/* 🚀 SEND VIDEO DIRECT */

await sendVideo(conn, from, {
url: videoUrl,
caption: `🎬 *${title}*\n\n> © PROGRESS TECH`,
quoted: mek,
})

}catch(err){

console.log(err)
reply("❌ Video error")

}

})
