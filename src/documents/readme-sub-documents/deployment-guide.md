# 🚀 Deployment Guide

Complete deployment instructions for **ReactJS Redux Toolkit Example** application, covering Vercel deployment and local development setup.

---

## 📋 Table of Contents

- [🌐 Vercel Deployment](#-vercel-deployment)
- [🐳 Docker Deployment](#-docker-deployment)
- [⚙️ Environment Variables](#️-environment-variables)
- [🔧 Build Configuration](#-build-configuration)
- [🚨 Troubleshooting](#-troubleshooting)

---

## 🌐 Vercel Deployment

### Quick Deploy (Recommended)

The fastest way to deploy your application to Vercel:

#### 1️⃣ **Connect Repository**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from repository root
vercel

# Follow the interactive prompts:
# ? Set up and deploy "~/reactjs-redux-thunk-example"? [Y/n] y
# ? Which scope do you want to deploy to? Your Account
# ? Link to existing project? [y/N] n
# ? What's your project's name? events-portfolio
# ? In which directory is your code located? ./
```

#### 2️⃣ **Configure Build Settings**

Vercel automatically detects Vite projects. Verify these settings in your dashboard:

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`
- **Development Command**: `npm run dev`

#### 3️⃣ **Environment Variables**

Add these in your Vercel dashboard under **Settings → Environment Variables**:

```bash
# Required Variables
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_URL=https://your-vercel-app.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Optional Variables
VITE_APP_NAME="Events Portfolio"
VITE_APP_DESCRIPTION="Modern event booking platform"
```

### Manual Configuration

#### **vercel.json Configuration**

The project includes a pre-configured `vercel.json` file:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### **Custom Domains**

1. Go to your project dashboard
2. Navigate to **Settings → Domains**
3. Add your custom domain
4. Update `VITE_APP_URL` environment variable

#### **Preview Deployments**

Every push to a branch creates a preview deployment:

- **Production**: `main` branch → `your-app.vercel.app`
- **Preview**: Feature branches → `your-app-git-branch.vercel.app`

---

## 🐳 Docker Deployment

### Using the Docker Setup Script

The project includes a comprehensive Docker setup script:

#### 1️⃣ **Development Environment**

```bash
# Start development environment with hot reload
./docker-setup.sh dev

# View logs
./docker-setup.sh logs

# Application available at: http://localhost:3000
```

#### 2️⃣ **Production Environment**

```bash
# Build and start production environment
./docker-setup.sh prod

# Application available at: http://localhost:80
```

#### 3️⃣ **Docker Compose (Recommended)**

```bash
# Build all images
./docker-setup.sh build

# Start all services
./docker-setup.sh start

# View service status
docker-compose ps

# Stop all services
./docker-setup.sh stop
```

### Manual Docker Commands

#### **Development Build**

```bash
# Build development image
docker build -f Dockerfile.dev -t events-app:dev .

# Run development container
docker run -p 3000:3000 -v $(pwd):/app events-app:dev
```

#### **Production Build**

```bash
# Build production image
docker build -t events-app:latest .

# Run production container
docker run -p 80:80 events-app:latest
```

### Docker Configuration Files

#### **Dockerfile (Production)**

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **Dockerfile.dev (Development)**

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

#### **docker-compose.yml**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=http://localhost:3060
      - VITE_APP_URL=http://localhost:3000
    depends_on:
      - nginx

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
```

### Container Registry Deployment

#### **Docker Hub**

```bash
# Tag for Docker Hub
docker tag events-app:latest username/events-app:latest

# Push to Docker Hub
docker push username/events-app:latest

# Deploy on server
docker pull username/events-app:latest
docker run -p 80:80 username/events-app:latest
```

#### **AWS ECR**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account-id.dkr.ecr.us-east-1.amazonaws.com

# Tag for ECR
docker tag events-app:latest account-id.dkr.ecr.us-east-1.amazonaws.com/events-app:latest

# Push to ECR
docker push account-id.dkr.ecr.us-east-1.amazonaws.com/events-app:latest
```

---

## ⚙️ Environment Variables

### Required Variables

| Variable                      | Description                    | Example                      |
| ----------------------------- | ------------------------------ | ---------------------------- |
| `VITE_API_BASE_URL`           | Backend API endpoint           | `https://api.yourdomain.com` |
| `VITE_APP_URL`                | Frontend application URL       | `https://app.yourdomain.com` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key for payments | `pk_test_...`                |

### Optional Variables

| Variable                | Description               | Default                           |
| ----------------------- | ------------------------- | --------------------------------- |
| `VITE_APP_NAME`         | Application name          | `"Events Portfolio"`              |
| `VITE_APP_DESCRIPTION`  | Application description   | `"Modern event booking platform"` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false`                           |

### Environment Files

#### **.env.example**

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3060
VITE_APP_URL=http://localhost:3061

# Payment Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here

# Application Configuration
VITE_APP_NAME="Events Portfolio"
VITE_APP_DESCRIPTION="Modern event booking platform"

# Optional Features
VITE_ENABLE_ANALYTICS=false
```

#### **.env.docker.example**

```bash
# Docker-specific environment variables
VITE_API_BASE_URL=http://localhost:3060
VITE_APP_URL=http://localhost:3000

# Same payment and app config as above
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
VITE_APP_NAME="Events Portfolio"
VITE_APP_DESCRIPTION="Modern event booking platform"
```

---

## 🔧 Build Configuration

### Vite Configuration

The `vite.config.ts` is optimized for both development and production:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3061,
    host: true, // Enable network access
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@reduxjs/toolkit'],
  },
})
```

### Nginx Configuration

Production-ready Nginx configuration for SPA routing:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Enable long-term caching for static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Handle SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
}
```

---

## 🚨 Troubleshooting

### Common Vercel Issues

#### **Build Failures**

```bash
# Issue: Node.js version mismatch
# Solution: Specify Node.js version in package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### **Environment Variables Not Loading**

```bash
# Issue: Variables not prefixed with VITE_
# Solution: Ensure all client-side variables start with VITE_
VITE_API_BASE_URL=https://api.example.com  ✅
API_BASE_URL=https://api.example.com       ❌
```

#### **Routing Issues**

```bash
# Issue: 404 on page refresh
# Solution: Verify vercel.json rewrites configuration
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Common Docker Issues

#### **Container Won't Start**

```bash
# Check container logs
docker logs container-name

# Common issue: Port already in use
# Solution: Use different port or stop conflicting service
docker run -p 3001:3000 events-app:dev
```

#### **Build Context Too Large**

```bash
# Issue: Large node_modules in build context
# Solution: Use .dockerignore file
echo "node_modules" >> .dockerignore
echo "dist" >> .dockerignore
echo ".git" >> .dockerignore
```

#### **Hot Reload Not Working**

```bash
# Issue: File changes not detected in Docker
# Solution: Use polling for file watching
# Add to vite.config.ts:
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
    },
  },
})
```

### Performance Optimization

#### **Bundle Size Analysis**

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Optimize imports
import { Button } from './components/ui/button'  ✅
import * from './components/ui'                  ❌
```

#### **Memory Issues in Docker**

```bash
# Increase memory limit for Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Use multi-stage builds to reduce image size
FROM node:18-alpine AS builder
# ... build steps
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
```

### Monitoring and Debugging

#### **Production Monitoring**

```typescript
// Add error tracking
window.addEventListener('error', event => {
  console.error('Global error:', event.error)
  // Send to monitoring service
})

// Performance monitoring
window.addEventListener('load', () => {
  const loadTime = performance.now()
  console.log(`Page loaded in ${loadTime}ms`)
})
```

#### **Docker Health Checks**

```dockerfile
# Add health check to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
```

---

## 📞 Additional Support

### Documentation Links

- **[Vercel Documentation](https://vercel.com/docs)**
- **[Docker Documentation](https://docs.docker.com/)**
- **[Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)**

### Project-Specific Resources

- **[Environment Configuration](../config/env.ts)** - Environment variable handling
- **[API Integration](../../services/api/)** - Backend API connection
- **[Build Scripts](../../../package.json)** - npm scripts and commands

---

_For additional deployment questions or custom setup requirements, refer to the main project documentation or create an issue in the repository._
