# Base stage
FROM node:18-alpine AS base
WORKDIR /app
# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
# Use --legacy-peer-deps to handle React 19 and other peer dependency conflicts
RUN npm install --force

# Development stage
FROM dependencies AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
