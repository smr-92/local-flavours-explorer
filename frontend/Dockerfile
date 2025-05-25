# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
# Install dependencies. Use a separate step for npm ci if package-lock is present.
# RUN npm install # Might be better to use npm ci for consistent installs with package-lock.json
RUN npm ci # Use npm ci for clean installs based on package-lock.json
COPY . .
EXPOSE 3000
# Explicitly run npm as a command array for better Docker compatibility
CMD ["npm", "run", "dev"]