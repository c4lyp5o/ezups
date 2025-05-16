# Stage 1: Build Stage (client build)
FROM oven/bun:1.2.13-alpine AS builder

WORKDIR /app

# Install root dependencies (Express etc.)
COPY package*.json ./
RUN bun install

# Copy client separately and install client dependencies + build
COPY client ./client
WORKDIR /app/client
RUN bun install && bun run build

# Move built files to /app/public in the builder stage
RUN mkdir -p /app/public && mv ../public/* /app/public/

# Return to root app dir
WORKDIR /app

# Stage 2: Production Stage
FROM oven/bun:1.2.13-alpine

# Install for alpine
RUN apk update --no-cache && \
    apk add --no-cache curl tzdata

# Set timezone data
ENV TZ=Asia/Kuala_Lumpur

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN bun install --production

# Copy backend source code (everything except what's ignored)
COPY . .

# Copy built public files from builder
COPY --from=builder /app/public /app/public

# Copy purge script
COPY /utils/purge.sh /etc/periodic/daily/purge.sh

# Set permissions for the purge script
RUN chmod +x /etc/periodic/daily/purge.sh

# Expose your server port
EXPOSE 5000

# Add a health check to ensure the container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/healthcheck || exit 1

# Start your app
CMD ["bun", "start"]