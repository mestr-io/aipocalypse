# --- Stage 1: install dependencies ---
FROM oven/bun:1-alpine AS install

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- Stage 2: runtime ---
FROM oven/bun:1-alpine

WORKDIR /app

# Copy production dependencies from install stage
COPY --from=install /app/node_modules ./node_modules

# Copy application source and config
COPY package.json ./
COPY src/ ./src/
COPY docker-entrypoint.sh ./

# Create data directory for SQLite
RUN mkdir -p data

VOLUME /app/data

EXPOSE 5555

ENTRYPOINT ["./docker-entrypoint.sh"]
