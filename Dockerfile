# Use official Node.js 22 LTS on Alpine Linux
FROM node:22-alpine

WORKDIR /app

# Install build tools for native compilation if required
RUN apk add --no-cache python3 make g++

# Copy dependency manifests first for Docker caching
COPY package.json package-lock.json ./

# Install all dependencies (including Vite build tooling)
RUN npm ci

# Copy application source code
COPY . .

# Build the production React SPA into dist/
RUN npm run build

# Expose API and frontend HTTP port
EXPOSE 4000

# Persistent volume for uploaded documents and SQLite fallback data
VOLUME ["/app/data"]

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Start SocietyOS application server
CMD ["node", "--experimental-strip-types", "app.js"]
