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

# Set base environment variables
ENV NODE_ENV=production

# Set Vite environment variables directly as ENV (not .env file)
RUN echo "🔧 Building with ENVIRONMENT=$ENVIRONMENT"

# Set environment variables for Vite build based on ENVIRONMENT
RUN if [ "$ENVIRONMENT" = "production" ]; then \
        echo "🔧 Building for production with API URL: /api (nginx proxy)"; \
        env VITE_API_URL="/api" REACT_APP_USE_MOCK_DATA="false" npm run build; \
    else \
        echo "🔧 Building for development with API URL: http://localhost:3000/api"; \
        env VITE_API_URL="http://localhost:3000/api" REACT_APP_USE_MOCK_DATA="false" npm run build; \
    fi

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