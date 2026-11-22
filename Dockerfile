# ez standard Dockerfile: a build stage for the frontend bundle, then an Alpine
# runtime that runs as the unprivileged `bun` user (uid 1000) with a wget
# healthcheck. Keep the Bun version in step with `bun-version` in .github/workflows.

# ---- build: frontend bundle ----
FROM oven/bun:1.4.5-alpine AS build
ARG APP_BRANCH=master
ENV APP_BRANCH=$APP_BRANCH
WORKDIR /app
COPY client/package.json client/bun.lock ./client/
RUN cd client && bun install --frozen-lockfile
COPY package.json ./
COPY client ./client
RUN cd client && bun run build

# ---- runtime ----
FROM oven/bun:1.4.5-alpine
ARG APP_VERSION=dev
LABEL org.opencontainers.image.title="ezups" \
	org.opencontainers.image.source="https://github.com/c4lyp5o/ezups" \
	org.opencontainers.image.licenses="MIT" \
	org.opencontainers.image.version="$APP_VERSION"
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kuala_Lumpur \
	NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=5000 \
	DATA_DIR=/data
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile --ignore-scripts
COPY server.js config.js ./
COPY controllers ./controllers
COPY database ./database
COPY middlewares ./middlewares
COPY routes ./routes
COPY utils ./utils
COPY --from=build /app/public ./public
RUN mkdir -p /data /data/uploads /data/logs && chown -R bun:bun /data /data/uploads /data/logs
USER bun
VOLUME ["/data"]
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --start-interval=2s --retries=3 \
	CMD wget -qO- "http://127.0.0.1:${PORT}/api/v1/healthcheck" >/dev/null || exit 1
CMD ["bun", "start"]
