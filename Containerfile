# --- Stage 1: install dependencies ---
FROM docker.io/oven/bun:1-alpine AS install

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- Stage 2: runtime ---
FROM docker.io/oven/bun:1-alpine

WORKDIR /app

# Copy production dependencies from install stage
COPY --from=install /app/node_modules ./node_modules

# Copy application source and config
COPY package.json ./
COPY src/ ./src/
COPY entrypoint.sh ./

# Create data directory and set ownership to the built-in bun user (UID 1000)
RUN mkdir -p data && chown -R bun:bun /app

# Run as non-root. The bun user (UID/GID 1000) ships with oven/bun images.
# If your host user has a different UID, rebuild with:
#   podman build --build-arg UID=$(id -u) --build-arg GID=$(id -g) ...
# and uncomment the lines below instead of USER bun:
#   ARG UID=1000
#   ARG GID=1000
#   RUN deluser bun && delgroup bun && \
#       addgroup -g $GID app && adduser -u $UID -G app -D app
#   USER app
USER bun

VOLUME /app/data

EXPOSE 5555

ENTRYPOINT ["./entrypoint.sh"]
