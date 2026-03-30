FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY src/shared/ ./src/shared/
COPY src/web/package.json ./src/web/
RUN npm ci -w src/web

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared ./src/shared
COPY --from=deps /app/src/web/node_modules ./src/web/node_modules
COPY package.json ./
COPY src/web/ ./src/web/
RUN npm run build -w src/web

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/src/web/public ./src/web/public
COPY --from=builder --chown=nextjs:nodejs /app/src/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/src/web/.next/static ./src/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "src/web/server.js"]
