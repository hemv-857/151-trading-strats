# Build stage
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Generate Prisma client
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy source and build
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Create db directory
RUN mkdir -p db

EXPOSE 3000

CMD ["bun", "server.js"]