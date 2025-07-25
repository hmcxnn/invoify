# ------- build stage -------
FROM node:22-alpine3.19 AS build

WORKDIR /app

# 使用中国镜像源加速包管理器
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Puppeteer / Chromium 运行时依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu \
    ttf-droid \
    ttf-liberation \
    udev \
    gcompat \
    font-noto \
    font-noto-cjk \
    fontconfig

ENV NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
# 使用国内 npm 镜像
RUN npm config set registry https://registry.npmmirror.com && npm ci
COPY . .
RUN npm run build && echo '{}' > .next/server/font-manifest.json
RUN npm prune --production && npm cache clean --force

# ------- runtime stage -------
FROM node:22-alpine3.19 AS production

# 使用中国镜像源加速包管理器
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ttf-dejavu \
    ttf-droid \
    ttf-liberation \
    udev \
    gcompat \
    font-noto \
    font-noto-cjk \
    fontconfig

# 创建非 root 用户
RUN addgroup -S nextjs -g 1001 && adduser -S nextjs -u 1001 -G nextjs

# 👇 关键：给 nextjs 一个 HOME 并准备 Crashpad 目录
RUN mkdir -p /home/nextjs/.config/chromium/Crashpad \
    && mkdir -p /home/nextjs/.cache \
    && mkdir -p /home/nextjs/.local/share/fonts \
    && chown -R nextjs:nextjs /home/nextjs

# 配置字体缓存
RUN fc-cache -fv

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

