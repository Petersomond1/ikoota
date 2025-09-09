# Use official Node.js runtime as base image
FROM node:18-alpine

# Install Python and build dependencies for canvas
RUN apk add --no-cache \
    python3 \
    py3-pip \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    g++ \
    make

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all source code
COPY . .

# Create models directory for TensorFlow models
RUN mkdir -p models/face models/posenet models/avatar-gan

# Expose the port your app runs on
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Command to run your app (use node directly, not nodemon)
CMD ["node", "server.js"]