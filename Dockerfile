# ------- build stage -------
FROM node:22-alpine3.19 AS build

WORKDIR /app

# Puppeteer / Chromium 运行时依赖
# 添加了更多 Chromium 可能需要的库以增强兼容性
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    gcompat \
    libx11 \
    gtk+3.0 \
    alsa-lib

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

# 添加了更多 Chromium 可能需要的库以增强兼容性
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    gcompat \
    libx11 \
    gtk+3.0 \
    alsa-lib

# 创建非 root 用户
RUN addgroup -S nextjs -g 1001 && adduser -S nextjs -u 1001 -G nextjs

# 👇 关键：创建一个专门的 Chromium 用户数据目录
RUN mkdir -p /home/nextjs/chromium-data \
    && chown -R nextjs:nextjs /home/nextjs

ENV HOME=/home/nextjs \
    # 移除了 XDG_* 环境变量，因为将在代码中直接指定 userDataDir
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

WORKDIR /app
COPY --from=build --chown=nextjs:nextjs /app .

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
