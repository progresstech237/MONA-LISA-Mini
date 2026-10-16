# 🥰 MONA LISA 🤭 — container image (works on Render, Fly.io, Oracle/any VPS with Docker, etc.)
FROM node:20-slim

# git + ca-certificates: some Baileys releases pull a dependency straight from
# GitHub during `npm install`, which fails without git. Harmless if unused.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
# Most hosts inject PORT themselves; this is only the fallback.
ENV PORT=8000
EXPOSE 8000

CMD ["node", "index.js"]
