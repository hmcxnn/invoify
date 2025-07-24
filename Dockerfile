# -------- build stage --------
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies needed for Puppeteer during build
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    font-noto-cjk \
    wqy-zenhei \
    ttf-dejavu \
    fontconfig

# Configure font cache
RUN fc-cache -fv

# Disable Next.js telemetry and configure Puppeteer
ENV NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Create missing font-manifest.json file that Next.js expects
RUN echo '{}' > .next/server/font-manifest.json

# Clean up and keep only production dependencies
RUN npm prune --production && npm cache clean --force


# -------- runtime stage --------
FROM node:22-alpine AS production

# Install runtime dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    font-noto-cjk \
    wqy-zenhei \
    ttf-dejavu \
    fontconfig

# Configure font cache for runtime
RUN fc-cache -fv

# Create non‑root user and give it a writable HOME + Crashpad dir
RUN addgroup -S nextjs -g 1001 \
 && adduser -S nextjs -u 1001 -G nextjs \
 && mkdir -p /home/nextjs/.config/chromium/Crashpad \
 && chown -R nextjs:nextjs /home/nextjs

# Set environment variables, incl. Crashpad‑related ones
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    HOME=/home/nextjs \
    XDG_CONFIG_HOME=/home/nextjs/.config \
    XDG_CACHE_HOME=/home/nextjs/.cache

WORKDIR /app

COPY --from=build --chown=nextjs:nextjs /app/.next ./.next
COPY --from=build --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nextjs /app/package.json ./package.json
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
