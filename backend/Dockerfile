# Base stage
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_node_modules && \
    npm ci

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage (if you have build step)
FROM dependencies AS build
COPY . .
RUN npm run build || echo "No build step"

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=dependencies /prod_node_modules ./node_modules
COPY . .
EXPOSE 3001
USER node
CMD ["npm", "start"]
