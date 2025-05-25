# app_api/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Create data directory for persisting users
RUN mkdir -p /app/data

COPY package.json ./
COPY package-lock.json ./
# Use npm ci for clean installs
RUN npm ci --production
COPY . .
EXPOSE 8000
# Explicitly run node as a command array
CMD ["node", "src/server.js"]