# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder /app/.output /app/.output

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Set ownership
RUN chown -R nuxtjs:nodejs /app

USER nuxtjs

# Expose port (can be overridden at runtime via PORT env var)
EXPOSE 3000

# Set environment variables (PORT can be overridden at runtime)
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Start the application
CMD ["node", ".output/server/index.mjs"]
