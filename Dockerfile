FROM node:22-slim

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies including build tools
RUN npm install

# Copy application source
COPY . .

# Set production environment and build
ENV NODE_ENV=production
RUN npm run build

# Cloud Run default port is 8080
ENV PORT=8080
EXPOSE 8080

# Start compiled CommonJS production server
CMD ["node", "dist/server.cjs"]
