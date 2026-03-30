FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
# Copy workspace root and shared package for workspace resolution
COPY package.json package-lock.json ./
COPY src/shared/ ./src/shared/
COPY src/api/package.json ./src/api/
RUN npm ci -w src/api --omit=dev

FROM base AS build
COPY package.json package-lock.json ./
COPY src/shared/ ./src/shared/
COPY src/api/package.json ./src/api/
RUN npm ci -w src/api
COPY src/api/tsconfig.json ./src/api/
COPY src/api/src/ ./src/api/src/
RUN npm run build -w src/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/shared ./src/shared
COPY --from=deps /app/src/api/node_modules ./src/api/node_modules
COPY --from=build /app/src/api/dist ./src/api/dist
COPY --from=build /app/src/api/package.json ./src/api/
WORKDIR /app/src/api
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]
