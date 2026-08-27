FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Expose port and run dev server
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]