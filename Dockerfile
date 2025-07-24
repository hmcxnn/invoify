# ------- build stage -------
FROM node:22-alpine3.19 AS build

WORKDIR /app

# Puppeteer / Chromium 运行时依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    gcompat

ENV NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && echo '{}' > .next/server/font-manifest.json
RUN npm prune --production && npm cache clean --force

# ------- runtime stage -------
FROM node:22-alpine3.19 AS production

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont udev gcompat

# 创建非 root 用户
RUN addgroup -S nextjs -g 1001 && adduser -S nextjs -u 1001 -G nextjs

# 👇 关键：给 nextjs 一个 HOME 并准备 Crashpad 目录
RUN mkdir -p /home/nextjs/.config/chromium/Crashpad \
    && chown -R nextjs:nextjs /home/nextjs

ENV HOME=/home/nextjs \
    XDG_CONFIG_HOME=/home/nextjs/.config \
    XDG_CACHE_HOME=/home/nextjs/.cache \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

WORKDIR /app
COPY --from=build --chown=nextjs:nextjs /app .

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]

