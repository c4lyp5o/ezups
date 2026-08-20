# Stage 1: Build the client (Vite -> ../public, the path Elysia serves)
FROM oven/bun:1.2.13-alpine AS builder

WORKDIR /app

# Root deps (Elysia backends only; the client has its own package.json)
COPY package.json bun.lock ./
RUN bun install

# Build the client separately; vite.config outputs to ../public
COPY client ./client
WORKDIR /app/client
RUN bun install && bun run build

# Stage 2: Production runtime
FROM oven/bun:1.2.13-alpine

RUN apk update --no-cache && \
    apk add --no-cache curl tzdata

ENV TZ=Asia/Kuala_Lumpur
WORKDIR /app

# Production-only backend deps
COPY package.json bun.lock ./
RUN bun install --production

# Backend source + built client (everything else is excluded via .dockerignore)
COPY . .
COPY --from=builder /app/public /app/public

# Daily purge script (bun:sqlite keeps its own cleanup; this is the fs sweep)
COPY utils/purge.sh /etc/periodic/daily/purge.sh
RUN chmod +x /etc/periodic/daily/purge.sh

EXPOSE 5000

# localAuth only admits loopback; Docker's probe hits 127.0.0.1 so this passes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/api/v1/healthcheck || exit 1

CMD ["bun", "start"]