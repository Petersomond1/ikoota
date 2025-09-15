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
ARG ENVIRONMENT=staging

# Set environment variables for build
ENV NODE_ENV=production

# Set API URL based on environment directly as build-time env var
RUN echo "🔧 Building with ENVIRONMENT=$ENVIRONMENT" && \
    if [ "$ENVIRONMENT" = "production" ]; then \
        echo "VITE_API_URL=https://api.ikoota.com:8443/api" > .env.local; \
        echo "REACT_APP_USE_MOCK_DATA=false" >> .env.local; \
        echo "🔧 Production environment variables set:"; \
        cat .env.local; \
    else \
        echo "VITE_API_URL=http://localhost:3000/api" > .env.local; \
        echo "REACT_APP_USE_MOCK_DATA=false" >> .env.local; \
        echo "🔧 Development environment variables set:"; \
        cat .env.local; \
    fi

# Build the React app (Vite will pick up .env.local)
RUN echo "🔧 Starting build process..." && npm run build

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