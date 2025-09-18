# Multi-stage build for React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for environment (passed from deploy.yml)
ARG ENVIRONMENT=production

# Set environment for Vite (will automatically use .env.production)
ENV NODE_ENV=production

# Debug: Show build environment
RUN echo "🔧 Building with ENVIRONMENT=$ENVIRONMENT"
RUN echo "🔧 NODE_ENV=$NODE_ENV"
RUN ls -la .env* || echo "No .env files found"

# Build the application (Vite will use .env.production automatically)
RUN npm run build

# Verify build output
RUN ls -la dist/
RUN echo "✅ Build completed successfully"

# Production stage with nginx
FROM nginx:alpine

# Build argument for environment
ARG ENVIRONMENT=production

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy appropriate nginx configuration based on environment
COPY nginx*.conf /tmp/
RUN if [ "$ENVIRONMENT" = "production" ]; then \
      cp /tmp/nginx.prod.conf /etc/nginx/conf.d/default.conf; \
    else \
      cp /tmp/nginx.conf /etc/nginx/conf.d/default.conf; \
    fi

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]