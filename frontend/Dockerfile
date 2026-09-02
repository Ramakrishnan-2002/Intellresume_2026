FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Expose port and run server
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]