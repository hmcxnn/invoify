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

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY --from=build --chown=1001:1001 /app /app
USER 1001
EXPOSE 3000
CMD ["npm","start"]

