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

# Build the React app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Build argument for environment
ARG ENVIRONMENT=staging

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