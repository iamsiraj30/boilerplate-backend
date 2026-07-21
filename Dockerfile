# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./
COPY prisma ./prisma/

# Configure environment for resilient Prisma engine binaries download
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Install dependencies
RUN npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# Copy application source code
COPY . .

# Generate Prisma Client & build the project
RUN npx prisma generate
RUN npm run build

# Prune devDependencies for production runtime
RUN npm prune --production

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts & dependencies from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Run as non-root node user for security
USER node

# Start production server
CMD ["node", "dist/main"]
