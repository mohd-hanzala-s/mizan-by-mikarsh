# ---------- Stage 1: Build the web app ----------
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json apps/web/
COPY apps/android/package.json apps/android/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/theme/package.json packages/theme/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build --filter=@mizan/web

# ---------- Stage 2: Serve with nginx ----------
FROM nginx:1.27-alpine

# Copy build output
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
