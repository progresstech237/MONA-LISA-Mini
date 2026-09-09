const { cmd } = require('../redx');
const axios = require('axios');
const FormData = require('form-data');

let bananaSession = {};

async function uploadMedia(m) {
    try {
        const q = m.quoted? m.quoted : m;
        const mime = q.mimetype || q.msg?.mimetype || "";
        if (!/image/.test(mime)) return null;
        const media = await q.download();
        const form = new FormData();
        form.append('file', media, { filename: 'image.jpg' });
        form.append('type', 'permanent');
        const res = await axios.post('https://tmp.malvryx.dev/upload', form, {
            headers: form.getHeaders()
        });
        return res.data?.cdnUrl || res.data?.directUrl || null;
    } catch (e) {
        return null;
    }
}

// ============ NANO - Text to Image & Image Edit ============
cmd({
  pattern: "nano",
  alias: ["nana", "nanobana"],
  react: "🍌",
  desc: "Generate or edit image with Nano-Banana AI",
  category: "progresstech ai",
  use: ".nano <prompt> | reply to image.nano <prompt>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const prompt = q || m.quoted?.text || m.msg?.caption || "";
    const imageUrl = await uploadMedia(m);

    // IMAGE EDIT MODE
    if (imageUrl) {
      if (!prompt) {
        return reply(`*🍌 You want to edit an image?*\n\n*Reply to an image and type:*\n*👑.nano make it zombie 👑*`);
      }

      await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
      reply(`*🍌 Editing your image... Please wait ☺️*`);

      const { data: init } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`);

      let resultUrl = null;
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const { data: check } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result?task_id=${init.task_id}`);
        if (check.status === 'completed') {
          resultUrl = check.image_url;
          break;
        }
      }

      if (resultUrl) {
        await conn.sendMessage(from, {
          image: { url: resultUrl },
          caption: `*🍌 NANO EDIT SUCCESS 👑*\n\n*📝 Prompt: ${prompt}*\n*👑 By: MONA LISA MINI BOT 👑*`
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
      } else {
        reply(`*❌ Edit timed out. Please try again.*`);
      }
      return;
    }

    // TEXT TO IMAGE MODE
    if (!prompt) {
      return reply(`*🍌 Want to generate AI image?*\n\n*Type like this:*\n*👑.nano a cute cat 👑*\n\n*To edit an image, reply to an image and type:*\n*👑.nano make it cartoon 👑*`);
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    reply(`*🍌 Generating your image... Please wait ☺️*`);

    const { data } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana-pro?prompt=${encodeURIComponent(prompt)}`);

    if (data.image) {
      await conn.sendMessage(from, {
        image: { url: data.image },
        caption: `*🍌 NANO PRO GENERATION 👑*\n\n*📝 Prompt: ${prompt}*\n*👑 By: MONA LISA MINI BOT 👑*`
      }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } else {
      reply(`*❌ No image generated. Please try again.*`);
    }

  } catch (e) {
    console.log("NANO ERROR:", e);
    reply(`*❌ Error occurred:*\n*${e.message}*`);
  }
});

// ============ NANO PRO - Collector Mode (Multi-Image Blend) ============
cmd({
  pattern: "nanopro",
  alias: ["nanocollect", "nanoblend"],
  react: "🚀",
  desc: "Collect up to 4 images and blend them",
  category: "progresstech ai",
  use: ".nanopro (reply to image) |.nanopro done <prompt>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    const userId = m.sender;
    if (!bananaSession[userId]) bananaSession[userId] = { images: [] };

    // DONE CASE
    if (q?.toLowerCase().startsWith('done')) {
      const session = bananaSession[userId];
      const finalPrompt = q.replace(/done/i, '').trim();

      if (session.images.length < 2) {
        return reply(`*⚠️ Please add at least 2 images.*\n*Currently: ${session.images.length}/4*`);
      }
      if (!finalPrompt) {
        return reply(`*📝 Please provide a prompt as well.*\n*👑.nanopro done make them together 👑*`);
      }

      await conn.sendMessage(from, { react: { text: "🕒", key: mek.key } });
      reply(`*🍌 Blending ${session.images.length} images...*\n*📝 Prompt: ${finalPrompt}*`);

      let apiUrl = `https://omegatech-api.dixonomega.tech/api/ai/nanobana-pro-v3?prompt=${encodeURIComponent(finalPrompt)}`;
      session.images.forEach((url, i) => {
        apiUrl += `&image${i + 1}=${encodeURIComponent(url)}`;
      });

      const { data: initRes } = await axios.get(apiUrl);
      if (!initRes.success) throw new Error('API failed to initiate blend.');

      const taskId = initRes.task_id;
      let resultUrl = null;
      let attempts = 0;

      while (!resultUrl && attempts < 25) {
        await new Promise(r => setTimeout(r, 5000));
        const { data: check } = await axios.get(`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result?task_id=${taskId}`);
        if (check.status === 'completed' && check.image_url) {
          resultUrl = check.image_url;
          break;
        }
        if (check.status === 'failed') throw new Error('Server reported generation failure.');
        attempts++;
      }

      if (!resultUrl) throw new Error('Generation timed out.');

      await conn.sendMessage(from, {
        image: { url: resultUrl },
        caption: `*🍌 NANO-BANANA PRO SUCCESS 👑*\n\n*🖼️ Images Blended: ${session.images.length}*\n*📝 Prompt: ${finalPrompt}*\n*👑 By: MONA LISA MINI BOT 👑*`
      }, { quoted: mek });

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
      delete bananaSession[userId];
      return;
    }

    // COLLECT IMAGE CASE
    const link = await uploadMedia(m);
    if (!link) {
      return reply(`*📸 COLLECTOR MODE ON*\n\n*Reply to an image with 👑.nanopro 👑 or send image with caption.nanopro*\n\n*When done, type:*\n*👑.nanopro done your prompt 👑*\n\n*Currently: ${bananaSession[userId].images.length}/4 images*`);
    }

    if (bananaSession[userId].images.length >= 4) {
      return reply(`*❌ Maximum 4 images limit reached.*\n*Now type:*\n*👑.nanopro done <prompt> 👑*`);
    }

    bananaSession[userId].images.push(link);
    await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
    reply(`*✅ Image ${bananaSession[userId].images.length}/4 Added*\n\n*Send another image or type:*\n*👑.nanopro done <prompt> 👑*`);

  } catch (e) {
    console.log("NANOPRO ERROR:", e);
    reply(`*❌ Error: ${e.message}*`);
    delete bananaSession[m.sender];
  }
});