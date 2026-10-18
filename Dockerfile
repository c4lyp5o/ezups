# Stage 1: Build the client (Vite -> ../public, the path Elysia serves)
FROM oven/bun:1.2.13-alpine AS builder
ARG APP_BRANCH=development
ENV APP_BRANCH=$APP_BRANCH

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

# Daily purge at 01:00 (container tz = Asia/Kuala_Lumpur). The endpoint is
# loopback-gated; running inside the container, curl originates on 127.0.0.1.
RUN printf '%s\n' '0 1 * * * curl -fsS -X DELETE http://127.0.0.1:5000/api/v1/purge >/dev/null 2>&1' > /etc/crontabs/root

EXPOSE 5000

# localAuth only admits loopback; Docker's probe hits 127.0.0.1 so this passes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:5000/api/v1/healthcheck || exit 1

CMD ["sh", "-c", "crond && exec bun start"]